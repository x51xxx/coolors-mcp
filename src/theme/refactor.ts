/**
 * CSS Refactoring Utilities
 * Refactor CSS to use theme variables
 */

import type {
  ColorContext,
  ColorReplacement,
  MatchingOptions,
  RefactoringResult,
  RefactoringWarning,
  ThemeVariables,
} from "./types.js";

import { findClosestThemeColor } from "./matcher.js";

/**
 * CSS property to context mapping
 */
const PROPERTY_CONTEXT_MAP: Record<string, ColorContext> = {
  background: "background",
  "background-color": "background",
  border: "border",
  "border-bottom-color": "border",
  "border-color": "border",
  "border-left-color": "border",
  "border-right-color": "border",
  "border-top-color": "border",
  "box-shadow": "shadow",
  color: "text",
  fill: "decorative",
  outline: "border",
  "outline-color": "border",
  "stop-color": "decorative",
  stroke: "border",
  "text-shadow": "shadow",
};

/**
 * Generate a refactoring report
 */
export function generateRefactoringReport(result: RefactoringResult): string {
  const lines: string[] = [
    "# CSS Refactoring Report",
    "",
    "## Summary",
    `- Total colors found: ${result.statistics.totalColors}`,
    `- Colors replaced: ${result.statistics.replacedColors}`,
    `- Replacement rate: ${Math.round((result.statistics.replacedColors / result.statistics.totalColors) * 100)}%`,
    `- Average confidence: ${result.statistics.averageConfidence}%`,
    `- Accessibility issues: ${result.statistics.accessibilityIssues}`,
    "",
    "## Replacements",
  ];

  // Group replacements by confidence
  const highConfidence = result.replacements.filter((r) => r.confidence >= 90);
  const mediumConfidence = result.replacements.filter(
    (r) => r.confidence >= 70 && r.confidence < 90,
  );
  const lowConfidence = result.replacements.filter((r) => r.confidence < 70);

  if (highConfidence.length > 0) {
    lines.push("", "### High Confidence (≥90%)");
    for (const replacement of highConfidence) {
      lines.push(
        `- Line ${replacement.line}: ${replacement.originalColor} → ${replacement.cssVariable} (${replacement.confidence}%)`,
      );
    }
  }

  if (mediumConfidence.length > 0) {
    lines.push("", "### Medium Confidence (70-89%)");
    for (const replacement of mediumConfidence) {
      lines.push(
        `- Line ${replacement.line}: ${replacement.originalColor} → ${replacement.cssVariable} (${replacement.confidence}%)`,
      );
    }
  }

  if (lowConfidence.length > 0) {
    lines.push("", "### Low Confidence (<70%)");
    for (const replacement of lowConfidence) {
      lines.push(
        `- Line ${replacement.line}: ${replacement.originalColor} → ${replacement.cssVariable} (${replacement.confidence}%)`,
      );
    }
  }

  // Add warnings
  if (result.warnings.length > 0) {
    lines.push("", "## Warnings");

    const warningsByType = result.warnings.reduce(
      (acc, warning) => {
        if (!acc[warning.type]) acc[warning.type] = [];
        acc[warning.type].push(warning);
        return acc;
      },
      {} as Record<string, typeof result.warnings>,
    );

    for (const [type, warnings] of Object.entries(warningsByType)) {
      lines.push("", `### ${formatWarningType(type)}`);
      for (const warning of warnings) {
        lines.push(`- ${warning.message}`);
        if (warning.suggestion) {
          lines.push(`  Suggestion: ${warning.suggestion}`);
        }
      }
    }
  }

  return lines.join("\n");
}

/**
 * Refactor a single color value
 */
export function refactorColor(
  color: string,
  themeVariables: ThemeVariables,
  context?: ColorContext,
): {
  alternatives: string[];
  confidence: number;
  variable: null | string;
} {
  const match = findClosestThemeColor(color, themeVariables, {
    contextType: context,
  });

  if (!match) {
    return {
      alternatives: [],
      confidence: 0,
      variable: null,
    };
  }

  return {
    alternatives: match.alternatives.map((alt) => alt.variable),
    confidence: match.confidence,
    variable: match.variable,
  };
}

/**
 * Refactor CSS content to use theme variables
 */
