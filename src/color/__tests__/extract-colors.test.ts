/**
 * Tests for color extraction from images
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractColors, extractThemePalette } from "../extract-colors.js";
import * as utils from "../utils/color_utils.js";

// Mock the quantizer and scorer for predictable tests
vi.mock("../quantize/quantizer_celebi", () => ({
  QuantizerCelebi: {
    quantize: vi.fn(),
  },
}));

vi.mock("../score/score", () => ({
  Score: {
    score: vi.fn(),
  },
}));

describe("Color Extraction", () => {
  describe("extractColors", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should extract colors with default options", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      // Mock quantizer to return test colors
      const mockQuantized = new Map([
        [utils.argbFromRgb(0, 0, 255), 60], // Blue
        [utils.argbFromRgb(0, 255, 0), 80], // Green
        [utils.argbFromRgb(255, 0, 0), 100], // Red
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([
        utils.argbFromRgb(255, 0, 0),
        utils.argbFromRgb(0, 255, 0),
      ]);

      const imageData = {
        data: new Uint8ClampedArray([
          255, 0, 0, 255, 0, 255, 0, 255, 0, 0, 255, 255,
        ]),
        height: 1,
        width: 3,
      };

      const colors = extractColors(imageData);

      expect(colors).toHaveLength(2);
      expect(colors[0].hex).toBe("#ff0000");
      expect(colors[0].rgb).toEqual({ b: 0, g: 0, r: 255 });
      expect(colors[0].population).toBe(100);
      expect(colors[0].percentage).toBeCloseTo(41.67, 1);
    });

    it("should extract colors with low quality setting", async () => {
      const { QuantizerCelebi } = await import("../quantize/quantizer_celebi");

      const mockQuantized = new Map([[utils.argbFromRgb(128, 128, 128), 50]]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);

      const imageData = {
        data: new Uint8ClampedArray(100 * 100 * 4), // Large image
        height: 100,
        width: 100,
      };

      extractColors(imageData, { quality: "low" });

      // Check that quantizer was called with correct max colors for low quality
      expect(QuantizerCelebi.quantize).toHaveBeenCalledWith(
        expect.any(Array),
        64, // Low quality uses 64 colors
      );
    });

    it("should extract colors with high quality setting", async () => {
      const { QuantizerCelebi } = await import("../quantize/quantizer_celebi");

      const mockQuantized = new Map([[utils.argbFromRgb(128, 128, 128), 50]]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);

      const imageData = {
        data: new Uint8ClampedArray(100 * 100 * 4),
        height: 100,
        width: 100,
      };

      extractColors(imageData, { quality: "high" });

      expect(QuantizerCelebi.quantize).toHaveBeenCalledWith(
        expect.any(Array),
        256, // High quality uses 256 colors
      );
    });

    it("should extract colors without scoring", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(0, 0, 255), 60],
        [utils.argbFromRgb(0, 255, 0), 80],
        [utils.argbFromRgb(255, 0, 0), 100],
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);

      const imageData = {
        data: new Uint8ClampedArray([255, 0, 0, 255]),
        height: 1,
        width: 1,
      };

      const colors = extractColors(imageData, {
        maxColors: 2,
        scoringEnabled: false,
      });

      // Should not call Score.score
      expect(Score.score).not.toHaveBeenCalled();

      // Should return top 2 by population
      expect(colors).toHaveLength(2);
      expect(colors[0].hex).toBe("#ff0000");
      expect(colors[1].hex).toBe("#00ff00");
    });

    it("should handle empty image data", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(new Map());
      vi.mocked(Score.score).mockReturnValue([]);

      const imageData = {
        data: new Uint8ClampedArray([]),
        height: 0,
        width: 0,
      };

      const colors = extractColors(imageData);
      expect(colors).toHaveLength(0);
    });

    it("should calculate correct percentages", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(0, 255, 0), 25],
        [utils.argbFromRgb(255, 0, 0), 75],
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([
        utils.argbFromRgb(255, 0, 0),
        utils.argbFromRgb(0, 255, 0),
      ]);

      const imageData = {
        data: new Uint8ClampedArray([255, 0, 0, 255]),
        height: 1,
        width: 1,
      };

      const colors = extractColors(imageData);

      expect(colors[0].percentage).toBe(75);
      expect(colors[1].percentage).toBe(25);
    });
  });

  describe("extractThemePalette", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("should extract theme palette with primary color", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(103, 80, 164), 100], // Primary purple
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([utils.argbFromRgb(103, 80, 164)]);

      const imageData = {
        data: new Uint8ClampedArray([103, 80, 164, 255]),
        height: 1,
        width: 1,
      };

      const palette = extractThemePalette(imageData);

      expect(palette.primary).toBeDefined();
      expect(palette.primary.hex).toBe("#6750a4");
    });

    it("should extract secondary with different hue", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(103, 80, 164), 100], // Purple
        [utils.argbFromRgb(110, 80, 164), 60], // Similar purple
        [utils.argbFromRgb(255, 0, 0), 80], // Red (very different hue)
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([
        utils.argbFromRgb(103, 80, 164),
        utils.argbFromRgb(255, 0, 0),
        utils.argbFromRgb(110, 80, 164),
      ]);

      const imageData = {
        data: new Uint8ClampedArray([103, 80, 164, 255]),
        height: 1,
        width: 1,
      };

      const palette = extractThemePalette(imageData);

      expect(palette.primary).toBeDefined();
      expect(palette.secondary).toBeDefined();
      expect(palette.secondary?.hex).toBe("#ff0000"); // Red should be secondary
    });

    it("should find neutral color with low chroma", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(103, 80, 164), 100], // Primary
        [utils.argbFromRgb(128, 128, 128), 50], // Gray (low chroma)
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([
        utils.argbFromRgb(103, 80, 164),
        utils.argbFromRgb(128, 128, 128),
      ]);

      const imageData = {
        data: new Uint8ClampedArray([103, 80, 164, 255]),
        height: 1,
        width: 1,
      };

      const palette = extractThemePalette(imageData);

      expect(palette.neutral).toBeDefined();
      expect(palette.neutral?.hct.c).toBeLessThan(20); // Low chroma
    });

    it("should find error color in red hue range", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const primaryArgb = utils.argbFromRgb(103, 80, 164);
      const redArgb = utils.argbFromRgb(255, 20, 20);

      const mockQuantized = new Map([
        [primaryArgb, 100], // Primary
        [redArgb, 50], // Red for error
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([primaryArgb, redArgb]);

      const imageData = {
        data: new Uint8ClampedArray([103, 80, 164, 255]),
        height: 1,
        width: 1,
      };

      const palette = extractThemePalette(imageData);

      expect(palette.error).toBeDefined();
      // Red/orange hue should be 0-40 or 350-360
      const errorHue = palette.error?.hct.h || 0;
      expect(errorHue <= 40 || errorHue >= 350).toBe(true);
    });

    it("should throw error for empty image", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(new Map());
      vi.mocked(Score.score).mockReturnValue([]);

      const imageData = {
        data: new Uint8ClampedArray([]),
        height: 0,
        width: 0,
      };

      expect(() => extractThemePalette(imageData)).toThrow(
        "No colors could be extracted from image",
      );
    });

    it("should handle single color image", async () => {
      const { QuantizerCelebi } = await import(
        "../quantize/quantizer_celebi.js"
      );
      const { Score } = await import("../score/score.js");

      const mockQuantized = new Map([
        [utils.argbFromRgb(0, 128, 255), 100], // Single blue color
      ]);

      vi.mocked(QuantizerCelebi.quantize).mockReturnValue(mockQuantized);
      vi.mocked(Score.score).mockReturnValue([utils.argbFromRgb(0, 128, 255)]);

      const imageData = {
        data: new Uint8ClampedArray([0, 128, 255, 255]),
        height: 1,
        width: 1,
      };

      const palette = extractThemePalette(imageData);

      expect(palette.primary).toBeDefined();
      expect(palette.primary.hex).toBe("#0080ff");
      expect(palette.secondary).toBeUndefined();
      expect(palette.tertiary).toBeUndefined();
    });
  });
});
