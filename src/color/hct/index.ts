/**
 * HCT Color Module
 * Export all HCT-related functionality
 */

// Harmonization
export {
  adjustTemperature,
  analogous,
  blend,
  doubleComplementary,
  gradient,
  harmonize,
  splitComplementary,
  tetradic,
} from "./harmonization.js";
// HCT Class (Material Color Utilities compatible)
export { Hct } from "./hct-class.js";

// HCT Solver
export { hct, hctToRgb, maxChroma, rgbToHct } from "./hct-solver.js";

// Tonal Palettes
export {
  analogousPalette,
  complementaryPalette,
  type CorePalette,
  corePaletteFromRgb,
  EXTENDED_TONES,
  MATERIAL_TONES,
  monochromaticPalette,
  TonalPalette,
  triadicPalette,
} from "./tonal-palette.js";

// Types
export type { CAM16, HCT, ViewingConditions } from "./types.js";

export { STANDARD_CONDITIONS } from "./types.js";
