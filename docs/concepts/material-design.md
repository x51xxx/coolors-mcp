# Material Design 3 Color System

Material Design 3 builds a whole color scheme from one **source color**: it derives a handful of tonal palettes in [HCT](/concepts/hct), then assigns every UI role (primary, onPrimary, surface…) a fixed tone from one of those palettes. Coolors MCP implements the classic Material 3 core palette and tone mapping. It does not implement scheme variants or contrast levels.

## What is implemented

| Implemented                                                             | Not implemented                                                                |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Core palette with Material's default ("tonal spot") chroma constants    | Scheme variants (vibrant, expressive, fidelity, content, monochrome, neutral…) |
| 23 color roles for light and dark                                       | Contrast levels (medium / high)                                                |
| Tonal palettes at any tone 0–100                                        | Surface-container roles, `outlineVariant`, `shadow`, `scrim`, inverse roles    |
| Hue harmonization, HCT blending, temperature shift (`harmonize_colors`) | Elevation, shape or typography tokens                                          |

Tools: `generate_material_theme`, `generate_theme_css`, `generate_tonal_palette`, `harmonize_colors`, and `generate_theme_from_image` (see [Image Analysis](/concepts/image-analysis)). Parameters are listed in [Material Design tools](/tools/material-design).

## Core palettes

Six tonal palettes are derived from the source color's HCT hue _h_ and chroma _c_ (`corePaletteFromRgb` in `src/color/hct/tonal-palette.ts`, same constants as Material Color Utilities' `CorePalette.of`):

| Palette         | Hue       | Chroma       |
| --------------- | --------- | ------------ |
| Primary         | _h_       | max(48, _c_) |
| Secondary       | _h_       | 16           |
| Tertiary        | _h_ + 60° | 24           |
| Neutral         | _h_       | 4            |
| Neutral variant | _h_       | 8            |
| Error           | 25°       | 84           |

Because primary chroma is at least 48, even a grey source produces a colorful primary. `#808080` has HCT hue 209.5° and chroma 1.9, so its light-theme primary is `#006874` (a teal).

