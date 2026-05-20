/**
 * Color Blindness Simulation Tool
 * Simulate how colors appear to viewers with color vision deficiency (CVD)
 * and audit palette accessibility for common deficiency types.
 */

import { z } from "zod";

import {
  CVD_PREVALENCE,
  CvdType,
  simulateCvd,
} from "../color/color-blindness.js";
import {
  colorDistance,
  getContrastRatio,
  parseColor,
  rgbToHex,
} from "../color/index.js";

const CVD_TYPES = [
  "protanopia",
  "deuteranopia",
  "tritanopia",
  "protanomaly",
  "deuteranomaly",
  "tritanomaly",
  "achromatopsia",
] as const satisfies readonly CvdType[];

export const simulateColorBlindnessTool = {
  description:
    "Simulate how one or more colors appear to viewers with color vision deficiency (protanopia, deuteranopia, tritanopia, their milder anomaly forms, or achromatopsia).",
  execute: async (args: { colors: string[]; types?: CvdType[] }) => {
    const types = args.types && args.types.length > 0 ? args.types : CVD_TYPES;

    const parsed = args.colors.map((c) => ({ input: c, rgb: parseColor(c) }));
    const invalid = parsed.filter((p) => !p.rgb);
    if (invalid.length) {
      return `Invalid color format: ${invalid.map((p) => p.input).join(", ")}`;
    }

    let output = `# Color Blindness Simulation\n\n`;
    output += `| Original | ${types.join(" | ")} |\n`;
    output += `|${"---|".repeat(types.length + 1)}\n`;

    for (const { input, rgb } of parsed) {
      const simulated = types.map((t) => rgbToHex(simulateCvd(rgb!, t)));
      output += `| ${rgbToHex(rgb!)} (${input}) | ${simulated.join(" | ")} |\n`;
    }

    output += `\n## Population prevalence\n`;
    for (const t of types) {
      output += `- **${t}**: ~${CVD_PREVALENCE[t]}% of population\n`;
    }

    return output;
  },
  name: "simulate_color_blindness",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(1)
      .describe("Colors to simulate (hex, rgb, hsl)"),
    types: z
      .array(z.enum(CVD_TYPES))
      .optional()
      .describe(
        "Deficiency types to simulate. Defaults to all 7 (dichromacy + anomaly + achromatopsia).",
      ),
  }),
};

export const checkPaletteAccessibilityTool = {
  description:
    "Audit a color palette for color-blind accessibility. For each pair of colors, reports the perceptual distance (Delta E 2000) under each CVD type and flags pairs that become indistinguishable.",
  execute: async (args: {
    colors: string[];
    indistinguishableThreshold?: number;
    types?: CvdType[];
  }) => {
    const types = args.types && args.types.length > 0 ? args.types : CVD_TYPES;
    const threshold = args.indistinguishableThreshold ?? 10;

    const parsed = args.colors.map((c) => ({ input: c, rgb: parseColor(c) }));
    const invalid = parsed.filter((p) => !p.rgb);
    if (invalid.length) {
      return `Invalid color format: ${invalid.map((p) => p.input).join(", ")}`;
    }

    const colors = parsed.map((p) => p.rgb!);
    const labels = parsed.map((p) => rgbToHex(p.rgb!));

    let output = `# Palette Accessibility Audit\n\n`;
    output += `Indistinguishable threshold: ΔE2000 < ${threshold}\n\n`;

    const problems: string[] = [];

    for (const type of types) {
      const simulated = colors.map((c) => simulateCvd(c, type));
      const collisions: string[] = [];

      for (let i = 0; i < simulated.length; i++) {
        for (let j = i + 1; j < simulated.length; j++) {
          const d = colorDistance(simulated[i], simulated[j], {
            metric: "deltaE2000",
          });
          if (d < threshold) {
            collisions.push(
              `  - ${labels[i]} ↔ ${labels[j]}: ΔE=${d.toFixed(1)} (sim: ${rgbToHex(
                simulated[i],
              )} vs ${rgbToHex(simulated[j])})`,
            );
          }
        }
      }

      output += `## ${type} (~${CVD_PREVALENCE[type]}% of population)\n`;
      if (collisions.length === 0) {
        output += `✓ All ${colors.length} colors remain distinguishable\n\n`;
      } else {
        output += `⚠ ${collisions.length} indistinguishable pair${collisions.length === 1 ? "" : "s"}:\n`;
        output += collisions.join("\n") + "\n\n";
        problems.push(type);
      }
    }

    output += `## Summary\n`;
    if (problems.length === 0) {
      output += `✓ Palette is accessible across all tested CVD types.\n`;
    } else {
      output += `⚠ Issues detected in: ${problems.join(", ")}.\n`;
      output += `Consider increasing tonal contrast (vary lightness) or chroma; CVD-friendly palettes rely on lightness differences rather than hue alone.\n`;

      // Quick contrast hint: compute mean luminance contrast within the palette
      let worst = Infinity;
      for (let i = 0; i < colors.length; i++) {
        for (let j = i + 1; j < colors.length; j++) {
          const r = getContrastRatio(colors[i], colors[j]);
          if (r < worst) worst = r;
        }
      }
      output += `Lowest WCAG luminance ratio in palette: ${worst.toFixed(2)}:1 (target ≥ 3:1 for adjacent UI swatches).\n`;
    }

    return output;
  },
  name: "check_palette_accessibility",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(2)
      .describe("Palette colors to audit (at least 2)"),
    indistinguishableThreshold: z
      .number()
      .min(1)
      .max(30)
      .optional()
      .default(10)
      .describe(
        "ΔE2000 below which two simulated colors are considered indistinguishable (default 10)",
      ),
    types: z
      .array(z.enum(CVD_TYPES))
      .optional()
      .describe("CVD types to audit. Defaults to all 7."),
  }),
};
