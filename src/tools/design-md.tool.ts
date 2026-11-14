/**
 * DESIGN.md audit tool
 * Audits the color tokens of a DESIGN.md file (Google Labs format).
 */

import { z } from "zod";

import { auditDesignMd, formatDesignMdAudit } from "../color/design-md.js";
import { READ_ONLY_TOOL } from "./errors.js";

export const auditDesignMdTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Audit the color tokens of a DESIGN.md file (Google Labs design-system format: YAML front matter / ```yaml blocks with `colors` and `components`). Checks WCAG + APCA contrast for pairs declared in components (backgroundColor/textColor) and pairs inferred from token names (on-X ↔ X, text ↔ surface), color-blind collisions between accent/status colors, exact and near-duplicate tokens, disliked colors, broken {colors.x} references and a missing `primary`. Suggests same-hue fixes for failing pairs. Pass the file's full text.",
  execute: async (args: {
    cvdThreshold?: number;
    designMd: string;
    maxItems?: number;
    textThreshold?: number;
  }) => {
    const audit = auditDesignMd(args.designMd, {
      cvdThreshold: args.cvdThreshold,
      textThreshold: args.textThreshold,
    });
    return formatDesignMdAudit(audit, args.maxItems ?? 25);
  },
  name: "audit_design_md",
  parameters: z.object({
    cvdThreshold: z
      .number()
      .min(1)
      .max(30)
      .optional()
      .default(10)
      .describe(
        "ΔE2000 below which two accent/status colors count as indistinguishable under color-vision deficiency",
      ),
    designMd: z
      .string()
      .min(1)
      .max(500_000)
      .describe("Full text of the DESIGN.md file"),
    maxItems: z
      .number()
      .int()
      .min(5)
      .max(200)
      .optional()
      .default(25)
      .describe("Maximum rows listed per report section"),
    textThreshold: z
      .number()
      .min(3)
      .max(7)
      .optional()
      .default(4.5)
      .describe(
        "Minimum WCAG contrast for text pairs (4.5 = AA normal text, 7 = AAA)",
      ),
  }),
};