Each palette is a fixed hue and chroma; a tone is resolved on request. If the chroma cannot be reached at that tone, it is reduced and the tone is kept (see [HCT](/concepts/hct#out-of-gamut-chroma-is-reduced-never-tone)).

### Standard tones

```text
0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100
```

These are the defaults of `generate_tonal_palette` (`tones`) and `generate_theme_css` (`includeTones`). Both accept any tone from 0 to 100.

::: warning generate_tonal_palette is not the theme's primary palette
`generate_tonal_palette` keeps the seed's own hue and chroma, without the 48-chroma floor. For `#6750a4` (chroma 47.9) its tone 70 is `#b69df7`, while the theme's primary palette (chroma 48) gives `#b69df8`.
:::

## Role → tone mapping

`generate_material_theme` output for `sourceColor: "#6750a4"`:

| Role                 | Palette         | Light tone | Light     | Dark tone | Dark      |
| -------------------- | --------------- | ---------- | --------- | --------- | --------- |
| primary              | primary         | 40         | `#6750a4` | 80        | `#cfbcff` |
| onPrimary            | primary         | 100        | `#ffffff` | 20        | `#381e72` |
| primaryContainer     | primary         | 90         | `#e9ddff` | 30        | `#4f378a` |
| onPrimaryContainer   | primary         | 10         | `#22005d` | 90        | `#e9ddff` |
| secondary            | secondary       | 40         | `#625b71` | 80        | `#cbc2db` |
| onSecondary          | secondary       | 100        | `#ffffff` | 20        | `#332d41` |
| secondaryContainer   | secondary       | 90         | `#e8def8` | 30        | `#4a4458` |
| onSecondaryContainer | secondary       | 10         | `#1e192b` | 90        | `#e8def8` |
| tertiary             | tertiary        | 40         | `#7e5260` | 80        | `#efb8c8` |
| onTertiary           | tertiary        | 100        | `#ffffff` | 20        | `#4a2532` |
| tertiaryContainer    | tertiary        | 90         | `#ffd9e3` | 30        | `#633b48` |
| onTertiaryContainer  | tertiary        | 10         | `#31101d` | 90        | `#ffd9e3` |
| error                | error           | 40         | `#ba1a1a` | 80        | `#ffb4ab` |
| onError              | error           | 100        | `#ffffff` | 20        | `#690005` |
| errorContainer       | error           | 90         | `#ffdad6` | 30        | `#93000a` |
| onErrorContainer     | error           | 10         | `#410002` | 90        | `#ffdad6` |
| background           | neutral         | 99         | `#fffbff` | 10        | `#1c1b1e` |
| onBackground         | neutral         | 10         | `#1c1b1e` | 90        | `#e6e1e6` |
| surface              | neutral         | 99         | `#fffbff` | 10        | `#1c1b1e` |
| onSurface            | neutral         | 10         | `#1c1b1e` | 90        | `#e6e1e6` |
| surfaceVariant       | neutral variant | 90         | `#e7e0eb` | 30        | `#49454e` |
| onSurfaceVariant     | neutral variant | 30         | `#49454e` | 80        | `#cac4cf` |
| outline              | neutral variant | 50         | `#7a757f` | 60        | `#948f99` |

Compared with Material Color Utilities 0.3.0 (`Scheme.light` / `Scheme.dark` for the same source), 45 of the 46 values are identical. The exception is dark `onErrorContainer`: this server uses error tone 90 (`#ffdad6`), as Material's current dynamic colors do, while the legacy `Scheme.dark` uses tone 80 (`#ffb4ab`).

### Contrast of the role pairs

Because roles are tone pairs, their contrast is predictable. Measured with `check_contrast` (`algorithm: "both"`) on the `#6750a4` theme:

| Pair (foreground on background)    | Tones       | WCAG    | APCA Lc |
| ---------------------------------- | ----------- | ------- | ------- |
| onPrimary on primary (light)       | 100 / 40    | 6.44:1  | -86.9   |
| onPrimaryContainer on container    | 10 / 90     | 13.25:1 | 85.9    |
| onSurface on surface (light)       | N10 / N99   | 16.73:1 | 102.3   |
| onSurfaceVariant on surfaceVariant | NV30 / NV90 | 7.24:1  | 74.7    |
| outline on surface (light)         | NV50 / N99  | 4.38:1  | 69.5    |
| onError on error (light)           | 100 / 40    | 6.46:1  | -85.3   |
| onPrimary on primary (dark)        | 20 / 80     | 7.70:1  | 66.1    |
| onSurface on surface (dark)        | N90 / N10   | 13.29:1 | -87.9   |
| outline on surface (dark)          | NV60 / N10  | 5.43:1  | -41.5   |

`outline` is a non-text role; its target is 3:1.

## Theme CSS

`generate_theme_css` writes every core palette at the requested tones (`--{prefix}-{palette}-{tone}`) and a **light-only** block of semantic aliases. Tones 10, 40, 90, 99 and 100 are always included because the aliases point at them. Excerpt for `{"sourceColor": "#6750a4", "prefix": "md", "includeTones": [40]}`:

```text
:root {
  /* Primary Colors */
  --md-primary-10: #22005d;
  --md-primary-40: #6750a4;
  --md-primary-90: #e9ddff;
  --md-primary-99: #fffbff;
  --md-primary-100: #ffffff;
  …
}

/* Semantic Color Mappings (Light Theme) */
:root {
  --md-primary: var(--md-primary-40);
  --md-on-primary: var(--md-primary-100);
  --md-primary-container: var(--md-primary-90);
  --md-on-primary-container: var(--md-primary-10);
  …
  --md-surface: var(--md-neutral-99);
  --md-on-surface: var(--md-neutral-10);
}
```

The aliases cover primary, secondary, background and surface only. For dark-theme values, use `generate_material_theme`.

## Disliked source colors

Material's dislike rule flags dark yellow-greens: HCT hue 90–111°, chroma > 16, tone < 65. The fix keeps hue and chroma and sets the tone to 70 (`#6b6b1e` → `#b0af5b`).

- `generate_material_theme` and `generate_theme_css` use the source color **as given**.
- `generate_theme_from_image` fixes a disliked source before building the theme.
- `analyze_color_likability` and `fix_disliked_colors_batch` apply the rule on demand.

## Harmonization

`harmonize_colors` has three methods:

| Method                | What it does                                                                                                                                                                                                     |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `harmonize` (default) | Keeps the first color. Rotates each other color's HCT hue toward it by at most 15°; below that cap the rotation is _difference × factor_ (Material's `Blend.harmonize` uses 0.5). Chroma and tone are unchanged. |
| `blend`               | Interpolates hue (shortest way), chroma and tone by `factor`, folding all colors into **one** result color (`#6750a4, #ff0000, #00ff00` → `#ef8b00`).                                                            |
| `temperature`         | Shifts every hue toward 30° (warmer, `factor` > 0.5) or 210° (cooler, `factor` < 0.5); `factor` 0.5 leaves colors unchanged (`#6750a4, #ff0000` → `#6750a4, #ff0000`).                                           |

```json
{ "colors": ["#6750a4", "#ff0000", "#00ff00"] }
```

```text
Harmonized Colors (harmonize):
Original: #6750a4, #ff0000, #00ff00
Result: #6750a4, #fb0057, #00fc94
```

Hue differences are measured the short way around the circle, so colors on either side of 0°/360° work as expected (the implementation is identical to Material's `Blend.harmonize`). With `["hct(350, 60, 50)", "hct(10, 60, 50)"]` the two hues are 20° apart, so the second color rotates 10° toward the first: `#c44d7b`, hue 359.8°.

## See Also

- [HCT Color System](/concepts/hct) — tone, chroma and gamut
- [Accessibility](/concepts/accessibility) — WCAG and APCA in detail
- [Image Analysis](/concepts/image-analysis) — seeding a theme from an image
- [Material Design tools](/tools/material-design) — parameters and full outputs
- [Material Design 3 color guidance](https://m3.material.io/styles/color/overview)
