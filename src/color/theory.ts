/**
 * Color Theory & Agent-Compensation Engine
 *
 * Bridges the gap between raw numeric hex codes and human visual perception:
 * - Perceptual color naming & profiling (gives agents "eyes")
 * - Accessible contrast solver in HCT space (eliminates blind guessing)
 * - Simultaneous contrast / chromostereopsis & CVD pair auditing
 * - Perceptual & artistic (RYB) color harmonies
 * - 60-30-10 Light & Dark UI palette generation with verified contrast
 * - CVD-safe categorical palette generation for charts & tags
 */

import type { HCT, HSL, OKLCH, RGB } from "./types.js";

import { apcaContrast, apcaLevel } from "./apca.js";
import {
  CVD_PREVALENCE,
  type CvdType,
  simulateCvd,
} from "./color-blindness.js";
import {
  argbToRgb,
  rgbToArgb,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "./conversions.js";
import { DislikeAnalyzer } from "./dislike/dislike-analyzer.js";
import { Hct } from "./hct/hct-class.js";
import { deltaE2000 } from "./metrics.js";
import { formatOklch, oklchToRgb, rgbToOklch } from "./oklch.js";
import { getContrastRatio, getLuminance } from "./utils.js";

export interface ColorProfile {
  bestText: {
    darkHex: string;
    darkLc: number;
    darkWcag: number;
    lightHex: string;
    lightLc: number;
    lightWcag: number;
    recommended: "dark" | "light";
    recommendedHex: string;
  };
  chromaTier:
    | "achromatic"
    | "balanced"
    | "electric"
    | "muted"
    | "soft"
    | "vibrant";
  dislikedFixHex: null | string;
  hct: HCT;
  hex: string;
  hsl: HSL;
  isDisliked: boolean;
  luminance: number;
  name: string;
  oklch: OKLCH;
  oklchCss: string;
  rgb: RGB;
  suggestedRoles: string[];
  temperature: "cool" | "neutral" | "warm";
  temperatureScore: number;
  valueTier:
    | "dark"
    | "light"
    | "medium-dark"
    | "medium-light"
    | "medium"
    | "near-black"
    | "near-white"
    | "very-dark"
    | "very-light";
  warnings: string[];
}

export interface ContrastSolveResult {
  achieved: boolean;
  adjustedRole: "background" | "foreground" | "none";
  apcaLcAfter: number;
  apcaLcBefore: number;
  backgroundAfter: RGB;
  backgroundBefore: RGB;
  deltaE: number;
  foregroundAfter: RGB;
  foregroundBefore: RGB;
  target: ContrastTarget;
  wcagAfter: number;
  wcagBefore: number;
}

export type ContrastTarget =
  | "aa-large"
  | "aa"
  | "aaa"
  | "apca-body"
  | "apca-content"
  | "apca-large"
  | "ui";

export type HarmonyScheme =
  | "analogous"
  | "complementary"
  | "compound"
  | "monochromatic"
  | "shades-and-tints"
  | "split-complementary"
  | "square"
  | "tetradic"
  | "triadic";

export type HarmonySpace = "hct" | "hsl" | "oklch" | "ryb";

export type NeutralStyle = "cool" | "pure" | "tinted" | "warm";

export interface PairAuditResult {
  apcaLc: number;
  apcaLevels: ReturnType<typeof apcaLevel>;
  chromostereopsisRisk: boolean;
  cvdIssues: {
    simulatedWcag: number;
    type: CvdType;
  }[];
  fixSuggestion: ContrastSolveResult | null;
  passesRole: boolean;
  warnings: string[];
  wcagRatio: number;
}

// --- Hue & RYB helpers -------------------------------------------------------

function hueDistance(a: number, b: number): number {
  const d = Math.abs(wrapHue(a) - wrapHue(b));
  return d > 180 ? 360 - d : d;
}

function rgbDeltaE(a: RGB, b: RGB): number {
  return deltaE2000(rgbToLab(a), rgbToLab(b));
}

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

/**
 * Piecewise linear mapping between perceptual/RGB hue and traditional RYB
 * (Red-Yellow-Blue) painter's wheel.
 * Control points (RGB deg -> RYB deg):
 *   0->0 (Red), 60->120 (Yellow), 120->180 (Green),
 *   180->210 (Cyan/Teal), 240->240 (Blue), 300->300 (Violet/Purple), 360->360
 */
const RGB_TO_RYB_POINTS: [number, number][] = [
  [0, 0],
  [35, 60], // orange -> RYB orange
  [60, 120], // yellow -> RYB yellow
  [120, 180], // green -> RYB green
  [210, 225],
  [240, 240], // blue -> RYB blue
  [285, 295],
  [360, 360],
];

export interface UiDesignSystem {
  brandHex: string;
  dark: UiModeTokens;
  harmony: HarmonyScheme;
  light: UiModeTokens;
  neutralStyle: NeutralStyle;
  verifiedChecks: number;
}

export interface UiModeTokens {
  accent: string;
  bg: string;
  border: string;
  borderStrong: string;
  error: string;
  errorSubtle: string;
  focusRing: string;
  info: string;
  infoSubtle: string;
  onAccent: string;
  onError: string;
  onErrorSubtle: string;
  onInfo: string;
  onInfoSubtle: string;
  onPrimary: string;
  onPrimarySubtle: string;
  onSecondary: string;
  onSuccess: string;
  onSuccessSubtle: string;
  onWarning: string;
  onWarningSubtle: string;
  primary: string;
  primaryActive: string;
  primaryHover: string;
  primarySubtle: string;
  secondary: string;
  success: string;
  successSubtle: string;
  surface: string;
  surfaceElevated: string;
  surfaceSubtle: string;
  textMuted: string;
  textPrimary: string;
  textSecondary: string;
  warning: string;
  warningSubtle: string;
}

export function auditColorPair(
  fg: RGB,
  bg: RGB,
  role: "body" | "large" | "ui" = "body",
): PairAuditResult {
  const wcagRatio = getContrastRatio(fg, bg);
  const apcaLc = apcaContrast(fg, bg);
  const apcaLevels = apcaLevel(apcaLc);

  const target: ContrastTarget =
    role === "body" ? "aa" : role === "large" ? "aa-large" : "ui";
  const passesRole = meetsTarget(fg, bg, target);

  const fgOklch = rgbToOklch(fg);
  const bgOklch = rgbToOklch(bg);
  const hDiff = hueDistance(fgOklch.h, bgOklch.h);

  // Chromostereopsis / optical vibration: two vivid, opposing hues (esp. red vs blue/cyan)
  const chromostereopsisRisk =
    fgOklch.c > 0.14 &&
    bgOklch.c > 0.14 &&
    hDiff >= 95 &&
    Math.abs(fgOklch.l - bgOklch.l) < 0.35;

  const cvdTypes: CvdType[] = ["protanopia", "deuteranopia", "tritanopia"];
  const minCvdWcag = role === "body" ? 3.5 : 2.5;
  const cvdIssues: PairAuditResult["cvdIssues"] = [];

  for (const type of cvdTypes) {
    const simFg = simulateCvd(fg, type);
    const simBg = simulateCvd(bg, type);
    const simWcag = getContrastRatio(simFg, simBg);
    if (simWcag < minCvdWcag) {
      cvdIssues.push({ simulatedWcag: simWcag, type });
    }
  }

  const warnings: string[] = [];
  if (!passesRole) {
    const needed = role === "body" ? "4.5:1" : "3.0:1";
    warnings.push(
      `Fails WCAG AA for ${role} (${wcagRatio.toFixed(2)}:1 < ${needed}).`,
    );
  }
  if (role === "body" && !apcaLevels.content) {
    warnings.push(
      `Low APCA readability (|Lc|=${Math.abs(apcaLc).toFixed(1)}, aim for ≥60 content / ≥75 body).`,
    );
  }
  if (chromostereopsisRisk) {
    warnings.push(
      "Simultaneous contrast / chromostereopsis risk: high-chroma opposing hues vibrate optically; soften background or foreground chroma.",
    );
  }
  if (cvdIssues.length > 0) {
    const worst = cvdIssues
      .map(
        (i) =>
          `${i.type} (~${CVD_PREVALENCE[i.type]}%): ${i.simulatedWcag.toFixed(2)}:1`,
      )
      .join(", ");
    warnings.push(`Contrast drops under color-blindness (${worst}).`);
  }

  const fixSuggestion = passesRole
    ? null
    : solveAccessibleContrast({
        adjust: "foreground",
        background: bg,
        foreground: fg,
        target,
      });

  return {
    apcaLc,
    apcaLevels,
    chromostereopsisRisk,
    cvdIssues,
    fixSuggestion,
    passesRole,
    warnings,
    wcagRatio,
  };
}

/**
 * Generate a full 60-30-10 UI Design System (Light + Dark) from a brand color,
 * mathematically verifying contrast across every text/surface and on* token.
 */
export function designUiPalette(
  brand: RGB,
  options: {
    harmony?: HarmonyScheme;
    neutralStyle?: NeutralStyle;
  } = {},
): UiDesignSystem {
  const { harmony = "analogous", neutralStyle = "tinted" } = options;

  const cleanBrand = avoidDislikedRgb(brand);
  const brandHct = Hct.fromInt(rgbToArgb(cleanBrand));

  const neutralHue =
    neutralStyle === "cool" ? 235 : neutralStyle === "warm" ? 50 : brandHct.hue;
  const neutralChroma =
    neutralStyle === "pure"
      ? 0
      : neutralStyle === "tinted"
        ? Math.min(8, Math.max(3, brandHct.chroma * 0.12))
        : 6;

  const secondaryHue =
    harmony === "complementary"
      ? wrapHue(brandHct.hue + 180)
      : harmony === "triadic"
        ? wrapHue(brandHct.hue + 120)
        : harmony === "square"
          ? wrapHue(brandHct.hue + 90)
          : harmony === "monochromatic" || harmony === "shades-and-tints"
            ? brandHct.hue
            : wrapHue(brandHct.hue - 30);

  const accentHue =
    harmony === "split-complementary"
      ? wrapHue(brandHct.hue + 150)
      : harmony === "triadic"
        ? wrapHue(brandHct.hue + 240)
        : harmony === "complementary"
          ? wrapHue(brandHct.hue + 180)
          : harmony === "monochromatic" || harmony === "shades-and-tints"
            ? brandHct.hue
            : wrapHue(brandHct.hue + 60);

  const light = buildModeTokens(
    brandHct,
    neutralHue,
    neutralChroma,
    secondaryHue,
    accentHue,
    false,
  );
  const dark = buildModeTokens(
    brandHct,
    neutralHue,
    neutralChroma,
    secondaryHue,
    accentHue,
    true,
  );

  return {
    brandHex: rgbToHex(cleanBrand),
    dark: dark.tokens,
    harmony,
    light: light.tokens,
    neutralStyle,
    verifiedChecks: light.checks + dark.checks,
  };
}

/**
 * Generate N perceptually distinct, equal-weight categorical colors optimized
 * to stay distinguishable under normal vision AND protanopia / deuteranopia / tritanopia.
 */
export function generateCategoricalPalette(
  count: number,
  options: {
    background?: "dark" | "light";
    seedHue?: number;
  } = {},
): { colors: RGB[]; minCvdDeltaE: number; minNormalDeltaE: number } {
  const { background = "light", seedHue = 220 } = options;

  // Alternate lightness slightly on odd/even indices so even CVD-collapsed hues separate by tone
  const baseL = background === "dark" ? 0.74 : 0.56;
  const altDelta = background === "dark" ? 0.08 : -0.09;

  // Golden angle (~137.508°) gives optimal dispersion without harmonic clustering;
  // greedy minimax selection over fine hue/tone candidates maximizes worst-case CVD ΔE.
  const candidates: RGB[] = [];
  for (let i = 0; i < 36; i++) {
    const h = wrapHue(seedHue + i * 10);
    for (const lOff of [0, altDelta]) {
      const rgb = avoidDislikedRgb(
        oklchToRgb({
          c: 0.145,
          h,
          l: baseL + lOff,
        }),
      );
      candidates.push(rgb);
    }
  }

  const chosen: RGB[] = [
    avoidDislikedRgb(oklchToRgb({ c: 0.15, h: wrapHue(seedHue), l: baseL })),
  ];

  const effectiveDistance = (a: RGB, b: RGB): number => {
    let minD = rgbDeltaE(a, b);
    for (const cvd of [
      "deuteranopia",
      "protanopia",
      "tritanopia",
    ] as CvdType[]) {
      const simD = rgbDeltaE(simulateCvd(a, cvd), simulateCvd(b, cvd));
      if (simD < minD) minD = simD;
    }
    return minD;
  };

  while (chosen.length < count) {
    let bestCand = candidates[0];
    let bestScore = -1;
    for (const cand of candidates) {
      let minDist = Infinity;
      for (const existing of chosen) {
        const d = effectiveDistance(cand, existing);
        if (d < minDist) minDist = d;
      }
      if (minDist > bestScore) {
        bestScore = minDist;
        bestCand = cand;
      }
    }
    chosen.push(bestCand);
  }

  let minNormalDeltaE = Infinity;
  let minCvdDeltaE = Infinity;
  for (let i = 0; i < chosen.length; i++) {
    for (let j = i + 1; j < chosen.length; j++) {
      const d = rgbDeltaE(chosen[i], chosen[j]);
      if (d < minNormalDeltaE) minNormalDeltaE = d;
      for (const cvd of [
        "deuteranopia",
        "protanopia",
        "tritanopia",
      ] as CvdType[]) {
        const simD = rgbDeltaE(
          simulateCvd(chosen[i], cvd),
          simulateCvd(chosen[j], cvd),
        );
        if (simD < minCvdDeltaE) minCvdDeltaE = simD;
      }
    }
  }

  return {
    colors: chosen,
    minCvdDeltaE: chosen.length > 1 ? minCvdDeltaE : 100,
    minNormalDeltaE: chosen.length > 1 ? minNormalDeltaE : 100,
  };
}

// --- Color Profiler & Naming (The Agent's "Eyes") ----------------------------

export function generateHarmonyPalette(
  base: RGB,
  options: {
    allowDisliked?: boolean;
    count?: number;
    scheme?: HarmonyScheme;
    space?: HarmonySpace;
  } = {},
): { colors: RGB[]; notes: string[] } {
  const {
    allowDisliked = false,
    count = 5,
    scheme = "analogous",
    space = "hct",
  } = options;

  const notes: string[] = [];
  const results: RGB[] = [];

  if (scheme === "monochromatic" || scheme === "shades-and-tints") {
    const baseOklch = rgbToOklch(base);
    const baseHct = Hct.fromInt(rgbToArgb(base));
    const baseHsl = rgbToHsl(base);
    const isShadesTints = scheme === "shades-and-tints";

    for (let i = 0; i < count; i++) {
      const frac = count === 1 ? 0.5 : i / (count - 1);
      // Span perceptual lightness from light tint (92) down to deep shade (14)
      const tone = 92 - frac * 78;
      // Bezold-Brücke / artistic shading: slightly cool shadows toward indigo, warm highlights toward yellow
      const hueShift = isShadesTints ? (0.5 - frac) * 14 : 0;
      const edge = Math.abs(50 - tone) / 50;

      let rgb: RGB;
      if (space === "hsl") {
        const l = 92 - frac * 78;
        const h = wrapHue(baseHsl.h + hueShift);
        const s = Math.max(8, baseHsl.s * (1 - 0.25 * edge));
        const c = (s / 100) * (1 - Math.abs(2 * (l / 100) - 1));
        const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
        const m = l / 100 - c / 2;
        const [r1, g1, b1] =
          h < 60
            ? [c, x, 0]
            : h < 120
              ? [x, c, 0]
              : h < 180
                ? [0, c, x]
                : h < 240
                  ? [0, x, c]
                  : h < 300
                    ? [x, 0, c]
                    : [c, 0, x];
        rgb = {
          b: Math.round((b1 + m) * 255),
          g: Math.round((g1 + m) * 255),
          r: Math.round((r1 + m) * 255),
        };
      } else if (space === "oklch") {
        const l = 0.94 - frac * 0.68;
        const chroma = baseOklch.c * (1 - 0.38 * edge);
        rgb = oklchToRgb({
          c: chroma,
          h: wrapHue(baseOklch.h + hueShift),
          l,
        });
      } else {
        const chroma = baseHct.chroma * (1 - 0.35 * edge);
        rgb = rgbFromHct(baseHct.hue + hueShift, chroma, tone);
      }

      results.push(allowDisliked ? rgb : avoidDislikedRgb(rgb));
    }

    if (isShadesTints) {
      notes.push(
        "Applied subtle warm-highlight / cool-shadow hue shift and edge chroma taper for natural shading.",
      );
    }
    return { colors: results, notes };
  }

  const angles = getHarmonyAngles(scheme);
  const baseHct = Hct.fromInt(rgbToArgb(base));
  const baseOklch = rgbToOklch(base);
  const baseHsl = rgbToHsl(base);

  const rotateColor = (
    angle: number,
    toneOffset: number,
    chromaScale: number,
  ): RGB => {
    if (space === "hsl" || space === "ryb") {
      const startHue = space === "ryb" ? rgbHueToRyb(baseHsl.h) : baseHsl.h;
      const rotated = wrapHue(startHue + angle);
      const finalHue = space === "ryb" ? rybHueToRgb(rotated) : rotated;
      const l = Math.max(12, Math.min(90, baseHsl.l + toneOffset));
      const s = Math.max(8, Math.min(96, baseHsl.s * chromaScale));
      // Convert via OKLCH? Wait: keep HSL wheel when explicitly requested
      const c = (s / 100) * (1 - Math.abs(2 * (l / 100) - 1));
      const x = c * (1 - Math.abs(((finalHue / 60) % 2) - 1));
      const m = l / 100 - c / 2;
      const [r1, g1, b1] =
        finalHue < 60
          ? [c, x, 0]
          : finalHue < 120
            ? [x, c, 0]
            : finalHue < 180
              ? [0, c, x]
              : finalHue < 240
                ? [0, x, c]
                : finalHue < 300
                  ? [x, 0, c]
                  : [c, 0, x];
      return {
        b: Math.round((b1 + m) * 255),
        g: Math.round((g1 + m) * 255),
        r: Math.round((r1 + m) * 255),
      };
    }

    if (space === "oklch") {
      const l = Math.max(0.2, Math.min(0.92, baseOklch.l + toneOffset / 100));
      const c = Math.max(0.02, baseOklch.c * chromaScale);
      return oklchToRgb({ c, h: wrapHue(baseOklch.h + angle), l });
    }

    // Perceptual HCT default: balance tones for dark/mid/light visual rhythm
    const tone = Math.max(16, Math.min(90, baseHct.tone + toneOffset));
    const chroma = Math.max(12, baseHct.chroma * chromaScale);
    return rgbFromHct(baseHct.hue + angle, chroma, tone);
  };

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      results.push(base);
      continue;
    }
    const angleIdx = i % angles.length;
    const cycle = Math.floor(i / angles.length);
    const angle = angles[angleIdx];
    // Alternate tonal elevation across cycles so swatches separate cleanly
    const toneOffset =
      cycle === 0
        ? angle === 0
          ? 0
          : i % 2 === 1
            ? 8
            : -8
        : cycle % 2 === 1
          ? 22
          : -22;
    const chromaScale = cycle === 0 ? 1 : 0.78;
    const candidate = rotateColor(angle, toneOffset, chromaScale);
    results.push(allowDisliked ? candidate : avoidDislikedRgb(candidate));
  }

  if (space === "ryb") {
    notes.push(
      "Computed on the traditional artistic RYB color wheel (red↔green, blue↔orange, yellow↔violet).",
    );
  } else if (space === "hct" || space === "oklch") {
    notes.push(
      `Balanced perceptual lightness and chroma in ${space.toUpperCase()} space so harmonies maintain even visual weight.`,
    );
  }

  return { colors: results, notes };
}

