/**
 * Color Vision Deficiency (CVD) simulation.
 *
 * Linear-sRGB transformation matrices from Machado, Oliveira, and Fernandes
 * (2009), "A Physiologically-based Model for Simulation of Color Vision
 * Deficiency". Severity 1.0 matrices are used for the dichromatic forms
 * (protanopia/deuteranopia/tritanopia); severity 0.6 matrices are used for the
 * milder anomaly forms. Achromatopsia uses ITU-R BT.709 luminance.
 *
 * Pipeline: sRGB → linear sRGB → matrix → sRGB.
 */

import type { RGB } from "./types.js";

export type CvdType =
  | "achromatopsia"
  | "deuteranomaly"
  | "deuteranopia"
  | "protanomaly"
  | "protanopia"
  | "tritanomaly"
  | "tritanopia";

// Confusion-line matrices applied in linear sRGB space (Machado et al. 2009
// linear approximation, common in libraries like color-blind / colorjs.io).
// Each matrix maps linear-sRGB to the visible linear-sRGB for the given CVD.
const CVD_MATRICES: Record<
  Exclude<CvdType, "achromatopsia">,
  [number, number, number, number, number, number, number, number, number]
> = {
  deuteranomaly: [
    0.547494, 0.607765, -0.155259, 0.181692, 0.781742, 0.036566, -0.01041,
    0.027275, 0.983136,
  ],
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
    0.04294, 0.968881,
  ],
  // Mild forms (-omaly: severity ~0.6, Machado severity 0.6 table)
  protanomaly: [
    0.458064, 0.679578, -0.137642, 0.092785, 0.846313, 0.060902, -0.007494,
    -0.016807, 1.024301,
  ],
  // Strong forms (-opia: full dichromacy, severity 1.0)
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
    -0.048116, 1.051998,
  ],
  tritanomaly: [
    1.193214, -0.109812, -0.083402, 0.058694, 0.901185, 0.040121, -0.005978,
    0.401901, 0.604077,
  ],
  tritanopia: [
    1.255528, -0.076749, -0.178779, -0.078411, 0.930809, 0.147602, 0.004733,
    0.691367, 0.3039,
  ],
};

/**
 * Simulate how a color appears to a viewer with the given color vision
 * deficiency.
 */
export function simulateCvd(rgb: RGB, type: CvdType): RGB {
  if (type === "achromatopsia") {
    // ITU-R BT.709 luminance (Rec. 709) — perceived brightness.
    const y = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;
    const g = Math.max(0, Math.min(255, Math.round(y)));
    return { b: g, g, r: g };
  }

  const m = CVD_MATRICES[type];
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const rOut = m[0] * r + m[1] * g + m[2] * b;
  const gOut = m[3] * r + m[4] * g + m[5] * b;
  const bOut = m[6] * r + m[7] * g + m[8] * b;

  return {
    b: linearToSrgb(bOut),
    g: linearToSrgb(gOut),
    r: linearToSrgb(rOut),
  };
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
}

function srgbToLinear(c: number): number {
  const n = c / 255;
  return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

/**
 * Approximate share of the population affected by each CVD type (worldwide,
 * combining male+female prevalence as reported by Colour Blind Awareness).
 */
export const CVD_PREVALENCE: Record<CvdType, number> = {
  achromatopsia: 0.003,
  deuteranomaly: 5.0,
  deuteranopia: 1.0,
  protanomaly: 1.0,
  protanopia: 1.0,
  tritanomaly: 0.01,
  tritanopia: 0.003,
};
