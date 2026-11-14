import { describe, expect, it } from "vitest";

import {
  auditColorPair,
  designUiPalette,
  formatOklch,
  generateCategoricalPalette,
  generateHarmonyPalette,
  getContrastRatio,
  oklabToRgb,
  oklchToRgb,
  parseColor,
  profileColor,
  rgbHueToRyb,
  rgbToHex,
  rgbToOklab,
  rgbToOklch,
  rybHueToRgb,
  solveAccessibleContrast,
} from "../index.js";

describe("OKLab & OKLCH conversions", () => {
  it("round-trips primary and neutral colors accurately", () => {
    const samples = [
      { b: 0, g: 0, r: 255 },
      { b: 0, g: 255, r: 0 },
      { b: 255, g: 0, r: 0 },
      { b: 164, g: 80, r: 103 },
      { b: 255, g: 255, r: 255 },
      { b: 0, g: 0, r: 0 },
    ];

    for (const c of samples) {
      const lab = rgbToOklab(c);
      const backLab = oklabToRgb(lab);
      expect(backLab.r).toBeCloseTo(c.r, 0);
      expect(backLab.g).toBeCloseTo(c.g, 0);
      expect(backLab.b).toBeCloseTo(c.b, 0);

      const lch = rgbToOklch(c);
      const backLch = oklchToRgb(lch);
      expect(backLch.r).toBeCloseTo(c.r, 0);
      expect(backLch.g).toBeCloseTo(c.g, 0);
      expect(backLch.b).toBeCloseTo(c.b, 0);
    }
  });

  it("gamut-maps out-of-gamut OKLCH colors into valid sRGB", () => {
    const mapped = oklchToRgb({ c: 0.45, h: 145, l: 0.7 });
    expect(mapped.r).toBeGreaterThanOrEqual(0);
    expect(mapped.r).toBeLessThanOrEqual(255);
    expect(mapped.g).toBeGreaterThanOrEqual(0);
    expect(mapped.g).toBeLessThanOrEqual(255);
    expect(mapped.b).toBeGreaterThanOrEqual(0);
    expect(mapped.b).toBeLessThanOrEqual(255);

    const actual = rgbToOklch(mapped);
    expect(actual.l).toBeCloseTo(0.7, 1);
  });

  it("formats OKLCH in CSS Color 4 syntax", () => {
    const css = formatOklch(rgbToOklch({ b: 164, g: 80, r: 103 }));
    expect(css).toMatch(/^oklch\(\d+\.\d% \d+\.\d{4} \d+\.\d\)$/);
  });
});

describe("Extended parseColor", () => {
  it("parses CSS named colors", () => {
    expect(parseColor("rebeccapurple")).toEqual({ b: 153, g: 51, r: 102 });
    expect(parseColor("CRIMSON")).toEqual({ b: 60, g: 20, r: 220 });
  });

  it("parses CSS Color 4 space-separated rgb/hsl and 8-digit hex", () => {
    expect(parseColor("#ff000080")).toEqual({ b: 0, g: 0, r: 255 });
    expect(parseColor("rgb(103 80 164 / 0.5)")).toEqual({
      b: 164,
      g: 80,
      r: 103,
    });
    const hsl = parseColor("hsl(258.1deg 34.4% 47.8%)");
    expect(hsl).not.toBeNull();
    expect(hsl!.b).toBeGreaterThan(140);
  });

  it("parses oklch(), oklab(), and hct()", () => {
    const fromOklch = parseColor("oklch(62.8% 0.258 29.2)");
    expect(fromOklch).not.toBeNull();
    expect(fromOklch!.r).toBeGreaterThan(200);

    const fromOklab = parseColor("oklab(0.6 0.1 -0.1)");
    expect(fromOklab).not.toBeNull();

    const fromHct = parseColor("hct(258, 47, 41)");
    expect(fromHct).not.toBeNull();
  });
});

