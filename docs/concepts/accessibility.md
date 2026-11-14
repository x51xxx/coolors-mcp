# Accessibility

Coolors MCP measures contrast with **WCAG 2.x** (the ratio that conformance is judged by today) and **APCA** (the perceptual contrast method drafted for WCAG 3), simulates **color-vision deficiency (CVD)**, and fixes failing pairs by searching **HCT tone**. Tools: `check_contrast`, `fix_contrast`, `audit_ui_colors`, `simulate_color_blindness`, `check_palette_accessibility` (parameters in [Accessibility tools](/tools/accessibility)).

## WCAG 2.x contrast ratio

```text
channel c = value / 255
linear    = c ≤ 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055)^2.4
L         = 0.2126·R + 0.7152·G + 0.0722·B          (relative luminance)
ratio     = (L_lighter + 0.05) / (L_darker + 0.05)   (1:1 … 21:1)
```

The code uses the WCAG 2.x threshold 0.03928. The sRGB spec's 0.04045 gives identical results for 8-bit colors, because no 8-bit value lies between the two (10/255 = 0.0392, 11/255 = 0.0431).

| Target                    | Ratio | `fix_contrast` `target` |
| ------------------------- | ----- | ----------------------- |
| AA, normal text           | 4.5:1 | `aa` (default)          |
| AA, large text            | 3:1   | `aa-large`              |
| AAA, normal text          | 7:1   | `aaa`                   |
| AAA, large text           | 4.5:1 | —                       |
| Non-text UI (WCAG 1.4.11) | 3:1   | `ui`                    |

Large text means at least 18pt (24px), or 14pt (≈18.7px) bold.

## APCA (WCAG 3 draft)

APCA returns a lightness contrast **Lc**, roughly −108 to +106. The implementation (`src/color/apca.ts`) follows **apca-w3 0.1.9** (SA98G constants):

| Constant                   | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| Screen luminance           | `(c/255)^2.4`, coefficients 0.2126729 / 0.7151522 / 0.0721750 |
| Black soft clamp           | threshold 0.022, exponent 1.414                               |
| Normal polarity exponents  | background 0.56, text 0.57                                    |
| Reverse polarity exponents | background 0.65, text 0.62                                    |
| Scale (both polarities)    | 1.14                                                          |
| Low clip / offset          | 0.1 / 0.027                                                   |
| Minimum ΔY                 | 0.0005 (below it Lc = 0)                                      |

**Sign convention:** positive Lc = dark text on a light background; negative Lc = light text on a dark background. Thresholds compare **|Lc|**:

| \|Lc\| ≥ | Use (APCA Bronze simple levels) | `fix_contrast` `target` |
| -------- | ------------------------------- | ----------------------- |
| 75       | Body text                       | `apca-body`             |
| 60       | Content text                    | `apca-content`          |
| 45       | Large / headline text           | `apca-large`            |
| 30       | Spot / non-content text         | —                       |

APCA is not symmetric. Swapping text and background changes the value, which the WCAG ratio never does:

| Text on background     | Lc     |
| ---------------------- | ------ |
| `#000000` on `#ffffff` | 106.0  |
| `#ffffff` on `#000000` | -107.9 |
| `#888888` on `#ffffff` | 63.1   |
| `#ffffff` on `#888888` | -68.5  |
| `#000000` on `#aaaaaa` | 58.1   |
| `#aaaaaa` on `#000000` | -56.2  |

::: warning APCA is a draft
APCA is still a draft and is not required for WCAG 2.x conformance. Use it as a second opinion; the two methods can disagree sharply on light-on-dark pairs (see the `fix_contrast` example below).
:::

### Example

`check_contrast` with `{"foreground": "#888888", "background": "#ffffff", "algorithm": "both"}`:

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 3.54:1
- AA (normal text):  ✗ Fail (need 4.5:1)
- AA (large text):   ✓ Pass (need 3:1)
- AAA (normal text): ✗ Fail (need 7:1)
- AAA (large text):  ✗ Fail (need 4.5:1)

## APCA (WCAG 3 draft)
Lc: 63.1 (dark text on light bg)
- Body text (|Lc| ≥ 75):    ✗ Fail
- Content text (|Lc| ≥ 60): ✓ Pass
- Large text (|Lc| ≥ 45):   ✓ Pass
- Spot / non-content (|Lc| ≥ 30): ✓ Pass

