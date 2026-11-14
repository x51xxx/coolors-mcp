import { describe, expect, it } from "vitest";

import {
  matchThemeColorsBatchTool,
  matchThemeColorTool,
  refactorCssWithThemeTool,
} from "../theme-matching.tools.js";

const THEME = ":root { --color-primary: #6750a4; --color-text: #1c1b1f; }";

describe("theme matching tools input handling", () => {
  it("rejects an invalid color instead of reporting 'no match'", async () => {
    await expect(
      matchThemeColorTool.execute({ color: "not-a-color", themeCSS: THEME }),
    ).rejects.toThrow(/Invalid color format/);
  });

  it("rejects themeCSS without color custom properties", async () => {
    await expect(
      matchThemeColorTool.execute({ color: "#6750a4", themeCSS: "" }),
    ).rejects.toThrow(/no CSS custom properties with color values/);
  });

  it("rejects DESIGN.md YAML passed as themeCSS", async () => {
    await expect(
      matchThemeColorsBatchTool.execute({
        colors: ["#6750a4"],
        themeCSS: 'colors:\n  primary: "#6750a4"\n',
      }),
    ).rejects.toThrow(/no CSS custom properties/);
  });

  it("marks invalid entries in a batch", async () => {
    const out = await matchThemeColorsBatchTool.execute({
      colors: ["#6750a4", "bad"],
      themeCSS: THEME,
    });
    expect(out).toContain("#6750a4 → --color-primary");
    expect(out).toContain("bad → ✗ invalid color format");
  });

  it("leaves translucent colors untouched when refactoring", async () => {
    const out = await refactorCssWithThemeTool.execute({
      css: ".a { color: #6750a4cc; box-shadow: 0 0 1px rgba(28,27,31,.5); }",
      preserveOriginal: false,
      themeCSS: THEME,
    });
    expect(out).toContain("color: #6750a4cc;");
    expect(out).toContain("rgba(28,27,31,.5)");
    expect(out).toMatch(/Translucent color/);
  });
});
