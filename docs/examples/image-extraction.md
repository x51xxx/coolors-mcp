# Image Extraction Examples

Two tools work with images:

- `extract_image_colors`: the dominant colors of an image, as JSON, CSS variables or a readable palette
- `generate_theme_from_image`: a Material Design 3 theme seeded from the image's best theme color

Every result on this page is real output from the current server. Parameter details are on [Image Extraction](/tools/image-extraction). The algorithm is explained in [Image Analysis](/concepts/image-analysis).

## What the Tools Accept

The tools do not open files or URLs. They take raw pixels:

<!-- prettier-ignore -->
```json
{
  "imageData": {
    "width": 4,
    "height": 2,
    "data": [99, 102, 241, 255, 99, 102, 241, 255, 99, 102, 241, 255, 99, 102, 241, 255, 236, 72, 153, 255, 236, 72, 153, 255, 255, 255, 255, 255, 255, 255, 255, 255]
  }
}
```

- `data` is a flat list of R, G, B, A values (integers 0–255), four per pixel, row by row.
- `data.length` must equal `width × height × 4`.
- At most 65 536 pixels (for example 256 × 256). Larger images must be downscaled first.

::: warning Pixel data is a large payload
The pixels travel as JSON numbers inside the tool call, so they count toward the assistant's context. In a measurement with random pixels, 64 × 64 came to about 58 000 characters of JSON and 256 × 256 to about 937 000. Downscale to around 64 px on the longest side. A thumbnail is enough to find dominant colors.
:::

## Preparing the Pixels

Your assistant has to decode and downscale the image itself, usually by running a short script. In Claude Code, for example, it can run this Python script (requires Pillow). This exact script produced the 64 × 48 input used in the tip below:

```python
import json, sys
from PIL import Image

img = Image.open(sys.argv[1]).convert("RGBA")       # always 4 channels
img.thumbnail((64, 64), Image.Resampling.NEAREST)    # ≤ 64 px, keeps aspect ratio
w, h = img.size
data = list(img.tobytes())
assert len(data) == w * h * 4
print(json.dumps({"width": w, "height": h, "data": data}))
```

The output is the `imageData` object. If the assistant cannot run code, it cannot produce pixel data. In that case, pick the color some other way, for example with an eyedropper, and call `generate_material_theme` with it.

::: tip Use nearest-neighbour for logos and flat graphics
Smooth resampling blends edge pixels into new in-between colors. The extractor ranks colors by how vivid they are within each hue family, not by pixel count, so it can pick one of those blended edge shades.

Test image: a 400 × 300 PNG, about 65% `#6366f1`, with a `#ec4899` circle on white, reduced to 64 × 48 px. With Pillow's default (bicubic) resampling, `extract_image_colors` returned `#5e61f1` with `Usage: 2.1%`. With `Image.Resampling.NEAREST` it returned the real colors:

```text
## Color 1
- Hex: #6366f1
- RGB: rgb(99, 102, 241)
- HCT: H:284.6° C:68.0 T:50.1
- Usage: 90.7%

## Color 2
- Hex: #ec4899
- RGB: rgb(236, 72, 153)
- HCT: H:356.0° C:79.2 T:56.8
- Usage: 9.3%
```

:::

## Extracting Colors

