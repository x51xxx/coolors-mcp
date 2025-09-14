/**
 * Theme Parser
 * Parses CSS variables and extracts theme colors
 */

import type { SemanticRole, ThemeVariable, ThemeVariables } from "./types.js";

import { hexToRgb } from "../color/conversions.js";
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
 * HSL to RGB helper
 */
function hslToRgb(
  h: number,
  s: number,
  l: number,
): { b: number; g: number; r: number } {
  let b, g, r;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { b, g, r };
}

/**
 * Check if a value is a color
 */
function isColorValue(value: string): boolean {
  const trimmed = value.trim();

  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return true;

  // RGB/RGBA
  if (/^rgba?\(/.test(trimmed)) return true;

  // HSL/HSLA
  if (/^hsla?\(/.test(trimmed)) return true;

  // Named colors (basic check)
  if (/^[a-z]+$/i.test(trimmed)) {
    return isNamedColor(trimmed);
  }

  return false;
}

/**
 * Check if string is a named color
 */
function isNamedColor(name: string): boolean {
  const namedColors = [
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "cyan",
    "magenta",
    "gray",
    "grey",
    "orange",
    "purple",
    "brown",
    "pink",
    "lime",
    "navy",
    "teal",
    "silver",
    "gold",
    "indigo",
    "violet",
    "turquoise",
    "coral",
  ];
  return namedColors.includes(name.toLowerCase());
}

/**
 * Convert named color to hex (simplified)
 */
function namedColorToHex(name: string): string {
  const colors: Record<string, string> = {
    black: "#000000",
    blue: "#0000ff",
    brown: "#a52a2a",
    coral: "#ff7f50",
    cyan: "#00ffff",
    gold: "#ffd700",
    gray: "#808080",
    green: "#008000",
    grey: "#808080",
    indigo: "#4b0082",
    lime: "#00ff00",
    magenta: "#ff00ff",
    navy: "#000080",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    teal: "#008080",
    turquoise: "#40e0d0",
    violet: "#ee82ee",
    white: "#ffffff",
    yellow: "#ffff00",
  };
  return colors[name.toLowerCase()] || "#000000";
}

/**
 * Normalize color value to a standard format
 */
function normalizeColorValue(value: string): null | string {
  const trimmed = value.trim();

  // Already in a good format
  if (/^#[0-9a-fA-F]{6}$/.test(trimmed)) {
    return trimmed;
  }

  // Short hex
  if (/^#[0-9a-fA-F]{3}$/.test(trimmed)) {
    const [, r, g, b] = trimmed.match(/#(.)(.)(.)/)!;
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // RGB/RGBA
  if (/^rgba?\(/.test(trimmed)) {
    return parseRgbString(trimmed);
  }

  // HSL/HSLA
  if (/^hsla?\(/.test(trimmed)) {
    return parseHslString(trimmed);
  }

  // Named colors
  if (isNamedColor(trimmed)) {
    return namedColorToHex(trimmed);
  }

  return null;
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
 * Parse color to RGB
 */
function parseColorToRgb(color: string): { b: number; g: number; r: number } {
  // Hex color
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  // RGB string
  if (color.startsWith("rgb")) {
    const match = color.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
    if (match) {
      return {
        b: parseInt(match[3], 10) / 255,
        g: parseInt(match[2], 10) / 255,
        r: parseInt(match[1], 10) / 255,
      };
    }
  }

  throw new Error(`Unable to parse color: ${color}`);
}

/**
 * Parse HSL/HSLA string to hex
 */
function parseHslString(hsl: string): null | string {
  const match = hsl.match(/hsla?\((\d+),\s*(\d+)%,\s*(\d+)%/);
  if (match) {
    const h = parseInt(match[1], 10) / 360;
    const s = parseInt(match[2], 10) / 100;
    const l = parseInt(match[3], 10) / 100;

    // HSL to RGB conversion
    const rgb = hslToRgb(h, s, l);
    const r = Math.round(rgb.r * 255);
    const g = Math.round(rgb.g * 255);
    const b = Math.round(rgb.b * 255);

    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  return null;
}

/**
 * Parse RGB/RGBA string to hex
 */
function parseRgbString(rgb: string): null | string {
  const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = parseInt(match[1], 10);
    const g = parseInt(match[2], 10);
    const b = parseInt(match[3], 10);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }
  return null;
}
