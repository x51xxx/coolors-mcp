# Troubleshooting

Fixes for the problems people hit most often. The error messages on this page are the exact text the server returns.

## How errors look

Coolors MCP reports bad input as a normal tool result with `isError: true` and a readable message, so the assistant can see what went wrong and retry. There are three kinds:

| Kind                                          | Message starts with                                                                       |
| --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| A color string the parser does not accept     | `Invalid color format: …`                                                                 |
| Wrong type, missing parameter, limit exceeded | `Invalid arguments for tool '<name>': …`                                                  |
| A tool-specific check                         | a plain sentence, for example `steps (3) must be at least the number of input colors (4)` |

Calling a tool that does not exist is different: the client gets a JSON-RPC protocol error with code `-32601` (`Unknown tool: get_accessible_pairs`) instead of a tool result. The [Tools Overview](/tools/README) lists all 31 tool names.

## The server does not start or does not show up

**Check the Node.js version.** The package requires Node.js 20 or newer:

```bash
node --version
```

If you use a Node version manager such as nvm, the Node your shell uses may not be the one your MCP client finds, because desktop apps do not always load your shell profile. Make sure a Node 20+ installation is the one on the client's `PATH`.

**Restart the client** after editing its configuration. Claude Desktop and Cursor read the MCP configuration at startup.

**Check the registration** in Claude Code:

```bash
claude mcp list
```

If `coolors` is missing, add it again:

```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

**Silence is normal.** Running `npx -y @trishchuk/coolors-mcp` in a terminal prints nothing: the server is waiting for MCP messages on stdin. Press `Ctrl+C` to stop it. To call tools by hand, use the MCP Inspector (see [Installation](/installation#from-source)).

## An old version keeps running

`npx` reuses the package version in its cache. Ask for the latest release explicitly. In Claude Code, run `claude mcp remove coolors`, then `claude mcp add coolors -- npx -y @trishchuk/coolors-mcp@latest`. In JSON configs:

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp@latest"]
    }
  }
}
```

If that does not help, clear the npx cache (`~/.npm/_npx` by default) and restart the client. For a global install, run `npm install -g @trishchuk/coolors-mcp` again. What changed between versions is in the [Changelog](/changelog).

## "Invalid color format"

```text
Invalid color format: hwb(120 10% 20%)
```

The color string is not in a supported syntax. Every tool accepts:

- hex: `#639`, `#6750a4`, `#6750a4ff` (alpha is ignored), bare `6750a4`
- CSS named colors: `rebeccapurple`
- `rgb()` / `rgba()`: with commas or spaces, decimals or percentages
- `hsl()` / `hsla()`
- `oklch()`, `oklab()`
- `hct(h, c, t)`

These are rejected:

| Input                                | Why                                                       |
| ------------------------------------ | --------------------------------------------------------- |
| `hwb()`, `lab()`, `lch()`            | not supported; convert to `oklch()`, `rgb()` or hex first |
| `color(display-p3 …)`, `color-mix()` | not supported                                             |
| `transparent`                        | not an opaque color                                       |
| `#ggg`, `#12345`                     | invalid hex: wrong characters or length                   |

`convert_color` with `"to": "lab"` outputs strings such as `lab(40.08, 29.43, -42.24)`, and that output is not accepted back as input. Keep the hex or `oklch()` form for later calls.

`harmonize_colors` reports a bad color without naming it: `One or more invalid color formats`. Check each entry of `colors`.

## "Invalid arguments for tool …"

The arguments do not match the tool's schema. The rest of the message names the parameter and the problem:

| Cause             | Example                                                                                                                               |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Wrong type        | `Invalid arguments for tool 'convert_color': color: Invalid input: expected string, received number`                                  |
| Missing parameter | `Invalid arguments for tool 'check_contrast': background: Invalid input: expected string, received undefined`                         |
| Unknown option    | `Invalid arguments for tool 'convert_color': to: Invalid option: expected one of "hex"\|"rgb"\|"hsl"\|"lab"\|"hct"\|"oklab"\|"oklch"` |
| Too many items    | `Invalid arguments for tool 'describe_color': colors: Too big: expected array to have <=20 items`                                     |
| Number too large  | `Invalid arguments for tool 'generate_categorical_palette': count: Too big: expected number to be <=12`                               |
| Text too long     | `Invalid arguments for tool 'match_theme_color': themeCSS: Too big: expected string to have <=200000 characters`                      |

