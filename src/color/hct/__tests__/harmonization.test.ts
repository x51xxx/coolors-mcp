import { Blend, Hct } from "@material/material-color-utilities";
import { describe, expect, it } from "vitest";

import { argbToRgb, rgbToArgb } from "../../conversions.js";
import { harmonize } from "../harmonization.js";

describe("harmonize", () => {
  it("matches Material Color Utilities Blend.harmonize at factor 0.5", () => {
    const pairs: Array<[number, number]> = [
      [Hct.from(10, 50, 50).toInt(), Hct.from(350, 50, 50).toInt()],
      [Hct.from(350, 50, 50).toInt(), Hct.from(10, 50, 50).toInt()],
      [0xff6750a4, 0xff00ff00],
      [0xffff0000, 0xff0000ff],
    ];
    for (const [design, source] of pairs) {
      const mine = rgbToArgb(
        harmonize(argbToRgb(design), argbToRgb(source), 0.5),
      );
      expect(mine >>> 0).toBe(Blend.harmonize(design, source) >>> 0);
    }
  });

  it("rotates by at most half the gap across 0°/360° (regression)", () => {
    const out = Hct.fromInt(
      rgbToArgb(
        harmonize(
          argbToRgb(Hct.from(10, 50, 50).toInt()),
          argbToRgb(Hct.from(350, 50, 50).toInt()),
          0.5,
        ),
      ),
    );
    // 20° apart → rotate 10° toward 350°, i.e. land near 0°, not 355°
    const d = Math.min(Math.abs(out.hue - 0), 360 - Math.abs(out.hue - 0));
    expect(d).toBeLessThan(2);
  });
});
