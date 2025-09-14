/**
 * Tests for Theme Color Matcher
 */

import { describe, expect, it } from "vitest";

import type { ThemeVariables } from "../types.js";

import { findBatchMatches, findClosestThemeColor } from "../matcher.js";
import { parseThemeVariables } from "../parser.js";

describe("Theme Color Matcher", () => {
  // Sample theme for testing
  const sampleThemeCSS = `
    :root {
      --color-primary-0: #000000;
      --color-primary-10: #21005d;
      --color-primary-20: #381e72;
      --color-primary-30: #4f378b;
      --color-primary-40: #6750a4;
      --color-primary-50: #7f67be;
      --color-primary-60: #9a82db;
      --color-primary-70: #b69df8;
      --color-primary-80: #d0bcff;
      --color-primary-90: #eaddff;
      --color-primary-95: #f6edff;
      --color-primary-99: #fffbfe;
      --color-primary-100: #ffffff;
      
      --color-surface-0: #000000;
      --color-surface-10: #1c1b1f;
      --color-surface-90: #e6e1e5;
      --color-surface-95: #f4eff4;
      --color-surface-99: #fffbfe;
      --color-surface-100: #ffffff;
      
      --color-error-40: #ba1a1a;
      --color-error-90: #ffdad6;
    }
  `;

  const themeVariables: ThemeVariables = parseThemeVariables(sampleThemeCSS);

  describe("findClosestThemeColor", () => {
    it("should find exact match", () => {
      const match = findClosestThemeColor("#6750a4", themeVariables);

      expect(match).toBeDefined();
      expect(match?.variable).toBe("--color-primary-40");
      expect(match?.confidence).toBeGreaterThan(95);
      expect(match?.distance).toBeLessThan(1);
    });

    it("should find close match", () => {
      const match = findClosestThemeColor("#6850a0", themeVariables);

      expect(match).toBeDefined();
      expect(match?.variable).toBe("--color-primary-40");
      expect(match?.confidence).toBeGreaterThan(70);
      expect(match?.distance).toBeLessThan(10);
    });

    it("should return null for colors too far from theme", () => {
      const match = findClosestThemeColor("#00ff00", themeVariables, {
        maxDistance: 20,
      });

      expect(match).toBeNull();
    });

    it("should use context for better matching", () => {
      const textMatch = findClosestThemeColor("#1a1a1a", themeVariables, {
        contextType: "text",
      });

      const bgMatch = findClosestThemeColor("#f5f5f5", themeVariables, {
        contextType: "background",
      });

      expect(textMatch).toBeDefined();
      expect(bgMatch).toBeDefined();

      // Text should prefer darker colors
      if (textMatch?.variable.includes("surface")) {
        expect(textMatch.variable).toMatch(/-(0|10)/);
      }

      // Background should prefer lighter colors
      if (bgMatch?.variable.includes("surface")) {
        expect(bgMatch.variable).toMatch(/-(90|95|99|100)/);
      }
    });

    it("should provide alternatives", () => {
      const match = findClosestThemeColor("#5040a0", themeVariables);

      expect(match).toBeDefined();
      expect(match?.alternatives).toBeDefined();
      expect(match?.alternatives.length).toBeGreaterThan(0);
      expect(match?.alternatives.length).toBeLessThanOrEqual(3);
    });

    it("should detect semantic role", () => {
      const match = findClosestThemeColor("#ba1a1a", themeVariables);

      expect(match).toBeDefined();
      expect(match?.semanticRole).toBe("error");
    });

    it("should calculate accessibility info for text context", () => {
      const match = findClosestThemeColor("#000000", themeVariables, {
        contextType: "text",
      });

      expect(match).toBeDefined();
      expect(match?.accessibilityInfo).toBeDefined();
      expect(match?.accessibilityInfo?.contrastWithBackground).toBeGreaterThan(
        0,
      );
      expect(match?.accessibilityInfo?.meetsAA).toBeDefined();
      expect(match?.accessibilityInfo?.meetsAAA).toBeDefined();
    });

    it("should respect preferred role", () => {
      const match = findClosestThemeColor("#d0bcff", themeVariables, {
        preferredRole: "primary",
      });

      expect(match).toBeDefined();
      expect(match?.variable).toBe("--color-primary-80");
      expect(match?.semanticRole).toBe("primary");
    });
  });

  describe("findBatchMatches", () => {
    it("should match multiple colors", () => {
      const colors = ["#6750a4", "#ba1a1a", "#ffffff"];
      const matches = findBatchMatches(colors, themeVariables);

      expect(matches.size).toBe(3);

      const primaryMatch = matches.get("#6750a4");
      expect(primaryMatch).toBeDefined();
      expect(primaryMatch?.variable).toBe("--color-primary-40");

      const errorMatch = matches.get("#ba1a1a");
      expect(errorMatch).toBeDefined();
      expect(errorMatch?.variable).toBe("--color-error-40");

      const whiteMatch = matches.get("#ffffff");
      expect(whiteMatch).toBeDefined();
      expect(whiteMatch?.variable).toMatch(/-(100|99)$/);
    });

    it("should handle invalid colors", () => {
      const colors = ["#6750a4", "invalid", "#ffffff"];
      const matches = findBatchMatches(colors, themeVariables);

      expect(matches.size).toBe(3);
      expect(matches.get("invalid")).toBeNull();
      expect(matches.get("#6750a4")).toBeDefined();
      expect(matches.get("#ffffff")).toBeDefined();
    });

    it("should apply context to all colors", () => {
      const colors = ["#1c1b1f", "#e6e1e5"];
      const matches = findBatchMatches(colors, themeVariables, {
        contextType: "text",
      });

      expect(matches.size).toBe(2);

      const darkMatch = matches.get("#1c1b1f");
      const lightMatch = matches.get("#e6e1e5");

      expect(darkMatch).toBeDefined();
      expect(lightMatch).toBeDefined();
    });
  });
});
