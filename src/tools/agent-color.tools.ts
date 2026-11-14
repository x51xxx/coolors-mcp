/**
 * Agent-Compensating Color Intelligence Tools
 *
 * Designed specifically to offset AI agent blind spots around color:
 * - describe_color: gives the agent "eyes" (human perceptual name, mood, contrast, warnings)
 * - fix_contrast: solves for the closest hue-preserving accessible color (zero guessing)
 * - design_ui_palette: builds a verified 60-30-10 Light & Dark UI token system
 * - audit_ui_colors: audits all fg/bg pairs & swatches in one shot with exact auto-fixes
 * - generate_categorical_palette: creates CVD-safe, equal-weight chart/tag palettes
 */

import { z } from "zod";

import { simulateCvd } from "../color/color-blindness.js";
import {
  auditColorPair,
  colorDistance,
  type ContrastTarget,
  designUiPalette,
  generateCategoricalPalette,
  type HarmonyScheme,
  type NeutralStyle,
  parseColor,
  profileColor,
  rgbToHex,
  solveAccessibleContrast,
} from "../color/index.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

// --- describe_color ----------------------------------------------------------

export const describeColorTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Describe what one or more colors actually look like in human perceptual terms (name, warm/cool temperature, lightness & vividness tier, OKLCH/HCT/HSL/RGB values, readable text recommendation, UI role suggestions, and visual pitfalls like bile-zone or halation). Use this whenever you cannot 'see' a hex code.",
  execute: async (args: { colors: string[] }) => {
    const sections: string[] = [];

    for (const input of args.colors) {
      const rgb = parseColor(input);
      if (!rgb) {
        sections.push(`## ${input}\n❌ Invalid color format.`);
        continue;
      }

      const p = profileColor(rgb);
      let block = `## ${p.hex}${input.toLowerCase() !== p.hex ? ` (${input})` : ""} — **${p.name}**\n`;
      block += `- **Appearance**: ${p.valueTier}, ${p.chromaTier}, ${p.temperature} (temp score ${p.temperatureScore >= 0 ? "+" : ""}${p.temperatureScore})\n`;
      block += `- **Spaces**: \`${p.oklchCss}\` | \`hct(${p.hct.h.toFixed(1)}, ${p.hct.c.toFixed(1)}, ${p.hct.t.toFixed(1)})\` | \`hsl(${p.hsl.h}, ${p.hsl.s}%, ${p.hsl.l}%)\` | \`rgb(${p.rgb.r}, ${p.rgb.g}, ${p.rgb.b})\` | L=${p.luminance.toFixed(3)}\n`;
      block += `- **Text on this color**: use **${p.bestText.recommendedHex}** (${p.bestText.recommended}) — light \`#ffffff\`: ${p.bestText.lightWcag.toFixed(2)}:1 (APCA ${p.bestText.lightLc.toFixed(0)}) vs dark \`${p.bestText.darkHex}\`: ${p.bestText.darkWcag.toFixed(2)}:1 (APCA ${p.bestText.darkLc.toFixed(0)})\n`;
      block += `- **Best UI roles**: ${p.suggestedRoles.join(", ")}\n`;

      if (p.warnings.length > 0) {
        block += `- **Warnings**: ${p.warnings.join(" ")}\n`;
      }
      sections.push(block);
    }

    return `# Perceptual Color Profile\n\n${sections.join("\n")}`;
  },
  name: "describe_color",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(1)
      .max(20)
      .describe(
        "One or more colors to describe (hex, CSS name, rgb, hsl, oklch)",
      ),
  }),
};

// --- fix_contrast ------------------------------------------------------------

const TARGETS = [
  "aa",
  "aaa",
  "aa-large",
  "ui",
  "apca-body",
  "apca-content",
  "apca-large",
] as const satisfies readonly ContrastTarget[];

