/**
 * Contrast Checker Tool
 * Check contrast between two colors using WCAG 2.x luminance ratio,
 * APCA (WCAG 3 draft), or both.
 */

import { z } from "zod";

import { apcaContrast, apcaLevel } from "../color/apca.js";
import { getContrastRatio, parseColor } from "../color/index.js";

export const contrastCheckerTool = {
  description:
    "Check contrast between two colors. Supports WCAG 2.x luminance ratio (default), APCA Lc (WCAG 3 draft), or both algorithms side-by-side.",
  execute: async (args: {
    algorithm?: "apca" | "both" | "wcag";
    background: string;
    foreground: string;
  }) => {
    const fg = parseColor(args.foreground);
    const bg = parseColor(args.background);

    if (!fg || !bg) {
      return `Invalid color format: ${!fg ? args.foreground : args.background}`;
    }

    const algorithm = args.algorithm ?? "wcag";

    const wcagBlock = () => {
      const ratio = getContrastRatio(fg, bg);
      const aaLarge = ratio >= 3;
      const aa = ratio >= 4.5;
      const aaaLarge = ratio >= 4.5;
      const aaa = ratio >= 7;
      return `## WCAG 2.x luminance ratio
Contrast Ratio: ${ratio.toFixed(2)}:1
- AA (normal text):  ${aa ? "✓ Pass" : "✗ Fail"} (need 4.5:1)
- AA (large text):   ${aaLarge ? "✓ Pass" : "✗ Fail"} (need 3:1)
- AAA (normal text): ${aaa ? "✓ Pass" : "✗ Fail"} (need 7:1)
- AAA (large text):  ${aaaLarge ? "✓ Pass" : "✗ Fail"} (need 4.5:1)`;
    };

    const apcaBlock = () => {
      const lc = apcaContrast(fg, bg);
      const level = apcaLevel(lc);
      const polarity =
        lc > 0
          ? "dark text on light bg"
          : lc < 0
            ? "light text on dark bg"
            : "no contrast";
      return `## APCA (WCAG 3 draft)
Lc: ${lc.toFixed(1)} (${polarity})
- Body text (|Lc| ≥ 75):    ${level.body ? "✓ Pass" : "✗ Fail"}
- Content text (|Lc| ≥ 60): ${level.content ? "✓ Pass" : "✗ Fail"}
- Large text (|Lc| ≥ 45):   ${level.large ? "✓ Pass" : "✗ Fail"}
- Spot / non-content (|Lc| ≥ 30): ${level.spot ? "✓ Pass" : "✗ Fail"}`;
    };

    if (algorithm === "wcag") return wcagBlock();
    if (algorithm === "apca") return apcaBlock();
    return `${wcagBlock()}\n\n${apcaBlock()}`;
  },
  name: "check_contrast",
  parameters: z.object({
    algorithm: z
      .enum(["wcag", "apca", "both"])
      .optional()
      .default("wcag")
      .describe(
        "Contrast algorithm: 'wcag' (WCAG 2.x ratio), 'apca' (Lc, WCAG 3 draft), or 'both'",
      ),
    background: z.string().describe("Background color"),
    foreground: z.string().describe("Foreground/text color"),
  }),
};