/**
 * Generate a rich perceptual profile for a color so an AI agent can "see"
 * its appearance, temperature, pitfalls, and best UI applications.
 */
export function profileColor(rgb: RGB): ColorProfile {
  const hex = rgbToHex(rgb);
  const hsl = rgbToHsl(rgb);
  const oklch = rgbToOklch(rgb);
  const hctRaw = Hct.fromInt(rgbToArgb(rgb));
  const hct: HCT = {
    c: hctRaw.chroma,
    h: hctRaw.hue,
    t: hctRaw.tone,
  };
  const luminance = getLuminance(rgb);
  const valueTier = classifyValueTier(hct.t);
  const chromaTier = classifyChromaTier(oklch.c);
  const { score: temperatureScore, temperature } = classifyTemperature(oklch);
  const hueLabel = baseHueName(oklch, hct.t);
  const name = buildHumanName(valueTier, chromaTier, hueLabel, oklch.c < 0.012);

  const isDisliked = DislikeAnalyzer.isDisliked(hctRaw);
  const dislikedFixHex = isDisliked
    ? rgbToHex(argbToRgb(DislikeAnalyzer.fixIfDisliked(hctRaw).toInt()))
    : null;

  const white: RGB = { b: 255, g: 255, r: 255 };
  const darkInk: RGB = { b: 23, g: 15, r: 15 }; // #0f0f17 deep neutral ink
  const lightWcag = getContrastRatio(white, rgb);
  const darkWcag = getContrastRatio(darkInk, rgb);
  const lightLc = Math.abs(apcaContrast(white, rgb));
  const darkLc = Math.abs(apcaContrast(darkInk, rgb));

  const recommended: "dark" | "light" = lightLc >= darkLc ? "light" : "dark";

  const warnings: string[] = [];
  if (isDisliked) {
    warnings.push(
      `Universally disliked "bile zone" dark yellow-green; consider lightening to ${dislikedFixHex}.`,
    );
  }
  if (oklch.c > 0.24) {
    warnings.push(
      "Very high chroma (neon/electric) — can cause eye strain on large surfaces or dark backgrounds.",
    );
  }
  if (hct.t < 4 && oklch.c < 0.02) {
    warnings.push(
      "Near-pure black — can cause OLED smearing and harsh halation with white text; prefer tone 6–12.",
    );
  }
  if (hct.t > 98 && oklch.c < 0.02) {
    warnings.push(
      "Pure/near-pure white — leave headroom or use subtle off-white (tone 96–99) for layered surfaces.",
    );
  }

  const suggestedRoles: string[] = [];
  if (hct.t >= 90) suggestedRoles.push("light-mode-surface", "light-canvas");
  else if (hct.t >= 75)
    suggestedRoles.push("subtle-badge-bg", "dark-mode-primary-text");
  else if (hct.t >= 55 && oklch.c < 0.06)
    suggestedRoles.push("subtle-border", "placeholder-or-muted-icon");
  else if (hct.t >= 35 && hct.t <= 65 && oklch.c >= 0.09)
    suggestedRoles.push(
      "primary-cta-on-light",
      "accent-highlight",
      "focus-ring",
    );
  else if (hct.t <= 35 && lightWcag >= 4.5)
    suggestedRoles.push("body-text-on-light", "high-contrast-accent");
  if (hct.t <= 22) suggestedRoles.push("dark-mode-surface", "dark-canvas");
  if (suggestedRoles.length === 0) suggestedRoles.push("supporting-ui-element");

  return {
    bestText: {
      darkHex: rgbToHex(darkInk),
      darkLc,
      darkWcag,
      lightHex: "#ffffff",
      lightLc,
      lightWcag,
      recommended,
      recommendedHex: recommended === "light" ? "#ffffff" : rgbToHex(darkInk),
    },
    chromaTier,
    dislikedFixHex,
    hct,
    hex,
    hsl,
    isDisliked,
    luminance,
    name,
    oklch,
    oklchCss: formatOklch(oklch),
    rgb,
    suggestedRoles,
    temperature,
    temperatureScore,
    valueTier,
    warnings,
  };
}

