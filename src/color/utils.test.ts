/**
 * Tests for color utility functions
 */

import { describe, expect, it } from "vitest";

import type { RGB } from "./types";

import {
  clampHsl,
  clampHsv,
  clampRgb,
  darken,
  desaturate,
  formatColor,
  formatHsl,
  formatRgb,
  getComplementary,
  getContrastRatio,
  getLuminance,
  invertColor,
  isDark,
  isLight,
  isValidHex,
  isValidHsl,
  isValidHsv,
  isValidRgb,
  lighten,
  meetsContrastAA,
  meetsContrastAAA,
  mixColors,
  randomColor,
  saturate,
  toGrayscale,
} from "./utils";

describe("Color Utils", () => {
  describe("Validation functions", () => {
    describe("isValidRgb", () => {
      it("should validate RGB colors correctly", () => {
        expect(isValidRgb({ b: 0, g: 0, r: 0 })).toBe(true);
        expect(isValidRgb({ b: 255, g: 255, r: 255 })).toBe(true);
        expect(isValidRgb({ b: 128, g: 128, r: 128 })).toBe(true);

        expect(isValidRgb({ b: 0, g: 0, r: -1 })).toBe(false);
        expect(isValidRgb({ b: 0, g: 0, r: 256 })).toBe(false);
        expect(isValidRgb({ b: 0, g: -1, r: 0 })).toBe(false);
        expect(isValidRgb({ b: 256, g: 0, r: 0 })).toBe(false);
      });
    });

    describe("isValidHsl", () => {
      it("should validate HSL colors correctly", () => {
        expect(isValidHsl({ h: 0, l: 0, s: 0 })).toBe(true);
        expect(isValidHsl({ h: 360, l: 100, s: 100 })).toBe(true);
        expect(isValidHsl({ h: 180, l: 50, s: 50 })).toBe(true);

        expect(isValidHsl({ h: -1, l: 0, s: 0 })).toBe(false);
        expect(isValidHsl({ h: 361, l: 0, s: 0 })).toBe(false);
        expect(isValidHsl({ h: 0, l: 0, s: -1 })).toBe(false);
        expect(isValidHsl({ h: 0, l: 0, s: 101 })).toBe(false);
        expect(isValidHsl({ h: 0, l: -1, s: 0 })).toBe(false);
        expect(isValidHsl({ h: 0, l: 101, s: 0 })).toBe(false);
      });
    });

    describe("isValidHsv", () => {
      it("should validate HSV colors correctly", () => {
        expect(isValidHsv({ h: 0, s: 0, v: 0 })).toBe(true);
        expect(isValidHsv({ h: 360, s: 100, v: 100 })).toBe(true);
        expect(isValidHsv({ h: 180, s: 50, v: 50 })).toBe(true);

        expect(isValidHsv({ h: -1, s: 0, v: 0 })).toBe(false);
        expect(isValidHsv({ h: 361, s: 0, v: 0 })).toBe(false);
        expect(isValidHsv({ h: 0, s: -1, v: 0 })).toBe(false);
        expect(isValidHsv({ h: 0, s: 101, v: 0 })).toBe(false);
        expect(isValidHsv({ h: 0, s: 0, v: -1 })).toBe(false);
        expect(isValidHsv({ h: 0, s: 0, v: 101 })).toBe(false);
      });
    });

    describe("isValidHex", () => {
      it("should validate hex colors correctly", () => {
        expect(isValidHex("#fff")).toBe(true);
        expect(isValidHex("#ffffff")).toBe(true);
        expect(isValidHex("#000")).toBe(true);
        expect(isValidHex("#000000")).toBe(true);
        expect(isValidHex("fff")).toBe(true);
        expect(isValidHex("ffffff")).toBe(true);

        expect(isValidHex("#ff")).toBe(false);
        expect(isValidHex("#ffff")).toBe(false);
        expect(isValidHex("#fffff")).toBe(false);
        expect(isValidHex("#fffffff")).toBe(false);
        expect(isValidHex("#ggg")).toBe(false);
        expect(isValidHex("xyz")).toBe(false);
      });
    });
  });

  describe("Clamping functions", () => {
    describe("clampRgb", () => {
      it("should clamp RGB values to valid range", () => {
        expect(clampRgb({ b: 128, g: 300, r: -10 })).toEqual({
          b: 128,
          g: 255,
          r: 0,
        });
        expect(clampRgb({ b: 0, g: 0, r: 0 })).toEqual({ b: 0, g: 0, r: 0 });
        expect(clampRgb({ b: 255, g: 255, r: 255 })).toEqual({
          b: 255,
          g: 255,
          r: 255,
        });
      });
    });

    describe("clampHsl", () => {
      it("should clamp HSL values to valid range", () => {
        expect(clampHsl({ h: -10, l: 50, s: 150 })).toEqual({
          h: 0,
          l: 50,
          s: 100,
        });
        expect(clampHsl({ h: 400, l: 150, s: -10 })).toEqual({
          h: 360,
          l: 100,
          s: 0,
        });
      });
    });

    describe("clampHsv", () => {
      it("should clamp HSV values to valid range", () => {
        expect(clampHsv({ h: -10, s: 150, v: 50 })).toEqual({
          h: 0,
          s: 100,
          v: 50,
        });
        expect(clampHsv({ h: 400, s: -10, v: 150 })).toEqual({
          h: 360,
          s: 0,
          v: 100,
        });
      });
    });
  });

  describe("Luminance and contrast", () => {
    describe("getLuminance", () => {
      it("should calculate luminance correctly", () => {
        expect(getLuminance({ b: 0, g: 0, r: 0 })).toBeCloseTo(0, 3);
        expect(getLuminance({ b: 255, g: 255, r: 255 })).toBeCloseTo(1, 3);

        // Red has lower luminance than green
        const redLum = getLuminance({ b: 0, g: 0, r: 255 });
        const greenLum = getLuminance({ b: 0, g: 255, r: 0 });
        expect(redLum).toBeLessThan(greenLum);
      });
    });

    describe("getContrastRatio", () => {
      it("should calculate contrast ratio correctly", () => {
        const black: RGB = { b: 0, g: 0, r: 0 };
        const white: RGB = { b: 255, g: 255, r: 255 };

        expect(getContrastRatio(black, white)).toBeCloseTo(21, 0);
        expect(getContrastRatio(white, black)).toBeCloseTo(21, 0);
        expect(getContrastRatio(black, black)).toBeCloseTo(1, 0);
        expect(getContrastRatio(white, white)).toBeCloseTo(1, 0);
      });
    });

    describe("meetsContrastAA", () => {
      it("should check AA contrast requirements", () => {
        const black: RGB = { b: 0, g: 0, r: 0 };
        const white: RGB = { b: 255, g: 255, r: 255 };
        const gray: RGB = { b: 128, g: 128, r: 128 };

        expect(meetsContrastAA(black, white)).toBe(true);
        expect(meetsContrastAA(black, gray)).toBe(true);
        expect(meetsContrastAA(white, gray)).toBe(false);

        // Large text has lower requirements
        expect(meetsContrastAA(white, gray, true)).toBe(true);
      });
    });

    describe("meetsContrastAAA", () => {
      it("should check AAA contrast requirements", () => {
        const black: RGB = { b: 0, g: 0, r: 0 };
        const white: RGB = { b: 255, g: 255, r: 255 };
        const darkGray: RGB = { b: 85, g: 85, r: 85 }; // Adjusted for better contrast

        expect(meetsContrastAAA(black, white)).toBe(true);
        expect(meetsContrastAAA(black, darkGray)).toBe(false);

        // Large text has lower requirements - use lighter gray for AAA large text
        const mediumGray: RGB = { b: 118, g: 118, r: 118 };
        expect(meetsContrastAAA(black, mediumGray, true)).toBe(true);
      });
    });
  });

  describe("Formatting functions", () => {
    describe("formatRgb", () => {
      it("should format RGB to string", () => {
        expect(formatRgb({ b: 0, g: 0, r: 255 })).toBe("rgb(255, 0, 0)");
        expect(formatRgb({ b: 128, g: 128, r: 128 }, 0.5)).toBe(
          "rgba(128, 128, 128, 0.5)",
        );
      });
    });

    describe("formatHsl", () => {
      it("should format HSL to string", () => {
        expect(formatHsl({ h: 0, l: 50, s: 100 })).toBe("hsl(0, 100%, 50%)");
        expect(formatHsl({ h: 180, l: 50, s: 50 }, 0.5)).toBe(
          "hsla(180, 50%, 50%, 0.5)",
        );
      });
    });

    describe("formatColor", () => {
      it("should format color to various formats", () => {
        const red: RGB = { b: 0, g: 0, r: 255 };

        expect(formatColor(red, "hex")).toBe("#ff0000");
        expect(formatColor(red, "rgb")).toBe("rgb(255, 0, 0)");
        expect(formatColor(red, "hsl")).toBe("hsl(0, 100%, 50%)");
        expect(formatColor(red, "hsv")).toBe("hsv(0, 100%, 100%)");
        expect(formatColor(red)).toBe("#ff0000"); // Default to hex
      });
    });
  });

  describe("Color manipulation", () => {
    describe("mixColors", () => {
      it("should mix colors correctly", () => {
        const red: RGB = { b: 0, g: 0, r: 255 };
        const blue: RGB = { b: 255, g: 0, r: 0 };

        const purple = mixColors(red, blue, 0.5);
        expect(purple.r).toBeCloseTo(128, 0);
        expect(purple.g).toBe(0);
        expect(purple.b).toBeCloseTo(128, 0);

        // Full weight to first color
        expect(mixColors(red, blue, 1)).toEqual(red);

        // Full weight to second color
        expect(mixColors(red, blue, 0)).toEqual(blue);
      });
    });

    describe("lighten", () => {
      it("should lighten colors", () => {
        const color: RGB = { b: 0, g: 0, r: 128 };
        const lighter = lighten(color, 20);

        expect(lighter.r).toBeGreaterThan(color.r);
      });
    });

    describe("darken", () => {
      it("should darken colors", () => {
        const color: RGB = { b: 128, g: 128, r: 255 };
        const darker = darken(color, 20);

        expect(darker.r).toBeLessThanOrEqual(color.r);
      });
    });

    describe("saturate", () => {
      it("should increase saturation", () => {
        const color: RGB = { b: 100, g: 100, r: 200 };
        const saturated = saturate(color, 20);

        // More saturated colors have greater difference between channels
        const originalDiff =
          Math.max(color.r, color.g, color.b) -
          Math.min(color.r, color.g, color.b);
        const saturatedDiff =
          Math.max(saturated.r, saturated.g, saturated.b) -
          Math.min(saturated.r, saturated.g, saturated.b);

        expect(saturatedDiff).toBeGreaterThanOrEqual(originalDiff);
      });
    });

    describe("desaturate", () => {
      it("should decrease saturation", () => {
        const color: RGB = { b: 0, g: 0, r: 255 };
        const desaturated = desaturate(color, 50);

        // Less saturated colors have less difference between channels
        const originalDiff =
          Math.max(color.r, color.g, color.b) -
          Math.min(color.r, color.g, color.b);
        const desaturatedDiff =
          Math.max(desaturated.r, desaturated.g, desaturated.b) -
          Math.min(desaturated.r, desaturated.g, desaturated.b);

        expect(desaturatedDiff).toBeLessThan(originalDiff);
      });
    });

    describe("toGrayscale", () => {
      it("should convert to grayscale", () => {
        const red: RGB = { b: 0, g: 0, r: 255 };
        const gray = toGrayscale(red);

        expect(gray.r).toBe(gray.g);
        expect(gray.g).toBe(gray.b);
        expect(gray.r).toBeCloseTo(76, 0); // Weighted average
      });
    });

    describe("invertColor", () => {
      it("should invert colors", () => {
        expect(invertColor({ b: 128, g: 0, r: 255 })).toEqual({
          b: 127,
          g: 255,
          r: 0,
        });
        expect(invertColor({ b: 0, g: 0, r: 0 })).toEqual({
          b: 255,
          g: 255,
          r: 255,
        });
        expect(invertColor({ b: 255, g: 255, r: 255 })).toEqual({
          b: 0,
          g: 0,
          r: 0,
        });
      });
    });

    describe("getComplementary", () => {
      it("should get complementary color", () => {
        const red: RGB = { b: 0, g: 0, r: 255 };
        const complementary = getComplementary(red);

        // Complementary of red should be cyan
        expect(complementary.r).toBe(0);
        expect(complementary.g).toBe(255);
        expect(complementary.b).toBe(255);
      });
    });
  });

  describe("Random and detection", () => {
    describe("randomColor", () => {
      it("should generate valid random colors", () => {
        for (let i = 0; i < 10; i++) {
          const color = randomColor();
          expect(isValidRgb(color)).toBe(true);
        }
      });

      it("should generate different colors", () => {
        const colors = new Set();
        for (let i = 0; i < 100; i++) {
          const color = randomColor();
          colors.add(`${color.r},${color.g},${color.b}`);
        }
        // Should generate at least some different colors
        expect(colors.size).toBeGreaterThan(50);
      });
    });

    describe("isDark", () => {
      it("should identify dark colors", () => {
        expect(isDark({ b: 0, g: 0, r: 0 })).toBe(true);
        expect(isDark({ b: 50, g: 50, r: 50 })).toBe(true);
        expect(isDark({ b: 255, g: 255, r: 255 })).toBe(false);
        expect(isDark({ b: 200, g: 200, r: 200 })).toBe(false);
      });

      it("should use custom threshold", () => {
        const gray: RGB = { b: 128, g: 128, r: 128 };
        // Gray at 128 has luminance ~0.22
        expect(isDark(gray, 0.2)).toBe(false);
        expect(isDark(gray, 0.25)).toBe(true); // Use lower threshold
      });
    });

    describe("isLight", () => {
      it("should identify light colors", () => {
        expect(isLight({ b: 255, g: 255, r: 255 })).toBe(true);
        expect(isLight({ b: 200, g: 200, r: 200 })).toBe(true);
        expect(isLight({ b: 0, g: 0, r: 0 })).toBe(false);
        expect(isLight({ b: 50, g: 50, r: 50 })).toBe(false);
      });

      it("should use custom threshold", () => {
        const gray: RGB = { b: 128, g: 128, r: 128 };
        expect(isLight(gray, 0.2)).toBe(true); // Use lower threshold
        expect(isLight(gray, 0.25)).toBe(false);
      });
    });
  });
});
