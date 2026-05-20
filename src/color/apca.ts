/**
 * APCA — Accessible Perceptual Contrast Algorithm (WCAG 3 draft)
 *
 * Implementation of APCA W3 0.1.9 / SAPC by Andrew Somers (Myndex).
 * Returns Lc, an absolute contrast value typically in the range [-108, +106].
 * Sign indicates polarity: positive when text is darker than background
 * ("dark on light"), negative for light text on dark background. The magnitude
 * (|Lc|) maps to readability thresholds via APCA's "Bronze Simple Tables":
 *
 *   |Lc| >= 75   body text
 *   |Lc| >= 60   content text
 *   |Lc| >= 45   large fluent text
 *   |Lc| >= 30   non-content / spot text
 *   |Lc| < 15    invisible — fails for any text use
 *
 * Reference: https://github.com/Myndex/SAPC-APCA
 */

import type { RGB } from "./types.js";

// APCA constants (W3-0.1.9 4g)
const SA98G = {
  blkClmp: 1.414,
  blkThrs: 0.022,
  deltaYmin: 0.0005,
  loBoTclip: -0.6,
  loBoTexp: 0.74,
  loClip: 0.1,
  // Polarity exponents/factors
  normBG: 0.56,
  normTXT: 0.57,
  revBG: 0.62,
  revTXT: 0.65,
  // Soft-clip and scale
  scaleBoW: 1.14,
  scaleWoB: 1.14,
  trailingW: 0.027,
} as const;

const sRGBtrc = 2.4;
const Rco = 0.2126729;
const Gco = 0.7151522;
const Bco = 0.072175;

/**
 * Compute APCA Lc for foreground text on background.
 * `text` is the text/foreground color, `bg` is the background color.
 */
export function apcaContrast(text: RGB, bg: RGB): number {
  let txtY = apcaY(text);
  let bgY = apcaY(bg);

  // Soft black clamp
  if (txtY <= SA98G.blkThrs) {
    txtY += Math.pow(SA98G.blkThrs - txtY, SA98G.blkClmp);
  }
  if (bgY <= SA98G.blkThrs) {
    bgY += Math.pow(SA98G.blkThrs - bgY, SA98G.blkClmp);
  }

  if (Math.abs(bgY - txtY) < SA98G.deltaYmin) return 0;

  let outputContrast: number;

  if (bgY > txtY) {
    // Normal polarity (dark text on light background) — positive Lc
    const SAPC =
      (Math.pow(bgY, SA98G.normBG) - Math.pow(txtY, SA98G.normTXT)) *
      SA98G.scaleBoW;
    outputContrast = SAPC < SA98G.loClip ? 0 : SAPC - SA98G.trailingW;
  } else {
    // Reverse polarity (light text on dark background) — negative Lc
    const SAPC =
      (Math.pow(bgY, SA98G.revBG) - Math.pow(txtY, SA98G.revTXT)) *
      SA98G.scaleWoB;
    outputContrast = SAPC > -SA98G.loClip ? 0 : SAPC + SA98G.trailingW;
  }

  return outputContrast * 100;
}

/**
 * Classify an APCA Lc value against the Bronze Simple level thresholds.
 */
export function apcaLevel(lc: number): {
  body: boolean;
  content: boolean;
  large: boolean;
  spot: boolean;
} {
  const abs = Math.abs(lc);
  return {
    body: abs >= 75,
    content: abs >= 60,
    large: abs >= 45,
    spot: abs >= 30,
  };
}

function apcaY(rgb: RGB): number {
  const r = Math.pow(rgb.r / 255, sRGBtrc);
  const g = Math.pow(rgb.g / 255, sRGBtrc);
  const b = Math.pow(rgb.b / 255, sRGBtrc);
  return Rco * r + Gco * g + Bco * b;
}
