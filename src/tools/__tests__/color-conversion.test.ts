import { describe, expect, it } from "vitest";

import { colorConversionTool } from "../color-conversion.tool.js";

describe("colorConversionTool", () => {
  // Regression: previously multiplied by 255 again, producing rgb(26265, ...).
  it("converts hex to rgb without re-scaling", async () => {
    const result = await colorConversionTool.execute({
      color: "#6750a4",
      to: "rgb",
    });
    expect(result).toBe("rgb(103, 80, 164)");
  });

  it("converts hex to hex (round-trip)", async () => {
    const result = await colorConversionTool.execute({
      color: "#6750a4",
      to: "hex",
    });
    expect(result).toBe("#6750a4");
  });

  it("converts hex to hsl", async () => {
    const result = await colorConversionTool.execute({
      color: "#6750a4",
      to: "hsl",
    });
    expect(result).toMatch(/^hsl\(\d+, \d+%, \d+%\)$/);
  });

  it("rejects invalid colors", async () => {
    const result = await colorConversionTool.execute({
      color: "not-a-color",
      to: "rgb",
    });
    expect(result).toMatch(/Invalid color format/);
  });
});