export function rgbHueToRyb(hue: number): number {
  return piecewiseMap(hue, RGB_TO_RYB_POINTS, false);
}

export function rybHueToRgb(rybHue: number): number {
  return piecewiseMap(rybHue, RGB_TO_RYB_POINTS, true);
}

/**
 * Solve for the perceptually closest accessible color pair in HCT space.
 * Preserves hue and chroma while adjusting HCT tone minimally to satisfy
 * WCAG 2.x or APCA targets.
 */
export function solveAccessibleContrast(options: {
  adjust?: "auto" | "background" | "foreground";
  background: RGB;
  foreground: RGB;
  prefer?: "darker" | "lighter" | "minimal";
  target?: ContrastTarget;
}): ContrastSolveResult {
  const {
    adjust = "auto",
    background,
    foreground,
    prefer = "minimal",
    target = "aa",
  } = options;

  const wcagBefore = getContrastRatio(foreground, background);
  const apcaLcBefore = apcaContrast(foreground, background);

  if (meetsTarget(foreground, background, target)) {
    return {
      achieved: true,
      adjustedRole: "none",
      apcaLcAfter: apcaLcBefore,
      apcaLcBefore,
      backgroundAfter: background,
      backgroundBefore: background,
      deltaE: 0,
      foregroundAfter: foreground,
      foregroundBefore: foreground,
      target,
      wcagAfter: wcagBefore,
      wcagBefore,
    };
  }

  interface Candidate {
    bg: RGB;
    delta: number;
    fg: RGB;
    role: "background" | "foreground";
  }
  const candidates: Candidate[] = [];

  const directions: ("darker" | "lighter")[] =
    prefer === "minimal" ? ["darker", "lighter"] : [prefer];

  if (adjust === "foreground" || adjust === "auto") {
    for (const dir of directions) {
      const solved = searchToneForContrast(
        foreground,
        background,
        true,
        target,
        dir,
      );
      if (solved) {
        candidates.push({
          bg: background,
          delta: rgbDeltaE(foreground, solved),
          fg: solved,
          role: "foreground",
        });
      }
    }
  }

  if (adjust === "background" || adjust === "auto") {
    for (const dir of directions) {
      const solved = searchToneForContrast(
        background,
        foreground,
        false,
        target,
        dir,
      );
      if (solved) {
        candidates.push({
          bg: solved,
          delta: rgbDeltaE(background, solved),
          fg: foreground,
          role: "background",
        });
      }
    }
  }

  // Fallback if prefer="darker"/"lighter" had no solution in that single direction
  if (candidates.length === 0 && prefer !== "minimal") {
    const fallbackDirs: ("darker" | "lighter")[] = ["darker", "lighter"];
    for (const dir of fallbackDirs) {
      if (adjust === "foreground" || adjust === "auto") {
        const solved = searchToneForContrast(
          foreground,
          background,
          true,
          target,
          dir,
        );
        if (solved) {
          candidates.push({
            bg: background,
            delta: rgbDeltaE(foreground, solved),
            fg: solved,
            role: "foreground",
          });
        }
      }
      if (adjust === "background" || adjust === "auto") {
        const solved = searchToneForContrast(
          background,
          foreground,
          false,
          target,
          dir,
        );
        if (solved) {
          candidates.push({
            bg: solved,
            delta: rgbDeltaE(background, solved),
            fg: foreground,
            role: "background",
          });
        }
      }
    }
  }

  if (candidates.length === 0) {
    // Extreme fallback: pure black or white on whichever role is allowed
    const black: RGB = { b: 0, g: 0, r: 0 };
    const white: RGB = { b: 255, g: 255, r: 255 };
    const fgBlack = getContrastRatio(black, background);
    const fgWhite = getContrastRatio(white, background);
    const bestFg = fgBlack >= fgWhite ? black : white;
    const role: "background" | "foreground" =
      adjust === "background" ? "background" : "foreground";
    const fgAfter = role === "foreground" ? bestFg : foreground;
    const bgAfter =
      role === "background"
        ? getContrastRatio(foreground, white) >=
          getContrastRatio(foreground, black)
          ? white
          : black
        : background;
    return {
      achieved: meetsTarget(fgAfter, bgAfter, target),
      adjustedRole: role,
      apcaLcAfter: apcaContrast(fgAfter, bgAfter),
      apcaLcBefore,
      backgroundAfter: bgAfter,
      backgroundBefore: background,
      deltaE:
        role === "foreground"
          ? rgbDeltaE(foreground, fgAfter)
          : rgbDeltaE(background, bgAfter),
      foregroundAfter: fgAfter,
      foregroundBefore: foreground,
      target,
      wcagAfter: getContrastRatio(fgAfter, bgAfter),
      wcagBefore,
    };
  }

  candidates.sort((a, b) => a.delta - b.delta);
  const winner = candidates[0];

  return {
    achieved: true,
    adjustedRole: winner.role,
    apcaLcAfter: apcaContrast(winner.fg, winner.bg),
    apcaLcBefore,
    backgroundAfter: winner.bg,
    backgroundBefore: background,
    deltaE: winner.delta,
    foregroundAfter: winner.fg,
    foregroundBefore: foreground,
    target,
    wcagAfter: getContrastRatio(winner.fg, winner.bg),
    wcagBefore,
  };
}