export function refactorCss(
  css: string,
  themeVariables: ThemeVariables,
  options: {
    addComments?: boolean;
    minConfidence?: number;
    preserveOriginal?: boolean;
  } = {},
): RefactoringResult {
  const {
    addComments = true,
    minConfidence = 70,
    preserveOriginal = true,
  } = options;

  const replacements: ColorReplacement[] = [];
  const warnings: RefactoringWarning[] = [];
  let refactoredCss = css;
  let totalColors = 0;
  let replacedColors = 0;
  let totalConfidence = 0;
  let accessibilityIssues = 0;

  // Process CSS line by line for better tracking
  const lines = css.split("\n");
  const refactoredLines: string[] = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    let refactoredLine = line;

    // Detect CSS property
    const propertyMatch = line.match(/^\s*([a-z-]+):\s*/i);
    const property = propertyMatch ? propertyMatch[1].toLowerCase() : null;
    const context = property ? PROPERTY_CONTEXT_MAP[property] : undefined;

    // Find all color values in the line
    const colorMatches = findColorsInLine(line);

    for (const colorMatch of colorMatches) {
      totalColors++;
      const { color, end, start } = colorMatch;

      // Find matching theme variable
      const matchOptions: MatchingOptions = {
        contextType: context,
        weights: {
          accessibility:
            context === "text" || context === "background" ? 0.3 : 0.1,
          perceptual: 0.6,
          semantic: context ? 0.3 : 0.2,
        },
      };

      const match = findClosestThemeColor(color, themeVariables, matchOptions);

      if (match && match.confidence >= minConfidence) {
        replacedColors++;
        totalConfidence += match.confidence;

        // Create replacement
        const replacement: ColorReplacement = {
          column: start,
          confidence: match.confidence,
          context,
          cssVariable: match.variable,
          line: lineIndex + 1,
          originalColor: color,
          property: property || undefined,
        };
        replacements.push(replacement);

        // Check accessibility
        if (match.accessibilityInfo && !match.accessibilityInfo.meetsAA) {
          accessibilityIssues++;
          warnings.push({
            location: { column: start, line: lineIndex + 1 },
            message: `Color ${color} replaced with ${match.variable} may have accessibility issues`,
            type: "accessibility",
          });
        }

        // Apply replacement to line
        let replacementText = `var(${match.variable})`;

        if (preserveOriginal && addComments) {
          replacementText = `/* ${color} */ ${replacementText}`;
        }

        // Replace in line
        refactoredLine =
          refactoredLine.substring(0, start) +
          replacementText +
          refactoredLine.substring(end);
      } else if (match && match.confidence < minConfidence) {
        warnings.push({
          location: { column: start, line: lineIndex + 1 },
          message: `Low confidence match for ${color}: ${match.variable} (${match.confidence}%)`,
          suggestion: `Consider using ${match.variable} or defining a new theme variable`,
          type: "low-confidence",
        });
      } else {
        warnings.push({
          location: { column: start, line: lineIndex + 1 },
          message: `No suitable theme variable found for ${color}`,
          suggestion: "Consider adding this color to your theme",
          type: "no-match",
        });
      }
    }

    refactoredLines.push(refactoredLine);
  }

  // Add summary comment at the top if requested
  if (addComments && replacedColors > 0) {
    const summaryComment = `/* CSS Refactored with Theme Variables
 * Total colors found: ${totalColors}
 * Colors replaced: ${replacedColors}
 * Average confidence: ${Math.round(totalConfidence / replacedColors)}%
 * Warnings: ${warnings.length}
 */\n\n`;
    refactoredCss = summaryComment + refactoredLines.join("\n");
  } else {
    refactoredCss = refactoredLines.join("\n");
  }

  return {
    original: css,
    refactored: refactoredCss,
    replacements,
    statistics: {
      accessibilityIssues,
      averageConfidence:
        replacedColors > 0 ? Math.round(totalConfidence / replacedColors) : 0,
      replacedColors,
      totalColors,
    },
    warnings,
  };
}

/**
 * Find all color values in a line
 */
function findColorsInLine(
  line: string,
): Array<{ color: string; end: number; start: number }> {
  const colors: Array<{ color: string; end: number; start: number }> = [];

  // Check for hex colors
  let match;
  const hexRegex = /#[0-9a-fA-F]{3,8}/g;
  while ((match = hexRegex.exec(line)) !== null) {
    colors.push({
      color: match[0],
      end: match.index + match[0].length,
      start: match.index,
    });
  }

  // Check for rgb/rgba - be more precise with the regex
  const rgbRegex = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
  while ((match = rgbRegex.exec(line)) !== null) {
    colors.push({
      color: match[0],
      end: match.index + match[0].length,
      start: match.index,
    });
  }

  // Check for hsl/hsla
  const hslRegex = /hsla?\([^)]+\)/g;
  while ((match = hslRegex.exec(line)) !== null) {
    colors.push({
      color: match[0],
      end: match.index + match[0].length,
      start: match.index,
    });
  }

  // Sort by position to handle overlaps
  colors.sort((a, b) => a.start - b.start);

  // Remove duplicates and overlaps
  const uniqueColors: typeof colors = [];
  let lastEnd = -1;

  for (const color of colors) {
    if (color.start >= lastEnd) {
      uniqueColors.push(color);
      lastEnd = color.end;
    }
  }

  return uniqueColors;
}

/**
 * Format warning type for display
 */
function formatWarningType(type: string): string {
  const formats: Record<string, string> = {
    accessibility: "Accessibility Concerns",
    "low-confidence": "Low Confidence Matches",
    "no-match": "No Matches Found",
    "semantic-mismatch": "Semantic Mismatches",
  };
  return formats[type] || type;
}
