# Getting Started

This guide installs Coolors MCP and walks through a few real tool calls. Every result below is the exact text the server returns (long results are trimmed with `…`).

## 1. Install

Coolors MCP needs Node.js 20 or newer.

**Claude Code**

```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

**Claude Desktop, Cursor and other `mcpServers` clients**

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp"]
    }
  }
}
```

Restart the client after editing its configuration. In Claude Code, `/mcp` should list `coolors` as connected. Other setups are on the [Installation](/installation) page.

## 2. How you use it

You talk to your assistant in plain language; it picks a tool and fills in the arguments. Each step below shows a prompt you could type, the tool call the assistant makes, and the result it reads. You can make the same calls yourself with the [MCP Inspector](/installation#from-source).

## 3. See a color

Models cannot see a hex code. `describe_color` tells them what it looks like.

> Describe #6366f1

```json
{ "colors": ["#6366f1"] }
```

```text
# Perceptual Color Profile

## #6366f1 — **vibrant indigo**
- **Appearance**: medium, vibrant, cool (temp score -74)
- **Spaces**: `oklch(58.5% 0.2041 277.1)` | `hct(284.6, 68.0, 50.1)` | `hsl(239, 84%, 67%)` | `rgb(99, 102, 241)` | L=0.185
- **Text on this color**: use **#ffffff** (light) — light `#ffffff`: 4.47:1 (APCA 76) vs dark `#0f0f17`: 4.27:1 (APCA 33)
- **Best UI roles**: primary-cta-on-light, accent-highlight, focus-ring
```

## 4. Check and fix contrast

> Is #6366f1 readable as text on white?

`check_contrast`:

```json
{ "foreground": "#6366f1", "background": "#ffffff" }
```

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

To get a fix for a specific target, use `fix_contrast`. The `target` can be `aa`, `aaa`, `aa-large`, `ui`, `apca-body`, `apca-content` or `apca-large`:

```json
{ "foreground": "#6366f1", "background": "#ffffff", "target": "aa" }
```

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: foreground (ΔE2000 shift = 0.35)
- **Before**: `#6366f1` on `#ffffff` → 4.47:1 (APCA Lc 70.6)
- **After**:  `#6365f0` on `#ffffff` → **4.52:1** (APCA Lc **70.9**)
```

`check_contrast` with `"algorithm": "both"` adds the APCA Lc next to the WCAG ratio. See [Accessibility](/tools/accessibility).

## 5. Convert and compare colors

`convert_color` takes any [supported format](/tools/README#supported-color-formats) and outputs `hex`, `rgb`, `hsl`, `lab`, `hct`, `oklab` or `oklch`:

| Arguments                                 | Result                      |
| ----------------------------------------- | --------------------------- |
| `{"color": "#6366f1", "to": "rgb"}`       | `rgb(99, 102, 241)`         |
| `{"color": "#6366f1", "to": "hsl"}`       | `hsl(239, 84%, 67%)`        |
| `{"color": "#6366f1", "to": "lab"}`       | `lab(50.10, 38.69, -70.49)` |
| `{"color": "#6366f1", "to": "hct"}`       | `hct(284.6, 68.0, 50.1)`    |
| `{"color": "#6366f1", "to": "oklch"}`     | `oklch(58.5% 0.2041 277.1)` |
| `{"color": "rebeccapurple", "to": "hex"}` | `#663399`                   |

`color_distance` measures how different two colors look (ΔE2000 by default; larger means more different):

| Arguments                                    | Result                                        |
| -------------------------------------------- | --------------------------------------------- |
| `{"color1": "#6366f1", "color2": "#5355d1"}` | `Distance between #6366f1 and #5355d1: 7.37`  |
| `{"color1": "#ff0000", "color2": "#00ff00"}` | `Distance between #ff0000 and #00ff00: 86.61` |

## 6. Build colors from a brand color

> Make a tonal scale from #6366f1

`generate_tonal_scale` maps each stop to an HCT tone (stop 50 is tone 95, 500 is tone 50, 900 is tone 10) and keeps the seed's hue. `stops` is optional; the default is 50–950:

```json
{ "seed": "#6366f1", "name": "brand", "stops": [50, 100, 300, 500, 700, 900] }
```

```text
# Tonal scale for #6366f1
Seed HCT: H=284.6° C=68.0 T=50.1

| stop | tone | hex |
|---|---|---|
| 50 | 95 | #f2efff |
| 100 | 90 | #e1e0ff |
| 300 | 70 | #a0a3ff |
| 500 | 50 | #6366f1 |
| 700 | 30 | #3537a6 |
| 900 | 10 | #090566 |
…
```

The result also includes the scale as CSS variables (`--brand-50: #f2efff;` …).

Interaction states come from `generate_state_colors` with `{"base": "#6366f1"}`:

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

For a complete system in one call, use `design_ui_palette` (light + dark UI tokens), `generate_semantic_palette` (primary to status colors) or `generate_material_theme` (Material 3 schemes). See [Agent Tools](/tools/agent-tools), [Visual Cohesion](/tools/cohesion) and [Material Design](/tools/material-design).

## 7. Palettes and gradients

> Give me a triadic palette from #6366f1

`generate_palette`:

```json
{ "baseColor": "#6366f1", "type": "triadic", "count": 3 }
```

```text
Generated triadic palette (HCT):
1. #6366f1 — vibrant indigo (cool, tone 50, best text: #ffffff)
2. #e56514 — vibrant orange (warm, tone 58, best text: #ffffff)
3. #00724d — medium dark emerald (cool, tone 42, best text: #ffffff)
…
```

`generate_gradient` returns `steps` colors in total, including every input color:

```json
{ "colors": ["#6366f1", "#ec4899"], "steps": 5, "interpolation": "oklch" }
```

```text
Generated gradient with 5 steps:
1. #6366f1
2. #905ceb
3. #b554d9
4. #d34cbd
5. #ec4899

Interpolation: oklch
Easing: linear
Input colors: #6366f1 → #ec4899
```

More in [Palettes](/tools/palettes).

## 8. Move CSS onto theme variables

Pass your theme as `themeCSS`: any CSS with `--name: color;` custom properties.

```css
:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4338ca;
  --color-text: #111827;
  --color-surface: #ffffff;
}
```

`refactor_css_with_theme` with that theme and this stylesheet as `css`:

```css
.button {
  background: #6365f0;
  color: #fff;
  border: 1px solid #4f46e5;
}
.card {
  color: #1f2937;
}
```

returns (trimmed):

```text
Refactoring Complete!

Statistics:
- Total colors found: 4
- Colors replaced: 2
- Average confidence: 99%
- Accessibility issues: 2

Refactored CSS:
…
.button {
  background: /* #6365f0 */ var(--color-primary);
  color: /* #fff */ var(--color-surface);
  border: 1px solid #4f46e5;
}
.card {
  color: #1f2937;
}
…
- Low confidence match for #4f46e5: --color-primary-dark (69%)
  Suggestion: Consider using --color-primary-dark or defining a new theme variable
- No suitable theme variable found for #1f2937
  Suggestion: Consider adding this color to your theme
```

Only matches at or above `minConfidence` (default 70) are replaced. With `"minConfidence": 60`, `#4f46e5` also becomes `var(--color-primary-dark)`; `#1f2937` stays as it is until you add a matching variable. Set `"preserveOriginal": false` to drop the `/* #… */` comments. See [Theme Matching](/tools/theme-matching).

## 9. Colors from an image

The image tools take raw pixels, not files: `width`, `height` and a flat RGBA array of `width × height × 4` integers (0–255), at most 65 536 pixels. Downscale larger images first (256×256 fits).

This 4×4 image has 8 violet, 4 coral and 4 white pixels:

```json
{
  "imageData": {
    "width": 4,
    "height": 4,
    "data": [103, 80, 164, 255, 103, 80, 164, 255, …, 255, 255, 255, 255]
  },
  "maxColors": 3,
  "format": "css"
}
```

`extract_image_colors` returns:

```text
:root {
  --extracted-color-1: #6750a4; /* 66.7% */
  --extracted-color-2: #ff6b6b; /* 33.3% */
}
…
```

`generate_theme_from_image` turns the same pixels into a Material 3 theme with `#6750a4` as the primary color. See [Image Extraction](/tools/image-extraction).

## 10. Audit a DESIGN.md

`audit_design_md` takes the full text of a [DESIGN.md](https://github.com/google-labs-code/design.md) file:

```json
{
  "designMd": "---\nname: Acme\ncolors:\n  primary: \"#cc785c\"\n  on-primary: \"#ffffff\"\n---\n"
}
```

```text
# DESIGN.md color audit

Color tokens: 2 (2 audited, 0 not audited) · Contrast pairs: 1 (0 declared, 1 inferred) · Failing: 1 · CVD collisions: 0 · Duplicates: 0 exact, 0 near

## Contrast

| text / element | on background | source | WCAG | needs | APCA Lc | result | suggested fix |
|---|---|---|---|---|---|---|---|
| `on-primary` #ffffff | `primary` #cc785c | inferred · on-X ↔ X | 3.28:1 | 4.5:1 (text) | -65.3 | ✗ | on-primary → `#262829` (4.52:1) |
…
```

See [DESIGN.md Audit](/tools/design-md).

## When something goes wrong

Bad input comes back as a tool result with `isError: true` and a readable message, so the assistant can correct itself and retry:

- `convert_color` with `{"color": "nope", "to": "hex"}` returns `Invalid color format: nope`.
- `convert_color` with `{"color": "#6750a4", "to": "cmyk"}` returns:

```text
Invalid arguments for tool 'convert_color': to: Invalid option: expected one of "hex"|"rgb"|"hsl"|"lab"|"hct"|"oklab"|"oklch"
```

More in [Troubleshooting](/resources/troubleshooting).

## Next steps

- [Tools Overview](/tools/README): all 31 tools, limits and color formats
- [HCT](/concepts/hct): the color space behind themes, scales and fixes
- [Accessibility](/concepts/accessibility): WCAG 2.x, APCA and color-vision deficiency
- [Changelog](/changelog): what changed in each release
