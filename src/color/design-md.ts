/**
 * DESIGN.md color audit.
 *
 * Parses the design tokens of a DESIGN.md file (Google Labs format, spec
 * `version: alpha`): YAML front matter plus any fenced ```yaml blocks, merged
 * into one token tree. Then audits the `colors` group:
 *
 * - contrast (WCAG 2.x + APCA) for pairs *declared* in `components`
 *   (backgroundColor/textColor) and pairs *inferred* from token names
 *   (on-X ↔ X, text-like ↔ surface-like tokens of the same light/dark mode);
 * - color-vision-deficiency collisions between accent/status colors;
 * - exact and near-duplicate tokens; universally disliked colors;
 * - spec problems: missing `primary`, broken `{colors.x}` references,
 *   duplicate top-level keys, values the auditor cannot evaluate.
 *
 * Values in syntaxes the shared parser does not support (hwb, lab, lch,
 * color-mix, transparent) are reported per token and never guessed.
 */

import { parse as parseYaml } from "yaml";

import type { RGB } from "./types.js";

import { apcaContrast } from "./apca.js";
import { simulateCvd } from "./color-blindness.js";
import { CvdType } from "./color-blindness.js";
import {
  getColorAlpha,
  parseColor,
  rgbToArgb,
  rgbToHex,
} from "./conversions.js";
import { DislikeAnalyzer } from "./dislike/dislike-analyzer.js";
import { Hct } from "./hct/hct-class.js";
import { colorDistance } from "./metrics.js";
import { solveAccessibleContrast } from "./theory.js";
import { getContrastRatio } from "./utils.js";

export interface DesignMdAudit {
  colorCount: number;
  colorsNotAudited: number;
  cvdCollisions: Array<{
    a: string;
    b: string;
    deltaE: number;
    statusPair: boolean;
    type: CvdType;
  }>;
  disliked: Array<{ fixed: string; hex: string; token: string }>;
  duplicates: Array<{ hex: string; tokens: string[] }>;
  errors: string[];
  nearDuplicates: Array<{ a: string; b: string; deltaE: number }>;
  notAudited: Array<{ reason: string; token: string; value: string }>;
  notes: string[];
  pairs: DesignMdPair[];
}

export interface DesignMdAuditOptions {
  /** ΔE2000 below which two colors collide under CVD (default 10). */
  cvdThreshold?: number;
  /** ΔE2000 below which two distinct tokens are near-duplicates (default 2). */
  nearDuplicateThreshold?: number;
  /** Minimum WCAG ratio for text pairs (default 4.5, AA normal text). */
  textThreshold?: number;
}

export interface DesignMdPair {
  apcaLc: number;
  background: { hex: string; token: string };
  foreground: { hex: string; token: string };
  origin: string;
  passes: boolean;
  ratio: number;
  /** "exempt": disabled controls (WCAG 1.4.3 exempts inactive components) */
  role: "exempt" | "text" | "ui";
  source: "declared" | "inferred";
  suggestion?: { foreground: string; ratio: number };
  threshold: number;
}

interface ResolvedColor {
  alpha?: number;
  hex: string;
  rgb: RGB;
}

const CVD_AUDIT_TYPES: CvdType[] = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "deuteranomaly",
];
const TEXT_RE =
  /^(ink|text|body|foreground|fg|heading|headline|title|caption|muted|subtle|copy|content)(-|$)|(^|-)text(-|$)/;
const SURFACE_RE = /^(canvas|surface|background|bg|paper|page)(-|$)/;
// Borders/outlines that must meet 3:1 (WCAG 1.4.11). "-variant" outlines,
// hairlines and dividers are decorative by convention (Material 3) and skipped.
const UI_RE = /^(border|outline|stroke)(-(?!variant)[\w-]*)?$/;
const STATUS_RE =
  /(^|-)(success|positive|warning|caution|error|danger|negative|info)(-|$)/;
