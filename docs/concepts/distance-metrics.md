# Distance Metrics

`color_distance` measures how different two colors are. The default metric, **CIEDE2000 (ΔE00)**, is also used inside the palette and accessibility audits. The implementations are in `src/color/metrics.ts`.

## Available metrics

| `metric`               | Space               | Summary                                                                        |
| ---------------------- | ------------------- | ------------------------------------------------------------------------------ |
| `deltaE2000` (default) | CIE L\*a\*b\* (D65) | CIEDE2000, with lightness, chroma and hue weighting and the blue rotation term |
| `deltaE94`             | CIE L\*a\*b\* (D65) | CIE94, graphic-arts constants; **not symmetric**                               |
| `deltaE76`             | CIE L\*a\*b\* (D65) | Plain Euclidean distance in Lab                                                |
| `euclidean`            | sRGB 0–255          | Plain Euclidean distance in RGB                                                |
| `weighted`             | sRGB 0–255          | RGB distance with each channel weighted by 0.3 / 0.59 / 0.11                   |

Lab values come from the 8-bit sRGB color via XYZ with the D65 white point (X 95.047, Y 100, Z 108.883). `color_distance` has no other parameters; the weights and constants below are fixed.

## Formulas

### Euclidean (RGB)

```text
d = √( ΔR² + ΔG² + ΔB² )          range 0 … 441.67 (black ↔ white)
```

### Weighted (RGB)

```text
d = √( (0.3·ΔR)² + (0.59·ΔG)² + (0.11·ΔB)² )
```

The weights are the classic luma coefficients: green differences count most and blue least. This is still an RGB metric, not a perceptual one.

### ΔE 1976

```text
ΔE76 = √( ΔL*² + Δa*² + Δb*² )
```

### ΔE 1994

```text
ΔE94 = √( (ΔL/S_L)² + (ΔC/S_C)² + (ΔH/S_H)² )
S_L = 1,  S_C = 1 + 0.045·C₁,  S_H = 1 + 0.015·C₁,  k_L = k_C = k_H = 1
```

`C₁` is the chroma of the **first** color, so swapping `color1` and `color2` changes the result: `#6750a4` → `#7d5fc4` is 8.01, the reverse is 7.93.

### ΔE 2000

CIEDE2000 as formulated by Sharma, Wu & Dalal (2005), with k_L = k_C = k_H = 1:

```text
ΔE00 = √( (ΔL'/S_L)² + (ΔC'/S_C)² + (ΔH'/S_H)² + R_T·(ΔC'/S_C)·(ΔH'/S_H) )
```

It adds an a\* rescaling for near-neutral colors (G), lightness, chroma and hue weighting functions (S_L, S_C, S_H with the hue-dependent T term), and a rotation term R_T for the blue region. It is symmetric.

::: tip Verified
The implementation was run against the 34 test pairs published by Sharma, Wu & Dalal (2005). All 34 agree with the published ΔE00 values to 4 decimals.
:::

## Real comparisons

`color_distance` output for the same pairs under every metric:

| Pair                   | deltaE2000 | deltaE94 | deltaE76 | euclidean | weighted |
| ---------------------- | ---------- | -------- | -------- | --------- | -------- |
| `#6750a4` vs `#7d5fc4` | 7.44       | 8.01     | 11.42    | 41.63     | 11.59    |
| `#7d5fc4` vs `#6750a4` | 7.44       | 7.93     | 11.42    | 41.63     | 11.59    |
| `#808080` vs `#8a8a8a` | 3.66       | 3.89     | 3.89     | 17.32     | 6.71     |
| `#0000ff` vs `#3c3cff` | 7.68       | 8.74     | 22.97    | 84.85     | 39.71    |
| `#ffff00` vs `#c3c300` | 13.83      | 20.95    | 27.23    | 84.85     | 39.71    |
| `#1f1f1f` vs `#1c1b1e` | 2.76       | 2.88     | 2.88     | 5.10      | 2.53     |

```json
{ "color1": "#0000ff", "color2": "#3c3cff", "metric": "deltaE2000" }
```

```text
Distance between #0000ff and #3c3cff: 7.68
```

What the table shows:

- **RGB metrics can't tell these apart.** The blue pair and the yellow pair are both 84.85 apart in RGB (and 39.71 weighted), but ΔE2000 rates the yellow pair almost twice as different (13.83 vs 7.68).
- **ΔE76 inflates differences between saturated colors.** 22.97 for the blue pair against 7.68 in ΔE2000. CIEDE2000's chroma weighting, plus its blue-region rotation term, corrects for this.
- **For greys, ΔE94 = ΔE76.** With zero chroma, both reduce to the lightness difference (3.89).
- **Only ΔE94 depends on argument order.**

## How the tools use ΔE2000

| Where                                           | Threshold                                                                                 |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `check_palette_accessibility`                   | `indistinguishableThreshold`, default 10 (1–30)                                           |
| `audit_design_md` CVD collisions                | `cvdThreshold`, default 10 (1–30)                                                         |
| `audit_design_md` near-duplicate tokens         | below 2 (fixed)                                                                           |
| `audit_ui_colors` swatch CVD collisions         | below 8 (fixed)                                                                           |
| `fix_contrast`, `check_contrast` fix suggestion | picks the candidate with the smallest ΔE2000 shift and reports it                         |
| `generate_categorical_palette`                  | maximizes the minimum ΔE2000 under normal vision and protanopia, deuteranopia, tritanopia |
| `generate_palette_with_locks`                   | ΔE2000 to the locked colors when choosing candidates                                      |

These thresholds are deliberately large: they ask whether two UI colors stay clearly distinct, not whether they are measurably different.

## HCT distance (theme matching only)

The theme-matching tools do not use ΔE. They use their own weighted HCT distance, where tone counts twice (see [Theme Matching](/concepts/theme-matching)). It is not available as a `color_distance` metric. It also behaves differently for near-greys: `#1f1f1f` vs `#1c1b1e` is 2.76 in ΔE2000, but about 47 in the HCT matcher, because their meaningless hues differ by 84°.

## See Also

- [Color Spaces](/concepts/color-spaces) — Lab, OKLCH, HCT and the accepted inputs
- [Accessibility](/concepts/accessibility) — CVD audits built on ΔE2000
- [Theme Matching](/concepts/theme-matching) — the HCT matching distance
- [Color Operations tools](/tools/color-operations) — `color_distance` parameters
