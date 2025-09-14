/**
 * Utility functions for color manipulation and validation
 */

import type { HSL, HSV, RGB } from "./types.js";

import { parseColor, rgbToHex, rgbToHsl, rgbToHsv } from "./conversions.js";

/**
 * Clamp HSL values to valid range
 */
export function clampHsl(hsl: HSL): HSL {
  return {
    h: clamp(hsl.h, 0, 360),
    l: clamp(hsl.l, 0, 100),
    s: clamp(hsl.s, 0, 100),
  };
}

/**
 * Clamp HSV values to valid range
 */
export function clampHsv(hsv: HSV): HSV {
  return {
    h: clamp(hsv.h, 0, 360),
    s: clamp(hsv.s, 0, 100),
    v: clamp(hsv.v, 0, 100),
  };
}

/**
 * Clamp RGB values to valid range
 */
export function clampRgb(rgb: RGB): RGB {
  return {
    b: clamp(rgb.b, 0, 255),
    g: clamp(rgb.g, 0, 255),
    r: clamp(rgb.r, 0, 255),
  };
}

/**
 * Darken a color by a percentage
 * @param rgb The color to darken
 * @param amount Amount to darken (0-100)
 */
export function darken(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = clamp(hsl.l - amount, 0, 100);
  return parseColor(formatHsl(hsl)) || rgb;
}

/**
 * Desaturate a color by a percentage
 * @param rgb The color to desaturate
 * @param amount Amount to desaturate (0-100)
 */
export function desaturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.s = clamp(hsl.s - amount, 0, 100);
  return parseColor(formatHsl(hsl)) || rgb;
}

/**
 * Format color to various string representations
 */
export function formatColor(
  rgb: RGB,
  format: "hex" | "hsl" | "hsv" | "rgb" = "hex",
): string {
  switch (format) {
    case "hex":
      return rgbToHex(rgb);
    case "hsl":
      return formatHsl(rgbToHsl(rgb));
    case "hsv": {
      const hsv = rgbToHsv(rgb);
      return `hsv(${hsv.h}, ${hsv.s}%, ${hsv.v}%)`;
    }
    case "rgb":
      return formatRgb(rgb);
    default:
      return rgbToHex(rgb);
  }
}

/**
 * Format HSL color to string
 */
export function formatHsl(hsl: HSL, alpha?: number): string {
  if (alpha !== undefined) {
    return `hsla(${hsl.h}, ${hsl.s}%, ${hsl.l}%, ${alpha})`;
  }
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Format RGB color to string
 */
export function formatRgb(rgb: RGB, alpha?: number): string {
  if (alpha !== undefined) {
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  }
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Get complementary color (opposite on color wheel)
 */
export function getComplementary(rgb: RGB): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.h = (hsl.h + 180) % 360;
  return parseColor(formatHsl(hsl)) || rgb;
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG 2.0 formula
 */
export function getContrastRatio(color1: RGB, color2: RGB): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of an RGB color
 * Based on WCAG 2.0 formula
 */
export function getLuminance(rgb: RGB): number {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  const r =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Invert a color
 */
export function invertColor(rgb: RGB): RGB {
  return {
    b: 255 - rgb.b,
    g: 255 - rgb.g,
    r: 255 - rgb.r,
  };
}

/**
 * Check if a color is considered "dark"
 * Based on luminance threshold
 */
export function isDark(rgb: RGB, threshold: number = 0.5): boolean {
  return getLuminance(rgb) < threshold;
}

/**
 * Check if a color is considered "light"
 * Based on luminance threshold
 */
export function isLight(rgb: RGB, threshold: number = 0.5): boolean {
  return getLuminance(rgb) >= threshold;
}

/**
 * Validate hexadecimal color string
 */
export function isValidHex(hex: string): boolean {
  const cleanHex = hex.replace("#", "");
  return /^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(cleanHex);
}

/**
 * Validate HSL color values
 */
export function isValidHsl(hsl: HSL): boolean {
  return (
    hsl.h >= 0 &&
    hsl.h <= 360 &&
    hsl.s >= 0 &&
    hsl.s <= 100 &&
    hsl.l >= 0 &&
    hsl.l <= 100
  );
}

/**
 * Validate HSV color values
 */
export function isValidHsv(hsv: HSV): boolean {
  return (
    hsv.h >= 0 &&
    hsv.h <= 360 &&
    hsv.s >= 0 &&
    hsv.s <= 100 &&
    hsv.v >= 0 &&
    hsv.v <= 100
  );
}

/**
 * Validate RGB color values
 */
export function isValidRgb(rgb: RGB): boolean {
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
 * Lighten a color by a percentage
 * @param rgb The color to lighten
 * @param amount Amount to lighten (0-100)
 */
export function lighten(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.l = clamp(hsl.l + amount, 0, 100);
  return parseColor(formatHsl(hsl)) || rgb;
}

/**
 * Check if contrast meets WCAG AA standard
 * Normal text: 4.5:1, Large text: 3:1
 */
export function meetsContrastAA(
  color1: RGB,
  color2: RGB,
  largeText: boolean = false,
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return largeText ? ratio >= 3 : ratio >= 4.5;
}

/**
 * Check if contrast meets WCAG AAA standard
 * Normal text: 7:1, Large text: 4.5:1
 */
export function meetsContrastAAA(
  color1: RGB,
  color2: RGB,
  largeText: boolean = false,
): boolean {
  const ratio = getContrastRatio(color1, color2);
  return largeText ? ratio >= 4.5 : ratio >= 7;
}

/**
 * Mix two colors together
 * @param color1 First color
 * @param color2 Second color
 * @param weight Weight of the first color (0-1)
 */
export function mixColors(color1: RGB, color2: RGB, weight: number = 0.5): RGB {
  const w = clamp(weight, 0, 1);
  const w2 = 1 - w;

  return {
    b: Math.round(color1.b * w + color2.b * w2),
    g: Math.round(color1.g * w + color2.g * w2),
    r: Math.round(color1.r * w + color2.r * w2),
  };
}

/**
 * Generate a random RGB color
 */
export function randomColor(): RGB {
  return {
    b: Math.floor(Math.random() * 256),
    g: Math.floor(Math.random() * 256),
    r: Math.floor(Math.random() * 256),
  };
}

/**
 * Saturate a color by a percentage
 * @param rgb The color to saturate
 * @param amount Amount to saturate (0-100)
 */
export function saturate(rgb: RGB, amount: number): RGB {
  const hsl = rgbToHsl(rgb);
  hsl.s = clamp(hsl.s + amount, 0, 100);
  return parseColor(formatHsl(hsl)) || rgb;
}

/**
 * Convert color to grayscale
 */
export function toGrayscale(rgb: RGB): RGB {
  const gray = Math.round(0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b);
  return { b: gray, g: gray, r: gray };
}

/**
 * Clamp a number between min and max values
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