const DARK_RE = /(^|-)(dark|night)(-|$)/;
const UNSUPPORTED_RE = /^(hwb|lab|lch|color-mix|color|light-dark)\(/i;

/**
 * Audit the color tokens of a DESIGN.md document.
 */
export function auditDesignMd(
  markdown: string,
  options: DesignMdAuditOptions = {},
): DesignMdAudit {
  const {
    cvdThreshold = 10,
    nearDuplicateThreshold = 2,
    textThreshold = 4.5,
  } = options;

  const { errors, tree } = extractDesignMdTokens(markdown);
  const audit: DesignMdAudit = {
    colorCount: 0,
    colorsNotAudited: 0,
    cvdCollisions: [],
    disliked: [],
    duplicates: [],
    errors,
    nearDuplicates: [],
    notAudited: [],
    notes: [],
    pairs: [],
  };

  const colorsNode = tree.colors;
  if (colorsNode === undefined) {
    audit.errors.push("No `colors` token group found.");
    return audit;
  }
  if (!isPlainObject(colorsNode)) {
    audit.errors.push("`colors` must be a map of token name → color.");
    return audit;
  }
  if (!("primary" in colorsNode)) {
    audit.errors.push("`colors.primary` is required by the spec but missing.");
  }

  // Resolve every color token.
  const resolved = new Map<string, ResolvedColor>();
  for (const name of Object.keys(colorsNode)) {
    audit.colorCount++;
    const result = resolveColorValue(tree, `colors.${name}`);
    if ("error" in result) {
      if (result.kind === "reference") {
        audit.errors.push(`colors.${name}: ${result.error}`);
      } else {
        audit.notAudited.push({
          reason: result.error,
          token: name,
          value: result.value,
        });
      }
      audit.colorsNotAudited++;
      continue;
    }
    resolved.set(name, result);
    if (result.alpha !== undefined && result.alpha < 1) {
      audit.notes.push(
        `colors.${name} has alpha ${round(result.alpha, 2)}; contrast is computed for the opaque color — the real contrast depends on what is underneath.`,
      );
    }
  }

  const seenPairs = new Map<string, number>(); // fg|bg → index in audit.pairs
  const addPair = (
    fgName: string,
    bgName: string,
    fg: ResolvedColor,
    bg: ResolvedColor,
    source: DesignMdPair["source"],
    origin: string,
    role: DesignMdPair["role"],
  ) => {
    const key = `${fgName}|${bgName}`;
    const existing = seenPairs.get(key);
    // First pair wins, except that a real (non-exempt) check replaces an
    // exempt one — a disabled component must not hide a failing text pair.
    if (
      existing !== undefined &&
      (role === "exempt" || audit.pairs[existing].role !== "exempt")
    )
      return;
    const threshold = role === "exempt" ? 0 : role === "ui" ? 3 : textThreshold;
    const ratio = getContrastRatio(fg.rgb, bg.rgb);
    const pair: DesignMdPair = {
      apcaLc: apcaContrast(fg.rgb, bg.rgb),
      background: { hex: bg.hex, token: bgName },
      foreground: { hex: fg.hex, token: fgName },
      origin,
      passes: ratio >= threshold,
      ratio,
      role,
      source,
      threshold,
    };
    if (!pair.passes) {
      const solved = solveAccessibleContrast({
        adjust: "foreground",
        background: bg.rgb,
        foreground: fg.rgb,
        target: role === "ui" ? "ui" : textThreshold > 4.5 ? "aaa" : "aa",
      });
      if (solved.achieved) {
        pair.suggestion = {
          foreground: rgbToHex(solved.foregroundAfter),
          ratio: getContrastRatio(solved.foregroundAfter, bg.rgb),
        };
      }
    }
    if (existing !== undefined) {
      audit.pairs[existing] = pair;
    } else {
      seenPairs.set(key, audit.pairs.length);
      audit.pairs.push(pair);
    }
  };

  // 1) Declared pairs: components.<name>.backgroundColor + textColor
  const components = tree.components;
  if (isPlainObject(components)) {
    for (const [component, props] of Object.entries(components)) {
      if (!isPlainObject(props)) continue;
      if (props.backgroundColor === undefined || props.textColor === undefined)
        continue;
      const bg = resolveComponentColor(tree, component, "backgroundColor");
      const fg = resolveComponentColor(tree, component, "textColor");
      for (const r of [bg, fg]) {
        if ("error" in r) {
          if (r.kind === "reference") audit.errors.push(r.error);
          else
            audit.notAudited.push({
              reason: r.error,
              token: r.label,
              value: r.value,
            });
        }
      }
      if ("error" in bg || "error" in fg) continue;
      addPair(
        fg.label,
        bg.label,
        fg,
        bg,
        "declared",
        `components.${component}`,
        /(^|-)disabled(-|$)/.test(component) ? "exempt" : "text",
      );
    }
  }

  // 2) Inferred pairs from token names.
  const names = [...resolved.keys()];
  const surfaces = names.filter(
    (n) => SURFACE_RE.test(n) && !/(^|-)tint(-|$)/.test(n),
  );
  const isDarkName = (n: string) => DARK_RE.test(n);
  for (const name of names) {
    if (!name.startsWith("on-")) continue;
    const base = name.slice(3);
    if (resolved.has(base)) {
      addPair(
        name,
        base,
        resolved.get(name)!,
        resolved.get(base)!,
        "inferred",
        "on-X ↔ X",
        "text",
      );
      continue;
    }
    // on-dark / on-dark-soft → every surface containing the "dark" segment
    const segment = base.split("-")[0];
    for (const surface of surfaces) {
      if (surface.split("-").includes(segment)) {
        addPair(
          name,
          surface,
          resolved.get(name)!,
          resolved.get(surface)!,
          "inferred",
          `on-${segment} ↔ *-${segment} surfaces`,
          "text",
        );
      }
    }
  }
  for (const name of names) {
    if (name.startsWith("on-")) continue;
    const role = TEXT_RE.test(name) ? "text" : UI_RE.test(name) ? "ui" : null;
    if (!role || SURFACE_RE.test(name)) continue;
    for (const surface of surfaces) {
      if (isDarkName(surface) !== isDarkName(name)) continue;
      addPair(
        name,
        surface,
        resolved.get(name)!,
        resolved.get(surface)!,
        "inferred",
        role === "text" ? "text token ↔ surface" : "border/outline ↔ surface",
        role,
      );
    }
  }

  // 3) Exact and near duplicates
  const byHex = new Map<string, string[]>();
  for (const [name, c] of resolved) {
    if (isReference(colorsNode[name])) continue; // aliases are intentional
    byHex.set(c.hex, [...(byHex.get(c.hex) ?? []), name]);
  }
  for (const [hex, tokens] of byHex) {
    if (tokens.length > 1) audit.duplicates.push({ hex, tokens });
  }
  const uniques = [...byHex.entries()].map(([hex, tokens]) => ({
    hex,
    rgb: parseColor(hex)!,
    token: tokens[0],
  }));
  for (let i = 0; i < uniques.length; i++) {
    for (let j = i + 1; j < uniques.length; j++) {
      const d = colorDistance(uniques[i].rgb, uniques[j].rgb, {
        metric: "deltaE2000",
      });
      if (d < nearDuplicateThreshold) {
        audit.nearDuplicates.push({
          a: uniques[i].token,
          b: uniques[j].token,
          deltaE: d,
        });
      }
    }
  }

  // 4) CVD collisions among accent / status colors (distinct for normal vision)
  const accents = uniques
    .filter(({ rgb, token }) => {
      if (token.startsWith("on-")) return false;
      if (STATUS_RE.test(token)) return true;
      if (TEXT_RE.test(token)) return false;
      if (SURFACE_RE.test(token) || UI_RE.test(token)) return false;
      return Hct.fromInt(rgbToArgb(rgb)).chroma >= 16;
    })
    .slice(0, 24);
  for (const type of CVD_AUDIT_TYPES) {
    const sim = accents.map((a) => simulateCvd(a.rgb, type));
    for (let i = 0; i < accents.length; i++) {
      for (let j = i + 1; j < accents.length; j++) {
        // Shades of one family (error / error-soft / error-container) are
        // meant to look alike; only cross-family collisions matter.
        if (sameFamily(accents[i], accents[j])) continue;
        const normal = colorDistance(accents[i].rgb, accents[j].rgb, {
          metric: "deltaE2000",
        });
        if (normal < cvdThreshold) continue;
        const d = colorDistance(sim[i], sim[j], { metric: "deltaE2000" });
        if (d < cvdThreshold) {
          audit.cvdCollisions.push({
            a: accents[i].token,
            b: accents[j].token,
            deltaE: d,
            statusPair:
              STATUS_RE.test(accents[i].token) &&
              STATUS_RE.test(accents[j].token),
            type,
          });
        }
      }
    }
  }

  // 5) Universally disliked colors
  for (const { rgb, token } of uniques) {
    const hct = Hct.fromInt(rgbToArgb(rgb));
    if (DislikeAnalyzer.isDisliked(hct)) {
      const fixed = DislikeAnalyzer.fixIfDisliked(hct).toInt();
      audit.disliked.push({
        fixed: rgbToHex({
          b: fixed & 0xff,
          g: (fixed >> 8) & 0xff,
          r: (fixed >> 16) & 0xff,
        }),
        hex: rgbToHex(rgb),
        token,
      });
    }
  }

  // Failing pairs first, declared before inferred, worst ratio first.
  audit.pairs.sort(
    (a, b) =>
      Number(a.passes) - Number(b.passes) ||
      (a.source === b.source ? 0 : a.source === "declared" ? -1 : 1) ||
      a.ratio - b.ratio,
  );
  audit.cvdCollisions.sort(
    (a, b) =>
      Number(b.statusPair) - Number(a.statusPair) || a.deltaE - b.deltaE,
  );

  return audit;
}

/**
 * Extract and merge the YAML token tree from front matter and ```yaml blocks.
 */
export function extractDesignMdTokens(markdown: string): {
  errors: string[];
  tree: Record<string, unknown>;
} {
  const errors: string[] = [];
  const tree: Record<string, unknown> = {};
  const text = markdown.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const blocks: Array<{ label: string; yaml: string }> = [];

  let body = text;
  const lines = text.split("\n");
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end === -1) {
      errors.push("Front matter starts with `---` but is never closed.");
    } else {
      blocks.push({
        label: "front matter",
        yaml: lines.slice(1, end).join("\n"),
      });
      body = lines.slice(end + 1).join("\n");
    }
  }

  const fence = /^```ya?ml[ \t]*\n([\s\S]*?)^```[ \t]*$/gm;
  let match: null | RegExpExecArray;
  let index = 0;
  while ((match = fence.exec(body)) !== null) {
    index++;
    blocks.push({ label: `yaml block #${index}`, yaml: match[1] });
  }

  for (const block of blocks) {
    let parsed: unknown;
    try {
      parsed = parseYaml(block.yaml);
    } catch (error) {
      errors.push(
        `${block.label}: YAML parse error — ${error instanceof Error ? error.message.split("\n")[0] : String(error)}`,
      );
      continue;
    }
    if (parsed === null || parsed === undefined) continue;
    if (!isPlainObject(parsed)) {
      errors.push(`${block.label}: expected a YAML mapping at the top level.`);
      continue;
    }
    for (const [key, value] of Object.entries(parsed)) {
      if (key in tree) {
        errors.push(
          `Top-level key \`${key}\` is defined more than once (${block.label}); the spec rejects such files. Only the first definition is audited.`,
        );
        continue;
      }
      tree[key] = value;
    }
  }

  return { errors, tree };
}

