import { z } from "zod";

import {
  colorDistance,
  hslToRgb,
  labToRgb,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "../color/index.js";
import { HSL, RGB } from "../color/types.js";

export const paletteWithLocksTool = {
  description:
    "Generate a color palette while preserving specific locked colors",
  execute: async (args: {
    colorSpace?: "hsl" | "lab";
    lockedColors: string[];
    mode?: "contrast" | "gradient" | "harmony";
    totalColors: number;
  }) => {
    const {
      colorSpace = "hsl",
      lockedColors,
      mode = "harmony",
      totalColors,
    } = args;

    if (lockedColors.length >= totalColors) {
      return `Error: Number of locked colors (${lockedColors.length}) must be less than total colors (${totalColors})`;
    }

    // Parse and validate locked colors
    const parsedLocked: RGB[] = [];
    for (const color of lockedColors) {
      const parsed = parseColor(color);
      if (!parsed) {
        return `Invalid color format: ${color}`;
      }
      parsedLocked.push(parsed);
    }

    const palette: string[] = [];
    const remainingSlots = totalColors - lockedColors.length;

    // Add locked colors to palette
    lockedColors.forEach((color) => palette.push(color));

    switch (mode) {
      case "contrast": {
        // Generate contrasting colors
        for (let i = 0; i < remainingSlots; i++) {
          let bestColor: null | RGB = null;
          let maxMinDistance = 0;

          // Try random colors and pick the one with maximum minimum distance
          for (let attempt = 0; attempt < 100; attempt++) {
            const candidate: RGB = {
              b: Math.floor(Math.random() * 256),
              g: Math.floor(Math.random() * 256),
              r: Math.floor(Math.random() * 256),
            };

            let minDistance = Infinity;
            for (const locked of parsedLocked) {
              const dist = colorDistance(candidate, locked, "deltaE2000");
              if (dist < minDistance) minDistance = dist;
            }

            if (minDistance > maxMinDistance) {
              maxMinDistance = minDistance;
              bestColor = candidate;
            }
          }

          if (bestColor) {
            palette.push(rgbToHex(bestColor));
            parsedLocked.push(bestColor);
          }
        }
        break;
      }

      case "gradient": {
        // Create gradient between locked colors
        if (parsedLocked.length < 2) {
          return "Gradient mode requires at least 2 locked colors";
        }

        const steps = Math.floor(remainingSlots / (parsedLocked.length - 1));

        for (let i = 0; i < parsedLocked.length - 1; i++) {
          const start = parsedLocked[i];
          const end = parsedLocked[i + 1];

          for (let step = 1; step <= steps; step++) {
            const t = step / (steps + 1);

            if (colorSpace === "lab") {
              // Interpolate in LAB space
              const startLab = rgbToLab(start);
              const endLab = rgbToLab(end);

              const interpolated = labToRgb({
                a: startLab.a + (endLab.a - startLab.a) * t,
                b: startLab.b + (endLab.b - startLab.b) * t,
                l: startLab.l + (endLab.l - startLab.l) * t,
              });

              palette.push(rgbToHex(interpolated));
            } else {
              // Interpolate in HSL space
              const startHsl = rgbToHsl(start);
              const endHsl = rgbToHsl(end);

              // Handle hue interpolation (shortest path)
              let hueDiff = endHsl.h - startHsl.h;
              if (hueDiff > 180) hueDiff -= 360;
              if (hueDiff < -180) hueDiff += 360;

              const interpolated = hslToRgb({
                h: (startHsl.h + hueDiff * t + 360) % 360,
                l: startHsl.l + (endHsl.l - startHsl.l) * t,
                s: startHsl.s + (endHsl.s - startHsl.s) * t,
              });

              palette.push(rgbToHex(interpolated));
            }
          }
        }
        break;
      }

      case "harmony": {
        // Generate harmonious colors based on locked colors
        const baseHsl = rgbToHsl(parsedLocked[0]);
        const hueStep = 360 / totalColors;

        for (let i = 0; i < remainingSlots; i++) {
          let newHue = baseHsl.h;
          let attempts = 0;
          let bestColor: null | RGB = null;
          let maxMinDistance = 0;

          // Try different hues to find one that's not too close to locked colors
          while (attempts < 36) {
            newHue = (baseHsl.h + attempts * 10) % 360;
            const candidate = hslToRgb({
              h: newHue,
              l: baseHsl.l + (Math.random() - 0.5) * 20,
              s: baseHsl.s + (Math.random() - 0.5) * 20,
            });

            // Check minimum distance to all locked colors
            let minDistance = Infinity;
            for (const locked of parsedLocked) {
              const dist = colorDistance(candidate, locked, "deltaE2000");
              if (dist < minDistance) minDistance = dist;
            }

            // Keep the candidate with the largest minimum distance
            if (minDistance > maxMinDistance && minDistance > 10) {
              maxMinDistance = minDistance;
              bestColor = candidate;
            }

            attempts++;
          }

          if (bestColor) {
            palette.push(rgbToHex(bestColor));
            parsedLocked.push(bestColor); // Add to locked for next iteration
          }
        }
        break;
      }
    }

    // Sort palette to have locked colors marked
    const result: string[] = [];
    const lockedSet = new Set(lockedColors.map((c) => c.toLowerCase()));

    palette.forEach((color) => {
      if (lockedSet.has(color.toLowerCase())) {
        result.push(`${color} (locked)`);
      } else {
        result.push(color);
      }
    });

    return `Generated palette with ${lockedColors.length} locked colors:
${result.map((color, i) => `${i + 1}. ${color}`).join("\n")}

Mode: ${mode}
Color space: ${colorSpace}
Total colors: ${totalColors}`;
  },
  name: "generate_palette_with_locks",
  parameters: z.object({
    colorSpace: z
      .enum(["hsl", "lab"])
      .default("hsl")
      .describe("Color space for interpolation (affects gradient smoothness)"),
    lockedColors: z
      .array(z.string())
      .min(1)
      .describe("Colors that must be included in the palette"),
    mode: z
      .enum(["harmony", "contrast", "gradient"])
      .default("harmony")
      .describe(
        "Generation mode: harmony (similar), contrast (different), or gradient (smooth transition)",
      ),
    totalColors: z
      .number()
      .min(2)
      .max(20)
      .describe("Total number of colors in the final palette"),
  }),
};