Split large inputs into several calls. The [limits table](/tools/README#limits) lists every cap.

Two related checks run after the schema:

- `generate_gradient`: `steps` is the total number of colors, so it must be at least the number of input colors: `steps (3) must be at least the number of input colors (4)`.
- `export_palette`: `names` must have one entry per color: `Error: names array length (1) must match colors length (2).`

## Image is too large or rejected

The image tools take raw pixels: `{ "width": …, "height": …, "data": [r, g, b, a, …] }`, with integers 0–255 and four values per pixel.

```text
Invalid arguments for tool 'extract_image_colors': imageData.data: Too big: expected array to have <=262144 items
```

The image has more than 65 536 pixels. Downscale it so that it fits within 256×256 (or any size with `width × height ≤ 65 536`) before sending.

```text
Invalid arguments for tool 'extract_image_colors': imageData: data length must equal width * height * 4 (RGBA)
```

`data` must hold exactly `width × height × 4` values. Include the alpha channel even for opaque images (use `255`), and check that `width` and `height` match the pixels you send.

```text
The image has no sufficiently colorful pixels to seed a theme (Material's scorer fell back to #4285F4). Use a more colorful image, or call generate_material_theme with an explicit sourceColor.
```

`generate_theme_from_image` returns this for images that are only white, grey or black. `extract_image_colors` still works on such images and returns the real dominant colors (for example `#808080` and `#ffffff`); pick one and call `generate_material_theme` with it.

## themeCSS has no color variables

```text
themeCSS contains no CSS custom properties with color values (expected e.g. `:root { --color-primary: #6750a4; }`).
```

`match_theme_color`, `match_theme_colors_batch` and `refactor_css_with_theme` read your theme from `--name: value;` custom properties. This error means none of them held a usable color. Common causes:

- **Sass or Less variables** (`$primary: #6750a4;`): only CSS custom properties are read.
- **Bare numbers or keywords** (`--z: 999999;`, `--c: currentColor;`): numbers are never read as hex and keywords other than CSS named colors are skipped.
- **Aliases only** (`--primary: var(--brand-500);`): `var()` references are not resolved. Include the variables that hold the actual colors.
- **Unsupported or translucent values** (`hwb()`, `lab()`, `rgba(0, 0, 0, 0.5)`): only opaque colors in [supported formats](#invalid-color-format) count.

Selector scope does not matter: variables under `:root`, `[data-theme="dark"]` or any other selector are all collected.

## Colors are not replaced by refactor_css_with_theme

`refactor_css_with_theme` only rewrites colors inside declaration values. It leaves these alone on purpose:

- selectors (`[data-color="#6750a4"]`), comments, strings and `url(…)`
- custom-property definitions (`--brand: #6750a4;`)
- translucent colors, which get a warning:

```text
- Translucent color rgba(103,80,164,0.5) (alpha 0.5) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
```

Opaque colors are replaced only when the match confidence reaches `minConfidence` (default 70). Weaker matches are reported instead:

```text
- Low confidence match for #4f46e5: --color-primary-dark (69%)
  Suggestion: Consider using --color-primary-dark or defining a new theme variable
- No suitable theme variable found for #1f2937
  Suggestion: Consider adding this color to your theme
```

Lower `minConfidence` to accept weaker matches, or add the missing colors to your theme. `match_theme_color` returns `No matching theme variable found` when no variable is close enough, whatever `minConfidence` is.

## DESIGN.md values are not audited

`audit_design_md` evaluates colors in the same formats as the other tools. Other values are listed under **Not audited / caveats** instead of being guessed:

```text
- `accent`: `hwb(200 10% 20%)` — `hwb()` is valid DESIGN.md syntax but this auditor cannot evaluate it yet
- `muted`: `lab(60% 10 20)` — `lab()` is valid DESIGN.md syntax but this auditor cannot evaluate it yet
- `overlay`: `transparent` — not an opaque color; contrast cannot be evaluated
```

The same applies to `lch()`, `color()` and `color-mix()`. To audit those tokens, write them as hex, `rgb()`, `hsl()` or `oklch()`.

Other messages in the report:

- ``✗ No `colors` token group found.``: the file has no `colors:` map in its YAML front matter or ` ```yaml ` blocks.
- `✗ colors.link: broken reference {colors.missing} (from colors.link)`: a `{colors.x}` reference points to a token that does not exist.
- `No pairs found.`: no `components` declare `backgroundColor`/`textColor`, and no tokens follow the `on-X` naming. Add either to get contrast checks.

Claude Code does not load DESIGN.md on its own. Reference it as `@DESIGN.md` from your `CLAUDE.md`, or paste its text into the `designMd` argument.

## Still stuck?

Open an issue on [GitHub](https://github.com/x51xxx/coolors-mcp/issues) with the tool name, the arguments and the full message.
