import { describe, expect, it } from "vitest";

import {
  analyzePaletteConsistencyTool,
  generateSemanticPaletteTool,
  generateStateColorsTool,
  generateTonalScaleTool,
} from "../cohesion.tools.js";

describe("generateTonalScaleTool", () => {
  it("generates 11 stops by default", async () => {
    const result = (await generateTonalScaleTool.execute({
      seed: "#6750a4",
    })) as string;
    expect(result).toContain("| 50 |");
    expect(result).toContain("| 500 |");
    expect(result).toContain("| 950 |");
    expect(result.match(/^\| \d+ \|/gm)?.length ?? 0).toBeGreaterThanOrEqual(
      11,
    );
  });

  it("emits CSS custom properties with the given prefix", async () => {
    const result = (await generateTonalScaleTool.execute({
      name: "brand",
      seed: "#6750a4",
    })) as string;
    expect(result).toContain("--brand-50:");
    expect(result).toContain("--brand-950:");
  });

  it("rejects invalid colors", async () => {
    const result = await generateTonalScaleTool.execute({ seed: "nope" });
    expect(result).toMatch(/Invalid color format/);
  });
});

describe("generateStateColorsTool", () => {
  it("produces all expected interaction states", async () => {
    const result = (await generateStateColorsTool.execute({
      base: "#6750a4",
    })) as string;
    for (const state of [
      "base",
      "hover",
      "active",
      "pressed",
      "focus",
      "disabled",
      "selected",
    ]) {
      expect(result).toContain(`| ${state} |`);
    }
  });
});

describe("analyzePaletteConsistencyTool", () => {
  it("returns a cohesion score for a small palette", async () => {
    const result = (await analyzePaletteConsistencyTool.execute({
      colors: ["#6750a4", "#7f67be", "#a48dc8"],
    })) as string;
    expect(result).toContain("Overall cohesion");
  });

  it("flags outliers", async () => {
    const result = (await analyzePaletteConsistencyTool.execute({
      colors: ["#6750a4", "#7f67be", "#a48dc8", "#ff0000"],
    })) as string;
    expect(result).toMatch(/outlier/i);
  });

  it("requires at least 2 colors", async () => {
    const result = await analyzePaletteConsistencyTool.execute({
      colors: ["#6750a4"],
    });
    expect(result).toMatch(/at least 2/i);
  });
});

describe("generateSemanticPaletteTool", () => {
  it("returns all 7 semantic roles", async () => {
    const result = (await generateSemanticPaletteTool.execute({
      brand: "#6750a4",
    })) as string;
    for (const role of [
      "primary",
      "secondary",
      "tertiary",
      "success",
      "warning",
      "error",
      "info",
    ]) {
      expect(result).toContain(`--color-${role}:`);
    }
  });
});
