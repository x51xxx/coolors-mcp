/**
 * Tests for CSS Refactoring Utilities
 */

import { describe, expect, it } from "vitest";

import { parseThemeVariables } from "../parser.js";
import {
  generateRefactoringReport,
  refactorColor,
  refactorCss,
} from "../refactor.js";

describe("CSS Refactoring", () => {
  const themeCSS = `
    :root {
      --color-primary-40: #6750a4;
      --color-primary-60: #9a82db;
      --color-primary-80: #d0bcff;
      --color-surface-10: #1c1b1f;
      --color-surface-90: #e6e1e5;
      --color-surface-99: #fffbfe;
      --color-error-40: #ba1a1a;
      --color-neutral-50: #79747e;
      --color-outline-50: #79747e;
    }
  `;

  const themeVariables = parseThemeVariables(themeCSS);

  describe("refactorCss", () => {
    it("should refactor hex colors", () => {
      const css = `.button {
        background-color: #6750a4;
        color: #fffbfe;
        border: 1px solid #79747e;
      }`;

      const result = refactorCss(css, themeVariables);

      expect(result.statistics.totalColors).toBe(3);
      expect(result.statistics.replacedColors).toBe(3);
      expect(result.refactored).toContain("var(--color-primary-40)");
      expect(result.refactored).toContain("var(--color-surface-99)");
      expect(result.refactored).toContain("var(--color-");
    });

    it("should preserve original colors as comments when requested", () => {
      const css = `.button { background: #6750a4; }`;

      const result = refactorCss(css, themeVariables, {
        addComments: true,
        preserveOriginal: true,
      });

      expect(result.refactored).toContain("/* #6750a4 */");
      expect(result.refactored).toContain("var(--color-primary-40)");
    });

    it("should not preserve original when disabled", () => {
      const css = `.button { background: #6750a4; }`;

      const result = refactorCss(css, themeVariables, {
        addComments: false,
        preserveOriginal: false,
      });

      expect(result.refactored).not.toContain("/* #6750a4 */");
      expect(result.refactored).toContain("var(--color-primary-40)");
    });

    it("should handle rgb colors", () => {
      const css = `.text { color: rgb(28, 27, 31); }`;

      // Lower confidence threshold since HCT conversion may cause slight differences
      const result = refactorCss(css, themeVariables, { minConfidence: 60 });

      expect(result.statistics.totalColors).toBe(1);
      expect(result.statistics.replacedColors).toBe(1);
      expect(result.refactored).toContain("var(--color-surface-10)");
    });

    it("should respect minimum confidence", () => {
      const css = `.button { background: #5040a0; }`; // Similar but not exact

      const result = refactorCss(css, themeVariables, {
        minConfidence: 95,
      });

      expect(result.statistics.replacedColors).toBe(0);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].type).toBe("low-confidence");
    });

    it("should generate warnings for no matches", () => {
      const css = `.button { background: #00ff00; }`; // Green - not in theme

      const result = refactorCss(css, themeVariables);

      expect(result.statistics.replacedColors).toBe(0);
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0].type).toBe("no-match");
    });

    it("should use context from CSS properties", () => {
      const css = `
        .element {
          color: #1c1b1f;
          background-color: #fffbfe;
          border-color: #79747e;
          box-shadow: 0 2px 4px #1c1b1f;
        }
      `;

      const result = refactorCss(css, themeVariables);

      expect(result.statistics.replacedColors).toBe(4);
      expect(result.replacements[0].context).toBe("text");
      expect(result.replacements[1].context).toBe("background");
      expect(result.replacements[2].context).toBe("border");
      expect(result.replacements[3].context).toBe("shadow");
    });

    it("should add summary comment when requested", () => {
      const css = `.button { background: #6750a4; }`;

      const result = refactorCss(css, themeVariables, {
        addComments: true,
      });

      expect(result.refactored).toContain(
        "/* CSS Refactored with Theme Variables",
      );
      expect(result.refactored).toContain("Total colors found:");
      expect(result.refactored).toContain("Colors replaced:");
    });

    it("should track line and column positions", () => {
      const css = `.button {\n  background: #6750a4;\n  color: #fffbfe;\n}`;

      const result = refactorCss(css, themeVariables);

      expect(result.replacements[0].line).toBe(2);
      expect(result.replacements[1].line).toBe(3);
      expect(result.replacements[0].column).toBeGreaterThan(0);
    });
  });

  describe("refactorColor", () => {
    it("should refactor single color", () => {
      const result = refactorColor("#6750a4", themeVariables);

      expect(result.variable).toBe("--color-primary-40");
      expect(result.confidence).toBeGreaterThan(95);
      expect(result.alternatives).toBeDefined();
    });

    it("should return null for no match", () => {
      const result = refactorColor("#00ff00", themeVariables);

      expect(result.variable).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.alternatives).toHaveLength(0);
    });

    it("should use context when provided", () => {
      const result = refactorColor("#79747e", themeVariables, "border");

      expect(result.variable).toBe("--color-outline-50");
      expect(result.confidence).toBeGreaterThan(0);
    });
  });

  describe("generateRefactoringReport", () => {
    it("should generate markdown report", () => {
      const css = `
        .button {
          background: #6750a4;
          color: #fffbfe;
          border: 1px solid #00ff00;
        }
      `;

      const result = refactorCss(css, themeVariables);
      const report = generateRefactoringReport(result);

      expect(report).toContain("# CSS Refactoring Report");
      expect(report).toContain("## Summary");
      expect(report).toContain("Total colors found:");
      expect(report).toContain("## Replacements");
      expect(report).toContain("## Warnings");
    });

    it("should group replacements by confidence", () => {
      const css = `
        .high { color: #6750a4; }
        .medium { color: #6751a5; }
        .low { color: #5040a0; }
      `;

      const result = refactorCss(css, themeVariables, {
        minConfidence: 30,
      });
      const report = generateRefactoringReport(result);

      expect(report).toMatch(
        /High Confidence|Medium Confidence|Low Confidence/,
      );
    });

    it("should group warnings by type", () => {
      const css = `
        .no-match { color: #00ff00; }
        .low-conf { color: #123456; }
      `;

      const result = refactorCss(css, themeVariables);
      const report = generateRefactoringReport(result);

      expect(report).toContain("No Matches Found");
      expect(report).toMatch(/Low Confidence|No Matches/);
    });
  });
});
