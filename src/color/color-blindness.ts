/**
 * Color Vision Deficiency (CVD) simulation.
 *
 * Linear-sRGB transformation matrices from Machado, Oliveira, and Fernandes
 * (2009), "A Physiologically-based Model for Simulation of Color Vision
 * Deficiency". Severity 1.0 matrices are used for the dichromatic forms
 * (protanopia/deuteranopia/tritanopia); severity 0.6 matrices are used for the
 * milder anomaly forms. Achromatopsia maps to a grey of equal relative
 * luminance (BT.709 weights on linear RGB).
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

// Machado et al. (2009) linear-sRGB matrices, copied from the authors'
// precomputed table (also used by the `colorspace` R package and culori):
// severity 1.0 for the dichromacies (-opia), severity 0.6 for the anomalous
// trichromacies (-omaly).
const CVD_MATRICES: Record<
  Exclude<CvdType, "achromatopsia">,
  [number, number, number, number, number, number, number, number, number]
> = {
  // severity 0.6
  deuteranomaly: [
    0.498864, 0.674741, -0.173604, 0.205199, 0.754872, 0.039929, -0.011131,
    0.030969, 0.980162,
  ],
  // severity 1.0
  deuteranopia: [
    0.367322, 0.860646, -0.227968, 0.280085, 0.672501, 0.047413, -0.01182,
    0.04294, 0.968881,
  ],
  // severity 0.6
  protanomaly: [
    0.38545, 0.769005, -0.154455, 0.100526, 0.829802, 0.069673, -0.007442,
    -0.02219, 1.029632,
  ],
  // severity 1.0
  protanopia: [
    0.152286, 1.052583, -0.204868, 0.114503, 0.786281, 0.099216, -0.003882,
    -0.048116, 1.051998,
  ],
  // severity 0.6
  tritanomaly: [
    1.104996, -0.046633, -0.058363, -0.032137, 0.971635, 0.060503, 0.001336,
    0.317922, 0.680742,
  ],
  // severity 1.0
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
    // Rod monochromacy: a grey with the same relative luminance
    // (Rec. 709 / sRGB coefficients applied to *linear* RGB).
    const y =
      0.2126 * srgbToLinear(rgb.r) +
      0.7152 * srgbToLinear(rgb.g) +
      0.0722 * srgbToLinear(rgb.b);
    const g = linearToSrgb(y);
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
