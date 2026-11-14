# Image Extraction Tools

Two tools work on image pixels. Two more check colors against the "universally disliked" rule that the image tools use.

- [`extract_image_colors`](#extract-image-colors): dominant colors of an image
- [`generate_theme_from_image`](#generate-theme-from-image): a Material Design 3 theme seeded from an image
- [`analyze_color_likability`](#analyze-color-likability): check one color against the dislike rule
- [`fix_disliked_colors_batch`](#fix-disliked-colors-batch): check and fix up to 100 colors

All four return plain text. For how quantization and scoring work, see [Image Analysis](/concepts/image-analysis).

## Image input: `imageData`

The server cannot open image files or URLs. The image tools take decoded pixels as JSON:

```json
{
  "imageData": {
    "width": 2,
    "height": 2,
    "data": [
      103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164, 255, 255, 193, 7, 255
    ]
  }
}
```

| Field    | Type      | Rules                                                                                                                       |
| -------- | --------- | --------------------------------------------------------------------------------------------------------------------------- |
| `width`  | integer   | > 0                                                                                                                         |
| `height` | integer   | > 0                                                                                                                         |
| `data`   | integer[] | Flat RGBA values 0–255, row by row. **Length must equal `width × height × 4`**, and at most 262 144 values (65 536 pixels). |

The limit is on the total pixel count, not on each side. 256×256 and 512×128 are both accepted, and 257×256 is rejected. Violations fail schema validation:

```text
Invalid arguments for tool 'extract_image_colors': imageData: data length must equal width * height * 4 (RGBA)
Invalid arguments for tool 'extract_image_colors': imageData.data: Too big: expected array to have <=262144 items
Invalid arguments for tool 'extract_image_colors': imageData.data.0: Too big: expected number to be <=255
```

Pixels with alpha 0–2 are skipped as transparent. All other alpha values are ignored: the color is used as if it were opaque.

### Getting pixel data as an agent

An agent has to decode the image, **downscale it**, and send the RGBA array in the tool call. The payload is large, because every pixel becomes four numbers in JSON. These are the measured sizes of the arguments with random pixel values (the worst case):

| Size    | Pixels | JSON size |
| ------- | ------ | --------- |
| 32×32   | 1 024  | ~15 KB    |
| 64×64   | 4 096  | ~60 KB    |
| 128×128 | 16 384 | ~240 KB   |
| 256×256 | 65 536 | ~960 KB   |

Larger inputs gain little. Extraction samples at most 5 000, 10 000 or 25 000 pixels (by `quality`), taking every n-th pixel, so 64×64 is usually enough.

This Python script, using Pillow, prints the `imageData` argument for a file:

```python
import json, sys
from PIL import Image

img = Image.open(sys.argv[1]).convert("RGBA")  # always 4 channels
img.thumbnail((64, 64), Image.Resampling.NEAREST)  # keeps aspect ratio
w, h = img.size
print(json.dumps({"imageData": {"width": w, "height": h, "data": list(img.tobytes())}}))
```

::: tip Resampling matters for flat graphics
Smoothing filters, which are Pillow's default for `thumbnail`, blend colors along edges. The scorer favors chroma, so a small blended cluster can outrank the real dominant color. On a 300×200 test image (violet, teal and amber areas), the default filter made `#614caa` (0.4% of pixels) the top color instead of `#6750a4`. `NEAREST`, as in the script above, gave `#6750a4` (58.8%), `#009688` (32.8%) and `#ffc107` (8.4%).
:::

---

## `extract_image_colors`

Extracts the dominant colors of an image with Material Color Utilities' quantizer and scorer.

### Parameters

| Parameter   | Type    | Required | Default    | Description                                                     |
| ----------- | ------- | -------- | ---------- | --------------------------------------------------------------- |
| `imageData` | object  | Yes      | –          | `{ width, height, data }`, see [above](#image-input-imagedata). |
| `maxColors` | integer | No       | `5`        | Upper bound on the number of colors, 1–20.                      |
| `quality`   | string  | No       | `"medium"` | `"low"`, `"medium"` or `"high"`.                                |
| `format`    | string  | No       | `"json"`   | `"json"`, `"css"` or `"palette"`.                               |

### How colors are chosen

1. **Sample.** Transparent pixels are dropped, then every n-th pixel is kept up to the quality cap: `low` 5 000 pixels and 64 clusters, `medium` 10 000 and 128, `high` 25 000 and 256.
2. **Filter.** Near-black and near-white pixels are dropped: approximate luminance `0.299R + 0.587G + 0.114B` below 5% or above 95%.
3. **Quantize** with Material's Celebi quantizer into at most the cluster count above.
4. **Score** with Material's `Score`. Clusters with HCT chroma below 5 are dropped, and so are clusters whose hue neighborhood (±15°) covers 1% of pixels or less. The rest are ranked by how common their hue is and by chroma (target 48). Picked colors must be at least 15° apart in hue. Similar hues therefore collapse into one color, and you can get fewer than `maxColors`.
5. **Fallback.** If nothing survives scoring (a grey or white image), the tool runs again without filter and scorer and returns the most common clusters. You get the image's real colors, including white and grey.

`percentage` is relative to the pixels left after step 2. Disliked colors are **not** fixed here (compare [`generate_theme_from_image`](#generate-theme-from-image)).

::: warning Not fully deterministic
As in Material Color Utilities, the quantizer's k-means refinement starts from random cluster assignments. In our runs, images with a few flat colors gave the same result every time. On images with many near-identical colors, such as anti-aliased edges or photos, the minor colors and their percentages can differ slightly between calls. On the smoothed test image from the tip above, one call returned `#ffc502` and another `#ffc900`.
:::

### Examples

The 2×2 image above (three violet pixels, one amber) with the default `json` format:

```text
[
  {
    "hct": {
      "c": 47.8565263749703,
      "h": 298.980997210704,
      "t": 40.08324408746242
    },
    "hex": "#6750a4",
    "percentage": 75,
    "population": 3,
    "rgb": {
      "b": 164,
      "g": 80,
      "r": 103
    }
  },
  {
    "hct": {
      "c": 60.45579561962854,
      "h": 86.12876916046787,
      "t": 81.5193230003677
    },
    "hex": "#ffc107",
    "percentage": 25,
    "population": 1,
    "rgb": {
      "b": 7,
      "g": 193,
      "r": 255
    }
  }
]
```

The same image with `"format": "css"`:

```text
:root {
  --extracted-color-1: #6750a4; /* 75.0% */
  --extracted-color-2: #ffc107; /* 25.0% */
}

/* Color Details */
/* Color 1: #6750a4
   RGB: rgb(103, 80, 164)
   HCT: hct(299.0, 47.9, 40.1)
   Population: 75.0%
*/

/* Color 2: #ffc107
   RGB: rgb(255, 193, 7)
   HCT: hct(86.1, 60.5, 81.5)
   Population: 25.0%
*/
```

`"format": "palette"` gives Markdown:

```text
# Extracted Color Palette

## Color 1
- Hex: #6750a4
- RGB: rgb(103, 80, 164)
- HCT: H:299.0° C:47.9 T:40.1
- Usage: 75.0%

## Color 2
- Hex: #ffc107
- RGB: rgb(255, 193, 7)
- HCT: H:86.1° C:60.5 T:81.5
- Usage: 25.0%
```

### Edge cases

**No colorful pixels.** For three white pixels and one `#808080`, the fallback returns the real colors:

```json
{
  "imageData": {
    "width": 2,
    "height": 2,
    "data": [
      255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 128, 128, 128,
      255
    ]
  },
  "format": "palette"
}
```

```text
# Extracted Color Palette

## Color 1
- Hex: #ffffff
- RGB: rgb(255, 255, 255)
- HCT: H:209.5° C:2.9 T:100.0
- Usage: 75.0%

## Color 2
- Hex: #808080
- RGB: rgb(128, 128, 128)
- HCT: H:209.5° C:1.9 T:53.6
- Usage: 25.0%
```

**Similar hues collapse.** Two `#6750a4` pixels, one `#46328c` and one white pixel return a single color. The white pixel is filtered out, both violets share a hue, and the more chromatic one wins:

```text
# Extracted Color Palette

## Color 1
- Hex: #46328c
- RGB: rgb(70, 50, 140)
- HCT: H:295.6° C:50.5 T:28.1
- Usage: 33.3%
```

**Transparent pixels.** In a 2×2 image with one opaque red pixel and three pixels at alpha 0, only `#ff0000` is returned, at 100.0%.

---

## `generate_theme_from_image`

Picks a source color from the image and builds a Material Design 3 scheme from it. The scheme uses the same core palettes and tones as [`generate_material_theme`](/tools/material-design#generate-material-theme).

### Parameters

| Parameter             | Type    | Required | Default | Description                                                     |
| --------------------- | ------- | -------- | ------- | --------------------------------------------------------------- |
| `imageData`           | object  | Yes      | –       | `{ width, height, data }`, see [above](#image-input-imagedata). |
| `isDark`              | boolean | No       | `false` | Print the dark scheme instead of the light one.                 |
| `includeCustomColors` | boolean | No       | `true`  | List the secondary and tertiary colors picked from the image.   |

### What it does

1. Extracts up to 8 colors at `high` quality with the same filter and scorer as `extract_image_colors`, but **without** the grey fallback. **Disliked colors are fixed** to tone 70 (see [the dislike rule](#analyze-color-likability)).
2. **Primary** is the top-scored color. **Secondary** is the color among the next three whose hue differs most from the primary. **Tertiary** is the remaining color furthest in hue from both.
3. Builds the Material scheme from the primary color.
4. Prints the source colors with their share of the image, then **10 roles** for one mode: `primary`, `onPrimary`, `primaryContainer`, `onPrimaryContainer`, `surface`, `onSurface`, `surfaceVariant`, `onSurfaceVariant`, `background` and `onBackground`. For all 23 roles of both modes, pass the printed primary to `generate_material_theme`.

With `includeCustomColors: false`, only the primary source color is listed. The secondary and tertiary picks are for information only. They do not change the scheme, which comes from the primary color alone.

### Example

A 4×4 image with 10 violet `#6750a4`, 4 teal `#009688` and 2 amber `#ffc107` pixels:

```json
{
  "imageData": {
    "width": 4,
    "height": 4,
    "data": [
      103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164,
      255, 103, 80, 164, 255, 103, 80, 164, 255, 103, 80, 164, 255, 103, 80,
      164, 255, 103, 80, 164, 255, 103, 80, 164, 255, 0, 150, 136, 255, 0, 150,
      136, 255, 0, 150, 136, 255, 0, 150, 136, 255, 255, 193, 7, 255, 255, 193,
      7, 255
    ]
  }
}
```

```text
# Material Design 3 Theme from Image

## Source Colors
- Primary: #6750a4 (62.5%)
- Secondary: #ffc107 (12.5%)
- Tertiary: #009688 (25.0%)

## Theme Colors (Light Mode)

### Primary
- primary: #6750a4
- onPrimary: #ffffff
- primaryContainer: #e9ddff
- onPrimaryContainer: #22005d

### Surface
- surface: #fffbff
- onSurface: #1c1b1e
- surfaceVariant: #e7e0eb
- onSurfaceVariant: #49454e

### Background
- background: #fffbff
- onBackground: #1c1b1e
```

Amber is listed as secondary because its hue is furthest from violet, even though teal covers more pixels. With `"isDark": true, "includeCustomColors": false`:

```text
# Material Design 3 Theme from Image

## Source Colors
- Primary: #6750a4 (62.5%)

## Theme Colors (Dark Mode)

### Primary
- primary: #cfbcff
- onPrimary: #381e72
- primaryContainer: #4f378a
- onPrimaryContainer: #e9ddff

### Surface
- surface: #1c1b1e
- onSurface: #e6e1e6
- surfaceVariant: #49454e
- onSurfaceVariant: #cac4cf

### Background
- background: #1c1b1e
- onBackground: #e6e1e6
```

### Edge cases

**No colorful pixels.** Unlike `extract_image_colors`, this tool has no fallback. A white or grey image returns a tool error:

```text
The image has no sufficiently colorful pixels to seed a theme (Material's scorer fell back to #4285F4). Use a more colorful image, or call generate_material_theme with an explicit sourceColor.
```

**A disliked dominant color is fixed.** For a 2×1 image of `#7a6a1f` (a dark yellow-green), `extract_image_colors` returns `#7a6a1f`. This tool seeds the theme from the tone-70 fix:

```text
# Material Design 3 Theme from Image

## Source Colors
- Primary: #beab59 (100.0%)

## Theme Colors (Light Mode)

### Primary
- primary: #6e5e00
…
```

The percentage is the share of the original color it replaces.

---

## `analyze_color_likability`

Checks whether a color falls in the "universally disliked" zone and, by default, returns a fix.

### The dislike rule

This is Material Color Utilities' `DislikeAnalyzer`, based on Palmer & Schloss (2010): people consistently dislike dark yellow-greens, which they associate with biological waste. A color is disliked when **all three** of these hold, with each value rounded to an integer first:

| Value              | Condition |
| ------------------ | --------- |
| HCT hue (CAM16)    | 90°–111°  |
| HCT chroma (CAM16) | > 16      |
| HCT tone (L\*)     | < 65      |

The fix keeps hue and chroma and sets **tone 70**. Chroma can shift by a fraction when the color is re-solved: `#7a6a1f` goes from chroma 34.9 to 35.1. The same rule is used by `generate_theme_from_image`, `generate_palette`, `design_ui_palette`, `audit_ui_colors` and `audit_design_md`.

### Parameters

| Parameter | Type    | Required | Default | Description                                         |
| --------- | ------- | -------- | ------- | --------------------------------------------------- |
| `color`   | string  | Yes      | –       | Color to analyze. Any supported color syntax.       |
| `autoFix` | boolean | No       | `true`  | Include the tone-70 fix when the color is disliked. |

### Examples

A disliked color:

```json
{ "color": "#7a6a1f" }
```

```text
# Color Likability Analysis

## Input Color: #7a6a1f

### HCT Values
- Hue: 98.2°
- Chroma: 34.9
- Tone: 45.0

### Analysis Result
⚠️ **This color is universally disliked**

This color falls in the "bile zone" - dark yellow-greens that are universally associated with biological waste and rotting food.

**Reason:**
- Hue is in yellow-green range (90-111°): 98°
- Chroma is above threshold (>16): 35
- Tone is dark (<65): 45

### Recommended Fix
**Fixed Color:** #beab59
- Hue: 98.4° (preserved)
- Chroma: 35.1 (preserved)
- Tone: 70.0 (lightened to 70)

The fix preserves the hue and saturation but lightens the color to make it more pleasant.
```

With `"autoFix": false`, the output stops after **Reason**. For example, CSS `olive` is hue 111.0, chroma 49.6 and tone 51.9, so it is disliked.

A likable yellow-green:

```json
{ "color": "#d6d07a" }
```

```text
…
### Analysis Result
✅ **This color is likable**

This color does not fall in the universally disliked range.
- Although in yellow-green hue range, the light tone (82) makes it pleasant.
```

### Edge cases

- **Looks olive, is not disliked.** `#6b7c3a` has hue 124.0, outside 90–111, so it is likable. Use the tool instead of guessing from the hex code.
- **Low chroma** in the hue range is fine: `#8c8a70` (hue 109.8, chroma 13.0) gives `the low chroma (13) makes it neutral and acceptable`.
- **Invalid input** returns a tool error: `Error: Invalid color format: bad`.

---

## `fix_disliked_colors_batch`

Runs the same check on a list of colors. Each disliked color is replaced by its tone-70 fix, and all other colors are kept.

### Parameters

| Parameter         | Type     | Required | Default | Description                                         |
| ----------------- | -------- | -------- | ------- | --------------------------------------------------- |
| `colors`          | string[] | Yes      | –       | Colors to analyze, 1–100 items.                     |
| `includeAnalysis` | boolean  | No       | `false` | Add HCT values for each color, rounded to integers. |

### Example

```json
{ "colors": ["#7a6a1f", "#6750a4", "#8b8000", "#d6d07a", "nope"] }
```

```text
# Batch Color Likability Analysis

## Summary
- Total colors: 5
- Disliked colors found: 2
- Percentage disliked: 40.0%

## Results

- **#7a6a1f** → **#beab59** (fixed)
- **#6750a4** ✓ (already liked)
- **#8b8000** → **#baad37** (fixed)
- **#d6d07a** ✓ (already liked)
- **nope**: ❌ Invalid color format

## Note
Disliked colors have been automatically fixed by lightening their tone to 70 while preserving hue and chroma. This makes them more pleasant while maintaining their essential character.
```

An invalid color is reported on its own line and does not fail the call. It still counts in `Total colors` and in the percentage.

With `"includeAnalysis": true`:

```text
…
- **#7a6a1f** → **#beab59** (fixed)
  - Original HCT: (98°, 35, 45)
  - Fixed HCT: (98°, 35, 70)
- **#6750a4** ✓ (already liked)
  - HCT: (299°, 48, 40)
…
```

## Related

- [Image Analysis concepts](/concepts/image-analysis)
- [Material Design Tools](/tools/material-design)
- [Agent Tools](/tools/agent-tools): `describe_color` also flags disliked colors