/**
 * Render an audit as a bounded markdown report.
 */
export function formatDesignMdAudit(
  audit: DesignMdAudit,
  maxItems = 25,
): string {
  const failing = audit.pairs.filter((p) => !p.passes);
  const declared = audit.pairs.filter((p) => p.source === "declared").length;
  const lines: string[] = [];
  const more = (total: number) =>
    total > maxItems ? [`- … and ${total - maxItems} more`] : [];

  lines.push("# DESIGN.md color audit", "");
  lines.push(
    `Color tokens: ${audit.colorCount} (${audit.colorCount - audit.colorsNotAudited} audited, ${audit.colorsNotAudited} not audited) · ` +
      `Contrast pairs: ${audit.pairs.length} (${declared} declared, ${audit.pairs.length - declared} inferred) · ` +
      `Failing: ${failing.length} · CVD collisions: ${audit.cvdCollisions.length} · ` +
      `Duplicates: ${audit.duplicates.length} exact, ${audit.nearDuplicates.length} near`,
    "",
  );

  if (audit.errors.length) {
    lines.push("## Spec errors", "");
    for (const e of audit.errors.slice(0, maxItems)) lines.push(`- ✗ ${e}`);
    lines.push(...more(audit.errors.length), "");
  }

  lines.push("## Contrast", "");
  if (audit.pairs.length === 0) {
    lines.push(
      "No pairs found. Declare `backgroundColor`/`textColor` in `components`, or use `on-X` token names.",
      "",
    );
  } else {
    lines.push(
      "| text / element | on background | source | WCAG | needs | APCA Lc | result | suggested fix |",
      "|---|---|---|---|---|---|---|---|",
    );
    const shown = [...failing, ...audit.pairs.filter((p) => p.passes)].slice(
      0,
      maxItems,
    );
    for (const p of shown) {
      const fix = p.suggestion
        ? `${p.foreground.token} → \`${p.suggestion.foreground}\` (${p.suggestion.ratio.toFixed(2)}:1)`
        : p.passes
          ? ""
          : "no same-hue fix found";
      lines.push(
        `| \`${p.foreground.token}\` ${p.foreground.hex} | \`${p.background.token}\` ${p.background.hex} | ${p.source} · ${p.origin} | ${p.ratio.toFixed(2)}:1 | ${p.role === "exempt" ? "exempt (disabled)" : `${p.threshold}:1 ${p.role === "ui" ? "(UI)" : "(text)"}`} | ${p.apcaLc.toFixed(1)} | ${p.passes ? "✓" : "✗"} | ${fix} |`,
      );
    }
    if (audit.pairs.length > shown.length) {
      lines.push(
        "",
        `… ${audit.pairs.length - shown.length} more passing pairs not listed.`,
      );
    }
    lines.push(
      "",
      "Declared pairs come from `components`; inferred pairs are guesses from token names — confirm the pairing before acting on them. Decorative dividers, hairlines and `outline-variant` are not checked.",
      "",
    );
  }

  lines.push("## Color-vision collisions", "");
  if (audit.cvdCollisions.length === 0) {
    lines.push(
      "✓ Accent and status colors stay distinguishable (protanopia, deuteranopia, tritanopia, deuteranomaly).",
      "",
    );
  } else {
    for (const c of audit.cvdCollisions.slice(0, maxItems)) {
      lines.push(
        `- ${c.statusPair ? "⚠ status pair " : ""}\`${c.a}\` ↔ \`${c.b}\` under ${c.type}: ΔE2000 ${c.deltaE.toFixed(1)}`,
      );
    }
    lines.push(
      ...more(audit.cvdCollisions.length),
      "",
      "Do not rely on hue alone for these: add icons/labels or separate them in lightness.",
      "",
    );
  }

  if (audit.duplicates.length || audit.nearDuplicates.length) {
    lines.push("## Duplicates", "");
    for (const d of audit.duplicates.slice(0, maxItems)) {
      lines.push(
        `- ${d.tokens.map((t) => `\`${t}\``).join(", ")} share ${d.hex} — alias one to the other with \`{colors.${d.tokens[0]}}\` if intentional.`,
      );
    }
    for (const d of audit.nearDuplicates.slice(0, maxItems)) {
      lines.push(
        `- \`${d.a}\` ≈ \`${d.b}\` (ΔE2000 ${d.deltaE.toFixed(2)}) — visually indistinguishable.`,
      );
    }
    lines.push("");
  }

  if (audit.disliked.length) {
    lines.push("## Universally disliked colors", "");
    for (const d of audit.disliked.slice(0, maxItems)) {
      lines.push(
        `- \`${d.token}\` ${d.hex} sits in the dark yellow-green "bile" zone; same hue at tone 70: ${d.fixed}`,
      );
    }
    lines.push("");
  }

  if (audit.notAudited.length || audit.notes.length) {
    lines.push("## Not audited / caveats", "");
    for (const n of audit.notAudited.slice(0, maxItems)) {
      lines.push(`- \`${n.token}\`: \`${n.value}\` — ${n.reason}`);
    }
    for (const n of audit.notes.slice(0, maxItems)) lines.push(`- ${n}`);
    lines.push("");
  }

  return lines.join("\n");
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isReference(value: unknown): boolean {
  return typeof value === "string" && /^\{[^}]+\}$/.test(value.trim());
}