function avoidDislikedRgb(rgb: RGB): RGB {
  const hct = Hct.fromInt(rgbToArgb(rgb));
  if (!DislikeAnalyzer.isDisliked(hct)) return rgb;
  return argbToRgb(DislikeAnalyzer.fixIfDisliked(hct).toInt());
}

// --- Accessible Contrast Solver ----------------------------------------------

function baseHueName(oklch: OKLCH, tone: number): string {
  if (oklch.c < 0.012) {
    if (tone < 8) return "black";
    if (tone < 25) return "charcoal";
    if (tone < 45) return "dark gray";
    if (tone < 65) return "gray";
    if (tone < 85) return "silver-gray";
    if (tone < 96) return "off-white";
    return "white";
  }

  const h = oklch.h;
  const muted = oklch.c < 0.07;

  // Contextual color names where lightness/chroma fundamentally changes perception
  if (h >= 20 && h < 65 && tone < 42 && oklch.c < 0.14) return "brown";
  if (h >= 65 && h < 105 && tone < 48 && oklch.c < 0.13) return "olive";
  if (h >= 15 && h < 45 && tone >= 65 && oklch.c < 0.16) return "peach";
  if (h >= 340 || h < 15) {
    if (tone >= 72 && oklch.c < 0.15) return "blush pink";
    return muted ? "dusty rose" : "red";
  }
  if (h < 35) return muted ? "terracotta" : "coral-red";
  if (h < 58) return muted ? "ochre" : "orange";
  if (h < 82) return muted ? "sand-gold" : "amber";
  if (h < 110) return muted ? "khaki" : "yellow-green";
  if (h < 145) return muted ? "sage" : "green";
  if (h < 172) return muted ? "seafoam" : "emerald";
  if (h < 198) return muted ? "slate-teal" : "teal";
  if (h < 222) return muted ? "steel-cyan" : "cyan";
  if (h < 250) return muted ? "slate-blue" : "sky-blue";
  if (h < 272) return muted ? "slate-indigo" : "blue";
  if (h < 292) return muted ? "muted indigo" : "indigo";
  if (h < 318) return muted ? "plum" : "violet";
  if (h < 342) return muted ? "mauve" : "magenta";
  return "rose";
}

