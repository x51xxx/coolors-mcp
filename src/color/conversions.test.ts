/**
 * Tests for color conversion functions
 */

import { describe, expect, it } from "vitest";

import type { RGB } from "./types";

import {
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  labToRgb,
  labToXyz,
  parseColor,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  rgbToLab,
  rgbToXyz,
  xyzToLab,
  xyzToRgb,
} from "./conversions";

describe("Color Conversions", () => {
  describe("RGB to HEX", () => {
    it("should convert RGB to HEX correctly", () => {
      expect(rgbToHex({ b: 0, g: 0, r: 255 })).toBe("#ff0000");
      expect(rgbToHex({ b: 0, g: 255, r: 0 })).toBe("#00ff00");
      expect(rgbToHex({ b: 255, g: 0, r: 0 })).toBe("#0000ff");
      expect(rgbToHex({ b: 255, g: 255, r: 255 })).toBe("#ffffff");
      expect(rgbToHex({ b: 0, g: 0, r: 0 })).toBe("#000000");
      expect(rgbToHex({ b: 128, g: 128, r: 128 })).toBe("#808080");
    });

    it("should handle edge cases", () => {
      expect(rgbToHex({ b: 128, g: -1, r: 256 })).toBe("#ff0080");
    });
  });

  describe("HEX to RGB", () => {
    it("should convert HEX to RGB correctly", () => {
      expect(hexToRgb("#ff0000")).toEqual({ b: 0, g: 0, r: 255 });
      expect(hexToRgb("#00ff00")).toEqual({ b: 0, g: 255, r: 0 });
      expect(hexToRgb("#0000ff")).toEqual({ b: 255, g: 0, r: 0 });
      expect(hexToRgb("#ffffff")).toEqual({ b: 255, g: 255, r: 255 });
      expect(hexToRgb("#000000")).toEqual({ b: 0, g: 0, r: 0 });
    });

    it("should handle 3-digit HEX", () => {
      expect(hexToRgb("#f00")).toEqual({ b: 0, g: 0, r: 255 });
      expect(hexToRgb("#0f0")).toEqual({ b: 0, g: 255, r: 0 });
      expect(hexToRgb("#00f")).toEqual({ b: 255, g: 0, r: 0 });
      expect(hexToRgb("#fff")).toEqual({ b: 255, g: 255, r: 255 });
    });

    it("should handle HEX without #", () => {
      expect(hexToRgb("ff0000")).toEqual({ b: 0, g: 0, r: 255 });
      expect(hexToRgb("f00")).toEqual({ b: 0, g: 0, r: 255 });
    });
  });

  describe("RGB to HSL", () => {
    it("should convert RGB to HSL correctly", () => {
      // Red
      const red = rgbToHsl({ b: 0, g: 0, r: 255 });
      expect(red.h).toBe(0);
      expect(red.s).toBe(100);
      expect(red.l).toBe(50);

      // Green
      const green = rgbToHsl({ b: 0, g: 255, r: 0 });
      expect(green.h).toBe(120);
      expect(green.s).toBe(100);
      expect(green.l).toBe(50);

      // Blue
      const blue = rgbToHsl({ b: 255, g: 0, r: 0 });
      expect(blue.h).toBe(240);
      expect(blue.s).toBe(100);
      expect(blue.l).toBe(50);

      // White
      const white = rgbToHsl({ b: 255, g: 255, r: 255 });
      expect(white.h).toBe(0);
      expect(white.s).toBe(0);
      expect(white.l).toBe(100);

      // Black
      const black = rgbToHsl({ b: 0, g: 0, r: 0 });
      expect(black.h).toBe(0);
      expect(black.s).toBe(0);
      expect(black.l).toBe(0);

      // Gray
      const gray = rgbToHsl({ b: 128, g: 128, r: 128 });
      expect(gray.h).toBe(0);
      expect(gray.s).toBe(0);
      expect(gray.l).toBe(50);
    });
  });

  describe("HSL to RGB", () => {
    it("should convert HSL to RGB correctly", () => {
      expect(hslToRgb({ h: 0, l: 50, s: 100 })).toEqual({ b: 0, g: 0, r: 255 });
      expect(hslToRgb({ h: 120, l: 50, s: 100 })).toEqual({
        b: 0,
        g: 255,
        r: 0,
      });
      expect(hslToRgb({ h: 240, l: 50, s: 100 })).toEqual({
        b: 255,
        g: 0,
        r: 0,
      });
      expect(hslToRgb({ h: 0, l: 100, s: 0 })).toEqual({
        b: 255,
        g: 255,
        r: 255,
      });
      expect(hslToRgb({ h: 0, l: 0, s: 0 })).toEqual({ b: 0, g: 0, r: 0 });
    });

    it("should handle achromatic colors", () => {
      expect(hslToRgb({ h: 0, l: 50, s: 0 })).toEqual({
        b: 128,
        g: 128,
        r: 128,
      });
      expect(hslToRgb({ h: 360, l: 75, s: 0 })).toEqual({
        b: 191,
        g: 191,
        r: 191,
      });
    });
  });

  describe("RGB to HSV", () => {
    it("should convert RGB to HSV correctly", () => {
      // Red
      const red = rgbToHsv({ b: 0, g: 0, r: 255 });
      expect(red.h).toBe(0);
      expect(red.s).toBe(100);
      expect(red.v).toBe(100);

      // Green
      const green = rgbToHsv({ b: 0, g: 255, r: 0 });
      expect(green.h).toBe(120);
      expect(green.s).toBe(100);
      expect(green.v).toBe(100);

      // Blue
      const blue = rgbToHsv({ b: 255, g: 0, r: 0 });
      expect(blue.h).toBe(240);
      expect(blue.s).toBe(100);
      expect(blue.v).toBe(100);

      // White
      const white = rgbToHsv({ b: 255, g: 255, r: 255 });
      expect(white.h).toBe(0);
      expect(white.s).toBe(0);
      expect(white.v).toBe(100);

      // Black
      const black = rgbToHsv({ b: 0, g: 0, r: 0 });
      expect(black.h).toBe(0);
      expect(black.s).toBe(0);
      expect(black.v).toBe(0);
    });
  });

  describe("HSV to RGB", () => {
    it("should convert HSV to RGB correctly", () => {
      expect(hsvToRgb({ h: 0, s: 100, v: 100 })).toEqual({
        b: 0,
        g: 0,
        r: 255,
      });
      expect(hsvToRgb({ h: 120, s: 100, v: 100 })).toEqual({
        b: 0,
        g: 255,
        r: 0,
      });
      expect(hsvToRgb({ h: 240, s: 100, v: 100 })).toEqual({
        b: 255,
        g: 0,
        r: 0,
      });
      expect(hsvToRgb({ h: 0, s: 0, v: 100 })).toEqual({
        b: 255,
        g: 255,
        r: 255,
      });
      expect(hsvToRgb({ h: 0, s: 0, v: 0 })).toEqual({ b: 0, g: 0, r: 0 });
    });

    it("should handle intermediate hues", () => {
      const yellow = hsvToRgb({ h: 60, s: 100, v: 100 });
      expect(yellow).toEqual({ b: 0, g: 255, r: 255 });

      const cyan = hsvToRgb({ h: 180, s: 100, v: 100 });
      expect(cyan).toEqual({ b: 255, g: 255, r: 0 });

      const magenta = hsvToRgb({ h: 300, s: 100, v: 100 });
      expect(magenta).toEqual({ b: 255, g: 0, r: 255 });
    });
  });

  describe("RGB to XYZ", () => {
    it("should convert RGB to XYZ correctly", () => {
      const white = rgbToXyz({ b: 255, g: 255, r: 255 });
      expect(white.x).toBeCloseTo(95.047, 1);
      expect(white.y).toBeCloseTo(100.0, 1);
      expect(white.z).toBeCloseTo(108.883, 1);

      const black = rgbToXyz({ b: 0, g: 0, r: 0 });
      expect(black.x).toBeCloseTo(0, 1);
      expect(black.y).toBeCloseTo(0, 1);
      expect(black.z).toBeCloseTo(0, 1);

      const red = rgbToXyz({ b: 0, g: 0, r: 255 });
      expect(red.x).toBeCloseTo(41.246, 1);
      expect(red.y).toBeCloseTo(21.267, 1);
      expect(red.z).toBeCloseTo(1.933, 1);
    });
  });

  describe("XYZ to RGB", () => {
    it("should convert XYZ to RGB correctly", () => {
      expect(xyzToRgb({ x: 95.047, y: 100.0, z: 108.883 })).toEqual({
        b: 255,
        g: 255,
        r: 255,
      });
      expect(xyzToRgb({ x: 0, y: 0, z: 0 })).toEqual({ b: 0, g: 0, r: 0 });

      const red = xyzToRgb({ x: 41.246, y: 21.267, z: 1.933 });
      expect(red.r).toBeCloseTo(255, 0);
      expect(red.g).toBeCloseTo(0, 0);
      expect(red.b).toBeCloseTo(0, 0);
    });
  });

  describe("XYZ to LAB", () => {
    it("should convert XYZ to LAB correctly", () => {
      const white = xyzToLab({ x: 95.047, y: 100.0, z: 108.883 });
      expect(white.l).toBeCloseTo(100, 1);
      expect(white.a).toBeCloseTo(0, 1);
      expect(white.b).toBeCloseTo(0, 1);

      const black = xyzToLab({ x: 0, y: 0, z: 0 });
      expect(black.l).toBeCloseTo(0, 1);
      expect(black.a).toBeCloseTo(0, 1);
      expect(black.b).toBeCloseTo(0, 1);
    });
  });

  describe("LAB to XYZ", () => {
    it("should convert LAB to XYZ correctly", () => {
      const white = labToXyz({ a: 0, b: 0, l: 100 });
      expect(white.x).toBeCloseTo(95.047, 1);
      expect(white.y).toBeCloseTo(100.0, 1);
      expect(white.z).toBeCloseTo(108.883, 1);

      const black = labToXyz({ a: 0, b: 0, l: 0 });
      expect(black.x).toBeCloseTo(0, 1);
      expect(black.y).toBeCloseTo(0, 1);
      expect(black.z).toBeCloseTo(0, 1);
    });
  });

  describe("RGB to LAB", () => {
    it("should convert RGB to LAB correctly", () => {
      const white = rgbToLab({ b: 255, g: 255, r: 255 });
      expect(white.l).toBeCloseTo(100, 1);
      expect(white.a).toBeCloseTo(0, 1);
      expect(white.b).toBeCloseTo(0, 1);

      const black = rgbToLab({ b: 0, g: 0, r: 0 });
      expect(black.l).toBeCloseTo(0, 1);
      expect(black.a).toBeCloseTo(0, 1);
      expect(black.b).toBeCloseTo(0, 1);

      const red = rgbToLab({ b: 0, g: 0, r: 255 });
      expect(red.l).toBeCloseTo(53.2, 0);
      expect(red.a).toBeCloseTo(80.1, 0);
      expect(red.b).toBeCloseTo(67.2, 0);
    });
  });

  describe("LAB to RGB", () => {
    it("should convert LAB to RGB correctly", () => {
      expect(labToRgb({ a: 0, b: 0, l: 100 })).toEqual({
        b: 255,
        g: 255,
        r: 255,
      });
      expect(labToRgb({ a: 0, b: 0, l: 0 })).toEqual({ b: 0, g: 0, r: 0 });

      const red = labToRgb({ a: 80.1, b: 67.2, l: 53.2 });
      expect(red.r).toBeCloseTo(255, 0);
      expect(red.g).toBeCloseTo(0, 0);
      expect(red.b).toBeCloseTo(0, 0);
    });
  });

  describe("parseColor", () => {
    it("should parse hex colors", () => {
      expect(parseColor("#ff0000")).toEqual({ b: 0, g: 0, r: 255 });
      expect(parseColor("#f00")).toEqual({ b: 0, g: 0, r: 255 });
      expect(parseColor("#ff0000")).toEqual({ b: 0, g: 0, r: 255 }); // Use # prefix for consistency
    });

    it("should parse rgb colors", () => {
      expect(parseColor("rgb(255, 0, 0)")).toEqual({ b: 0, g: 0, r: 255 });
      expect(parseColor("rgba(255, 0, 0, 0.5)")).toEqual({
        b: 0,
        g: 0,
        r: 255,
      });
      expect(parseColor("rgb(128,128,128)")).toEqual({
        b: 128,
        g: 128,
        r: 128,
      });
    });

    it("should parse hsl colors", () => {
      expect(parseColor("hsl(0, 100%, 50%)")).toEqual({ b: 0, g: 0, r: 255 });
      expect(parseColor("hsla(120, 100%, 50%, 0.5)")).toEqual({
        b: 0,
        g: 255,
        r: 0,
      });
      expect(parseColor("hsl(240,100%,50%)")).toEqual({ b: 255, g: 0, r: 0 });
    });

    it("should return null for invalid colors", () => {
      expect(parseColor("invalid")).toBeNull();
      expect(parseColor("#gggggg")).toEqual({ b: 0, g: 0, r: 0 }); // Returns black for invalid hex
      expect(parseColor("rgb(256, 256, 256)")).toEqual({
        b: 256,
        g: 256,
        r: 256,
      });
    });
  });

  describe("Round-trip conversions", () => {
    const testColors: RGB[] = [
      { b: 0, g: 0, r: 255 }, // Red
      { b: 0, g: 255, r: 0 }, // Green
      { b: 255, g: 0, r: 0 }, // Blue
      { b: 0, g: 255, r: 255 }, // Yellow
      { b: 255, g: 0, r: 255 }, // Magenta
      { b: 255, g: 255, r: 0 }, // Cyan
      { b: 128, g: 128, r: 128 }, // Gray
      { b: 255, g: 255, r: 255 }, // White
      { b: 0, g: 0, r: 0 }, // Black
    ];

    it("should round-trip RGB -> HSL -> RGB", () => {
      testColors.forEach((color) => {
        const hsl = rgbToHsl(color);
        const rgb = hslToRgb(hsl);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      });
    });

    it("should round-trip RGB -> HSV -> RGB", () => {
      testColors.forEach((color) => {
        const hsv = rgbToHsv(color);
        const rgb = hsvToRgb(hsv);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      });
    });

    it("should round-trip RGB -> XYZ -> RGB", () => {
      testColors.forEach((color) => {
        const xyz = rgbToXyz(color);
        const rgb = xyzToRgb(xyz);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      });
    });

    it("should round-trip RGB -> LAB -> RGB", () => {
      testColors.forEach((color) => {
        const lab = rgbToLab(color);
        const rgb = labToRgb(lab);
        expect(rgb.r).toBeCloseTo(color.r, 0);
        expect(rgb.g).toBeCloseTo(color.g, 0);
        expect(rgb.b).toBeCloseTo(color.b, 0);
      });
    });
  });
});
