/**
 * Theme Color Matcher
 * Finds closest theme colors using HCT perceptual distance
 */

import type { HCT } from "../color/hct/types.js";
import type {
  ColorContext,
  MatchingOptions,
  SemanticRole,
  ThemeMatch,
  ThemeVariable,
  ThemeVariables,
} from "./types.js";

import { hexToRgb } from "../color/conversions.js";
import { rgbToHct } from "../color/hct/hct-solver.js";
import { getContrastRatio } from "../color/utils.js";

/**
 * Default matching weights
 */
const DEFAULT_WEIGHTS = {
  accessibility: 0.2,
  perceptual: 0.6,
  semantic: 0.2,
};

/**
 * Maximum acceptable distances for different contexts
 */
const CONTEXT_MAX_DISTANCES: Record<ColorContext, number> = {
  accent: 15, // Moderate for brand consistency
  background: 15, // Moderate flexibility
  border: 20, // More flexibility
  decorative: 30, // Most flexible
  shadow: 25, // Even more flexibility
  text: 10, // Strict for readability
};

/**
 * Find matches for multiple colors
 */
export function findBatchMatches(
  colors: string[],
  themeVariables: ThemeVariables,
  options: MatchingOptions = {},
): Map<string, null | ThemeMatch> {
  const results = new Map<string, null | ThemeMatch>();

  for (const color of colors) {
    results.set(color, findClosestThemeColor(color, themeVariables, options));
  }

  return results;
}

/**
 * Find the closest theme color for a given input color
 */
export function findClosestThemeColor(
  inputColor: string,
  themeVariables: ThemeVariables,
  options: MatchingOptions = {},
): null | ThemeMatch {
  // Parse input color to HCT
  let inputHct: HCT;
  try {
    const rgb = parseColorToRgb(inputColor);
    inputHct = rgbToHct(rgb);
  } catch {
    console.error(`Failed to parse input color: ${inputColor}`);
    return null;
  }

  // Flatten theme variables
  const allVariables = flattenThemeVariables(themeVariables);
  if (allVariables.length === 0) {
    return null;
  }

  // Calculate distances and scores
  const candidates = allVariables.map((variable) => ({
    distance: calculateHctDistance(inputHct, variable.hct),
    score: 0, // Will be calculated next
    variable,
  }));

  // Apply context-based filtering
  const maxDistance =
    options.maxDistance ??
    (options.contextType ? CONTEXT_MAX_DISTANCES[options.contextType] : 30);

  const validCandidates = candidates.filter((c) => c.distance <= maxDistance);
  if (validCandidates.length === 0) {
    return null;
  }

  // Calculate multi-factor scores
  const weights = options.weights ?? DEFAULT_WEIGHTS;
  for (const candidate of validCandidates) {
    candidate.score = calculateMatchScore(
      inputHct,
      candidate.variable,
      candidate.distance,
      weights,
      options,
    );
  }

  // Sort by score (higher is better)
  validCandidates.sort((a, b) => b.score - a.score);

  // Get the best match and alternatives
  const best = validCandidates[0];
  const alternatives = validCandidates.slice(1, 4).map((c) => ({
    alternatives: [],
    confidence: calculateConfidence(c.distance, c.score),
    distance: c.distance,
    semanticRole: c.variable.role,
    value: c.variable.value,
    variable: c.variable.name,
  }));

  // Calculate accessibility info if needed
  const accessibilityInfo =
    options.contextType === "text" || options.contextType === "background"
      ? calculateAccessibilityInfo(best.variable.value, themeVariables)
      : undefined;

  return {
    accessibilityInfo,
    alternatives,
    confidence: calculateConfidence(best.distance, best.score),
    distance: best.distance,
    semanticRole: best.variable.role,
    value: best.variable.value,
    variable: best.variable.name,
  };
}

/**
 * Calculate accessibility information
 */
function calculateAccessibilityInfo(
  color: string,
  themeVariables: ThemeVariables,
): ThemeMatch["accessibilityInfo"] {
  const rgb = parseColorToRgb(color);

  // Find typical background and foreground colors
  const backgrounds = findTypicalBackgrounds(themeVariables);
  const foregrounds = findTypicalForegrounds(themeVariables);

  let maxContrastBg = 0;
  let maxContrastFg = 0;

  for (const bg of backgrounds) {
    const bgRgb = parseColorToRgb(bg.value);
    const contrast = getContrastRatio(rgb, bgRgb);
    maxContrastBg = Math.max(maxContrastBg, contrast);
  }

  for (const fg of foregrounds) {
    const fgRgb = parseColorToRgb(fg.value);
    const contrast = getContrastRatio(rgb, fgRgb);
    maxContrastFg = Math.max(maxContrastFg, contrast);
  }

  return {
    contrastWithBackground: maxContrastBg,
    contrastWithForeground: maxContrastFg,
    meetsAA: maxContrastBg >= 4.5 || maxContrastFg >= 4.5,
    meetsAAA: maxContrastBg >= 7.0 || maxContrastFg >= 7.0,
  };
}

/**
 * Calculate confidence score (0-100)
 */
function calculateConfidence(distance: number, score: number): number {
  // For very small distances (exact or near-exact matches), return high confidence
  if (distance < 0.5) return 100;
  if (distance < 1) return 98;
  if (distance < 2) return 95;

  // Combine distance and score for confidence
  const distanceConfidence = Math.max(0, 100 - distance * 2);
  const scoreConfidence = score * 100;
  return Math.round((distanceConfidence + scoreConfidence) / 2);
}

/**
 * Calculate semantic score based on context
 */
