/**
 * Tests for image processing utilities
 */

import { describe, expect, it } from "vitest";

import {
  filterExtremeTones,
  imageDataToPixels,
  samplePixels,
} from "../image-utils";
import * as utils from "../utils/color_utils";

describe("Image Processing Utilities", () => {
  describe("imageDataToPixels", () => {
    it("should convert RGBA data to ARGB pixels", () => {
      const imageData = {
        data: new Uint8ClampedArray([
          255,
          0,
          0,
          255, // Red pixel
          0,
          255,
          0,
          255, // Green pixel
          0,
          0,
          255,
          255, // Blue pixel
        ]),
        height: 1,
        width: 3,
      };

      const pixels = imageDataToPixels(imageData);

      expect(pixels).toHaveLength(3);
      expect(pixels[0]).toBe(utils.argbFromRgb(255, 0, 0));
      expect(pixels[1]).toBe(utils.argbFromRgb(0, 255, 0));
      expect(pixels[2]).toBe(utils.argbFromRgb(0, 0, 255));
    });

    it("should skip transparent pixels", () => {
      const imageData = {
        data: new Uint8ClampedArray([
          255,
          0,
          0,
          255, // Opaque red
          0,
          255,
          0,
          0, // Fully transparent green
          0,
          0,
          255,
          128, // Semi-transparent blue
          255,
          255,
          0,
          2, // Nearly transparent yellow (< 1%)
        ]),
        height: 2,
        width: 2,
      };

      const pixels = imageDataToPixels(imageData);

      // Should keep opaque and semi-transparent, skip fully and nearly transparent
      expect(pixels).toHaveLength(2);
      expect(pixels[0]).toBe(utils.argbFromRgb(255, 0, 0));
      expect(pixels[1]).toBe(utils.argbFromRgb(0, 0, 255));
    });

    it("should handle regular number array input", () => {
      const imageData = {
        data: [255, 255, 255, 255, 0, 0, 0, 255],
        height: 1,
        width: 2,
      };

      const pixels = imageDataToPixels(imageData);

      expect(pixels).toHaveLength(2);
      expect(pixels[0]).toBe(utils.argbFromRgb(255, 255, 255));
      expect(pixels[1]).toBe(utils.argbFromRgb(0, 0, 0));
    });

    it("should handle empty image data", () => {
      const imageData = {
        data: new Uint8ClampedArray([]),
        height: 0,
        width: 0,
      };

      const pixels = imageDataToPixels(imageData);
      expect(pixels).toHaveLength(0);
    });

    it("should handle single pixel", () => {
      const imageData = {
        data: new Uint8ClampedArray([128, 64, 192, 255]),
        height: 1,
        width: 1,
      };

      const pixels = imageDataToPixels(imageData);
      expect(pixels).toHaveLength(1);
      expect(pixels[0]).toBe(utils.argbFromRgb(128, 64, 192));
    });
  });

  describe("samplePixels", () => {
    it("should return all pixels when under limit", () => {
      const pixels = [1, 2, 3, 4, 5];
      const sampled = samplePixels(pixels, 10);

      expect(sampled).toEqual(pixels);
    });

    it("should sample evenly when over limit", () => {
      const pixels = Array.from({ length: 100 }, (_, i) => i);
      const sampled = samplePixels(pixels, 10);

      expect(sampled).toHaveLength(10);
      expect(sampled[0]).toBe(0);
      expect(sampled[1]).toBe(10);
      expect(sampled[2]).toBe(20);
      expect(sampled[9]).toBe(90);
    });

    it("should handle exact limit", () => {
      const pixels = [1, 2, 3, 4, 5];
      const sampled = samplePixels(pixels, 5);

      expect(sampled).toEqual(pixels);
    });

    it("should handle single pixel with limit 1", () => {
      const pixels = [42];
      const sampled = samplePixels(pixels, 1);

      expect(sampled).toEqual([42]);
    });

    it("should use default maxPixels of 10000", () => {
      const pixels = Array.from({ length: 5000 }, (_, i) => i);
      const sampled = samplePixels(pixels);

      expect(sampled).toHaveLength(5000); // Under default limit
    });

    it("should sample large arrays with default limit", () => {
      const pixels = Array.from({ length: 20000 }, (_, i) => i);
      const sampled = samplePixels(pixels);

      expect(sampled.length).toBeLessThanOrEqual(10000);
      expect(sampled[0]).toBe(0);
    });
  });

  describe("filterExtremeTones", () => {
    it("should filter near-black pixels", () => {
      const blackPixel = utils.argbFromRgb(10, 10, 10); // Very dark
      const midPixel = utils.argbFromRgb(128, 128, 128); // Middle gray

      const pixels = [blackPixel, midPixel];
      const filtered = filterExtremeTones(pixels);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(midPixel);
    });

    it("should filter near-white pixels", () => {
      const whitePixel = utils.argbFromRgb(250, 250, 250); // Very light
      const midPixel = utils.argbFromRgb(128, 128, 128); // Middle gray

      const pixels = [whitePixel, midPixel];
      const filtered = filterExtremeTones(pixels);

      expect(filtered).toHaveLength(1);
      expect(filtered[0]).toBe(midPixel);
    });

    it("should keep mid-tone pixels", () => {
      const pixels = [
        utils.argbFromRgb(50, 50, 50), // Dark but not too dark
        utils.argbFromRgb(100, 100, 100), // Mid-dark
        utils.argbFromRgb(150, 150, 150), // Mid-light
        utils.argbFromRgb(200, 200, 200), // Light but not too light
      ];

      const filtered = filterExtremeTones(pixels);
      expect(filtered).toHaveLength(4);
    });

    it("should handle colored pixels correctly", () => {
      const pixels = [
        utils.argbFromRgb(255, 0, 0), // Pure red - should be kept
        utils.argbFromRgb(0, 255, 0), // Pure green - should be kept
        utils.argbFromRgb(0, 0, 255), // Pure blue - should be kept
        utils.argbFromRgb(5, 5, 5), // Near black - should be filtered
        utils.argbFromRgb(250, 250, 250), // Near white - should be filtered
      ];

      const filtered = filterExtremeTones(pixels);
      expect(filtered).toHaveLength(3);

      // Check that primary colors are kept
      const filteredRgbs = filtered.map((pixel) => ({
        b: utils.blueFromArgb(pixel),
        g: utils.greenFromArgb(pixel),
        r: utils.redFromArgb(pixel),
      }));

      expect(filteredRgbs).toContainEqual({ b: 0, g: 0, r: 255 });
      expect(filteredRgbs).toContainEqual({ b: 0, g: 255, r: 0 });
      expect(filteredRgbs).toContainEqual({ b: 255, g: 0, r: 0 });
    });

    it("should handle empty array", () => {
      const filtered = filterExtremeTones([]);
      expect(filtered).toHaveLength(0);
    });

    it("should filter based on luminance calculation", () => {
      // Test edge cases for luminance calculation
      // Luminance = 0.299 * R + 0.587 * G + 0.114 * B

      // Just above 5% threshold (12.75)
      const justAbove = utils.argbFromRgb(13, 13, 13);
      // Just below 95% threshold (242.25)
      const justBelow = utils.argbFromRgb(242, 242, 242);

      const pixels = [justAbove, justBelow];
      const filtered = filterExtremeTones(pixels);

      expect(filtered).toHaveLength(2); // Both should be kept
    });
  });
});