function buildHumanName(
  valueTier: ColorProfile["valueTier"],
  chromaTier: ColorProfile["chromaTier"],
  hueName: string,
  isAchromatic: boolean,
): string {
  if (isAchromatic) return hueName;
  const valueWord =
    valueTier === "medium" ? "" : valueTier.replace("-", " ") + " ";
  const chromaWord =
    chromaTier === "balanced" || chromaTier === "achromatic"
      ? ""
      : chromaTier + " ";
  return `${valueWord}${chromaWord}${hueName}`.trim().replace(/\s+/g, " ");
}

function buildModeTokens(
  brandHct: Hct,
  neutralHue: number,
  neutralChroma: number,
  secondaryHue: number,
  accentHue: number,
  isDark: boolean,
): { checks: number; tokens: UiModeTokens } {
  let checks = 0;
  const verifyText = (
    fg: RGB,
    bg: RGB,
    target: ContrastTarget = "aa",
  ): string => {
    checks++;
    return ensureAccessiblePair(fg, bg, target, "foreground").fg;
  };

  // 60% Neutrals & Surfaces (dark mode elevates surfaces upward in tone: 6 -> 10 -> 14 -> 18)
  const bgRgb = rgbFromHct(neutralHue, neutralChroma, isDark ? 8 : 98.5);
  const surfaceRgb = rgbFromHct(neutralHue, neutralChroma, isDark ? 12 : 100);
  const surfaceElevatedRgb = rgbFromHct(
    neutralHue,
    neutralChroma,
    isDark ? 16 : 99.5,
  );
  const surfaceSubtleRgb = rgbFromHct(
    neutralHue,
    neutralChroma * 1.15,
    isDark ? 19 : 95,
  );

  // Borders: subtle separation, higher contrast for borderStrong
  const borderRgb = rgbFromHct(
    neutralHue,
    neutralChroma * 1.2,
    isDark ? 26 : 86,
  );
  const borderStrongRgb = ensureAccessiblePair(
    rgbFromHct(neutralHue, neutralChroma * 1.2, isDark ? 48 : 56),
    surfaceRgb,
    "ui",
    "foreground",
  ).fg;
  checks++;

  // Text hierarchy on bg & surface
  const textPrimaryHex = verifyText(
    rgbFromHct(neutralHue, neutralChroma * 0.8, isDark ? 94 : 12),
    surfaceRgb,
    "aaa",
  );
  const textSecondaryHex = verifyText(
    rgbFromHct(neutralHue, neutralChroma * 0.9, isDark ? 76 : 34),
    surfaceRgb,
    "aa",
  );
  const textMutedHex = verifyText(
    rgbFromHct(neutralHue, neutralChroma * 0.9, isDark ? 62 : 46),
    surfaceRgb,
    "aa",
  );

  // 10% Brand Primary CTA & interactive states
  // Dark mode softens chroma slightly to avoid halation & lifts tone to 72-80
  const primaryChroma = isDark
    ? Math.max(28, Math.min(brandHct.chroma * 0.82, 68))
    : Math.max(32, Math.min(brandHct.chroma, 86));
  const primaryTone = isDark ? 74 : Math.max(34, Math.min(48, brandHct.tone));
  const primaryRgb = avoidDislikedRgb(
    rgbFromHct(brandHct.hue, primaryChroma, primaryTone),
  );
  const primaryHoverRgb = avoidDislikedRgb(
    rgbFromHct(
      brandHct.hue,
      primaryChroma,
      isDark ? Math.min(84, primaryTone + 7) : Math.max(24, primaryTone - 8),
    ),
  );
  const primaryActiveRgb = avoidDislikedRgb(
    rgbFromHct(
      brandHct.hue,
      primaryChroma,
      isDark ? Math.min(90, primaryTone + 13) : Math.max(18, primaryTone - 15),
    ),
  );
  const onPrimaryRgb = pickInkOn(primaryRgb);
  checks++;

  const primarySubtleRgb = avoidDislikedRgb(
    rgbFromHct(
      brandHct.hue,
      Math.min(primaryChroma * 0.45, 28),
      isDark ? 21 : 93,
    ),
  );
  const onPrimarySubtleHex = verifyText(
    rgbFromHct(brandHct.hue, primaryChroma * 0.85, isDark ? 88 : 26),
    primarySubtleRgb,
    "aa",
  );

  // 30% Secondary & Accent
  const secondaryChroma = Math.max(18, Math.min(primaryChroma * 0.6, 46));
  const secondaryRgb = avoidDislikedRgb(
    rgbFromHct(secondaryHue, secondaryChroma, isDark ? 70 : 42),
  );
  const onSecondaryRgb = pickInkOn(secondaryRgb);
  checks++;

  const accentRgb = avoidDislikedRgb(
    rgbFromHct(accentHue, Math.max(28, primaryChroma * 0.9), isDark ? 74 : 44),
  );
  const onAccentRgb = pickInkOn(accentRgb);
  checks++;

  const focusRingHex = verifyText(
    rgbFromHct(brandHct.hue, Math.max(40, primaryChroma), isDark ? 76 : 48),
    bgRgb,
    "ui",
  );

  // Brand-harmonized semantic statuses (with CVD-safe hue separation: green 148°, amber 78°, red 24°, blue 245°)
  const buildStatus = (hue: number, minC: number) => {
    const c = Math.max(minC, Math.min(primaryChroma, 74));
    const baseRgb = avoidDislikedRgb(rgbFromHct(hue, c, isDark ? 74 : 40));
    const onBaseRgb = pickInkOn(baseRgb);
    const subtleRgb = avoidDislikedRgb(
      rgbFromHct(hue, Math.min(c * 0.42, 26), isDark ? 20 : 94),
    );
    const onSubtleHex = verifyText(
      rgbFromHct(hue, c * 0.85, isDark ? 88 : 26),
      subtleRgb,
      "aa",
    );
    checks += 2;
    return {
      base: rgbToHex(baseRgb),
      onBase: rgbToHex(onBaseRgb),
      onSubtle: onSubtleHex,
      subtle: rgbToHex(subtleRgb),
    };
  };

  const success = buildStatus(148, 34);
  const warning = buildStatus(78, 42);
  const error = buildStatus(24, 44);
  const info = buildStatus(245, 34);

  return {
    checks,
    tokens: {
      accent: rgbToHex(accentRgb),
      bg: rgbToHex(bgRgb),
      border: rgbToHex(borderRgb),
      borderStrong: borderStrongRgb,
      error: error.base,
      errorSubtle: error.subtle,
      focusRing: focusRingHex,
      info: info.base,
      infoSubtle: info.subtle,
      onAccent: rgbToHex(onAccentRgb),
      onError: error.onBase,
      onErrorSubtle: error.onSubtle,
      onInfo: info.onBase,
      onInfoSubtle: info.onSubtle,
      onPrimary: rgbToHex(onPrimaryRgb),
      onPrimarySubtle: onPrimarySubtleHex,
      onSecondary: rgbToHex(onSecondaryRgb),
      onSuccess: success.onBase,
      onSuccessSubtle: success.onSubtle,
      onWarning: warning.onBase,
      onWarningSubtle: warning.onSubtle,
      primary: rgbToHex(primaryRgb),
      primaryActive: rgbToHex(primaryActiveRgb),
      primaryHover: rgbToHex(primaryHoverRgb),
      primarySubtle: rgbToHex(primarySubtleRgb),
      secondary: rgbToHex(secondaryRgb),
      success: success.base,
      successSubtle: success.subtle,
      surface: rgbToHex(surfaceRgb),
      surfaceElevated: rgbToHex(surfaceElevatedRgb),
      surfaceSubtle: rgbToHex(surfaceSubtleRgb),
      textMuted: textMutedHex,
      textPrimary: textPrimaryHex,
      textSecondary: textSecondaryHex,
      warning: warning.base,
      warningSubtle: warning.subtle,
    },
  };
}