The examples below use the 4 × 2 image from [What the Tools Accept](#what-the-tools-accept): four `#6366f1` pixels, two `#ec4899` pixels and two white pixels.

> "Extract the main colors from this image."

Tool call: `extract_image_colors { "imageData": <4×2 image> }`

```text
[
  {
    "hct": {
      "c": 67.96373289279813,
      "h": 284.63430585146614,
      "t": 50.10448316412558
    },
    "hex": "#6366f1",
    "percentage": 66.66666666666666,
    "population": 4,
    "rgb": {
      "b": 241,
      "g": 102,
      "r": 99
    }
  },
  {
    "hct": {
      "c": 79.2247583857399,
      "h": 355.9564794954552,
      "t": 56.84818545954954
    },
    "hex": "#ec4899",
    "percentage": 33.33333333333333,
    "population": 2,
    "rgb": {
      "b": 153,
      "g": 72,
      "r": 236
    }
  }
]
```

Two things to note:

- **White is missing and the percentages add up to 100% without it.** Pixels that are almost white or almost black (rough luminance outside 5–95%) are dropped before colors are picked. `percentage` is a share of the remaining pixels, here 4 of 6 and 2 of 6.
- **`maxColors` (default 5) is a maximum.** Only two colors qualified.

The other formats show the same colors.

Tool call: `extract_image_colors { "imageData": <4×2 image>, "format": "css", "maxColors": 3 }`

```text
:root {
  --extracted-color-1: #6366f1; /* 66.7% */
  --extracted-color-2: #ec4899; /* 33.3% */
}

/* Color Details */
/* Color 1: #6366f1
   RGB: rgb(99, 102, 241)
   HCT: hct(284.6, 68.0, 50.1)
   Population: 66.7%
*/
…
```

`"format": "palette"` gives the Markdown list shown in the tip above. `quality` (`low` / `medium` / `high`) controls how many pixels are sampled and how many clusters are used.

### Images Without Colorful Pixels

For an image with only white and grey, `extract_image_colors` still reports what is there:

Tool call: `extract_image_colors { "imageData": { "width": 2, "height": 2, "data": [255,255,255,255, 255,255,255,255, 255,255,255,255, 128,128,128,255] }, "format": "palette" }`

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

## Generating a Theme from an Image

> "Make a Material theme from this image."

Tool call: `generate_theme_from_image { "imageData": <4×2 image> }`

```text
# Material Design 3 Theme from Image

## Source Colors
- Primary: #6366f1 (66.7%)
- Secondary: #ec4899 (33.3%)

## Theme Colors (Light Mode)

### Primary
- primary: #494bd6
- onPrimary: #ffffff
- primaryContainer: #e1e0ff
- onPrimaryContainer: #07006c

### Surface
- surface: #fffbff
- onSurface: #1c1b1f
- surfaceVariant: #e4e1ec
- onSurfaceVariant: #46464f

### Background
- background: #fffbff
- onBackground: #1c1b1f
```

With `"isDark": true` the same call returns the dark roles:

```text
…
## Theme Colors (Dark Mode)

### Primary
- primary: #c0c1ff
- onPrimary: #1000a9
- primaryContainer: #2f2ebe
- onPrimaryContainer: #e1e0ff

### Surface
- surface: #1c1b1f
- onSurface: #e5e1e6
- surfaceVariant: #46464f
- onSurfaceVariant: #c8c5d0
…
```

The response lists only the primary, surface and background roles. The theme is seeded from the `Primary` source color, so for the complete light and dark schemes (secondary, tertiary, error, outline…) call `generate_material_theme { "sourceColor": "#6366f1" }`. That returns the same values; see [Creating Themes](/examples/creating-themes).

A theme needs a colorful seed, so the white-and-grey image above is rejected with `isError: true`:

```text
The image has no sufficiently colorful pixels to seed a theme (Material's scorer fell back to #4285F4). Use a more colorful image, or call generate_material_theme with an explicit sourceColor.
```

## Disliked Colors

Dark yellow-greens are widely disliked, and logos and photos sometimes contain them. `extract_image_colors` reports colors as they are. Here is a 4 × 4 test image with ten `#6b6b1e` pixels, four `#2563eb` and two near-white:

```text
## Color 1
- Hex: #6b6b1e
- RGB: rgb(107, 107, 30)
- HCT: H:111.1° C:37.1 T:43.9
- Usage: 71.4%

## Color 2
- Hex: #2563eb
- RGB: rgb(37, 99, 235)
- HCT: H:272.2° C:69.6 T:46.1
- Usage: 28.6%
```

To use them in a UI, pass them through `fix_disliked_colors_batch`:

Tool call: `fix_disliked_colors_batch { "colors": ["#6b6b1e", "#2563eb"] }`

```text
# Batch Color Likability Analysis

## Summary
- Total colors: 2
- Disliked colors found: 1
- Percentage disliked: 50.0%

## Results

- **#6b6b1e** → **#b0af5b** (fixed)
- **#2563eb** ✓ (already liked)
…
```

`generate_theme_from_image` makes this fix to its seed automatically. For this image its source lines read `Primary: #b0af5b (71.4%)` and `Secondary: #2563eb (28.6%)`: the percentage is the share of the original `#6b6b1e` cluster that the lightened seed replaces.

## Input Errors

Both tools check the pixel data before doing anything:

| Problem                                  | Result (`isError: true`)                                                                                            |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `data.length` ≠ `width × height × 4`     | `Invalid arguments for tool 'extract_image_colors': imageData: data length must equal width * height * 4 (RGBA)`    |
| More than 65 536 pixels (300 × 300 here) | `Invalid arguments for tool 'extract_image_colors': imageData.data: Too big: expected array to have <=262144 items` |

## Next Steps

- [Creating Themes](/examples/creating-themes): full Material schemes, CSS and exports
- [CSS Refactoring](/examples/css-refactoring): apply the theme to existing CSS
- [Image Analysis Concepts](/concepts/image-analysis): quantization and scoring
- [Image Extraction Tools](/tools/image-extraction): parameter reference
