/**
 * MCP tools for image color extraction
 */

import type { Tool } from "../types.js";

type ImageData = {
  data: number[] | Uint8ClampedArray;
  height: number;
  width: number;
};

type McpTool = Tool<unknown>;

import {
  extractColors,
  ExtractedColor,
  extractThemePalette,
} from "../color/extract-colors.js";
import { generateMaterialTheme } from "../color/material-theme.js";

/**
 * Extract dominant colors from image data
 */
export const extractImageColorsTool: McpTool = {
  description:
    "Extract dominant colors from an image. Input should be image data as an array of RGBA values.",
  execute: async (args: unknown, _context: unknown) => {
    const {
      format = "json",
      imageData,
      maxColors = 5,
      quality = "medium",
    } = args as {
      format?: string;
      imageData: ImageData;
      maxColors?: number;
      quality?: "high" | "low" | "medium";
    };

    try {
      // Convert data array to Uint8ClampedArray if needed
      const data =
        imageData.data instanceof Uint8ClampedArray
          ? imageData.data
          : new Uint8ClampedArray(imageData.data);

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
  inputSchema: {
    properties: {
      format: {
        description: "Output format: json, css, or palette (default: json)",
        enum: ["json", "css", "palette"],
        type: "string",
      },
      imageData: {
        description: "Image data with RGBA values",
        properties: {
          data: {
            description: "Flat array of RGBA values (0-255)",
            items: { type: "number" },
            type: "array",
          },
          height: {
            description: "Image height in pixels",
            type: "number",
          },
          width: {
            description: "Image width in pixels",
            type: "number",
          },
        },
        required: ["data", "width", "height"],
        type: "object",
      },
      maxColors: {
        description: "Maximum number of colors to extract (default: 5)",
        maximum: 20,
        minimum: 1,
        type: "number",
      },
      quality: {
        description:
          "Extraction quality: low, medium, or high (default: medium)",
        enum: ["low", "medium", "high"],
        type: "string",
      },
    },
    required: ["imageData"],
    type: "object",
  },
  name: "extract_image_colors",
};

/**
 * Generate a Material Design theme from an image
 */
export const generateThemeFromImageTool: McpTool = {
  description: "Generate a complete Material Design 3 theme from an image",
  execute: async (args: unknown, _context: unknown) => {
    const {
      imageData,
      includeCustomColors = true,
      isDark = false,
    } = args as {
      imageData: ImageData;
      includeCustomColors?: boolean;
      isDark?: boolean;
    };

    try {
      // Convert data array to Uint8ClampedArray if needed
      const data =
        imageData.data instanceof Uint8ClampedArray
          ? imageData.data
          : new Uint8ClampedArray(imageData.data);

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
  inputSchema: {
    properties: {
      imageData: {
        description: "Image data with RGBA values",
        properties: {
          data: {
            description: "Flat array of RGBA values (0-255)",
            items: { type: "number" },
            type: "array",
          },
          height: {
            description: "Image height in pixels",
            type: "number",
          },
          width: {
            description: "Image width in pixels",
            type: "number",
          },
        },
        required: ["data", "width", "height"],
        type: "object",
      },
      includeCustomColors: {
        description: "Include custom colors from image (default: true)",
        type: "boolean",
      },
      isDark: {
        description: "Generate dark theme (default: false for light theme)",
        type: "boolean",
      },
    },
    required: ["imageData"],
    type: "object",
  },
  name: "generate_theme_from_image",
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
