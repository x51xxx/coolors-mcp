import { describe, expect, it } from "vitest";

import { exportPaletteTool } from "../palette-export.tool.js";

describe("exportPaletteTool", () => {
  it("exports CSS custom properties", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4", "#ff6b6b"],
      format: "css",
      names: ["primary", "danger"],
    })) as string;
    expect(result).toContain("--primary: #6750a4;");
    expect(result).toContain("--danger: #ff6b6b;");
  });

  it("exports SCSS variables", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4"],
      format: "scss",
      names: ["primary"],
    })) as string;
    expect(result).toContain("$primary: #6750a4;");
  });

  it("exports Tailwind config snippet", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#fef3c7", "#fde68a"],
      format: "tailwind",
      prefix: "amber",
    })) as string;
    expect(result).toContain("tailwind.config.js");
    expect(result).toContain('"amber"');
  });

  it("exports W3C design tokens", async () => {
    const result = (await exportPaletteTool.execute({
      colors: ["#6750a4"],
      format: "tokens",
      names: ["primary"],
    })) as string;
    const parsed = JSON.parse(result);
    expect(parsed.color.primary.$type).toBe("color");
    expect(parsed.color.primary.$value).toBe("#6750a4");
  });

  it("rejects mismatched names length", async () => {
    const result = await exportPaletteTool.execute({
      colors: ["#000", "#fff"],
      format: "css",
      names: ["only-one"],
    });
    expect(result).toMatch(/length/);
  });
});
