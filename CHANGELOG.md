# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [2.0.0] - 2026-11-14

Breaking release: HCT-based outputs, gradient `steps` semantics, tool error
handling and input limits changed — see **Changed**.

### Added

- `audit_design_md` tool: audits the color tokens of a
  [DESIGN.md](https://github.com/google-labs-code/design.md) file (YAML front
  matter and fenced `yaml` blocks). It checks WCAG and APCA contrast for pairs
  declared in `components` and pairs inferred from token names, color-blind
  collisions between accent and status colors, exact and near-duplicate
  tokens, disliked colors, broken `{colors.x}` references and a missing
  `primary`. Failing pairs get a same-hue fix. Values it cannot evaluate
  (`hwb()`, `lab()`, `lch()`, `color-mix()`, `transparent`) are listed, never
  guessed.
- `export_palette` format `design-md`: a `colors:` block for DESIGN.md front
  matter.
- Agent-oriented tools: `describe_color`, `fix_contrast`, `design_ui_palette`,
  `audit_ui_colors` and `generate_categorical_palette`.
- Color input now accepts CSS named colors, CSS Color 4 `rgb()`/`hsl()` syntax
  (space-separated, decimals, percentages, alpha), `oklch()`, `oklab()`,
  `hct()` and bare 6/8-digit hex. `convert_color` can output `oklab` and
  `oklch`.
- MCP tool annotations on every tool (`readOnlyHint`, `destructiveHint: false`,
  `openWorldHint: false`).
- `CHANGELOG.md`.
- MCP catalog metadata:
  - `server.json` for the official MCP Registry, under the name
    `io.github.x51xxx/coolors-mcp` with schema 2025-12-11;
  - the matching `mcpName` in `package.json`;
  - `glama.json` for Glama.

  After the npm publish, the release workflow publishes to the registry through
  GitHub OIDC using a signature-verified `mcp-publisher`.

### Changed

- **HCT is now Google's CAM16-based HCT**, provided by
  `@material/material-color-utilities` (pinned to `^0.3.0`, because 0.4.0
  fails to load in plain Node ESM). The old implementation was CIE LCh with
  clipping, so tones drifted by up to 20 L\* and Material themes failed
  contrast. Every HCT-based output changes: Material themes, tonal palettes
  and scales, state colors, semantic palettes, harmonization, dislike
  detection, image theming and `convert_color` to `hct`.
- Material core palettes use Material's fixed chromas: secondary 16,
  tertiary 24, neutral 4, neutral-variant 8, error at hue 25 / chroma 84.
- `generate_gradient`: `steps` is now the **total** number of colors, and
  every input color is kept as a stop. `steps` smaller than the number of
  colors is an error.
- Tool errors (invalid input, failed validation, exceptions) are returned as
  MCP tool results with `isError: true`, so the calling model can read them
  and retry. Tool `execute` functions now throw `ToolInputError` instead of
  returning error strings.
- JSON Schemas are generated in zod _input_ mode: parameters that have
  defaults are no longer listed as `required`.
- Server `instructions` are now sent to clients.
- Inputs are bounded:
  - most color arrays are capped at 64–256 entries;
  - `themeCSS` is limited to 200k characters and `css` to 500k;
  - images are limited to 256×256 RGBA, and `data` must equal
    `width × height × 4`;
  - `check_palette_accessibility` lists at most 20 collisions per CVD type.
- Color-vision simulation:
  - the anomalous trichromacies use Machado et al. severity 0.6 matrices;
  - achromatopsia maps to a grey of equal relative luminance.
- Package and CI:
  - `engines.node >= 20`;
  - the published files are whitelisted to `dist`, `README.md` and `LICENSE`;
  - failing tests now fail CI and release.

### Fixed

- `refactor_css_with_theme` corrupted CSS when a line held two or more
  colors, and rewrote colors inside `url()`, strings and comments. It now
  rewrites only real declaration values, skipping selectors and
  custom-property definitions, and detects the property per declaration.
- The theme parser and matcher read `rgb()` channels as 0–1, so `rgb()`
  colors never matched. They now use the shared color parser.
- Invalid hex (`#ggg`, `#ff00zz`, `#12345`) was silently parsed as another
  color. It is now rejected. Out-of-range `rgb()` channels are clamped as in
  CSS.
- APCA light-on-dark exponents were swapped. Results now match apca-w3 0.1.9
  exactly.
- `lighten`, `darken`, `saturate` and `desaturate` ignored fractional amounts
  and changed the color at amount 0.
- `generate_palette_with_locks`:
  - gradient mode returned locked colors first and the wrong count;
  - harmony mode could return fewer colors than requested.
- `harmonize_colors` ignored `factor: 0`.
- `generate_theme_css` with custom `includeTones` referenced CSS variables it
  never defined.
- `generate_theme_from_image` silently fell back to `#4285F4` with "NaN%" for
  images without colorful pixels. It now returns an error, and
  `extract_image_colors` reports the real dominant colors instead.
- `export_palette`:
  - an unsafe `prefix` produced invalid output;
  - non-ASCII names became `---n-code`;
  - names that collided after normalization were silently merged.
- `match_theme_color` reported invalid colors as "no match", and theme CSS
  without color variables is now an error.
- `package.json` `main` pointed to a missing file, and the `jsr.json` export
  path was wrong.

### Security

- Removed unused runtime dependencies `file-type`, `fuse.js`, `mcp-proxy`,
  `undici` and `uri-templates`, and updated `@modelcontextprotocol/sdk` to
  ^1.32.2 and `zod` to ^4.6.7. Production audit advisories dropped from 113
  to 51. The remaining advisories are in the SDK's HTTP transport stack,
  which the stdio server does not import.
- The development CLI no longer runs commands through a shell with
  interpolated file paths.

## [1.1.0]

- Visual cohesion tools, color-vision-deficiency simulation, APCA contrast,
  and fixes to tool schemas and RGB conversion.
