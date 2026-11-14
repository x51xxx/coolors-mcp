# Basic Color Operations Examples

Everyday color tasks as you would ask an AI assistant, the tool call the assistant makes, and the exact text the tool returns. Every result on this page is real output from the current server; long results are trimmed with `…`.

::: tip
You don't call these tools yourself. Ask in plain language and the assistant picks the tool. The tool calls are shown so you can see what is happening and reproduce a result.
:::

## Color Conversion

> "Convert #6366f1 to RGB, HSL, HCT, LAB and OKLCH."

The assistant calls `convert_color` once per target format:

| Tool call                                             | Result                      |
| ----------------------------------------------------- | --------------------------- |
| `convert_color { "color": "#6366f1", "to": "rgb" }`   | `rgb(99, 102, 241)`         |
| `convert_color { "color": "#6366f1", "to": "hsl" }`   | `hsl(239, 84%, 67%)`        |
| `convert_color { "color": "#6366f1", "to": "hct" }`   | `hct(284.6, 68.0, 50.1)`    |
| `convert_color { "color": "#6366f1", "to": "lab" }`   | `lab(50.10, 38.69, -70.49)` |
| `convert_color { "color": "#6366f1", "to": "oklch" }` | `oklch(58.5% 0.2041 277.1)` |

Any supported input format works, including CSS names and `hct()`, so a round trip back to hex is one more call:

| Tool call                                                          | Result                                                  |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| `convert_color { "color": "rebeccapurple", "to": "hex" }`          | `#663399`                                               |
| `convert_color { "color": "hct(284.6, 68.0, 50.1)", "to": "hex" }` | `#6366f1`                                               |
| `convert_color { "color": "#ec4899", "to": "hsl" }`                | `hsl(330, 81%, 60%)`                                    |
| `convert_color { "color": "#10b981", "to": "hsl" }`                | `hsl(160, 84%, 39%)`                                    |
| `convert_color { "color": "lab(50 20 30)", "to": "hex" }`          | `isError: true` — `Invalid color format: lab(50 20 30)` |

`lab()` is an output format only. As input the tools accept hex, CSS named colors, `rgb()`, `hsl()`, `oklch()`, `oklab()` and `hct()` — see [Color Spaces](/concepts/color-spaces).

## Seeing a Color

> "What does #6366f1 actually look like? Is it warm or cool, and what text goes on it?"

Tool call: `describe_color { "colors": ["#6366f1"] }`

```text
# Perceptual Color Profile

## #6366f1 — **vibrant indigo**
- **Appearance**: medium, vibrant, cool (temp score -74)
- **Spaces**: `oklch(58.5% 0.2041 277.1)` | `hct(284.6, 68.0, 50.1)` | `hsl(239, 84%, 67%)` | `rgb(99, 102, 241)` | L=0.185
- **Text on this color**: use **#ffffff** (light) — light `#ffffff`: 4.47:1 (APCA 76) vs dark `#0f0f17`: 4.27:1 (APCA 33)
- **Best UI roles**: primary-cta-on-light, accent-highlight, focus-ring
```

`L=0.185` is the WCAG relative luminance. Note that neither white nor near-black reaches 4.5:1 on this indigo; see [Contrast](#contrast) below. `describe_color` accepts up to 20 colors per call. More in [Agent Tools](/tools/agent-tools).

## Palettes

All harmonies come from `generate_palette`. It works in HCT by default, so the generated colors have similar perceived weight.

> "Create a monochromatic palette from #6366f1."

Tool call: `generate_palette { "baseColor": "#6366f1", "type": "monochromatic", "count": 5, "includeDetails": false }`

```text
Generated monochromatic palette (HCT):
1. #e8e6ff
2. #a8aaff
3. #6b6ff5
4. #3d3fb3
5. #131072
```

> "Generate analogous colors for #6366f1."

Tool call: `generate_palette { "baseColor": "#6366f1", "type": "analogous", "count": 3 }`

```text
Generated analogous palette (HCT):
1. #6366f1 — vibrant indigo (cool, tone 50, best text: #ffffff)
2. #008ff1 — vibrant sky-blue (cool, tone 58, best text: #ffffff)
3. #8a3dc1 — medium dark vibrant violet (cool, tone 42, best text: #ffffff)

Notes:
- Balanced perceptual lightness and chroma in HCT space so harmonies maintain even visual weight.
```

Other harmony types, with `includeDetails: false`:

| `type` (`count`)              | Result                                     |
| ----------------------------- | ------------------------------------------ |
| `complementary` (3)           | `#6366f1`, `#baad2c`, `#a7a9ff`            |
| `triadic` (3)                 | `#6366f1`, `#e56514`, `#00724d`            |
| `tetradic` (4)                | `#6366f1`, `#dc5cb4`, `#b8ad4a`, `#009f6e` |
| `triadic` (3), `space: "hsl"` | `#6366f1`, `#f58a8b`, `#42ee3f`            |

