/**
 * HCT Solver - Converts between HCT and RGB color spaces.
 *
 * Delegates to Google's Material Color Utilities (CAM16 hue/chroma + L* tone
 * with true gamut mapping), so hue/chroma/tone values match Material exactly.
 */

import { Hct as MaterialHct } from "@material/material-color-utilities";

import type { RGB } from "../types.js";
import type { HCT } from "./types.js";

import { argbToRgb, rgbToArgb } from "../conversions.js";

/**
 * Create an HCT color from components
 */
export function hct(hue: number, chroma: number, tone: number): HCT {
  return {
    c: Math.max(0, chroma),
    h: sanitizeDegrees(hue),
    t: Math.max(0, Math.min(100, tone)),
  };
}

/**
 * Convert HCT to sRGB.
 *
 * Tone (L*) is preserved exactly; if the requested chroma is out of gamut for
 * that hue/tone, chroma is reduced (never the tone) — Material's HctSolver.
 */
export function hctToRgb(hct: HCT): RGB {
  const hue = sanitizeDegrees(hct.h);
  const chroma = Math.max(0, hct.c);
  const tone = Math.max(0, Math.min(100, hct.t));
  return argbToRgb(MaterialHct.from(hue, chroma, tone).toInt());
}

/**
 * Maximum in-gamut chroma for a given hue and tone.
 */
export function maxChroma(hue: number, tone: number): number {
  if (tone <= 0 || tone >= 100) return 0;
  return MaterialHct.from(sanitizeDegrees(hue), 200, tone).chroma;
}

/**
 * Convert sRGB to HCT (CAM16 hue & chroma, CIE L* tone).
 */
export function rgbToHct(rgb: RGB): HCT {
  const color = MaterialHct.fromInt(rgbToArgb(rgb));
  return {
    c: color.chroma,
    h: sanitizeDegrees(color.hue),
    t: color.tone,
  };
}

/**
 * Sanitize degrees to be in [0, 360)
 */
function sanitizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
