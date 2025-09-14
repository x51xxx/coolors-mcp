/**
 * Material Design Theme Generation
 * Core functionality for Material Design 3 color theme creation
 */

import { DislikeAnalyzer } from "./dislike/dislike-analyzer.js";
import { Hct } from "./hct/hct-class.js";
import {
  corePaletteFromRgb,
  parseColor,
  rgbToArgb,
  rgbToHex,
} from "./index.js";

export interface MaterialColorScheme {
  background: string;
  error: string;
  errorContainer: string;
  onBackground: string;
  onError: string;
  onErrorContainer: string;
  onPrimary: string;
  onPrimaryContainer: string;
  onSecondary: string;
  onSecondaryContainer: string;
  onSurface: string;
  onSurfaceVariant: string;
  onTertiary: string;
  onTertiaryContainer: string;
  outline: string;
  primary: string;
  primaryContainer: string;
  secondary: string;
  secondaryContainer: string;
  surface: string;
  surfaceVariant: string;
  tertiary: string;
  tertiaryContainer: string;
}

export interface MaterialTheme {
  customColors?: Record<string, unknown>;
  schemes: {
    dark: MaterialColorScheme;
    light: MaterialColorScheme;
  };
  sourceColor: string;
}

export interface MaterialThemeOptions {
  fixDislikedColors?: boolean;
  includeCustomColors?: boolean;
  isDark?: boolean;
}

/**
 * Generate a complete Material Design 3 theme from a source color
 */
export function generateMaterialTheme(
  sourceColor: string,
  options: MaterialThemeOptions = {},
): MaterialTheme {
  const { fixDislikedColors = true } = options;

  let source = parseColor(sourceColor);
  if (!source) {
    throw new Error(`Invalid color format: ${sourceColor}`);
  }

  // Fix source color if it's disliked
  if (fixDislikedColors) {
    const sourceHct = Hct.fromInt(rgbToArgb(source));
    if (DislikeAnalyzer.isDisliked(sourceHct)) {
      const fixedHct = DislikeAnalyzer.fixIfDisliked(sourceHct);
      const fixedArgb = fixedHct.toInt();
      source = {
        b: fixedArgb & 0xff,
        g: (fixedArgb >> 8) & 0xff,
        r: (fixedArgb >> 16) & 0xff,
      };
    }
  }

  const corePalette = corePaletteFromRgb(source);

  // Generate light theme colors
  const lightScheme: MaterialColorScheme = {
    background: rgbToHex(corePalette.neutral.tone(99)),
    error: rgbToHex(corePalette.error.tone(40)),
    errorContainer: rgbToHex(corePalette.error.tone(90)),
    onBackground: rgbToHex(corePalette.neutral.tone(10)),

    onError: rgbToHex(corePalette.error.tone(100)),
    onErrorContainer: rgbToHex(corePalette.error.tone(10)),
    onPrimary: rgbToHex(corePalette.primary.tone(100)),
    onPrimaryContainer: rgbToHex(corePalette.primary.tone(10)),

    onSecondary: rgbToHex(corePalette.secondary.tone(100)),
    onSecondaryContainer: rgbToHex(corePalette.secondary.tone(10)),
    onSurface: rgbToHex(corePalette.neutral.tone(10)),
    onSurfaceVariant: rgbToHex(corePalette.neutralVariant.tone(30)),

    onTertiary: rgbToHex(corePalette.tertiary.tone(100)),
    onTertiaryContainer: rgbToHex(corePalette.tertiary.tone(10)),
    outline: rgbToHex(corePalette.neutralVariant.tone(50)),
    primary: rgbToHex(corePalette.primary.tone(40)),

    primaryContainer: rgbToHex(corePalette.primary.tone(90)),
    secondary: rgbToHex(corePalette.secondary.tone(40)),
    secondaryContainer: rgbToHex(corePalette.secondary.tone(90)),
    surface: rgbToHex(corePalette.neutral.tone(99)),

    surfaceVariant: rgbToHex(corePalette.neutralVariant.tone(90)),
    tertiary: rgbToHex(corePalette.tertiary.tone(40)),
    tertiaryContainer: rgbToHex(corePalette.tertiary.tone(90)),
  };

  // Generate dark theme colors
  const darkScheme: MaterialColorScheme = {
    background: rgbToHex(corePalette.neutral.tone(10)),
    error: rgbToHex(corePalette.error.tone(80)),
    errorContainer: rgbToHex(corePalette.error.tone(30)),
    onBackground: rgbToHex(corePalette.neutral.tone(90)),

    onError: rgbToHex(corePalette.error.tone(20)),
    onErrorContainer: rgbToHex(corePalette.error.tone(90)),
    onPrimary: rgbToHex(corePalette.primary.tone(20)),
    onPrimaryContainer: rgbToHex(corePalette.primary.tone(90)),

    onSecondary: rgbToHex(corePalette.secondary.tone(20)),
    onSecondaryContainer: rgbToHex(corePalette.secondary.tone(90)),
    onSurface: rgbToHex(corePalette.neutral.tone(90)),
    onSurfaceVariant: rgbToHex(corePalette.neutralVariant.tone(80)),

    onTertiary: rgbToHex(corePalette.tertiary.tone(20)),
    onTertiaryContainer: rgbToHex(corePalette.tertiary.tone(90)),
    outline: rgbToHex(corePalette.neutralVariant.tone(60)),
    primary: rgbToHex(corePalette.primary.tone(80)),

    primaryContainer: rgbToHex(corePalette.primary.tone(30)),
    secondary: rgbToHex(corePalette.secondary.tone(80)),
    secondaryContainer: rgbToHex(corePalette.secondary.tone(30)),
    surface: rgbToHex(corePalette.neutral.tone(10)),

    surfaceVariant: rgbToHex(corePalette.neutralVariant.tone(30)),
    tertiary: rgbToHex(corePalette.tertiary.tone(80)),
    tertiaryContainer: rgbToHex(corePalette.tertiary.tone(30)),
  };

  return {
    schemes: {
      dark: darkScheme,
      light: lightScheme,
    },
    sourceColor,
  };
}
