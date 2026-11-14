/**
 * Palette Generator Tool
 * Generate color-theory harmonies from a base color in perceptual (HCT/OKLCH)
 * or artistic (RYB/HSL) spaces, enriched with perceptual labels for agents.
 */

import { z } from "zod";

import {
  generateHarmonyPalette,
  type HarmonyScheme,
  type HarmonySpace,
  parseColor,
  profileColor,
  rgbToHex,
} from "../color/index.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

const TYPES = [
  "monochromatic",
  "analogous",
  "complementary",
  "split-complementary",
  "triadic",
  "tetradic",
  "square",
  "compound",
  "shades-and-tints",
] as const satisfies readonly HarmonyScheme[];

const SPACES = [
  "hct",
  "oklch",
  "ryb",
  "hsl",
] as const satisfies readonly HarmonySpace[];

export const paletteGeneratorTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Generate a color palette using color theory harmonies (monochromatic, analogous, complementary, split-complementary, triadic, tetradic, square, compound, shades-and-tints). Defaults to perceptual HCT space, avoids universally disliked colors, and describes each swatch so agents can see what was generated.",
  execute: async (args: {
    allowDisliked?: boolean;
    baseColor: string;
    count?: number;
    includeDetails?: boolean;
    space?: HarmonySpace;
    type?: HarmonyScheme;
  }) => {
    const base = parseColor(args.baseColor);
    if (!base) {
      throw new ToolInputError(`Invalid color format: ${args.baseColor}`);
    }

    const type = args.type ?? "analogous";
    const count = args.count ?? 5;
    const space = args.space ?? "hct";
    const includeDetails = args.includeDetails ?? true;

    const { colors, notes } = generateHarmonyPalette(base, {
      allowDisliked: args.allowDisliked ?? false,
      count,
      scheme: type,
      space,
    });

    const lines = colors.map((rgb, i) => {
      const hex = rgbToHex(rgb);
      if (!includeDetails) return `${i + 1}. ${hex}`;
      const p = profileColor(rgb);
      return `${i + 1}. ${hex} — ${p.name} (${p.temperature}, tone ${p.hct.t.toFixed(0)}, best text: ${p.bestText.recommendedHex})`;
    });

    let out = `Generated ${type} palette (${space.toUpperCase()}):\n${lines.join("\n")}`;
    if (notes.length > 0) {
      out += `\n\nNotes:\n${notes.map((n) => `- ${n}`).join("\n")}`;
    }
    return out;
  },
  name: "generate_palette",
  parameters: z.object({
    allowDisliked: z
      .boolean()
      .optional()
      .default(false)
      .describe("Allow dark yellow-green 'bile zone' colors (default false)"),
    baseColor: z.string().describe("Base color for palette generation"),
    count: z
      .number()
      .min(3)
      .max(12)
      .default(5)
      .describe("Number of colors to generate"),
    includeDetails: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Include perceptual name, temperature, tone, and best text ink for each swatch",
      ),
    space: z
      .enum(SPACES)
      .optional()
      .default("hct")
      .describe(
        "Wheel space: 'hct' (perceptual default), 'oklch' (CSS perceptual), 'ryb' (painter's red-yellow-blue wheel), or 'hsl'",
      ),
    type: z.enum(TYPES).default("analogous").describe("Type of color harmony"),
  }),
};
