/**
 * MCP Tools for Dislike Color Analysis
 * Identifies and fixes universally disliked colors based on color psychology research
 */

import type { Tool } from "../types.js";

type McpTool = Tool<any>;

import { DislikeAnalyzer } from "../color/dislike/dislike-analyzer.js";
import { Hct } from "../color/hct/hct-class.js";
import { parseColor, rgbToArgb } from "../color/index.js";

/**
 * Analyze if a color is universally disliked
 */
export const analyzeColorLikabilityTool: McpTool = {
  description:
    "Check if a color is universally disliked (dark yellow-green associated with biological waste) and get a fixed version if needed",
  execute: async (args: unknown, _context: any) => {
    const { autoFix = true, color } = args as {
      autoFix?: boolean;
      color: string;
    };

    try {
      // Parse the input color
      const rgb = parseColor(color);
      if (!rgb) {
        return `Error: Invalid color format: ${color}`;
      }

      // Convert to HCT for analysis
      const argb = rgbToArgb(rgb);
      const hct = Hct.fromInt(argb);

      // Check if disliked
      const isDisliked = DislikeAnalyzer.isDisliked(hct);

      let output = `# Color Likability Analysis\n\n`;
      output += `## Input Color: ${color}\n\n`;
      output += `### HCT Values\n`;
      output += `- Hue: ${hct.hue.toFixed(1)}°\n`;
      output += `- Chroma: ${hct.chroma.toFixed(1)}\n`;
      output += `- Tone: ${hct.tone.toFixed(1)}\n\n`;

      output += `### Analysis Result\n`;

      if (isDisliked) {
        output += `⚠️ **This color is universally disliked**\n\n`;
        output += `This color falls in the "bile zone" - dark yellow-greens that are universally associated with biological waste and rotting food.\n\n`;
        output += `**Reason:**\n`;
        output += `- Hue is in yellow-green range (90-111°): ${Math.round(hct.hue)}°\n`;
        output += `- Chroma is above threshold (>16): ${Math.round(hct.chroma)}\n`;
        output += `- Tone is dark (<65): ${Math.round(hct.tone)}\n\n`;

        if (autoFix) {
          const fixed = DislikeAnalyzer.fixIfDisliked(hct);
          const fixedArgb = fixed.toInt();
          const fixedHex =
            "#" +
            [
              (fixedArgb >> 16) & 0xff,
              (fixedArgb >> 8) & 0xff,
              fixedArgb & 0xff,
            ]
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");

          output += `### Recommended Fix\n`;
          output += `**Fixed Color:** ${fixedHex}\n`;
          output += `- Hue: ${fixed.hue.toFixed(1)}° (preserved)\n`;
          output += `- Chroma: ${fixed.chroma.toFixed(1)} (preserved)\n`;
          output += `- Tone: ${fixed.tone.toFixed(1)} (lightened to 70)\n\n`;
          output += `The fix preserves the hue and saturation but lightens the color to make it more pleasant.\n`;
        }
      } else {
        output += `✅ **This color is likable**\n\n`;
        output += `This color does not fall in the universally disliked range.\n`;

        // Provide context about why it's liked
        if (Math.round(hct.hue) >= 90 && Math.round(hct.hue) <= 111) {
          if (Math.round(hct.chroma) <= 16) {
            output += `- Although in yellow-green hue range, the low chroma (${Math.round(hct.chroma)}) makes it neutral and acceptable.\n`;
          } else if (Math.round(hct.tone) >= 65) {
            output += `- Although in yellow-green hue range, the light tone (${Math.round(hct.tone)}) makes it pleasant.\n`;
          }
        } else {
          output += `- Hue (${Math.round(hct.hue)}°) is outside the problematic yellow-green range.\n`;
        }
      }

      return output;
    } catch (error) {
      return `Error analyzing color: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  inputSchema: {
    properties: {
      autoFix: {
        description:
          "Automatically return fixed version if disliked (default: true)",
        type: "boolean",
      },
      color: {
        description: "Color to analyze (hex, rgb, hsl, etc.)",
        type: "string",
      },
    },
    required: ["color"],
    type: "object",
  },
  name: "analyze_color_likability",
};

/**
 * Fix multiple disliked colors in a batch
 */
export const fixDislikedColorsBatchTool: McpTool = {
  description: "Analyze and fix multiple colors, returning only liked versions",
  execute: async (args: unknown, _context: any) => {
    const { colors, includeAnalysis = false } = args as {
      colors: string[];
      includeAnalysis?: boolean;
    };

    try {
      const results: Array<{
        error?: string;
        fixed?: string;
        hct?: unknown;
        original: string;
        wasDisliked?: boolean;
      }> = [];
      let dislikedCount = 0;

      for (const color of colors) {
        const rgb = parseColor(color);
        if (!rgb) {
          results.push({
            error: "Invalid color format",
            original: color,
          });
          continue;
        }

        const argb = rgbToArgb(rgb);
        const hct = Hct.fromInt(argb);
        const isDisliked = DislikeAnalyzer.isDisliked(hct);

        if (isDisliked) {
          dislikedCount++;
          const fixed = DislikeAnalyzer.fixIfDisliked(hct);
          const fixedArgb = fixed.toInt();
          const fixedHex =
            "#" +
            [
              (fixedArgb >> 16) & 0xff,
              (fixedArgb >> 8) & 0xff,
              fixedArgb & 0xff,
            ]
              .map((x) => x.toString(16).padStart(2, "0"))
              .join("");

          results.push({
            fixed: fixedHex,
            hct: includeAnalysis
              ? {
                  fixed: { c: fixed.chroma, h: fixed.hue, t: fixed.tone },
                  original: { c: hct.chroma, h: hct.hue, t: hct.tone },
                }
              : undefined,
            original: color,
            wasDisliked: true,
          });
        } else {
          results.push({
            fixed: color,
            hct: includeAnalysis
              ? {
                  c: hct.chroma,
                  h: hct.hue,
                  t: hct.tone,
                }
              : undefined,
            original: color,
            wasDisliked: false,
          });
        }
      }

      let output = `# Batch Color Likability Analysis\n\n`;
      output += `## Summary\n`;
      output += `- Total colors: ${colors.length}\n`;
      output += `- Disliked colors found: ${dislikedCount}\n`;
      output += `- Percentage disliked: ${((dislikedCount / colors.length) * 100).toFixed(1)}%\n\n`;

      output += `## Results\n\n`;

      for (const result of results) {
        if (result.error) {
          output += `- **${result.original}**: ❌ ${result.error}\n`;
        } else if (result.wasDisliked) {
          output += `- **${result.original}** → **${result.fixed}** (fixed)\n`;
          if (includeAnalysis && result.hct) {
            output += `  - Original HCT: (${result.hct.original.h.toFixed(0)}°, ${result.hct.original.c.toFixed(0)}, ${result.hct.original.t.toFixed(0)})\n`;
            output += `  - Fixed HCT: (${result.hct.fixed.h.toFixed(0)}°, ${result.hct.fixed.c.toFixed(0)}, ${result.hct.fixed.t.toFixed(0)})\n`;
          }
        } else {
          output += `- **${result.original}** ✓ (already liked)\n`;
          if (includeAnalysis && result.hct) {
            output += `  - HCT: (${result.hct.h.toFixed(0)}°, ${result.hct.c.toFixed(0)}, ${result.hct.t.toFixed(0)})\n`;
          }
        }
      }

      if (dislikedCount > 0) {
        output += `\n## Note\n`;
        output += `Disliked colors have been automatically fixed by lightening their tone to 70 while preserving hue and chroma. `;
        output += `This makes them more pleasant while maintaining their essential character.\n`;
      }

      return output;
    } catch (error) {
      return `Error processing colors: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  inputSchema: {
    properties: {
      colors: {
        description: "Array of colors to analyze (hex, rgb, hsl, etc.)",
        items: {
          type: "string",
        },
        type: "array",
      },
      includeAnalysis: {
        description:
          "Include detailed analysis for each color (default: false)",
        type: "boolean",
      },
    },
    required: ["colors"],
    type: "object",
  },
  name: "fix_disliked_colors_batch",
};
