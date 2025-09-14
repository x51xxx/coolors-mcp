/**
 * Tests for ARGB conversion functions
 */

import { describe, expect, it } from "vitest";

import { argbToRgb, rgbToArgb } from "../conversions.js";

describe("ARGB Conversions", () => {
  describe("rgbToArgb", () => {
    it("should convert RGB to ARGB with full opacity", () => {
      const argb = rgbToArgb({ b: 64, g: 128, r: 255 });

      // Check alpha channel (should be 0xff)
      expect((argb >> 24) & 0xff).toBe(0xff);

      // Check RGB channels
      expect((argb >> 16) & 0xff).toBe(255); // Red
      expect((argb >> 8) & 0xff).toBe(128); // Green
      expect(argb & 0xff).toBe(64); // Blue
    });

    it("should handle primary colors", () => {
      const red = rgbToArgb({ b: 0, g: 0, r: 255 });
      const green = rgbToArgb({ b: 0, g: 255, r: 0 });
      const blue = rgbToArgb({ b: 255, g: 0, r: 0 });

      // Use >>> 0 to convert expected values to unsigned
      expect(red).toBe(0xffff0000 >>> 0);
      expect(green).toBe(0xff00ff00 >>> 0);
      expect(blue).toBe(0xff0000ff >>> 0);
    });

    it("should handle black and white", () => {
      const black = rgbToArgb({ b: 0, g: 0, r: 0 });
      const white = rgbToArgb({ b: 255, g: 255, r: 255 });

      expect(black).toBe(0xff000000 >>> 0);
      expect(white).toBe(0xffffffff >>> 0);
    });

    it("should clamp values above 255", () => {
      const argb = rgbToArgb({ b: 1000, g: 256, r: 300 });

      expect((argb >> 16) & 0xff).toBe(255); // Red clamped
      expect((argb >> 8) & 0xff).toBe(255); // Green clamped
      expect(argb & 0xff).toBe(255); // Blue clamped
    });

    it("should clamp negative values to 0", () => {
      const argb = rgbToArgb({ b: -1, g: -100, r: -10 });

      expect((argb >> 16) & 0xff).toBe(0); // Red clamped
      expect((argb >> 8) & 0xff).toBe(0); // Green clamped
      expect(argb & 0xff).toBe(0); // Blue clamped
    });

    it("should round floating point values", () => {
      const argb = rgbToArgb({ b: 127.5, g: 127.3, r: 127.7 });

      expect((argb >> 16) & 0xff).toBe(128); // Rounded up
      expect((argb >> 8) & 0xff).toBe(127); // Rounded down
      expect(argb & 0xff).toBe(128); // Rounded up (0.5 rounds up)
    });

    it("should produce correct 32-bit integer", () => {
      const argb = rgbToArgb({ b: 0x56, g: 0x34, r: 0x12 });

      expect(argb).toBe(0xff123456 >>> 0);
      expect(argb.toString(16)).toBe("ff123456");
    });
  });

  describe("argbToRgb", () => {
    it("should convert ARGB back to RGB", () => {
      const argb = 0xff804020; // Alpha: 255, R: 128, G: 64, B: 32
      const rgb = argbToRgb(argb);

      expect(rgb.r).toBe(128);
      expect(rgb.g).toBe(64);
      expect(rgb.b).toBe(32);
    });

    it("should ignore alpha channel", () => {
      const argbFullAlpha = 0xff123456;
      const argbNoAlpha = 0x00123456;

      const rgb1 = argbToRgb(argbFullAlpha);
      const rgb2 = argbToRgb(argbNoAlpha);

      // RGB values should be the same regardless of alpha
      expect(rgb1).toEqual(rgb2);
      expect(rgb1.r).toBe(0x12);
      expect(rgb1.g).toBe(0x34);
      expect(rgb1.b).toBe(0x56);
    });

    it("should handle primary colors", () => {
      const red = argbToRgb(0xffff0000);
      const green = argbToRgb(0xff00ff00);
      const blue = argbToRgb(0xff0000ff);

      expect(red).toEqual({ b: 0, g: 0, r: 255 });
      expect(green).toEqual({ b: 0, g: 255, r: 0 });
      expect(blue).toEqual({ b: 255, g: 0, r: 0 });
    });

    it("should handle black and white", () => {
      const black = argbToRgb(0xff000000);
      const white = argbToRgb(0xffffffff);

      expect(black).toEqual({ b: 0, g: 0, r: 0 });
      expect(white).toEqual({ b: 255, g: 255, r: 255 });
    });

    it("should handle grayscale values", () => {
      const gray = argbToRgb(0xff808080);

      expect(gray).toEqual({ b: 128, g: 128, r: 128 });
    });
  });

  describe("round-trip conversion", () => {
    it("should maintain values through round-trip", () => {
      const originalRgb = { b: 67, g: 45, r: 123 };
      const argb = rgbToArgb(originalRgb);
      const resultRgb = argbToRgb(argb);

      expect(resultRgb).toEqual(originalRgb);
    });

    it("should handle all possible byte values", () => {
      // Test a sampling of values
      for (let i = 0; i < 256; i += 17) {
        const originalRgb = { b: (i + 170) % 256, g: (i + 85) % 256, r: i };
        const argb = rgbToArgb(originalRgb);
        const resultRgb = argbToRgb(argb);

        expect(resultRgb).toEqual(originalRgb);
      }
    });

    it("should maintain clamped values", () => {
      const originalRgb = { b: 127.8, g: -50, r: 300 };
      const argb = rgbToArgb(originalRgb);
      const resultRgb = argbToRgb(argb);

      // Values should be clamped and rounded
      expect(resultRgb).toEqual({ b: 128, g: 0, r: 255 });
    });
  });

  describe("edge cases", () => {
    it("should handle zero values", () => {
      const argb = rgbToArgb({ b: 0, g: 0, r: 0 });
      expect(argb).toBe(0xff000000 >>> 0);

      const rgb = argbToRgb(0);
      expect(rgb).toEqual({ b: 0, g: 0, r: 0 });
    });

    it("should handle maximum values", () => {
      const argb = rgbToArgb({ b: 255, g: 255, r: 255 });
      expect(argb).toBe(0xffffffff >>> 0);

      const rgb = argbToRgb(0xffffffff);
      expect(rgb).toEqual({ b: 255, g: 255, r: 255 });
    });

    it("should handle single channel values", () => {
      const redOnly = rgbToArgb({ b: 0, g: 0, r: 255 });
      const greenOnly = rgbToArgb({ b: 0, g: 255, r: 0 });
      const blueOnly = rgbToArgb({ b: 255, g: 0, r: 0 });

      expect(redOnly & 0x00ffffff).toBe(0x00ff0000);
      expect(greenOnly & 0x00ffffff).toBe(0x0000ff00);
      expect(blueOnly & 0x00ffffff).toBe(0x000000ff);
    });

    it("should preserve bit patterns", () => {
      // Test specific bit patterns
      const patterns = [
        0xff000000 >>> 0, // Black
        0xffffffff >>> 0, // White
        0xff808080 >>> 0, // Gray
        0xffaa55aa >>> 0, // Mixed pattern
        0xff123456 >>> 0, // Sequential
        0xfffedcba >>> 0, // Reverse sequential
      ];

      for (const pattern of patterns) {
        const rgb = argbToRgb(pattern);
        const result = rgbToArgb(rgb);
        expect(result).toBe(pattern);
      }
    });
  });
});
