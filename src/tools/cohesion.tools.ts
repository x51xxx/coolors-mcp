/**
 * Visual cohesion tools
 *
 * - generate_tonal_scale: build a Tailwind-style tonal scale (50…950) from a
 *   seed color using HCT so steps are perceptually even.
 * - generate_state_colors: derive hover/active/focus/disabled/pressed/selected
 *   variants from a base color with consistent tonal deltas.
 * - analyze_palette_consistency: score how visually cohesive a palette is by
 *   looking at chroma spread, tonal step uniformity, and hue harmony.
 * - generate_semantic_palette: pick semantic colors (primary/secondary/success/
 *   warning/error/info) that harmonize with a brand color via HCT hue rotations.
 */

import { z } from "zod";

import { argbToRgb, rgbToArgb } from "../color/conversions.js";
import { Hct } from "../color/hct/hct-class.js";
import {
  colorDistance,
  parseColor,
  rgbToHex,
  rgbToHsl,
} from "../color/index.js";

const TONAL_STOPS = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950,
] as const;

function hctFromColor(input: string): Hct | null {
  const rgb = parseColor(input);
  if (!rgb) return null;
  return Hct.fromInt(rgbToArgb(rgb));
}

function hctToHex(h: number, c: number, t: number): string {
  const hct = Hct.from(h, c, t);
  return rgbToHex(argbToRgb(hct.toInt()));
}

// --- generate_tonal_scale -----------------------------------------------------

export const generateTonalScaleTool = {
  description:
    "Generate a complete tonal scale (Tailwind-style 50/100/.../900/950) from a seed color. Uses Google's HCT color space so each step is perceptually even — ideal for building shadable design-system colors.",
  execute: async (args: {
    chromaBoost?: number;
    name?: string;
    seed: string;
    stops?: number[];
  }) => {
    const hct = hctFromColor(args.seed);
    if (!hct) return `Invalid color format: ${args.seed}`;

    const stops = args.stops?.length ? args.stops : Array.from(TONAL_STOPS);
    const chromaBoost = args.chromaBoost ?? 1;
    const name = (args.name ?? "color").toLowerCase();

    // Map Tailwind-style stops to HCT tones (50 -> tone 95, 950 -> tone 5).
    const tones = stops.map((s) => Math.max(0, Math.min(100, 100 - s / 10)));

    let output = `# Tonal scale for ${args.seed}\n`;
    output += `Seed HCT: H=${hct.hue.toFixed(1)}° C=${hct.chroma.toFixed(1)} T=${hct.tone.toFixed(1)}\n\n`;
    output += `| stop | tone | hex |\n|---|---|---|\n`;

    const rows: { hex: string; stop: number; tone: number }[] = [];
    for (let i = 0; i < stops.length; i++) {
      const tone = tones[i];
      // Reduce chroma near the extremes (very light / very dark) for legibility.
      const edge = Math.abs(50 - tone) / 50; // 0 at mid, 1 at extremes
      const chroma = hct.chroma * chromaBoost * (1 - 0.35 * edge);
      const hex = hctToHex(hct.hue, chroma, tone);
      rows.push({ hex, stop: stops[i], tone });
      output += `| ${stops[i]} | ${tone.toFixed(0)} | ${hex} |\n`;
    }

    output += `\n## CSS\n\`\`\`css\n:root {\n`;
    for (const r of rows) output += `  --${name}-${r.stop}: ${r.hex};\n`;
    output += `}\n\`\`\`\n`;

    return output;
  },
  name: "generate_tonal_scale",
  parameters: z.object({
    chromaBoost: z
      .number()
      .min(0)
      .max(2)
      .optional()
      .default(1)
      .describe("Multiplier on seed chroma (1 = preserve, <1 = muted)"),
    name: z
      .string()
      .optional()
      .describe("CSS variable base name (default: 'color')"),
    seed: z.string().describe("Seed color (hex, rgb, hsl)"),
    stops: z
      .array(z.number().min(0).max(1000))
      .optional()
      .describe(
        "Custom stops. Default: [50,100,200,300,400,500,600,700,800,900,950].",
      ),
  }),
};

