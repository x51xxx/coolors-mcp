/**
 * Color Adjust / Mix Tool
 * Exposes the lighten/darken/saturate/desaturate/grayscale/invert/mix utilities
 * via MCP.
 */

import { z } from "zod";

import {
  darken,
  desaturate,
  invertColor,
  lighten,
  mixColors,
  parseColor,
  rgbToHex,
  saturate,
  toGrayscale,
} from "../color/index.js";

const OPS = [
  "lighten",
  "darken",
  "saturate",
  "desaturate",
  "grayscale",
  "invert",
  "mix",
] as const;

export const adjustColorTool = {
  description:
    "Adjust a color: lighten, darken, saturate, desaturate, grayscale, invert, or mix with a second color. Amount is 0-100 (percent) for lighten/darken/saturate/desaturate, 0-1 for mix weight.",
  execute: async (args: {
    amount?: number;
    color: string;
    operation: (typeof OPS)[number];
    with?: string;
  }) => {
    const rgb = parseColor(args.color);
    if (!rgb) return `Invalid color format: ${args.color}`;

    switch (args.operation) {
      case "darken":
        return rgbToHex(darken(rgb, args.amount ?? 10));
      case "desaturate":
        return rgbToHex(desaturate(rgb, args.amount ?? 10));
      case "grayscale":
        return rgbToHex(toGrayscale(rgb));
      case "invert":
        return rgbToHex(invertColor(rgb));
      case "lighten":
        return rgbToHex(lighten(rgb, args.amount ?? 10));
      case "mix": {
        if (!args.with) return "Error: 'with' is required for mix operation";
        const other = parseColor(args.with);
        if (!other) return `Invalid color format: ${args.with}`;
        const weight = args.amount ?? 0.5;
        if (weight < 0 || weight > 1) {
          return "Error: mix amount must be between 0 and 1";
        }
        return rgbToHex(mixColors(rgb, other, weight));
      }
      case "saturate":
        return rgbToHex(saturate(rgb, args.amount ?? 10));
    }
  },
  name: "adjust_color",
  parameters: z.object({
    amount: z
      .number()
      .optional()
      .describe(
        "Amount of change. For lighten/darken/saturate/desaturate: 0-100 (percent). For mix: 0-1 (weight of first color). Default 10 / 0.5.",
      ),
    color: z.string().describe("Color to adjust (hex, rgb, hsl)"),
    operation: z.enum(OPS).describe("Adjustment operation"),
    with: z.string().optional().describe("Second color (only for mix)"),
  }),
};
