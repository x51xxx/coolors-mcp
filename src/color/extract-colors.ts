/**
 * Image color extraction using Material Design quantization
 */

import { DislikeAnalyzer } from "./dislike/dislike-analyzer.js";
import { Hct } from "./hct/index.js";
import {
  filterExtremeTones,
  imageDataToPixels,
  samplePixels,
} from "./image-utils.js";
import { QuantizerCelebi } from "./quantize/quantizer_celebi.js";
import { Score } from "./score/score.js";
import * as utils from "./utils/color_utils.js";

export interface ExtractedColor {
  hct: { c: number; h: number; t: number };
  hex: string;
  percentage: number;
  population: number;
  rgb: { b: number; g: number; r: number };
}

export interface ExtractionOptions {
  filter?: boolean;
  fixDislikedColors?: boolean;
  maxColors?: number;
  quality?: "high" | "low" | "medium";
  scoringEnabled?: boolean;
}

const QUALITY_SETTINGS = {
  high: { maxPixels: 25000, quantizeColors: 256 },
  low: { maxPixels: 5000, quantizeColors: 64 },
  medium: { maxPixels: 10000, quantizeColors: 128 },
};

/**
 * Extract dominant colors from image data
 */
export function extractColors(
  imageData: {
    data: number[] | Uint8ClampedArray;
    height: number;
    width: number;
  },
  options: ExtractionOptions = {},
): ExtractedColor[] {
  const {
    filter = true,
    fixDislikedColors = false,
    maxColors = 5,
    quality = "medium",
    scoringEnabled = true,
  } = options;

  const qualitySettings = QUALITY_SETTINGS[quality];

  // Convert image to pixels
  let pixels = imageDataToPixels(imageData);

  // Sample for performance
  pixels = samplePixels(pixels, qualitySettings.maxPixels);

  // Optionally filter extreme tones
  if (filter) {
    pixels = filterExtremeTones(pixels);
  }

  // Quantize colors using Celebi algorithm
  const quantized = QuantizerCelebi.quantize(
    pixels,
    qualitySettings.quantizeColors,
  );

  // Score and select best colors
  let selectedColors: number[];
  if (scoringEnabled) {
    selectedColors = Score.score(quantized, {
      desired: maxColors,
      filter: filter,
    });
  } else {
    // Simple selection by population
    const sorted = Array.from(quantized.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxColors)
      .map((entry) => entry[0]);
    selectedColors = sorted;
  }

  // Calculate total population for percentages
  const totalPopulation = Array.from(quantized.values()).reduce(
    (sum, pop) => sum + pop,
    0,
  );

  // Convert to output format
  return selectedColors.map((argb) => {
    let hct = Hct.fromInt(argb);

    // Fix disliked colors if requested
    if (fixDislikedColors && DislikeAnalyzer.isDisliked(hct)) {
      hct = DislikeAnalyzer.fixIfDisliked(hct);
      argb = hct.toInt();
    }

    const r = utils.redFromArgb(argb);
    const g = utils.greenFromArgb(argb);
    const b = utils.blueFromArgb(argb);
    const population = quantized.get(argb) || 0;

    return {
      hct: { c: hct.chroma, h: hct.hue, t: hct.tone },
      hex: rgbToHex(r, g, b),
      percentage: (population / totalPopulation) * 100,
      population,
      rgb: { b, g, r },
    };
  });
}

/**
 * Extract a color palette suitable for UI themes
 */
export function extractThemePalette(imageData: {
  data: number[] | Uint8ClampedArray;
  height: number;
  width: number;
}): {
  error?: ExtractedColor;
  neutral?: ExtractedColor;
  primary: ExtractedColor;
  secondary?: ExtractedColor;
  tertiary?: ExtractedColor;
} {
  // Extract with high quality and scoring, fixing disliked colors
  const colors = extractColors(imageData, {
    filter: true,
    fixDislikedColors: true, // Always fix disliked colors for themes
    maxColors: 8,
    quality: "high",
    scoringEnabled: true,
  });

  if (colors.length === 0) {
    throw new Error("No colors could be extracted from image");
  }

  const result: {
    error?: ExtractedColor;
    neutral?: ExtractedColor;
    primary: ExtractedColor;
    secondary?: ExtractedColor;
    tertiary?: ExtractedColor;
  } = {
    primary: colors[0],
  };

  // Assign additional colors based on hue differences
  if (colors.length > 1) {
    // Find color with most different hue from primary
    const primaryHue = colors[0].hct.h;
    let maxHueDiff = 0;
    let secondaryIndex = 1;

    for (let i = 1; i < Math.min(colors.length, 4); i++) {
      const hueDiff = Math.abs(hueDifference(primaryHue, colors[i].hct.h));
      if (hueDiff > maxHueDiff) {
        maxHueDiff = hueDiff;
        secondaryIndex = i;
      }
    }

    result.secondary = colors[secondaryIndex];

    // Find tertiary (different from both primary and secondary)
    if (colors.length > 2) {
      const secondaryHue = colors[secondaryIndex].hct.h;
      let bestTertiaryIndex = -1;
      let bestScore = 0;

      for (let i = 1; i < colors.length; i++) {
        if (i === secondaryIndex) continue;

        const hue = colors[i].hct.h;
        const primaryDiff = Math.abs(hueDifference(primaryHue, hue));
        const secondaryDiff = Math.abs(hueDifference(secondaryHue, hue));
        const score = Math.min(primaryDiff, secondaryDiff);

        if (score > bestScore) {
          bestScore = score;
          bestTertiaryIndex = i;
        }
      }

      if (bestTertiaryIndex !== -1) {
        result.tertiary = colors[bestTertiaryIndex];
      }
    }
  }

  // Find a neutral color (low chroma)
  const neutral = colors.find((c) => c.hct.c < 20);
  if (neutral) {
    result.neutral = neutral;
  }

  // Error color (prefer red/orange hue if available, 0-40 or 350-360)
  const errorColor = colors.find((c) => c.hct.h >= 350 || c.hct.h <= 40);
  if (errorColor) {
    result.error = errorColor;
  }

  return result;
}

function hueDifference(h1: number, h2: number): number {
  const diff = Math.abs(h1 - h2);
  return diff > 180 ? 360 - diff : diff;
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")
  );
}