## Agent Guidance
- **Nearest AA fix (hue-preserving)**: foreground `#767677` on `#ffffff` → 4.54:1 (APCA Lc 71.5, ΔE=6.9)
```

## Fixing contrast by tone search

`fix_contrast`, and the suggestion in `check_contrast`, change only the **HCT tone** of one color and keep its HCT hue and chroma. Since tone is L\* and WCAG luminance depends only on L\* (see [HCT](/concepts/hct#why-tone-matters-for-contrast)), tone is the one dimension that moves contrast.

1. If the pair already meets the target, it is returned unchanged.
2. For each allowed direction, darker (toward tone 0) or lighter (toward 100), check that the end tone can reach the target at all. If it can, binary-search (24 steps) for the tone closest to the original that still meets the target.
3. `adjust` chooses what may move: `foreground` (default), `background`, or `auto` (both are tried). `prefer: "minimal"` (default) tries both directions; `darker`/`lighter` try one and fall back to the other if it fails.
4. The candidate with the smallest **ΔE2000** from the original color wins.
5. If no tone works, the color becomes black or white, whichever gives more contrast.

The suggestion in `check_contrast` always targets AA (4.5:1) and moves the foreground.

WCAG and APCA can disagree. Fixing `#6750a4` on `#1c1b1e` for AA:

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: foreground (ΔE2000 shift = 14.32)
- **Before**: `#6750a4` on `#1c1b1e` → 2.66:1 (APCA Lc -18.6)
- **After**:  `#8c75cb` on `#1c1b1e` → **4.51:1** (APCA Lc **-34.7**)

## Remaining Notes
- Low APCA readability (|Lc|=34.7, aim for ≥60 content / ≥75 body).
```

Targeting APCA instead (`#9a83db` on `#ffffff`, `target: "apca-body"`) lands at `#7660b5`: 5.11:1 and Lc 75.1.

## Color-vision deficiency simulation

`simulate_color_blindness` and the CVD checks use the **Machado, Oliveira & Fernandes (2009)** model:

```text
sRGB → linear sRGB → 3×3 Machado matrix → sRGB (rounded, clamped 0–255)
```

| Type            | Model                                                                | Prevalence used in reports |
| --------------- | -------------------------------------------------------------------- | -------------------------- |
| `protanopia`    | Machado matrix, severity 1.0                                         | ~1%                        |
| `deuteranopia`  | Machado matrix, severity 1.0                                         | ~1%                        |
| `tritanopia`    | Machado matrix, severity 1.0                                         | ~0.003%                    |
| `protanomaly`   | Machado matrix, severity 0.6                                         | ~1%                        |
| `deuteranomaly` | Machado matrix, severity 0.6                                         | ~5%                        |
| `tritanomaly`   | Machado matrix, severity 0.6                                         | ~0.01%                     |
| `achromatopsia` | Grey with the same relative luminance (BT.709 weights on linear RGB) | ~0.003%                    |

The anomalous forms (-omaly) use one fixed severity of 0.6; there is no severity parameter.

```text
# Color Blindness Simulation

| Original | protanopia | deuteranopia | tritanopia | protanomaly | deuteranomaly | tritanomaly | achromatopsia |
|---|---|---|---|---|---|---|---|
| #ff0000 (#ff0000) | #6d5f00 | #a39000 | #ff000f | #a75900 | #bb7d00 | #ff0004 | #7f7f7f |
| #2e7d32 (#2e7d32) | #7f722a | #756b38 | #1e7a6d | #70742f | #6b7036 | #257c53 | #6e6e6e |

## Population prevalence
…
```

### Where the simulation is used

- **`check_contrast` / `audit_ui_colors` pairs:** both colors are simulated for protanopia, deuteranopia and tritanopia. A warning is raised if the simulated WCAG ratio drops below 3.5:1 (2.5:1 for large-text and UI pairs).
- **`check_palette_accessibility`:** every pair of colors is simulated and compared with ΔE2000. Pairs below `indistinguishableThreshold` (default 10) are flagged:

  ```text
  …
  ## deuteranopia (~1% of population)
  ⚠ 1 indistinguishable pair:
    - #d32f2f ↔ #388e3c: ΔE=5.0 (sim: #8b7c28 vs #867a42)
  …
  ```

- **`audit_ui_colors` swatches:** CVD collisions are flagged below ΔE2000 8. **`audit_design_md`** uses `cvdThreshold` (default 10). **`generate_categorical_palette`** maximizes the smallest ΔE2000 under normal vision and the three dichromacies.

### Optical vibration

`check_contrast` and `audit_ui_colors` also flag **chromostereopsis** (vivid opposing hues that appear to vibrate). The test: both colors have OKLCH chroma > 0.14, their hues differ by at least 95°, and their OKLCH lightness differs by less than 0.35.

## Material roles

Material's role pairs are tone pairs with known contrast. For example onPrimary on primary (tones 100/40) is 6.44:1 for `#6750a4`. See the measured table in [Material Design](/concepts/material-design#contrast-of-the-role-pairs).

## Resources

- [WCAG 2.2 — Contrast (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [APCA / SAPC reference implementation](https://github.com/Myndex/SAPC-APCA)
- Machado, Oliveira & Fernandes (2009), _A Physiologically-based Model for Simulation of Color Vision Deficiency_

## See Also

- [HCT Color System](/concepts/hct) — why tone controls contrast
- [Distance Metrics](/concepts/distance-metrics) — ΔE2000 used by the CVD audits
- [Accessibility tools](/tools/accessibility) — parameters and outputs
