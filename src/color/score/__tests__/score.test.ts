/**
 * Tests for color scoring algorithm
 */

import { describe, expect, it } from "vitest";

import { Hct } from "../../hct/hct-class";
import * as utils from "../../utils/color_utils";
import { Score } from "../score";

describe("Score", () => {
  describe("score method", () => {
    it("should return fallback color for empty input", () => {
      const colorsToPopulation = new Map<number, number>();
      const result = Score.score(colorsToPopulation);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(0xff4285f4); // Default Google Blue
    });

    it("should return custom fallback color when specified", () => {
      const colorsToPopulation = new Map<number, number>();
      const customFallback = utils.argbFromRgb(255, 0, 0);

      const result = Score.score(colorsToPopulation, {
        fallbackColorARGB: customFallback,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(customFallback);
    });

    it("should filter low chroma colors when filter is true", () => {
      const grayColor = utils.argbFromRgb(128, 128, 128); // Low chroma
      const vibrantColor = utils.argbFromRgb(255, 0, 0); // High chroma

      const colorsToPopulation = new Map([
        [grayColor, 100],
        [vibrantColor, 50],
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 2,
        filter: true,
      });

      // Should filter out gray color
      expect(result).not.toContain(grayColor);
      expect(result).toContain(vibrantColor);
    });

    it("should keep all colors when filter is false", () => {
      const grayColor = utils.argbFromRgb(128, 128, 128);
      const vibrantColor = utils.argbFromRgb(255, 0, 0);

      const colorsToPopulation = new Map([
        [grayColor, 100],
        [vibrantColor, 50],
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 2,
        filter: false,
      });

      // Should keep both colors
      expect(result).toHaveLength(2);
    });

    it("should return desired number of colors", () => {
      const colors = new Map<number, number>();

      // Add many vibrant colors
      for (let i = 0; i < 10; i++) {
        const hue = i * 36; // Evenly distributed hues
        const hct = Hct.from(hue, 50, 50);
        colors.set(hct.toInt(), 100 - i);
      }

      const result = Score.score(colors, {
        desired: 5,
        filter: false,
      });

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it("should prioritize colors with good hue distribution", () => {
      // Create colors with different hue separations
      const red = Hct.from(0, 50, 50).toInt();
      const green = Hct.from(120, 50, 50).toInt(); // 120 degrees from red
      const blue = Hct.from(240, 50, 50).toInt(); // 240 degrees from red
      const orange = Hct.from(30, 50, 50).toInt(); // Only 30 degrees from red

      const colorsToPopulation = new Map([
        [blue, 100],
        [green, 100],
        [orange, 100],
        [red, 100],
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 3,
        filter: false,
      });

      // Should prefer colors with better hue distribution
      expect(result).toContain(red);
      expect(result).toContain(green);
      expect(result).toContain(blue);
      // Orange might be excluded due to being too close to red
    });

    it("should score colors based on chroma proximity to target", () => {
      // Target chroma is 48.0
      // Higher chroma is preferred with weight 0.3, lower chroma has weight 0.1
      const perfectChroma = Hct.from(180, 48, 50).toInt();
      const lowChroma = Hct.from(180, 20, 50).toInt();
      const highChroma = Hct.from(180, 80, 50).toInt();

      const colorsToPopulation = new Map([
        [highChroma, 100],
        [lowChroma, 100],
        [perfectChroma, 100],
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 1,
        filter: false,
      });

      // High chroma should score highest (algorithm prefers vibrant colors)
      expect(result[0]).toBe(highChroma);
    });

    it("should filter colors with very low population proportion", () => {
      const commonColor = utils.argbFromRgb(255, 0, 0);
      const rareColor = utils.argbFromRgb(0, 255, 0);

      const colorsToPopulation = new Map([
        [commonColor, 1000],
        [rareColor, 1], // Very rare (0.1% of population)
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 2,
        filter: true,
      });

      // Rare color should be filtered out
      expect(result).toContain(commonColor);
      expect(result).not.toContain(rareColor);
    });

    it("should handle monochrome images", () => {
      const black = utils.argbFromRgb(0, 0, 0);
      const gray = utils.argbFromRgb(128, 128, 128);
      const white = utils.argbFromRgb(255, 255, 255);

      const colorsToPopulation = new Map([
        [black, 100],
        [gray, 100],
        [white, 100],
      ]);

      const result = Score.score(colorsToPopulation, {
        desired: 3,
        filter: true,
      });

      // All grayscale colors have low chroma, might return fallback
      if (result.length === 1) {
        expect(result[0]).toBe(0xff4285f4); // Fallback color
      }
    });

    it("should maintain minimum hue difference between selected colors", () => {
      const colors = new Map<number, number>();

      // Add colors with small hue differences
      for (let i = 0; i < 20; i++) {
        const hue = i * 5; // 5 degree increments
        const hct = Hct.from(hue, 50, 50);
        colors.set(hct.toInt(), 100);
      }

      const result = Score.score(colors, {
        desired: 4,
        filter: false,
      });

      // Check that selected colors have reasonable hue separation
      if (result.length > 1) {
        const hues = result.map((argb) => Hct.fromInt(argb).hue);

        for (let i = 0; i < hues.length; i++) {
          for (let j = i + 1; j < hues.length; j++) {
            const diff = Math.abs(hues[i] - hues[j]);
            const normalizedDiff = Math.min(diff, 360 - diff);

            // Should maintain at least 15 degrees separation
            expect(normalizedDiff).toBeGreaterThanOrEqual(15);
          }
        }
      }
    });

    it("should work with default options", () => {
      const color1 = utils.argbFromRgb(255, 0, 0);
      const color2 = utils.argbFromRgb(0, 255, 0);

      const colorsToPopulation = new Map([
        [color1, 100],
        [color2, 50],
      ]);

      const result = Score.score(colorsToPopulation);

      // Should use default desired (4) and filter (true)
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(4);
    });
  });
});
