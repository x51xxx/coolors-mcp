import { z } from "zod";

import { Hct } from "../color/hct/index.js";
import {
  hslToRgb,
  labToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "../color/index.js";
import { RGB } from "../color/types.js";

export const gradientGeneratorTool = {
  description:
    "Generate a smooth gradient between colors with multiple interpolation methods",
  execute: async (args: {
    colors: string[];
    easing?: "ease-in-out" | "ease-in" | "ease-out" | "linear";
    format?: "array" | "css-linear" | "css-radial" | "hex";
    interpolation?: "hct" | "hsl" | "lab" | "lch" | "rgb";
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
      return "Error: At least 2 colors are required for a gradient";
    }

    // Parse input colors
    const parsedColors: RGB[] = [];
    for (const color of colors) {
      const parsed = parseColor(color);
      if (!parsed) {
        return `Invalid color format: ${color}`;
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
    const segmentSteps = Math.floor(steps / (colors.length - 1));
    const extraSteps = steps % (colors.length - 1);

    for (let segment = 0; segment < colors.length - 1; segment++) {
      const start = parsedColors[segment];
      const end = parsedColors[segment + 1];
      const currentSteps = segmentSteps + (segment < extraSteps ? 1 : 0);

      for (let step = 0; step < currentSteps; step++) {
        const t = applyEasing(step / currentSteps);

        let interpolatedColor: RGB;

        switch (interpolation) {
          case "hct": {
            // HCT interpolation (Material Design color space)
            const startHct = Hct.fromInt(
              (255 << 24) | (start.r << 16) | (start.g << 8) | start.b,
            );
            const endHct = Hct.fromInt(
              (255 << 24) | (end.r << 16) | (end.g << 8) | end.b,
            );

            // Interpolate hue (shortest path)
            let hueDiff = endHct.hue - startHct.hue;
            if (hueDiff > 180) hueDiff -= 360;
            if (hueDiff < -180) hueDiff += 360;

            const interpolatedHct = Hct.from(
              (startHct.hue + hueDiff * t + 360) % 360,
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
            // HSL interpolation
            const startHsl = rgbToHsl(start);
            const endHsl = rgbToHsl(end);

            // Handle hue interpolation (shortest path)
            let hueDiff = endHsl.h - startHsl.h;
            if (hueDiff > 180) hueDiff -= 360;
            if (hueDiff < -180) hueDiff += 360;

            interpolatedColor = hslToRgb({
              h: (startHsl.h + hueDiff * t + 360) % 360,
              l: startHsl.l + (endHsl.l - startHsl.l) * t,
              s: startHsl.s + (endHsl.s - startHsl.s) * t,
            });
            break;
          }

          case "lab": {
            // LAB interpolation (perceptually uniform)
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
            // LCH interpolation (cylindrical LAB)
            const startLab = rgbToLab(start);
            const endLab = rgbToLab(end);

            // Convert LAB to LCH
            const startL = startLab.l;
            const startC = Math.sqrt(
              startLab.a * startLab.a + startLab.b * startLab.b,
            );
            const startH = (Math.atan2(startLab.b, startLab.a) * 180) / Math.PI;

            const endL = endLab.l;
            const endC = Math.sqrt(endLab.a * endLab.a + endLab.b * endLab.b);
            const endH = (Math.atan2(endLab.b, endLab.a) * 180) / Math.PI;

            // Interpolate in LCH
            let hueDiff = endH - startH;
            if (hueDiff > 180) hueDiff -= 360;
            if (hueDiff < -180) hueDiff += 360;

            const l = startL + (endL - startL) * t;
            const c = startC + (endC - startC) * t;
            const h = ((startH + hueDiff * t) * Math.PI) / 180;

            // Convert back to LAB then RGB
            interpolatedColor = labToRgb({
              a: c * Math.cos(h),
              b: c * Math.sin(h),
              l: l,
            });
            break;
          }

          case "rgb": {
            // Simple RGB interpolation
            interpolatedColor = {
              b: Math.round(start.b + (end.b - start.b) * t),
              g: Math.round(start.g + (end.g - start.g) * t),
              r: Math.round(start.r + (end.r - start.r) * t),
            };
            break;
          }

          default:
            interpolatedColor = start; // Fallback
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
      .describe("Colors to create gradient between (minimum 2)"),
    easing: z
      .enum(["linear", "ease-in", "ease-out", "ease-in-out"])
      .default("linear")
      .describe("Easing function for gradient transition"),
    format: z
      .enum(["hex", "css-linear", "css-radial", "array"])
      .default("array")
      .describe("Output format for the gradient"),
    interpolation: z
      .enum(["rgb", "hsl", "lab", "lch", "hct"])
      .default("lab")
      .describe(
        "Color space for interpolation (lab/lch/hct are perceptually smooth)",
      ),
    steps: z
      .number()
      .min(3)
      .max(100)
      .describe("Number of colors in the gradient"),
  }),
};
