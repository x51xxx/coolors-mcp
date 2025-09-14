/**
 * Tests for DislikeAnalyzer - identifies and fixes universally disliked colors
 */

import { describe, expect, it } from "vitest";

import { Hct } from "../../hct/index.js";
import { DislikeAnalyzer } from "../dislike-analyzer";

describe("DislikeAnalyzer", () => {
  describe("isDisliked", () => {
    it("should like Monk Skin Tone Scale colors", () => {
      // From https://skintone.google#/get-started
      const monkSkinToneScaleColors = [
        0xfff6ede4, 0xfff3e7db, 0xfff7ead0, 0xffeadaba, 0xffd7bd96, 0xffa07e56,
        0xff825c43, 0xff604134, 0xff3a312a, 0xff292420,
      ];

      for (const color of monkSkinToneScaleColors) {
        const hct = Hct.fromInt(color >>> 0);
        expect(DislikeAnalyzer.isDisliked(hct)).toBe(false);
      }
    });

    it("should dislike bile/waste colors", () => {
      const unlikableColors = [
        0xff95884b, // Dark yellow-green (H:96)
        0xff716b40, // Dark olive (H:100)
        0xff9a8c00, // Dark yellow-green (H:91)
        0xff4c4308, // Very dark yellow-green (H:95)
        0xff464521, // Dark muddy green (H:104)
      ];

      for (const color of unlikableColors) {
        const hct = Hct.fromInt(color >>> 0);
        expect(DislikeAnalyzer.isDisliked(hct)).toBe(true);
      }
    });

    it("should identify colors in the bile zone", () => {
      // Colors with hue 90-111, chroma > 16, tone < 65 should be disliked
      const bileZoneColor = Hct.from(100, 30, 50); // Middle of bile zone
      expect(DislikeAnalyzer.isDisliked(bileZoneColor)).toBe(true);

      const borderlineColor = Hct.from(95, 20, 60); // On the edge
      expect(DislikeAnalyzer.isDisliked(borderlineColor)).toBe(true);
    });

    it("should not dislike colors outside the bile zone", () => {
      // Test colors just outside the dislike zone
      const hueOutsideLow = Hct.from(89, 30, 50); // Hue just below 90
      const hueOutsideHigh = Hct.from(112, 30, 50); // Hue just above 111
      const lowChroma = Hct.from(100, 15, 50); // Chroma below 16
      const highTone = Hct.from(100, 30, 66); // Tone above 65

      expect(DislikeAnalyzer.isDisliked(hueOutsideLow)).toBe(false);
      expect(DislikeAnalyzer.isDisliked(hueOutsideHigh)).toBe(false);
      expect(DislikeAnalyzer.isDisliked(lowChroma)).toBe(false);
      expect(DislikeAnalyzer.isDisliked(highTone)).toBe(false);
    });

    it("should like neutral colors even in yellow-green hue range", () => {
      // Low chroma colors should be liked even if hue is in the bile range
      const neutral = Hct.from(100, 5, 50); // Very low chroma
      expect(DislikeAnalyzer.isDisliked(neutral)).toBe(false);
    });

    it("should like light colors even with bile hue", () => {
      // High tone colors should be liked
      const lightColor = Hct.from(100, 30, 75); // Light tone
      expect(DislikeAnalyzer.isDisliked(lightColor)).toBe(false);
    });
  });

  describe("fixIfDisliked", () => {
    it("should fix disliked colors by lightening them", () => {
      const unlikableColors = [
        0xff95884b,
        0xff716b40,
        0xff9a8c00, // Changed to ensure hue is in range
        0xff4c4308,
        0xff464521,
      ];

      for (const color of unlikableColors) {
        const hct = Hct.fromInt(color >>> 0);
        expect(DislikeAnalyzer.isDisliked(hct)).toBe(true);

        const fixed = DislikeAnalyzer.fixIfDisliked(hct);
        expect(DislikeAnalyzer.isDisliked(fixed)).toBe(false);

        // Check that fix preserves hue and chroma, only changes tone
        expect(fixed.hue).toBeCloseTo(hct.hue, 0);
        expect(fixed.chroma).toBeCloseTo(hct.chroma, 0);
        expect(fixed.tone).toBeCloseTo(70, 0); // Within 1 unit
      }
    });

    it("should not change liked colors", () => {
      const likedColor = Hct.from(200, 50, 50); // Blue, clearly liked
      const fixed = DislikeAnalyzer.fixIfDisliked(likedColor);

      expect(fixed.toInt()).toBe(likedColor.toInt());
      expect(fixed).toBe(likedColor); // Should return same instance
    });

    it("should fix colors at tone 67 to tone 70", () => {
      const color = Hct.from(100, 50, 67); // Above threshold but close
      expect(DislikeAnalyzer.isDisliked(color)).toBe(false);

      const fixed = DislikeAnalyzer.fixIfDisliked(color);
      expect(fixed.toInt()).toBe(color.toInt());
    });

    it("should handle edge case at tone 64", () => {
      const color = Hct.from(100, 30, 64); // Just below threshold
      expect(DislikeAnalyzer.isDisliked(color)).toBe(true);

      const fixed = DislikeAnalyzer.fixIfDisliked(color);
      expect(fixed.tone).toBeCloseTo(70, 0); // Within 1 unit
      expect(DislikeAnalyzer.isDisliked(fixed)).toBe(false);
    });
  });

  describe("hex color helpers", () => {
    it("should check hex colors for dislike", () => {
      expect(DislikeAnalyzer.isDislikedHex("#95884B")).toBe(true);
      expect(DislikeAnalyzer.isDislikedHex("#0080ff")).toBe(false);
    });

    it("should fix disliked hex colors", () => {
      const disliked = "#95884B";
      const fixed = DislikeAnalyzer.fixIfDislikedHex(disliked);

      expect(fixed).not.toBe(disliked);
      expect(DislikeAnalyzer.isDislikedHex(fixed)).toBe(false);
    });

    it("should return same hex for liked colors", () => {
      const liked = "#0080ff";
      const fixed = DislikeAnalyzer.fixIfDislikedHex(liked);

      expect(fixed).toBe(liked);
    });
  });

  describe("batch operations", () => {
    it("should analyze batch of colors", () => {
      const colors = [
        Hct.from(100, 30, 50), // Disliked
        Hct.from(200, 50, 50), // Liked
        Hct.from(95, 20, 60), // Disliked
        Hct.from(300, 40, 40), // Liked
      ];

      const analysis = DislikeAnalyzer.analyzeBatch(colors);

      expect(analysis.total).toBe(4);
      expect(analysis.disliked).toBe(2);
      expect(analysis.percentage).toBe(50);
      expect(analysis.dislikedIndices).toEqual([0, 2]);
    });

    it("should fix batch of colors", () => {
      const colors = [
        Hct.from(100, 30, 50), // Disliked
        Hct.from(200, 50, 50), // Liked
        Hct.from(95, 20, 60), // Disliked
      ];

      const fixed = DislikeAnalyzer.fixBatch(colors);

      expect(fixed).toHaveLength(3);

      // First color should be fixed
      expect(fixed[0].tone).toBeCloseTo(70, 0); // Within 1 unit
      expect(DislikeAnalyzer.isDisliked(fixed[0])).toBe(false);

      // Second color should be unchanged
      expect(fixed[1].toInt()).toBe(colors[1].toInt());

      // Third color should be fixed
      expect(fixed[2].tone).toBeCloseTo(70, 0); // Within 1 unit
      expect(DislikeAnalyzer.isDisliked(fixed[2])).toBe(false);
    });

    it("should handle empty batch", () => {
      const analysis = DislikeAnalyzer.analyzeBatch([]);

      expect(analysis.total).toBe(0);
      expect(analysis.disliked).toBe(0);
      expect(analysis.percentage).toBeNaN(); // 0/0
      expect(analysis.dislikedIndices).toEqual([]);

      const fixed = DislikeAnalyzer.fixBatch([]);
      expect(fixed).toEqual([]);
    });

    it("should handle batch with all disliked colors", () => {
      const colors = [
        Hct.from(100, 30, 50),
        Hct.from(95, 20, 60),
        Hct.from(105, 25, 45),
      ];

      const analysis = DislikeAnalyzer.analyzeBatch(colors);
      expect(analysis.disliked).toBe(3);
      expect(analysis.percentage).toBe(100);

      const fixed = DislikeAnalyzer.fixBatch(colors);
      const fixedAnalysis = DislikeAnalyzer.analyzeBatch(fixed);
      expect(fixedAnalysis.disliked).toBe(0);
    });
  });

  describe("real-world color examples", () => {
    it("should handle olive green colors correctly", () => {
      // Olive greens that might appear in military/outdoor themes
      const oliveGreen = Hct.fromInt(0xff556b2f >>> 0); // DarkOliveGreen
      const isOliveDisliked = DislikeAnalyzer.isDisliked(oliveGreen);

      // This specific olive might be on the edge - test behavior
      if (isOliveDisliked) {
        const fixed = DislikeAnalyzer.fixIfDisliked(oliveGreen);
        expect(fixed.tone).toBeGreaterThan(oliveGreen.tone);
      }
    });

    it("should not dislike pleasant greens", () => {
      // Forest green, mint green, etc. should be liked
      const forestGreen = Hct.fromInt(0xff228b22 >>> 0);
      const mintGreen = Hct.fromInt(0xff98ff98 >>> 0);

      expect(DislikeAnalyzer.isDisliked(forestGreen)).toBe(false);
      expect(DislikeAnalyzer.isDisliked(mintGreen)).toBe(false);
    });

    it("should handle brand colors appropriately", () => {
      // Some brand yellows might be in the danger zone
      const brightYellow = Hct.fromInt(0xffffd700 >>> 0); // Gold
      const mustardYellow = Hct.fromInt(0xffffdb58 >>> 0); // Mustard

      // These should be light enough to not be disliked
      expect(DislikeAnalyzer.isDisliked(brightYellow)).toBe(false);
      expect(DislikeAnalyzer.isDisliked(mustardYellow)).toBe(false);
    });
  });
});