The last row shows why HCT is the default. Rotating hue in HSL keeps HSL lightness, not perceived lightness: the HSL green `#42ee3f` is `hct(143.1, 92.3, 83.3)`, tone 83 next to the indigo's 50. The HCT triadic colors stay at tones 58 (`#e56514`) and 42 (`#00724d`). See [Palettes](/tools/palettes) for all nine harmony types and the `ryb` and `oklch` wheels.

## Contrast

> "Check contrast between #1f2937 and white."

Tool call: `check_contrast { "foreground": "#1f2937", "background": "#ffffff" }`

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 14.68:1
- AA (normal text):  ✓ Pass (need 4.5:1)
- AA (large text):   ✓ Pass (need 3:1)
- AAA (normal text): ✓ Pass (need 7:1)
- AAA (large text):  ✓ Pass (need 4.5:1)
```

> "Is #6366f1 readable on a white background?"

Tool call: `check_contrast { "foreground": "#6366f1", "background": "#ffffff" }`

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 4.47:1
- AA (normal text):  ✗ Fail (need 4.5:1)
- AA (large text):   ✓ Pass (need 3:1)
- AAA (normal text): ✗ Fail (need 7:1)
- AAA (large text):  ✗ Fail (need 4.5:1)

## Agent Guidance
- **Nearest AA fix (hue-preserving)**: foreground `#6365f0` on `#ffffff` → 4.52:1 (APCA Lc 70.9, ΔE=0.4)
```

> "I want white text on a #6366f1 button. Keep the text white and make it pass AA."

Tool call: `fix_contrast { "foreground": "#ffffff", "background": "#6366f1", "adjust": "background" }`

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: background (ΔE2000 shift = 0.35)
- **Before**: `#ffffff` on `#6366f1` → 4.47:1 (APCA Lc -76.1)
- **After**:  `#ffffff` on `#6365f0` → **4.52:1** (APCA Lc **-76.4**)
```

A ΔE2000 shift of 0.35 is not visible. `fix_contrast` also supports AAA, large-text, UI and APCA targets; see [Agent Tools](/tools/agent-tools). To get APCA as well as WCAG, pass `"algorithm": "both"` to `check_contrast`:

Tool call: `check_contrast { "foreground": "#ffffff", "background": "#6366f1", "algorithm": "both", "suggestFix": false }`

```text
## WCAG 2.x luminance ratio
Contrast Ratio: 4.47:1
…
## APCA (WCAG 3 draft)
Lc: -76.1 (light text on dark bg)
- Body text (|Lc| ≥ 75):    ✓ Pass
- Content text (|Lc| ≥ 60): ✓ Pass
- Large text (|Lc| ≥ 45):   ✓ Pass
- Spot / non-content (|Lc| ≥ 30): ✓ Pass
```

## Color Distance

`color_distance` uses ΔE2000 unless you pass `metric`.

| Prompt                                                  | Tool call                                                                           | Result  |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| "How similar are #6366f1 and #5355d1?"                  | `color_distance { "color1": "#6366f1", "color2": "#5355d1" }`                       | `7.37`  |
| "Are #6366f0 and #6366f1 close enough to treat as one?" | `color_distance { "color1": "#6366f0", "color2": "#6366f1" }`                       | `0.13`  |
| "ΔE76 between #6366f1 and #3b82f6?"                     | `color_distance { "color1": "#6366f1", "color2": "#3b82f6", "metric": "deltaE76" }` | `22.68` |

The tool returns one line, e.g. `Distance between #6366f1 and #5355d1: 7.37`. For reference, `check_palette_accessibility` treats two colors as indistinguishable below ΔE2000 10 by default. See [Distance Metrics](/concepts/distance-metrics).

## Gradients

`steps` is the total number of colors, including every input color. The default interpolation is `lab`.

> "Create a 5-step gradient from #6366f1 to #ec4899."

Tool call: `generate_gradient { "colors": ["#6366f1", "#ec4899"], "steps": 5 }`

```text
Generated gradient with 5 steps:
1. #6366f1
2. #9660db
3. #b85ac4
4. #d452af
5. #ec4899

Interpolation: lab
Easing: linear
Input colors: #6366f1 → #ec4899
```

> "Gradient #6366f1 → #ec4899 → #10b981 in OKLCH, 5 colors."

Tool call: `generate_gradient { "colors": ["#6366f1", "#ec4899", "#10b981"], "steps": 5, "interpolation": "oklch" }` returns `#6366f1`, `#b554d9`, `#ec4899`, `#c58a00`, `#10b981`. Each input color is kept as a stop.

