/**
 * Theme Matching Tools
 * Tools for matching colors to theme variables and refactoring CSS
 */

import { z } from "zod";

import { corePaletteFromRgb, parseColor, rgbToHex } from "../color/index.js";
import {
  type ColorContext,
  findBatchMatches,
  findClosestThemeColor,
  generateRefactoringReport,
  parseThemeVariables,
  refactorCss,
} from "../theme/index.js";

/**
 * Match Theme Color Tool
 */
export const matchThemeColorTool = {
  description: "Find the closest matching theme variable for a given color",
  execute: async (args: {
    color: string;
    context?: ColorContext;
    minConfidence?: number;
    themeCSS: string;
  }) => {
    // Parse theme variables from CSS
    const themeVariables = parseThemeVariables(args.themeCSS);

    // Find closest match
    const match = findClosestThemeColor(args.color, themeVariables, {
      contextType: args.context,
    });

    if (!match) {
      return "No matching theme variable found";
    }

    const minConfidence = args.minConfidence ?? 70;
    if (match.confidence < minConfidence) {
      return `Best match below confidence threshold:
Variable: ${match.variable}
Distance: ${match.distance.toFixed(2)}
Confidence: ${match.confidence}%

Consider adding a new theme variable for this color.`;
    }

    let result = `Best Match:
Variable: ${match.variable}
Value: ${match.value}
Distance: ${match.distance.toFixed(2)}
Confidence: ${match.confidence}%`;

    if (match.semanticRole) {
      result += `\nSemantic Role: ${match.semanticRole}`;
    }

    if (match.accessibilityInfo) {
      result += `\n\nAccessibility:
Contrast with background: ${match.accessibilityInfo.contrastWithBackground.toFixed(2)}
Contrast with foreground: ${match.accessibilityInfo.contrastWithForeground.toFixed(2)}
Meets AA: ${match.accessibilityInfo.meetsAA ? "Yes" : "No"}
Meets AAA: ${match.accessibilityInfo.meetsAAA ? "Yes" : "No"}`;
    }

    if (match.alternatives.length > 0) {
      result += `\n\nAlternatives:`;
      for (const alt of match.alternatives) {
        result += `\n- ${alt.variable} (confidence: ${alt.confidence}%)`;
      }
    }

    return result;
  },
  name: "match_theme_color",
  parameters: z.object({
    color: z.string().describe("Color to match (hex, rgb, hsl)"),
    context: z
      .enum(["text", "background", "border", "shadow", "accent", "decorative"])
      .optional()
      .describe("Usage context for better matching"),
    minConfidence: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .default(70)
      .describe("Minimum confidence threshold (0-100)"),
    themeCSS: z.string().describe("CSS containing theme variables"),
  }),
};

/**
 * Refactor CSS with Theme Tool
 */
export const refactorCssWithThemeTool = {
  description:
    "Refactor CSS to use theme variables instead of hardcoded colors",
  execute: async (args: {
    css: string;
    generateReport?: boolean;
    minConfidence?: number;
    preserveOriginal?: boolean;
    themeCSS: string;
  }) => {
    // Parse theme variables
    const themeVariables = parseThemeVariables(args.themeCSS);

    // Refactor CSS
    const result = refactorCss(args.css, themeVariables, {
      addComments: args.preserveOriginal ?? true,
      minConfidence: args.minConfidence ?? 70,
      preserveOriginal: args.preserveOriginal ?? true,
    });

    let output = `Refactoring Complete!

Statistics:
- Total colors found: ${result.statistics.totalColors}
- Colors replaced: ${result.statistics.replacedColors}
- Average confidence: ${result.statistics.averageConfidence}%
- Accessibility issues: ${result.statistics.accessibilityIssues}

Refactored CSS:
----------------------------------------
${result.refactored}
----------------------------------------`;

    if (result.warnings.length > 0) {
      output += `\n\nWarnings (${result.warnings.length}):`;
      for (const warning of result.warnings.slice(0, 5)) {
        output += `\n- ${warning.message}`;
        if (warning.suggestion) {
          output += `\n  Suggestion: ${warning.suggestion}`;
        }
      }
      if (result.warnings.length > 5) {
        output += `\n... and ${result.warnings.length - 5} more warnings`;
      }
    }

    if (args.generateReport) {
      output += `\n\n${generateRefactoringReport(result)}`;
    }

    return output;
  },
  name: "refactor_css_with_theme",
  parameters: z.object({
    css: z.string().describe("CSS content to refactor"),
    generateReport: z
      .boolean()
      .optional()
      .default(false)
      .describe("Generate detailed refactoring report"),
    minConfidence: z
      .number()
      .min(0)
      .max(100)
      .optional()
      .default(70)
      .describe("Minimum confidence for replacements"),
    preserveOriginal: z
      .boolean()
      .optional()
      .default(true)
      .describe("Keep original values as comments"),
    themeCSS: z.string().describe("CSS containing theme variables"),
  }),
};

