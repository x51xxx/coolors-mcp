/**
 * Material Design Theme Tools
 * Tools for Material Design 3 color theme generation and management
 */

import { z } from "zod";

import {
  adjustTemperature,
  blend,
  corePaletteFromRgb,
  harmonize,
  parseColor,
  type RGB,
  rgbToHct,
  rgbToHex,
  TonalPalette,
} from "../color/index.js";

/**
 * Generate Material Design 3 Theme
 */
export const generateMaterialThemeTool = {
  description:
    "Generate a complete Material Design 3 color theme from a source color",
  execute: async (args: {
    includeCustomColors?: boolean;
    sourceColor: string;
  }) => {
    const source = parseColor(args.sourceColor);
    if (!source) {
      return `Invalid color format: ${args.sourceColor}`;
    }

    const corePalette = corePaletteFromRgb(source);

    // Generate key colors for light theme
    const lightTheme = {
      background: rgbToHex(corePalette.neutral.tone(99)),
      error: rgbToHex(corePalette.error.tone(40)),
      errorContainer: rgbToHex(corePalette.error.tone(90)),
      onBackground: rgbToHex(corePalette.neutral.tone(10)),

      onError: rgbToHex(corePalette.error.tone(100)),
      onErrorContainer: rgbToHex(corePalette.error.tone(10)),
      onPrimary: rgbToHex(corePalette.primary.tone(100)),
      onPrimaryContainer: rgbToHex(corePalette.primary.tone(10)),

      onSecondary: rgbToHex(corePalette.secondary.tone(100)),
      onSecondaryContainer: rgbToHex(corePalette.secondary.tone(10)),
      onSurface: rgbToHex(corePalette.neutral.tone(10)),
      onSurfaceVariant: rgbToHex(corePalette.neutralVariant.tone(30)),

      onTertiary: rgbToHex(corePalette.tertiary.tone(100)),
      onTertiaryContainer: rgbToHex(corePalette.tertiary.tone(10)),
      outline: rgbToHex(corePalette.neutralVariant.tone(50)),
      primary: rgbToHex(corePalette.primary.tone(40)),

      primaryContainer: rgbToHex(corePalette.primary.tone(90)),
      secondary: rgbToHex(corePalette.secondary.tone(40)),
      secondaryContainer: rgbToHex(corePalette.secondary.tone(90)),
      surface: rgbToHex(corePalette.neutral.tone(99)),

      surfaceVariant: rgbToHex(corePalette.neutralVariant.tone(90)),
      tertiary: rgbToHex(corePalette.tertiary.tone(40)),
      tertiaryContainer: rgbToHex(corePalette.tertiary.tone(90)),
    };

    // Generate key colors for dark theme
    const darkTheme = {
      background: rgbToHex(corePalette.neutral.tone(10)),
      error: rgbToHex(corePalette.error.tone(80)),
      errorContainer: rgbToHex(corePalette.error.tone(30)),
      onBackground: rgbToHex(corePalette.neutral.tone(90)),

      onError: rgbToHex(corePalette.error.tone(20)),
      onErrorContainer: rgbToHex(corePalette.error.tone(90)),
      onPrimary: rgbToHex(corePalette.primary.tone(20)),
      onPrimaryContainer: rgbToHex(corePalette.primary.tone(90)),

      onSecondary: rgbToHex(corePalette.secondary.tone(20)),
      onSecondaryContainer: rgbToHex(corePalette.secondary.tone(90)),
      onSurface: rgbToHex(corePalette.neutral.tone(90)),
      onSurfaceVariant: rgbToHex(corePalette.neutralVariant.tone(80)),

      onTertiary: rgbToHex(corePalette.tertiary.tone(20)),
      onTertiaryContainer: rgbToHex(corePalette.tertiary.tone(90)),
      outline: rgbToHex(corePalette.neutralVariant.tone(60)),
      primary: rgbToHex(corePalette.primary.tone(80)),

      primaryContainer: rgbToHex(corePalette.primary.tone(30)),
      secondary: rgbToHex(corePalette.secondary.tone(80)),
      secondaryContainer: rgbToHex(corePalette.secondary.tone(30)),
      surface: rgbToHex(corePalette.neutral.tone(10)),

      surfaceVariant: rgbToHex(corePalette.neutralVariant.tone(30)),
      tertiary: rgbToHex(corePalette.tertiary.tone(80)),
      tertiaryContainer: rgbToHex(corePalette.tertiary.tone(30)),
    };

    let result = `Material Design 3 Theme
Source Color: ${args.sourceColor}

LIGHT THEME:
${Object.entries(lightTheme)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join("\n")}

DARK THEME:
${Object.entries(darkTheme)
  .map(([key, value]) => `  ${key}: ${value}`)
  .join("\n")}`;

    if (args.includeCustomColors) {
      result += `\n\nTONAL PALETTES:
Primary: ${[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
        .map((t) => rgbToHex(corePalette.primary.tone(t)))
        .join(", ")}
Secondary: ${[40, 80].map((t) => rgbToHex(corePalette.secondary.tone(t))).join(", ")}
Tertiary: ${[40, 80].map((t) => rgbToHex(corePalette.tertiary.tone(t))).join(", ")}`;
    }

    return result;
  },
  name: "generate_material_theme",
  parameters: z.object({
    includeCustomColors: z
      .boolean()
      .optional()
      .default(false)
      .describe("Include custom color palettes"),
    sourceColor: z.string().describe("Source color for theme generation"),
  }),
};

