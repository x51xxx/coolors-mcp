/**
 * Color Distance Tool
 * Calculate perceptual distance between two colors using various metrics
 */

import { z } from "zod";

import { colorDistance, parseColor } from "../color/index.js";

export const colorDistanceTool = {
  description:
    "Calculate perceptual distance between two colors using Delta E 2000",
  execute: async (args: {
    color1: string;
    color2: string;
    metric?: "deltaE2000" | "deltaE76" | "deltaE94" | "euclidean" | "weighted";
  }) => {
    const rgb1 = parseColor(args.color1);
    const rgb2 = parseColor(args.color2);

    if (!rgb1 || !rgb2) {
      return `Invalid color format: ${!rgb1 ? args.color1 : args.color2}`;
    }

    const distance = colorDistance(rgb1, rgb2, {
      metric: args.metric || "deltaE2000",
    });

    return `Distance between ${args.color1} and ${args.color2}: ${distance.toFixed(2)}`;
  },
  name: "color_distance",
  parameters: z.object({
    color1: z.string().describe("First color (hex, rgb, or hsl)"),
    color2: z.string().describe("Second color (hex, rgb, or hsl)"),
    metric: z
      .enum(["euclidean", "deltaE76", "deltaE94", "deltaE2000", "weighted"])
      .optional()
      .default("deltaE2000")
      .describe("Distance metric to use"),
  }),
};
