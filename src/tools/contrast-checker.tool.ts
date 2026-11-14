/**
 * Contrast Checker Tool
 * Check contrast between two colors using WCAG 2.x luminance ratio,
 * APCA (WCAG 3 draft), or both — plus automatic fix & CVD contrast notes.
 */

import { z } from "zod";

import { apcaContrast, apcaLevel } from "../color/apca.js";
import {
  auditColorPair,
  getContrastRatio,
  parseColor,
  rgbToHex,
} from "../color/index.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

export const contrastCheckerTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Check contrast between two colors using WCAG 2.x luminance ratio, APCA Lc (WCAG 3 draft), or both. Also checks color-blindness contrast drops and suggests an exact hue-preserving fix if contrast fails.",
  execute: async (args: {
    algorithm?: "apca" | "both" | "wcag";
    background: string;
    foreground: string;
    suggestFix?: boolean;
  }) => {
    const fg = parseColor(args.foreground);
    const bg = parseColor(args.background);

    if (!fg || !bg) {
      throw new ToolInputError(
        `Invalid color format: ${!fg ? args.foreground : args.background}`,
      );
    }

    const algorithm = args.algorithm ?? "wcag";
    const suggestFix = args.suggestFix ?? true;

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

    let body: string;
    if (algorithm === "wcag") body = wcagBlock();
    else if (algorithm === "apca") body = apcaBlock();
    else body = `${wcagBlock()}\n\n${apcaBlock()}`;

    if (suggestFix) {
      const audit = auditColorPair(fg, bg, "body");
      const extra: string[] = [];
      if (audit.fixSuggestion && audit.fixSuggestion.achieved) {
        const fx = audit.fixSuggestion;
        extra.push(
          `- **Nearest AA fix (hue-preserving)**: foreground \`${rgbToHex(fx.foregroundAfter)}\` on \`${rgbToHex(fx.backgroundAfter)}\` → ${fx.wcagAfter.toFixed(2)}:1 (APCA Lc ${fx.apcaLcAfter.toFixed(1)}, ΔE=${fx.deltaE.toFixed(1)})`,
        );
      }
      if (audit.chromostereopsisRisk) {
        extra.push(
          "- **Optical vibration warning**: High-chroma opposing hues may vibrate visually; soften chroma of bg or fg.",
        );
      }
      if (audit.cvdIssues.length > 0) {
        const list = audit.cvdIssues
          .map((i) => `${i.type}: ${i.simulatedWcag.toFixed(2)}:1`)
          .join(", ");
        extra.push(
          `- **Color-blindness warning**: Contrast drops under ${list}.`,
        );
      }
      if (extra.length > 0) {
        body += `\n\n## Agent Guidance\n${extra.join("\n")}`;
      }
    }

    return body;
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
    suggestFix: z
      .boolean()
      .optional()
      .default(true)
      .describe(
        "Include nearest hue-preserving AA fix and CVD/optical warnings when issues exist",
      ),
  }),
};