describe("Color Theory Engine", () => {
  it("profiles colors with perceptual names, temperature, and warnings", () => {
    const indigo = profileColor({ b: 164, g: 80, r: 103 });
    expect(indigo.temperature).toBe("cool");
    expect(indigo.bestText.recommended).toBe("light");
    expect(indigo.name.length).toBeGreaterThan(3);

    const bile = profileColor(parseColor("#4c4308")!);
    expect(bile.isDisliked).toBe(true);
    expect(bile.dislikedFixHex).not.toBeNull();
    expect(bile.warnings.length).toBeGreaterThan(0);
  });

  it("solves failing contrast minimally while preserving hue", () => {
    // Low-contrast blue text on light gray surface
    const fg = parseColor("#6b8cff")!;
    const bg = parseColor("#f1f5f9")!;
    expect(getContrastRatio(fg, bg)).toBeLessThan(4.5);

    const solved = solveAccessibleContrast({
      adjust: "foreground",
      background: bg,
      foreground: fg,
      target: "aa",
    });

    expect(solved.achieved).toBe(true);
    expect(solved.wcagAfter).toBeGreaterThanOrEqual(4.5);
    expect(solved.wcagAfter).toBeLessThan(6.5); // Minimal shift, not pure black
  });

  it("detects chromostereopsis and CVD contrast issues on pairs", () => {
    // Vivid red on vivid blue creates chromostereopsis + protan/deutan trouble
    const audit = auditColorPair(
      parseColor("#ff1e1e")!,
      parseColor("#0044ff")!,
      "body",
    );
    expect(audit.chromostereopsisRisk).toBe(true);
    expect(audit.passesRole).toBe(false);
    expect(audit.fixSuggestion).not.toBeNull();
  });

  it("maps RGB hues to artistic RYB hues (blue <-> orange)", () => {
    const blueRyb = rgbHueToRyb(240);
    const orangeRgb = rybHueToRgb((blueRyb + 180) % 360);
    // In RYB, blue's complement is orange (~25-45 deg in RGB/HSL), not yellow (60)
    expect(orangeRgb).toBeLessThan(50);
  });

  it("generates harmonies including split-complementary and avoids disliked colors", () => {
    const res = generateHarmonyPalette(parseColor("#6750a4")!, {
      count: 5,
      scheme: "split-complementary",
      space: "hct",
    });
    expect(res.colors).toHaveLength(5);
    expect(rgbToHex(res.colors[0])).toBe("#6750a4");
  });

  it("designs a 60-30-10 UI system where every Light & Dark text pair passes WCAG AA", () => {
    const system = designUiPalette(parseColor("#3b82f6")!, {
      harmony: "analogous",
      neutralStyle: "tinted",
    });

    for (const mode of [system.light, system.dark]) {
      const checks: [string, string, number][] = [
        [mode.textPrimary, mode.surface, 7],
        [mode.textSecondary, mode.surface, 4.5],
        [mode.textMuted, mode.surface, 4.5],
        [mode.onPrimary, mode.primary, 4.5],
        [mode.onPrimarySubtle, mode.primarySubtle, 4.5],
        [mode.onSecondary, mode.secondary, 4.5],
        [mode.onAccent, mode.accent, 4.5],
        [mode.onSuccess, mode.success, 4.5],
        [mode.onWarning, mode.warning, 4.5],
        [mode.onError, mode.error, 4.5],
        [mode.onInfo, mode.info, 4.5],
      ];

      for (const [fgHex, bgHex, minRatio] of checks) {
        const ratio = getContrastRatio(parseColor(fgHex)!, parseColor(bgHex)!);
        expect(ratio).toBeGreaterThanOrEqual(minRatio);
      }
    }
  });

  it("generates CVD-safe categorical palettes", () => {
    const cat = generateCategoricalPalette(6, { background: "light" });
    expect(cat.colors).toHaveLength(6);
    expect(cat.minNormalDeltaE).toBeGreaterThan(15);
    expect(cat.minCvdDeltaE).toBeGreaterThan(8);
  });
});
