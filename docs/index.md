---
layout: home

hero:
  name: "Coolors MCP"
  text: "Color tools for AI assistants"
  tagline: "Perceptual color descriptions, WCAG and APCA contrast fixes, Material Design 3 themes on Google's HCT, palettes, color-blindness checks, CSS theme refactoring and DESIGN.md audits — <span style='color: #FFFFFF; background-color: #6366F1; padding: 2px 8px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-left: 4px; display: inline-block; vertical-align: middle;'>built for Claude Code</span>"
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: All 31 Tools
      link: /tools/README
    - theme: alt
      text: View on GitHub
      link: https://github.com/x51xxx/coolors-mcp

features:
  - icon: 👁️
    title: Colors an agent can see
    details: describe_color turns a hex code into a name, temperature, lightness, OKLCH/HCT/HSL/RGB values, the best text color and likely UI roles.
  - icon: ♿
    title: Contrast without guessing
    details: WCAG 2.x ratio and APCA Lc side by side. fix_contrast finds the closest same-hue color that meets AA, AAA, UI or APCA targets.
  - icon: 🎭
    title: Material Design 3 on HCT
    details: Light and dark Material 3 schemes, tonal palettes and harmonization, built on Google's CAM16-based HCT from Material Color Utilities.
  - icon: 🎨
    title: Palettes and UI tokens
    details: Light + dark UI token sets, tonal scales, state colors, semantic and color-blind-safe categorical palettes, gradients, and export to CSS, SCSS, Tailwind, W3C tokens or DESIGN.md.
  - icon: 🔍
    title: CSS theme matching
    details: Map hard-coded colors to your theme's custom properties and rewrite stylesheets to use them, with confidence scores.
  - icon: 🧪
    title: Color-blindness, images and DESIGN.md
    details: Simulate 7 color-vision deficiencies, audit palettes for collisions, extract dominant colors from images, and audit DESIGN.md color tokens.
---

<div class="explore-hint" style="text-align: center; margin: 32px 0 48px; position: relative;">
  <div class="explore-dots" style="display: inline-flex; align-items: center; gap: 4px;">
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease;">•</span>
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease; transition-delay: 0.1s;">•</span>
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease; transition-delay: 0.2s;">•</span>
  </div>
  <p class="explore-text" style="font-size: 13px; color: var(--vp-c-text-3); margin-top: 8px; opacity: 0.7; transition: all 0.3s ease;">
    31 read-only tools · runs locally · no API keys
  </p>
</div>

<div style="margin-top: 48px;">

## What is Coolors MCP?

</div>

Coolors MCP is a Model Context Protocol (MCP) server that gives AI assistants such as Claude a set of color tools. A model cannot see a hex code; these tools tell it what a color looks like, whether text on it is readable, and how to fix it. They also build palettes and Material Design 3 themes, check colors for color-blind viewers, and move hard-coded CSS colors onto theme variables.

All 31 tools are read-only and run locally over stdio. There are no API keys, no network requests and no configuration.

### Key features