/**
 * Harmonize Colors Tool
 */
export const harmonizeColorsTool = {
  description:
    "Harmonize colors to work better together using Material Design algorithms",
  execute: async (args: {
    colors: string[];
    factor?: number;
    method?: "blend" | "harmonize" | "temperature";
  }) => {
    const colors = args.colors.map((c) => parseColor(c));
    if (colors.some((c) => c === null)) {
      return "One or more invalid color formats";
    }

    const validColors = colors as RGB[];
    const method = args.method || "harmonize";
    const factor = args.factor || 0.5;
    const results: string[] = [];

    switch (method) {
      case "blend": {
        // Blend all colors together
        let result = validColors[0];
        for (let i = 1; i < validColors.length; i++) {
          result = blend(result, validColors[i], factor);
        }
        results.push(rgbToHex(result));
        break;
      }

      case "harmonize": {
        // Harmonize all colors with the first one
        const source = validColors[0];
        results.push(rgbToHex(source)); // Keep source unchanged

        for (let i = 1; i < validColors.length; i++) {
          results.push(rgbToHex(harmonize(validColors[i], source, factor)));
        }
        break;
      }

      case "temperature": {
        // Adjust temperature of all colors
        const amount = (factor - 0.5) * 2; // Convert to -1 to 1
        for (const color of validColors) {
          results.push(rgbToHex(adjustTemperature(color, amount)));
        }
        break;
      }
    }

    return `Harmonized Colors (${method}):
Original: ${args.colors.join(", ")}
Result: ${results.join(", ")}`;
  },
  name: "harmonize_colors",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(2)
      .max(10)
      .describe("Array of colors to harmonize"),
    factor: z
      .number()
      .min(0)
      .max(1)
      .optional()
      .default(0.5)
      .describe("Harmonization strength (0-1)"),
    method: z
      .enum(["blend", "harmonize", "temperature"])
      .optional()
      .default("harmonize")
      .describe("Harmonization method"),
  }),
};

/**
 * Generate Tonal Palette Tool
 */
export const generateTonalPaletteTool = {
  description: "Generate a Material Design tonal palette from a color",
  execute: async (args: { color: string; tones?: number[] }) => {
    const rgb = parseColor(args.color);
    if (!rgb) {
      return `Invalid color format: ${args.color}`;
    }

    const palette = TonalPalette.fromRgb(rgb);
    const tones = args.tones || [
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
    ];

    const hct = rgbToHct(rgb);
    const colors = tones.map((tone) => ({
      hex: rgbToHex(palette.tone(tone)),
      tone,
    }));

    return `Tonal Palette for ${args.color}
HCT: h=${hct.h.toFixed(1)}°, c=${hct.c.toFixed(1)}, t=${hct.t.toFixed(1)}

${colors.map(({ hex, tone }) => `Tone ${tone}: ${hex}`).join("\n")}`;
  },
  name: "generate_tonal_palette",
  parameters: z.object({
    color: z.string().describe("Base color for palette"),
    tones: z
      .array(z.number())
      .optional()
      .describe("Custom tone values (default: Material standard tones)"),
  }),
};
