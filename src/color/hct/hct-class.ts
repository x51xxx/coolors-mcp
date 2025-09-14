/**
 * HCT Class wrapper for Material Color Utilities compatibility
 */

import { argbToRgb, rgbToArgb } from "../conversions.js";
import { hctToRgb, rgbToHct } from "./hct-solver.js";

/**
 * HCT class compatible with Material Color Utilities
 */
export class Hct {
  get chroma(): number {
    return this._chroma;
  }
  /**
   * Set the chroma of this color. Chroma may decrease because chroma has a
   * different maximum for any given hue and tone.
   * @param newChroma 0 <= newChroma < ?
   */
  set chroma(newChroma: number) {
    const rgb = hctToRgb({ c: newChroma, h: this._hue, t: this._tone });
    this._argb = rgbToArgb(rgb);
    const hct = rgbToHct(rgb);
    this._hue = hct.h;
    this._chroma = hct.c;
    this._tone = hct.t;
  }
  get hue(): number {
    return this._hue;
  }
  /**
   * Set the hue of this color. Chroma may decrease because chroma has a
   * different maximum for any given hue and tone.
   * @param newHue 0 <= newHue < 360; invalid values are corrected.
   */
  set hue(newHue: number) {
    const rgb = hctToRgb({ c: this._chroma, h: newHue, t: this._tone });
    this._argb = rgbToArgb(rgb);
    const hct = rgbToHct(rgb);
    this._hue = hct.h;
    this._chroma = hct.c;
    this._tone = hct.t;
  }

  get tone(): number {
    return this._tone;
  }

  /**
   * Set the tone of this color. Chroma may decrease because chroma has a
   * different maximum for any given hue and tone.
   * @param newTone 0 <= newTone <= 100; invalid values are corrected.
   */
  set tone(newTone: number) {
    const rgb = hctToRgb({ c: this._chroma, h: this._hue, t: newTone });
    this._argb = rgbToArgb(rgb);
    const hct = rgbToHct(rgb);
    this._hue = hct.h;
    this._chroma = hct.c;
    this._tone = hct.t;
  }

  private _argb: number;

  private _chroma: number;

  private _hue: number;

  private _tone: number;

  private constructor(argb: number) {
    this._argb = argb;
    const rgb = argbToRgb(argb);
    const hct = rgbToHct(rgb);
    this._hue = hct.h;
    this._chroma = hct.c;
    this._tone = hct.t;
  }

  /**
   * Create an HCT color from hue, chroma, and tone.
   * @param hue 0 <= hue < 360; invalid values are corrected.
   * @param chroma 0 <= chroma < ?; Chroma may decrease because chroma has a
   *     different maximum for any given hue and tone.
   * @param tone 0 <= tone <= 100; invalid values are corrected.
   * @return HCT representation of a color in default viewing conditions.
   */
  static from(hue: number, chroma: number, tone: number): Hct {
    const rgb = hctToRgb({ c: chroma, h: hue, t: tone });
    const argb = rgbToArgb(rgb);
    return new Hct(argb);
  }

  /**
   * Create an HCT color from a color.
   * @param argb ARGB representation of a color.
   * @return HCT representation of a color in default viewing conditions
   */
  static fromInt(argb: number): Hct {
    return new Hct(argb);
  }

  /**
   * @return ARGB representation of an HCT color.
   */
  toInt(): number {
    return this._argb;
  }
}
