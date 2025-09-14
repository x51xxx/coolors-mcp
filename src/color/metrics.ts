/**
 * Color distance metrics for calculating perceptual differences between colors
 */

import type { ColorDistanceOptions, LAB, RGB } from "./types.js";

import { rgbToLab } from "./conversions.js";

/**
 * Determine if two colors are perceptually similar
 * Uses Delta E 2000 with a threshold
 */
export function areColorsSimilar(
  color1: RGB,
  color2: RGB,
  threshold: number = 2.3, // JND (Just Noticeable Difference)
): boolean {
  const distance = colorDistance(color1, color2, { metric: "deltaE2000" });
  return distance <= threshold;
}

/**
 * Calculate color distance between two RGB colors using specified metric
 */
export function colorDistance(
  color1: RGB,
  color2: RGB,
  options?: ColorDistanceOptions,
): number {
  const metric = options?.metric ?? "deltaE2000";

  switch (metric) {
    case "deltaE76": {
      const lab1 = rgbToLab(color1);
      const lab2 = rgbToLab(color2);
      return deltaE76(lab1, lab2);
    }

    case "deltaE94": {
      const lab1 = rgbToLab(color1);
      const lab2 = rgbToLab(color2);
      return deltaE94(lab1, lab2, options?.deltaE94);
    }

    case "euclidean":
      return euclideanDistance(color1, color2);

    case "weighted":
      return weightedRgbDistance(color1, color2, options?.weights);

    case "deltaE2000":
    default: {
      const lab1 = rgbToLab(color1);
      const lab2 = rgbToLab(color2);
      return deltaE2000(lab1, lab2);
    }
  }
}

/**
 * Calculate Delta E CIE2000 (ΔE*00)
 * Most accurate perceptual color difference formula
 */
export function deltaE2000(lab1: LAB, lab2: LAB): number {
  const deg2rad = (deg: number) => deg * (Math.PI / 180);
  const rad2deg = (rad: number) => rad * (180 / Math.PI);

  // Weight factors
  const kL = 1;
  const kC = 1;
  const kH = 1;

  // Calculate C' and h'
  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const Cbar = (C1 + C2) / 2;

  const G =
    0.5 *
    (1 - Math.sqrt(Math.pow(Cbar, 7) / (Math.pow(Cbar, 7) + Math.pow(25, 7))));

  const a1p = lab1.a * (1 + G);
  const a2p = lab2.a * (1 + G);

  const C1p = Math.sqrt(a1p * a1p + lab1.b * lab1.b);
  const C2p = Math.sqrt(a2p * a2p + lab2.b * lab2.b);

  let h1p = Math.atan2(lab1.b, a1p);
  let h2p = Math.atan2(lab2.b, a2p);

  if (h1p < 0) h1p += 2 * Math.PI;
  if (h2p < 0) h2p += 2 * Math.PI;

  h1p = rad2deg(h1p);
  h2p = rad2deg(h2p);

  // Calculate deltas
  const dLp = lab2.l - lab1.l;
  const dCp = C2p - C1p;

  let dhp = h2p - h1p;
  if (dhp > 180) dhp -= 360;
  if (dhp < -180) dhp += 360;

  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin(deg2rad(dhp) / 2);

  // Calculate averages
  const Lbar = (lab1.l + lab2.l) / 2;
  const Cpbar = (C1p + C2p) / 2;

  let hpbar = (h1p + h2p) / 2;
  if (Math.abs(h1p - h2p) > 180) {
    if (h1p + h2p < 360) {
      hpbar += 180;
    } else {
      hpbar -= 180;
    }
  }

  // Calculate T
  const T =
    1 -
    0.17 * Math.cos(deg2rad(hpbar - 30)) +
    0.24 * Math.cos(deg2rad(2 * hpbar)) +
    0.32 * Math.cos(deg2rad(3 * hpbar + 6)) -
    0.2 * Math.cos(deg2rad(4 * hpbar - 63));

  // Calculate rotation term
  const dTheta = 30 * Math.exp(-Math.pow((hpbar - 275) / 25, 2));
  const RC =
    2 * Math.sqrt(Math.pow(Cpbar, 7) / (Math.pow(Cpbar, 7) + Math.pow(25, 7)));
  const RT = -RC * Math.sin(2 * deg2rad(dTheta));

  // Calculate weighting functions
  const SL =
    1 +
    (0.015 * Math.pow(Lbar - 50, 2)) / Math.sqrt(20 + Math.pow(Lbar - 50, 2));
  const SC = 1 + 0.045 * Cpbar;
  const SH = 1 + 0.015 * Cpbar * T;

  // Calculate final Delta E 2000
  const dLpKlSl = dLp / (kL * SL);
  const dCpKcSc = dCp / (kC * SC);
  const dHpKhSh = dHp / (kH * SH);

  return Math.sqrt(
    dLpKlSl * dLpKlSl +
      dCpKcSc * dCpKcSc +
      dHpKhSh * dHpKhSh +
      RT * dCpKcSc * dHpKhSh,
  );
}

