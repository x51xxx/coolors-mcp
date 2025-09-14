import { describe, expect, it } from "vitest";

import { paletteWithLocksTool } from "../palette-with-locks.tool.js";

describe("paletteWithLocksTool", () => {
  it("should generate palette with locked colors in harmony mode", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#ff0000", "#0000ff"],
      mode: "harmony",
      totalColors: 5,
    });

    expect(result).toContain("Generated palette with 2 locked colors:");
    expect(result).toContain("(locked)");
    expect(result).toContain("Mode: harmony");
    expect(result).toContain("Total colors: 5");
  });

  it("should generate palette with contrast mode", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#808080"],
      mode: "contrast",
      totalColors: 4,
    });

    expect(result).toContain("Generated palette with 1 locked colors:");
    expect(result).toContain("Mode: contrast");
    expect(result).toContain("Total colors: 4");
  });

  it("should generate gradient between locked colors", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "lab",
      lockedColors: ["#000000", "#ffffff"],
      mode: "gradient",
      totalColors: 5,
    });

    expect(result).toContain("Generated palette with 2 locked colors:");
    expect(result).toContain("Mode: gradient");
    expect(result).toContain("Color space: lab");
  });

  it("should handle gradient with HSL interpolation", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#ff0000", "#00ff00"],
      mode: "gradient",
      totalColors: 7,
    });

    expect(result).toContain("Generated palette with 2 locked colors:");
    expect(result).toContain("Mode: gradient");
    expect(result).toContain("Color space: hsl");
  });

  it("should error when locked colors >= total colors", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#ff0000", "#00ff00", "#0000ff"],
      mode: "harmony",
      totalColors: 3,
    });

    expect(result).toContain("Error: Number of locked colors");
  });

  it("should error on invalid color format", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["invalid", "#00ff00"],
      mode: "harmony",
      totalColors: 5,
    });

    expect(result).toContain("Invalid color format: invalid");
  });

  it("should error in gradient mode with only one locked color", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#ff0000"],
      mode: "gradient",
      totalColors: 5,
    });

    expect(result).toContain("Gradient mode requires at least 2 locked colors");
  });

  it("should generate harmonious colors with multiple locked colors", async () => {
    const result = await paletteWithLocksTool.execute({
      colorSpace: "hsl",
      lockedColors: ["#ff0000", "#00ff00", "#0000ff"],
      mode: "harmony",
      totalColors: 6,
    });

    expect(result).toContain("Generated palette with 3 locked colors:");
    expect(result).toContain("Mode: harmony");
    expect(result).toContain("Total colors: 6");

    // Should have 6 color entries
    const lines = result.split("\n");
    const colorLines = lines.filter((line) => /^\d+\./.test(line));
    expect(colorLines).toHaveLength(6);
  });
});
