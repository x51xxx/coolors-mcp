import { z } from "zod";

import { Hct } from "../color/hct/index.js";
import {
  hslToRgb,
  labToRgb,
  oklabToRgb,
  oklchToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  rgbToOklab,
  rgbToOklch,
} from "../color/index.js";
import { RGB } from "../color/types.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

function interpolateHue(startHue: number, endHue: number, t: number): number {
  let hueDiff = endHue - startHue;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;
  return (startHue + hueDiff * t + 360) % 360;
}

export const gradientGeneratorTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Generate a smooth gradient between colors with multiple interpolation methods (oklch, oklab, lab, lch, hct, hsl, rgb)",
  execute: async (args: {
    colors: string[];
    easing?: "ease-in-out" | "ease-in" | "ease-out" | "linear";
    format?: "array" | "css-linear" | "css-radial" | "hex";
    interpolation?: "hct" | "hsl" | "lab" | "lch" | "oklab" | "oklch" | "rgb";
    steps: number;
  }) => {
    const {
      colors,
      easing = "linear",
      format = "array",
      interpolation = "lab",
      steps,
    } = args;

    if (colors.length < 2) {
      throw new ToolInputError(
        "Error: At least 2 colors are required for a gradient",
      );
    }

    // Parse input colors
    const parsedColors: RGB[] = [];
    for (const color of colors) {
      const parsed = parseColor(color);
      if (!parsed) {
        throw new ToolInputError(`Invalid color format: ${color}`);
      }
      parsedColors.push(parsed);
    }

    // Apply easing function
    const applyEasing = (t: number): number => {
      switch (easing) {
        case "ease-in":
          return t * t;
        case "ease-in-out":
          return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        case "ease-out":
          return t * (2 - t);
        default:
          return t;
      }
    };

    // Generate gradient colors
    const gradient: RGB[] = [];
    // `steps` is the total number of output colors; every input color is a
    // stop, so there are (steps - 1) intervals spread across the segments.
    if (steps < colors.length) {
      throw new ToolInputError(
        `steps (${steps}) must be at least the number of input colors (${colors.length})`,
      );
    }
    const intervals = steps - 1;
    const segmentSteps = Math.floor(intervals / (colors.length - 1));
    const extraSteps = intervals % (colors.length - 1);

    for (let segment = 0; segment < colors.length - 1; segment++) {
      const start = parsedColors[segment];
      const end = parsedColors[segment + 1];
      const currentSteps = segmentSteps + (segment < extraSteps ? 1 : 0);

      for (let step = 0; step < currentSteps; step++) {
        const t = applyEasing(step / currentSteps);

        let interpolatedColor: RGB;

        switch (interpolation) {
          case "hct": {
            const startHct = Hct.fromInt(
              (255 << 24) | (start.r << 16) | (start.g << 8) | start.b,
            );
            const endHct = Hct.fromInt(
              (255 << 24) | (end.r << 16) | (end.g << 8) | end.b,
            );

            // CAM16 hue is meaningless for near-greys: borrow the other end's
            const interpolatedHct = Hct.from(
              startHct.chroma < 4
                ? endHct.hue
                : endHct.chroma < 4
                  ? startHct.hue
                  : interpolateHue(startHct.hue, endHct.hue, t),
              startHct.chroma + (endHct.chroma - startHct.chroma) * t,
              startHct.tone + (endHct.tone - startHct.tone) * t,
            );

            const argb = interpolatedHct.toInt();
            interpolatedColor = {
              b: argb & 0xff,
              g: (argb >> 8) & 0xff,
              r: (argb >> 16) & 0xff,
            };
            break;
          }

          case "hsl": {
            const startHsl = rgbToHsl(start);
            const endHsl = rgbToHsl(end);

            interpolatedColor = hslToRgb({
              h: interpolateHue(startHsl.h, endHsl.h, t),
              l: startHsl.l + (endHsl.l - startHsl.l) * t,
              s: startHsl.s + (endHsl.s - startHsl.s) * t,
            });
            break;
          }

          case "lab": {
            const startLab = rgbToLab(start);
            const endLab = rgbToLab(end);

            interpolatedColor = labToRgb({
              a: startLab.a + (endLab.a - startLab.a) * t,
              b: startLab.b + (endLab.b - startLab.b) * t,
              l: startLab.l + (endLab.l - startLab.l) * t,
            });
            break;
          }

          case "lch": {
            const startLab = rgbToLab(start);
            const endLab = rgbToLab(end);

            const startL = startLab.l;
            const startC = Math.sqrt(
              startLab.a * startLab.a + startLab.b * startLab.b,
            );
            const startH = (Math.atan2(startLab.b, startLab.a) * 180) / Math.PI;

            const endL = endLab.l;
            const endC = Math.sqrt(endLab.a * endLab.a + endLab.b * endLab.b);
            const endH = (Math.atan2(endLab.b, endLab.a) * 180) / Math.PI;

            const l = startL + (endL - startL) * t;
            const c = startC + (endC - startC) * t;
            // Achromatic endpoint: its hue is powerless, use the other one's
            const hue =
              startC < 2
                ? endH
                : endC < 2
                  ? startH
                  : interpolateHue(startH, endH, t);
            const h = (hue * Math.PI) / 180;

            interpolatedColor = labToRgb({
              a: c * Math.cos(h),
              b: c * Math.sin(h),
              l,
            });
            break;
          }

          case "oklab": {
            const startOk = rgbToOklab(start);
            const endOk = rgbToOklab(end);
            interpolatedColor = oklabToRgb({
              a: startOk.a + (endOk.a - startOk.a) * t,
              b: startOk.b + (endOk.b - startOk.b) * t,
              l: startOk.l + (endOk.l - startOk.l) * t,
            });
            break;
          }

          case "oklch": {
            const startOk = rgbToOklch(start);
            const endOk = rgbToOklch(end);
            // If either endpoint is achromatic, keep the chromatic endpoint's hue
            const h =
              startOk.c < 0.01
                ? endOk.h
                : endOk.c < 0.01
                  ? startOk.h
                  : interpolateHue(startOk.h, endOk.h, t);
            interpolatedColor = oklchToRgb({
              c: startOk.c + (endOk.c - startOk.c) * t,
              h,
              l: startOk.l + (endOk.l - startOk.l) * t,
            });
            break;
          }

          case "rgb": {
            interpolatedColor = {
              b: Math.round(start.b + (end.b - start.b) * t),
              g: Math.round(start.g + (end.g - start.g) * t),
              r: Math.round(start.r + (end.r - start.r) * t),
            };
            break;
          }

          default:
            interpolatedColor = start;
        }

        gradient.push(interpolatedColor);
      }
    }

    // Add the last color
    gradient.push(parsedColors[parsedColors.length - 1]);

    // Format output
    const hexColors = gradient.map(rgbToHex);

    switch (format) {
      case "css-linear": {
        const stops = hexColors.map((color, i) => {
          const percent = (i / (hexColors.length - 1)) * 100;
          return `${color} ${percent.toFixed(1)}%`;
        });
        return `linear-gradient(90deg, ${stops.join(", ")})`;
      }

      case "css-radial": {
        const stops = hexColors.map((color, i) => {
          const percent = (i / (hexColors.length - 1)) * 100;
          return `${color} ${percent.toFixed(1)}%`;
        });
        return `radial-gradient(circle, ${stops.join(", ")})`;
      }

      case "hex":
        return hexColors.join(", ");

      case "array":
      default:
        return `Generated gradient with ${steps} steps:
${hexColors.map((color, i) => `${i + 1}. ${color}`).join("\n")}

Interpolation: ${interpolation}
Easing: ${easing}
Input colors: ${colors.join(" → ")}`;
    }
  },
  name: "generate_gradient",
  parameters: z.object({
    colors: z
      .array(z.string())
      .min(2)
      .max(32)
      .describe("Colors to create gradient between (2-32)"),
    easing: z
      .enum(["linear", "ease-in", "ease-out", "ease-in-out"])
      .default("linear")
      .describe("Easing function for gradient transition"),
    format: z
      .enum(["hex", "css-linear", "css-radial", "array"])
      .default("array")
      .describe("Output format for the gradient"),
    interpolation: z
      .enum(["rgb", "hsl", "lab", "lch", "hct", "oklab", "oklch"])
      .default("lab")
      .describe(
        "Color space for interpolation (oklch/oklab/lab/lch/hct are perceptually smooth)",
      ),
    steps: z
      .number()
      .min(3)
      .max(100)
      .describe(
        "Total number of colors in the gradient, including every input color (must be ≥ number of colors)",
      ),
  }),
};
