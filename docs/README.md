# Coolors MCP Documentation

Coolors MCP is a Model Context Protocol server with 31 read-only color tools for AI assistants: perceptual descriptions, WCAG 2.x and APCA contrast, Material Design 3 themes on Google's HCT, palettes, color-vision-deficiency checks, CSS theme matching, image color extraction and DESIGN.md audits.

The rendered site is at <https://x51xxx.github.io/coolors-mcp/>. This folder holds its sources.

## Start here

- [Installation](./installation.md): requirements (Node.js 20+), Claude Code, Claude Desktop, Cursor
- [Getting Started](./getting-started.md): first calls with real output
- [Troubleshooting](./resources/troubleshooting.md): error messages and fixes
- [Changelog](./changelog.md): release notes

## Tools reference

- [Tools Overview](./tools/README.md): all 31 tools, supported color formats, errors and limits
- [Agent Tools](./tools/agent-tools.md): `describe_color`, `fix_contrast`, `design_ui_palette`, `audit_ui_colors`, `generate_categorical_palette`
- [Color Operations](./tools/color-operations.md): `convert_color`, `color_distance`, `check_contrast`, `adjust_color`
- [Accessibility](./tools/accessibility.md): `check_contrast` in detail, `simulate_color_blindness`, `check_palette_accessibility`
- [Palettes](./tools/palettes.md): `generate_palette`, `generate_palette_with_locks`, `generate_gradient`, `export_palette`
- [Visual Cohesion](./tools/cohesion.md): `generate_tonal_scale`, `generate_state_colors`, `analyze_palette_consistency`, `generate_semantic_palette`
- [Material Design](./tools/material-design.md): `generate_material_theme`, `harmonize_colors`, `generate_tonal_palette`
- [Theme Matching](./tools/theme-matching.md): `match_theme_color`, `match_theme_colors_batch`, `refactor_css_with_theme`, `generate_theme_css`
- [Image Extraction](./tools/image-extraction.md): `extract_image_colors`, `generate_theme_from_image`, `analyze_color_likability`, `fix_disliked_colors_batch`
- [DESIGN.md Audit](./tools/design-md.md): `audit_design_md`

## Concepts

- [Color Spaces](./concepts/color-spaces.md)
- [HCT](./concepts/hct.md)
- [Material Design 3](./concepts/material-design.md)
- [Theme Matching](./concepts/theme-matching.md)
- [Image Analysis](./concepts/image-analysis.md)
- [Accessibility](./concepts/accessibility.md)
- [Distance Metrics](./concepts/distance-metrics.md)

## At a glance

- **Install:** `claude mcp add coolors -- npx -y @trishchuk/coolors-mcp`, or add `{"command": "npx", "args": ["-y", "@trishchuk/coolors-mcp"]}` to your client's `mcpServers`.
- **Color input:** hex (`#639`, `#6750a4`, `#6750a4ff`, `6750a4`), CSS named colors, `rgb()`, `hsl()`, `oklch()`, `oklab()` and `hct()`. Not supported: `hwb()`, `lab()`, `lch()`, `color()`, `color-mix()`.
- **Errors:** invalid input returns a tool result with `isError: true` and a message such as `Invalid color format: nope` or `Invalid arguments for tool '…': …`.
- **Limits:** arrays and strings are capped (for example 20 colors for `describe_color`, 200 000 characters for `themeCSS`, 65 536 pixels per image). See [Limits](./tools/README.md#limits).

## Building the docs

```bash
pnpm install
pnpm run docs:dev     # local preview
pnpm run docs:build   # static build
```

## License

MIT. See [LICENSE](https://github.com/x51xxx/coolors-mcp/blob/main/LICENSE).
