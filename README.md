# Coolors MCP

A Model Context Protocol (MCP) server that gives AI assistants real color tools: perceptual color descriptions, WCAG 2.x and APCA contrast checks with exact fixes, Material Design 3 themes built on Google's HCT, palettes and gradients, color-vision-deficiency checks, CSS theme matching and refactoring, image color extraction, and DESIGN.md audits.

- **31 tools**, all read-only and local: no API keys, no network access, stdio transport.
- **Documentation:** <https://x51xxx.github.io/coolors-mcp/>
- **Changelog:** [CHANGELOG.md](CHANGELOG.md)

## Features

- **Colors an agent can "see"**: `describe_color` turns a hex code into a name, temperature, lightness/vividness, OKLCH/HCT/HSL/RGB values, the best text color and likely UI roles.
- **Contrast without guessing**: WCAG 2.x ratio and APCA Lc (matches `apca-w3` 0.1.9) side by side; `fix_contrast` finds the closest same-hue color that meets AA, AAA, UI or an APCA target.
- **Google's HCT**: the CAM16-based HCT from [`@material/material-color-utilities`](https://github.com/material-foundation/material-color-utilities) drives Material themes, tonal palettes and scales, state colors, harmonization and dislike detection.
- **Material Design 3**: light and dark schemes, tonal palettes, harmonization, and CSS custom properties from one source color.
- **UI palettes**: a contrast-checked light + dark 60-30-10 UI token set, semantic (primary/secondary/tertiary + status) palettes, Tailwind-style tonal scales, interaction-state colors and a palette cohesion score.
- **Palettes and gradients**: color-harmony palettes (HCT, OKLCH, RYB or HSL wheel), palettes with locked colors, gradients interpolated in OKLCH, OKLab, Lab, LCh, HCT, HSL or RGB, and color-blind-safe categorical palettes for charts.
- **Color-vision deficiency**: simulation of 7 deficiency types (Machado et al. 2009 matrices in linear sRGB for the protan, deutan and tritan types; achromatopsia as a grey of equal luminance) and pairwise collision audits of palettes.
- **Distance metrics**: ΔE2000, ΔE94, ΔE76, Euclidean RGB and weighted RGB.
- **CSS theme matching**: map hard-coded colors to your theme's custom properties, and rewrite a stylesheet to use them.
- **Images**: dominant colors with Celebi quantization, and a Material theme from an image.
- **Dislike analysis**: detect and fix "bile zone" dark yellow-greens.
- **Export**: CSS custom properties, SCSS, Tailwind config, W3C design tokens, JSON, or a DESIGN.md `colors:` block.
- **DESIGN.md audits**: contrast, color-blind collisions, duplicates and broken references in a [DESIGN.md](https://github.com/google-labs-code/design.md) file.

## Installation

Requires **Node.js 20 or newer** and an MCP client. The package runs with `npx`, so there is nothing to install first.

### Claude Code

```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

Run `/mcp` in Claude Code to check that `coolors` is connected.

### Claude Desktop, Cursor and other MCP clients

Add the server to the client's MCP configuration (for Claude Desktop, `claude_desktop_config.json`), then restart the client:

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

### Global install

```bash
npm install -g @trishchuk/coolors-mcp
claude mcp add coolors -- coolors-mcp
```

In JSON configs, use `"command": "coolors-mcp"` with no `args`.

### From source

```bash
git clone https://github.com/x51xxx/coolors-mcp.git
cd coolors-mcp
pnpm install
pnpm run build
```

Then point your client at the built server: `"command": "node"`, `"args": ["/absolute/path/to/coolors-mcp/dist/bin/server.js"]`.

The server has no configuration options or environment variables. The metadata for the official MCP Registry (`io.github.x51xxx/coolors-mcp`) is in [`server.json`](server.json); the registry listing goes live with the next npm release.

More setup detail: [Installation](https://x51xxx.github.io/coolors-mcp/installation) · [Troubleshooting](https://x51xxx.github.io/coolors-mcp/resources/troubleshooting)

## Quick example

Ask your assistant _"Is #6366f1 readable on white? Fix it if not."_ It calls `check_contrast`:

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

## Tools

All 31 tools, grouped as in the [tools reference](https://x51xxx.github.io/coolors-mcp/tools/README). Every tool takes colors as strings in any [supported format](#supported-color-formats).

### Agent tools ([docs](https://x51xxx.github.io/coolors-mcp/tools/agent-tools))

| Tool                           | What it does                                                                                                                                                      |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describe_color`               | Describes up to 20 colors in human terms: name, temperature, lightness and vividness, OKLCH/HCT/HSL/RGB, readable text color, UI roles, pitfalls.                 |
| `fix_contrast`                 | Finds the closest same-hue color that meets `aa`, `aaa`, `aa-large`, `ui`, `apca-body`, `apca-content` or `apca-large`. Adjusts foreground, background or either. |
| `design_ui_palette`            | Builds a contrast-checked light + dark UI token set (60-30-10) from one brand color, as a report, CSS, JSON or W3C tokens.                                        |
| `audit_ui_colors`              | Audits up to 100 foreground/background pairs and 64 swatches: WCAG, APCA, CVD contrast drops, vibration and disliked colors, with fixes.                          |
| `generate_categorical_palette` | Generates 2–12 chart or tag colors that stay distinct for normal vision and protan/deutan/tritan viewers.                                                         |

```json
{ "foreground": "#9e9e9e", "background": "#ffffff", "target": "aa" }
```

`fix_contrast` returns:

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: foreground (ΔE2000 shift = 14.12)
- **Before**: `#9e9e9e` on `#ffffff` → 2.68:1 (APCA Lc 52.1)
- **After**:  `#767677` on `#ffffff` → **4.54:1** (APCA Lc **71.5**)
```

### Color operations ([docs](https://x51xxx.github.io/coolors-mcp/tools/color-operations))

| Tool             | What it does                                                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `convert_color`  | Converts a color to `hex`, `rgb`, `hsl`, `lab`, `hct`, `oklab` or `oklch`.                                                                   |
| `color_distance` | Perceptual distance between two colors: `deltaE2000` (default), `deltaE94`, `deltaE76`, `euclidean` or `weighted`.                           |
| `check_contrast` | WCAG 2.x ratio, APCA Lc or both, with CVD warnings and the nearest same-hue AA fix when a pair fails.                                        |
| `adjust_color`   | `lighten`, `darken`, `saturate`, `desaturate`, `hue-shift`, `tint`, `shade`, `grayscale`, `invert` or `mix`, in OKLCH (default), HCT or HSL. |

| Call                                                                                        | Result                                       |
| ------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `convert_color` `{"color": "#6750a4", "to": "hct"}`                                         | `hct(299.0, 47.9, 40.1)`                     |
| `convert_color` `{"color": "rebeccapurple", "to": "oklch"}`                                 | `oklch(44.0% 0.1603 303.4)`                  |
| `color_distance` `{"color1": "#6750a4", "color2": "#7f67be"}`                               | `Distance between #6750a4 and #7f67be: 8.80` |
| `adjust_color` `{"color": "#6750a4", "operation": "lighten", "amount": 10}`                 | `#846ec5`                                    |
| `adjust_color` `{"color": "#6750a4", "operation": "mix", "with": "#ff6b6b", "amount": 0.5}` | `#b1648e`                                    |

### Accessibility ([docs](https://x51xxx.github.io/coolors-mcp/tools/accessibility))

| Tool                          | What it does                                                                                                      |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `simulate_color_blindness`    | Shows how up to 64 colors look under protanopia, deuteranopia, tritanopia, the three anomalies and achromatopsia. |
| `check_palette_accessibility` | Flags palette pairs whose ΔE2000 falls below a threshold (default 10) under each deficiency type.                 |

`check_contrast` (above) covers text/background pairs. With `"algorithm": "both"`, black on white gives `Contrast Ratio: 21.00:1` and `Lc: 106.0 (dark text on light bg)`.

### Palettes ([docs](https://x51xxx.github.io/coolors-mcp/tools/palettes))

| Tool                          | What it does                                                                                                                                              |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_palette`            | Color-harmony palette (monochromatic, analogous, complementary, split-complementary, triadic, tetradic, square, compound, shades-and-tints), 3–12 colors. |
| `generate_palette_with_locks` | Palette of 2–20 colors that keeps your locked colors, in `harmony`, `contrast` or `gradient` mode.                                                        |
| `generate_gradient`           | Gradient of `steps` total colors (every input color is kept) as an array, hex list or CSS `linear-gradient`/`radial-gradient`.                            |
| `export_palette`              | Exports up to 256 colors as `css`, `scss`, `tailwind`, `tokens` (W3C), `json` or `design-md`.                                                             |

```json
{
  "colors": ["#6750a4", "#ff6b6b"],
  "steps": 5,
  "interpolation": "oklch",
  "format": "css-linear"
}
```

`generate_gradient` returns:

```text
linear-gradient(90deg, #6750a4 0.0%, #9153a9 25.0%, #ba57a1 50.0%, #e05d8c 75.0%, #ff6b6b 100.0%)
```

`export_palette` with `"format": "design-md"` writes a `colors:` block for a DESIGN.md front matter:

```json
{
  "colors": ["#6750a4", "#625b71", "#7e5260"],
  "format": "design-md",
  "names": ["primary", "secondary", "tertiary"]
}
```

```yaml
colors:
  primary: "#6750a4"
  secondary: "#625b71"
  tertiary: "#7e5260"
```

### Visual cohesion ([docs](https://x51xxx.github.io/coolors-mcp/tools/cohesion))

| Tool                          | What it does                                                                                                                                    |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `generate_tonal_scale`        | Tailwind-style 50–950 scale (or custom stops) from a seed color; stop 50 is HCT tone 95, 500 is tone 50, 950 is tone 5. Includes CSS variables. |
| `generate_state_colors`       | Hover, active, pressed, focus, disabled and selected colors from a base color, for light or dark surfaces.                                      |
| `analyze_palette_consistency` | Scores tonal step uniformity, chroma cohesion and hue harmony, with an overall 0–100 cohesion score.                                            |
| `generate_semantic_palette`   | Primary, secondary, tertiary and success/warning/error/info colors with matched tone and chroma.                                                |

`analyze_palette_consistency` with `{"colors": ["#6750a4", "#7f67be", "#a48dc8", "#ff0000"]}` scores the palette 75/100 and reports `Likely outlier: #ff0000 (chroma 113 vs avg 61).`

### Material Design 3 ([docs](https://x51xxx.github.io/coolors-mcp/tools/material-design))

| Tool                      | What it does                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `generate_material_theme` | Light and dark Material 3 schemes (primary, secondary, tertiary, error, surface roles) from a source color.                          |
| `harmonize_colors`        | For 2–10 colors: `harmonize` shifts each hue toward the first color, `blend` mixes them into one, `temperature` warms or cools them. |
| `generate_tonal_palette`  | Material tonal palette for the standard tones or your own list of tones (0–100).                                                     |

`generate_material_theme` with `{"sourceColor": "#6750a4"}` returns, among others, `primary: #6750a4`, `primaryContainer: #e9ddff` and `onPrimaryContainer: #22005d` for the light scheme, and `primary: #cfbcff` and `onPrimary: #381e72` for the dark scheme.

### CSS theme matching ([docs](https://x51xxx.github.io/coolors-mcp/tools/theme-matching))

| Tool                       | What it does                                                                                        |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `match_theme_color`        | Finds the theme custom property closest to a color, with a confidence score.                        |
| `match_theme_colors_batch` | The same for up to 50 colors.                                                                       |
| `refactor_css_with_theme`  | Rewrites hard-coded colors in declaration values to `var(--…)` references, with an optional report. |
| `generate_theme_css`       | Material tonal palettes and light-theme role mappings as CSS custom properties.                     |

```json
{
  "css": ".button { background: #6850a0; color: #fffbfe; }",
  "themeCSS": ":root { --color-primary: #6750a4; --color-surface: #fffbfe; --color-on-surface: #1c1b1f; }"
}
```

`refactor_css_with_theme` rewrites the rule to:

```text
.button { background: /* #6850a0 */ var(--color-primary); color: /* #fffbfe */ var(--color-surface); }
```

### Images and color psychology ([docs](https://x51xxx.github.io/coolors-mcp/tools/image-extraction))

| Tool                        | What it does                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------------- |
| `extract_image_colors`      | Dominant colors of an RGBA image (Celebi quantization) as JSON, CSS or a palette.               |
| `generate_theme_from_image` | A Material 3 theme seeded from an image's colors.                                               |
| `analyze_color_likability`  | Checks whether a color is a universally disliked dark yellow-green and returns a fixed version. |
| `fix_disliked_colors_batch` | Checks up to 100 colors and returns liked versions.                                             |

Images are passed as raw pixels: `{"imageData": {"width": 4, "height": 4, "data": [103, 80, 164, 255, …]}}`, a flat RGBA array of `width × height × 4` integers. `analyze_color_likability` with `{"color": "#6b6b00"}` reports the color as disliked and suggests `#b0b048`.

### DESIGN.md ([docs](https://x51xxx.github.io/coolors-mcp/tools/design-md))

| Tool              | What it does                                                                                                     |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- |
| `audit_design_md` | Audits the color tokens of a [DESIGN.md](https://github.com/google-labs-code/design.md) file and suggests fixes. |

It reads the YAML front matter and ` ```yaml ` blocks, and checks WCAG and APCA contrast for pairs declared in `components` (`backgroundColor`/`textColor`) and pairs inferred from token names (`on-X` ↔ `X`, text ↔ surface tokens). It also reports color-blind collisions between accent and status colors, exact and near-duplicate tokens, disliked colors, broken `{colors.x}` references and a missing `primary`. Failing pairs get a same-hue fix. Values the auditor cannot evaluate (`hwb()`, `lab()`, `lch()`, `color()`, `color-mix()`, `transparent`) are listed, never guessed.

```json
{
  "designMd": "---\nname: Acme\ncolors:\n  primary: \"#cc785c\"\n  on-primary: \"#ffffff\"\n---\n",
  "textThreshold": 4.5,
  "cvdThreshold": 10
}
```

```text
…
| `on-primary` #ffffff | `primary` #cc785c | inferred · on-X ↔ X | 3.28:1 | 4.5:1 (text) | -65.3 | ✗ | on-primary → `#262829` (4.52:1) |
…
```

Claude Code does not load DESIGN.md on its own: reference it as `@DESIGN.md` from your `CLAUDE.md`.

## Supported color formats

Every color parameter accepts:

| Format                | Examples                                                         |
| --------------------- | ---------------------------------------------------------------- |
| Hex                   | `#639`, `#6750a4`, `#6750a4ff` (alpha is ignored), bare `6750a4` |
| CSS named colors      | `rebeccapurple`, `white`                                         |
| `rgb()` / `rgba()`    | `rgb(103, 80, 164)`, `rgb(103 80 164)`, `rgb(40% 31% 64%)`       |
| `hsl()` / `hsla()`    | `hsl(256, 34%, 48%)`, `hsl(256 34% 48%)`                         |
| `oklch()` / `oklab()` | `oklch(49.6% 0.1305 293.7)`, `oklab(0.496 0.03 -0.12)`           |
| `hct()`               | `hct(299, 47.9, 40.1)`                                           |

`rgb()` channels are clamped to 0–255 as in CSS, `hsl()` hues wrap around. Not supported: `hwb()`, `lab()`, `lch()`, `color()`, `color-mix()` and `transparent`. Invalid hex such as `#ggg` or `#12345` is rejected. `convert_color` can output `lab(…)`, but that output is not accepted back as input.

## Errors and limits

Errors come back as normal tool results with `isError: true` and a message the model can read and act on:

- Unparseable color: `Invalid color format: nope`
- Wrong type, missing parameter or a value over a limit: `Invalid arguments for tool 'convert_color': color: Invalid input: expected string, received number`
- Tool-specific checks, for example `steps (3) must be at least the number of input colors (4)` from `generate_gradient`.

Calling a tool name that does not exist is a JSON-RPC protocol error, not a tool result.

Main input limits (the [tools reference](https://x51xxx.github.io/coolors-mcp/tools/README) lists all of them):

| Input                                                                                           | Limit                                                              |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `describe_color` colors                                                                         | 20                                                                 |
| `simulate_color_blindness`, `check_palette_accessibility`, `analyze_palette_consistency` colors | 64                                                                 |
| `generate_gradient` colors / steps                                                              | 32 / 3–100                                                         |
| `audit_ui_colors` pairs / swatches                                                              | 100 / 64                                                           |
| `fix_disliked_colors_batch` colors                                                              | 100                                                                |
| `export_palette` colors                                                                         | 256                                                                |
| `themeCSS`                                                                                      | 200 000 characters                                                 |
| `css` (`refactor_css_with_theme`), `designMd`                                                   | 500 000 characters                                                 |
| `imageData`                                                                                     | 65 536 pixels (e.g. 256×256), `data.length` = `width × height × 4` |

## How it works

- **HCT** is Google's CAM16-based color space from `@material/material-color-utilities`: hue and chroma come from CAM16, tone is CIE L\*. For example, `#6750a4` is `hct(299.0, 47.9, 40.1)`. See [HCT](https://x51xxx.github.io/coolors-mcp/concepts/hct).
- **Theme matching** scores each theme variable by HCT distance (60%), semantic role for the usage context (20%) and tone suitability (20%). See [Theme matching](https://x51xxx.github.io/coolors-mcp/concepts/theme-matching).
- **Theme parsing** reads `--name: value;` custom properties anywhere in `themeCSS`, light and dark blocks alike. Only opaque colors count; `var()` aliases are not resolved.
- **Refactoring** only touches colors inside declaration values. Selectors, comments, strings, `url(…)`, custom-property definitions and translucent colors are left alone; translucent colors get a warning.

## Development

This project uses [pnpm](https://pnpm.io). Install it with `npm i -g pnpm` or `corepack enable`.

```bash
pnpm install          # install dependencies
pnpm run build        # build to dist/
pnpm test             # run the test suite
pnpm run lint         # prettier --check, eslint, tsc --noEmit
pnpm run format       # prettier --write, eslint --fix
pnpm run docs:dev     # documentation site
```

To try the tools interactively, run the built server under the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/bin/server.js
```

Source layout:

```
src/
├── bin/server.ts   # MCP server entry: registers all tools
├── tools/          # one file per tool group
├── color/          # conversions, HCT, APCA, CVD simulation, metrics, quantization, DESIGN.md parsing
└── theme/          # CSS theme parsing, matching and refactoring
```

## Contributing

Contributions are welcome. Before opening a pull request, make sure `pnpm test` and `pnpm run lint` pass.

## License

MIT © [Taras Trishchuk](https://trishchuk.com)

## Credits

- Built on the [Model Context Protocol](https://modelcontextprotocol.io/) TypeScript SDK.
- HCT, Material color schemes and the Celebi quantizer come from or follow Google's [Material Color Utilities](https://github.com/material-foundation/material-color-utilities).
- APCA contrast follows [`apca-w3`](https://github.com/Myndex/apca-w3); color-vision simulation for the protan, deutan and tritan types uses the matrices of Machado, Oliveira and Fernandes (2009).