export const fixContrastTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Automatically find the perceptually closest color that meets a WCAG 2.x or APCA contrast target while preserving hue in HCT space. Eliminates trial-and-error guessing.",
  execute: async (args: {
    adjust?: "auto" | "background" | "foreground";
    background: string;
    foreground: string;
    prefer?: "darker" | "lighter" | "minimal";
    target?: ContrastTarget;
  }) => {
    const fg = parseColor(args.foreground);
    const bg = parseColor(args.background);
    if (!fg || !bg) {
      throw new ToolInputError(
        `Invalid color format: ${!fg ? args.foreground : args.background}`,
      );
    }

    const target = args.target ?? "aa";
    const adjust = args.adjust ?? "foreground";
    const prefer = args.prefer ?? "minimal";

    const res = solveAccessibleContrast({
      adjust,
      background: bg,
      foreground: fg,
      prefer,
      target,
    });

    const fgBeforeHex = rgbToHex(res.foregroundBefore);
    const bgBeforeHex = rgbToHex(res.backgroundBefore);
    const fgAfterHex = rgbToHex(res.foregroundAfter);
    const bgAfterHex = rgbToHex(res.backgroundAfter);

    if (res.adjustedRole === "none") {
      return `# Contrast Already Passes (${target})
- Foreground: \`${fgAfterHex}\` on Background: \`${bgAfterHex}\`
- WCAG 2.x: **${res.wcagAfter.toFixed(2)}:1** | APCA Lc: **${res.apcaLcAfter.toFixed(1)}**`;
    }

    const afterAudit = auditColorPair(
      res.foregroundAfter,
      res.backgroundAfter,
      target === "aa-large" || target === "apca-large"
        ? "large"
        : target === "ui"
          ? "ui"
          : "body",
    );

    let out = `# Accessible Contrast Solution (${target})\n\n`;
    out += `- **Status**: ${res.achieved ? "✓ Target achieved" : "⚠ Best possible fallback"}\n`;
    out += `- **Adjusted**: ${res.adjustedRole} (ΔE2000 shift = ${res.deltaE.toFixed(2)})\n`;
    out += `- **Before**: \`${fgBeforeHex}\` on \`${bgBeforeHex}\` → ${res.wcagBefore.toFixed(2)}:1 (APCA Lc ${res.apcaLcBefore.toFixed(1)})\n`;
    out += `- **After**:  \`${fgAfterHex}\` on \`${bgAfterHex}\` → **${res.wcagAfter.toFixed(2)}:1** (APCA Lc **${res.apcaLcAfter.toFixed(1)}**)\n`;

    if (afterAudit.warnings.length > 0) {
      out += `\n## Remaining Notes\n${afterAudit.warnings.map((w) => `- ${w}`).join("\n")}\n`;
    }

    return out;
  },
  name: "fix_contrast",
  parameters: z.object({
    adjust: z
      .enum(["foreground", "background", "auto"])
      .optional()
      .default("foreground")
      .describe(
        "Which color to adjust: 'foreground' (default), 'background', or 'auto' (whichever needs smaller ΔE2000)",
      ),
    background: z.string().describe("Background color"),
    foreground: z.string().describe("Foreground/text color"),
    prefer: z
      .enum(["minimal", "darker", "lighter"])
      .optional()
      .default("minimal")
      .describe("Direction preference for tone adjustment"),
    target: z
      .enum(TARGETS)
      .optional()
      .default("aa")
      .describe(
        "Contrast target: 'aa' (4.5:1), 'aaa' (7:1), 'aa-large' (3:1), 'ui' (3:1), 'apca-body' (|Lc|≥75), 'apca-content' (|Lc|≥60), 'apca-large' (|Lc|≥45)",
      ),
  }),
};

// --- design_ui_palette -------------------------------------------------------

const UI_HARMONIES = [
  "analogous",
  "complementary",
  "split-complementary",
  "triadic",
  "monochromatic",
] as const satisfies readonly HarmonyScheme[];

const NEUTRAL_STYLES = [
  "tinted",
  "cool",
  "warm",
  "pure",
] as const satisfies readonly NeutralStyle[];

