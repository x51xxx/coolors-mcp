/**
 * Tonal Palette Generator
 * Creates Material Design 3 tonal palettes from HCT colors
 */

import type { RGB } from "../types.js";
import type { HCT } from "./types.js";

import { hct, hctToRgb, rgbToHct } from "./hct-solver.js";

/**
 * Standard Material 3 tone values
 */
export const MATERIAL_TONES = [
  0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
] as const;

/**
 * Extended tone values for more granularity
 */
export const EXTENDED_TONES = [
  0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 92,
  94, 96, 98, 99, 100,
] as const;

/**
 * Material 3 Core Palette
 * Contains all the tonal palettes needed for a complete theme
 */
export interface CorePalette {
  /** Error color palette */
  error: TonalPalette;
  /** Neutral color palette (grays) */
  neutral: TonalPalette;
  /** Neutral variant palette (slightly tinted grays) */
  neutralVariant: TonalPalette;
  /** Primary color palette */
  primary: TonalPalette;
  /** Secondary color palette */
  secondary: TonalPalette;
  /** Tertiary color palette */
  tertiary: TonalPalette;
}

/**
 * A tonal palette - variations of a single color at different tones
 */
export class TonalPalette {
  /**
   * Get extended tones for more options
   */
  get extendedTones(): Record<number, RGB> {
    const tones: Record<number, RGB> = {};
    for (const t of EXTENDED_TONES) {
      tones[t] = this.tone(t);
    }
    return tones;
  }

  /**
   * Get all Material 3 standard tones
   */
  get materialTones(): Record<number, RGB> {
    const tones: Record<number, RGB> = {};
    for (const t of MATERIAL_TONES) {
      tones[t] = this.tone(t);
    }
    return tones;
  }

  private cache = new Map<number, RGB>();

  constructor(
    public readonly hue: number,
    public readonly chroma: number,
  ) {}

  /**
   * Create a tonal palette from an HCT color
   */
  static fromHct(color: HCT): TonalPalette {
    return new TonalPalette(color.h, color.c);
  }

  /**
   * Create a tonal palette from an RGB color
   */
  static fromRgb(rgb: RGB): TonalPalette {
    const hctColor = rgbToHct(rgb);
    return new TonalPalette(hctColor.h, hctColor.c);
  }

  /**
   * Get the color at a specific tone
   */
  tone(tone: number): RGB {
    // Check cache first
    if (this.cache.has(tone)) {
      return this.cache.get(tone)!;
    }

    // Generate and cache
    const color = hctToRgb(hct(this.hue, this.chroma, tone));
    this.cache.set(tone, color);
    return color;
  }
}

/**
 * Generate an analogous palette (adjacent hues)
 */
export function analogousPalette(
  source: RGB,
  count: number = 5,
  hueShift: number = 30,
): TonalPalette[] {
  const sourceHct = rgbToHct(source);
  const palettes: TonalPalette[] = [];

  const startHue = sourceHct.h - hueShift * Math.floor(count / 2);

  for (let i = 0; i < count; i++) {
    const hue = (startHue + i * hueShift + 360) % 360;
    palettes.push(new TonalPalette(hue, sourceHct.c));
  }

  return palettes;
}

/**
 * Generate a complementary palette
 */
export function complementaryPalette(
  source: RGB,
): [TonalPalette, TonalPalette] {
  const sourceHct = rgbToHct(source);

  return [
    new TonalPalette(sourceHct.h, sourceHct.c),
    new TonalPalette((sourceHct.h + 180) % 360, sourceHct.c),
  ];
}

/**
 * Generate a complete Material 3 core palette from a source color
 */
export function corePaletteFromRgb(source: RGB): CorePalette {
  const sourceHct = rgbToHct(source);

  // Primary uses the source color
  const primary = new TonalPalette(sourceHct.h, Math.max(48, sourceHct.c));

  // Secondary is shifted in hue and reduced chroma
  const secondary = new TonalPalette(
    sourceHct.h,
    Math.max(16, sourceHct.c / 3),
  );

  // Tertiary shifts hue by 60 degrees
  const tertiary = new TonalPalette(
    (sourceHct.h + 60) % 360,
    Math.max(24, sourceHct.c / 2),
  );

  // Error is always red-ish
  const error = new TonalPalette(25, 84);

  // Neutral has very low chroma
  const neutral = new TonalPalette(sourceHct.h, Math.min(4, sourceHct.c / 12));

  // Neutral variant has slightly more chroma
  const neutralVariant = new TonalPalette(
    sourceHct.h,
    Math.min(8, sourceHct.c / 6),
  );

  return {
    error,
    neutral,
    neutralVariant,
    primary,
    secondary,
    tertiary,
  };
}

/**
 * Generate a monochromatic palette (single hue, varying tones)
 */
export function monochromaticPalette(
  source: RGB,
  tones: readonly number[] = MATERIAL_TONES,
): RGB[] {
  const palette = TonalPalette.fromRgb(source);
  return tones.map((t) => palette.tone(t));
}

/**
 * Generate a triadic palette (three colors evenly spaced)
 */
export function triadicPalette(
  source: RGB,
): [TonalPalette, TonalPalette, TonalPalette] {
  const sourceHct = rgbToHct(source);

  return [
    new TonalPalette(sourceHct.h, sourceHct.c),
    new TonalPalette((sourceHct.h + 120) % 360, sourceHct.c),
    new TonalPalette((sourceHct.h + 240) % 360, sourceHct.c),
  ];
}
