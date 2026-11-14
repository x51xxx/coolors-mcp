# Tools Overview

Coolors MCP exposes **31 tools**. Every tool is read-only and runs locally: the tool annotations are `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true` and `openWorldHint: false`. No tool needs an API key or makes network requests.

Each row below links to the page that documents the tool's parameters and output.

## All tools

### Agent tools

Tools that answer the questions an agent cannot answer from a hex code alone. Documented on [Agent Tools](/tools/agent-tools).

| Tool                                                 | What it does                                                                                                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`describe_color`](/tools/agent-tools)               | Describes 1–20 colors: perceptual name, temperature, lightness and vividness, OKLCH/HCT/HSL/RGB values, readable text color, UI roles and pitfalls.      |
| [`fix_contrast`](/tools/agent-tools)                 | Finds the closest same-hue color (in HCT) that meets a WCAG 2.x or APCA target, adjusting the foreground, the background or whichever needs less change. |
| [`design_ui_palette`](/tools/agent-tools)            | Builds a contrast-checked light + dark UI token set following the 60-30-10 rule from one brand color.                                                    |
| [`audit_ui_colors`](/tools/agent-tools)              | Audits foreground/background pairs and swatches in one call: WCAG, APCA, CVD contrast drops, vibration and disliked colors, with fixes.                  |
| [`generate_categorical_palette`](/tools/agent-tools) | Generates 2–12 categorical colors for charts, badges or tags that stay distinct under normal vision and protanopia, deuteranopia and tritanopia.         |

### Color operations

Documented on [Color Operations](/tools/color-operations).

| Tool                                        | What it does                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| [`convert_color`](/tools/color-operations)  | Converts a color to `hex`, `rgb`, `hsl`, `lab`, `hct`, `oklab` or `oklch`.                                               |
| [`color_distance`](/tools/color-operations) | Distance between two colors with `deltaE2000` (default), `deltaE94`, `deltaE76`, `euclidean` or `weighted`.              |
| [`check_contrast`](/tools/color-operations) | WCAG 2.x ratio, APCA Lc, or both. Failing pairs get CVD warnings and the nearest same-hue AA fix.                        |
| [`adjust_color`](/tools/color-operations)   | Lighten, darken, saturate, desaturate, hue-shift, tint, shade, grayscale, invert or mix, in OKLCH (default), HCT or HSL. |

### Accessibility

Documented on [Accessibility](/tools/accessibility), which also covers `check_contrast` in detail.

| Tool                                                  | What it does                                                                                                                                |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| [`simulate_color_blindness`](/tools/accessibility)    | Shows how colors look under protanopia, deuteranopia, tritanopia, protanomaly, deuteranomaly, tritanomaly and achromatopsia.                |
| [`check_palette_accessibility`](/tools/accessibility) | For every pair in a palette, reports ΔE2000 under each deficiency type and flags pairs below a threshold (default 10) as indistinguishable. |

### Palettes

Documented on [Palettes](/tools/palettes).

| Tool                                             | What it does                                                                                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| [`generate_palette`](/tools/palettes)            | Color-harmony palette (9 harmony types) on an HCT, OKLCH, RYB or HSL wheel; avoids disliked colors unless `allowDisliked` is set. |
| [`generate_palette_with_locks`](/tools/palettes) | Palette that keeps the colors you lock, in `harmony`, `contrast` or `gradient` mode.                                              |
| [`generate_gradient`](/tools/palettes)           | Gradient with `steps` total colors through every input color, in 7 interpolation spaces, with easing and CSS output.              |
| [`export_palette`](/tools/palettes)              | Exports colors as CSS custom properties, SCSS, Tailwind config, W3C design tokens, JSON or a DESIGN.md `colors:` block.           |

### Visual cohesion

Documented on [Visual Cohesion](/tools/cohesion).

| Tool                                             | What it does                                                                                                            |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| [`generate_tonal_scale`](/tools/cohesion)        | Tailwind-style 50–950 scale (or custom stops) from a seed color; stop 50 is HCT tone 95, 500 is tone 50, 950 is tone 5. |
| [`generate_state_colors`](/tools/cohesion)       | Hover, active, pressed, focus, disabled and selected colors from a base color, for light or dark surfaces.              |
| [`analyze_palette_consistency`](/tools/cohesion) | Scores tonal uniformity, chroma cohesion and hue harmony, with an overall 0–100 cohesion score and suggestions.         |
| [`generate_semantic_palette`](/tools/cohesion)   | Primary, secondary, tertiary, success, warning, error and info colors with tone and chroma matched in HCT.              |

### Material Design 3

