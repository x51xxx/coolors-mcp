/**
 * Color utilities module
 * Main exports for color manipulation, conversion, and distance calculations
 */

// Export all conversion functions
export {
  argbToRgb,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  labToRgb,
  labToXyz,
  parseColor,
  rgbToArgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToLab,
  rgbToXyz,
  xyzToLab,
  xyzToRgb,
} from "./conversions.js";

// Export dislike analyzer
export { DislikeAnalyzer } from "./dislike/dislike-analyzer.js";

// Export HCT functionality
export * from "./hct/index.js";

// Export all metric functions
export {
  areColorsSimilar,
  colorDistance,
  deltaE2000,
  deltaE76,
  deltaE94,
  euclideanDistance,
  findMostDifferentColor,
  findMostSimilarColor,
  weightedRgbDistance,
} from "./metrics.js";

// Export all types
export type {
  ColorDistanceOptions,
  ColorInput,
  HCT,
  HEX,
  HSL,
  HSV,
  LAB,
  ParsedColor,
  RGB,
  XYZ,
} from "./types.js";

export { ColorConstants, ColorFormat } from "./types.js";

// Export all utility functions
export {
  clampHsl,
  clampHsv,
  clampRgb,
  darken,
  desaturate,
  formatColor,
  formatHsl,
  formatRgb,
  getComplementary,
  getContrastRatio,
  getLuminance,
  invertColor,
  isDark,
  isLight,
  isValidHex,
  isValidHsl,
  isValidHsv,
  isValidRgb,
  lighten,
  meetsContrastAA,
  meetsContrastAAA,
  mixColors,
  randomColor,
  saturate,
  toGrayscale,
} from "./utils.js";
