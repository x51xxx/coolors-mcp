import { describe, expect, it } from "vitest";

import { adjustColorTool } from "../adjust-color.tool.js";
import {
  auditUiColorsTool,
  describeColorTool,
  designUiPaletteTool,
  fixContrastTool,
  generateCategoricalPaletteTool,
} from "../agent-color.tools.js";
import { colorConversionTool } from "../color-conversion.tool.js";
import { contrastCheckerTool } from "../contrast-checker.tool.js";
import { gradientGeneratorTool } from "../gradient-generator.tool.js";
import { paletteGeneratorTool } from "../palette-generator.tool.js";
import { paletteWithLocksTool } from "../palette-with-locks.tool.js";

describe("Agent-Compensating Color Tools", () => {
  it("describe_color profiles colors with perceptual names & text recommendations", async () => {
    const out = await describeColorTool.execute({
      colors: ["#6750a4", "crimson", "invalid-color"],
    });
    expect(out).toContain("Perceptual Color Profile");
    expect(out).toContain("oklch(");
    expect(out).toContain("Text on this color");
    expect(out).toContain("Invalid color format");
  });

  it("fix_contrast solves failing contrast and returns accessible hex", async () => {
    const out = await fixContrastTool.execute({
      adjust: "foreground",
      background: "#ffffff",
      foreground: "#93c5fd",
      target: "aa",
    });
    expect(out).toContain("Target achieved");
    expect(out).toContain("**After**:");
  });

  it("design_ui_palette outputs Light & Dark 60-30-10 CSS tokens", async () => {
    const css = await designUiPaletteTool.execute({
      brand: "#4f46e5",
      format: "css",
      harmony: "split-complementary",
      neutralStyle: "tinted",
    });
    expect(css).toContain(":root {");
    expect(css).toContain('[data-theme="dark"] {');
    expect(css).toContain("--color-primary:");
    expect(css).toContain("--color-on-primary:");
    expect(css).toContain("--color-surface-elevated:");
  });

  it("audit_ui_colors flags failing pairs with exact fixes", async () => {
    const out = await auditUiColorsTool.execute({
      pairs: [
        { bg: "#ffffff", fg: "#1e293b", name: "body-text", role: "body" },
        { bg: "#ffffff", fg: "#94a3b8", name: "too-light", role: "body" },
      ],
      swatches: ["#4c4308", "#3b82f6"],
    });
    expect(out).toContain("✓ Pass");
    expect(out).toContain("✗ Fail");
    expect(out).toContain("Use fg `");
    expect(out).toContain("bile zone");
  });

  it("generate_categorical_palette creates CVD-checked colors", async () => {
    const out = await generateCategoricalPaletteTool.execute({
      background: "dark",
      count: 5,
      seedColor: "#38bdf8",
    });
    expect(out).toContain("Min pairwise ΔE2000 (worst CVD)");
    expect(out.match(/^\d+\. `/gm)).toHaveLength(5);
  });
});

describe("Upgraded Core Color Tools", () => {
  it("convert_color supports oklch, oklab, and CSS named colors", async () => {
    const oklch = await colorConversionTool.execute({
      color: "rebeccapurple",
      to: "oklch",
    });
    expect(oklch).toMatch(/^oklch\(/);

    const oklab = await colorConversionTool.execute({
      color: "#6750a4",
      to: "oklab",
    });
    expect(oklab).toMatch(/^oklab\(/);
  });

  it("adjust_color mixes blue + yellow perceptually without muddy gray", async () => {
    const mixed = await adjustColorTool.execute({
      amount: 0.5,
      color: "#0055ff",
      operation: "mix",
      space: "oklch",
      with: "#ffee00",
    });
    expect(mixed).toMatch(/^#[0-9a-f]{6}$/);
    // Perceptual OKLab mix of blue + yellow lands in green/teal (g > r)
    const g = parseInt(mixed.slice(3, 5), 16);
    const r = parseInt(mixed.slice(1, 3), 16);
    expect(g).toBeGreaterThan(r);
  });

  it("generate_palette supports split-complementary in HCT and RYB", async () => {
    const hctOut = await paletteGeneratorTool.execute({
      baseColor: "#3b82f6",
      count: 5,
      space: "hct",
      type: "split-complementary",
    });
    expect(hctOut).toContain("split-complementary palette (HCT)");

    const rybOut = await paletteGeneratorTool.execute({
      baseColor: "#0000ff",
      count: 4,
      space: "ryb",
      type: "complementary",
    });
    expect(rybOut).toContain("RYB");
  });

  it("generate_gradient supports oklch and oklab", async () => {
    const out = await gradientGeneratorTool.execute({
      colors: ["#3b82f6", "#f59e0b"],
      interpolation: "oklch",
      steps: 5,
    });
    expect(out).toContain("Interpolation: oklch");
  });

  it("generate_palette_with_locks honors exact totalColors even with remainders", async () => {
    const out = await paletteWithLocksTool.execute({
      colorSpace: "oklch",
      lockedColors: ["#ff0000", "#00ff00", "#0000ff"],
      mode: "gradient",
      totalColors: 8,
    });
    const lines = out.split("\n").filter((l) => /^\d+\./.test(l));
    expect(lines).toHaveLength(8);
  });

  it("check_contrast includes nearest AA fix suggestion when failing", async () => {
    const out = await contrastCheckerTool.execute({
      background: "#ffffff",
      foreground: "#93c5fd",
    });
    expect(out).toContain("✗ Fail");
    expect(out).toContain("Nearest AA fix");
  });
});
