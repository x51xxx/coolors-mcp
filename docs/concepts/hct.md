# HCT Color System

HCT (Hue, Chroma, Tone) is the color space behind Material Design 3's dynamic color. Coolors MCP does not reimplement it: every HCT value is computed by Google's [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) (`Hct` and its solver, wrapped in `src/color/hct/hct-solver.ts` and `hct-class.ts`), so the numbers match Material's own tooling.

## The three components

| Component  | Computed from       | Range                                   | Meaning                                                   |
| ---------- | ------------------- | --------------------------------------- | --------------------------------------------------------- |
| **Hue**    | CAM16 hue angle     | 0–360°                                  | Which color family                                        |
| **Chroma** | CAM16 chroma        | 0 up to ~113 in sRGB (`#ff0000`: 113.4) | Colorfulness; the reachable maximum depends on hue & tone |
| **Tone**   | CIE L\* (D65 white) | 0–100                                   | Perceptual lightness: 0 = black, 100 = white              |

Hue and chroma come from the CAM16 color appearance model under Material's default viewing conditions: D65 white point, adapting luminance ≈ 11.72 cd/m² (200 lux), background L\* 50, average surround, illuminant not discounted.

## Real values

From `convert_color` with `to: "hct"`:

| Color     | HCT                       |
| --------- | ------------------------- |
| `#6750a4` | `hct(299.0, 47.9, 40.1)`  |
| `#0000ff` | `hct(282.8, 87.2, 32.3)`  |
| `#ff0000` | `hct(27.4, 113.4, 53.2)`  |
| `#00ff00` | `hct(142.1, 108.4, 87.7)` |
| `#ffff00` | `hct(111.1, 75.5, 97.1)`  |
| `#808080` | `hct(209.5, 1.9, 53.6)`   |
| `#ffffff` | `hct(209.5, 2.9, 100.0)`  |
| `#000000` | `hct(0.0, 0.0, 0.0)`      |

CAM16 hue is not HSL hue: pure blue sits at 282.8° (HSL 240°) and pure red at 27.4° (HSL 0°). HSL lightness is not tone either — `#ffff00` and `#0000ff` are both `hsl(…, 100%, 50%)`, but their tones are 97.1 and 32.3.

`hct(h, c, t)` is also accepted as **input** by every tool, e.g. `hct(299, 48, 40)` → `#6750a4`.

## Tone is L\*

Tone is exactly CIE L\*. `convert_color` shows the same number both ways: `#6750a4` → `lab(40.08, 29.43, -42.24)` and `hct(299.0, 47.9, 40.1)`.

When an HCT color is converted to sRGB, the requested tone is kept. The only error left is from rounding to 8-bit sRGB: a sweep over 24 hues × 4 chromas × tones 1–99 landed within 0.25 L\* of the requested tone.

## Out-of-gamut chroma is reduced, never tone

Many hue/chroma/tone combinations do not exist in sRGB. The solver keeps hue and tone and lowers chroma to the most it can reach:

| Requested              | Result    | Converted back           |
| ---------------------- | --------- | ------------------------ |
| `hct(120, 200, 50)`    | `#6d7f00` | `hct(120.1, 52.8, 50.0)` |
| `hct(299, 48, 90)`     | `#e9ddff` | `hct(299.7, 20.2, 90.0)` |
| `hct(282.8, 87.2, 80)` | `#bfc2ff` | `hct(282.9, 34.6, 80.1)` |

The reachable chroma depends on both hue and tone (library `maxChroma(hue, tone)`):

| Tone | Hue 299 (violet) | Hue 120 (yellow-green) |
| ---- | ---------------- | ---------------------- |
| 10   | 47.6             | 23.6                   |
| 30   | 77.2             | 39.1                   |
| 40   | 87.5             | 46.1                   |
| 50   | 77.5             | 52.8                   |
| 70   | 51.8             | 65.8                   |
| 90   | 20.2             | 78.0                   |

