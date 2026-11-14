import { z } from "zod";

import {
  argbToRgb,
  colorDistance,
  DislikeAnalyzer,
  Hct,
  hslToRgb,
  labToRgb,
  oklchToRgb,
  parseColor,
  rgbToArgb,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  rgbToOklch,
} from "../color/index.js";
import { RGB } from "../color/types.js";
import { READ_ONLY_TOOL, ToolInputError } from "./errors.js";

function avoidDisliked(rgb: RGB): RGB {
  const hct = Hct.fromInt(rgbToArgb(rgb));
  if (!DislikeAnalyzer.isDisliked(hct)) return rgb;
  return argbToRgb(DislikeAnalyzer.fixIfDisliked(hct).toInt());
}

function interpolateHue(startH: number, endH: number, t: number): number {
  let hueDiff = endH - startH;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;
  return (startH + hueDiff * t + 360) % 360;
}

export const paletteWithLocksTool = {
  annotations: READ_ONLY_TOOL,
  description:
    "Generate a color palette while preserving specific locked colors. Uses deterministic perceptual search in OKLCH/HCT/LAB/HSL and avoids universally disliked colors.",
  execute: async (args: {
    colorSpace?: "hct" | "hsl" | "lab" | "oklch";
    lockedColors: string[];
    mode?: "contrast" | "gradient" | "harmony";
    totalColors: number;
  }) => {
    const {
      colorSpace = "oklch",
      lockedColors,
      mode = "harmony",
      totalColors,
    } = args;

    if (lockedColors.length >= totalColors) {
      throw new ToolInputError(
        `Error: Number of locked colors (${lockedColors.length}) must be less than total colors (${totalColors})`,
      );
    }

    // Parse and validate locked colors
    const parsedLocked: RGB[] = [];
    for (const color of lockedColors) {
      const parsed = parseColor(color);
      if (!parsed) {
        throw new ToolInputError(`Invalid color format: ${color}`);
      }
      parsedLocked.push(parsed);
    }

    const palette: string[] = [];
    const remainingSlots = totalColors - lockedColors.length;

    // Add locked colors to palette
    lockedColors.forEach((color) => palette.push(color));

    switch (mode) {
      case "contrast": {
        // Deterministic minimax search across a structured perceptual OKLCH grid
        const candidates: RGB[] = [];
        for (let h = 0; h < 360; h += 15) {
          for (const l of [0.38, 0.56, 0.74, 0.88]) {
            for (const c of [0.1, 0.17]) {
              candidates.push(avoidDisliked(oklchToRgb({ c, h, l })));
            }
          }
        }

        for (let i = 0; i < remainingSlots; i++) {
          let bestColor: RGB = candidates[0];
          let maxMinDistance = -1;

          for (const candidate of candidates) {
            let minDistance = Infinity;
            for (const locked of parsedLocked) {
              const dist = colorDistance(candidate, locked, {
                metric: "deltaE2000",
              });
              if (dist < minDistance) minDistance = dist;
            }
            if (minDistance > maxMinDistance) {
              maxMinDistance = minDistance;
              bestColor = candidate;
            }
          }

          palette.push(rgbToHex(bestColor));
          parsedLocked.push(bestColor);
        }
        break;
      }

      case "gradient": {
        if (parsedLocked.length < 2) {
          throw new ToolInputError(
            "Gradient mode requires at least 2 locked colors",
          );
        }

        const segments = parsedLocked.length - 1;
        const baseSteps = Math.floor(remainingSlots / segments);
        const extra = remainingSlots % segments;

        // Emit in gradient order: locked[0], in-betweens, locked[1], …
        palette.length = 0;
        for (let i = 0; i < segments; i++) {
          const start = parsedLocked[i];
          const end = parsedLocked[i + 1];
          const steps = baseSteps + (i < extra ? 1 : 0);
          palette.push(lockedColors[i]);

          for (let step = 1; step <= steps; step++) {
            const t = step / (steps + 1);

            if (colorSpace === "lab") {
              const startLab = rgbToLab(start);
              const endLab = rgbToLab(end);
              palette.push(
                rgbToHex(
                  labToRgb({
                    a: startLab.a + (endLab.a - startLab.a) * t,
                    b: startLab.b + (endLab.b - startLab.b) * t,
                    l: startLab.l + (endLab.l - startLab.l) * t,
                  }),
                ),
              );
            } else if (colorSpace === "hct") {
              const s = Hct.fromInt(rgbToArgb(start));
              const e = Hct.fromInt(rgbToArgb(end));
              const hct = Hct.from(
                interpolateHue(s.hue, e.hue, t),
                s.chroma + (e.chroma - s.chroma) * t,
                s.tone + (e.tone - s.tone) * t,
              );
              palette.push(rgbToHex(argbToRgb(hct.toInt())));
            } else if (colorSpace === "oklch") {
              const s = rgbToOklch(start);
              const e = rgbToOklch(end);
              const h =
                s.c < 0.01
                  ? e.h
                  : e.c < 0.01
                    ? s.h
                    : interpolateHue(s.h, e.h, t);
              palette.push(
                rgbToHex(
                  oklchToRgb({
                    c: s.c + (e.c - s.c) * t,
                    h,
                    l: s.l + (e.l - s.l) * t,
                  }),
                ),
              );
            } else {
              const startHsl = rgbToHsl(start);
              const endHsl = rgbToHsl(end);
              palette.push(
                rgbToHex(
                  hslToRgb({
                    h: interpolateHue(startHsl.h, endHsl.h, t),
                    l: startHsl.l + (endHsl.l - startHsl.l) * t,
                    s: startHsl.s + (endHsl.s - startHsl.s) * t,
                  }),
                ),
              );
            }
          }
        }
        palette.push(lockedColors[lockedColors.length - 1]);
        break;
      }

      case "harmony": {
        // Deterministic harmonic offsets relative to the locked anchor(s)
        const baseOk = rgbToOklch(parsedLocked[0]);
        const baseHsl = rgbToHsl(parsedLocked[0]);
        const baseHct = Hct.fromInt(rgbToArgb(parsedLocked[0]));
        const harmonicOffsets = [
          30, -30, 60, -60, 120, 240, 150, 210, 180, 90, 270,
        ];
        const lOffsets = [0, 0.12, -0.12, 0.22, -0.22];

        for (let i = 0; i < remainingSlots; i++) {
          let bestColor: null | RGB = null;
          let maxMinDistance = -1;

          for (const hOff of harmonicOffsets) {
            for (const lOff of lOffsets) {
              let candidate: RGB;
              if (colorSpace === "hsl") {
                candidate = hslToRgb({
                  h: (baseHsl.h + hOff + 360) % 360,
                  l: Math.max(15, Math.min(88, baseHsl.l + lOff * 100)),
                  s: Math.max(15, Math.min(92, baseHsl.s)),
                });
              } else if (colorSpace === "hct") {
                const hct = Hct.from(
                  (baseHct.hue + hOff + 360) % 360,
                  Math.max(18, baseHct.chroma),
                  Math.max(16, Math.min(90, baseHct.tone + lOff * 100)),
                );
                candidate = avoidDisliked(argbToRgb(hct.toInt()));
              } else {
                candidate = avoidDisliked(
                  oklchToRgb({
                    c: Math.max(0.05, baseOk.c),
                    h: (baseOk.h + hOff + 360) % 360,
                    l: Math.max(0.22, Math.min(0.9, baseOk.l + lOff)),
                  }),
                );
              }

              let minDistance = Infinity;
              for (const locked of parsedLocked) {
                const dist = colorDistance(candidate, locked, {
                  metric: "deltaE2000",
                });
                if (dist < minDistance) minDistance = dist;
              }

              // Prefer distinct colors that sit near the harmonic family;
              // the most distinct candidate wins even below the ΔE 12 target
              // so the palette always has exactly totalColors entries.
              if (minDistance > maxMinDistance) {
                maxMinDistance = minDistance;
                bestColor = candidate;
              }
            }
          }

          if (bestColor) {
            palette.push(rgbToHex(bestColor));
            parsedLocked.push(bestColor);
          }
        }
        break;
      }
    }

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
      .enum(["hsl", "lab", "hct", "oklch"])
      .default("oklch")
      .describe(
        "Color space for palette generation/interpolation (oklch/hct/lab are perceptually uniform)",
      ),
    lockedColors: z
      .array(z.string())
      .min(1)
      .max(19)
      .describe("Colors that must be included in the palette"),
    mode: z
      .enum(["harmony", "contrast", "gradient"])
      .default("harmony")
      .describe(
        "Generation mode: harmony (cohesive), contrast (distinct), or gradient (smooth transition)",
      ),
    totalColors: z
      .number()
      .min(2)
      .max(20)
      .describe("Total number of colors in the final palette"),
  }),
};