Documented on [Material Design](/tools/material-design).

| Tool                                                | What it does                                                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| [`generate_material_theme`](/tools/material-design) | Light and dark Material 3 color schemes from a source color.                                                            |
| [`harmonize_colors`](/tools/material-design)        | `harmonize` shifts colors toward the first color's hue, `blend` mixes them into one, `temperature` warms or cools them. |
| [`generate_tonal_palette`](/tools/material-design)  | Material tonal palette for the standard tones or a custom list of tones.                                                |

### CSS theme matching

Documented on [Theme Matching](/tools/theme-matching).

| Tool                                                | What it does                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [`match_theme_color`](/tools/theme-matching)        | Finds the theme custom property closest to a color, with a confidence score.              |
| [`match_theme_colors_batch`](/tools/theme-matching) | Matches up to 50 colors against the same theme.                                           |
| [`refactor_css_with_theme`](/tools/theme-matching)  | Replaces hard-coded colors in declaration values with `var(--…)` references.              |
| [`generate_theme_css`](/tools/theme-matching)       | Generates Material tonal palettes and light-theme role mappings as CSS custom properties. |

### Images and color psychology

Documented on [Image Extraction](/tools/image-extraction).

| Tool                                                   | What it does                                                                                    |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [`extract_image_colors`](/tools/image-extraction)      | Extracts dominant colors from RGBA pixel data (Celebi quantization) as JSON, CSS or a palette.  |
| [`generate_theme_from_image`](/tools/image-extraction) | Generates a Material 3 theme seeded from an image's colors.                                     |
| [`analyze_color_likability`](/tools/image-extraction)  | Checks whether a color is a universally disliked dark yellow-green and returns a fixed version. |
| [`fix_disliked_colors_batch`](/tools/image-extraction) | Checks up to 100 colors and returns liked versions.                                             |

### DESIGN.md

Documented on [DESIGN.md Audit](/tools/design-md).

| Tool                                  | What it does                                                                                                                                                                  |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`audit_design_md`](/tools/design-md) | Audits the color tokens of a DESIGN.md file: contrast of declared and inferred pairs, CVD collisions, duplicates, disliked colors, broken references and a missing `primary`. |

## Choosing a tool

| You want to…                               | Use                                                                           |
| ------------------------------------------ | ----------------------------------------------------------------------------- |
| Know what a hex code looks like            | `describe_color`                                                              |
| Check or fix one text/background pair      | `check_contrast`, then `fix_contrast`                                         |
| Check a whole UI's color pairs at once     | `audit_ui_colors`                                                             |
| Start a UI color system from a brand color | `design_ui_palette`, `generate_semantic_palette` or `generate_material_theme` |
| Build shades of one color                  | `generate_tonal_scale` or `generate_tonal_palette`                            |
| Pick chart or tag colors                   | `generate_categorical_palette`                                                |
| Check a palette for color-blind viewers    | `check_palette_accessibility` or `simulate_color_blindness`                   |
| Move a stylesheet onto theme variables     | `match_theme_colors_batch`, then `refactor_css_with_theme`                    |
| Get colors or a theme from an image        | `extract_image_colors` or `generate_theme_from_image`                         |
| Ship the colors                            | `export_palette` or `generate_theme_css`                                      |
| Review a DESIGN.md                         | `audit_design_md`                                                             |

## Supported color formats

Every color parameter is a string in one of these formats:

| Format                | Examples                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Hex                   | `#639`, `#6750a4`, `#6750a4ff` (alpha is ignored), bare `6750a4` |
| CSS named colors      | `rebeccapurple`, `white`                                         |
| `rgb()` / `rgba()`    | `rgb(103, 80, 164)`, `rgb(103 80 164)`, `rgb(40% 31% 64%)`       |
| `hsl()` / `hsla()`    | `hsl(256, 34%, 48%)`, `hsl(256 34% 48%)`                         |
| `oklch()` / `oklab()` | `oklch(49.6% 0.1305 293.7)`, `oklab(0.496 0.03 -0.12)`           |
| `hct()`               | `hct(299, 47.9, 40.1)`                                           |

- `rgb()` channels outside 0–255 are clamped as in CSS: `rgb(300, -5, 164)` becomes `#ff00a4`.
- `hsl()` hues wrap around: `hsl(616, 34%, 48%)` is the same color as `hsl(256, 34%, 48%)`.
- Not supported: `hwb()`, `lab()`, `lch()`, `color()`, `color-mix()` and `transparent`. Invalid hex such as `#ggg` or `#12345` is rejected.
- `convert_color` can output `lab(…)`, but that string is not accepted back as input.

