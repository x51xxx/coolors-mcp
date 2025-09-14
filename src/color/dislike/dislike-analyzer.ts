import { Hct } from "../hct/hct-class.js";

/**
 * Check and/or fix universally disliked colors.
 *
 * Color science studies of color preference indicate universal distaste for
 * dark yellow-greens, and also show this is correlated to distaste for
 * biological waste and rotting food.
 *
 * See Palmer and Schloss, 2010 or Schloss and Palmer's Chapter 21 in Handbook
 * of Color Psychology (2015).
 */
export class DislikeAnalyzer {
  /**
   * Analyze a batch of colors and return statistics
   * @param colors Array of HCT colors
   * @return Statistics about disliked colors
   */
  static analyzeBatch(colors: Hct[]): {
    disliked: number;
    dislikedIndices: number[];
    percentage: number;
    total: number;
  } {
    const dislikedIndices: number[] = [];

    colors.forEach((color, index) => {
      if (DislikeAnalyzer.isDisliked(color)) {
        dislikedIndices.push(index);
      }
    });

    return {
      disliked: dislikedIndices.length,
      dislikedIndices,
      percentage: (dislikedIndices.length / colors.length) * 100,
      total: colors.length,
    };
  }

  /**
   * Fix all disliked colors in a batch
   * @param colors Array of HCT colors
   * @return Array with disliked colors fixed
   */
  static fixBatch(colors: Hct[]): Hct[] {
    return colors.map((color) => DislikeAnalyzer.fixIfDisliked(color));
  }

  /**
   * If a color is disliked, lighten it to make it likable.
   *
   * @param hct A color to be judged.
   * @return A new color if the original color is disliked, or the original
   *   color if it is acceptable.
   */
  static fixIfDisliked(hct: Hct): Hct {
    if (DislikeAnalyzer.isDisliked(hct)) {
      return Hct.from(hct.hue, hct.chroma, 70.0);
    }

    return hct;
  }

  /**
   * Fix a hex color if it's disliked
   * @param hex Hex color string
   * @return Fixed hex color or original if not disliked
   */
  static fixIfDislikedHex(hex: string): string {
    const argb = parseInt(hex.replace("#", ""), 16) | 0xff000000;
    const hct = Hct.fromInt(argb);
    const fixed = DislikeAnalyzer.fixIfDisliked(hct);

    if (fixed === hct) {
      return hex;
    }

    const fixedArgb = fixed.toInt();
    const r = (fixedArgb >> 16) & 0xff;
    const g = (fixedArgb >> 8) & 0xff;
    const b = fixedArgb & 0xff;

    return "#" + [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  }

  /**
   * Returns true if a color is disliked.
   *
   * @param hct A color to be judged.
   * @return Whether the color is disliked.
   *
   * Disliked is defined as a dark yellow-green that is not neutral.
   * Specifically: hue 90-111°, chroma > 16, tone < 65
   */
  static isDisliked(hct: Hct): boolean {
    const huePasses =
      Math.round(hct.hue) >= 90.0 && Math.round(hct.hue) <= 111.0;
    const chromaPasses = Math.round(hct.chroma) > 16.0;
    const tonePasses = Math.round(hct.tone) < 65.0;

    return huePasses && chromaPasses && tonePasses;
  }

  /**
   * Check if a color is in the "bile zone" - universally disliked colors
   * @param hex Hex color string
   * @return Whether the color is disliked
   */
  static isDislikedHex(hex: string): boolean {
    const hct = Hct.fromInt(parseInt(hex.replace("#", ""), 16) | 0xff000000);
    return DislikeAnalyzer.isDisliked(hct);
  }
}
