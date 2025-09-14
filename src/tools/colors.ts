import { formatHex, formatHsl, formatRgb, parse } from "culori";
import { z } from "zod";

import { ColorFormat } from "../constants.js";

export const convertColor = {
  description: "Convert a color from one format to another",
  execute: async (args: { color: string; to?: ColorFormat }) => {
    const { color, to = ColorFormat.HEX } = args;
    const parsed = parse(color);
    if (!parsed) {
      throw new Error(`Invalid color: ${color}`);
    }

    switch (to) {
      case ColorFormat.HEX:
        return formatHex(parsed);
      case ColorFormat.HSL:
        return formatHsl(parsed);
      case ColorFormat.RGB:
        return formatRgb(parsed);
      default:
        throw new Error(`Invalid output format: ${to}`);
    }
  },
  name: "convertColor",
  parameters: z.object({
    color: z.string().describe("The color to convert"),
    to: z.nativeEnum(ColorFormat).optional().describe("The output format"),
  }),
};
