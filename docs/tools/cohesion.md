# Visual Cohesion Tools

Tools that derive a whole family of colors from one seed, plus one that scores an existing palette. All four work in Google's [HCT](/concepts/hct) space (hue and chroma from CAM16, tone = CIE L\*). Changing tone while holding hue and chroma steady keeps colors visibly related. When a requested hue/chroma/tone isn't displayable in sRGB, chroma is reduced; tone and hue stay put.

| Tool                                                          | Purpose                                                           |
| ------------------------------------------------------------- | ----------------------------------------------------------------- |
| [`generate_tonal_scale`](#generate-tonal-scale)               | Tailwind-style 50…950 scale from a seed                           |
| [`generate_state_colors`](#generate-state-colors)             | hover / active / pressed / focus / disabled / selected variants   |
| [`analyze_palette_consistency`](#analyze-palette-consistency) | Heuristic 0–100 cohesion score with suggestions                   |
| [`generate_semantic_palette`](#generate-semantic-palette)     | primary / secondary / tertiary + success / warning / error / info |

Invalid colors return `isError: true` with `Invalid color format: …`.

---

## `generate_tonal_scale`

Builds a shade scale (50, 100 … 900, 950) from a seed color. It returns a table plus a ready-to-paste CSS `:root` block.

### Parameters

| Parameter     | Type   | Required | Default | Limits                     | Description                                                                    |
| ------------- | ------ | -------- | ------- | -------------------------- | ------------------------------------------------------------------------------ |
| `chromaBoost` | number | no       | `1`     | 0–2                        | Multiplier on seed chroma (1 = keep, < 1 = muted)                              |
| `name`        | string | no       | –       | –                          | CSS variable base name (`color` when omitted)                                  |
| `seed`        | string | yes      | –       | –                          | Seed color                                                                     |
| `stops`       | array  | no       | –       | ≤ 32 items, numbers 0–1000 | Custom stops. Omitted or empty: `[50,100,200,300,400,500,600,700,800,900,950]` |

### How it works

For each stop:

- **tone** = 100 − stop / 10 (50 → 95, 500 → 50, 950 → 5), clamped to 0–100
- **chroma** = seed chroma × `chromaBoost` × (1 − 0.35 × |50 − tone| / 50), which tapers chroma by up to 35 % toward very light and very dark tones
- **hue** = seed hue

The mapping is fixed, so **the seed itself is usually not in the scale**. Each stop gets a fixed tone, whatever the seed's tone.

### Example

```json
{ "seed": "#6750a4", "name": "brand" }
```

````text
# Tonal scale for #6750a4
Seed HCT: H=299.0° C=47.9 T=40.1

| stop | tone | hex |
|---|---|---|
| 50 | 95 | #f6eeff |
| 100 | 90 | #e9ddff |
| 200 | 80 | #cfbcff |
| 300 | 70 | #b4a0eb |
| 400 | 60 | #9a84d4 |
| 500 | 50 | #8069bf |
| 600 | 40 | #66519e |
| 700 | 30 | #4d3b7e |
| 800 | 20 | #362660 |
| 900 | 10 | #201144 |
| 950 | 5 | #150637 |

## CSS
```css
:root {
  --brand-50: #f6eeff;
  --brand-100: #e9ddff;
  …
  --brand-950: #150637;
}
```
````

Custom stops with muted chroma:

```json
{ "seed": "#6750a4", "stops": [100, 500, 900], "chromaBoost": 0.5 }
```

```text
…
| stop | tone | hex |
|---|---|---|
| 100 | 90 | #e8defa |
| 500 | 50 | #7c7296 |
| 900 | 10 | #1e182c |
…
```

### Notes

- The seed is not pinned to a stop. `#6750a4` (tone 40.1) is closest to stop 600, but that stop is `#66519e` because the chroma taper applies there too. Likewise, `#3b82f6` (tone 55.6) gives 500 = `#2573e6`, since stop 500 is always tone 50. If the brand color must appear exactly, use it directly and treat the scale as its neighbours.
- `name` is turned into a CSS-safe slug: `"Brand Blue"` produces `--brand-blue-500`.
- Stops are emitted in the order you give them. `stops: []` falls back to the default list.
- Grey seeds keep HCT's small residual chroma (`#808080` has C = 1.9), so the scale is very slightly tinted: stop 100 = `#e4e2e2`.
- Schema limits: `chromaBoost: 3` gives `Invalid arguments for tool 'generate_tonal_scale': chromaBoost: Too big: expected number to be <=2`, and a stop of 1001 gives `stops.0: Too big: expected number to be <=1000`.

---

## `generate_state_colors`

Derives interaction-state colors from a resting color by moving its HCT tone by fixed amounts. Hue and chroma stay the same, so the states look equally related to the base whatever its hue.

### Parameters

| Parameter | Type    | Required | Default | Limits | Description                                                          |
| --------- | ------- | -------- | ------- | ------ | -------------------------------------------------------------------- |
| `base`    | string  | yes      | –       | –      | Base/resting color                                                   |
| `isDark`  | boolean | no       | `false` | –      | The base sits on a dark background: states lighten instead of darken |

### States

| State      | Tone (light mode, `isDark: false`) | Tone (dark mode, `isDark: true`) | Chroma       |
| ---------- | ---------------------------------- | -------------------------------- | ------------ |
| `base`     | base tone                          | base tone                        | base         |
| `hover`    | base − 8                           | base + 8                         | base         |
| `active`   | base − 16                          | base + 16                        | base         |
| `pressed`  | base − 16 (alias of active)        | base + 16                        | base         |
| `focus`    | base − 4                           | base + 4                         | base         |
| `disabled` | 70                                 | 30                               | min(base, 6) |
| `selected` | 90                                 | 25                               | base         |

Tones are clamped to 0–100.

### Examples

```json
{ "base": "#6750a4" }
```

```text
# Interaction states for #6750a4 (light mode)

| state | tone | hex | notes |
|---|---|---|---|
| base | 40 | #6750a4 | resting |
| hover | 32 | #543c8f | +/- 8 tone |
| active | 24 | #41297c | +/- 16 tone |
| pressed | 24 | #41297c | same as active, alias |
| focus | 36 | #5d469a | +/- 4 tone, used as outline |
| disabled | 70 | #aea9b1 | low chroma, mid tone |
| selected | 90 | #e9ddff | alpha-blend friendly base |
```

```json
{ "base": "#d0bcff", "isDark": true }
```

```text
…
| base | 80 | #d0bcff | resting |
| hover | 88 | #e4d6ff | +/- 8 tone |
| active | 96 | #f8f1ff | +/- 16 tone |
| pressed | 96 | #f8f1ff | same as active, alias |
| focus | 84 | #dac9ff | +/- 4 tone, used as outline |
| disabled | 30 | #48464c | low chroma, mid tone |
| selected | 25 | #42316a | alpha-blend friendly base |
```

### Notes

- The direction depends only on `isDark`, not on the base's own tone. A very dark base in light mode runs into the clamp: `#0a0a0a` (tone 3) gives `#000000` for hover, active, pressed and focus. Likewise, a very light base with `isDark: true` collapses to white.
- `disabled` and `selected` are absolute tones and ignore the base tone. The tool doesn't check them for contrast; use [`check_contrast`](/tools/accessibility#check-contrast) on the pairs you actually render.

---

## `analyze_palette_consistency`

Scores how cohesive a palette is on three axes and combines them into an overall 0–100 score with suggestions. The scores are **simple heuristics**. Read the formulas below before relying on them.

### Parameters

| Parameter | Type  | Required | Default | Limits              | Description               |
| --------- | ----- | -------- | ------- | ------------------- | ------------------------- |
| `colors`  | array | yes      | –       | 2–64 items, strings | Palette colors to analyze |

### What the scores compute

Every color is converted to HCT.

| Metric                    | Formula                                                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Tonal step uniformity** | Sort the tones and take the gaps between neighbours. Score = max(0, 100 − 50 × std(gaps) / max(1, mean gap)). |
| **Chroma cohesion**       | max(0, 100 − 2 × std(chroma)).                                                                                |
| **Hue harmony**           | Share of color pairs whose hue difference is within ±15° of 0, 30, 60, 90, 120, 150 or 180°, × 100.           |
| **Overall cohesion**      | 0.4 × tonal + 0.3 × chroma + 0.3 × hue.                                                                       |

Suggestions are added when tonal < 60, chroma < 60 or hue < 50. A **"Likely outlier"** line names the color whose removal reduces the chroma spread the most.

### Example: a rainbow vs. a grey ramp

```json
{
  "colors": [
    "#ff0000",
    "#ff7f00",
    "#ffff00",
    "#00ff00",
    "#0000ff",
    "#4b0082",
    "#8f00ff"
  ]
}
```

```text
# Palette cohesion analysis

Colors: 7

| metric | score | detail |
|---|---|---|
| Tonal step uniformity | 85 | gap avg 12.8 ± 3.9 |
| Chroma cohesion | 64 | chroma avg 86.5 ± 18.2 |
| Hue harmony | 100 | 21/21 pairs at harmonic angles |
| **Overall cohesion** | **83** | weighted 0.4 / 0.3 / 0.3 |

## Suggestions
- Likely outlier: #ff0000 (chroma 113 vs avg 87).
```

```json
{
  "colors": [
    "#111111",
    "#333333",
    "#555555",
    "#777777",
    "#999999",
    "#bbbbbb",
    "#dddddd"
  ]
}
```

```text
…
| Tonal step uniformity | 95 | gap avg 13.8 ± 1.4 |
| Chroma cohesion | 99 | chroma avg 1.7 ± 0.7 |
| Hue harmony | 100 | 21/21 pairs at harmonic angles |
| **Overall cohesion** | **98** | weighted 0.4 / 0.3 / 0.3 |

## Suggestions
- Likely outlier: #111111 (chroma 1 vs avg 2).
```

### Limits of the heuristic (observed)

::: warning Hue harmony is always 100
The target angles are 30° apart and each accepts ±15°, so together they cover every possible hue difference from 0° to 180°. **Every pair counts as harmonic.** The rainbow, the grey ramp (whose CAM16 hues are essentially arbitrary) and every other palette tested scored 100. As a result:

- the overall score always includes a constant 30 points, so it is effectively 30 + 0.4 × tonal + 0.3 × chroma;
- the "Hues don't sit at harmonic angles" suggestion never appears.

:::

- **Tonal uniformity rewards equal tones.** It measures how even the gaps are, not whether the palette has a useful light-to-dark range. Four hues 90° apart at the same tone (`hct(0, 50, 50)`, `hct(90, 50, 50)`, `hct(180, 50, 50)`, `hct(270, 50, 50)`) score 98 on tonal, 93 on chroma and 97 overall. Any two-color palette scores 100 on tonal, because a single gap has no spread.
- **Uneven ramps are caught.** `#000000, #101010, #202020, #f0f0f0, #ffffff` scores 34 on tonal (gap avg 25.0 ± 33.2) and 73 overall, with a suggestion to snap to a fixed scale.
- **The "Likely outlier" line is almost always present.** Unless every color has exactly the same chroma, removing one of them lowers the chroma spread, so a color gets named even in the 98-point grey ramp. With two colors, both removals reduce the spread equally and the **first** color is named: `["#e63946", "#457b9d"]` names `#e63946`, and the reversed order names `#457b9d`.
- As a result, `✓ Palette is visually cohesive across all three axes.` only appears when all chromas are identical (e.g. the same color twice).

Use the score to compare variations of one palette, not as an absolute quality grade. For CVD collisions use [`check_palette_accessibility`](/tools/accessibility#check-palette-accessibility). For contrast use [`check_contrast`](/tools/accessibility#check-contrast) or [`audit_ui_colors`](/tools/agent-tools).

---

## `generate_semantic_palette`

From one brand color, generates seven role colors at a **shared tone** with related chroma: three brand roles plus four status colors.

### Parameters

| Parameter | Type    | Required | Default | Limits | Description                           |
| --------- | ------- | -------- | ------- | ------ | ------------------------------------- |
| `brand`   | string  | yes      | –       | –      | Brand / seed color                    |
| `isDark`  | boolean | no       | `false` | –      | Generate the palette for a dark theme |

### How it works

- **Tone**: 40 in light mode, 80 with `isDark: true`, for every role.
- **Family chroma**: brand chroma clamped to 24–80.
- **Brand roles** use the family chroma: `primary` at the brand hue, `secondary` at hue − 30°, `tertiary` at hue + 60°.
- **Status roles** use fixed HCT hues, with chroma = max(role minimum, family chroma):

| Role      | HCT hue | Minimum chroma |
| --------- | ------- | -------------- |
| `error`   | 25      | 40             |
| `warning` | 80      | 50             |
| `success` | 142     | 30             |
| `info`    | 240     | 30             |

The output table lists each role's requested HCT hue, hex, ΔE2000 from the brand and HSL, followed by a CSS block with fixed names `--color-<role>`.

### Example

```json
{ "brand": "#6750a4" }
```

````text
# Semantic palette derived from #6750a4
Mode: light (target tone 40)
Family chroma: 48 (brand was 48)

| role | hue | hex | ΔE2000 from brand | hsl |
|---|---|---|---|---|
| primary | 299° | #6750a4 | 0.0 | hsl(256, 34%, 48%) |
| secondary | 269° | #385ca8 | 12.0 | hsl(221, 50%, 44%) |
| tertiary | 359° | #984062 | 21.8 | hsl(337, 41%, 42%) |
| error | 25° | #9c4239 | 32.7 | hsl(5, 46%, 42%) |
| info | 240° | #006590 | 21.3 | hsl(198, 100%, 28%) |
| success | 142° | #306b25 | 47.6 | hsl(111, 49%, 28%) |
| warning | 80° | #7d5700 | 50.6 | hsl(42, 100%, 25%) |

## CSS
```css
:root {
  --color-primary: #6750a4;
  --color-secondary: #385ca8;
  …
  --color-warning: #7d5700;
}
```
````

With `"isDark": true`, the same brand gives tone-80 colors: `primary #cfbcff`, `secondary #b0c6ff`, `tertiary #ffb0c9`, `error #ffb4ab`, `info #88ceff`, `success #96d784`, `warning #fbbb42`.

### Notes

- `primary` equals the brand only when the brand already has tone ≈ 40 (or 80 in dark mode) and chroma between 24 and 80, as `#6750a4` happens to. Otherwise it is a re-toned version of the brand.
- **Red brands collide with `error`.** For `#e53935`, primary is `#b72021` and error is `#b7211e`, essentially the same color. Pick a different error hue manually in that case.
- **Grey brands** get a primary built from HCT's residual hue. `#808080` (hue 209.5°, chroma 1.9) gives family chroma 24 and a teal primary `#39656c`.
- `warning` at tone 40 is a dark amber/brown (`#7d5700`), which suits text more than fills. Use the dark-mode tone or a tonal scale for a bright warning fill.
- The tool produces no `on-*` colors and runs no contrast checks. For a complete, contrast-verified light/dark system use [`design_ui_palette`](/tools/agent-tools). For Material 3 roles use [`generate_material_theme`](/tools/material-design).

---

## Related

- [Palettes & Gradients](/tools/palettes): harmonies, locked palettes, gradients, export
- [Material Design](/tools/material-design): Material 3 tonal palettes and schemes
- [Agent Tools](/tools/agent-tools): `design_ui_palette`, `audit_ui_colors`
- [HCT](/concepts/hct), [Material Design concepts](/concepts/material-design)