## Errors

Invalid input does not crash the call. The tool returns a normal MCP result with `isError: true` and a message the model can read and act on:

| Cause                           | Example message                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Color that cannot be parsed     | `Invalid color format: hwb(120 10% 20%)`                                                                      |
| Wrong type or missing parameter | `Invalid arguments for tool 'check_contrast': background: Invalid input: expected string, received undefined` |
| Value outside a limit           | `Invalid arguments for tool 'describe_color': colors: Too big: expected array to have <=20 items`             |
| Tool-specific check             | `steps (3) must be at least the number of input colors (4)` (`generate_gradient`)                             |

Calling a tool name that does not exist is a JSON-RPC protocol error (`-32601`), not a tool result. More cases and fixes: [Troubleshooting](/resources/troubleshooting).

## Limits

Input limits enforced by the tool schemas:

| Tool                           | Limit                                                                                                      |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `describe_color`               | `colors`: 1–20                                                                                             |
| `audit_ui_colors`              | `pairs`: up to 100; `swatches`: up to 64                                                                   |
| `generate_categorical_palette` | `count`: 2–12                                                                                              |
| `generate_palette`             | `count`: 3–12                                                                                              |
| `generate_palette_with_locks`  | `lockedColors`: 1–19; `totalColors`: 2–20                                                                  |
| `generate_gradient`            | `colors`: 2–32; `steps`: 3–100 and at least the number of colors                                           |
| `export_palette`               | `colors`: 1–256; `names`: up to 256 and the same length as `colors`                                        |
| `simulate_color_blindness`     | `colors`: 1–64                                                                                             |
| `check_palette_accessibility`  | `colors`: 2–64; `indistinguishableThreshold`: 1–30; at most 20 pairs listed per type                       |
| `generate_tonal_scale`         | `chromaBoost`: 0–2; `stops`: up to 32 values, each 0–1000                                                  |
| `analyze_palette_consistency`  | `colors`: 2–64                                                                                             |
| `harmonize_colors`             | `colors`: 2–10; `factor`: 0–1                                                                              |
| `generate_tonal_palette`       | `tones`: up to 32 values, each 0–100                                                                       |
| `generate_theme_css`           | `includeTones`: up to 32 values, each 0–100                                                                |
| `match_theme_color`            | `themeCSS`: up to 200 000 characters; `minConfidence`: 0–100                                               |
| `match_theme_colors_batch`     | `colors`: 1–50; `themeCSS`: up to 200 000 characters                                                       |
| `refactor_css_with_theme`      | `css`: up to 500 000 characters; `themeCSS`: up to 200 000; `minConfidence`: 0–100                         |
| `extract_image_colors`         | `imageData`: at most 65 536 pixels (e.g. 256×256), `data.length` = `width × height × 4`; `maxColors`: 1–20 |
| `generate_theme_from_image`    | `imageData`: same as `extract_image_colors`                                                                |
| `audit_design_md`              | `designMd`: 1–500 000 characters; `textThreshold`: 3–7; `cvdThreshold`: 1–30; `maxItems`: 5–200            |
| `fix_disliked_colors_batch`    | `colors`: 1–100                                                                                            |

The other tools have no array or string-length limits.

## Common workflows

### UI color system from a brand color

1. `describe_color` to confirm what the brand color looks like.
2. `design_ui_palette` for light and dark tokens, or `generate_semantic_palette` plus `generate_tonal_scale` for your own token structure.
3. `generate_state_colors` for hover, active, focus and disabled states.
4. `audit_ui_colors` on the final text/background pairs.
5. `export_palette` to CSS, SCSS, Tailwind, W3C tokens or DESIGN.md.

### Migrating hard-coded CSS to theme variables

1. `generate_theme_css` if you do not have a theme yet, or pass your existing theme as `themeCSS`.
2. `match_theme_colors_batch` to preview the matches and their confidence.
3. `refactor_css_with_theme` with `generateReport: true` to rewrite the stylesheet.

### Image-based theme

1. `extract_image_colors` to see the dominant colors.
2. `generate_theme_from_image` for a Material theme, or `generate_material_theme` with a color you pick from step 1.
3. `generate_theme_css` to export it.

### Color-blind-safe charts

1. `generate_categorical_palette` with the number of series and the canvas polarity.
2. `check_palette_accessibility` to confirm the colors stay distinct.

## Next steps

- [Getting Started](/getting-started): first calls with real output
- [Troubleshooting](/resources/troubleshooting): common errors and how to fix them
- [HCT](/concepts/hct) and [Color Spaces](/concepts/color-spaces): the color models behind the tools