/**
 * Calculate Delta E CIE76 (ΔE*ab)
 * Original CIE color difference formula
 */
export function deltaE76(lab1: LAB, lab2: LAB): number {
  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Calculate Delta E CIE94 (ΔE*94)
 * Improved perceptual uniformity over CIE76
 */
export function deltaE94(
  lab1: LAB,
  lab2: LAB,
  options?: { kC?: number; kH?: number; kL?: number },
): number {
  // Default values for graphic arts
  const kL = options?.kL ?? 1;
  const kC = options?.kC ?? 1;
  const kH = options?.kH ?? 1;

  const dL = lab1.l - lab2.l;
  const da = lab1.a - lab2.a;
  const db = lab1.b - lab2.b;

  const C1 = Math.sqrt(lab1.a * lab1.a + lab1.b * lab1.b);
  const C2 = Math.sqrt(lab2.a * lab2.a + lab2.b * lab2.b);
  const dC = C1 - C2;

  const dH2 = da * da + db * db - dC * dC;
  const dH = dH2 > 0 ? Math.sqrt(dH2) : 0;

  const SL = 1;
  const SC = 1 + 0.045 * C1;
  const SH = 1 + 0.015 * C1;

  const dLKlSl = dL / (kL * SL);
  const dCKcSc = dC / (kC * SC);
  const dHKhSh = dH / (kH * SH);

  return Math.sqrt(dLKlSl * dLKlSl + dCKcSc * dCKcSc + dHKhSh * dHKhSh);
}

/**
 * Calculate Euclidean distance between two RGB colors
 * Simple but not perceptually uniform
 */
export function euclideanDistance(color1: RGB, color2: RGB): number {
  const dr = color1.r - color2.r;
  const dg = color1.g - color2.g;
  const db = color1.b - color2.b;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Find the most different color from a set of colors
 */
export function findMostDifferentColor(
  baseColor: RGB,
  colors: RGB[],
  options?: ColorDistanceOptions,
): null | RGB {
  if (colors.length === 0) return null;

  let maxDistance = -Infinity;
  let mostDifferent = colors[0];

  for (const color of colors) {
    const distance = colorDistance(baseColor, color, options);
    if (distance > maxDistance) {
      maxDistance = distance;
      mostDifferent = color;
    }
  }

  return mostDifferent;
}

/**
 * Find the most similar color from a set of colors
 */
export function findMostSimilarColor(
  baseColor: RGB,
  colors: RGB[],
  options?: ColorDistanceOptions,
): null | RGB {
  if (colors.length === 0) return null;

  let minDistance = Infinity;
  let mostSimilar = colors[0];

  for (const color of colors) {
    const distance = colorDistance(baseColor, color, options);
    if (distance < minDistance) {
      minDistance = distance;
      mostSimilar = color;
    }
  }

  return mostSimilar;
}

/**
 * Calculate weighted RGB distance
 * Better approximation of perceptual difference than simple Euclidean
 */
export function weightedRgbDistance(
  color1: RGB,
  color2: RGB,
  weights?: { b?: number; g?: number; r?: number },
): number {
  // Default weights based on human eye sensitivity
  const wr = weights?.r ?? 0.3;
  const wg = weights?.g ?? 0.59;
  const wb = weights?.b ?? 0.11;

  const dr = (color1.r - color2.r) * wr;
  const dg = (color1.g - color2.g) * wg;
  const db = (color1.b - color2.b) * wb;

  return Math.sqrt(dr * dr + dg * dg + db * db);
}