function calculateContextSemanticScore(
  context: ColorContext,
  role: SemanticRole | undefined,
): number {
  if (!role) return 0.5;

  switch (context) {
    case "accent":
      return role === "primary" || role === "secondary" ? 1.0 : 0.5;
    case "background":
      return role === "surface" || role === "background" ? 1.0 : 0.3;
    case "border":
      // Strongly prefer outline role for border context
      return role === "outline" ? 1.0 : role === "neutral" ? 0.4 : 0.2;
    case "decorative":
      return 0.7; // Any role is acceptable
    case "shadow":
      return role === "shadow" ? 1.0 : 0.3;
    case "text":
      return role === "neutral" || role === "surface" ? 0.8 : 0.5;
    default:
      return 0.5;
  }
}

/**
 * Calculate HCT perceptual distance
 */
function calculateHctDistance(color1: HCT, color2: HCT): number {
  // Weight factors for HCT components
  const hueWeight = 1.0;
  const chromaWeight = 1.0;
  const toneWeight = 2.0; // Tone is most important for perception

  // Calculate hue difference (circular)
  let hueDiff = Math.abs(color1.h - color2.h);
  if (hueDiff > 180) {
    hueDiff = 360 - hueDiff;
  }

  // Normalize hue difference (0-1)
  hueDiff = hueDiff / 180;

  // Calculate chroma difference (normalize by max chroma ~120)
  const chromaDiff = Math.abs(color1.c - color2.c) / 120;

  // Calculate tone difference (0-100)
  const toneDiff = Math.abs(color1.t - color2.t) / 100;

  // Weighted Euclidean distance
  return (
    Math.sqrt(
      Math.pow(hueDiff * hueWeight, 2) +
        Math.pow(chromaDiff * chromaWeight, 2) +
        Math.pow(toneDiff * toneWeight, 2),
    ) * 100
  ); // Scale to 0-100 range
}

/**
 * Calculate multi-factor match score
 */
function calculateMatchScore(
  inputHct: HCT,
  candidate: ThemeVariable,
  distance: number,
  weights: { accessibility: number; perceptual: number; semantic: number },
  options: MatchingOptions,
): number {
  // Perceptual score (inverse of distance)
  const perceptualScore = Math.max(0, 100 - distance) / 100;

  // Semantic score
  let semanticScore = 0.5; // Neutral if no preference
  if (options.preferredRole && candidate.role) {
    semanticScore = candidate.role === options.preferredRole ? 1.0 : 0.3;
  } else if (options.contextType) {
    semanticScore = calculateContextSemanticScore(
      options.contextType,
      candidate.role,
    );
  }

  // Accessibility score (based on tone appropriateness)
  let accessibilityScore = 0.5; // Neutral default
  if (options.contextType === "text") {
    // Prefer high contrast (very light or very dark)
    accessibilityScore = candidate.tone < 30 || candidate.tone > 70 ? 1.0 : 0.3;
  } else if (options.contextType === "background") {
    // Prefer mid-tones for backgrounds
    accessibilityScore =
      candidate.tone >= 90 || candidate.tone <= 10 ? 1.0 : 0.5;
  }

  // Calculate weighted score
  return (
    perceptualScore * weights.perceptual +
    semanticScore * weights.semantic +
    accessibilityScore * weights.accessibility
  );
}

/**
 * Find typical background colors from theme
 */
function findTypicalBackgrounds(theme: ThemeVariables): ThemeVariable[] {
  const backgrounds: ThemeVariable[] = [];

  if (theme.surface) {
    backgrounds.push(
      ...theme.surface.filter((v) => v.tone >= 90 || v.tone <= 10),
    );
  }
  if (theme.background) {
    backgrounds.push(...theme.background);
  }
  if (theme.neutral) {
    backgrounds.push(
      ...theme.neutral.filter((v) => v.tone >= 95 || v.tone <= 5),
    );
  }

  return backgrounds;
}

/**
 * Find typical foreground colors from theme
 */
function findTypicalForegrounds(theme: ThemeVariables): ThemeVariable[] {
  const foregrounds: ThemeVariable[] = [];

  if (theme.neutral) {
    foregrounds.push(
      ...theme.neutral.filter(
        (v) => (v.tone >= 20 && v.tone <= 40) || (v.tone >= 60 && v.tone <= 80),
      ),
    );
  }
  if (theme.surface) {
    foregrounds.push(
      ...theme.surface.filter((v) => v.tone >= 10 && v.tone <= 30),
    );
  }

  return foregrounds;
}

/**
 * Flatten theme variables into a single array
 */
function flattenThemeVariables(theme: ThemeVariables): ThemeVariable[] {
  const variables: ThemeVariable[] = [];

  // Add standard roles
  if (theme.primary) variables.push(...theme.primary);
  if (theme.secondary) variables.push(...theme.secondary);
  if (theme.tertiary) variables.push(...theme.tertiary);
  if (theme.error) variables.push(...theme.error);
  if (theme.neutral) variables.push(...theme.neutral);
  if (theme.surface) variables.push(...theme.surface);
  if (theme.background) variables.push(...theme.background);
  if (theme.outline) variables.push(...theme.outline);
  if (theme.shadow) variables.push(...theme.shadow);

  // Add custom roles
  if (theme.custom) {
    for (const customVars of Object.values(theme.custom)) {
      variables.push(...customVars);
    }
  }

  return variables;
}

/**
 * Parse color string to RGB
 */
function parseColorToRgb(color: string): { b: number; g: number; r: number } {
  // Remove whitespace
  color = color.trim();

  // Hex color
  if (color.startsWith("#")) {
    return hexToRgb(color);
  }

  // RGB/RGBA
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