/**
 * Match Theme Colors Batch Tool
 */
export const matchThemeColorsBatchTool = {
  description: "Find theme matches for multiple colors at once",
  execute: async (args: {
    colors: string[];
    context?: ColorContext;
    themeCSS: string;
  }) => {
    // Parse theme variables
    const themeVariables = parseThemeVariables(args.themeCSS);

    // Find matches for all colors
    const matches = findBatchMatches(args.colors, themeVariables, {
      contextType: args.context,
    });

    let result = `Theme Color Matches:\n`;
    let matchCount = 0;
    let totalConfidence = 0;

    for (const [color, match] of matches.entries()) {
      if (match) {
        matchCount++;
        totalConfidence += match.confidence;
        result += `\n${color} → ${match.variable} (${match.confidence}%)`;
      } else {
        result += `\n${color} → No match found`;
      }
    }

    result += `\n\nSummary:
- Matched: ${matchCount}/${args.colors.length}
- Average confidence: ${matchCount > 0 ? Math.round(totalConfidence / matchCount) : 0}%`;

    return result;
  },
  name: "match_theme_colors_batch",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(1)
      .max(50)
      .describe("Array of colors to match"),
    context: z
      .enum(["text", "background", "border", "shadow", "accent", "decorative"])
      .optional()
      .describe("Usage context for all colors"),
    themeCSS: z.string().describe("CSS containing theme variables"),
  }),
};

/**
 * Generate Theme CSS Tool
 */
export const generateThemeCssTool = {
  description:
    "Generate CSS custom properties for a complete theme from a source color",
  execute: async (args: {
    includeTones?: number[];
    prefix?: string;
    sourceColor: string;
  }) => {
    const source = parseColor(args.sourceColor);
    if (!source) {
      return `Invalid color format: ${args.sourceColor}`;
    }

    const corePalette = corePaletteFromRgb(source);
    const tones = args.includeTones || [
      0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
    ];
    const prefix = args.prefix || "color";

    let css = `:root {\n`;

    // Generate primary palette
    css += `  /* Primary Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.primary.tone(tone));
      css += `  --${prefix}-primary-${tone}: ${color};\n`;
    }

    // Generate secondary palette
    css += `\n  /* Secondary Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.secondary.tone(tone));
      css += `  --${prefix}-secondary-${tone}: ${color};\n`;
    }

    // Generate tertiary palette
    css += `\n  /* Tertiary Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.tertiary.tone(tone));
      css += `  --${prefix}-tertiary-${tone}: ${color};\n`;
    }

    // Generate error palette
    css += `\n  /* Error Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.error.tone(tone));
      css += `  --${prefix}-error-${tone}: ${color};\n`;
    }

    // Generate neutral palette
    css += `\n  /* Neutral Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.neutral.tone(tone));
      css += `  --${prefix}-neutral-${tone}: ${color};\n`;
    }

    // Generate neutral variant palette
    css += `\n  /* Neutral Variant Colors */\n`;
    for (const tone of tones) {
      const color = rgbToHex(corePalette.neutralVariant.tone(tone));
      css += `  --${prefix}-neutral-variant-${tone}: ${color};\n`;
    }

    css += `}\n\n`;

    // Add semantic mappings
    css += `/* Semantic Color Mappings (Light Theme) */\n`;
    css += `:root {\n`;
    css += `  --${prefix}-primary: var(--${prefix}-primary-40);\n`;
    css += `  --${prefix}-on-primary: var(--${prefix}-primary-100);\n`;
    css += `  --${prefix}-primary-container: var(--${prefix}-primary-90);\n`;
    css += `  --${prefix}-on-primary-container: var(--${prefix}-primary-10);\n`;
    css += `  \n`;
    css += `  --${prefix}-secondary: var(--${prefix}-secondary-40);\n`;
    css += `  --${prefix}-on-secondary: var(--${prefix}-secondary-100);\n`;
    css += `  --${prefix}-secondary-container: var(--${prefix}-secondary-90);\n`;
    css += `  --${prefix}-on-secondary-container: var(--${prefix}-secondary-10);\n`;
    css += `  \n`;
    css += `  --${prefix}-background: var(--${prefix}-neutral-99);\n`;
    css += `  --${prefix}-on-background: var(--${prefix}-neutral-10);\n`;
    css += `  --${prefix}-surface: var(--${prefix}-neutral-99);\n`;
    css += `  --${prefix}-on-surface: var(--${prefix}-neutral-10);\n`;
    css += `}\n`;

    return css;
  },
  name: "generate_theme_css",
  parameters: z.object({
    includeTones: z
      .array(z.number())
      .optional()
      .describe(
        "Tone values to include (default: 0,10,20,30,40,50,60,70,80,90,95,99,100)",
      ),
    prefix: z
      .string()
      .optional()
      .default("color")
      .describe(
        "Prefix for CSS variables (e.g., 'color' → --color-primary-50)",
      ),
    sourceColor: z.string().describe("Source color for theme generation"),
  }),
};
