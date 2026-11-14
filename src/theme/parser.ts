/**
 * Theme Parser
 * Parses CSS variables and extracts theme colors
 */

import type { SemanticRole, ThemeVariable, ThemeVariables } from "./types.js";

import { getColorAlpha, parseColor, rgbToHex } from "../color/conversions.js";
import { rgbToHct } from "../color/hct/hct-solver.js";

/**
 * Parse CSS content and extract theme variables
 */
export function parseThemeVariables(css: string): ThemeVariables {
  const variables: ThemeVariable[] = [];

  // Match CSS custom properties
  const varRegex = /--([\w-]+):\s*([^;]+);/g;
  let match;

  while ((match = varRegex.exec(css)) !== null) {
    const [, name, value] = match;
    const fullName = `--${name}`;
    const trimmedValue = value.trim();

    // Check if it's a color value
    if (isColorValue(trimmedValue)) {
      const colorValue = normalizeColorValue(trimmedValue);
      if (colorValue) {
        try {
          const rgb = parseColorToRgb(colorValue);
          const hct = rgbToHct(rgb);

          variables.push({
            hct,
            name: fullName,
            role: detectSemanticRole(name),
            tone: hct.t,
            value: colorValue,
          });
        } catch {
          // Skip invalid color values
          console.warn(
            `Failed to parse color variable ${fullName}: ${trimmedValue}`,
          );
        }
      }
    }
  }

  // Organize variables by role
  return organizeByRole(variables);
}

/**
 * Parse CSS variables from an object (e.g., from getComputedStyle)
 */
export function parseThemeVariablesFromObject(
  variables: Record<string, string>,
): ThemeVariables {
  const themeVars: ThemeVariable[] = [];

  for (const [name, value] of Object.entries(variables)) {
    if (name.startsWith("--") && isColorValue(value)) {
      const colorValue = normalizeColorValue(value);
      if (colorValue) {
        try {
          const rgb = parseColorToRgb(colorValue);
          const hct = rgbToHct(rgb);

          themeVars.push({
            hct,
            name,
            role: detectSemanticRole(name.slice(2)), // Remove -- prefix
            tone: hct.t,
            value: colorValue,
          });
        } catch {
          console.warn(`Failed to parse color variable ${name}: ${value}`);
        }
      }
    }
  }

  return organizeByRole(themeVars);
}

/**
 * Detect semantic role from variable name
 */
function detectSemanticRole(name: string): SemanticRole | undefined {
  const lower = name.toLowerCase();

  if (lower.includes("primary")) return "primary";
  if (lower.includes("secondary")) return "secondary";
  if (lower.includes("tertiary")) return "tertiary";
  if (lower.includes("error") || lower.includes("danger")) return "error";
  if (lower.includes("neutral") || lower.includes("gray")) return "neutral";
  if (lower.includes("surface")) return "surface";
  if (lower.includes("background") || lower.includes("bg")) return "background";
  if (lower.includes("outline") || lower.includes("border")) return "outline";
  if (lower.includes("shadow")) return "shadow";

  return undefined;
}

/**
 * Check if a value is a color the shared parser understands
 * (hex, CSS named colors, rgb()/hsl(), oklch()/oklab(), hct()).
 */
function isColorValue(value: string): boolean {
  return parseCssColor(value) !== null;
}
/**
 * Normalize a color value to lowercase #rrggbb
 */
function normalizeColorValue(value: string): null | string {
  const rgb = parseCssColor(value);
  return rgb ? rgbToHex(rgb) : null;
}

/**
 * Organize variables by semantic role
 */
function organizeByRole(variables: ThemeVariable[]): ThemeVariables {
  const organized: ThemeVariables = {
    custom: {},
  };

  for (const variable of variables) {
    if (variable.role) {
      const role = variable.role;
      if (!organized[role]) {
        organized[role] = [];
      }
      organized[role].push(variable);
    } else {
      // Extract custom role from name pattern (e.g., --color-brand-50, --accent-warm)
      const colorPattern = variable.name.match(/--(?:color-)?([a-z]+)-\d+/i);
      const namedPattern = variable.name.match(/--([a-z]+)-[a-z]+/i);

      if (colorPattern) {
        const customRole = colorPattern[1].toLowerCase();
        if (!organized.custom![customRole]) {
          organized.custom![customRole] = [];
        }
        organized.custom![customRole].push(variable);
      } else if (namedPattern) {
        const customRole = namedPattern[1].toLowerCase();
        // Only use this pattern if it's a known semantic pattern
        const knownPatterns = [
          "accent",
          "neutral",
          "success",
          "warning",
          "info",
        ];
        if (knownPatterns.some((p) => customRole.includes(p))) {
          if (!organized.custom![customRole]) {
            organized.custom![customRole] = [];
          }
          organized.custom![customRole].push(variable);
        } else {
          // Unknown pattern, put in uncategorized
          if (!organized.custom!["uncategorized"]) {
            organized.custom!["uncategorized"] = [];
          }
          organized.custom!["uncategorized"].push(variable);
        }
      } else {
        // Uncategorized
        if (!organized.custom!["uncategorized"]) {
          organized.custom!["uncategorized"] = [];
        }
        organized.custom!["uncategorized"].push(variable);
      }
    }
  }

  // Sort each role by tone
  for (const role of Object.keys(organized)) {
    if (Array.isArray(organized[role as keyof ThemeVariables])) {
      (organized[role as keyof ThemeVariables] as ThemeVariable[]).sort(
        (a, b) => a.tone - b.tone,
      );
    } else if (role === "custom" && organized.custom) {
      for (const customRole of Object.keys(organized.custom)) {
        organized.custom[customRole].sort((a, b) => a.tone - b.tone);
      }
    }
  }

  return organized;
}

/**
 * Parse color to 0-255 RGB using the shared color parser
 */
function parseColorToRgb(color: string): { b: number; g: number; r: number } {
  const rgb = parseColor(color);
  if (!rgb) throw new Error(`Unable to parse color: ${color}`);
  return rgb;
}

/**
 * Strict CSS color parse: unlike tool inputs, stylesheet values never treat a
 * bare number such as `999999` (z-index, weight…) as hex.
 */
function parseCssColor(value: string) {
  const v = value.trim();
  if (/^[0-9a-f]+$/i.test(v)) return null;
  // Translucent values (scrims, overlays) are not opaque match targets
  const alpha = getColorAlpha(v);
  if (alpha !== undefined && alpha < 1) return null;
  return parseColor(v);
}
