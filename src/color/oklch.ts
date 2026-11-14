/**
 * OKLab and OKLCH perceptual color space conversions.
 *
 * Uses Björn Ottosson's OKLab matrices with sRGB transfer functions and
 * CSS Color 4 style chroma-reduction gamut mapping so out-of-gamut OKLCH
 * values map cleanly back into sRGB while preserving lightness and hue.
 */

import type { OKLAB, OKLCH, RGB } from "./types.js";

/**
 * Format OKLCH as standard CSS Color 4 string, e.g. oklch(62.8% 0.258 29.2).
 */
export function formatOklch(oklch: OKLCH): string {
  const lPct = (oklch.l * 100).toFixed(1);
  const c = oklch.c.toFixed(4);
  const h = oklch.h.toFixed(1);
  return `oklch(${lPct}% ${c} ${h})`;
}

/**
 * Convert OKLab to OKLCH (L in [0, 1], C >= 0, H in [0, 360)).
 */
export function oklabToOklch(oklab: OKLAB): OKLCH {
  const c = Math.sqrt(oklab.a * oklab.a + oklab.b * oklab.b);
  let h = (Math.atan2(oklab.b, oklab.a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return {
    c,
    h: c < 1e-5 ? 0 : h,
    l: oklab.l,
  };
}

/**
 * Convert OKLab to sRGB [0, 255] with chroma-preserving gamut clamping.
 */
export function oklabToRgb(oklab: OKLAB): RGB {
  if (oklab.l <= 0) return { b: 0, g: 0, r: 0 };
  if (oklab.l >= 1) return { b: 255, g: 255, r: 255 };

  const lin = oklabToLinearRgb(oklab);
  if (isInSrgbGamut(lin)) {
    return {
      b: linearToSrgbChannel(lin.b),
      g: linearToSrgbChannel(lin.g),
      r: linearToSrgbChannel(lin.r),
    };
  }

  // Out of gamut: binary search chroma down to fit inside sRGB while keeping L & hue
  const oklch = oklabToOklch(oklab);
  return oklchToRgb(oklch);
}

/**
 * Convert OKLCH to OKLab.
 */
export function oklchToOklab(oklch: OKLCH): OKLAB {
  const rad = (oklch.h * Math.PI) / 180;
  return {
    a: oklch.c * Math.cos(rad),
    b: oklch.c * Math.sin(rad),
    l: oklch.l,
  };
}

/**
 * Convert OKLCH to sRGB [0, 255], gamut-mapping out-of-gamut colors by
 * reducing chroma while preserving lightness L and hue H.
 */
export function oklchToRgb(oklch: OKLCH): RGB {
  if (oklch.l <= 0) return { b: 0, g: 0, r: 0 };
  if (oklch.l >= 1) return { b: 255, g: 255, r: 255 };

  const direct = oklabToLinearRgb(oklchToOklab(oklch));
  if (isInSrgbGamut(direct)) {
    return {
      b: linearToSrgbChannel(direct.b),
      g: linearToSrgbChannel(direct.g),
      r: linearToSrgbChannel(direct.r),
    };
  }

  let low = 0;
  let high = Math.max(0, oklch.c);
  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const lin = oklabToLinearRgb(oklchToOklab({ ...oklch, c: mid }));
    if (isInSrgbGamut(lin)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const mapped = oklabToLinearRgb(oklchToOklab({ ...oklch, c: low }));
  return {
    b: linearToSrgbChannel(mapped.b),
    g: linearToSrgbChannel(mapped.g),
    r: linearToSrgbChannel(mapped.r),
  };
}

/**
 * Convert sRGB [0, 255] to OKLab.
 */
export function rgbToOklab(rgb: RGB): OKLAB {
  const r = srgbToLinearChannel(rgb.r);
  const g = srgbToLinearChannel(rgb.g);
  const b = srgbToLinearChannel(rgb.b);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  return {
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
  };
}

/**
 * Convert sRGB [0, 255] to OKLCH.
 */
export function rgbToOklch(rgb: RGB): OKLCH {
  return oklabToOklch(rgbToOklab(rgb));
}

function isInSrgbGamut(lin: { b: number; g: number; r: number }): boolean {
  const eps = 1e-4;
  return (
    lin.r >= -eps &&
    lin.r <= 1 + eps &&
    lin.g >= -eps &&
    lin.g <= 1 + eps &&
    lin.b >= -eps &&
    lin.b <= 1 + eps
  );
}

/**
 * Clamp a linear sRGB value and encode to 8-bit sRGB [0, 255].
 */
function linearToSrgbChannel(c: number): number {
  const clamped = Math.max(0, Math.min(1, c));
  const encoded =
    clamped <= 0.0031308
      ? 12.92 * clamped
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(255, encoded * 255)));
}

/**
 * Convert OKLab directly to linear sRGB (unclamped, used for gamut checks).
 */
function oklabToLinearRgb(oklab: OKLAB): { b: number; g: number; r: number } {
  const l_ = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const m_ = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const s_ = oklab.l - 0.0894841775 * oklab.a - 1.291485548 * oklab.b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return {
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
  };
}

/**
 * Decode an 8-bit sRGB channel [0, 255] into linear sRGB [0, 1].
 */
function srgbToLinearChannel(c: number): number {
  const v = Math.max(0, Math.min(255, c)) / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