// --- generate_state_colors ---------------------------------------------------

export const generateStateColorsTool = {
  description:
    "Generate consistent interaction-state colors (hover / active / pressed / focus / disabled / selected) from a base color. Steps are computed in HCT space so they keep equal perceptual weight regardless of base hue.",
  execute: async (args: { base: string; isDark?: boolean }) => {
    const hct = hctFromColor(args.base);
    if (!hct) return `Invalid color format: ${args.base}`;

    const dark = args.isDark ?? false;
    // In dark mode, "hover" should lighten; in light mode, it should darken.
    const dir = dark ? +1 : -1;

    const states: { hex: string; note: string; state: string; tone: number }[] =
      [
        { hex: "", note: "resting", state: "base", tone: hct.tone },
        {
          hex: "",
          note: "+/- 8 tone",
          state: "hover",
          tone: hct.tone + dir * 8,
        },
        {
          hex: "",
          note: "+/- 16 tone",
          state: "active",
          tone: hct.tone + dir * 16,
        },
        {
          hex: "",
          note: "same as active, alias",
          state: "pressed",
          tone: hct.tone + dir * 16,
        },
        {
          hex: "",
          note: "+/- 4 tone, used as outline",
          state: "focus",
          tone: hct.tone + dir * 4,
        },
        {
          hex: "",
          note: "low chroma, mid tone",
          state: "disabled",
          tone: dark ? 30 : 70,
        },
        {
          hex: "",
          note: "alpha-blend friendly base",
          state: "selected",
          tone: dark ? 25 : 90,
        },
      ];

    for (const s of states) {
      const chroma =
        s.state === "disabled" ? Math.min(hct.chroma, 6) : hct.chroma;
      const tone = Math.max(0, Math.min(100, s.tone));
      s.hex = hctToHex(hct.hue, chroma, tone);
      s.tone = tone;
    }

    let out = `# Interaction states for ${args.base} (${dark ? "dark" : "light"} mode)\n\n`;
    out += `| state | tone | hex | notes |\n|---|---|---|---|\n`;
    for (const s of states)
      out += `| ${s.state} | ${s.tone.toFixed(0)} | ${s.hex} | ${s.note} |\n`;

    return out;
  },
  name: "generate_state_colors",
  parameters: z.object({
    base: z.string().describe("Base/resting color (hex, rgb, hsl)"),
    isDark: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether the base color sits on a dark background. Hover lightens on dark, darkens on light.",
      ),
  }),
};

// --- analyze_palette_consistency --------------------------------------------

