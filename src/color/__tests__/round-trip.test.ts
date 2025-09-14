/**
 * Round-trip conversion tests
 * Inspired by chromaticity-color-utilities tests
 * Tests that converting from one color space to another and back preserves values
 */

import { describe, expect, it } from "vitest";

import {
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  labToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToLab,
  rgbToXyz,
  xyzToRgb,
} from "../conversions";

describe("Round-trip Conversions", () => {
  // Test a range of colors with step to avoid too many tests
  const testColors = [
    { b: 0, g: 0, r: 0 }, // Black
    { b: 255, g: 255, r: 255 }, // White
    { b: 0, g: 0, r: 255 }, // Red
    { b: 0, g: 255, r: 0 }, // Green
    { b: 255, g: 0, r: 0 }, // Blue
    { b: 255, g: 0, r: 255 }, // Magenta
    { b: 0, g: 255, r: 255 }, // Yellow
    { b: 255, g: 255, r: 0 }, // Cyan
    { b: 128, g: 128, r: 128 }, // Gray
    { b: 0, g: 128, r: 255 }, // Orange
    { b: 128, g: 0, r: 128 }, // Purple
    { b: 208, g: 224, r: 64 }, // Turquoise
  ];

  // Additional random colors for broader testing
  for (let i = 0; i < 20; i++) {
    testColors.push({
      b: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      r: Math.floor(Math.random() * 256),
    });
  }

  describe("RGB ↔ HSL", () => {
    testColors.forEach((color, index) => {
      it(`should preserve color ${index}: rgb(${color.r}, ${color.g}, ${color.b})`, () => {
        const hsl = rgbToHsl(color);
        const rgbBack = hslToRgb(hsl);

        expect(rgbBack.r).toBeCloseTo(color.r, -1); // Within 10
        expect(rgbBack.g).toBeCloseTo(color.g, -1);
        expect(rgbBack.b).toBeCloseTo(color.b, -1);
      });
    });
  });

  describe("RGB ↔ HSV", () => {
    testColors.forEach((color, index) => {
      it(`should preserve color ${index}: rgb(${color.r}, ${color.g}, ${color.b})`, () => {
        const hsv = rgbToHsv(color);
        const rgbBack = hsvToRgb(hsv);

        expect(rgbBack.r).toBeCloseTo(color.r, -1);
        expect(rgbBack.g).toBeCloseTo(color.g, -1);
        expect(rgbBack.b).toBeCloseTo(color.b, -1);
      });
    });
  });

  describe("RGB ↔ LAB", () => {
    testColors.forEach((color, index) => {
      it(`should preserve color ${index}: rgb(${color.r}, ${color.g}, ${color.b})`, () => {
        const lab = rgbToLab(color);
        const rgbBack = labToRgb(lab);

        // LAB conversions have more variance
        expect(rgbBack.r).toBeCloseTo(color.r, -1.5); // Within 32
        expect(rgbBack.g).toBeCloseTo(color.g, -1.5);
        expect(rgbBack.b).toBeCloseTo(color.b, -1.5);
      });
    });
  });

  describe("RGB ↔ XYZ", () => {
    testColors.forEach((color, index) => {
      it(`should preserve color ${index}: rgb(${color.r}, ${color.g}, ${color.b})`, () => {
        const xyz = rgbToXyz(color);
        const rgbBack = xyzToRgb(xyz);

        expect(rgbBack.r).toBeCloseTo(color.r, -1);
        expect(rgbBack.g).toBeCloseTo(color.g, -1);
        expect(rgbBack.b).toBeCloseTo(color.b, -1);
      });
    });
  });

  describe("RGB ↔ HEX", () => {
    testColors.forEach((color, index) => {
      it(`should preserve color ${index}: rgb(${color.r}, ${color.g}, ${color.b})`, () => {
        const hex = rgbToHex(color);
        const rgbBack = hexToRgb(hex);

        // HEX should be exact
        expect(rgbBack.r).toBe(color.r);
        expect(rgbBack.g).toBe(color.g);
        expect(rgbBack.b).toBe(color.b);
      });
    });
  });

  describe("Reference colors from chromaticity", () => {
    it("should convert magenta correctly in LAB", () => {
      const magenta = { b: 255, g: 0, r: 255 };
      const lab = rgbToLab(magenta);

      // Chromaticity reference: L=60, a=98, b=-61
      expect(lab.l).toBeCloseTo(60, -1);
      expect(lab.a).toBeCloseTo(98, -1);
      expect(lab.b).toBeCloseTo(-61, -1);
    });
  });

  describe("Grayscale preservation", () => {
    it("should preserve grayscale in all color spaces", () => {
      const grays = [
        { b: 0, g: 0, r: 0 },
        { b: 64, g: 64, r: 64 },
        { b: 128, g: 128, r: 128 },
        { b: 192, g: 192, r: 192 },
        { b: 255, g: 255, r: 255 },
      ];

      grays.forEach((gray) => {
        // HSL
        const hsl = rgbToHsl(gray);
        expect(hsl.s).toBe(0); // No saturation for grays

        // HSV
        const hsv = rgbToHsv(gray);
        expect(hsv.s).toBe(0); // No saturation for grays

        // LAB
        const lab = rgbToLab(gray);
        expect(Math.abs(lab.a)).toBeLessThan(1); // Near zero
        expect(Math.abs(lab.b)).toBeLessThan(1); // Near zero
      });
    });
  });

  describe("Primary colors", () => {
    it("should handle pure red correctly", () => {
      const red = { b: 0, g: 0, r: 255 };

      const hsl = rgbToHsl(red);
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hsv = rgbToHsv(red);
      expect(hsv.h).toBe(0);
      expect(hsv.s).toBe(100);
      expect(hsv.v).toBe(100);
    });

    it("should handle pure green correctly", () => {
      const green = { b: 0, g: 255, r: 0 };

      const hsl = rgbToHsl(green);
      expect(hsl.h).toBe(120);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hsv = rgbToHsv(green);
      expect(hsv.h).toBe(120);
      expect(hsv.s).toBe(100);
      expect(hsv.v).toBe(100);
    });

    it("should handle pure blue correctly", () => {
      const blue = { b: 255, g: 0, r: 0 };

      const hsl = rgbToHsl(blue);
      expect(hsl.h).toBe(240);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);

      const hsv = rgbToHsv(blue);
      expect(hsv.h).toBe(240);
      expect(hsv.s).toBe(100);
      expect(hsv.v).toBe(100);
    });
  });
});
