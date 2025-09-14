/**
 * Color type definitions for various color spaces
 */

/**
 * Supported color formats for parsing
 */
export enum ColorFormat {
  HEX = "hex",
  HSL = "hsl",
  HSV = "hsv",
  LAB = "lab",
  RGB = "rgb",
  XYZ = "xyz",
}

/**
 * Options for color distance calculations
 */
export interface ColorDistanceOptions {
  /**
   * Parameters for Delta E 94
   */
  deltaE94?: {
    kC?: number;
    kH?: number;
    kL?: number;
  };

  /**
   * Type of distance metric to use
   */
  metric?: "deltaE2000" | "deltaE76" | "deltaE94" | "euclidean" | "weighted";

  /**
   * Weights for weighted RGB distance
   */
  weights?: {
    b?: number;
    g?: number;
    r?: number;
  };
}

/**
 * Color input type that can be parsed
 */
export type ColorInput = HSL | HSV | LAB | RGB | string | XYZ;

/**
 * HCT (Hue, Chroma, Tone) color representation
 */
export interface HCT {
  c: number; // Chroma [0, ~150]
  h: number; // Hue [0, 360)
  t: number; // Tone [0, 100]
}

/**
 * Hexadecimal color representation
 */
export type HEX = string;

/**
 * HSL (Hue, Saturation, Lightness) color representation
 * h: [0, 360] degrees
 * s: [0, 100] percentage
 * l: [0, 100] percentage
 */
export interface HSL {
  h: number;
  l: number;
  s: number;
}

/**
 * HSV (Hue, Saturation, Value) color representation
 * Also known as HSB (Hue, Saturation, Brightness)
 * h: [0, 360] degrees
 * s: [0, 100] percentage
 * v: [0, 100] percentage
 */
export interface HSV {
  h: number;
  s: number;
  v: number;
}

/**
 * LAB color space (CIE L*a*b*)
 * L: [0, 100] lightness
 * a: [-128, 127] green-red axis
 * b: [-128, 127] blue-yellow axis
 */
export interface LAB {
  a: number;
  b: number;
  l: number;
}

/**
 * Color parsing result
 */
export interface ParsedColor {
  format: ColorFormat;
  value: HSL | HSV | LAB | RGB | XYZ;
}

/**
 * RGB color representation
 * Values should be in range [0, 255]
 */
export interface RGB {
  b: number;
  g: number;
  r: number;
}

/**
 * XYZ color space (CIE 1931)
 * Reference white: D65 illuminant
 */
export interface XYZ {
  x: number;
  y: number;
  z: number;
}

/**
 * Constants for color space conversions
 */
export const ColorConstants = {
  /**
   * D65 illuminant reference white point
   */
  D65: {
    X: 95.047,
    Y: 100.0,
    Z: 108.883,
  },

  /**
   * Epsilon for LAB conversion
   */
  EPSILON: 0.008856,

  /**
   * Kappa for LAB conversion
   */
  KAPPA: 903.3,
} as const;
