/**
 * Palette Generator Tool
 * Generate color palettes from a base color
 */

import { z } from "zod";

import { parseColor, rgbToHex, rgbToHsl } from "../color/index.js";

export const paletteGeneratorTool = {
  description: "Generate a color palette from a base color",
  execute: async (args: {
    baseColor: string;
    count?: number;
    type?:
      | "analogous"
      | "complementary"
      | "monochromatic"
      | "tetradic"
      | "triadic";
  }) => {
    const base = parseColor(args.baseColor);
    if (!base) {
      return `Invalid color format: ${args.baseColor}`;
    }

    const type = args.type || "monochromatic";
    const count = args.count || 5;
    const hsl = rgbToHsl(base);
    const palette: string[] = [];

    switch (type) {
      case "analogous": {
        // Colors adjacent on the color wheel
        const step = 30;
        for (let i = 0; i < count; i++) {
          const h = (hsl.h + (i - Math.floor(count / 2)) * step + 360) % 360;
          const color = parseColor(`hsl(${h}, ${hsl.s}%, ${hsl.l}%)`);
          if (color) palette.push(rgbToHex(color));
        }
        break;
      }
      case "complementary": {
        // Base color and its complement
        palette.push(rgbToHex(base));
        const complement = parseColor(
          `hsl(${(hsl.h + 180) % 360}, ${hsl.s}%, ${hsl.l}%)`,
        );
        if (complement) palette.push(rgbToHex(complement));

        // Add variations
        for (let i = 2; i < count; i++) {
          const l = hsl.l + (i % 2 === 0 ? 20 : -20);
          const h = i < count / 2 ? hsl.h : (hsl.h + 180) % 360;
          const color = parseColor(
            `hsl(${h}, ${hsl.s}%, ${Math.max(10, Math.min(90, l))}%)`,
          );
          if (color) palette.push(rgbToHex(color));
        }
        break;
      }
      case "monochromatic": {
        // Generate different lightness values
        const step = 80 / (count - 1);
        for (let i = 0; i < count; i++) {
          const l = 10 + i * step;
          const color = parseColor(`hsl(${hsl.h}, ${hsl.s}%, ${l}%)`);
          if (color) palette.push(rgbToHex(color));
        }
        break;
      }
      case "tetradic": {
        // Four colors in rectangle on color wheel
        for (let i = 0; i < Math.min(4, count); i++) {
          const h = (hsl.h + i * 90) % 360;
          const color = parseColor(`hsl(${h}, ${hsl.s}%, ${hsl.l}%)`);
          if (color) palette.push(rgbToHex(color));
        }
        // Add variations for remaining colors
        for (let i = 4; i < count; i++) {
          const baseIdx = i % 4;
          const h = (hsl.h + baseIdx * 90) % 360;
          const l = hsl.l + (i < 8 ? 15 : -15);
          const color = parseColor(
            `hsl(${h}, ${hsl.s}%, ${Math.max(10, Math.min(90, l))}%)`,
          );
          if (color) palette.push(rgbToHex(color));
        }
        break;
      }
      case "triadic": {
        // Three colors evenly spaced on color wheel
        for (let i = 0; i < Math.min(3, count); i++) {
          const h = (hsl.h + i * 120) % 360;
          const color = parseColor(`hsl(${h}, ${hsl.s}%, ${hsl.l}%)`);
          if (color) palette.push(rgbToHex(color));
        }
        // Add variations for remaining colors
        for (let i = 3; i < count; i++) {
          const baseIdx = i % 3;
          const h = (hsl.h + baseIdx * 120) % 360;
          const l = hsl.l + (i < 6 ? 20 : -20);
          const color = parseColor(
            `hsl(${h}, ${hsl.s}%, ${Math.max(10, Math.min(90, l))}%)`,
          );
          if (color) palette.push(rgbToHex(color));
        }
        break;
      }
    }

    return `Generated ${type} palette:
${palette.map((color, i) => `${i + 1}. ${color}`).join("\n")}`;
  },
  name: "generate_palette",
  parameters: z.object({
    baseColor: z.string().describe("Base color for palette generation"),
    count: z
      .number()
      .min(3)
      .max(10)
      .default(5)
      .describe("Number of colors to generate"),
    type: z
      .enum([
        "monochromatic",
        "analogous",
        "complementary",
        "triadic",
        "tetradic",
      ])
      .default("monochromatic")
      .describe("Type of color palette"),
  }),
};
