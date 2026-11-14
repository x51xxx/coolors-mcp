# Accessibility & Color-Vision Tools

Three tools check whether colors stay readable and distinguishable:

| Tool                                                          | Purpose                                                                    |
| ------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`check_contrast`](#check-contrast)                           | WCAG 2.x ratio and/or APCA Lc for one text/background pair, with fix hints |
| [`simulate_color_blindness`](#simulate-color-blindness)       | Show how colors look under 7 types of color-vision deficiency (CVD)        |
| [`check_palette_accessibility`](#check-palette-accessibility) | Find palette pairs that become indistinguishable under CVD                 |

Related tools on other pages:

- [`fix_contrast`](/tools/agent-tools): finds the closest passing color for a WCAG or APCA target.
- [`audit_ui_colors`](/tools/agent-tools): audits many pairs and swatches at once.
- [`generate_categorical_palette`](/tools/agent-tools): builds CVD-safe chart and tag colors.
- [`audit_design_md`](/tools/design-md): audits a DESIGN.md file.

All three tools accept any supported color syntax (see [Color input](/tools/color-operations#color-input)). An unparsable color returns `isError: true` with `Invalid color format: …`.

---

## `check_contrast`

Reports the contrast of a foreground (text) color on a background color, using WCAG 2.x, APCA, or both. With `suggestFix` on (the default) it appends an **Agent Guidance** block when the pair has problems.

### Parameters

| Parameter    | Type    | Required | Default  | Limits                           | Description                                                                          |
| ------------ | ------- | -------- | -------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `algorithm`  | string  | no       | `"wcag"` | enum: `wcag` \| `apca` \| `both` | `wcag` (WCAG 2.x ratio), `apca` (Lc, WCAG 3 draft), or `both`                        |
| `background` | string  | yes      | –        | –                                | Background color                                                                     |
| `foreground` | string  | yes      | –        | –                                | Foreground/text color                                                                |
| `suggestFix` | boolean | no       | `true`   | –                                | Include the nearest hue-preserving AA fix and CVD/optical warnings when issues exist |

There is no font-size parameter. The tool always reports both the normal-text and large-text verdicts. Under WCAG, "large" means at least 18 pt (24 px) regular or 14 pt (≈18.7 px) bold.

### WCAG 2.x

The ratio is (L1 + 0.05) / (L2 + 0.05), computed from sRGB relative luminance and printed with 2 decimals. These are the thresholds the tool checks:

| Level | Normal text | Large text |
| ----- | ----------- | ---------- |
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |

### APCA

Lc is computed with the APCA-W3 0.1.9 constants and matches `apca-w3` 0.1.9 in both polarities. The sign shows the polarity:

- **positive** Lc: dark text on a light background (`dark text on light bg`)
- **negative** Lc: light text on a dark background (`light text on dark bg`)
- `0.0`: printed as `no contrast`. Very small luminance differences are clamped to 0.

The tool reports these four levels, comparing |Lc| against each threshold:

| Line in the output | Passes when |
| ------------------ | ----------- |
| Body text          | \|Lc\| ≥ 75 |
| Content text       | \|Lc\| ≥ 60 |
| Large text         | \|Lc\| ≥ 45 |
| Spot / non-content | \|Lc\| ≥ 30 |

### Agent Guidance block

Each line appears only when its condition is met. With `suggestFix: false`, the whole block is omitted.

| Line                                | Condition                                                                                                                                                                                                                                     |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nearest AA fix (hue-preserving)** | WCAG ratio below 4.5:1. The **foreground** tone is searched darker and lighter in HCT, keeping hue and chroma (chroma drops only where sRGB can't hold it), until it reaches 4.5:1. The candidate closest to the original by ΔE2000 is shown. |
| **Optical vibration warning**       | Both colors are vivid (OKLCH chroma > 0.14), their hues are ≥ 95° apart, and their OKLCH lightness differs by < 0.35.                                                                                                                         |
| **Color-blindness warning**         | Under protanopia, deuteranopia or tritanopia simulation, the pair's WCAG ratio drops below 3.5:1.                                                                                                                                             |

::: warning What the fix targets
The suggested fix always targets **WCAG AA 4.5:1 by changing the foreground**, even when `algorithm` is `apca`. For an APCA target, large-text and UI targets, or to adjust the background instead, use [`fix_contrast`](/tools/agent-tools).
:::

### Examples

Default (WCAG only), passing pair:

```json
{ "foreground": "#000000", "background": "#ffffff" }
```

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 21.00:1
- AA (normal text):  ✓ Pass (need 4.5:1)
- AA (large text):   ✓ Pass (need 3:1)
- AAA (normal text): ✓ Pass (need 7:1)
- AAA (large text):  ✓ Pass (need 4.5:1)
```

APCA, reverse polarity:

```json
{ "foreground": "#ffffff", "background": "#6750a4", "algorithm": "apca" }
```

```text
## APCA (WCAG 3 draft)
Lc: -86.9 (light text on dark bg)
- Body text (|Lc| ≥ 75):    ✓ Pass
- Content text (|Lc| ≥ 60): ✓ Pass
- Large text (|Lc| ≥ 45):   ✓ Pass
- Spot / non-content (|Lc| ≥ 30): ✓ Pass
```

Failing pair with all three guidance lines:

```json
{ "foreground": "#ff0000", "background": "#0000ff", "algorithm": "both" }
```

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 2.15:1
- AA (normal text):  ✗ Fail (need 4.5:1)
…
## APCA (WCAG 3 draft)
Lc: -20.3 (light text on dark bg)
…
## Agent Guidance
- **Nearest AA fix (hue-preserving)**: foreground `#ffa496` on `#0000ff` → 4.50:1 (APCA Lc -49.1, ΔE=24.8)
- **Optical vibration warning**: High-chroma opposing hues may vibrate visually; soften chroma of bg or fg.
- **Color-blindness warning**: Contrast drops under protanopia: 1.18:1, deuteranopia: 2.14:1, tritanopia: 1.48:1.
```

### Notes

- A pair that passes AA can still get a color-blindness warning. For example, `#ff0000` on `#000000` is 5.25:1 but drops to 3.29:1 under protanopia.
- The CVD warning compares the simulated ratio with 3.5:1, so it also fires when contrast is already low for everyone. `#aaaaaa` on `#ffffff` (2.32:1) is reported as dropping under all three types at 2.32:1. Greys don't change under CVD; the warning is really about the low base contrast.
- Invalid `algorithm` values fail schema validation: `Invalid arguments for tool 'check_contrast': algorithm: Invalid option: expected one of "wcag"|"apca"|"both"`.

---

## `simulate_color_blindness`

Shows how each input color appears to viewers with a color-vision deficiency. The result is a markdown table with one row per color and one column per type, followed by the tool's built-in prevalence figure for each type.

### Parameters

| Parameter | Type  | Required | Default | Limits                                                                                                                             | Description                                           |
| --------- | ----- | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| `colors`  | array | yes      | –       | 1–64 items, strings                                                                                                                | Colors to simulate                                    |
| `types`   | array | no       | –       | items: enum `protanopia` \| `deuteranopia` \| `tritanopia` \| `protanomaly` \| `deuteranomaly` \| `tritanomaly` \| `achromatopsia` | Deficiency types to simulate. Omitted or empty: all 7 |

### How the simulation works

- **Protan, deutan and tritan types** use the Machado, Oliveira & Fernandes (2009) matrices, applied in **linear sRGB** (sRGB → linear → 3×3 matrix → sRGB, then clamped and rounded to 8-bit).
  - `protanopia`, `deuteranopia`, `tritanopia` (dichromacy) use the **severity 1.0** matrices.
  - `protanomaly`, `deuteranomaly`, `tritanomaly` (anomalous trichromacy) use the **severity 0.6** matrices.
- **`achromatopsia`** maps each color to a grey with the **same relative luminance** (BT.709 weights on linear RGB).

### Example

```json
{ "colors": ["#d32f2f", "#388e3c", "#1976d2"] }
```

```text
# Color Blindness Simulation

| Original | protanopia | deuteranopia | tritanopia | protanomaly | deuteranomaly | tritanomaly | achromatopsia |
|---|---|---|---|---|---|---|---|
| #d32f2f (#d32f2f) | #62592d | #8b7c28 | #e80032 | #8e552b | #9d6e28 | #dc1730 | #707070 |
| #388e3c (#388e3c) | #918234 | #867a42 | #288a7c | #808439 | #7a8041 | #2f8c60 | #7d7d7d |
| #1976d2 (#1976d2) | #457ed6 | #1d6ed0 | #008c9a | #3b7ad4 | #2171d1 | #0080bb | #757575 |

## Population prevalence
- **protanopia**: ~1% of population
- **deuteranopia**: ~1% of population
- **tritanopia**: ~0.003% of population
- **protanomaly**: ~1% of population
- **deuteranomaly**: ~5% of population
- **tritanomaly**: ~0.01% of population
- **achromatopsia**: ~0.003% of population
```

Restricting the types (non-hex input is echoed in parentheses):

```json
{ "colors": ["#ff0000", "green"], "types": ["deuteranopia", "achromatopsia"] }
```

```text
…
| Original | deuteranopia | achromatopsia |
|---|---|---|
| #ff0000 (#ff0000) | #a39000 | #7f7f7f |
| #008000 (green) | #776a18 | #6d6d6d |
…
```

### Notes

- Omitting `types`, or passing `[]`, simulates all 7.
- If any color is invalid, the whole call fails and the message lists every bad input, e.g. `Invalid color format: nah`.
- An unknown type fails schema validation: `Invalid arguments for tool 'simulate_color_blindness': types.0: Invalid option: …`.

---

## `check_palette_accessibility`

Audits a palette for CVD collisions. For each selected type, it simulates every color, measures ΔE2000 between every pair of **simulated** colors, and flags pairs below the threshold.

### Parameters

| Parameter                    | Type   | Required | Default | Limits                                                                                                                             | Description                                                        |
| ---------------------------- | ------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `colors`                     | array  | yes      | –       | 2–64 items, strings                                                                                                                | Palette colors to audit                                            |
| `indistinguishableThreshold` | number | no       | `10`    | 1–30                                                                                                                               | ΔE2000 below which two simulated colors count as indistinguishable |
| `types`                      | array  | no       | –       | items: enum `protanopia` \| `deuteranopia` \| `tritanopia` \| `protanomaly` \| `deuteranomaly` \| `tritanomaly` \| `achromatopsia` | CVD types to audit. Omitted or empty: all 7                        |

### Output

- One section per type. It shows either `✓ All N colors remain distinguishable` or `⚠ K indistinguishable pairs`, with each pair's ΔE and simulated hexes.
- **At most 20 colliding pairs are listed per type**, followed by `… and N more`. The pairs are listed in input order (color 1 with 2, 1 with 3, …), **not** sorted by severity, so the 20 shown are not necessarily the worst.
- A summary. When there are issues it also prints the lowest WCAG luminance ratio between any two of the **original** colors.

### Example

```json
{ "colors": ["#d32f2f", "#388e3c", "#1976d2", "#fbc02d"] }
```

```text
# Palette Accessibility Audit

Indistinguishable threshold: ΔE2000 < 10

## protanopia (~1% of population)
✓ All 4 colors remain distinguishable

## deuteranopia (~1% of population)
⚠ 1 indistinguishable pair:
  - #d32f2f ↔ #388e3c: ΔE=5.0 (sim: #8b7c28 vs #867a42)

## tritanopia (~0.003% of population)
✓ All 4 colors remain distinguishable

…

## achromatopsia (~0.003% of population)
⚠ 3 indistinguishable pairs:
  - #d32f2f ↔ #388e3c: ΔE=5.2 (sim: #707070 vs #7d7d7d)
  - #d32f2f ↔ #1976d2: ΔE=2.0 (sim: #707070 vs #757575)
  - #388e3c ↔ #1976d2: ΔE=3.2 (sim: #7d7d7d vs #757575)

## Summary
⚠ Issues detected in: deuteranopia, achromatopsia.
Consider increasing tonal contrast (vary lightness) or chroma; CVD-friendly palettes rely on lightness differences rather than hue alone.
Lowest WCAG luminance ratio in palette: 1.08:1 (target ≥ 3:1 for adjacent UI swatches).
```

The listing cap in action (8 colors, achromatopsia only, threshold 30):

```json
{
  "colors": [
    "#e53935",
    "#d81b60",
    "#8e24aa",
    "#5e35b1",
    "#3949ab",
    "#1e88e5",
    "#039be5",
    "#00acc1"
  ],
  "types": ["achromatopsia"],
  "indistinguishableThreshold": 30
}
```

```text
…
## achromatopsia (~0.003% of population)
⚠ 27 indistinguishable pairs:
  - #e53935 ↔ #d81b60: ΔE=4.4 (sim: #7b7b7b vs #707070)
  - #e53935 ↔ #8e24aa: ΔE=13.0 (sim: #7b7b7b vs #595959)
  …
  - #5e35b1 ↔ #1e88e5: ΔE=20.3 (sim: #505050 vs #858585)
  - … and 7 more
…
```

### Notes

- Normal vision is not audited separately. Two colors that are already close for everyone will be flagged under every type.
- A flagged pair is reported only when ΔE is strictly below the threshold. With `indistinguishableThreshold: 5`, the red/green pair above (ΔE 5.0 under deuteranopia) is not flagged.
- Schema limits: fewer than 2 colors gives `colors: Too small: expected array to have >=2 items`, and a threshold above 30 gives `indistinguishableThreshold: Too big: expected number to be <=30`.

---

## Related

- [Accessibility concepts](/concepts/accessibility): WCAG, APCA and CVD background
- [Color Operations](/tools/color-operations): conversion, distance, adjustment
- [Agent Tools](/tools/agent-tools): `fix_contrast`, `audit_ui_colors`, `generate_categorical_palette`
- [Material Design](/tools/material-design): contrast-aware theme generation
