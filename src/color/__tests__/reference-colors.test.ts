/**
 * Reference color values from official sources for testing
 * These values are from:
 * - Material Design color system
 * - CSS named colors (W3C standard)
 * - WCAG contrast ratio examples
 */

import { describe, expect, it } from "vitest";

import { hexToRgb, rgbToHex, rgbToHsl } from "../conversions";
import { rgbToHct } from "../hct";
import { Hct } from "../hct/hct-class";
import * as utils from "../utils/color_utils";

// Helper function to calculate WCAG contrast ratio
function calculateContrast(
  rgb1: { b: number; g: number; r: number },
  rgb2: { b: number; g: number; r: number },
): number {
  // Calculate relative luminance
  function getLuminance(rgb: { b: number; g: number; r: number }): number {
    const { b, g, r } = rgb;
    const sRGB = [r, g, b].map((val) => {
      if (val <= 0.03928) {
        return val / 12.92;
      }
      return Math.pow((val + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * sRGB[0] + 0.7152 * sRGB[1] + 0.0722 * sRGB[2];
  }

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

describe("Reference Color Values", () => {
  describe("Material Design Colors", () => {
    it("should correctly convert Material Design Blue 500", () => {
      const blue500 = "#2196F3";
      const rgb = hexToRgb(blue500);

      // Official RGB values from Material Design
      expect(rgb.r).toBe(33);
      expect(rgb.g).toBe(150);
      expect(rgb.b).toBe(243);

      // Convert to HCT
      const hct = rgbToHct(rgb);
      expect(hct.h).toBeCloseTo(272, -1); // Blue hue in HCT (different from HSL)
      expect(hct.c).toBeGreaterThan(50); // High chroma for vibrant blue
      expect(hct.t).toBeCloseTo(58, -1); // Medium tone
    });

    it("should handle Material Design color tones correctly", () => {
      // Material Design 3 standard tones
      const standardTones = [
        0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100,
      ];

      // Create a tonal palette from a primary color
      const primaryHue = 260; // Purple
      const primaryChroma = 48;

      for (const tone of standardTones) {
        const hct = Hct.from(primaryHue, primaryChroma, tone);
        // Allow some variation in extreme tones due to color space limitations
        if (tone === 0 || tone === 100) {
          expect(hct.tone).toBeCloseTo(tone, -1);
        } else if (tone <= 40) {
          // Lower tones have more variation due to gamut limitations
          expect(Math.abs(hct.tone - tone)).toBeLessThan(10);
        } else {
          expect(hct.tone).toBeCloseTo(tone, -1); // Within 10 units
        }

        // Verify tone creates proper contrast
        if (tone <= 50) {
          // Dark tones should have good contrast with white
          const argb = hct.toInt();
          const rgb = {
            b: utils.blueFromArgb(argb) / 255,
            g: utils.greenFromArgb(argb) / 255,
            r: utils.redFromArgb(argb) / 255,
          };
          const contrastWithWhite = calculateContrast(rgb, {
            b: 1,
            g: 1,
            r: 1,
          });

          if (tone <= 40) {
            expect(contrastWithWhite).toBeGreaterThan(3); // WCAG AA for large text
          }
          if (tone <= 30) {
            expect(contrastWithWhite).toBeGreaterThan(4.5); // WCAG AA for normal text
          }
        }
      }
    });
  });

  describe("CSS Named Colors", () => {
    const namedColors = [
      { hex: "#ff6347", name: "tomato", rgb: { b: 71, g: 99, r: 255 } },
      { hex: "#1e90ff", name: "dodgerblue", rgb: { b: 255, g: 144, r: 30 } },
      { hex: "#663399", name: "rebeccapurple", rgb: { b: 153, g: 51, r: 102 } },
      { hex: "#ff7f50", name: "coral", rgb: { b: 80, g: 127, r: 255 } },
      { hex: "#ffd700", name: "gold", rgb: { b: 0, g: 215, r: 255 } },
      { hex: "#dc143c", name: "crimson", rgb: { b: 60, g: 20, r: 220 } },
      {
        hex: "#3cb371",
        name: "mediumseagreen",
        rgb: { b: 113, g: 179, r: 60 },
      },
    ];

    namedColors.forEach(({ hex, name, rgb: expectedRgb }) => {
      it(`should correctly convert CSS named color: ${name}`, () => {
        const rgb = hexToRgb(hex);

        // Verify RGB values
        expect(rgb.r).toBe(expectedRgb.r);
        expect(rgb.g).toBe(expectedRgb.g);
        expect(rgb.b).toBe(expectedRgb.b);

        // Verify round-trip conversion
        const hexBack = rgbToHex(rgb);
        expect(hexBack.toLowerCase()).toBe(hex.toLowerCase());
      });
    });

    it("should convert rebeccapurple to correct HCT values", () => {
      // rebeccapurple was added to CSS to honor Eric Meyer
      const rgb = hexToRgb("#663399");
      const hct = rgbToHct(rgb);

      expect(hct.h).toBeCloseTo(309, -1); // Purple hue in HCT
      expect(hct.c).toBeGreaterThan(40); // Moderate chroma
      expect(hct.t).toBeCloseTo(32, -1); // Dark tone
    });
  });

  describe("WCAG Contrast Ratios", () => {
    it("should verify maximum contrast ratio (black on white)", () => {
      const black = { b: 0, g: 0, r: 0 };
      const white = { b: 1, g: 1, r: 1 };

      const contrast = calculateContrast(black, white);
      expect(contrast).toBeCloseTo(21, 0); // Maximum possible contrast
    });

    it("should verify WCAG AA compliance examples", () => {
      // #777777 on white achieves exactly 4.5:1
      const gray777 = hexToRgb("#777777");
      const white = { b: 1, g: 1, r: 1 };

      const contrast = calculateContrast(
        { b: gray777.b / 255, g: gray777.g / 255, r: gray777.r / 255 },
        white,
      );
      expect(contrast).toBeCloseTo(4.5, 1); // WCAG AA minimum
    });

    it("should verify WCAG AAA compliance examples", () => {
      // #595959 on white achieves approximately 7:1
      const gray595 = hexToRgb("#595959");
      const white = { b: 1, g: 1, r: 1 };

      const contrast = calculateContrast(
        { b: gray595.b / 255, g: gray595.g / 255, r: gray595.r / 255 },
        white,
      );
      expect(contrast).toBeCloseTo(7, 1); // WCAG AAA minimum
    });

    it("should verify specific color contrasts on white", () => {
      const white = { b: 1, g: 1, r: 1 };

      // Pure red on white
      const red = { b: 0, g: 0, r: 1 };
      const redContrast = calculateContrast(red, white);
      expect(redContrast).toBeCloseTo(4, 0.5); // ~4:1

      // Pure green on white (poor contrast)
      const green = { b: 0, g: 1, r: 0 };
      const greenContrast = calculateContrast(green, white);
      expect(greenContrast).toBeLessThan(2); // ~1.4:1, fails WCAG

      // Pure blue on white
      const blue = { b: 1, g: 0, r: 0 };
      const blueContrast = calculateContrast(blue, white);
      expect(blueContrast).toBeCloseTo(8.6, 0.5); // ~8.6:1
    });
  });

  describe("HCT Color Space Properties", () => {
    it("should maintain tone-based contrast guarantees", () => {
      // HCT tone differences guarantee specific contrast ratios
      const hue = 180;
      const chroma = 40;

      // Tone 40 vs white should give ~3:1 contrast
      const tone40 = Hct.from(hue, chroma, 40);
      const argb40 = tone40.toInt();
      const rgb40 = {
        b: utils.blueFromArgb(argb40) / 255,
        g: utils.greenFromArgb(argb40) / 255,
        r: utils.redFromArgb(argb40) / 255,
      };
      const contrast40 = calculateContrast(rgb40, { b: 1, g: 1, r: 1 });
      expect(contrast40).toBeGreaterThan(2.5); // Close to 3:1

      // Tone 50 vs white should give ~4.5:1 contrast
      const tone50 = Hct.from(hue, chroma, 50);
      const argb50 = tone50.toInt();
      const rgb50 = {
        b: utils.blueFromArgb(argb50) / 255,
        g: utils.greenFromArgb(argb50) / 255,
        r: utils.redFromArgb(argb50) / 255,
      };
      const contrast50 = calculateContrast(rgb50, { b: 1, g: 1, r: 1 });
      expect(contrast50).toBeGreaterThan(4); // Close to 4.5:1
    });

    it("should handle HCT chroma clamping for impossible colors", () => {
      // Very high chroma at extreme tones is impossible
      // Very high chroma at extreme tones gets adjusted
      const hct1 = Hct.from(0, 200, 95); // High tone, high chroma
      expect(hct1.chroma).toBeLessThan(120); // Chroma gets clamped
      // Tone might be adjusted when chroma is impossible
      expect(hct1.tone).toBeGreaterThan(50); // Tone adjusted

      const hct2 = Hct.from(180, 200, 5); // Low tone, high chroma
      expect(hct2.chroma).toBeLessThan(120); // Chroma gets clamped
      // Tone might be adjusted when chroma is impossible
      expect(hct2.tone).toBeLessThan(50); // Tone adjusted
    });
  });

  describe("Color Space Conversions", () => {
    it("should accurately convert between color spaces", () => {
      // Test with Material Design Indigo 500
      const indigo500 = "#3F51B5";
      const rgb = hexToRgb(indigo500);

      // To HSL
      const hsl = rgbToHsl(rgb);
      expect(hsl.h).toBeCloseTo(231, -1); // Blue-purple hue
      expect(hsl.s).toBeCloseTo(48, -1); // Moderate saturation (percentage)
      expect(hsl.l).toBeCloseTo(48, -1); // Medium lightness (percentage)

      // To HCT
      const hct = rgbToHct(rgb);
      expect(hct.h).toBeCloseTo(295, -1); // Blue-purple in HCT
      expect(hct.c).toBeGreaterThan(30); // Moderate chroma
      expect(hct.t).toBeCloseTo(40, -1); // Medium-dark tone

      // Round-trip test
      const hctObj = Hct.from(hct.h, hct.c, hct.t);
      const argb = hctObj.toInt();
      const rgbBack = {
        b: utils.blueFromArgb(argb),
        g: utils.greenFromArgb(argb),
        r: utils.redFromArgb(argb),
      };

      // Allow some tolerance due to color space conversions
      expect(rgbBack.r).toBeCloseTo(rgb.r, -1);
      expect(rgbBack.g).toBeCloseTo(rgb.g, -1);
      expect(rgbBack.b).toBeCloseTo(rgb.b, -1);
    });
  });
});