Violet peaks around tone 40; yellow-green keeps getting more colorful toward light tones. So a tonal palette has a constant hue and a constant _requested_ chroma, but its very light and very dark tones are usually less chromatic than requested (tone 90 of the `#6750a4` palette is `#e9ddff`, chroma 20.2).

## Greys keep a little chroma

Under these viewing conditions CAM16 does not map neutral greys to exactly zero chroma: `#808080` has chroma 1.9 and white 2.9, both at hue ≈ 209.5°; only black is exactly `hct(0.0, 0.0, 0.0)`. In practice:

- The hue of a grey or near-grey is meaningless; do not compare hues of low-chroma colors (this is a known weak spot of [theme matching](/concepts/theme-matching)).
- Re-toning a grey in HCT keeps that residual chroma. Example: `check_contrast` suggests `#767677` (not `#767676`) as the AA fix for `#888888` on `#ffffff`.
- Thresholds that mean "colorful" sit above the residual: Material's image scorer drops colors with chroma < 5, and the dislike check needs chroma > 16.

## Why tone matters for contrast

WCAG 2.x contrast depends only on relative luminance, and L\* is a function of luminance alone. So two colors' tones determine their contrast ratio, whatever their hue and chroma (up to 8-bit rounding). This is why Material defines its roles as tone pairs.

A sweep of tone pairs (6 hues, chroma 0/16/48, every tone 0–100, measured with the library's `getContrastRatio`) gave these worst cases:

| Tone difference | Lowest WCAG ratio found | Worst pair  |
| --------------- | ----------------------- | ----------- |
| 40              | 3.15:1                  | T60 vs T100 |
| 50              | 4.47:1                  | T50 vs T100 |
| 60              | 6.43:1                  | T40 vs T100 |
| 70              | 9.13:1                  | T0 vs T70   |

A 40-tone gap is enough for 3:1. A 50-tone gap is only _about_ 4.5:1 and falls just short at the light end, so check the actual pair with `check_contrast`, or let `fix_contrast` search the tone for you.

Pairs from the `#6750a4` primary palette, measured with `check_contrast`:

| Pair                                       | Tones      | WCAG    |
| ------------------------------------------ | ---------- | ------- |
| `#ffffff` on `#6750a4` (onPrimary/primary) | T100 / T40 | 6.44:1  |
| `#22005d` on `#e9ddff` (container pair)    | T10 / T90  | 13.25:1 |
| `#381e72` on `#cfbcff` (dark primary pair) | T20 / T80  | 7.70:1  |

`fix_contrast` relies on the same property: it keeps the HCT hue and chroma of the color it adjusts and binary-searches only the tone (see [Accessibility](/concepts/accessibility)).

## Where the tools use HCT

- `convert_color` (`to: "hct"`) and `hct()` input everywhere
- `generate_tonal_palette`, `generate_material_theme`, `generate_theme_css`, `generate_theme_from_image` — tonal palettes ([Material Design](/concepts/material-design))
- `generate_tonal_scale`, `generate_state_colors`, `generate_semantic_palette`
- `fix_contrast` and the fix suggestion in `check_contrast` — tone search
- `generate_palette` (`space: "hct"`, the default), `adjust_color` (`space: "hct"`), `generate_gradient` (`interpolation: "hct"`), `generate_palette_with_locks` (`colorSpace: "hct"`)
- `match_theme_color`, `match_theme_colors_batch`, `refactor_css_with_theme` — HCT distance ([Theme Matching](/concepts/theme-matching))
- `extract_image_colors` scoring and the disliked-color check ([Image Analysis](/concepts/image-analysis))

## See Also

- [Color Spaces](/concepts/color-spaces) — all spaces the tools read and write
- [Material Design](/concepts/material-design) — core palettes and role tones
- [Accessibility](/concepts/accessibility) — WCAG, APCA and the tone-search fix
- [Theme Matching](/concepts/theme-matching) — HCT distance in practice