- **Perceptual descriptions**: names, temperature, lightness and vividness for any color (`describe_color`).
- **Contrast**: WCAG 2.x ratio and APCA Lc (matching `apca-w3` 0.1.9), with exact same-hue fixes (`check_contrast`, `fix_contrast`, `audit_ui_colors`).
- **Google's HCT**: the CAM16-based HCT from `@material/material-color-utilities` drives themes, tonal palettes, scales, state colors and dislike detection.
- **Material Design 3**: light and dark schemes, tonal palettes, harmonization and CSS custom properties.
- **Palettes**: color harmonies, locked colors, gradients in 7 color spaces, UI token sets, semantic and categorical palettes, cohesion scoring and export.
- **Color-vision deficiency**: simulation of protanopia, deuteranopia, tritanopia and their milder forms (Machado et al. 2009 matrices), plus achromatopsia, and palette collision audits.
- **CSS theme matching**: match colors to custom properties and refactor stylesheets.
- **Images**: dominant colors via Celebi quantization, and Material themes from images.
- **DESIGN.md**: audit the color tokens of a [DESIGN.md](https://github.com/google-labs-code/design.md) file.

### Why HCT?

HCT (hue, chroma, tone) is the color space Google built for Material Design 3. Hue and chroma come from the CAM16 color appearance model, and tone is CIE L\*, perceived lightness.

Because tone is L\*, the WCAG contrast between two colors depends only on their tones. Tone-40 colors of different hues all land at about the same contrast on white: `#016e00` (green) gives 6.50:1, `#c00000` (red) 6.48:1, `#0052dd` (blue) 6.46:1 and `#6750a4` (violet) 6.44:1. That makes it possible to pick tones for readable pairs before choosing hues. Read more in [HCT](/concepts/hct).

<div style="margin-top: 48px;">

## Quick Start

</div>

Requires Node.js 20 or newer.

### Claude Code

```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

Then run `/mcp` in Claude Code to check that `coolors` is connected.

### Claude Desktop, Cursor and other clients

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

More options: [Installation](/installation).

### Things to ask

```
Describe #6366f1 and tell me what text color to put on it
Is #9e9e9e readable on white? Fix it for WCAG AA
Design a light and dark UI palette from #6750a4
Make 6 color-blind-safe chart colors for a dark background
Replace the hard-coded colors in this CSS with my theme variables
Audit the colors in my DESIGN.md
```

[Getting Started](/getting-started) walks through these with real results.

<div style="margin-top: 48px;">

## Tools by category

</div>

| Category                                               | Tools                                                                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| [Agent tools](/tools/agent-tools)                      | `describe_color`, `fix_contrast`, `design_ui_palette`, `audit_ui_colors`, `generate_categorical_palette`     |
| [Color operations](/tools/color-operations)            | `convert_color`, `color_distance`, `check_contrast`, `adjust_color`                                          |
| [Accessibility](/tools/accessibility)                  | `simulate_color_blindness`, `check_palette_accessibility`                                                    |
| [Palettes](/tools/palettes)                            | `generate_palette`, `generate_palette_with_locks`, `generate_gradient`, `export_palette`                     |
| [Visual cohesion](/tools/cohesion)                     | `generate_tonal_scale`, `generate_state_colors`, `analyze_palette_consistency`, `generate_semantic_palette`  |
| [Material Design](/tools/material-design)              | `generate_material_theme`, `harmonize_colors`, `generate_tonal_palette`                                      |
| [Theme matching](/tools/theme-matching)                | `match_theme_color`, `match_theme_colors_batch`, `refactor_css_with_theme`, `generate_theme_css`             |
| [Images and color psychology](/tools/image-extraction) | `extract_image_colors`, `generate_theme_from_image`, `analyze_color_likability`, `fix_disliked_colors_batch` |
| [DESIGN.md](/tools/design-md)                          | `audit_design_md`                                                                                            |

<div style="margin-top: 48px;">

## Documentation

</div>

- [Installation](/installation): requirements and client setup
- [Getting Started](/getting-started): first calls with real output
- [Tools Overview](/tools/README): all tools, color formats, errors and limits
- [Color Spaces](/concepts/color-spaces) and [HCT](/concepts/hct): the color models behind the tools
- [Troubleshooting](/resources/troubleshooting): common errors and fixes
- [Changelog](/changelog): release notes

<div style="margin-top: 48px;">

## Community & Support

</div>

- **GitHub**: [x51xxx/coolors-mcp](https://github.com/x51xxx/coolors-mcp)
- **Issues**: [Report bugs or request features](https://github.com/x51xxx/coolors-mcp/issues)
- **npm**: [@trishchuk/coolors-mcp](https://www.npmjs.com/package/@trishchuk/coolors-mcp)

<div style="margin-top: 48px;">

## License

</div>

This project is licensed under the MIT License. See the [LICENSE](https://github.com/x51xxx/coolors-mcp/blob/main/LICENSE) file for details.

**Built with** ❤️ **on Google's Material Color Utilities**