Interpolation space matters. Blue to yellow, 5 steps:

| `interpolation` | Result                                                |
| --------------- | ----------------------------------------------------- |
| `rgb`           | `#0000ff`, `#4040bf`, `#808080`, `#bfbf40`, `#ffff00` |
| `oklab`         | `#0000ff`, `#1d77e7`, `#6cabc7`, `#b5d797`, `#ffff00` |
| `oklch`         | `#0000ff`, `#0087ac`, `#00baae`, `#19f268`, `#ffff00` |

RGB passes through flat grey (`#808080`) in the middle. OKLab stays colored, and OKLCH goes around the hue wheel through cyan and green.

For CSS, ask for `format: "css-linear"`:

Tool call: `generate_gradient { "colors": ["#6366f1", "#ec4899"], "steps": 5, "interpolation": "oklch", "format": "css-linear" }`

```text
linear-gradient(90deg, #6366f1 0.0%, #905ceb 25.0%, #b554d9 50.0%, #d34cbd 75.0%, #ec4899 100.0%)
```

## Adjusting Colors

`adjust_color` works in OKLCH by default (`space` can be `hct` or `hsl`). Each call returns a single hex value.

| Prompt                            | Tool call                                                                                    | Result    |
| --------------------------------- | -------------------------------------------------------------------------------------------- | --------- |
| "Make #6366f1 20% lighter"        | `adjust_color { "color": "#6366f1", "operation": "lighten", "amount": 20 }`                  | `#a7b3ff` |
| "Make #6366f1 30% darker"         | `adjust_color { "color": "#6366f1", "operation": "darken", "amount": 30 }`                   | `#21007e` |
| "Desaturate #6366f1 by 50%"       | `adjust_color { "color": "#6366f1", "operation": "desaturate", "amount": 50 }`               | `#6d76b8` |
| "Make #6366f1 a bit more vibrant" | `adjust_color { "color": "#6366f1", "operation": "saturate" }`                               | `#6261fc` |
| "Mix #6366f1 and #ec4899"         | `adjust_color { "color": "#6366f1", "operation": "mix", "with": "#ec4899" }`                 | `#ac63c7` |
| "Mix them in HSL instead"         | `adjust_color { "color": "#6366f1", "operation": "mix", "with": "#ec4899", "space": "hsl" }` | `#a857c5` |

`mix` takes exactly two colors; `amount` is the weight of the first one (default 0.5). See [Color Operations](/tools/color-operations).

## Real-World Examples

### Button States

> "Give me hover, active, focus and disabled colors for a #6366f1 button on a light page."

Tool call: `generate_state_colors { "base": "#6366f1" }`

```text
# Interaction states for #6366f1 (light mode)

| state | tone | hex | notes |
|---|---|---|---|
| base | 50 | #6366f1 | resting |
| hover | 42 | #4e50dc | +/- 8 tone |
| active | 34 | #393ac8 | +/- 16 tone |
| pressed | 34 | #393ac8 | same as active, alias |
| focus | 46 | #595be6 | +/- 4 tone, used as outline |
| disabled | 70 | #acaab1 | low chroma, mid tone |
| selected | 90 | #e1e0ff | alpha-blend friendly base |
```

Pass `"isDark": true` for a button on a dark surface: hover then lightens instead of darkening.

### Checking Status and Form Colors

Popular Tailwind-style status colors look fine, but most fail with white text. Audit them all in one call instead of guessing:

> "Audit these: white on #10b981, #ef4444 and #3b82f6, black on #f59e0b, #1f2937 and #9ca3af placeholder text on white, and a #d1d5db input border on white."

Tool call: `audit_ui_colors` with these arguments:

```json
{
  "pairs": [
    { "name": "success", "fg": "#ffffff", "bg": "#10b981" },
    { "name": "warning", "fg": "#000000", "bg": "#f59e0b" },
    { "name": "error", "fg": "#ffffff", "bg": "#ef4444" },
    { "name": "info", "fg": "#ffffff", "bg": "#3b82f6" },
    { "name": "input-text", "fg": "#1f2937", "bg": "#ffffff" },
    { "name": "placeholder", "fg": "#9ca3af", "bg": "#ffffff" },
    { "name": "input-border", "fg": "#d1d5db", "bg": "#ffffff", "role": "ui" }
  ]
}
```

Result:

