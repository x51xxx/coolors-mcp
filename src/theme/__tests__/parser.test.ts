/**
 * Tests for Theme Parser
 */

import { describe, expect, it } from "vitest";

import {
  parseThemeVariables,
  parseThemeVariablesFromObject,
} from "../parser.js";

describe("Theme Parser", () => {
  describe("parseThemeVariables", () => {
    it("should parse CSS custom properties", () => {
      const css = `
        :root {
          --color-primary-0: #000000;
          --color-primary-50: #1976d2;
          --color-primary-100: #ffffff;
          --color-secondary-50: #dc004e;
        }
      `;

      const result = parseThemeVariables(css);

      expect(result.primary).toBeDefined();
      expect(result.primary).toHaveLength(3);
      expect(result.primary![0].name).toBe("--color-primary-0");
      expect(result.primary![0].value).toBe("#000000");
      expect(result.primary![0].tone).toBeCloseTo(0, 1);

      expect(result.secondary).toBeDefined();
      expect(result.secondary).toHaveLength(1);
      expect(result.secondary![0].name).toBe("--color-secondary-50");
    });

    it("should handle different color formats", () => {
      const css = `
        :root {
          --primary: #ff0000;
          --secondary: rgb(0, 255, 0);
          --tertiary: hsl(240, 100%, 50%);
          --neutral: gray;
        }
      `;

      const result = parseThemeVariables(css);

      expect(result.primary).toBeDefined();
      expect(result.primary![0].value).toBe("#ff0000");

      expect(result.secondary).toBeDefined();
      expect(result.secondary![0].value).toBe("#00ff00");

      expect(result.tertiary).toBeDefined();
      expect(result.tertiary![0].value).toBe("#0000ff");

      expect(result.neutral).toBeDefined();
      expect(result.neutral![0].value).toBe("#808080");
    });

    it("should detect semantic roles from variable names", () => {
      const css = `
        :root {
          --primary-color: #1976d2;
          --secondary-accent: #dc004e;
          --error-red: #d32f2f;
          --surface-light: #f5f5f5;
          --background-dark: #121212;
          --border-gray: #e0e0e0;
          --shadow-color: rgba(0,0,0,0.2);
        }
      `;

      const result = parseThemeVariables(css);

      expect(result.primary).toBeDefined();
      expect(result.primary![0].role).toBe("primary");

      expect(result.secondary).toBeDefined();
      expect(result.secondary![0].role).toBe("secondary");

      expect(result.error).toBeDefined();
      expect(result.error![0].role).toBe("error");

      expect(result.surface).toBeDefined();
      expect(result.surface![0].role).toBe("surface");

      expect(result.background).toBeDefined();
      expect(result.background![0].role).toBe("background");
    });

    it("should organize custom roles", () => {
      const css = `
        :root {
          --color-brand-0: #000000;
          --color-brand-50: #1976d2;
          --color-brand-100: #ffffff;
          --accent-warm: #ff6b6b;
          --random-color: #123456;
        }
      `;

      const result = parseThemeVariables(css);

      expect(result.custom).toBeDefined();
      expect(result.custom!["brand"]).toBeDefined();
      expect(result.custom!["brand"]).toHaveLength(3);
      // accent-warm will be parsed as 'accent'
      expect(result.custom!["accent"]).toBeDefined();
      expect(result.custom!["uncategorized"]).toBeDefined();
    });

    it("should sort variables by tone", () => {
      const css = `
        :root {
          --color-primary-90: #e1f5fe;
          --color-primary-10: #01579b;
          --color-primary-50: #1976d2;
        }
      `;

      const result = parseThemeVariables(css);

      expect(result.primary).toBeDefined();
      expect(result.primary![0].tone).toBeLessThan(result.primary![1].tone);
      expect(result.primary![1].tone).toBeLessThan(result.primary![2].tone);
    });
  });

  describe("parseThemeVariablesFromObject", () => {
    it("should parse variables from object", () => {
      const variables = {
        "--color-primary-50": "#1976d2",
        "--color-secondary-50": "#dc004e",
        "--not-a-color": "16px",
        "not-a-variable": "#000000",
      };

      const result = parseThemeVariablesFromObject(variables);

      expect(result.primary).toBeDefined();
      expect(result.primary).toHaveLength(1);
      expect(result.secondary).toBeDefined();
      expect(result.secondary).toHaveLength(1);
    });
  });
});
