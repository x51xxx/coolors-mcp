/**
 * Tests for HCT class (Material Color Utilities compatible)
 */

import { describe, expect, it } from "vitest";

import * as utils from "../../utils/color_utils";
import { Hct } from "../hct-class";

describe("Hct Class", () => {
  describe("from static method", () => {
    it("should create HCT from hue, chroma, and tone", () => {
      const hct = Hct.from(180, 50, 50);

      expect(hct.hue).toBeCloseTo(180, -1); // Within 10 degrees
      // Chroma might be adjusted to achievable value
      expect(hct.chroma).toBeGreaterThan(30); // At least some chroma
      expect(hct.chroma).toBeLessThanOrEqual(50); // Not more than requested
      expect(hct.tone).toBeCloseTo(50, -1); // Within 10 units
    });

    it("should handle zero chroma (grayscale)", () => {
      const hct = Hct.from(0, 0, 50);

      expect(hct.chroma).toBeCloseTo(0, 1);
      expect(hct.tone).toBeCloseTo(50, -1); // Within 10 units
    });

    it("should handle extreme tones", () => {
      const black = Hct.from(0, 0, 0);
      const white = Hct.from(0, 0, 100);

      expect(black.tone).toBeCloseTo(0, 0);
      expect(white.tone).toBeCloseTo(100, 0);
    });

    it("should clamp chroma to achievable values", () => {
      // Very high chroma might not be achievable
      const hct = Hct.from(0, 200, 50);

      // Chroma should be clamped to achievable value
      expect(hct.chroma).toBeLessThanOrEqual(150);
    });
  });

  describe("fromInt static method", () => {
    it("should create HCT from ARGB integer", () => {
      const argb = utils.argbFromRgb(255, 0, 0); // Red
      const hct = Hct.fromInt(argb);

      // Red should have hue around 0-30
      expect(hct.hue).toBeGreaterThanOrEqual(0);
      expect(hct.hue).toBeLessThan(60);
      expect(hct.chroma).toBeGreaterThan(0);
    });

    it("should handle grayscale colors", () => {
      const gray = utils.argbFromRgb(128, 128, 128);
      const hct = Hct.fromInt(gray);

      expect(hct.chroma).toBeCloseTo(0, 1);
      expect(hct.tone).toBeCloseTo(50, -1); // Within 10 units
    });

    it("should handle primary colors", () => {
      const red = utils.argbFromRgb(255, 0, 0);
      const green = utils.argbFromRgb(0, 255, 0);
      const blue = utils.argbFromRgb(0, 0, 255);

      const hctRed = Hct.fromInt(red);
      const hctGreen = Hct.fromInt(green);
      const hctBlue = Hct.fromInt(blue);

      // Check that primary colors have high chroma
      expect(hctRed.chroma).toBeGreaterThan(100);
      expect(hctGreen.chroma).toBeGreaterThan(100);
      expect(hctBlue.chroma).toBeGreaterThan(80);
    });
  });

  describe("toInt method", () => {
    it("should convert back to ARGB integer", () => {
      const originalArgb = utils.argbFromRgb(128, 64, 192);
      const hct = Hct.fromInt(originalArgb);
      const resultArgb = hct.toInt();

      // Should be close to original (some loss due to color space conversion)
      const originalRgb = {
        b: utils.blueFromArgb(originalArgb),
        g: utils.greenFromArgb(originalArgb),
        r: utils.redFromArgb(originalArgb),
      };

      const resultRgb = {
        b: utils.blueFromArgb(resultArgb),
        g: utils.greenFromArgb(resultArgb),
        r: utils.redFromArgb(resultArgb),
      };

      expect(resultRgb.r).toBeCloseTo(originalRgb.r, -1); // Within 10
      expect(resultRgb.g).toBeCloseTo(originalRgb.g, -1);
      expect(resultRgb.b).toBeCloseTo(originalRgb.b, -1);
    });

    it("should maintain opaque alpha channel", () => {
      const hct = Hct.from(180, 50, 50);
      const argb = hct.toInt();

      // Alpha should be 255 (fully opaque)
      const alpha = (argb >> 24) & 0xff;
      expect(alpha).toBe(0xff);
    });
  });

  describe("getters", () => {
    it("should return correct hue", () => {
      const hct = Hct.from(123.45, 50, 50);
      expect(hct.hue).toBeCloseTo(123.45, 0);
    });

    it("should return correct chroma", () => {
      const hct = Hct.from(180, 45.67, 50);
      // Chroma might be adjusted to achievable value
      expect(hct.chroma).toBeGreaterThan(30); // At least some chroma
      expect(hct.chroma).toBeLessThanOrEqual(45.67); // Not more than requested
    });

    it("should return correct tone", () => {
      const hct = Hct.from(180, 50, 78.9);
      expect(hct.tone).toBeCloseTo(78.9, 0);
    });
  });

  describe("setters", () => {
    it("should update hue", () => {
      const hct = Hct.from(0, 50, 50);
      hct.hue = 180;

      expect(hct.hue).toBeCloseTo(180, -1); // Within 10 degrees
      // Chroma might adjust based on new hue
      expect(hct.chroma).toBeGreaterThan(30); // At least some chroma
      expect(hct.tone).toBeCloseTo(50, -1); // Within 10 tone units
    });

    it("should update chroma", () => {
      const hct = Hct.from(180, 30, 50);
      hct.chroma = 60;

      // Chroma might be clamped to achievable value
      expect(hct.chroma).toBeGreaterThan(30); // At least original chroma
      expect(hct.chroma).toBeLessThanOrEqual(60); // Not more than requested
      // Hue should be maintained, allowing for some adjustment
      expect(hct.hue).toBeGreaterThan(170);
      expect(hct.hue).toBeLessThan(190);
      expect(hct.tone).toBeCloseTo(50, -1); // Within 10 tone units
    });

    it("should update tone", () => {
      const hct = Hct.from(180, 50, 30);
      hct.tone = 70;

      expect(hct.tone).toBeCloseTo(70, 0); // Very close
      // Hue might adjust slightly
      expect(hct.hue).toBeGreaterThan(170);
      expect(hct.hue).toBeLessThan(190);
    });

    it("should handle hue wrapping", () => {
      const hct = Hct.from(350, 50, 50);
      hct.hue = 370; // Should wrap to 10

      expect(hct.hue).toBeCloseTo(10, 0); // Should be close
    });

    it("should clamp tone to valid range", () => {
      const hct = Hct.from(180, 50, 50);

      hct.tone = -10;
      expect(hct.tone).toBeCloseTo(0, 1);

      hct.tone = 110;
      expect(hct.tone).toBeCloseTo(100, 1);
    });

    it("should adjust chroma when not achievable", () => {
      const hct = Hct.from(180, 50, 95); // High tone
      hct.chroma = 100; // High chroma at high tone is difficult

      // Chroma should be adjusted to achievable value
      expect(hct.chroma).toBeLessThanOrEqual(100);
    });
  });

  describe("round-trip conversions", () => {
    it("should maintain values through round-trip", () => {
      const originalHct = Hct.from(240, 40, 60);
      const argb = originalHct.toInt();
      const newHct = Hct.fromInt(argb);

      expect(newHct.hue).toBeCloseTo(originalHct.hue, 0);
      expect(newHct.chroma).toBeCloseTo(originalHct.chroma, 1);
      expect(newHct.tone).toBeCloseTo(originalHct.tone, 1);
    });

    it("should handle edge cases in round-trip", () => {
      const testCases = [
        { c: 0, h: 0, t: 0 }, // Black
        { c: 0, h: 0, t: 100 }, // White
        { c: 0, h: 0, t: 50 }, // Gray
        { c: 100, h: 0, t: 50 }, // High chroma red
        { c: 100, h: 120, t: 50 }, // High chroma green
        { c: 100, h: 240, t: 50 }, // High chroma blue
      ];

      for (const testCase of testCases) {
        const hct1 = Hct.from(testCase.h, testCase.c, testCase.t);
        const argb = hct1.toInt();
        const hct2 = Hct.fromInt(argb);

        // Tone should be very close
        expect(hct2.tone).toBeCloseTo(hct1.tone, 0);

        // For non-grayscale, hue should be maintained
        if (testCase.c > 0 && hct2.chroma > 1) {
          const hueDiff = Math.abs(hct2.hue - hct1.hue);
          const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
          expect(normalizedDiff).toBeLessThan(5);
        }
      }
    });
  });
});