export const analyzePaletteConsistencyTool = {
  description:
    "Score how visually cohesive a palette is. Reports tonal step uniformity, chroma spread, hue distribution, and a single 0-100 cohesion score, plus targeted suggestions for tightening it up.",
  execute: async (args: { colors: string[] }) => {
    if (args.colors.length < 2) {
      return "Need at least 2 colors to analyze cohesion.";
    }

    const parsed = args.colors.map((c) => ({ input: c, rgb: parseColor(c) }));
    if (parsed.some((p) => !p.rgb)) {
      const bad = parsed.filter((p) => !p.rgb).map((p) => p.input);
      return `Invalid color format: ${bad.join(", ")}`;
    }

    const hcts = parsed.map((p) => Hct.fromInt(rgbToArgb(p.rgb!)));

    const tones = hcts.map((h) => h.tone).sort((a, b) => a - b);
    const chromas = hcts.map((h) => h.chroma);
    const hues = hcts.map((h) => h.hue);

    // Tonal step uniformity — std-dev of gaps between sorted tones.
    const gaps: number[] = [];
    for (let i = 1; i < tones.length; i++) gaps.push(tones[i] - tones[i - 1]);
    const avgGap = gaps.reduce((a, b) => a + b, 0) / (gaps.length || 1);
    const gapStd = Math.sqrt(
      gaps.reduce((a, b) => a + (b - avgGap) ** 2, 0) / (gaps.length || 1),
    );
    // Lower std relative to avg = more uniform. Score 100 when std ≈ 0.
    const toneUniformity = Math.max(
      0,
      100 - (gapStd / Math.max(1, avgGap)) * 50,
    );

    // Chroma cohesion — std-dev of chroma, lower is more cohesive.
    const avgChroma = chromas.reduce((a, b) => a + b, 0) / chromas.length;
    const chromaStd = Math.sqrt(
      chromas.reduce((a, b) => a + (b - avgChroma) ** 2, 0) / chromas.length,
    );
    const chromaCohesion = Math.max(0, 100 - chromaStd * 2);

    // Hue harmony — cluster hues; reward palettes whose hues sit within a few
    // recognized harmonic offsets (0, 30, 60, 90, 120, 150, 180 ±15°).
    const targets = [0, 30, 60, 90, 120, 150, 180];
    let harmonyHits = 0;
    for (let i = 0; i < hues.length; i++) {
      for (let j = i + 1; j < hues.length; j++) {
        let d = Math.abs(hues[i] - hues[j]);
        if (d > 180) d = 360 - d;
        if (targets.some((t) => Math.abs(d - t) <= 15)) harmonyHits++;
      }
    }
    const totalPairs = (hues.length * (hues.length - 1)) / 2;
    const hueHarmony = totalPairs ? (harmonyHits / totalPairs) * 100 : 100;

    const cohesion =
      0.4 * toneUniformity + 0.3 * chromaCohesion + 0.3 * hueHarmony;

    // Find the most "off" color — the one that pushes std the most.
    let outlier = -1;
    let outlierGain = 0;
    for (let i = 0; i < hcts.length; i++) {
      const reduced = hcts.filter((_, k) => k !== i).map((h) => h.chroma);
      const m = reduced.reduce((a, b) => a + b, 0) / reduced.length;
      const std = Math.sqrt(
        reduced.reduce((a, b) => a + (b - m) ** 2, 0) / reduced.length,
      );
      const gain = chromaStd - std;
      if (gain > outlierGain) {
        outlierGain = gain;
        outlier = i;
      }
    }

    let out = `# Palette cohesion analysis\n\n`;
    out += `Colors: ${args.colors.length}\n\n`;
    out += `| metric | score | detail |\n|---|---|---|\n`;
    out += `| Tonal step uniformity | ${toneUniformity.toFixed(0)} | gap avg ${avgGap.toFixed(1)} ± ${gapStd.toFixed(1)} |\n`;
    out += `| Chroma cohesion | ${chromaCohesion.toFixed(0)} | chroma avg ${avgChroma.toFixed(1)} ± ${chromaStd.toFixed(1)} |\n`;
    out += `| Hue harmony | ${hueHarmony.toFixed(0)} | ${harmonyHits}/${totalPairs} pairs at harmonic angles |\n`;
    out += `| **Overall cohesion** | **${cohesion.toFixed(0)}** | weighted 0.4 / 0.3 / 0.3 |\n\n`;

    const suggestions: string[] = [];
    if (toneUniformity < 60)
      suggestions.push(
        `Tone gaps are uneven (std ${gapStd.toFixed(1)}). Snap colors to a fixed scale (e.g. tones 10/30/50/70/90).`,
      );
    if (chromaCohesion < 60)
      suggestions.push(
        `Chroma varies widely (std ${chromaStd.toFixed(1)}). Mute saturated colors or boost flat ones toward chroma ${avgChroma.toFixed(0)}.`,
      );
    if (hueHarmony < 50)
      suggestions.push(
        `Hues don't sit at harmonic angles (30/60/90/120/180°). Try rotating outliers onto the nearest harmonic.`,
      );
    if (outlier >= 0)
      suggestions.push(
        `Likely outlier: ${args.colors[outlier]} (chroma ${hcts[outlier].chroma.toFixed(0)} vs avg ${avgChroma.toFixed(0)}).`,
      );

    if (suggestions.length === 0)
      out += `✓ Palette is visually cohesive across all three axes.\n`;
    else {
      out += `## Suggestions\n`;
      for (const s of suggestions) out += `- ${s}\n`;
    }

    return out;
  },
  name: "analyze_palette_consistency",
  parameters: z.object({
    colors: z.array(z.string()).min(2).describe("Palette colors to analyze"),
  }),
};

