/**
 * Tests for color distance metrics
 */

import { describe, expect, it } from "vitest";

import type { LAB, RGB } from "./types";

import { rgbToLab } from "./conversions";
import {
  areColorsSimilar,
  colorDistance,
  deltaE2000,
  deltaE76,
  deltaE94,
  euclideanDistance,
  findMostDifferentColor,
  findMostSimilarColor,
  weightedRgbDistance,
} from "./metrics";

describe("Color Metrics", () => {
  describe("euclideanDistance", () => {
    it("should calculate Euclidean distance correctly", () => {
      const black: RGB = { b: 0, g: 0, r: 0 };
      const white: RGB = { b: 255, g: 255, r: 255 };
      const red: RGB = { b: 0, g: 0, r: 255 };
      const green: RGB = { b: 0, g: 255, r: 0 };

      // Same color should have distance 0
      expect(euclideanDistance(black, black)).toBe(0);
      expect(euclideanDistance(white, white)).toBe(0);

      // Black to white - maximum distance in RGB cube
      expect(euclideanDistance(black, white)).toBeCloseTo(441.67, 2);

      // Red to green
      expect(euclideanDistance(red, green)).toBeCloseTo(360.62, 2);
    });
  });

  describe("weightedRgbDistance", () => {
    it("should calculate weighted RGB distance with default weights", () => {
      const black: RGB = { b: 0, g: 0, r: 0 };
      const white: RGB = { b: 255, g: 255, r: 255 };

      const distance = weightedRgbDistance(black, white);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(euclideanDistance(black, white));
    });

    it("should use custom weights", () => {
      const color1: RGB = { b: 100, g: 100, r: 100 };
      const color2: RGB = { b: 150, g: 150, r: 150 };

      const defaultDistance = weightedRgbDistance(color1, color2);
      const customDistance = weightedRgbDistance(color1, color2, {
        b: 0,
        g: 0,
        r: 1,
      });

      expect(customDistance).toBe(50); // Only red channel difference
      expect(defaultDistance).not.toBe(customDistance);
    });
  });

  describe("deltaE76", () => {
    it("should calculate Delta E 76 correctly", () => {
      const lab1: LAB = { a: 0, b: 0, l: 50 };
      const lab2: LAB = { a: 0, b: 0, l: 50 };

      // Same color
      expect(deltaE76(lab1, lab2)).toBe(0);

      // Different colors
      const lab3: LAB = { a: 10, b: 10, l: 60 };
      const distance = deltaE76(lab1, lab3);
      expect(distance).toBeCloseTo(17.32, 2);
    });

    it("should work with actual colors", () => {
      const red = rgbToLab({ b: 0, g: 0, r: 255 });
      const green = rgbToLab({ b: 0, g: 255, r: 0 });
      const blue = rgbToLab({ b: 255, g: 0, r: 0 });

      const redGreenDistance = deltaE76(red, green);
      const redBlueDistance = deltaE76(red, blue);
      const greenBlueDistance = deltaE76(green, blue);

      // All primary colors should be quite different
      expect(redGreenDistance).toBeGreaterThan(50);
      expect(redBlueDistance).toBeGreaterThan(50);
      expect(greenBlueDistance).toBeGreaterThan(50);
    });
  });

  describe("deltaE94", () => {
    it("should calculate Delta E 94 correctly", () => {
      const lab1: LAB = { a: 0, b: 0, l: 50 };
      const lab2: LAB = { a: 0, b: 0, l: 50 };

      // Same color
      expect(deltaE94(lab1, lab2)).toBe(0);

      // Different colors
      const lab3: LAB = { a: 10, b: 10, l: 60 };
      const distance = deltaE94(lab1, lab3);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(deltaE76(lab1, lab3)); // DE94 may be equal or less than DE76
    });

    it("should use custom parameters", () => {
      const lab1: LAB = { a: 20, b: 20, l: 50 };
      const lab2: LAB = { a: 25, b: 25, l: 60 };

      const defaultDistance = deltaE94(lab1, lab2);
      const customDistance = deltaE94(lab1, lab2, { kC: 1, kH: 1, kL: 2 });

      expect(customDistance).not.toBe(defaultDistance);
    });
  });

  describe("deltaE2000", () => {
    it("should calculate Delta E 2000 correctly", () => {
      const lab1: LAB = { a: 0, b: 0, l: 50 };
      const lab2: LAB = { a: 0, b: 0, l: 50 };

      // Same color
      expect(deltaE2000(lab1, lab2)).toBe(0);

      // Test with known values
      const lab3: LAB = { a: 2.6772, b: -79.7751, l: 50 };
      const lab4: LAB = { a: 0, b: -82.7485, l: 50 };
      const distance = deltaE2000(lab3, lab4);
      expect(distance).toBeCloseTo(2.04, 1);
    });

    it("should handle colors across hue boundaries", () => {
      const red = rgbToLab({ b: 0, g: 0, r: 255 });
      const slightlyDifferentRed = rgbToLab({ b: 5, g: 5, r: 250 });

      const distance = deltaE2000(red, slightlyDifferentRed);
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThan(5); // Should be a small difference
    });
  });

  describe("colorDistance", () => {
    const color1: RGB = { b: 0, g: 0, r: 255 };
    const color2: RGB = { b: 0, g: 255, r: 0 };

    it("should default to deltaE2000", () => {
      const distance1 = colorDistance(color1, color2);
      const distance2 = colorDistance(color1, color2, { metric: "deltaE2000" });
      expect(distance1).toBe(distance2);
    });

    it("should use specified metric", () => {
      const euclidean = colorDistance(color1, color2, { metric: "euclidean" });
      const weighted = colorDistance(color1, color2, { metric: "weighted" });
      const de76 = colorDistance(color1, color2, { metric: "deltaE76" });
      const de94 = colorDistance(color1, color2, { metric: "deltaE94" });
      const de2000 = colorDistance(color1, color2, { metric: "deltaE2000" });

      // All should be different
      expect(euclidean).not.toBe(weighted);
      expect(de76).not.toBe(de94);
      expect(de94).not.toBe(de2000);
    });
  });

  describe("areColorsSimilar", () => {
    it("should identify similar colors", () => {
      const red1: RGB = { b: 0, g: 0, r: 255 };
      const red2: RGB = { b: 5, g: 5, r: 250 };
      const green: RGB = { b: 0, g: 255, r: 0 };

      expect(areColorsSimilar(red1, red1)).toBe(true); // Same color
      expect(areColorsSimilar(red1, red2)).toBe(true); // Very similar
      expect(areColorsSimilar(red1, green)).toBe(false); // Very different
    });

    it("should use custom threshold", () => {
      const color1: RGB = { b: 100, g: 100, r: 100 };
      const color2: RGB = { b: 110, g: 110, r: 110 };

      // With default threshold (2.3)
      expect(areColorsSimilar(color1, color2)).toBe(false);

      // With larger threshold
      expect(areColorsSimilar(color1, color2, 10)).toBe(true);

      // With smaller threshold
      expect(areColorsSimilar(color1, color2, 1)).toBe(false);
    });
  });

  describe("findMostDifferentColor", () => {
    it("should find the most different color", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 }; // Red
      const colors: RGB[] = [
        { b: 0, g: 0, r: 250 }, // Very similar to red
        { b: 0, g: 0, r: 200 }, // Darker red
        { b: 0, g: 255, r: 0 }, // Green - most different
        { b: 100, g: 100, r: 255 }, // Light red
      ];

      const mostDifferent = findMostDifferentColor(baseColor, colors);
      expect(mostDifferent).toEqual({ b: 0, g: 255, r: 0 }); // Green
    });

    it("should return null for empty array", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 };
      expect(findMostDifferentColor(baseColor, [])).toBeNull();
    });

    it("should work with single color", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 };
      const colors: RGB[] = [{ b: 0, g: 255, r: 0 }];

      const result = findMostDifferentColor(baseColor, colors);
      expect(result).toEqual({ b: 0, g: 255, r: 0 });
    });
  });

  describe("findMostSimilarColor", () => {
    it("should find the most similar color", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 }; // Red
      const colors: RGB[] = [
        { b: 0, g: 0, r: 250 }, // Very similar to red - most similar
        { b: 0, g: 0, r: 200 }, // Darker red
        { b: 0, g: 255, r: 0 }, // Green - most different
        { b: 100, g: 100, r: 255 }, // Light red
      ];

      const mostSimilar = findMostSimilarColor(baseColor, colors);
      expect(mostSimilar).toEqual({ b: 0, g: 0, r: 250 });
    });

    it("should return null for empty array", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 };
      expect(findMostSimilarColor(baseColor, [])).toBeNull();
    });

    it("should work with single color", () => {
      const baseColor: RGB = { b: 0, g: 0, r: 255 };
      const colors: RGB[] = [{ b: 0, g: 255, r: 0 }];

      const result = findMostSimilarColor(baseColor, colors);
      expect(result).toEqual({ b: 0, g: 255, r: 0 });
    });
  });

  describe("metric comparisons", () => {
    it("should show different characteristics for each metric", () => {
      // Colors that are perceptually similar but numerically different
      const color1: RGB = { b: 50, g: 50, r: 50 };
      const color2: RGB = { b: 55, g: 55, r: 55 };

      const euclidean = colorDistance(color1, color2, { metric: "euclidean" });
      const weighted = colorDistance(color1, color2, { metric: "weighted" });
      const de76 = colorDistance(color1, color2, { metric: "deltaE76" });
      const de94 = colorDistance(color1, color2, { metric: "deltaE94" });
      const de2000 = colorDistance(color1, color2, { metric: "deltaE2000" });

      // Euclidean should be largest (not perceptually uniform)
      expect(euclidean).toBeGreaterThan(weighted);

      // Delta E formulas should give progressively better perceptual uniformity
      expect(de76).toBeGreaterThan(0);
      expect(de94).toBeGreaterThan(0);
      expect(de2000).toBeGreaterThan(0);
    });
  });
});
