/**
 * Color Harmonization
 * Algorithms to blend and harmonize colors based on Material Design principles
 */

import type { RGB } from "../types.js";

import { hct, hctToRgb, rgbToHct } from "./hct-solver.js";

/**
 * Temperature-based color adjustment
 * Warmer (positive) or cooler (negative) adjustment
 */
export function adjustTemperature(color: RGB, amount: number): RGB {
  const hctColor = rgbToHct(color);

  // Warm colors: red-orange-yellow (0-60, 300-360)
  // Cool colors: green-blue-purple (60-300)
  const isWarm = hctColor.h <= 60 || hctColor.h >= 300;

  let newHue: number;
  if (amount > 0) {
    // Make warmer - shift toward orange (30 degrees)
    newHue = isWarm
      ? circularInterpolate(hctColor.h, 30, Math.min(amount, 1))
      : circularInterpolate(hctColor.h, 30, Math.min(amount * 2, 1));
  } else {
    // Make cooler - shift toward blue (210 degrees)
    newHue = !isWarm
      ? circularInterpolate(hctColor.h, 210, Math.min(-amount, 1))
      : circularInterpolate(hctColor.h, 210, Math.min(-amount * 2, 1));
  }

  return hctToRgb(hct(newHue, hctColor.c, hctColor.t));
}

/**
 * Find analogous colors (adjacent on color wheel)
 */
export function analogous(
  color: RGB,
  angle: number = 30,
  count: number = 2,
): RGB[] {
  const hctColor = rgbToHct(color);
  const colors: RGB[] = [];

  for (let i = 1; i <= count; i++) {
    // Add colors on both sides
    colors.push(
      hctToRgb(
        hct(
          sanitizeDegreesDouble(hctColor.h + angle * i),
          hctColor.c,
          hctColor.t,
        ),
      ),
    );

    colors.push(
      hctToRgb(
        hct(
          sanitizeDegreesDouble(hctColor.h - angle * i),
          hctColor.c,
          hctColor.t,
        ),
      ),
    );
  }

  return colors;
}

/**
 * Blend two colors in HCT space
 * More perceptually uniform than RGB blending
 */
export function blend(from: RGB, to: RGB, amount: number): RGB {
  const fromHct = rgbToHct(from);
  const toHct = rgbToHct(to);

  // Interpolate in HCT space
  const h = circularInterpolate(fromHct.h, toHct.h, amount);
  const c = fromHct.c + (toHct.c - fromHct.c) * amount;
  const t = fromHct.t + (toHct.t - fromHct.t) * amount;

  return hctToRgb(hct(h, c, t));
}

/**
 * Create a double complementary (rectangle) scheme
 */
export function doubleComplementary(
  color1: RGB,
  color2: RGB,
): [RGB, RGB, RGB, RGB] {
  const hct1 = rgbToHct(color1);
  const hct2 = rgbToHct(color2);

  return [
    color1,
    color2,
    hctToRgb(hct((hct1.h + 180) % 360, hct1.c, hct1.t)),
    hctToRgb(hct((hct2.h + 180) % 360, hct2.c, hct2.t)),
  ];
}

/**
 * Create a gradient between two colors
 */
export function gradient(from: RGB, to: RGB, steps: number): RGB[] {
  const colors: RGB[] = [];

  for (let i = 0; i < steps; i++) {
    const amount = i / (steps - 1);
    colors.push(blend(from, to, amount));
  }

  return colors;
}

/**
 * Harmonize a color with a target, making them work better together
 * Based on Material's blend algorithm
 */
export function harmonize(design: RGB, source: RGB, factor: number = 0.5): RGB {
  const fromHct = rgbToHct(design);
  const toHct = rgbToHct(source);

  const diffDegrees = differenceDegrees(fromHct.h, toHct.h);
  const rotationDegrees = Math.min(diffDegrees * factor, 15);
  const outputHue = sanitizeDegreesDouble(
    fromHct.h + rotationDegrees * rotationDirection(fromHct.h, toHct.h),
  );

  return hctToRgb(hct(outputHue, fromHct.c, fromHct.t));
}

/**
 * Find split-complementary colors
 */
export function splitComplementary(
  color: RGB,
  angle: number = 30,
): [RGB, RGB, RGB] {
  const hctColor = rgbToHct(color);
  const complement = (hctColor.h + 180) % 360;

  return [
    color,
    hctToRgb(
      hct(sanitizeDegreesDouble(complement - angle), hctColor.c, hctColor.t),
    ),
    hctToRgb(
      hct(sanitizeDegreesDouble(complement + angle), hctColor.c, hctColor.t),
    ),
  ];
}

/**
 * Find tetradic (square) colors - four colors evenly spaced
 */
export function tetradic(color: RGB): [RGB, RGB, RGB, RGB] {
  const hctColor = rgbToHct(color);

  return [
    color,
    hctToRgb(hct((hctColor.h + 90) % 360, hctColor.c, hctColor.t)),
    hctToRgb(hct((hctColor.h + 180) % 360, hctColor.c, hctColor.t)),
    hctToRgb(hct((hctColor.h + 270) % 360, hctColor.c, hctColor.t)),
  ];
}

// Helper functions

function circularInterpolate(from: number, to: number, amount: number): number {
  const difference = to - from;
  const distance = Math.abs(difference);

  if (distance > 180) {
    // Take the shorter path around the circle
    if (difference > 0) {
      from += 360;
    } else {
      to += 360;
    }
  }

  return sanitizeDegreesDouble(from + (to - from) * amount);
}

function differenceDegrees(a: number, b: number): number {
  return Math.abs(((a - b + 180) % 360) - 180);
}

function rotationDirection(from: number, to: number): number {
  const difference = to - from;
  const normalized = ((difference + 180) % 360) - 180;
  return normalized >= 0 ? 1 : -1;
}

function sanitizeDegreesDouble(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}
