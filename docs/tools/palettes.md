# Palettes & Gradients

Tools for building multi-color palettes and exporting them:

| Tool                                                          | Purpose                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`generate_palette`](#generate-palette)                       | Color-theory harmonies from one base color                                 |
| [`generate_palette_with_locks`](#generate-palette-with-locks) | Fill a palette around colors you want to keep                              |
| [`generate_gradient`](#generate-gradient)                     | Interpolate between 2–32 stops in 7 color spaces                           |
| [`export_palette`](#export-palette)                           | Write colors as CSS, SCSS, Tailwind, W3C tokens, JSON or a DESIGN.md block |

For design-system scales and semantic colors, see [Visual Cohesion](/tools/cohesion). For Material 3 schemes, see [Material Design](/tools/material-design). All tools accept any supported color syntax (see [Color input](/tools/color-operations#color-input)).

---

## `generate_palette`

Generates a harmony (analogous, triadic, etc.) from a base color. It works in perceptual HCT space by default, avoids "bile zone" dark yellow-greens, and by default describes each swatch so an agent can tell what it produced.

### Parameters

| Parameter        | Type    | Required | Default       | Limits                                                                                                                                                      | Description                                                             |
| ---------------- | ------- | -------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `allowDisliked`  | boolean | no       | `false`       | –                                                                                                                                                           | Allow dark yellow-green "bile zone" colors                              |
| `baseColor`      | string  | yes      | –             | –                                                                                                                                                           | Base color for palette generation                                       |
| `count`          | number  | no       | `5`           | 3–12                                                                                                                                                        | Number of colors to generate                                            |
| `includeDetails` | boolean | no       | `true`        | –                                                                                                                                                           | Include perceptual name, temperature, tone and best text ink per swatch |
| `space`          | string  | no       | `"hct"`       | enum: `hct` \| `oklch` \| `ryb` \| `hsl`                                                                                                                    | Color wheel to rotate on                                                |
| `type`           | string  | no       | `"analogous"` | enum: `monochromatic` \| `analogous` \| `complementary` \| `split-complementary` \| `triadic` \| `tetradic` \| `square` \| `compound` \| `shades-and-tints` | Type of color harmony                                                   |

### Harmony types

| `type`                | Hue offsets from the base (in order) |
| --------------------- | ------------------------------------ |
| `analogous`           | 0, −30, +30, −60, +60                |
| `complementary`       | 0, 180                               |
| `split-complementary` | 0, 150, 210                          |
| `triadic`             | 0, 120, 240                          |
| `tetradic`            | 0, 60, 180, 240                      |
| `square`              | 0, 90, 180, 270                      |
| `compound`            | 0, 30, 180, 210, −30                 |
| `monochromatic`       | base hue only; tone ramp             |
| `shades-and-tints`    | base hue ±7°; tone ramp              |

How the swatches are built:

- **Hue-rotation types.** Swatch 1 is the base color, unchanged. The other swatches take the offsets in order and alternate tone by +8 / −8 so neighbours separate. When `count` is larger than the offset list, the list repeats with tones ±22 and 78 % of the chroma. In `hct` space tones are kept within 16–90 and chroma stays at least 12.
- **`monochromatic` / `shades-and-tints`.** The base color itself is not included. Swatches run evenly from tone 92 (light) to tone 14 (dark), with chroma tapered toward both ends. `shades-and-tints` also shifts the hue by up to ±7° across the ramp for warmer highlights and cooler shadows.
- **Spaces.** `hct` (default) and `oklch` rotate perceptual hue. `hsl` rotates the HSL wheel. `ryb` rotates the painter's red-yellow-blue wheel (red ↔ green, blue ↔ orange, yellow ↔ violet). For `monochromatic` and `shades-and-tints`, `ryb` gives the same colors as `hct`.
- **Disliked colors.** Unless `allowDisliked` is `true`, a generated swatch that lands in the dark yellow-green "bile zone" is lightened to tone 70. In the hue-rotation types the base (swatch 1) is kept as-is even when it is disliked: `#6b6a1e` with `analogous` still starts with `#6b6a1e`.

### Examples

Default (analogous, HCT, with details):

```json
{ "baseColor": "#6750a4" }
```

```text
Generated analogous palette (HCT):
1. #6750a4 — medium dark violet (cool, tone 40, best text: #ffffff)
2. #4d70be — blue (cool, tone 48, best text: #ffffff)
3. #713277 — dark magenta (neutral, tone 32, best text: #ffffff)
4. #007aab — sky-blue (cool, tone 48, best text: #ffffff)
5. #802e4f — dark red (warm, tone 32, best text: #ffffff)

Notes:
- Balanced perceptual lightness and chroma in HCT space so harmonies maintain even visual weight.
```

Monochromatic ramp (the base `#6750a4` itself is not in the list):

```json
{ "baseColor": "#6750a4", "type": "monochromatic", "count": 5 }
```

```text
Generated monochromatic palette (HCT):
1. #eee4ff — very light muted plum (neutral, tone 92, best text: #0f0f17)
2. #bba7f0 — medium light violet (cool, tone 73, best text: #0f0f17)
3. #8871c5 — violet (cool, tone 53, best text: #ffffff)
4. #564389 — dark violet (cool, tone 34, best text: #ffffff)
5. #29194f — very dark soft violet (cool, tone 14, best text: #ffffff)
```

Painter's wheel complement, 4 colors (the second cycle is lighter and softer):

```json
{
  "baseColor": "#e63946",
  "type": "complementary",
  "space": "ryb",
  "count": 4,
  "includeDetails": false
}
```

```text
Generated complementary palette (RYB):
1. #e63946
2. #66eb5c
3. #e9a5aa
4. #aae9a5

Notes:
- Computed on the traditional artistic RYB color wheel (red↔green, blue↔orange, yellow↔violet).
```

### Notes

- The bile-zone fix lifts dark swatches to tone 70, which can flatten a ramp. With base `#6b6a1e` (a disliked dark olive), `monochromatic` returns `#eeebad, #b7b56f, #b0af5e, #b0af66, #b0ae78`: the three darkest swatches become near-identical. With `allowDisliked: true` you get the full ramp `… #838236, #525112, #262500`.
- `count` outside 3–12 fails schema validation (`count: Too small: expected number to be >=3`). An invalid base color gives `Invalid color format: blah`.

---

## `generate_palette_with_locks`

Builds a palette of `totalColors` that contains every color in `lockedColors` and fills the remaining slots. The search is deterministic, so the same input always gives the same palette.

### Parameters

| Parameter      | Type   | Required | Default     | Limits                                      | Description                                      |
| -------------- | ------ | -------- | ----------- | ------------------------------------------- | ------------------------------------------------ |
| `colorSpace`   | string | no       | `"oklch"`   | enum: `hsl` \| `lab` \| `hct` \| `oklch`    | Color space for generation/interpolation         |
| `lockedColors` | array  | yes      | –           | 1–19 items, strings                         | Colors that must be included                     |
| `mode`         | string | no       | `"harmony"` | enum: `harmony` \| `contrast` \| `gradient` | `harmony`, `contrast`, or `gradient` (see below) |
| `totalColors`  | number | yes      | –           | 2–20                                        | Total number of colors in the final palette      |

`lockedColors` must contain **fewer** colors than `totalColors`, so at least one color is generated.

### Modes

| `mode`     | How new colors are chosen                                                                                                                                                                                                                 | Uses `colorSpace`                                 | Output order                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------------------- |
| `harmony`  | Candidates sit at harmonic hue offsets from the **first** locked color (±30, ±60, 90, 120, 150, 180, 210, 240, 270) at five lightness levels. Each slot takes the candidate with the largest minimum ΔE2000 to every color chosen so far. | `oklch`, `hct`, `hsl`; `lab` behaves like `oklch` | locked colors first, then generated            |
| `contrast` | Same max-min ΔE2000 pick from a fixed OKLCH grid (hue every 15°, L 0.38/0.56/0.74/0.88, chroma 0.10/0.17).                                                                                                                                | ignored                                           | locked colors first, then generated            |
| `gradient` | Interpolates between consecutive locked colors. Needs **≥ 2** locked colors. Leftover slots go to the earliest segments.                                                                                                                  | `oklch`, `hct`, `lab` (CIELAB), `hsl`             | gradient order: lock 1, in-betweens, lock 2, … |

Because `harmony` picks the most distinct candidate for each slot, its results are varied rather than subtle. For close variations of one color, use [`generate_tonal_scale`](/tools/cohesion#generate-tonal-scale) or `generate_palette` with `type: "monochromatic"`. Generated colors avoid the disliked bile zone in `harmony` (`oklch`/`hct`/`lab`) and `contrast` mode.

### Examples

Harmony around one locked color:

```json
{ "lockedColors": ["#6750a4"], "totalColors": 5 }
```

```text
Generated palette with 1 locked colors:
1. #6750a4 (locked)
2. #a3ac41
3. #282b00
4. #ea807b
5. #39b0e8

Mode: harmony
Color space: oklch
Total colors: 5
```

Gradient through three locked colors (2 + 2 in-betweens):

```json
{
  "lockedColors": ["#1e3a8a", "#fbbf24", "#be123c"],
  "totalColors": 7,
  "mode": "gradient"
}
```

```text
Generated palette with 3 locked colors:
1. #1e3a8a (locked)
2. #95499a
3. #ea6e68
4. #fbbf24 (locked)
5. #f08b00
6. #df5218
7. #be123c (locked)

Mode: gradient
Color space: oklch
Total colors: 7
```

### Notes

- Locked colors are echoed exactly as you wrote them, not normalized: `["red", "navy"]` produces `1. red (locked)` … `4. navy (locked)`.
- Errors (`isError: true`):
  - `Error: Number of locked colors (2) must be less than total colors (2)`
  - `Gradient mode requires at least 2 locked colors`
  - `Invalid color format: nope`
  - `totalColors` above 20 or more than 19 locked colors fail schema validation.

---

## `generate_gradient`

Interpolates a gradient through 2–32 color stops and returns it as a numbered list, a hex list, or a CSS gradient.

### Parameters

| Parameter       | Type   | Required | Default    | Limits                                                                | Description                                                    |
| --------------- | ------ | -------- | ---------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| `colors`        | array  | yes      | –          | 2–32 items, strings                                                   | Color stops, in order                                          |
| `easing`        | string | no       | `"linear"` | enum: `linear` \| `ease-in` \| `ease-out` \| `ease-in-out`            | Easing function for the transition                             |
| `format`        | string | no       | `"array"`  | enum: `hex` \| `css-linear` \| `css-radial` \| `array`                | Output format                                                  |
| `interpolation` | string | no       | `"lab"`    | enum: `rgb` \| `hsl` \| `lab` \| `lch` \| `hct` \| `oklab` \| `oklch` | Color space for interpolation                                  |
| `steps`         | number | yes      | –          | 3–100                                                                 | **Total** number of output colors, including every input color |

### How `steps` works

- `steps` is the **total** length of the output, and **every input color appears in it** as a stop.
- `steps` must be **≥ the number of colors**. With exactly that many, the output is just your stops. A lower value is an error: `steps (3) must be at least the number of input colors (4)`.
- The `steps − 1` intervals are split across the segments, and any remainder goes to the earliest segments. For example, 3 stops with `steps: 6` puts 3 intervals in the first segment and 2 in the second.

### Interpolation spaces

All hue-based spaces take the shorter way around the hue circle. In `oklch`, `lch` and `hct`, a grey endpoint borrows the other endpoint's hue so the gradient doesn't swing through an unrelated hue.

Blue → yellow, `steps: 5`, `format: "hex"`:

| `interpolation` | Output                                        |
| --------------- | --------------------------------------------- |
| `rgb`           | `#0000ff, #4040bf, #808080, #bfbf40, #ffff00` |
| `hsl`           | `#0000ff, #00bfff, #00ff80, #40ff00, #ffff00` |
| `lab` (default) | `#0000ff, #9850d5, #ca8aaa, #eac476, #ffff00` |
| `lch`           | `#0000ff, #ff00ab, #ff0050, #ffa100, #ffff00` |
| `hct`           | `#0000ff, #007bae, #00afaf, #00e779, #ffff00` |
| `oklab`         | `#0000ff, #1d77e7, #6cabc7, #b5d797, #ffff00` |
| `oklch`         | `#0000ff, #0087ac, #00baae, #19f268, #ffff00` |

`rgb` passes through grey. `lab` and `oklab` cut straight through the color solid. `lch`, `hct`, `oklch` and `hsl` travel around the hue circle, and which way they go depends on each space's hue angles.

### Easing

Easing remaps the position `t` (0–1) within **each segment**: `ease-in` = t², `ease-out` = t(2 − t), `ease-in-out` = 2t² for t < 0.5, otherwise −1 + (4 − 2t)t. Black → white, `steps: 5`, `lab`:

| `easing`      | Output                                        |
| ------------- | --------------------------------------------- |
| `linear`      | `#000000, #3b3b3b, #777777, #b9b9b9, #ffffff` |
| `ease-in`     | `#000000, #141414, #3b3b3b, #878787, #ffffff` |
| `ease-out`    | `#000000, #676767, #b9b9b9, #ededed, #ffffff` |
| `ease-in-out` | `#000000, #212121, #777777, #dbdbdb, #ffffff` |

Because easing restarts at every stop, black → white → black with `ease-in` and `steps: 9` gives `#000000, #141414, #3b3b3b, #878787, #ffffff, #ededed, #b9b9b9, #676767, #000000`.

### Output formats

`array` (the default) is a numbered text report, not JSON:

```json
{ "colors": ["#0000ff", "#ffff00"], "steps": 5 }
```

```text
Generated gradient with 5 steps:
1. #0000ff
2. #9850d5
3. #ca8aaa
4. #eac476
5. #ffff00

Interpolation: lab
Easing: linear
Input colors: #0000ff → #ffff00
```

`css-linear` (always `90deg`) and `css-radial` (always `circle`) place the output colors at evenly spaced percentages:

```json
{
  "colors": ["#6750a4", "#ffffff", "#006a6a"],
  "steps": 7,
  "interpolation": "oklch",
  "format": "css-linear"
}
```

```text
linear-gradient(90deg, #6750a4 0.0%, #9689c4 16.7%, #c9c3e2 33.3%, #ffffff 50.0%, #b2cccb 66.7%, #679a99 83.3%, #006a6a 100.0%)
```

```json
{
  "colors": ["#ff6b6b", "#4ecdc4"],
  "steps": 3,
  "format": "css-radial",
  "interpolation": "oklab"
}
```

```text
radial-gradient(circle, #ff6b6b 0.0%, #c2a599 50.0%, #4ecdc4 100.0%)
```

`hex` is a comma-separated list, as in the tables above.

::: tip Uneven segments in CSS
Percentages are spaced evenly across all output colors, so a middle stop only lands at 50 % when both segments have the same number of intervals. With 3 stops and `steps: 6`, `#ffffff` sits at 60 %: `linear-gradient(90deg, #6750a4 0.0%, #9b87c2 20.0%, #cdc2e1 40.0%, #ffffff 60.0%, #8db2b2 80.0%, #006a6a 100.0%)`.
:::

### Errors

- Fewer than 2 colors, `steps` below 3 or above 100, or an unknown enum fail schema validation (`Invalid arguments for tool 'generate_gradient': …`).
- `steps` below the number of colors: `steps (3) must be at least the number of input colors (4)`.
- An unparsable stop: `Invalid color format: …`.

---

## `export_palette`

Writes a list of colors in a format you can paste into code or config. Every color is normalized to lowercase `#rrggbb`.

### Parameters

| Parameter | Type   | Required | Default | Limits                                                                   | Description                                                |
| --------- | ------ | -------- | ------- | ------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `colors`  | array  | yes      | –       | 1–256 items, strings                                                     | Palette colors                                             |
| `format`  | string | yes      | –       | enum: `css` \| `scss` \| `tailwind` \| `tokens` \| `json` \| `design-md` | Output format                                              |
| `names`   | array  | no       | –       | ≤ 256 items, strings; length must equal `colors`                         | Name for each color. Omitted: 50/100…900 scale (see below) |
| `prefix`  | string | no       | –       | –                                                                        | Prefix for variable/token names (e.g. `brand`)             |

### Naming rules

- **Slugification.** `names` and `prefix` are turned into token-safe slugs: diacritics are stripped, text is lowercased, every run of characters outside `a-z0-9` becomes `-`, and leading and trailing dashes are trimmed. `"Secondary Color"` → `secondary-color`, `"Tértiary!"` → `tertiary`, `"Brand"` → `brand`.
- **Default names** follow the color's position: `50, 100, 200, … 900` for the first 10 colors, then `1100, 1200, …` (`950` and `1000` are never used). They're assigned by position, not by lightness. A name that is missing, empty, or slugifies to nothing (`""`, `"!!!"`) gets its position's default.
- **Prefix.** In `css`, `scss`, `json` and `design-md` the prefix is prepended as `<prefix>-<name>`. In `tailwind` and `tokens` it becomes the **group key** instead; without a prefix the key is `palette` (Tailwind) or `color` (tokens). A prefix that slugifies to nothing is ignored.
- **Duplicates are an error.** If two colors end up with the same name after slugification, the call fails with `Duplicate token names after normalization: "primary" (colors 1 and 2). Give each color a distinct name.` Clashes with a default name count too: `names: ["100", "", "x"]` fails because color 2 defaults to `100`.

### Formats

Real output for:

```json
{
  "colors": ["#6750a4", "#625b71", "#7d5260"],
  "names": ["Primary", "Secondary Color", "Tértiary!"],
  "prefix": "Brand",
  "format": "css"
}
```

`css`:

```text
:root {
  --brand-primary: #6750a4;
  --brand-secondary-color: #625b71;
  --brand-tertiary: #7d5260;
}
```

`scss`:

```text
$brand-primary: #6750a4;
$brand-secondary-color: #625b71;
$brand-tertiary: #7d5260;
```

`tailwind` (snippet for `theme.extend.colors`, printed exactly like this):

```text
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        "brand": {
      "primary": "#6750a4",
      "secondary-color": "#625b71",
      "tertiary": "#7d5260",
        },
      },
    },
  },
};
```

`tokens` (W3C Design Tokens draft: `$type` / `$value`):

```text
{
  "brand": {
    "primary": {
      "$type": "color",
      "$value": "#6750a4"
    },
    "secondary-color": {
      "$type": "color",
      "$value": "#625b71"
    },
    "tertiary": {
      "$type": "color",
      "$value": "#7d5260"
    }
  }
}
```

`json` (hex, rgb and integer hsl per color):

```text
{
  "brand-primary": {
    "hex": "#6750a4",
    "hsl": "hsl(256, 34%, 48%)",
    "rgb": "rgb(103, 80, 164)"
  },
  …
}
```

`design-md` (a `colors:` block for the YAML front matter of a [DESIGN.md](/tools/design-md) file; values are quoted so `#` isn't read as a YAML comment):

```text
colors:
  brand-primary: "#6750a4"
  brand-secondary-color: "#625b71"
  brand-tertiary: "#7d5260"
```

With default names and no prefix, keys that start with a digit are quoted too:

```json
{ "colors": ["#eee4ff", "#bba7f0", "#8871c5"], "format": "design-md" }
```

```text
colors:
  "50": "#eee4ff"
  "100": "#bba7f0"
  "200": "#8871c5"
```

::: tip
Without `prefix`, default names are bare numbers (`--50`, `$50`, `"50"`). Pass a `prefix` (e.g. `"gray"` → `$gray-50`, `$gray-100`, …) to get namespaced variable names.
:::

### Errors

| Input                            | Message (`isError: true`)                                                  |
| -------------------------------- | -------------------------------------------------------------------------- |
| `names` length ≠ `colors` length | `Error: names array length (1) must match colors length (2).`              |
| two names with the same slug     | `Duplicate token names after normalization: "primary" (colors 1 and 2). …` |
| unparsable color                 | `Invalid color: nope`                                                      |
| unknown `format`                 | `Invalid arguments for tool 'export_palette': format: Invalid option: …`   |

---

## Related

- [Visual Cohesion](/tools/cohesion): tonal scales, state colors, semantic palettes, cohesion scoring
- [Accessibility & CVD](/tools/accessibility): check a palette for color-blind collisions
- [Material Design](/tools/material-design): Material 3 tonal palettes and themes
- [DESIGN.md](/tools/design-md): audit the exported `colors:` block
- [Color Spaces](/concepts/color-spaces), [HCT](/concepts/hct)
