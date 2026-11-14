import { describe, expect, it } from "vitest";

import { simulateCvd } from "../../color/color-blindness.js";
import {
  checkPaletteAccessibilityTool,
  simulateColorBlindnessTool,
} from "../color-blindness.tool.js";

describe("simulateCvd", () => {
  it("achromatopsia collapses to grayscale", () => {
    const r = simulateCvd({ b: 70, g: 80, r: 230 }, "achromatopsia");
    expect(r.r).toBe(r.g);
    expect(r.g).toBe(r.b);
  });

  it("achromatopsia preserves relative luminance (linear-light grey)", () => {
    // Y(#ff0000) = 0.2126 → sRGB grey 127; Y(#0000ff) = 0.0722 → grey 76
    expect(simulateCvd({ b: 0, g: 0, r: 255 }, "achromatopsia")).toEqual({
      b: 127,
      g: 127,
      r: 127,
    });
    expect(simulateCvd({ b: 255, g: 0, r: 0 }, "achromatopsia")).toEqual({
      b: 76,
      g: 76,
      r: 76,
    });
  });

  it("anomalous trichromacy uses Machado severity 0.6 (milder than -opia)", () => {
    // Pure red under tritanomaly 0.6 stays red (Machado table), and
    // protanomaly sits between normal vision and protanopia.
    const trit = simulateCvd({ b: 0, g: 0, r: 255 }, "tritanomaly");
    expect(trit.r).toBe(255);
    expect(trit.g).toBe(0);
    expect(trit.b).toBeLessThan(10);

    const anomaly = simulateCvd({ b: 0, g: 0, r: 255 }, "protanomaly");
    const opia = simulateCvd({ b: 0, g: 0, r: 255 }, "protanopia");
    expect(anomaly.r).toBeGreaterThan(opia.r);
    expect(anomaly.r).toBeLessThan(255);
  });

  it("protanopia shifts pure red toward yellow/olive", () => {
    const r = simulateCvd({ b: 0, g: 0, r: 255 }, "protanopia");
    // Protanopes lose long-wavelength sensitivity → red becomes dark/yellow-ish.
    expect(r.r).toBeLessThan(255);
    expect(r.g).toBeGreaterThan(0);
  });
});

describe("simulateColorBlindnessTool", () => {
  it("returns a row per color", async () => {
    const result = (await simulateColorBlindnessTool.execute({
      colors: ["#e63946", "#2a9d8f"],
      types: ["protanopia"],
    })) as string;
    expect(result).toContain("#e63946");
    expect(result).toContain("#2a9d8f");
    expect(result).toContain("protanopia");
  });
});

describe("checkPaletteAccessibilityTool", () => {
  it("audits a 3-color palette across CVD types", async () => {
    const result = (await checkPaletteAccessibilityTool.execute({
      colors: ["#000000", "#888888", "#ffffff"],
    })) as string;
    expect(result).toContain("Palette Accessibility Audit");
    expect(result).toContain("protanopia");
    expect(result).toContain("Summary");
  });
});
