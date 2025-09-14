/**
 * HCT Solver - Converts between HCT and RGB color spaces
 * Based on Material Color Utilities algorithms
 */

import type { RGB } from "../types.js";
import type { HCT } from "./types.js";

import { labToXyz, rgbToXyz, xyzToLab, xyzToRgb } from "../conversions.js";

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
 * Convert HCT to RGB using iterative solving
 * This is a simplified version of Material's HCT solver
 */
export function hctToRgb(hct: HCT): RGB {
  const hue = sanitizeDegrees(hct.h);
  const chroma = Math.max(0, hct.c);
  const tone = Math.max(0, Math.min(100, hct.t));

  // Special cases
  if (chroma < 0.0001 || tone < 0.5 || tone > 99.5) {
    const gray = (tone / 100) * 255;
    return { b: gray, g: gray, r: gray };
  }

  // Convert tone to L*
  const lstar = tone;

  // Use iterative approach to find the right chroma
  let bestRgb: null | RGB = null;

  // Binary search for achievable chroma
  let low = 0;
  let high = chroma;
  const epsilon = 0.01;

  while (high - low > epsilon) {
    const mid = (low + high) / 2;

    // Convert to LAB using approximate chroma
    const a = mid * Math.cos((hue * Math.PI) / 180);
    const b = mid * Math.sin((hue * Math.PI) / 180);

    // Convert LAB to XYZ to RGB
    const xyz = labToXyz({ a, b, l: lstar });
    const rgb = xyzToRgb(xyz);

    // Check if RGB is in gamut
    if (isInGamut(rgb)) {
      bestRgb = rgb;
      low = mid;
    } else {
      high = mid;
    }
  }

  // If we found a valid RGB, use it
  if (bestRgb) {
    return clampRgb(bestRgb);
  }

  // Fallback: reduce chroma until in gamut
  for (let c = chroma; c >= 0; c -= 1) {
    const a = c * Math.cos((hue * Math.PI) / 180);
    const b = c * Math.sin((hue * Math.PI) / 180);

    const xyz = labToXyz({ a, b, l: lstar });
    const rgb = xyzToRgb(xyz);

    if (isInGamut(rgb)) {
      return clampRgb(rgb);
    }
  }

  // Final fallback: gray
  const gray = (tone / 100) * 255;
  return { b: gray, g: gray, r: gray };
}

/**
 * Get maximum chroma for a given hue and tone
 * This is an approximation - actual max varies
 */
export function maxChroma(hue: number, tone: number): number {
  // Edge cases
  if (tone <= 0 || tone >= 100) return 0;

  // Approximate maximum chroma
  // This varies significantly based on hue and tone
  // Red/magenta hues can achieve higher chroma
  const hueCycle = (hue % 360) / 360;
  const redBoost = Math.sin(hueCycle * Math.PI * 2) * 0.2 + 1;

  // Chroma peaks around middle tones
  const toneFactor = Math.sin((tone / 100) * Math.PI);

  return toneFactor * 120 * redBoost;
}

/**
 * Convert RGB to HCT
 */
export function rgbToHct(rgb: RGB): HCT {
  // Convert RGB to LAB
  const xyz = rgbToXyz(rgb);
  const lab = xyzToLab(xyz);

  // Extract tone from L*
  const tone = lab.l;

  // Calculate chroma and hue from a* and b*
  const chroma = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  let hue = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;

  // Ensure hue is positive
  if (hue < 0) {
    hue += 360;
  }

  return {
    c: chroma,
    h: sanitizeDegrees(hue),
    t: tone,
  };
}

/**
 * Clamp RGB values to valid range
 */
function clampRgb(rgb: RGB): RGB {
  return {
    b: Math.round(Math.max(0, Math.min(255, rgb.b))),
    g: Math.round(Math.max(0, Math.min(255, rgb.g))),
    r: Math.round(Math.max(0, Math.min(255, rgb.r))),
  };
}

/**
 * Check if RGB values are in valid gamut
 */
function isInGamut(rgb: RGB): boolean {
  return (
    rgb.r >= 0 &&
    rgb.r <= 255 &&
    rgb.g >= 0 &&
    rgb.g <= 255 &&
    rgb.b >= 0 &&
    rgb.b <= 255
  );
}

/**
 * Sanitize degrees to be in [0, 360)
 */
function sanitizeDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
