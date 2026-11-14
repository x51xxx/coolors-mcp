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

import { getColorAlpha, parseColor } from "../color/conversions.js";
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
  let refactoredCss: string;
  let totalColors = 0;
  let replacedColors = 0;
  let totalConfidence = 0;
  let accessibilityIssues = 0;

  // Locate colors only inside real declaration values — never in selectors,
  // comments, strings, url(...) or custom-property definitions.
  const lineStarts = [0];
  for (let i = 0; i < css.length; i++) {
    if (css[i] === "\n") lineStarts.push(i + 1);
  }
  const locate = (index: number) => {
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= index) lo = mid;
      else hi = mid - 1;
    }
    return { column: index - lineStarts[lo], line: lo + 1 };
  };

  const edits: Array<{ end: number; start: number; text: string }> = [];

  for (const found of findColorsInCss(css)) {
    totalColors++;
    const { color, end, property, start } = found;
    const context = PROPERTY_CONTEXT_MAP[property];
    const { column, line } = locate(start);

    const alpha = getColorAlpha(color);
    if (alpha !== undefined && alpha < 1) {
      warnings.push({
        location: { column, line },
        message: `Translucent color ${color} (alpha ${Math.round(alpha * 100) / 100}) left unchanged — theme variables are opaque`,
        suggestion:
          "Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats",
        type: "no-match",
      });
      continue;
    }

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

      replacements.push({
        column,
        confidence: match.confidence,
        context,
        cssVariable: match.variable,
        line,
        originalColor: color,
        property,
      });

      if (match.accessibilityInfo && !match.accessibilityInfo.meetsAA) {
        accessibilityIssues++;
        warnings.push({
          location: { column, line },
          message: `Color ${color} replaced with ${match.variable} may have accessibility issues`,
          type: "accessibility",
        });
      }

      let replacementText = `var(${match.variable})`;
      if (preserveOriginal && addComments) {
        replacementText = `/* ${color} */ ${replacementText}`;
      }
      edits.push({ end, start, text: replacementText });
    } else if (match) {
      warnings.push({
        location: { column, line },
        message: `Low confidence match for ${color}: ${match.variable} (${match.confidence}%)`,
        suggestion: `Consider using ${match.variable} or defining a new theme variable`,
        type: "low-confidence",
      });
    } else {
      warnings.push({
        location: { column, line },
        message: `No suitable theme variable found for ${color}`,
        suggestion: "Consider adding this color to your theme",
        type: "no-match",
      });
    }
  }

  // Apply edits right-to-left so earlier offsets stay valid
  let body = css;
  for (const edit of [...edits].sort((x, y) => y.start - x.start)) {
    body = body.slice(0, edit.start) + edit.text + body.slice(edit.end);
  }

  // Add summary comment at the top if requested
  if (addComments && replacedColors > 0) {
    const summaryComment = `/* CSS Refactored with Theme Variables
 * Total colors found: ${totalColors}
 * Colors replaced: ${replacedColors}
 * Average confidence: ${Math.round(totalConfidence / replacedColors)}%
 * Warnings: ${warnings.length}
 */\n\n`;
    refactoredCss = summaryComment + body;
  } else {
    refactoredCss = body;
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
 * Find color literals inside CSS declaration values.
 *
 * Single pass over the stylesheet that skips comments and quoted strings,
 * ignores url(...) arguments, and only reports colors that sit in a
 * `property: value` declaration terminated by `;` or `}` (so `a:hover {` and
 * `#cafe {` selectors are never touched). Custom properties (`--x: ...`) are
 * skipped to avoid rewriting theme definitions into self-references.
 */
function findColorsInCss(
  css: string,
): Array<{ color: string; end: number; property: string; start: number }> {
  const masked = new Uint8Array(css.length); // 1 = comment / string / url()
  const values: Array<{ end: number; property: string; start: number }> = [];

  let segmentStart = 0; // start of the current "property: value" segment
  let colon = -1;
  let i = 0;
  const closeSegment = (terminator: string, at: number) => {
    if (colon >= 0 && terminator !== "{") {
      const property = css.slice(segmentStart, colon).trim().toLowerCase();
      if (/^-?-?[a-z_][\w-]*$/.test(property)) {
        values.push({ end: at, property, start: colon + 1 });
      }
    }
    segmentStart = at + 1;
    colon = -1;
  };

  while (i < css.length) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const close = css.indexOf("*/", i + 2);
      const stop = close === -1 ? css.length : close + 2;
      masked.fill(1, i, stop);
      // A comment before "prop:" is not part of the property name
      if (colon < 0) segmentStart = stop;
      i = stop;
      continue;
    }
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== ch) j += css[j] === "\\" ? 2 : 1;
      const stop = Math.min(css.length, j + 1);
      masked.fill(1, i, stop);
      i = stop;
      continue;
    }
    if (
      (ch === "u" || ch === "U") &&
      /^url\(/i.test(css.slice(i, i + 4)) &&
      !/[\w-]/.test(css[i - 1] ?? "")
    ) {
      let j = i + 4;
      let quote: null | string = null;
      while (j < css.length) {
        const c = css[j];
        if (quote) {
          if (c === quote) quote = null;
        } else if (c === '"' || c === "'") quote = c;
        else if (c === ")") break;
        j++;
      }
      const stop = Math.min(css.length, j + 1);
      masked.fill(1, i, stop);
      i = stop;
      continue;
    }
    if (ch === ":" && colon < 0) colon = i;
    else if (ch === ";" || ch === "{" || ch === "}") closeSegment(ch, i);
    i++;
  }
  closeSegment(";", css.length);

  const colorRegex =
    /#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![\w-])|\b(?:rgba?|hsla?|oklch|oklab)\([^()]*\)/gi;
  const results: Array<{
    color: string;
    end: number;
    property: string;
    start: number;
  }> = [];

  for (const value of values) {
    if (value.property.startsWith("--")) continue;
    colorRegex.lastIndex = value.start;
    let match: null | RegExpExecArray;
    while ((match = colorRegex.exec(css)) !== null) {
      const start = match.index;
      if (start >= value.end) break;
      const end = start + match[0].length;
      if (end > value.end || masked[start]) continue;
      if (!parseColor(match[0])) continue;
      results.push({ color: match[0], end, property: value.property, start });
    }
  }

  return results;
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