function lookupPath(tree: Record<string, unknown>, path: string): unknown {
  let node: unknown = tree;
  for (const part of path.split(".")) {
    if (!isPlainObject(node) || !(part in node)) return undefined;
    node = node[part];
  }
  return node;
}

function resolveColorLiteral(
  value: string,
): { error: string; kind: "value"; value: string } | ResolvedColor {
  const v = value.trim();
  if (/^transparent$/i.test(v) || /^currentcolor$/i.test(v)) {
    return {
      error: "not an opaque color; contrast cannot be evaluated",
      kind: "value",
      value: v,
    };
  }
  if (/^[0-9a-f]{3,8}$/i.test(v)) {
    return {
      error: "not a CSS color — hex values need a leading `#`",
      kind: "value",
      value: v,
    };
  }
  const rgb = parseColor(v);
  if (!rgb) {
    const fn = v.match(UNSUPPORTED_RE);
    return {
      error: fn
        ? `\`${fn[1].toLowerCase()}()\` is valid DESIGN.md syntax but this auditor cannot evaluate it yet`
        : "unparseable color value",
      kind: "value",
      value: v,
    };
  }
  return { alpha: getColorAlpha(v), hex: rgbToHex(rgb), rgb };
}

function resolveColorValue(
  tree: Record<string, unknown>,
  path: string,
):
  | { error: string; kind: "reference" | "value"; value: string }
  | ResolvedColor {
  const visited: string[] = [];
  let current = path;
  for (let depth = 0; depth < 16; depth++) {
    if (visited.includes(current)) {
      return {
        error: `reference cycle ${[...visited, current].join(" → ")}`,
        kind: "reference",
        value: current,
      };
    }
    visited.push(current);
    const value = lookupPath(tree, current);
    if (value === undefined) {
      return {
        error:
          depth === 0
            ? "missing"
            : `broken reference {${current}} (from ${visited[0]})`,
        kind: "reference",
        value: `{${current}}`,
      };
    }
    if (value === null) {
      return {
        error:
          "empty value — an unquoted `#...` starts a YAML comment; quote hex colors",
        kind: "value",
        value: "",
      };
    }
    if (typeof value !== "string") {
      return {
        error: isPlainObject(value)
          ? "points to a token group, not a color"
          : "not a color string",
        kind: depth === 0 ? "value" : "reference",
        value: String(value),
      };
    }
    const ref = value.trim().match(/^\{([^}]+)\}$/);
    if (!ref) {
      const literal = resolveColorLiteral(value);
      return literal;
    }
    current = ref[1].trim();
  }
  return {
    error: `reference chain too deep from ${path}`,
    kind: "reference",
    value: path,
  };
}