function toKebab(key: string): string {
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

export const designUiPaletteTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Design a complete, contrast-verified Light + Dark UI color system from a single brand color following the 60-30-10 rule (60% surfaces/neutrals/text hierarchy, 30% secondary & subtle containers, 10% primary CTA & interactive states + harmonized status colors). Prevents dark-mode neon halation and guarantees WCAG AA/AAA text pairs.",
  execute: async (args: {
    brand: string;
    format?: "css" | "json" | "report" | "tokens";
    harmony?: (typeof UI_HARMONIES)[number];
    neutralStyle?: NeutralStyle;
  }) => {
    const brandRgb = parseColor(args.brand);
    if (!brandRgb)
      throw new ToolInputError(`Invalid color format: ${args.brand}`);

    const format = args.format ?? "report";
    const system = designUiPalette(brandRgb, {
      harmony: args.harmony ?? "analogous",
      neutralStyle: args.neutralStyle ?? "tinted",
    });

    if (format === "json") {
      return JSON.stringify(system, null, 2);
    }

    if (format === "tokens") {
      const wrapMode = (tokens: typeof system.light) =>
        Object.fromEntries(
          Object.entries(tokens).map(([k, v]) => [
            k,
            { $type: "color", $value: v },
          ]),
        );
      return JSON.stringify(
        {
          color: {
            dark: wrapMode(system.dark),
            light: wrapMode(system.light),
          },
        },
        null,
        2,
      );
    }

    const cssBlock = `:root {\n${Object.entries(system.light)
      .map(([k, v]) => `  --color-${toKebab(k)}: ${v};`)
      .join("\n")}\n}\n\n[data-theme="dark"] {\n${Object.entries(system.dark)
      .map(([k, v]) => `  --color-${toKebab(k)}: ${v};`)
      .join("\n")}\n}`;

    if (format === "css") {
      return cssBlock;
    }

    const brandProfile = profileColor(brandRgb);
    let out = `# UI Design System (${system.harmony}, ${system.neutralStyle} neutrals)\n`;
    out += `Brand: \`${system.brandHex}\` (${brandProfile.name}) | Verified contrast checks: **${system.verifiedChecks}**\n\n`;
    out += `| Token | Light | Dark |\n|---|---|---|\n`;
    for (const key of Object.keys(
      system.light,
    ) as (keyof typeof system.light)[]) {
      out += `| \`${key}\` | \`${system.light[key]}\` | \`${system.dark[key]}\` |\n`;
    }
    out += `\n## CSS Custom Properties\n\`\`\`css\n${cssBlock}\n\`\`\`\n`;
    return out;
  },
  name: "design_ui_palette",
  parameters: z.object({
    brand: z
      .string()
      .describe("Brand seed color (hex, CSS name, rgb, hsl, oklch)"),
    format: z
      .enum(["report", "css", "json", "tokens"])
      .optional()
      .default("report")
      .describe(
        "Output format: markdown report + CSS, css only, json, or W3C tokens",
      ),
    harmony: z
      .enum(UI_HARMONIES)
      .optional()
      .default("analogous")
      .describe("Secondary/accent harmony relative to brand"),
    neutralStyle: z
      .enum(NEUTRAL_STYLES)
      .optional()
      .default("tinted")
      .describe(
        "Neutral tinting: 'tinted' (subtle brand tint, default), 'cool', 'warm', or 'pure' grayscale",
      ),
  }),
};

// --- audit_ui_colors ---------------------------------------------------------

