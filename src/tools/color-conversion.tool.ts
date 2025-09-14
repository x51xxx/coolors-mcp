/**
 * Color Conversion Tool
 * Convert colors between different formats (hex, rgb, hsl, lab, hct)
 */

import { z } from "zod";

import {
  parseColor,
  rgbToHct,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "../color/index.js";

export const colorConversionTool = {
  description:
    "Convert colors between different formats (hex, rgb, hsl, lab, hct)",
  execute: async (args: {
    color: string;
    to: "hct" | "hex" | "hsl" | "lab" | "rgb";
  }) => {
    const rgb = parseColor(args.color);
    if (!rgb) {
      return `Invalid color format: ${args.color}`;
    }

    switch (args.to) {
      case "hct": {
        const hct = rgbToHct(rgb);
        return `hct(${hct.h.toFixed(1)}, ${hct.c.toFixed(1)}, ${hct.t.toFixed(1)})`;
      }
      case "hex":
        return rgbToHex(rgb);
      case "hsl": {
        const hsl = rgbToHsl(rgb);
        return `hsl(${Math.round(hsl.h)}, ${Math.round(hsl.s)}%, ${Math.round(hsl.l)}%)`;
      }
      case "lab": {
        const lab = rgbToLab(rgb);
        return `lab(${lab.l.toFixed(2)}, ${lab.a.toFixed(2)}, ${lab.b.toFixed(2)})`;
      }
      case "rgb":
        return `rgb(${Math.round(rgb.r * 255)}, ${Math.round(rgb.g * 255)}, ${Math.round(rgb.b * 255)})`;
      default:
        return `Invalid format: ${args.to}`;
    }
  },
  name: "convert_color",
  parameters: z.object({
    color: z.string().describe("Color to convert (hex, rgb(), or hsl())"),
    to: z.enum(["hex", "rgb", "hsl", "lab", "hct"]).describe("Target format"),
  }),
};