function resolveComponentColor(
  tree: Record<string, unknown>,
  component: string,
  property: "backgroundColor" | "textColor",
):
  | { error: string; kind: "reference" | "value"; label: string; value: string }
  | ({ label: string } & ResolvedColor) {
  const raw = (tree.components as Record<string, Record<string, unknown>>)[
    component
  ][property];
  const label =
    typeof raw === "string" && /^\{colors\.[^}]+\}$/.test(raw.trim())
      ? raw.trim().slice(8, -1)
      : `components.${component}.${property}`;
  const result = resolveColorValue(tree, `components.${component}.${property}`);
  if ("error" in result) {
    return {
      ...result,
      error:
        result.kind === "reference"
          ? `components.${component}.${property}: ${result.error}`
          : result.error,
      label,
    };
  }
  return { ...result, label };
}

function round(n: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

/**
 * Shades of one color family (error / error-soft, primary / primary-deep,
 * brand-500 / brand-700 of the same hue) are meant to look alike, so CVD
 * collisions between them are not findings. Different members of a set such
 * as accent-teal / accent-amber or chart-1 / chart-2 are compared.
 */
function sameFamily(
  a: { rgb: RGB; token: string },
  b: { rgb: RGB; token: string },
): boolean {
  const statusA = a.token.match(STATUS_RE)?.[2];
  const statusB = b.token.match(STATUS_RE)?.[2];
  if (statusA || statusB) return statusA === statusB;
  if (a.token.startsWith(`${b.token}-`) || b.token.startsWith(`${a.token}-`))
    return true;
  if (a.token.split("-")[0] !== b.token.split("-")[0]) return false;
  const ha = Hct.fromInt(rgbToArgb(a.rgb)).hue;
  const hb = Hct.fromInt(rgbToArgb(b.rgb)).hue;
  const diff = Math.abs(ha - hb);
  return Math.min(diff, 360 - diff) < 20;
}
