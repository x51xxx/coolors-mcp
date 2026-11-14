/**
 * Color Conversion Tool
 * Convert colors between different formats (hex, rgb, hsl, lab, hct, oklab, oklch)
 */

import { z } from "zod";

import {
  formatOklch,
  parseColor,
  rgbToHct,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  rgbToOklab,
  rgbToOklch,
} from "../color/index.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

export const colorConversionTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Convert colors between formats (hex, rgb, hsl, lab, hct, oklab, oklch). Accepts hex, CSS named colors, rgb(), hsl(), oklch(), oklab(), or hct().",
  execute: async (args: {
    color: string;
    to: "hct" | "hex" | "hsl" | "lab" | "oklab" | "oklch" | "rgb";
  }) => {
    const rgb = parseColor(args.color);
    if (!rgb) {
      throw new ToolInputError(`Invalid color format: ${args.color}`);
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
      case "oklab": {
        const oklab = rgbToOklab(rgb);
        return `oklab(${(oklab.l * 100).toFixed(1)}% ${oklab.a.toFixed(4)} ${oklab.b.toFixed(4)})`;
      }
      case "oklch": {
        return formatOklch(rgbToOklch(rgb));
      }
      case "rgb":
        return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
      default:
        throw new ToolInputError(`Invalid format: ${args.to}`);
    }
  },
  name: "convert_color",
  parameters: z.object({
    color: z
      .string()
      .describe(
        "Color to convert (hex, CSS name, rgb(), hsl(), oklch(), oklab(), or hct())",
      ),
    to: z
      .enum(["hex", "rgb", "hsl", "lab", "hct", "oklab", "oklch"])
      .describe("Target format"),
  }),
};
