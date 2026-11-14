import { describe, expect, it } from "vitest";

import { exportPaletteTool } from "../palette-export.tool.js";

describe("exportPaletteTool", () => {
  it("exports CSS custom properties", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4", "#ff6b6b"],
      format: "css",
      names: ["primary", "danger"],
    })) as string;
    expect(result).toContain("--primary: #6750a4;");
    expect(result).toContain("--danger: #ff6b6b;");
  });

  it("exports SCSS variables", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4"],
      format: "scss",
      names: ["primary"],
    })) as string;
    expect(result).toContain("$primary: #6750a4;");
  });

  it("exports Tailwind config snippet", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#fef3c7", "#fde68a"],
      format: "tailwind",
      prefix: "amber",
    })) as string;
    expect(result).toContain("tailwind.config.js");
    expect(result).toContain('"amber"');
  });

  it("exports W3C design tokens", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4"],
      format: "tokens",
      names: ["primary"],
    })) as string;
    const parsed = JSON.parse(result);
    expect(parsed.color.primary.$type).toBe("color");
    expect(parsed.color.primary.$value).toBe("#6750a4");
  });

  it("rejects mismatched names length", async () => {
    await expect(
      exportPaletteTool.execute({
        colors: ["#000", "#fff"],
        format: "css",
        names: ["only-one"],
      }),
    ).rejects.toThrow(/length/);
  });
});

describe("exportPaletteTool name safety (audit c6b9091)", () => {
  it("slugifies prefix and non-ASCII names into valid identifiers", async () => {
    const out = await exportPaletteTool.execute({
      colors: ["#ff0000", "#00ff00"],
      format: "tailwind",
      names: ["Primary Red", "Ünïcode"],
      prefix: 'my "brand"',
    });
    expect(out).toContain('"my-brand": {');
    expect(out).toContain('"primary-red": "#ff0000"');
    expect(out).toContain('"unicode": "#00ff00"');
    expect(out).not.toContain('"my "brand""');
  });

  it("rejects names that collide after normalization", async () => {
    await expect(
      exportPaletteTool.execute({
        colors: ["#ff0000", "#00ff00"],
        format: "css",
        names: ["a", "A"],
      }),
    ).rejects.toThrow(/Duplicate token names/);
  });
});

describe("exportPaletteTool design-md format", () => {
  it("emits a DESIGN.md colors block that the auditor can read back", async () => {
    const out = await exportPaletteTool.execute({
      colors: ["#6750a4", "#ffffff"],
      format: "design-md",
      names: ["primary", "on-primary"],
    });
    expect(out).toBe(
      'colors:\n  primary: "#6750a4"\n  on-primary: "#ffffff"\n',
    );
    const { auditDesignMd } = await import("../../color/design-md.js");
    const audit = auditDesignMd(`---\nname: X\n${out}---\n`);
    expect(audit.errors).toEqual([]);
    expect(audit.pairs[0].ratio).toBeGreaterThan(4.5);
  });

  it("quotes numeric token names", async () => {
    const out = await exportPaletteTool.execute({
      colors: ["#000000"],
      format: "design-md",
    });
    expect(out).toContain('  "50": "#000000"');
  });
});