// --- Pair Color-Theory & CVD Audit -------------------------------------------

function classifyChromaTier(oklchC: number): ColorProfile["chromaTier"] {
  if (oklchC < 0.015) return "achromatic";
  if (oklchC < 0.055) return "muted";
  if (oklchC < 0.1) return "soft";
  if (oklchC < 0.16) return "balanced";
  if (oklchC < 0.23) return "vibrant";
  return "electric";
}

// --- Perceptual & Artistic Harmony Generator ---------------------------------

function classifyTemperature(oklch: OKLCH): {
  score: number;
  temperature: ColorProfile["temperature"];
} {
  if (oklch.c < 0.015) return { score: 0, temperature: "neutral" };
  // Warm peak around 55° (orange-red/amber), cool peak around 235° (cyan-blue)
  const rad = ((oklch.h - 55) * Math.PI) / 180;
  const raw = Math.cos(rad);
  const chromaScale = Math.min(1, oklch.c / 0.16);
  const score = Math.round(raw * chromaScale * 100);
  if (score >= 15) return { score, temperature: "warm" };
  if (score <= -15) return { score, temperature: "cool" };
  return { score, temperature: "neutral" };
}

function classifyValueTier(tone: number): ColorProfile["valueTier"] {
  if (tone < 10) return "near-black";
  if (tone < 22) return "very-dark";
  if (tone < 36) return "dark";
  if (tone < 48) return "medium-dark";
  if (tone < 60) return "medium";
  if (tone < 74) return "medium-light";
  if (tone < 86) return "light";
  if (tone < 95) return "very-light";
  return "near-white";
}

