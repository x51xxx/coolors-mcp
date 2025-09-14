/**
 * Contrast Checker Tool
 * Check WCAG contrast ratio between two colors
 */

import { z } from "zod";

import { getContrastRatio, parseColor } from "../color/index.js";

export const contrastCheckerTool = {
  description: "Check WCAG contrast ratio between two colors",
  execute: async (args: { background: string; foreground: string }) => {
    const fg = parseColor(args.foreground);
    const bg = parseColor(args.background);

    if (!fg || !bg) {
      return `Invalid color format: ${!fg ? args.foreground : args.background}`;
    }

    const ratio = getContrastRatio(fg, bg);
    const aa = ratio >= 4.5;
    const aaLarge = ratio >= 3;
    const aaa = ratio >= 7;
    const aaaLarge = ratio >= 4.5;

    return `Contrast Ratio: ${ratio.toFixed(2)}:1
WCAG AA: ${aa ? "✓ Pass" : "✗ Fail"} (normal text)
WCAG AA: ${aaLarge ? "✓ Pass" : "✗ Fail"} (large text)
WCAG AAA: ${aaa ? "✓ Pass" : "✗ Fail"} (normal text)
WCAG AAA: ${aaaLarge ? "✓ Pass" : "✗ Fail"} (large text)`;
  },
  name: "check_contrast",
  parameters: z.object({
    background: z.string().describe("Background color"),
    foreground: z.string().describe("Foreground/text color"),
  }),
};
