/**
 * Color Adjust / Mix Tool
 * Supports perceptual (OKLCH/HCT) and classic (HSL/RGB) adjustments:
 * lighten, darken, saturate, desaturate, hue-shift, tint, shade, grayscale, invert, mix.
 */

import { z } from "zod";

import {
  argbToRgb,
  darken,
  desaturate,
  Hct,
  invertColor,
  lighten,
  mixColors,
  oklabToRgb,
  oklchToRgb,
  parseColor,
  rgbToArgb,
  rgbToHex,
  rgbToOklab,
  rgbToOklch,
  saturate,
  toGrayscale,
} from "../color/index.js";
import { RGB } from "../color/types.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

const OPS = [
  "lighten",
  "darken",
  "saturate",
  "desaturate",
  "hue-shift",
  "tint",
  "shade",
  "grayscale",
  "invert",
  "mix",
] as const;

const SPACES = ["oklch", "hct", "hsl"] as const;

export const adjustColorTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Adjust a color using perceptual (oklch, hct) or classic (hsl) math: lighten, darken, saturate, desaturate, hue-shift, tint (mix with white), shade (mix with black), grayscale, invert, or mix with a second color. Perceptual space ('oklch' default) prevents muddy mixes and hue drift.",
  execute: async (args: {
    amount?: number;
    color: string;
    operation: (typeof OPS)[number];
    space?: (typeof SPACES)[number];
    with?: string;
  }) => {
    const rgb = parseColor(args.color);
    if (!rgb) throw new ToolInputError(`Invalid color format: ${args.color}`);

    const space = args.space ?? "oklch";

    switch (args.operation) {
      case "darken": {
        const amt = args.amount ?? 10;
        if (space === "hsl") return rgbToHex(darken(rgb, amt));
        if (space === "hct") {
          const h = Hct.fromInt(rgbToArgb(rgb));
          const next = Hct.from(h.hue, h.chroma, Math.max(0, h.tone - amt));
          return rgbToHex(argbToRgb(next.toInt()));
        }
        const ok = rgbToOklch(rgb);
        return rgbToHex(
          oklchToRgb({ ...ok, l: Math.max(0, ok.l - amt / 100) }),
        );
      }

      case "desaturate": {
        const amt = args.amount ?? 10;
        if (space === "hsl") return rgbToHex(desaturate(rgb, amt));
        if (space === "hct") {
          const h = Hct.fromInt(rgbToArgb(rgb));
          const next = Hct.from(
            h.hue,
            Math.max(0, h.chroma * (1 - amt / 100)),
            h.tone,
          );
          return rgbToHex(argbToRgb(next.toInt()));
        }
        const ok = rgbToOklch(rgb);
        return rgbToHex(
          oklchToRgb({ ...ok, c: Math.max(0, ok.c * (1 - amt / 100)) }),
        );
      }

      case "grayscale":
        return rgbToHex(toGrayscale(rgb));

      case "hue-shift": {
        const deg = args.amount ?? 30;
        if (space === "hct") {
          const h = Hct.fromInt(rgbToArgb(rgb));
          const next = Hct.from(
            (((h.hue + deg) % 360) + 360) % 360,
            h.chroma,
            h.tone,
          );
          return rgbToHex(argbToRgb(next.toInt()));
        }
        const ok = rgbToOklch(rgb);
        return rgbToHex(
          oklchToRgb({ ...ok, h: (((ok.h + deg) % 360) + 360) % 360 }),
        );
      }

      case "invert":
        return rgbToHex(invertColor(rgb));

      case "lighten": {
        const amt = args.amount ?? 10;
        if (space === "hsl") return rgbToHex(lighten(rgb, amt));
        if (space === "hct") {
          const h = Hct.fromInt(rgbToArgb(rgb));
          const next = Hct.from(h.hue, h.chroma, Math.min(100, h.tone + amt));
          return rgbToHex(argbToRgb(next.toInt()));
        }
        const ok = rgbToOklch(rgb);
        return rgbToHex(
          oklchToRgb({ ...ok, l: Math.min(1, ok.l + amt / 100) }),
        );
      }

      case "mix": {
        if (!args.with)
          throw new ToolInputError(
            "Error: 'with' is required for mix operation",
          );
        const other = parseColor(args.with);
        if (!other)
          throw new ToolInputError(`Invalid color format: ${args.with}`);
        const weight = args.amount ?? 0.5;
        if (weight < 0 || weight > 1) {
          throw new ToolInputError("Error: mix amount must be between 0 and 1");
        }
        if (space === "hsl") {
          return rgbToHex(mixColors(rgb, other, weight));
        }
        // Perceptual OKLab mix avoids muddy gray midpoints (e.g., blue + yellow -> green)
        const lab1 = rgbToOklab(rgb);
        const lab2 = rgbToOklab(other);
        const w2 = 1 - weight;
        return rgbToHex(
          oklabToRgb({
            a: lab1.a * weight + lab2.a * w2,
            b: lab1.b * weight + lab2.b * w2,
            l: lab1.l * weight + lab2.l * w2,
          }),
        );
      }

      case "saturate": {
        const amt = args.amount ?? 10;
        if (space === "hsl") return rgbToHex(saturate(rgb, amt));
        if (space === "hct") {
          const h = Hct.fromInt(rgbToArgb(rgb));
          const next = Hct.from(h.hue, h.chroma * (1 + amt / 100), h.tone);
          return rgbToHex(argbToRgb(next.toInt()));
        }
        const ok = rgbToOklch(rgb);
        return rgbToHex(oklchToRgb({ ...ok, c: ok.c * (1 + amt / 100) }));
      }

      case "shade": {
        const amt = Math.max(0, Math.min(100, args.amount ?? 20)) / 100;
        const black: RGB = { b: 0, g: 0, r: 0 };
        const lab1 = rgbToOklab(rgb);
        const lab2 = rgbToOklab(black);
        return rgbToHex(
          oklabToRgb({
            a: lab1.a * (1 - amt) + lab2.a * amt,
            b: lab1.b * (1 - amt) + lab2.b * amt,
            l: lab1.l * (1 - amt) + lab2.l * amt,
          }),
        );
      }

      case "tint": {
        const amt = Math.max(0, Math.min(100, args.amount ?? 20)) / 100;
        const white: RGB = { b: 255, g: 255, r: 255 };
        const lab1 = rgbToOklab(rgb);
        const lab2 = rgbToOklab(white);
        return rgbToHex(
          oklabToRgb({
            a: lab1.a * (1 - amt) + lab2.a * amt,
            b: lab1.b * (1 - amt) + lab2.b * amt,
            l: lab1.l * (1 - amt) + lab2.l * amt,
          }),
        );
      }
    }
  },
  name: "adjust_color",
  parameters: z.object({
    amount: z
      .number()
      .optional()
      .describe(
        "Amount of change. Percent (0-100) for lighten/darken/saturate/desaturate/tint/shade, degrees (-360..360) for hue-shift, or 0-1 weight of first color for mix. Default 10 / 30 / 0.5.",
      ),
    color: z
      .string()
      .describe("Color to adjust (hex, CSS name, rgb, hsl, oklch)"),
    operation: z.enum(OPS).describe("Adjustment operation"),
    space: z
      .enum(SPACES)
      .optional()
      .default("oklch")
      .describe(
        "Color space for adjustment: 'oklch' (default, perceptually uniform), 'hct', or 'hsl'",
      ),
    with: z.string().optional().describe("Second color (only for mix)"),
  }),
};