// --- 60-30-10 UI Palette Architect (Light + Dark) ----------------------------

function ensureAccessiblePair(
  fg: RGB,
  bg: RGB,
  target: ContrastTarget = "aa",
  adjust: "background" | "foreground" = "foreground",
): { bg: string; fg: string } {
  const solved = solveAccessibleContrast({
    adjust,
    background: bg,
    foreground: fg,
    target,
  });
  return {
    bg: rgbToHex(solved.backgroundAfter),
    fg: rgbToHex(solved.foregroundAfter),
  };
}

function getHarmonyAngles(scheme: HarmonyScheme): number[] {
  switch (scheme) {
    case "analogous":
      return [0, -30, 30, -60, 60];
    case "complementary":
      return [0, 180];
    case "compound":
      return [0, 30, 180, 210, -30];
    case "monochromatic":
    case "shades-and-tints":
      return [0];
    case "split-complementary":
      return [0, 150, 210];
    case "square":
      return [0, 90, 180, 270];
    case "tetradic":
      return [0, 60, 180, 240];
    case "triadic":
      return [0, 120, 240];
  }
}

function meetsTarget(fg: RGB, bg: RGB, target: ContrastTarget): boolean {
  const wcag = getContrastRatio(fg, bg);
  const lc = Math.abs(apcaContrast(fg, bg));
  switch (target) {
    case "aa":
      return wcag >= 4.5;
    case "aa-large":
    case "ui":
      return wcag >= 3.0;
    case "aaa":
      return wcag >= 7.0;
    case "apca-body":
      return lc >= 75;
    case "apca-content":
      return lc >= 60;
    case "apca-large":
      return lc >= 45;
  }
}

