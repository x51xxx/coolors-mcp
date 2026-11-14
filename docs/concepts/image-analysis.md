# Image Color Analysis

`extract_image_colors` and `generate_theme_from_image` use the image pipeline from Google's Material Color Utilities: **Celebi quantization** followed by Material's **Score** ranking. The code is vendored in `src/color/quantize/` and `src/color/score/`, and driven by `src/color/extract-colors.ts`. Parameters are in [Image Extraction tools](/tools/image-extraction).

## Input

Both tools take raw pixels, not files or URLs:

```json
{
  "imageData": {
    "width": 2,
    "height": 1,
    "data": [103, 80, 164, 255, 232, 163, 61, 255]
  }
}
```

- `data` is a flat RGBA array of integers 0–255, and its length must equal `width × height × 4`.
- At most **65,536 pixels** (e.g. 256 × 256). Downscale larger images before sending; the palette barely changes.
- Violations are rejected before any work is done (`isError: true`):

```text
Invalid arguments for tool 'extract_image_colors': imageData: data length must equal width * height * 4 (RGBA)
```

## Pipeline

1. **Pixels.** RGBA is converted to opaque colors. Pixels with alpha below 1% are skipped; any other alpha value is ignored.
2. **Sampling.** If there are more pixels than the `quality` budget, every _n_-th pixel is kept:

   | `quality`          | Max pixels kept | Quantizer clusters |
   | ------------------ | --------------- | ------------------ |
   | `low`              | 5,000           | 64                 |
   | `medium` (default) | 10,000          | 128                |
   | `high`             | 25,000          | 256                |

3. **Near-black / near-white filter.** Pixels whose luma (0.299 R + 0.587 G + 0.114 B) is ≤ 12.75 or ≥ 242.25 (the outer 5% at each end) are dropped.
4. **Quantization (Celebi).** A **Wu** quantizer builds a 32 × 32 × 32 RGB histogram (5 bits per channel) and repeatedly cuts the box with the highest variance, placing each cut to maximize the variance between the two halves. The box colors seed **WSMeans**, a weighted k-means in L\*a\*b\* that de-duplicates identical pixels, uses the triangle inequality to skip comparisons, and runs at most 10 iterations. The result is a map of cluster color → pixel count.
5. **Scoring (Material Score).** See below. Returns up to `maxColors` colors.
6. **Report.** For each color: hex, RGB, HCT, `population` and `percentage`. The percentage is the share of the **sampled, filtered** pixels, not of the original image.

## Material Score

Score ranks clusters for use as a UI theme seed:

1. Build a population histogram over HCT hue (1° bins). For each hue, the _excited proportion_ is the share of pixels within a 30° window around it.
2. Drop clusters with **chroma < 5** (effectively grey) or an excited proportion **≤ 1%**.
3. Score the rest:

   ```text
   score = 100 × excitedProportion × 0.7  +  (chroma − 48) × w
   w = 0.1 below chroma 48, 0.3 above it
   ```

4. Pick colors in score order, skipping any whose hue is within _D_ degrees of a color already picked. _D_ starts at 90° and drops one degree at a time, down to 15°, until enough colors are found.
5. If nothing survives the filter, Score returns the fallback **Google Blue `#4285F4`**.

Step 4 means **similar hues collapse**. An image that is 50% `#1976d2`, 30% `#0d47a1` and 20% `#d32f2f` returns only two colors, because the two blues (HCT hue 259.4° and 268.7°) are less than 15° apart:

```text
# Extracted Color Palette

## Color 1
- Hex: #1976d2
- RGB: rgb(25, 118, 210)
- HCT: H:259.4° C:57.4 T:49.3
- Usage: 50.0%

## Color 2
- Hex: #d32f2f
- RGB: rgb(211, 47, 47)
- HCT: H:23.6° C:83.3 T:47.1
- Usage: 20.0%
```

## extract_image_colors

