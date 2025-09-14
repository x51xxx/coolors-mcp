/**
 * Color space conversion functions
 */

import type { HEX, HSL, HSV, LAB, RGB, XYZ } from "./types.js";

import { ColorConstants } from "./types.js";

/**
 * Convert ARGB format to RGB
 */
export function argbToRgb(argb: number): RGB {
  const r = (argb >> 16) & 0xff;
  const g = (argb >> 8) & 0xff;
  const b = argb & 0xff;
  return { b, g, r };
}

/**
 * Convert hexadecimal to RGB color
 */
export function hexToRgb(hex: HEX): RGB {
  // Remove # if present
  const cleanHex = hex.replace("#", "");

  // Handle 3-digit hex
  const fullHex =
    cleanHex.length === 3
      ? cleanHex
          .split("")
          .map((c) => c + c)
          .join("")
      : cleanHex;

  const num = parseInt(fullHex, 16);

  return {
    b: num & 255,
    g: (num >> 8) & 255,
    r: (num >> 16) & 255,
  };
}

/**
 * Convert HSL to RGB color space
 */
export function hslToRgb(hsl: HSL): RGB {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let b: number, g: number, r: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return {
    b: Math.round(b * 255),
    g: Math.round(g * 255),
    r: Math.round(r * 255),
  };
}

/**
 * Convert HSV to RGB color space
 */
export function hsvToRgb(hsv: HSV): RGB {
  const h = hsv.h / 360;
  const s = hsv.s / 100;
  const v = hsv.v / 100;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  let b: number, g: number, r: number;

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
    default:
      r = 0;
      g = 0;
      b = 0;
  }

  return {
    b: Math.round(b * 255),
    g: Math.round(g * 255),
    r: Math.round(r * 255),
  };
}

/**
 * Convert LAB to RGB color space
 */
export function labToRgb(lab: LAB): RGB {
  return xyzToRgb(labToXyz(lab));
}

/**
 * Convert LAB to XYZ color space
 */
export function labToXyz(lab: LAB): XYZ {
  const { D65, EPSILON, KAPPA } = ColorConstants;

  const fy = (lab.l + 16) / 116;
  const fx = lab.a / 500 + fy;
  const fz = fy - lab.b / 200;

  const x3 = Math.pow(fx, 3);
  const y3 = Math.pow(fy, 3);
  const z3 = Math.pow(fz, 3);

  const x = x3 > EPSILON ? x3 : (116 * fx - 16) / KAPPA;
  const y = lab.l > KAPPA * EPSILON ? y3 : lab.l / KAPPA;
  const z = z3 > EPSILON ? z3 : (116 * fz - 16) / KAPPA;

  return {
    x: x * D65.X,
    y: y * D65.Y,
    z: z * D65.Z,
  };
}

/**
 * Parse color string to RGB
 * Supports: hex (#fff, #ffffff), rgb(r,g,b), hsl(h,s,l)
 */
export function parseColor(color: string): null | RGB {
  const trimmed = color.trim().toLowerCase();

  // Hex color
  if (trimmed.startsWith("#")) {
    try {
      return hexToRgb(trimmed);
    } catch {
      return null;
    }
  }

  // RGB color
  const rgbMatch = trimmed.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      b: parseInt(rgbMatch[3], 10),
      g: parseInt(rgbMatch[2], 10),
      r: parseInt(rgbMatch[1], 10),
    };
  }

  // HSL color
  const hslMatch = trimmed.match(/^hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (hslMatch) {
    return hslToRgb({
      h: parseInt(hslMatch[1], 10),
      l: parseInt(hslMatch[3], 10),
      s: parseInt(hslMatch[2], 10),
    });
  }

  return null;
}

/**
 * Convert RGB to ARGB format (32-bit integer)
 */
export function rgbToArgb(rgb: RGB): number {
  const r = Math.round(Math.max(0, Math.min(255, rgb.r)));
  const g = Math.round(Math.max(0, Math.min(255, rgb.g)));
  const b = Math.round(Math.max(0, Math.min(255, rgb.b)));
  // Use >>> 0 to convert to unsigned 32-bit integer
  return ((0xff << 24) | (r << 16) | (g << 8) | b) >>> 0;
}

/**
 * Convert RGB to hexadecimal color
 */
export function rgbToHex(rgb: RGB): HEX {
  const toHex = (n: number): string => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL color space
 */
export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (diff !== 0) {
    s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);

    switch (max) {
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    l: Math.round(l * 100),
    s: Math.round(s * 100),
  };
}

/**
 * Convert RGB to HSV color space
 */
export function rgbToHsv(rgb: RGB): HSV {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  let h = 0;
  const s = max === 0 ? 0 : diff / max;
  const v = max;

  if (diff !== 0) {
    switch (max) {
      case b:
        h = ((r - g) / diff + 4) / 6;
        break;
      case g:
        h = ((b - r) / diff + 2) / 6;
        break;
      case r:
        h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    v: Math.round(v * 100),
  };
}

/**
 * Convert RGB to LAB color space
 */
export function rgbToLab(rgb: RGB): LAB {
  return xyzToLab(rgbToXyz(rgb));
}

/**
 * Convert RGB to XYZ color space
 * Using sRGB working space and D65 illuminant
 */
export function rgbToXyz(rgb: RGB): XYZ {
  let r = rgb.r / 255;
  let g = rgb.g / 255;
  let b = rgb.b / 255;

  // Apply gamma correction
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  // Multiply by 100 to get standard XYZ values
  r *= 100;
  g *= 100;
  b *= 100;

  // Apply transformation matrix (sRGB to XYZ)
  return {
    x: r * 0.4124564 + g * 0.3575761 + b * 0.1804375,
    y: r * 0.2126729 + g * 0.7151522 + b * 0.072175,
    z: r * 0.0193339 + g * 0.119192 + b * 0.9503041,
  };
}

/**
 * Convert XYZ to LAB color space
 * Using D65 illuminant
 */
export function xyzToLab(xyz: XYZ): LAB {
  const { D65, EPSILON, KAPPA } = ColorConstants;

  // Normalize by reference white
  const x = xyz.x / D65.X;
  const y = xyz.y / D65.Y;
  const z = xyz.z / D65.Z;

  // Apply transformation
  const fx = x > EPSILON ? Math.cbrt(x) : (KAPPA * x + 16) / 116;
  const fy = y > EPSILON ? Math.cbrt(y) : (KAPPA * y + 16) / 116;
  const fz = z > EPSILON ? Math.cbrt(z) : (KAPPA * z + 16) / 116;

  return {
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
    l: 116 * fy - 16,
  };
}

/**
 * Convert XYZ to RGB color space
 */
export function xyzToRgb(xyz: XYZ): RGB {
  // Normalize by 100
  const x = xyz.x / 100;
  const y = xyz.y / 100;
  const z = xyz.z / 100;

  // Apply inverse transformation matrix (XYZ to sRGB)
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  // Apply inverse gamma correction
  r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
  g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
  b = b > 0.0031308 ? 1.055 * Math.pow(b, 1 / 2.4) - 0.055 : 12.92 * b;

  return {
    b: Math.round(Math.max(0, Math.min(255, b * 255))),
    g: Math.round(Math.max(0, Math.min(255, g * 255))),
    r: Math.round(Math.max(0, Math.min(255, r * 255))),
  };
}
