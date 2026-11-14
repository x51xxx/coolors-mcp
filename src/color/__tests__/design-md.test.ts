import { describe, expect, it } from "vitest";

import { parseColor } from "../conversions.js";
import {
  auditDesignMd,
  extractDesignMdTokens,
  formatDesignMdAudit,
} from "../design-md.js";
import { getContrastRatio } from "../utils.js";

// Synthetic fixture (not a real brand): exercises every audit path.
const FIXTURE = `---
version: alpha
name: Test Kiln
colors:
  primary: "#cc785c"
  on-primary: "#ffffff"
  ink: "#141413"
  muted-soft: "#8e8b82"
  canvas: "#faf9f5"
  hairline: "#e6dfd8"
  primary-disabled: "#e6dfd8"
  link: "{colors.primary}"
  broken: "{colors.nope}"
  fancy: "hwb(200 10% 10%)"
  glass: "#ffffff80"
  unquoted: #123456
  success: "#5db872"
  error: "#c64545"
  surface-dark: "#181715"
  on-dark: "#faf9f5"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.primary-disabled}"
    textColor: "{colors.muted-soft}"
---

# Test Kiln

## Colors

Warm terracotta primary on an ivory canvas.
`;

describe("extractDesignMdTokens", () => {
  it("merges front matter with ```yaml blocks and rejects duplicate keys", () => {
    const md = `---
name: X
colors:
  primary: "#000000"
---

## Typography

\`\`\`yaml
typography:
  body-md:
    fontSize: 16px
\`\`\`

\`\`\`yaml
colors:
  primary: "#ffffff"
\`\`\`
`;
    const { errors, tree } = extractDesignMdTokens(md);
    expect(tree.typography).toBeDefined();
    expect((tree.colors as Record<string, string>).primary).toBe("#000000");
    expect(errors.join(" ")).toMatch(/`colors` is defined more than once/);
  });
});

describe("auditDesignMd", () => {
  const audit = auditDesignMd(FIXTURE);

  it("flags declared component pairs below 4.5:1 with a verified fix", () => {
    const pair = audit.pairs.find(
      (p) => p.foreground.token === "on-primary" && p.source === "declared",
    )!;
    expect(pair.background.token).toBe("primary");
    expect(pair.ratio).toBeCloseTo(3.28, 2);
    expect(pair.passes).toBe(false);
    expect(pair.suggestion).toBeDefined();
    const fixed = parseColor(pair.suggestion!.foreground)!;
    expect(
      getContrastRatio(fixed, parseColor("#cc785c")!),
    ).toBeGreaterThanOrEqual(4.5);
  });

  it("infers text-on-surface pairs from token names", () => {
    const pair = audit.pairs.find(
      (p) =>
        p.foreground.token === "muted-soft" && p.background.token === "canvas",
    )!;
    expect(pair.source).toBe("inferred");
    expect(pair.ratio).toBeCloseTo(3.23, 2);
    expect(pair.passes).toBe(false);
  });

  it("pairs on-dark text with *-dark surfaces only", () => {
    const pair = audit.pairs.find((p) => p.foreground.token === "on-dark")!;
    expect(pair.background.token).toBe("surface-dark");
    expect(
      audit.pairs.some(
        (p) =>
          p.foreground.token === "ink" && p.background.token === "surface-dark",
      ),
    ).toBe(false);
  });

  it("treats disabled components as exempt (WCAG 1.4.3)", () => {
    const pair = audit.pairs.find(
      (p) => p.origin === "components.button-primary-disabled",
    )!;
    expect(pair.role).toBe("exempt");
    expect(pair.passes).toBe(true);
  });

  it("reports duplicates but not intentional {colors.x} aliases", () => {
    expect(audit.duplicates).toContainEqual({
      hex: "#e6dfd8",
      tokens: ["hairline", "primary-disabled"],
    });
    expect(audit.duplicates.some((d) => d.tokens.includes("link"))).toBe(false);
  });

  it("reports spec errors and never guesses unsupported values", () => {
    expect(audit.errors.join("\n")).toMatch(
      /broken reference \{colors\.nope\}/,
    );
    const reasons = Object.fromEntries(
      audit.notAudited.map((n) => [n.token, n.reason]),
    );
    expect(reasons.fancy).toMatch(/hwb\(\)/);
    expect(reasons.unquoted).toMatch(/YAML comment/);
    expect(audit.notes.join("\n")).toMatch(/colors\.glass has alpha 0\.5/);
  });

  it("flags missing primary", () => {
    const a = auditDesignMd(`---\nname: X\ncolors:\n  ink: "#000000"\n---\n`);
    expect(a.errors.join("\n")).toMatch(/`colors\.primary` is required/);
  });

  it("finds color-blind collisions across families, not between shades", () => {
    expect(audit.cvdCollisions.length).toBeGreaterThan(0);
    const md = `---
name: X
colors:
  primary: "#1f6feb"
  primary-deep: "#1a5fd0"
  accent-teal: "#5db8a6"
  accent-green: "#5db872"
  chart-1: "#d62728"
  chart-2: "#2ca02c"
  error: "#c64545"
  error-soft: "#d96a6a"
---
`;
    const pairs = auditDesignMd(md).cvdCollisions.map((c) =>
      [c.a, c.b].sort().join("~"),
    );
    expect(pairs).toContain("accent-green~accent-teal");
    expect(pairs).toContain("chart-1~chart-2");
    expect(pairs).not.toContain("error~error-soft");
    expect(pairs).not.toContain("primary~primary-deep");
  });

  it("does not let a disabled component hide a failing text pair", () => {
    const md = `---
name: X
colors:
  primary: "#cc785c"
  muted-soft: "#8e8b82"
  canvas: "#faf9f5"
components:
  field-disabled:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.muted-soft}"
---
`;
    const pairs = auditDesignMd(md).pairs.filter(
      (p) => p.foreground.token === "muted-soft",
    );
    expect(pairs).toHaveLength(1);
    expect(pairs[0].role).toBe("text");
    expect(pairs[0].passes).toBe(false);
  });

  it("rejects bare hex without # as a CSS color", () => {
    const a = auditDesignMd(
      `---\nname: X\ncolors:\n  primary: "6750a4"\n---\n`,
    );
    expect(a.notAudited[0].reason).toMatch(/leading `#`/);
  });

  it("formats a bounded markdown report", () => {
    const report = formatDesignMdAudit(audit, 5);
    expect(report).toContain("# DESIGN.md color audit");
    expect(report).toContain("3.28:1");
    const rows = report.split("\n").filter((l) => l.startsWith("| `"));
    expect(rows.length).toBeLessThanOrEqual(5);
  });
});
