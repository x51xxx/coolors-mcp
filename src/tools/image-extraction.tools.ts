/**
 * MCP tools for image color extraction
 */

import { z } from "zod";

import {
  extractColors,
  ExtractedColor,
  extractThemePalette,
} from "../color/extract-colors.js";
import { generateMaterialTheme } from "../color/material-theme.js";

const imageDataSchema = z
  .object({
    data: z.array(z.number()).describe("Flat array of RGBA values (0-255)"),
    height: z.number().int().positive().describe("Image height in pixels"),
    width: z.number().int().positive().describe("Image width in pixels"),
  })
  .describe("Image data with RGBA values");

type ImageDataInput = z.infer<typeof imageDataSchema>;

/**
 * Extract dominant colors from image data
 */
export const extractImageColorsTool = {
  description:
    "Extract dominant colors from an image. Input should be image data as an array of RGBA values.",
  execute: async (args: {
    format?: "css" | "json" | "palette";
    imageData: ImageDataInput;
    maxColors?: number;
    quality?: "high" | "low" | "medium";
  }) => {
    const {
      format = "json",
      imageData,
      maxColors = 5,
      quality = "medium",
    } = args;

    try {
      const data = new Uint8ClampedArray(imageData.data);

      const processedImageData = {
        data,
        height: imageData.height,
        width: imageData.width,
      };

      // Extract colors
      const colors = extractColors(processedImageData, {
        filter: true,
        maxColors,
        quality,
        scoringEnabled: true,
      });

      // Format output based on requested format
      switch (format) {
        case "css":
          return formatAsCSS(colors);

        case "palette":
          return formatAsPalette(colors);

        case "json":
        default:
          return formatAsJSON(colors);
      }
    } catch (error) {
      return `Error extracting colors: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  name: "extract_image_colors",
  parameters: z.object({
    format: z
      .enum(["json", "css", "palette"])
      .optional()
      .default("json")
      .describe("Output format"),
    imageData: imageDataSchema,
    maxColors: z
      .number()
      .int()
      .min(1)
      .max(20)
      .optional()
      .default(5)
      .describe("Maximum number of colors to extract"),
    quality: z
      .enum(["low", "medium", "high"])
      .optional()
      .default("medium")
      .describe("Extraction quality"),
  }),
};

/**
 * Generate a Material Design theme from an image
 */
export const generateThemeFromImageTool = {
  description: "Generate a complete Material Design 3 theme from an image",
  execute: async (args: {
    imageData: ImageDataInput;
    includeCustomColors?: boolean;
    isDark?: boolean;
  }) => {
    const { imageData, includeCustomColors = true, isDark = false } = args;

    try {
      const data = new Uint8ClampedArray(imageData.data);

      const processedImageData = {
        data,
        height: imageData.height,
        width: imageData.width,
      };

      // Extract theme palette
      const palette = extractThemePalette(processedImageData);

      // Convert primary color to hex for theme generation
      const sourceColor = palette.primary.hex;

      // Generate Material theme
      const theme = generateMaterialTheme(sourceColor, { isDark });

      // Add custom colors from extracted palette
      if (includeCustomColors && palette.secondary) {
        theme.customColors = {
          secondary: {
            color: palette.secondary.hex,
            hct: palette.secondary.hct,
            population: palette.secondary.population,
          },
        };

        if (palette.tertiary) {
          theme.customColors.tertiary = {
            color: palette.tertiary.hex,
            hct: palette.tertiary.hct,
            population: palette.tertiary.population,
          };
        }
      }

      // Format output
      let output = `# Material Design 3 Theme from Image\n\n`;
      output += `## Source Colors\n`;
      output += `- Primary: ${palette.primary.hex} (${palette.primary.percentage.toFixed(1)}%)\n`;

      if (palette.secondary) {
        output += `- Secondary: ${palette.secondary.hex} (${palette.secondary.percentage.toFixed(1)}%)\n`;
      }
      if (palette.tertiary) {
        output += `- Tertiary: ${palette.tertiary.hex} (${palette.tertiary.percentage.toFixed(1)}%)\n`;
      }

      output += `\n## Theme Colors (${isDark ? "Dark" : "Light"} Mode)\n\n`;
      output += `### Primary\n`;
      output += `- primary: ${theme.schemes[isDark ? "dark" : "light"].primary}\n`;
      output += `- onPrimary: ${theme.schemes[isDark ? "dark" : "light"].onPrimary}\n`;
      output += `- primaryContainer: ${theme.schemes[isDark ? "dark" : "light"].primaryContainer}\n`;
      output += `- onPrimaryContainer: ${theme.schemes[isDark ? "dark" : "light"].onPrimaryContainer}\n`;

      output += `\n### Surface\n`;
      output += `- surface: ${theme.schemes[isDark ? "dark" : "light"].surface}\n`;
      output += `- onSurface: ${theme.schemes[isDark ? "dark" : "light"].onSurface}\n`;
      output += `- surfaceVariant: ${theme.schemes[isDark ? "dark" : "light"].surfaceVariant}\n`;
      output += `- onSurfaceVariant: ${theme.schemes[isDark ? "dark" : "light"].onSurfaceVariant}\n`;

      output += `\n### Background\n`;
      output += `- background: ${theme.schemes[isDark ? "dark" : "light"].background}\n`;
      output += `- onBackground: ${theme.schemes[isDark ? "dark" : "light"].onBackground}\n`;

      return output;
    } catch (error) {
      return `Error generating theme: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  name: "generate_theme_from_image",
  parameters: z.object({
    imageData: imageDataSchema,
    includeCustomColors: z
      .boolean()
      .optional()
      .default(true)
      .describe("Include custom colors from image"),
    isDark: z
      .boolean()
      .optional()
      .default(false)
      .describe("Generate dark theme (false for light theme)"),
  }),
};

// Helper functions for formatting

function formatAsCSS(colors: ExtractedColor[]): string {
  let css = ":root {\n";
  colors.forEach((color, index) => {
    css += `  --extracted-color-${index + 1}: ${color.hex}; /* ${color.percentage.toFixed(1)}% */\n`;
  });
  css += "}\n\n";

  css += "/* Color Details */\n";
  colors.forEach((color, index) => {
    css += `/* Color ${index + 1}: ${color.hex}\n`;
    css += `   RGB: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\n`;
    css += `   HCT: hct(${color.hct.h.toFixed(1)}, ${color.hct.c.toFixed(1)}, ${color.hct.t.toFixed(1)})\n`;
    css += `   Population: ${color.percentage.toFixed(1)}%\n`;
    css += `*/\n\n`;
  });

  return css;
}

function formatAsJSON(colors: ExtractedColor[]): string {
  return JSON.stringify(colors, null, 2);
}

function formatAsPalette(colors: ExtractedColor[]): string {
  let output = "# Extracted Color Palette\n\n";

  colors.forEach((color, index) => {
    output += `## Color ${index + 1}\n`;
    output += `- Hex: ${color.hex}\n`;
    output += `- RGB: rgb(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})\n`;
    output += `- HCT: H:${color.hct.h.toFixed(1)}° C:${color.hct.c.toFixed(1)} T:${color.hct.t.toFixed(1)}\n`;
    output += `- Usage: ${color.percentage.toFixed(1)}%\n\n`;
  });

  return output;
}
