/**
 * Image processing utilities for color extraction
 */

import * as utils from "./utils/color_utils.js";

/**
 * Filter out near-white and near-black pixels
 * @param pixels - Array of ARGB pixels
 * @returns Filtered array
 */
export function filterExtremeTones(pixels: number[]): number[] {
  return pixels.filter((pixel) => {
    const r = utils.redFromArgb(pixel);
    const g = utils.greenFromArgb(pixel);
    const b = utils.blueFromArgb(pixel);

    // Calculate luminance (rough approximation)
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;

    // Filter out very dark (< 5%) and very light (> 95%) pixels
    return luminance > 12.75 && luminance < 242.25;
  });
}

/**
 * Convert image data to ARGB pixel array
 * @param imageData - Canvas ImageData or similar structure
 * @returns Array of ARGB colors as 32-bit integers
 */
export function imageDataToPixels(imageData: {
  data: number[] | Uint8ClampedArray;
  height: number;
  width: number;
}): number[] {
  const pixels: number[] = [];
  const data = imageData.data;

  // Process RGBA data (4 bytes per pixel)
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Skip fully transparent pixels
    if (a < 255 * 0.01) continue;

    // Convert to ARGB format
    const argb = utils.argbFromRgb(r, g, b);
    pixels.push(argb);
  }

  return pixels;
}

/**
 * Sample pixels from image for faster processing
 * @param pixels - Full array of pixels
 * @param maxPixels - Maximum number of pixels to sample
 * @returns Sampled array of pixels
 */
export function samplePixels(
  pixels: number[],
  maxPixels: number = 10000,
): number[] {
  if (pixels.length <= maxPixels) {
    return pixels;
  }

  const sampled: number[] = [];
  const step = Math.ceil(pixels.length / maxPixels);

  for (let i = 0; i < pixels.length; i += step) {
    sampled.push(pixels[i]);
  }

  return sampled;
}