function pickInkOn(bg: RGB): RGB {
  const darkInk: RGB = { b: 22, g: 16, r: 14 };
  const lightInk: RGB = { b: 255, g: 255, r: 255 };
  const darkLc = Math.abs(apcaContrast(darkInk, bg));
  const lightLc = Math.abs(apcaContrast(lightInk, bg));
  const chosen = lightLc >= darkLc ? lightInk : darkInk;
  return solveAccessibleContrast({
    adjust: "foreground",
    background: bg,
    foreground: chosen,
    target: "aa",
  }).foregroundAfter;
}

function piecewiseMap(
  value: number,
  points: [number, number][],
  inverse: boolean,
): number {
  const x = wrapHue(value);
  for (let i = 0; i < points.length - 1; i++) {
    const [x0, y0] = inverse
      ? [points[i][1], points[i][0]]
      : [points[i][0], points[i][1]];
    const [x1, y1] = inverse
      ? [points[i + 1][1], points[i + 1][0]]
      : [points[i + 1][0], points[i + 1][1]];
    if (x >= x0 && x <= x1) {
      const t = x1 === x0 ? 0 : (x - x0) / (x1 - x0);
      return wrapHue(y0 + (y1 - y0) * t);
    }
  }
  return x;
}

function rgbFromHct(h: number, c: number, t: number): RGB {
  const clampedTone = Math.max(0, Math.min(100, t));
  const clampedChroma = Math.max(0, c);
  const hct = Hct.from(wrapHue(h), clampedChroma, clampedTone);
  return argbToRgb(hct.toInt());
}

// --- CVD-Safe Categorical Palette (Data Viz / Charts / Tags) -----------------

function searchToneForContrast(
  moving: RGB,
  fixed: RGB,
  movingIsFg: boolean,
  target: ContrastTarget,
  direction: "darker" | "lighter",
): null | RGB {
  const hct = Hct.fromInt(rgbToArgb(moving));
  const startTone = hct.tone;
  const endTone = direction === "darker" ? 0 : 100;

  const checkTone = (tone: number): { ok: boolean; rgb: RGB } => {
    const candidate = rgbFromHct(hct.hue, hct.chroma, tone);
    const fg = movingIsFg ? candidate : fixed;
    const bg = movingIsFg ? fixed : candidate;
    return { ok: meetsTarget(fg, bg, target), rgb: candidate };
  };

  // Verify endpoint can achieve target
  if (!checkTone(endTone).ok) return null;

  let lo = startTone;
  let hi = endTone;
  let best: null | RGB = null;

  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    const res = checkTone(mid);
    if (res.ok) {
      best = res.rgb;
      hi = mid; // Move closer to original tone
    } else {
      lo = mid;
    }
  }

  return best;
}
