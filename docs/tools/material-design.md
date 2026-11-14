# Material Design Tools

Three tools build Material Design 3 colors in Google's HCT color space (hue and chroma from CAM16, tone = CIE L\*):

- [`generate_material_theme`](#generate-material-theme): light and dark color schemes from one source color
- [`harmonize_colors`](#harmonize-colors): shift, blend or warm/cool a set of colors
- [`generate_tonal_palette`](#generate-tonal-palette): one hue/chroma at any list of tones

All three return plain text, not JSON. Invalid colors return a tool error (`isError: true`) such as `Invalid color format: nope`. For background on HCT and Material roles, see [HCT Color Space](/concepts/hct) and [Material Design 3](/concepts/material-design).

---

## `generate_material_theme`

Generates the Material 3 color roles for a light and a dark scheme from one source color.

The tool first builds Material's core palettes from the source color's HCT values. This follows Material Color Utilities' `CorePalette`:

| Palette         | Hue             | Chroma                 |
| --------------- | --------------- | ---------------------- |
| primary         | source hue      | max(48, source chroma) |
| secondary       | source hue      | 16                     |
| tertiary        | source hue +60° | 24                     |
| neutral         | source hue      | 4                      |
| neutral variant | source hue      | 8                      |
| error           | 25              | 84                     |

Each role then takes one tone from one of those palettes.

### Parameters

| Parameter             | Type    | Required | Default | Description                                                            |
| --------------------- | ------- | -------- | ------- | ---------------------------------------------------------------------- |
| `sourceColor`         | string  | Yes      | –       | Source color for theme generation. Accepts any supported color syntax. |
| `includeCustomColors` | boolean | No       | `false` | Appends a `TONAL PALETTES` section (see below).                        |

### Roles

The output lists 23 roles per scheme, in alphabetical order. P = primary, S = secondary, T = tertiary, N = neutral, NV = neutral variant and E = error. The number is the tone.

| Role                   | Light | Dark |
| ---------------------- | ----- | ---- |
| `primary`              | P40   | P80  |
| `onPrimary`            | P100  | P20  |
| `primaryContainer`     | P90   | P30  |
| `onPrimaryContainer`   | P10   | P90  |
| `secondary`            | S40   | S80  |
| `onSecondary`          | S100  | S20  |
| `secondaryContainer`   | S90   | S30  |
| `onSecondaryContainer` | S10   | S90  |
| `tertiary`             | T40   | T80  |
| `onTertiary`           | T100  | T20  |
| `tertiaryContainer`    | T90   | T30  |
| `onTertiaryContainer`  | T10   | T90  |
| `error`                | E40   | E80  |
| `onError`              | E100  | E20  |
| `errorContainer`       | E90   | E30  |
| `onErrorContainer`     | E10   | E90  |
| `background`           | N99   | N10  |
| `onBackground`         | N10   | N90  |
| `surface`              | N99   | N10  |
| `onSurface`            | N10   | N90  |
| `surfaceVariant`       | NV90  | NV30 |
| `onSurfaceVariant`     | NV30  | NV80 |
| `outline`              | NV50  | NV60 |

These tones match Material Color Utilities' `Scheme`, with one exception: dark `onErrorContainer` uses tone 90, as Material's current dynamic colors do. The output has no `surfaceContainer*`, `inverse*`, `outlineVariant`, `shadow` or `scrim` roles.

### Example

```json
{ "sourceColor": "#6750A4" }
```

```text
Material Design 3 Theme
Source Color: #6750A4

LIGHT THEME:
  background: #fffbff
  error: #ba1a1a
  errorContainer: #ffdad6
  onBackground: #1c1b1e
  onError: #ffffff
  onErrorContainer: #410002
  onPrimary: #ffffff
  onPrimaryContainer: #22005d
  onSecondary: #ffffff
  onSecondaryContainer: #1e192b
  onSurface: #1c1b1e
  onSurfaceVariant: #49454e
  onTertiary: #ffffff
  onTertiaryContainer: #31101d
  outline: #7a757f
  primary: #6750a4
  primaryContainer: #e9ddff
  secondary: #625b71
  secondaryContainer: #e8def8
  surface: #fffbff
  surfaceVariant: #e7e0eb
  tertiary: #7e5260
  tertiaryContainer: #ffd9e3

DARK THEME:
  background: #1c1b1e
  error: #ffb4ab
  errorContainer: #93000a
  onBackground: #e6e1e6
  onError: #690005
  onErrorContainer: #ffdad6
  onPrimary: #381e72
  onPrimaryContainer: #e9ddff
  onSecondary: #332d41
  onSecondaryContainer: #e8def8
  onSurface: #e6e1e6
  onSurfaceVariant: #cac4cf
  onTertiary: #4a2532
  onTertiaryContainer: #ffd9e3
  outline: #948f99
  primary: #cfbcff
  primaryContainer: #4f378a
  secondary: #cbc2db
  secondaryContainer: #4a4458
  surface: #1c1b1e
  surfaceVariant: #49454e
  tertiary: #efb8c8
  tertiaryContainer: #633b48
```

`Source Color` repeats your input exactly as you typed it.

### `includeCustomColors`

With `includeCustomColors: true`, the output gets one more section. It lists the primary palette at the 13 standard tones (0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100) and the secondary and tertiary palettes at tones 40 and 80. It does not add Material "custom color" groups (harmonized extra colors with their own containers).

```json
{ "sourceColor": "#00695c", "includeCustomColors": true }
```

```text
…
  tertiary: #accae5
  tertiaryContainer: #2c4a60

TONAL PALETTES:
Primary: #000000, #00201b, #003730, #005046, #006b5e, #008676, #00a38f, #31bfaa, #56dbc5, #76f8e1, #b5ffef, #f3fffa, #ffffff
Secondary: #4a635e, #b1ccc5
Tertiary: #446279, #accae5
```

### Notes

- Primary chroma is raised to at least 48. A muted source still gets a vivid primary: `#00695c` has chroma 35.7, but its light `primary` is `#006b5e` and `primaryContainer` is `#76f8e1`.
- This tool does not apply the disliked-color fix. `generate_theme_from_image` does (see [Image Extraction](/tools/image-extraction#analyze-color-likability)).
- To get the same palettes as CSS custom properties, use [`generate_theme_css`](/tools/theme-matching#generate-theme-css).

---

## `harmonize_colors`

Adjusts a set of colors in HCT space. What it does, and what `factor` means, depends on `method`.

### Parameters

| Parameter | Type     | Required | Default       | Description                                                 |
| --------- | -------- | -------- | ------------- | ----------------------------------------------------------- |
| `colors`  | string[] | Yes      | –             | Colors to process, 2–10 items.                              |
| `method`  | string   | No       | `"harmonize"` | `"blend"`, `"harmonize"` or `"temperature"`.                |
| `factor`  | number   | No       | `0.5`         | Strength, 0–1. Its meaning depends on `method` (see table). |

### Methods

| Method        | What it does                                                                                                                                                                                                                                                                | `factor = 0`               | Result              |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------- |
| `harmonize`   | The first color is the source and stays unchanged. The hue of every other color rotates toward the source hue by `factor` × the hue difference, capped at 15°. Chroma and tone are kept.                                                                                    | No change                  | One color per input |
| `blend`       | Interpolates hue (shortest way round), chroma and tone from one color to the next, left to right: the result of colors 1 and 2 is blended with color 3, and so on.                                                                                                          | The first color            | **One** color       |
| `temperature` | `0.5` changes nothing. Above 0.5, hues move toward HCT hue 30° (warm orange). Below 0.5, they move toward 210° (cool cyan-blue). At 1 and 0, every hue lands on about 30° or 210°. Cool colors warm up twice as fast as warm ones, and warm colors cool down twice as fast. | Maximum cooling (hue 210°) | One color per input |

For `temperature`, "warm" means an HCT hue of 60° or less, or 300° or more.

### Examples

**`harmonize`: how `factor` changes the result.** The source is `#6750a4` (hue 299.0) and the color is `#3f51b5` (hue 278.7):

```json
{ "colors": ["#6750a4", "#3f51b5"], "factor": 0.25 }
```

| `factor` | Result             | HCT hue of the result |
| -------- | ------------------ | --------------------- |
| `0`      | `#6750a4, #3f51b5` | 278.7 (unchanged)     |
| `0.25`   | `#6750a4, #4a4eb4` | 284.0                 |
| `0.5`    | `#6750a4, #534cb3` | 288.6                 |
| `1`      | `#6750a4, #5c4ab1` | 293.6 (15° cap)       |

**`harmonize` with the default factor.** Colors far from the source hit the 15° cap. Here, factor 0.5 and factor 1 give the same output:

```json
{ "colors": ["#6750a4", "#ff6b6b", "#4ecdc4"] }
```

```text
Harmonized Colors (harmonize):
Original: #6750a4, #ff6b6b, #4ecdc4
Result: #6750a4, #fc6992, #4ccbd7
```

**`blend`** always returns one color:

```json
{ "colors": ["#e91e63", "#673ab7"], "method": "blend", "factor": 0.5 }
```

```text
Harmonized Colors (blend):
Original: #e91e63, #673ab7
Result: #b027ab
```

With three colors and `factor: 0.3`, `["#e91e63", "#9c27b0", "#673ab7"]` gives `#b823a3`. With `factor: 1` it gives the last color, `#673ab7`.

**`temperature`**:

```json
{ "colors": ["#2196f3", "#ff5722"], "method": "temperature", "factor": 1 }
```

```text
Harmonized Colors (temperature):
Original: #2196f3, #ff5722
Result: #ea6b52, #ff5637
```

With `factor: 0`, the same input gives `#00a1b2, #00a0b1`. With `factor: 0.5` (the default), it returns the input unchanged.

### Errors

- An invalid color returns `One or more invalid color formats`.
- Fewer than 2 colors fails schema validation: `Invalid arguments for tool 'harmonize_colors': colors: Too small: expected array to have >=2 items`.

---

## `generate_tonal_palette`

Generates one tonal palette: the input color's own HCT hue and chroma at each requested tone. The chroma is not raised to 48, unlike the primary palette of `generate_material_theme`. If a tone cannot hold the full chroma in sRGB, the chroma is reduced and the tone is kept.

### Parameters

| Parameter | Type     | Required | Default                                    | Description                                                             |
| --------- | -------- | -------- | ------------------------------------------ | ----------------------------------------------------------------------- |
| `color`   | string   | Yes      | –                                          | Base color for the palette.                                             |
| `tones`   | number[] | No       | `[0,10,20,30,40,50,60,70,80,90,95,99,100]` | Tones to generate, each 0–100, at most 32 items. Fractions are allowed. |

### Example

```json
{ "color": "#6750a4" }
```

```text
Tonal Palette for #6750a4
HCT: h=299.0°, c=47.9, t=40.1

Tone 0: #000000
Tone 10: #22005d
Tone 20: #381e72
Tone 30: #4f378a
Tone 40: #6750a4
Tone 50: #8069bf
Tone 60: #9a83db
Tone 70: #b69df7
Tone 80: #cfbcff
Tone 90: #e9ddff
Tone 95: #f6eeff
Tone 99: #fffbff
Tone 100: #ffffff
```

Custom tones:

```json
{ "color": "#00695c", "tones": [0, 25, 50, 75, 100] }
```

```text
Tonal Palette for #00695c
HCT: h=182.6°, c=35.7, t=39.4

Tone 0: #000000
Tone 25: #00443b
Tone 50: #2f8476
Tone 75: #76c7b7
Tone 100: #ffffff
```

### Notes

- **Own chroma vs. Material primary.** For `#00695c`, tone 40 here is `#046b5e` (chroma 35.7). In `generate_material_theme`, light `primary` is `#006b5e` (chroma 48).
- **Order is kept.** Tones are returned in the order you pass them. Fractional tones work: `[12.5, 97]` returns `Tone 12.5: #270762` and `Tone 97: #fbf4ff`.
- **`tones: []`** returns only the header, with no tones. Leave out `tones` to get the defaults.
- **Grey input** keeps a small residual chroma: `#808080` is `h=209.5°, c=1.9, t=53.6`, so its tones are very slightly tinted (tone 10: `#1b1c1c`).
- **Out-of-range tones** fail validation, for example `tones: [101]`: `Invalid arguments for tool 'generate_tonal_palette': tones.0: Too big: expected number to be <=100`.

## Related

- [Material Design 3 concepts](/concepts/material-design)
- [HCT Color Space](/concepts/hct)
- [`generate_theme_css`](/tools/theme-matching#generate-theme-css): the same core palettes as CSS custom properties
- [`generate_theme_from_image`](/tools/image-extraction#generate-theme-from-image): a Material theme from image pixels