export const auditUiColorsTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Audit an entire UI's foreground/background pairs and optional palette swatches in one call. Checks WCAG 2.x, APCA Lc, color-blindness contrast collapses, simultaneous-contrast vibration, and universally disliked colors — and provides exact hue-preserving fixes for every failing pair.",
  execute: async (args: {
    pairs?: Array<{
      bg: string;
      fg: string;
      name?: string;
      role?: "body" | "large" | "ui";
    }>;
    swatches?: string[];
  }) => {
    const pairs = args.pairs ?? [];
    const swatches = args.swatches ?? [];
    if (pairs.length === 0 && swatches.length === 0) {
      return "Provide at least one `pairs` entry or `swatches` color to audit.";
    }

    let out = `# UI Color Audit\n\n`;
    let issueCount = 0;

    if (pairs.length > 0) {
      out += `## Pair Checks (${pairs.length})\n\n`;
      out += `| Pair | Role | WCAG | APCA Lc | Status | Fix / Notes |\n|---|---|---|---|---|---|\n`;

      for (let i = 0; i < pairs.length; i++) {
        const pair = pairs[i];
        const label = pair.name ?? `pair-${i + 1}`;
        const role = pair.role ?? "body";
        const fg = parseColor(pair.fg);
        const bg = parseColor(pair.bg);

        if (!fg || !bg) {
          issueCount++;
          out += `| ${label} | ${role} | - | - | ❌ Invalid | Invalid color (${pair.fg} / ${pair.bg}) |\n`;
          continue;
        }

        const res = auditColorPair(fg, bg, role);
        const status =
          res.passesRole && res.warnings.length === 0
            ? "✓ Pass"
            : res.passesRole
              ? "⚠ Pass w/ notes"
              : "✗ Fail";

        if (!res.passesRole || res.warnings.length > 0) issueCount++;

        const notes: string[] = [];
        if (res.fixSuggestion) {
          notes.push(
            `Use fg \`${rgbToHex(res.fixSuggestion.foregroundAfter)}\` (${res.fixSuggestion.wcagAfter.toFixed(2)}:1)`,
          );
        }
        if (res.chromostereopsisRisk) {
          notes.push("Optical vibration risk");
        }
        if (res.cvdIssues.length > 0) {
          notes.push(
            `CVD drop (${res.cvdIssues.map((c) => `${c.type} ${c.simulatedWcag.toFixed(1)}:1`).join(", ")})`,
          );
        }

        out += `| ${label} (\`${rgbToHex(fg)}\` on \`${rgbToHex(bg)}\`) | ${role} | ${res.wcagRatio.toFixed(2)}:1 | ${res.apcaLc.toFixed(1)} | ${status} | ${notes.join("; ") || "-"} |\n`;
      }
      out += "\n";
    }

    if (swatches.length > 0) {
      out += `## Swatch Checks (${swatches.length})\n\n`;
      const parsedSwatches: {
        hex: string;
        input: string;
        rgb: NonNullable<ReturnType<typeof parseColor>>;
      }[] = [];
      for (const s of swatches) {
        const rgb = parseColor(s);
        if (!rgb) {
          issueCount++;
          out += `- \`${s}\`: ❌ Invalid color\n`;
          continue;
        }
        const p = profileColor(rgb);
        parsedSwatches.push({ hex: p.hex, input: s, rgb });
        if (p.warnings.length > 0) {
          issueCount++;
          out += `- \`${p.hex}\` (${p.name}): ⚠ ${p.warnings.join(" ")}\n`;
        }
      }

      // Check CVD collisions among swatches
      const cvdTypes = ["deuteranopia", "protanopia", "tritanopia"] as const;
      for (const type of cvdTypes) {
        const sims = parsedSwatches.map((s) => simulateCvd(s.rgb, type));
        for (let i = 0; i < sims.length; i++) {
          for (let j = i + 1; j < sims.length; j++) {
            const d = colorDistance(sims[i], sims[j], { metric: "deltaE2000" });
            if (d < 8) {
              issueCount++;
              out += `- CVD collision (${type}): \`${parsedSwatches[i].hex}\` ↔ \`${parsedSwatches[j].hex}\` (ΔE=${d.toFixed(1)})\n`;
            }
          }
        }
      }
      if (issueCount === 0) {
        out += `- ✓ No swatch warnings or CVD collisions found.\n`;
      }
      out += "\n";
    }

    out += `**Summary**: ${issueCount === 0 ? "✓ All checks passed cleanly." : `${issueCount} item(s) flagged above.`}\n`;
    return out;
  },
  name: "audit_ui_colors",
  parameters: z.object({
    pairs: z
      .array(
        z.object({
          bg: z.string().describe("Background color"),
          fg: z.string().describe("Foreground/text color"),
          name: z.string().optional().describe("Token or component name"),
          role: z
            .enum(["body", "large", "ui"])
            .optional()
            .default("body")
            .describe(
              "Usage role: body (4.5:1), large (3:1), ui/border/icon (3:1)",
            ),
        }),
      )
      .max(100)
      .optional()
      .describe("Foreground/background pairs to audit (up to 100)"),
    swatches: z
      .array(z.string())
      .max(64)
      .optional()
      .describe(
        "Optional standalone palette swatches to check for bile-zone/CVD collisions",
      ),
  }),
};

// --- generate_categorical_palette --------------------------------------------

export const generateCategoricalPaletteTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Generate N perceptually balanced, color-blind-safe categorical colors for charts, badges, tags, or avatars. Optimizes minimum ΔE2000 across normal vision AND protanopia/deuteranopia/tritanopia so no category vanishes or collides.",
  execute: async (args: {
    background?: "dark" | "light";
    count: number;
    seedColor?: string;
  }) => {
    let seedHue = 220;
    if (args.seedColor) {
      const parsed = parseColor(args.seedColor);
      if (!parsed)
        throw new ToolInputError(`Invalid color format: ${args.seedColor}`);
      seedHue = profileColor(parsed).oklch.h;
    }

    const background = args.background ?? "light";
    const { colors, minCvdDeltaE, minNormalDeltaE } =
      generateCategoricalPalette(args.count, { background, seedHue });

    let out = `# Categorical Palette (${args.count} colors, ${background} background)\n`;
    out += `- Min pairwise ΔE2000 (normal vision): **${minNormalDeltaE.toFixed(1)}**\n`;
    out += `- Min pairwise ΔE2000 (worst CVD): **${minCvdDeltaE.toFixed(1)}**\n\n`;

    colors.forEach((rgb, i) => {
      const p = profileColor(rgb);
      out += `${i + 1}. \`${p.hex}\` — ${p.name} (best text: \`${p.bestText.recommendedHex}\`)\n`;
    });

    return out;
  },
  name: "generate_categorical_palette",
  parameters: z.object({
    background: z
      .enum(["light", "dark"])
      .optional()
      .default("light")
      .describe("Target canvas polarity ('light' or 'dark')"),
    count: z
      .number()
      .min(2)
      .max(12)
      .describe("Number of distinct categories (2-12)"),
    seedColor: z
      .string()
      .optional()
      .describe(
        "Optional brand/anchor color to start the categorical spread from",
      ),
  }),
};
