/**
 * HCT (Hue, Chroma, Tone) color space types
 * Based on Material Color Utilities
 */

/**
 * CAM16 color appearance model
 * Predicts color appearance under different viewing conditions
 */
export interface CAM16 {
  /** Chroma composition */
  astar: number;
  /** Brightness composition */
  bstar: number;
  /** Chroma */
  chroma: number;
  /** Hue angle */
  hue: number;
  /** Lightness */
  j: number;
  /** Hue composition */
  jstar: number;
  /** Colorfulness */
  m: number;
  /** Brightness */
  q: number;
  /** Saturation */
  s: number;
}

/**
 * HCT color representation
 * A perceptually accurate color space that combines:
 * - Hue from CAM16
 * - Chroma from CAM16
 * - Tone (Lightness) from L* (LAB)
 */
export interface HCT {
  /** Chroma (colorfulness) [0, ~150] - actual max varies by hue and tone */
  c: number;
  /** Hue angle in degrees [0, 360) */
  h: number;
  /** Tone (lightness) [0, 100] */
  t: number;
}

/**
 * Viewing conditions for CAM16
 * Describes the environment in which colors are viewed
 */
export interface ViewingConditions {
  /** Background luminance ratio */
  aw: number;
  /** Base exponential nonlinearity */
  c: number;
  /** Degree of adaptation */
  fl: number;
  /** Luminance level adaptation factor */
  flRoot: number;
  /** Adapting luminance */
  n: number;
  /** Luminance level adaptation factor */
  nbb: number;
  /** Chromatic induction factor */
  nc: number;
  /** Chromatic induction factor */
  ncb: number;
  /** Achromatic response for white */
  rgbD: [number, number, number];
  /** Surround factor */
  z: number;
}

/**
 * Standard viewing conditions
 */
export const STANDARD_CONDITIONS: ViewingConditions = {
  aw: 29.98,
  c: 0.69,
  fl: 0.388,
  flRoot: 0.789,
  n: 0.184,
  nbb: 1.017,
  nc: 1.0,
  ncb: 1.017,
  rgbD: [1.021, 0.986, 0.934],
  z: 1.909,
};