```text
# UI Color Audit

## Pair Checks (7)

| Pair | Role | WCAG | APCA Lc | Status | Fix / Notes |
|---|---|---|---|---|---|
| success (`#ffffff` on `#10b981`) | body | 2.54:1 | -54.2 | ✗ Fail | Use fg `#383a3b` (4.51:1); CVD drop (protanopia 2.3:1, deuteranopia 2.7:1, tritanopia 2.5:1) |
| warning (`#000000` on `#f59e0b`) | body | 9.78:1 | 62.2 | ✓ Pass | - |
| error (`#ffffff` on `#ef4444`) | body | 3.76:1 | -69.3 | ✗ Fail | Use fg `#1b1d1d` (4.50:1); CVD drop (deuteranopia 3.2:1) |
| info (`#ffffff` on `#3b82f6`) | body | 3.68:1 | -69.4 | ✗ Fail | Use fg `#1d1f1f` (4.50:1); CVD drop (protanopia 3.2:1, tritanopia 3.2:1) |
| input-text (`#1f2937` on `#ffffff`) | body | 14.68:1 | 101.5 | ✓ Pass | - |
| placeholder (`#9ca3af` on `#ffffff`) | body | 2.54:1 | 49.8 | ✗ Fail | Use fg `#707783` (4.51:1); CVD drop (protanopia 2.5:1, deuteranopia 2.5:1, tritanopia 2.5:1) |
| input-border (`#d1d5db` on `#ffffff`) | ui | 1.47:1 | 22.4 | ✗ Fail | Use fg `#91959b` (3.01:1); CVD drop (protanopia 1.5:1, deuteranopia 1.5:1, tritanopia 1.5:1) |

**Summary**: 5 item(s) flagged above.
```

The audit suggests new foreground colors. To keep the white text and darken the badge instead, ask for a background fix:

Tool call: `fix_contrast { "foreground": "#ffffff", "background": "#10b981", "adjust": "background" }`

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: background (ΔE2000 shift = 15.86)
- **Before**: `#ffffff` on `#10b981` → 2.54:1 (APCA Lc -54.2)
- **After**:  `#ffffff` on `#00875d` → **4.54:1** (APCA Lc **-76.4**)
```

### A Brand Color System

> "Build a 50–950 scale from #6366f1 called primary."

Tool call: `generate_tonal_scale { "seed": "#6366f1", "name": "primary" }`

```text
# Tonal scale for #6366f1
Seed HCT: H=284.6° C=68.0 T=50.1

| stop | tone | hex |
|---|---|---|
| 50 | 95 | #f2efff |
| 100 | 90 | #e1e0ff |
| 200 | 80 | #c0c1ff |
| 300 | 70 | #a0a3ff |
| 400 | 60 | #8083ff |
| 500 | 50 | #6366f1 |
| 600 | 40 | #4c4eca |
| 700 | 30 | #3537a6 |
| 800 | 20 | #202084 |
| 900 | 10 | #090566 |
| 950 | 5 | #03004d |

## CSS
…
```

The trimmed `## CSS` part is the same scale as `--primary-50` … `--primary-950` custom properties.

> "Now give me matching secondary, tertiary and status colors."

Tool call: `generate_semantic_palette { "brand": "#6366f1" }`

```text
# Semantic palette derived from #6366f1
Mode: light (target tone 40)
Family chroma: 68 (brand was 68)

| role | hue | hex | ΔE2000 from brand | hsl |
|---|---|---|---|---|
| primary | 285° | #494bd6 | 9.6 | hsl(239, 63%, 56%) |
| secondary | 255° | #0061a5 | 16.4 | hsl(205, 100%, 32%) |
| tertiary | 345° | #a42b84 | 26.2 | hsl(316, 58%, 41%) |
| error | 25° | #ae3029 | 42.3 | hsl(3, 62%, 42%) |
| info | 240° | #006590 | 18.5 | hsl(198, 100%, 28%) |
| success | 142° | #056e00 | 58.2 | hsl(117, 100%, 22%) |
| warning | 80° | #7d5700 | 57.0 | hsl(42, 100%, 25%) |

## CSS
…
```

For a full light + dark token set with verified text pairs, use `design_ui_palette`, shown in [Creating Themes](/examples/creating-themes). More scale and state tools are in [Visual Cohesion](/tools/cohesion).

## Tips

- Ask the assistant to call `describe_color` whenever it picks a color you can't picture. A hex code alone tells it very little.
- Check contrast against the background the color will actually sit on, and use `fix_contrast` rather than adjusting by hand.
- Interpolate gradients in `lab`, `oklab` or `oklch`. RGB goes grey in the middle when the endpoints are far apart.
- Use `audit_ui_colors` before shipping a palette. It checks every pair at once and includes color-vision-deficiency drops.

## Next Steps

- [Creating Themes](/examples/creating-themes): Material 3 themes and UI token sets
- [CSS Refactoring](/examples/css-refactoring): replace hardcoded colors with theme variables
- [Image Extraction](/examples/image-extraction): colors and themes from images
- [Distance Metrics](/concepts/distance-metrics): how color matching measures difference