// --- generate_semantic_palette ----------------------------------------------

const SEMANTIC_OFFSETS: Record<string, number> = {
  // Hue offsets from brand color (in HCT degrees).
  // Secondary/tertiary use harmonic rotations; semantic statuses anchor to
  // conventional hue ranges (red/yellow/blue) but adjust chroma/tone to feel
  // like they belong to the same family.
  primary: 0,
  secondary: -30,
  tertiary: 60,
};

const SEMANTIC_ANCHORS: Record<string, { chromaMin: number; hue: number }> = {
  // Anchored hues for status colors. Chroma is clamped down to whatever the
  // brand can muster so the status palette doesn't out-shout the brand.
  error: { chromaMin: 40, hue: 25 }, // red
  info: { chromaMin: 30, hue: 240 }, // blue
  success: { chromaMin: 30, hue: 142 }, // green
  warning: { chromaMin: 50, hue: 80 }, // amber
};

export const generateSemanticPaletteTool = {
  description:
    "From a single brand color, generate a complete visually-cohesive semantic palette: primary, secondary, tertiary, plus success/warning/error/info status colors. Tone and chroma are normalized in HCT space so every color feels like part of the same family.",
  execute: async (args: { brand: string; isDark?: boolean }) => {
    const hct = hctFromColor(args.brand);
    if (!hct) return `Invalid color format: ${args.brand}`;

    const dark = args.isDark ?? false;
    const targetTone = dark ? 80 : 40;
    const familyChroma = Math.max(24, Math.min(hct.chroma, 80));

    const entries: { hex: string; hue: number; name: string; tone: number }[] =
      [];

    for (const [name, offset] of Object.entries(SEMANTIC_OFFSETS)) {
      const hue = (hct.hue + offset + 360) % 360;
      const hex = hctToHex(hue, familyChroma, targetTone);
      entries.push({ hex, hue, name, tone: targetTone });
    }

    for (const [name, anchor] of Object.entries(SEMANTIC_ANCHORS)) {
      const chroma = Math.max(anchor.chromaMin, Math.min(familyChroma, 90));
      const hex = hctToHex(anchor.hue, chroma, targetTone);
      entries.push({ hex, hue: anchor.hue, name, tone: targetTone });
    }

    // Quick sanity check: how close are the status hues to the brand? Report
    // the perceptual distance so the user knows what they're getting.
    const brandRgb = parseColor(args.brand)!;

    let out = `# Semantic palette derived from ${args.brand}\n`;
    out += `Mode: ${dark ? "dark" : "light"} (target tone ${targetTone})\n`;
    out += `Family chroma: ${familyChroma.toFixed(0)} (brand was ${hct.chroma.toFixed(0)})\n\n`;
    out += `| role | hue | hex | ΔE2000 from brand | hsl |\n|---|---|---|---|---|\n`;
    for (const e of entries) {
      const rgb = parseColor(e.hex)!;
      const delta = colorDistance(brandRgb, rgb, { metric: "deltaE2000" });
      const hsl = rgbToHsl(rgb);
      out += `| ${e.name} | ${e.hue.toFixed(0)}° | ${e.hex} | ${delta.toFixed(1)} | hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%) |\n`;
    }

    out += `\n## CSS\n\`\`\`css\n:root {\n`;
    for (const e of entries) out += `  --color-${e.name}: ${e.hex};\n`;
    out += `}\n\`\`\`\n`;

    return out;
  },
  name: "generate_semantic_palette",
  parameters: z.object({
    brand: z.string().describe("Brand / seed color (hex, rgb, hsl)"),
    isDark: z
      .boolean()
      .optional()
      .default(false)
      .describe("Generate the palette for a dark theme background"),
  }),
};
