import { describe, expect, it } from "vitest";

import { apcaContrast } from "../../color/apca.js";
import { contrastCheckerTool } from "../contrast-checker.tool.js";

describe("apcaContrast", () => {
  // Reference values from Myndex/SAPC-APCA test vectors
  it("matches reference: #888 on #fff ≈ 63", () => {
    const lc = apcaContrast(
      { b: 0x88, g: 0x88, r: 0x88 },
      { b: 255, g: 255, r: 255 },
    );
    expect(lc).toBeCloseTo(63.06, 1);
  });

  it("matches reference: #000 on #fff ≈ 106", () => {
    const lc = apcaContrast({ b: 0, g: 0, r: 0 }, { b: 255, g: 255, r: 255 });
    expect(lc).toBeCloseTo(106.04, 1);
  });

  it("matches reference: #fff on #000 ≈ -107", () => {
    const lc = apcaContrast({ b: 255, g: 255, r: 255 }, { b: 0, g: 0, r: 0 });
    expect(lc).toBeCloseTo(-107.28, 1);
  });
});

describe("contrastCheckerTool", () => {
  it("returns WCAG block by default", async () => {
    const result = await contrastCheckerTool.execute({
      background: "#ffffff",
      foreground: "#000000",
    });
    expect(result).toContain("WCAG 2.x");
    expect(result).toContain("21.00:1");
  });

  it("returns APCA when requested", async () => {
    const result = await contrastCheckerTool.execute({
      algorithm: "apca",
      background: "#ffffff",
      foreground: "#000000",
    });
    expect(result).toContain("APCA");
    expect(result).toContain("Lc:");
  });

  it("returns both when algorithm=both", async () => {
    const result = await contrastCheckerTool.execute({
      algorithm: "both",
      background: "#ffffff",
      foreground: "#000000",
    });
    expect(result).toContain("WCAG 2.x");
    expect(result).toContain("APCA");
  });
});
