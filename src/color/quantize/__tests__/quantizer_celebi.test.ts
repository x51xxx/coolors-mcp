/**
 * Tests for Celebi quantizer
 */

import { describe, expect, it } from "vitest";

import * as utils from "../../utils/color_utils";
import { QuantizerCelebi } from "../quantizer_celebi";

describe("QuantizerCelebi", () => {
  it("should quantize a single color", () => {
    const pixels = [
      utils.argbFromRgb(255, 0, 0),
      utils.argbFromRgb(255, 0, 0),
      utils.argbFromRgb(255, 0, 0),
    ];

    const result = QuantizerCelebi.quantize(pixels, 1);

    expect(result.size).toBe(1);
    // Should have red color
    const colors = Array.from(result.keys());
    const rgb = {
      b: utils.blueFromArgb(colors[0]),
      g: utils.greenFromArgb(colors[0]),
      r: utils.redFromArgb(colors[0]),
    };

    // Should be close to red
    expect(rgb.r).toBeGreaterThan(250);
    expect(rgb.g).toBeLessThan(5);
    expect(rgb.b).toBeLessThan(5);

    // Population should be 3
    expect(result.get(colors[0])).toBe(3);
  });

  it("should quantize multiple distinct colors", () => {
    const pixels = [
      utils.argbFromRgb(255, 0, 0), // Red
      utils.argbFromRgb(0, 255, 0), // Green
      utils.argbFromRgb(0, 0, 255), // Blue
      utils.argbFromRgb(255, 255, 0), // Yellow
    ];

    const result = QuantizerCelebi.quantize(pixels, 4);

    // Should preserve distinct colors when maxColors is sufficient
    expect(result.size).toBeLessThanOrEqual(4);
    expect(result.size).toBeGreaterThan(0);

    // Check total population
    let totalPopulation = 0;
    for (const pop of result.values()) {
      totalPopulation += pop;
    }
    expect(totalPopulation).toBe(4);
  });

  it("should reduce colors when maxColors is limited", () => {
    const pixels = [
      utils.argbFromRgb(255, 0, 0),
      utils.argbFromRgb(254, 0, 0), // Very similar to red
      utils.argbFromRgb(0, 255, 0),
      utils.argbFromRgb(0, 254, 0), // Very similar to green
      utils.argbFromRgb(0, 0, 255),
      utils.argbFromRgb(0, 0, 254), // Very similar to blue
    ];

    const result = QuantizerCelebi.quantize(pixels, 3);

    // Should reduce to approximately 3 colors
    expect(result.size).toBeLessThanOrEqual(3);
    expect(result.size).toBeGreaterThan(0);
  });

  it("should handle grayscale colors", () => {
    const pixels = [
      utils.argbFromRgb(0, 0, 0), // Black
      utils.argbFromRgb(128, 128, 128), // Gray
      utils.argbFromRgb(255, 255, 255), // White
    ];

    const result = QuantizerCelebi.quantize(pixels, 3);

    expect(result.size).toBeLessThanOrEqual(3);
    expect(result.size).toBeGreaterThan(0);

    // Total population should be preserved
    let totalPopulation = 0;
    for (const pop of result.values()) {
      totalPopulation += pop;
    }
    expect(totalPopulation).toBe(3);
  });

  it("should handle empty pixel array", () => {
    const result = QuantizerCelebi.quantize([], 10);

    expect(result.size).toBe(0);
  });

  it("should handle single pixel", () => {
    const pixel = utils.argbFromRgb(123, 45, 67);
    const result = QuantizerCelebi.quantize([pixel], 10);

    expect(result.size).toBe(1);
    expect(result.has(pixel)).toBe(true);
    expect(result.get(pixel)).toBe(1);
  });

  it("should handle maxColors of 1", () => {
    const pixels = [
      utils.argbFromRgb(255, 0, 0),
      utils.argbFromRgb(0, 255, 0),
      utils.argbFromRgb(0, 0, 255),
    ];

    const result = QuantizerCelebi.quantize(pixels, 1);

    expect(result.size).toBe(1);

    // Population should be total
    const population = Array.from(result.values())[0];
    expect(population).toBe(3);
  });

  it("should handle large number of similar colors", () => {
    const pixels: number[] = [];

    // Add many similar shades of blue
    for (let i = 0; i < 100; i++) {
      const variation = Math.floor(i / 10);
      pixels.push(utils.argbFromRgb(0, 0, 200 + variation));
    }

    const result = QuantizerCelebi.quantize(pixels, 5);

    // Should reduce to fewer colors
    expect(result.size).toBeLessThanOrEqual(5);
    expect(result.size).toBeGreaterThan(0);

    // Total population should be preserved
    let totalPopulation = 0;
    for (const pop of result.values()) {
      totalPopulation += pop;
    }
    expect(totalPopulation).toBe(100);
  });

  it("should produce consistent results for same input", () => {
    const pixels = [
      utils.argbFromRgb(100, 150, 200),
      utils.argbFromRgb(150, 100, 200),
      utils.argbFromRgb(200, 100, 150),
    ];

    const result1 = QuantizerCelebi.quantize(pixels, 2);
    const result2 = QuantizerCelebi.quantize(pixels, 2);

    // Results should be deterministic
    expect(result1.size).toBe(result2.size);

    // Check that the same colors are produced
    const colors1 = Array.from(result1.keys()).sort();
    const colors2 = Array.from(result2.keys()).sort();

    expect(colors1).toEqual(colors2);
  });

  it("should handle gradient properly", () => {
    const pixels: number[] = [];

    // Create a gradient from red to blue
    for (let i = 0; i < 100; i++) {
      const r = Math.floor(255 * (1 - i / 100));
      const b = Math.floor(255 * (i / 100));
      pixels.push(utils.argbFromRgb(r, 0, b));
    }

    const result = QuantizerCelebi.quantize(pixels, 10);

    // Should extract representative colors from gradient
    expect(result.size).toBeLessThanOrEqual(10);
    expect(result.size).toBeGreaterThan(1); // Should find multiple colors

    // Check that we have both reddish and bluish colors
    const colors = Array.from(result.keys());
    const hasReddish = colors.some((c) => utils.redFromArgb(c) > 200);
    const hasBluish = colors.some((c) => utils.blueFromArgb(c) > 200);

    expect(hasReddish).toBe(true);
    expect(hasBluish).toBe(true);
  });
});
