/**
 * Theme Module
 * Export all theme-related functionality
 */

// Matcher
export { findBatchMatches, findClosestThemeColor } from "./matcher.js";

// Parser
export {
  parseThemeVariables,
  parseThemeVariablesFromObject,
} from "./parser.js";

// Refactor
export {
  generateRefactoringReport,
  refactorColor,
  refactorCss,
} from "./refactor.js";

// Types
export type {
  ColorContext,
  ColorReplacement,
  MatchingOptions,
  RefactoringResult,
  RefactoringWarning,
  SemanticRole,
  ThemeMatch,
  ThemeQualityReport,
  ThemeVariable,
  ThemeVariables,
} from "./types.js";