`extract_image_colors` runs the pipeline above with the requested `quality` and `maxColors`. A 10 × 10 test image (60% `#6750a4`, 28% `#e8a33d`, 12% `#2e7d32`) with `format: "palette"`:

```text
# Extracted Color Palette

## Color 1
- Hex: #6750a4
- RGB: rgb(103, 80, 164)
- HCT: H:299.0° C:47.9 T:40.1
- Usage: 60.0%

## Color 2
- Hex: #e8a33d
- RGB: rgb(232, 163, 61)
- HCT: H:72.9° C:47.0 T:72.0
- Usage: 28.0%

## Color 3
- Hex: #2e7d32
- RGB: rgb(46, 125, 50)
- HCT: H:145.6° C:53.0 T:46.3
- Usage: 12.0%
```

`format: "json"` returns the same data as an array of `{ hct, hex, percentage, population, rgb }` objects, with unrounded numbers. `format: "css"` returns `--extracted-color-N` custom properties.

### Fallback for grey images

If every scored color is the Google Blue fallback (no pixel colorful enough), `extract_image_colors` runs again **without** the near-black/near-white filter and **without** scoring, and ranks clusters by population. You get the image's real dominant colors, greys and white included. An 8 × 8 image, half `#ffffff` and half `#808080`:

```text
# Extracted Color Palette

## Color 1
- Hex: #808080
- RGB: rgb(128, 128, 128)
- HCT: H:209.5° C:1.9 T:53.6
- Usage: 50.0%

## Color 2
- Hex: #ffffff
- RGB: rgb(255, 255, 255)
- HCT: H:209.5° C:2.9 T:100.0
- Usage: 50.0%
```

`extract_image_colors` does **not** fix disliked colors: a dark yellow-green image returns its dark yellow-green.

## generate_theme_from_image

1. Extract with `quality: "high"`, up to 8 colors, with disliked colors fixed (hue 90–111°, chroma > 16, tone < 65 → tone 70).
2. **Primary** is the top-scored color. **Secondary** is the most hue-distant of the next three. **Tertiary** is the remaining color farthest in hue from both.
3. If the primary is the Google Blue fallback, the tool returns an error result (`isError: true`) instead of a theme:

   ```text
   The image has no sufficiently colorful pixels to seed a theme (Material's scorer fell back to #4285F4). Use a more colorful image, or call generate_material_theme with an explicit sourceColor.
   ```

4. A Material theme is generated from the primary only, with the same palettes and tones as `generate_material_theme` (see [Material Design](/concepts/material-design)). The theme's secondary and tertiary roles come from the primary's hue, not from the image. The image's secondary and tertiary colors are only listed under "Source Colors".
5. Only the primary, surface and background role groups of the selected mode (`isDark`) are printed.

For the three-color test image above:

```text
# Material Design 3 Theme from Image

## Source Colors
- Primary: #6750a4 (60.0%)
- Secondary: #2e7d32 (12.0%)
- Tertiary: #e8a33d (28.0%)

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

::: tip Output details

- `includeCustomColors: false` lists only the primary source color; with `true` (default) the secondary and tertiary picks are listed too.
- When the primary was a fixed disliked color, its usage is that of the original cluster: an all-`#6b6b1e` image gives `Primary: #b0af5b (100.0%)`.

:::

## Limitations

- At most 65,536 pixels per call, and at most 25,000 of them are analyzed (`quality: "high"`).
- Percentages are relative to the sampled pixels left after the near-black/near-white filter.
- Hues closer than 15° are merged in scored results, so tonal variations of one hue (light/dark blue) come back as a single color.
- Pixels near black or white never seed a scored palette; they only appear through the grey-image fallback.

## See Also

- [Material Design](/concepts/material-design) — what happens to the extracted primary
- [HCT Color System](/concepts/hct) — hue and chroma used by the scorer
- [Image Extraction tools](/tools/image-extraction) — parameters and output formats
