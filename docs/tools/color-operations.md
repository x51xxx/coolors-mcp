# Color Operations Tools

Four building blocks for working with individual colors: convert between formats, measure how different two colors are, check a text/background pair, and adjust a color.

| Tool                                | Purpose                                                          |
| ----------------------------------- | ---------------------------------------------------------------- |
| [`convert_color`](#convert-color)   | Convert a color to hex, rgb, hsl, lab, hct, oklab or oklch       |
| [`color_distance`](#color-distance) | Distance between two colors (ΔE2000, ΔE94, ΔE76, RGB)            |
| [`check_contrast`](#check-contrast) | WCAG 2.x ratio and/or APCA Lc for a foreground/background pair   |
| [`adjust_color`](#adjust-color)     | Lighten, darken, saturate, hue-shift, tint, shade, mix and so on |

Palette generation now has its own page: [Palettes & Gradients](/tools/palettes).

## Color input

Every color parameter on this page accepts the same syntaxes:

| Syntax           | Examples                                                               |
| ---------------- | ---------------------------------------------------------------------- |
| Hex              | `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa` (alpha is ignored)             |
| Bare hex         | `6750a4` (6 or 8 digits)                                               |
| CSS named colors | `rebeccapurple`, `teal`, …                                             |
| `rgb()/rgba()`   | commas or spaces, decimals, percentages (clamped to 0–255)             |
| `hsl()/hsla()`   | hue wraps; saturation and lightness are clamped                        |
| `oklch()`        | `oklch(62.8% 0.2577 29.23)`                                            |
| `oklab()`        | `oklab(49.6% 0.03 -0.13)`                                              |
| `hct()`          | `hct(299.0, 47.9, 40.1)` (hue, chroma, tone; see [HCT](/concepts/hct)) |

`hwb()`, `lab()`, `lch()`, `color()` and `color-mix()` are **not** accepted. Invalid hex such as `#ggg` is rejected.

::: tip Errors
A color that cannot be parsed returns a tool result with `isError: true` and a message such as `Invalid color format: nope`. Arguments that break the schema (unknown enum value, wrong type, over a limit) also return `isError: true`, with `Invalid arguments for tool '<name>': …`.
:::

---

## `convert_color`

Converts one color to another notation. The input can be any supported syntax; the output is a single string in the requested format.

### Parameters

| Parameter | Type   | Required | Default | Limits                                                                | Description                                                                |
| --------- | ------ | -------- | ------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `color`   | string | yes      | –       | –                                                                     | Color to convert (hex, CSS name, rgb(), hsl(), oklch(), oklab(), or hct()) |
| `to`      | string | yes      | –       | enum: `hex` \| `rgb` \| `hsl` \| `lab` \| `hct` \| `oklab` \| `oklch` | Target format                                                              |

### Output formats

Real output for `{"color": "#6750a4", "to": …}`:

| `to`    | Output                        | Notes                                                                |
| ------- | ----------------------------- | -------------------------------------------------------------------- |
| `hex`   | `#6750a4`                     | lowercase `#rrggbb`                                                  |
| `rgb`   | `rgb(103, 80, 164)`           | integer channels                                                     |
| `hsl`   | `hsl(256, 34%, 48%)`          | rounded to integers, so a round trip through HSL can shift the color |
| `lab`   | `lab(40.08, 29.43, -42.24)`   | CIELAB with a D65 white point, 2 decimals (CSS `lab()` uses D50)     |
| `hct`   | `hct(299.0, 47.9, 40.1)`      | hue, chroma, tone; 1 decimal                                         |
| `oklab` | `oklab(49.6% 0.0525 -0.1194)` | L as a percentage, a/b with 4 decimals                               |
| `oklch` | `oklch(49.6% 0.1305 293.7)`   | L as a percentage, chroma with 4 decimals, hue with 1                |

### Examples

```json
{ "color": "rebeccapurple", "to": "hex" }
```

```text
#663399
```

```json
{ "color": "hct(299.0, 47.9, 40.1)", "to": "hex" }
```

```text
#6750a4
```

```json
{ "color": "rgb(120%, -10, 300)", "to": "rgb" }
```

```text
rgb(255, 0, 255)
```

### Notes

- The `hct`, `oklch` and `oklab` outputs above convert back to exactly `#6750a4`. The rounded `hsl` output doesn't: `hsl(256, 34%, 48%)` converts back to `#6751a4`.
- The `lab` output can't be used as input at all, because `lab()` is not an accepted input syntax (`Invalid color format: lab(50 20 -30)`).
- Alpha is dropped: `#6750a480` converts to `#6750a4`.
- An unknown `to` value (for example `cmyk`) fails schema validation: `Invalid arguments for tool 'convert_color': to: Invalid option: expected one of "hex"|"rgb"|"hsl"|"lab"|"hct"|"oklab"|"oklch"`.

---

## `color_distance`

Calculates the difference between two colors. The default metric is CIEDE2000 (ΔE2000), the most perceptually accurate of the five. The others are there for comparison with other tools or legacy values.

### Parameters

| Parameter | Type   | Required | Default        | Limits                                                                      | Description            |
| --------- | ------ | -------- | -------------- | --------------------------------------------------------------------------- | ---------------------- |
| `color1`  | string | yes      | –              | –                                                                           | First color            |
| `color2`  | string | yes      | –              | –                                                                           | Second color           |
| `metric`  | string | no       | `"deltaE2000"` | enum: `euclidean` \| `deltaE76` \| `deltaE94` \| `deltaE2000` \| `weighted` | Distance metric to use |

### Metrics

| Metric       | What it computes                                                    | `#ff0000` vs `#00ff00` | `#6750a4` vs `#6751a5` |
| ------------ | ------------------------------------------------------------------- | ---------------------- | ---------------------- |
| `deltaE2000` | CIEDE2000 on CIELAB (D65)                                           | 86.61                  | 0.35                   |
| `deltaE94`   | CIE94, graphic-arts weights (kL = kC = kH = 1)                      | 73.43                  | 0.36                   |
| `deltaE76`   | Straight Euclidean distance in CIELAB                               | 170.57                 | 0.46                   |
| `euclidean`  | Euclidean distance on sRGB channels (0–255)                         | 360.62                 | 1.41                   |
| `weighted`   | sRGB channel differences weighted 0.3 / 0.59 / 0.11, then Euclidean | 168.78                 | 0.60                   |

`euclidean` and `weighted` are measured in 0–255 channel units, so their numbers aren't on the same scale as the ΔE metrics.

### Example

```json
{ "color1": "#6750a4", "color2": "rebeccapurple" }
```

```text
Distance between #6750a4 and rebeccapurple: 8.05
```

The output echoes both inputs as you wrote them and rounds the distance to 2 decimals.

### Reading ΔE2000

As a rule of thumb, values below 1 are not perceptible, 1–2 need close inspection, 2–10 are visible at a glance, and above 10 the colors look clearly different. [`check_palette_accessibility`](/tools/accessibility#check-palette-accessibility) treats ΔE2000 < 10 as indistinguishable by default. For more detail see [Distance Metrics](/concepts/distance-metrics).

### Notes

- `deltaE94` is not symmetric because it uses the first color's chroma as the reference: `#ff0000` → `#00ff00` is 73.43, and `#00ff00` → `#ff0000` is 68.80. The other four metrics are symmetric.
- An invalid color returns `isError: true` with `Invalid color format: <the bad input>`.

---

## `check_contrast`

Checks a foreground/background pair against WCAG 2.x, APCA, or both. When the pair has problems it also adds an "Agent Guidance" block: a hue-preserving AA fix, an optical-vibration warning, and color-blindness contrast drops. The full explanation of the thresholds and the guidance block is in [Accessibility → `check_contrast`](/tools/accessibility#check-contrast).

### Parameters

| Parameter    | Type    | Required | Default  | Limits                           | Description                                                                          |
| ------------ | ------- | -------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `algorithm`  | string  | no       | `"wcag"` | enum: `wcag` \| `apca` \| `both` | `wcag` (WCAG 2.x ratio), `apca` (Lc, WCAG 3 draft), or `both`                        |
| `background` | string  | yes      | –        | –                                | Background color                                                                     |
| `foreground` | string  | yes      | –        | –                                | Foreground/text color                                                                |
| `suggestFix` | boolean | no       | `true`   | –                                | Include the nearest hue-preserving AA fix and CVD/optical warnings when issues exist |

### Example

```json
{ "foreground": "#6750a4", "background": "#ffffff", "algorithm": "both" }
```

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 6.44:1
- AA (normal text):  ✓ Pass (need 4.5:1)
- AA (large text):   ✓ Pass (need 3:1)
- AAA (normal text): ✗ Fail (need 7:1)
- AAA (large text):  ✓ Pass (need 4.5:1)

## APCA (WCAG 3 draft)
Lc: 81.8 (dark text on light bg)
- Body text (|Lc| ≥ 75):    ✓ Pass
- Content text (|Lc| ≥ 60): ✓ Pass
- Large text (|Lc| ≥ 45):   ✓ Pass
- Spot / non-content (|Lc| ≥ 30): ✓ Pass
```

To find a passing color instead of only checking one, use [`fix_contrast`](/tools/agent-tools).

---

## `adjust_color`

Applies one adjustment to a color and returns the result as a hex string. Lightness, saturation and hue changes can run in OKLCH (the default), HCT, or classic HSL. The perceptual spaces keep hue steady and avoid muddy mixes.

### Parameters

| Parameter   | Type   | Required | Default   | Limits                                                                                                                            | Description                                                                                                                                                                                                    |
| ----------- | ------ | -------- | --------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `amount`    | number | no       | –         | –                                                                                                                                 | Amount of change: percent (0–100) for lighten/darken/saturate/desaturate/tint/shade, degrees (−360..360) for hue-shift, or the 0–1 weight of the first color for mix. Per-operation defaults are listed below. |
| `color`     | string | yes      | –         | –                                                                                                                                 | Color to adjust                                                                                                                                                                                                |
| `operation` | string | yes      | –         | enum: `lighten` \| `darken` \| `saturate` \| `desaturate` \| `hue-shift` \| `tint` \| `shade` \| `grayscale` \| `invert` \| `mix` | Adjustment operation                                                                                                                                                                                           |
| `space`     | string | no       | `"oklch"` | enum: `oklch` \| `hct` \| `hsl`                                                                                                   | Color space for the adjustment                                                                                                                                                                                 |
| `with`      | string | no       | –         | –                                                                                                                                 | Second color (only for `mix`)                                                                                                                                                                                  |

### Operations and `amount`

| Operation    | `amount` meaning                       | Default | `oklch`                                     | `hct`                     | `hsl`                      |
| ------------ | -------------------------------------- | ------- | ------------------------------------------- | ------------------------- | -------------------------- |
| `lighten`    | lightness points                       | 10      | L + amount / 100                            | tone + amount             | HSL L + amount             |
| `darken`     | lightness points                       | 10      | L − amount / 100                            | tone − amount             | HSL L − amount             |
| `saturate`   | percent                                | 10      | chroma × (1 + amount/100)                   | chroma × (1 + amount/100) | HSL S + amount             |
| `desaturate` | percent                                | 10      | chroma × (1 − amount/100)                   | chroma × (1 − amount/100) | HSL S − amount             |
| `hue-shift`  | degrees (negative = counter-clockwise) | 30      | rotate OKLCH hue                            | rotate HCT hue            | same as `oklch`            |
| `tint`       | percent of white, clamped 0–100        | **20**  | mix with white in OKLab                     | same                      | same                       |
| `shade`      | percent of black, clamped 0–100        | **20**  | mix with black in OKLab                     | same                      | same                       |
| `grayscale`  | ignored                                | –       | Rec. 601 luma (0.299 R + 0.587 G + 0.114 B) | same                      | same                       |
| `invert`     | ignored                                | –       | 255 − each sRGB channel                     | same                      | same                       |
| `mix`        | weight of `color`, 0–1                 | 0.5     | interpolate in OKLab                        | interpolate in OKLab      | plain sRGB channel average |

Out-of-gamut results are brought back into sRGB by reducing chroma: OKLCH keeps lightness and hue, and HCT keeps hue and tone.

::: warning Defaults
The schema description says "Default 10 / 30 / 0.5". `tint` and `shade` actually default to **20** (`tint` with no `amount` gives `#8272b7`, the same as `amount: 20`).
:::

### Examples

`lighten` with the default amount (10) in each space, for `#6750a4`:

| `space` | Result    |
| ------- | --------- |
| `oklch` | `#846ec5` |
| `hct`   | `#8069bf` |
| `hsl`   | `#836eb9` |

Mixing blue and yellow 50/50:

```json
{ "color": "#0000ff", "operation": "mix", "with": "#ffff00" }
```

```text
#6cabc7
```

The same call with `"space": "hsl"` averages the sRGB channels and returns `#808080` (grey).

`amount` for `mix` is the weight of `color`, so `1` returns `color` unchanged and `0` returns `with`:

```json
{ "color": "#6750a4", "operation": "mix", "with": "#ffcc00", "amount": 0.8 }
```

```text
#816c9a
```

### Errors and edge cases

| Input                             | Result (`isError: true`)                                  |
| --------------------------------- | --------------------------------------------------------- |
| `mix` without `with`              | `Error: 'with' is required for mix operation`             |
| `mix` with `amount: 50`           | `Error: mix amount must be between 0 and 1`               |
| `mix` with an unparsable `with`   | `Invalid color format: zzz`                               |
| unknown `operation` (e.g. `blur`) | `Invalid arguments for tool 'adjust_color': operation: …` |

- `mix` is the only operation that validates `amount`. For the others, large values saturate: `lighten` by 100 or `tint` by 150 gives `#ffffff`.
- `space` only affects `lighten`, `darken`, `saturate`, `desaturate`, `hue-shift` and `mix`. For `hue-shift`, `hsl` behaves like `oklch`. For `mix`, `hct` behaves like `oklch`.

---

## Related

- [Accessibility & CVD](/tools/accessibility): contrast details, color-blindness simulation, palette audits
- [Palettes & Gradients](/tools/palettes): harmonies, locked palettes, gradients, export
- [Agent Tools](/tools/agent-tools): `describe_color`, `fix_contrast` and other higher-level helpers
- [Color Spaces](/concepts/color-spaces), [HCT](/concepts/hct), [Distance Metrics](/concepts/distance-metrics)
