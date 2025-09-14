import { describe, expect, it } from "vitest";

import { gradientGeneratorTool } from "../gradient-generator.tool.js";

describe("gradientGeneratorTool", () => {
  it("should generate gradient with linear easing", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#000000", "#ffffff"],
      easing: "linear",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Generated gradient with 5 steps:");
    expect(result).toContain("Interpolation: rgb");
    expect(result).toContain("Easing: linear");
    expect(result).toContain("Input colors: #000000 → #ffffff");
  });

  it("should generate gradient with HSL interpolation", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000", "#00ff00"],
      easing: "linear",
      format: "array",
      interpolation: "hsl",
      steps: 7,
    });

    expect(result).toContain("Generated gradient with 7 steps:");
    expect(result).toContain("Interpolation: hsl");
    const lines = result.split("\n");
    const colorLines = lines.filter((line) => /^\d+\./.test(line));
    expect(colorLines).toHaveLength(8); // 7 steps + final color
  });

  it("should generate gradient with LAB interpolation", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#0066cc", "#ff6600"],
      easing: "linear",
      format: "array",
      interpolation: "lab",
      steps: 10,
    });

    expect(result).toContain("Generated gradient with 10 steps:");
    expect(result).toContain("Interpolation: lab");
  });

  it("should generate gradient with LCH interpolation", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff00ff", "#00ffff"],
      easing: "linear",
      format: "array",
      interpolation: "lch",
      steps: 8,
    });

    expect(result).toContain("Generated gradient with 8 steps:");
    expect(result).toContain("Interpolation: lch");
  });

  it("should generate gradient with HCT interpolation", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#4285f4", "#ea4335"],
      easing: "linear",
      format: "array",
      interpolation: "hct",
      steps: 6,
    });

    expect(result).toContain("Generated gradient with 6 steps:");
    expect(result).toContain("Interpolation: hct");
  });

  it("should apply ease-in easing", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#000000", "#ffffff"],
      easing: "ease-in",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Easing: ease-in");
  });

  it("should apply ease-out easing", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#000000", "#ffffff"],
      easing: "ease-out",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Easing: ease-out");
  });

  it("should apply ease-in-out easing", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#000000", "#ffffff"],
      easing: "ease-in-out",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Easing: ease-in-out");
  });

  it("should format as CSS linear gradient", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000", "#0000ff"],
      easing: "linear",
      format: "css-linear",
      interpolation: "lab",
      steps: 5,
    });

    expect(result).toMatch(/^linear-gradient\(90deg,/);
    expect(result).toContain("0.0%");
    expect(result).toContain("100.0%");
  });

  it("should format as CSS radial gradient", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ffffff", "#000000"],
      easing: "linear",
      format: "css-radial",
      interpolation: "lab",
      steps: 4,
    });

    expect(result).toMatch(/^radial-gradient\(circle,/);
    expect(result).toContain("0.0%");
    expect(result).toContain("100.0%");
  });

  it("should format as hex string", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000", "#00ff00"],
      easing: "linear",
      format: "hex",
      interpolation: "rgb",
      steps: 3,
    });

    expect(result).toMatch(/^#[0-9a-f]{6}(, #[0-9a-f]{6})+$/i);
  });

  it("should handle multiple color stops", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000", "#00ff00", "#0000ff"],
      easing: "linear",
      format: "array",
      interpolation: "lab",
      steps: 9,
    });

    expect(result).toContain("Generated gradient with 9 steps:");
    expect(result).toContain("Input colors: #ff0000 → #00ff00 → #0000ff");
    const lines = result.split("\n");
    const colorLines = lines.filter((line) => /^\d+\./.test(line));
    expect(colorLines).toHaveLength(10); // 9 steps + final color
  });

  it("should error with less than 2 colors", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000"],
      easing: "linear",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Error: At least 2 colors are required");
  });

  it("should error on invalid color format", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#ff0000", "invalid"],
      easing: "linear",
      format: "array",
      interpolation: "rgb",
      steps: 5,
    });

    expect(result).toContain("Invalid color format: invalid");
  });

  it("should handle gradients with many steps", async () => {
    const result = await gradientGeneratorTool.execute({
      colors: ["#000000", "#ffffff"],
      easing: "linear",
      format: "array",
      interpolation: "lab",
      steps: 50,
    });

    expect(result).toContain("Generated gradient with 50 steps:");
    const lines = result.split("\n");
    const colorLines = lines.filter((line) => /^\d+\./.test(line));
    expect(colorLines).toHaveLength(51); // 50 steps + final color
  });
});
