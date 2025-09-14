/**
 * Theme Matching Types
 * Types for theme color matching and CSS refactoring
 */

import type { HCT } from "../color/hct/types.js";

/**
 * Context where color is used
 */
export type ColorContext =
  | "accent"
  | "background"
  | "border"
  | "decorative"
  | "shadow"
  | "text";

/**
 * Single color replacement
 */
export interface ColorReplacement {
  column?: number;
  confidence: number;
  context?: ColorContext;
  cssVariable: string;
  line?: number;
  originalColor: string;
  property?: string;
  selector?: string;
}

/**
 * Options for color matching
 */
export interface MatchingOptions {
  contextType?: ColorContext; // Usage context
  maxDistance?: number; // Maximum acceptable distance
  preferredRole?: SemanticRole; // Preferred semantic role
  weights?: {
    accessibility: number; // Weight for accessibility (0-1)
    perceptual: number; // Weight for perceptual distance (0-1)
    semantic: number; // Weight for semantic appropriateness (0-1)
  };
}

/**
 * CSS refactoring result
 */
export interface RefactoringResult {
  original: string; // Original CSS
  refactored: string; // Refactored CSS with variables
  replacements: ColorReplacement[];
  statistics: {
    accessibilityIssues: number;
    averageConfidence: number;
    replacedColors: number;
    totalColors: number;
  };
  warnings: RefactoringWarning[];
}

/**
 * Warning generated during refactoring
 */
export interface RefactoringWarning {
  location?: {
    column: number;
    line: number;
  };
  message: string;
  suggestion?: string;
  type: "accessibility" | "low-confidence" | "no-match" | "semantic-mismatch";
}

/**
 * Semantic roles for colors
 */
export type SemanticRole =
  | "background"
  | "error"
  | "neutral"
  | "outline"
  | "primary"
  | "secondary"
  | "shadow"
  | "surface"
  | "tertiary";

/**
 * Result of matching a color to theme variables
 */
export interface ThemeMatch {
  accessibilityInfo?: {
    contrastWithBackground: number;
    contrastWithForeground: number;
    meetsAA: boolean;
    meetsAAA: boolean;
  };
  alternatives: ThemeMatch[]; // Alternative matches
  confidence: number; // Match confidence (0-100)
  distance: number; // HCT perceptual distance
  semanticRole?: SemanticRole; // Suggested semantic role
  value: string; // Color value
  variable: string; // CSS variable name
}

/**
 * Theme quality assessment
 */
export interface ThemeQualityReport {
  accessibility: {
    aa: number; // Percentage meeting AA
    aaa: number; // Percentage meeting AAA
    issues: string[];
  };
  consistency: {
    semanticRoles: boolean; // Are semantic roles properly assigned?
    tonalSteps: boolean; // Are tonal steps consistent?
  };
  coverage: {
    chromaRange: number[]; // Min and max chroma
    hueVariety: number; // Hue diversity score
    toneRange: number[]; // Min and max tones used
  };
  overallScore: number; // 0-100
  recommendations: string[];
}

/**
 * Represents a theme color variable
 */
export interface ThemeVariable {
  hct: HCT; // HCT representation for matching
  name: string; // e.g., "--color-primary-60"
  role?: SemanticRole; // Semantic role if assigned
  tone: number; // Tone value (0-100)
  value: string; // e.g., "#1976d2"
}

/**
 * Collection of theme variables organized by role
 */
export interface ThemeVariables {
  custom?: Record<string, ThemeVariable[]>;
  error?: ThemeVariable[];
  neutral?: ThemeVariable[];
  primary?: ThemeVariable[];
  secondary?: ThemeVariable[];
  surface?: ThemeVariable[];
  tertiary?: ThemeVariable[];
}
