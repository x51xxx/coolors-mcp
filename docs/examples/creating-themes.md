# Creating Themes Examples

How to go from one brand color to a complete, checked color theme: Material Design 3 schemes, CSS custom properties, a light + dark UI token set, and exports. Every result is real output from the current server; long results are trimmed with `…`.

## Material Design 3 Theme

> "Generate a Material Design 3 theme from #6366f1."

Tool call: `generate_material_theme { "sourceColor": "#6366f1" }`

```text
Material Design 3 Theme
Source Color: #6366f1

LIGHT THEME:
  background: #fffbff
  error: #ba1a1a
  errorContainer: #ffdad6
  onBackground: #1c1b1f
  onError: #ffffff
  onErrorContainer: #410002
  onPrimary: #ffffff
  onPrimaryContainer: #07006c
  onSecondary: #ffffff
  onSecondaryContainer: #191a2c
  onSurface: #1c1b1f
  onSurfaceVariant: #46464f
  onTertiary: #ffffff
  onTertiaryContainer: #2e1125
  outline: #777680
  primary: #494bd6
  primaryContainer: #e1e0ff
  secondary: #5d5c72
  secondaryContainer: #e2e0f9
  surface: #fffbff
  surfaceVariant: #e4e1ec
  tertiary: #795369
  tertiaryContainer: #ffd8ec

DARK THEME:
  background: #1c1b1f
  error: #ffb4ab
  errorContainer: #93000a
  onBackground: #e5e1e6
  onError: #690005
  onErrorContainer: #ffdad6
  onPrimary: #1000a9
  onPrimaryContainer: #e1e0ff
  onSecondary: #2e2f42
  onSecondaryContainer: #e2e0f9
  onSurface: #e5e1e6
  onSurfaceVariant: #c8c5d0
  onTertiary: #46263a
  onTertiaryContainer: #ffd8ec
  outline: #918f9a
  primary: #c0c1ff
  primaryContainer: #2f2ebe
  secondary: #c6c4dd
  secondaryContainer: #454559
  surface: #1c1b1f
  surfaceVariant: #46464f
  tertiary: #e9b9d3
  tertiaryContainer: #5f3c51
```

Things to know when reading this output:

- `primary` is **not** the source color. It is tone 40 of the source hue (`#494bd6`) in light mode and tone 80 (`#c0c1ff`) in dark mode. `#6366f1` itself is tone 50 of the same palette.
- Secondary is the source hue at low chroma (16), tertiary is rotated 60° (chroma 24), and neutrals are lightly tinted with the source hue. See [Material Design](/concepts/material-design).
- These are the only roles. There are no surface-container, `outlineVariant`, inverse, shadow or scrim roles, and the tool has no `variant` or `contrastLevel` options.

Passing `"includeCustomColors": true` adds tonal palette lines at the end of the same output:

```text
…
TONAL PALETTES:
Primary: #000000, #07006c, #1000a9, #2f2ebe, #494bd6, #6366f1, #8083ff, #a0a3ff, #c0c1ff, #e1e0ff, #f2efff, #fffbff, #ffffff
Secondary: #5d5c72, #c6c4dd
Tertiary: #795369, #e9b9d3
```

## Theme as CSS Custom Properties

> "Give me the theme as CSS variables with a `theme` prefix. I only need tones 10, 40 and 90."

Tool call: `generate_theme_css { "sourceColor": "#6366f1", "prefix": "theme", "includeTones": [10, 40, 90] }`

```text
:root {
  /* Primary Colors */
  --theme-primary-10: #07006c;
  --theme-primary-40: #494bd6;
  --theme-primary-90: #e1e0ff;
  --theme-primary-99: #fffbff;
  --theme-primary-100: #ffffff;

  /* Secondary Colors */
  --theme-secondary-10: #191a2c;
  --theme-secondary-40: #5d5c72;
  --theme-secondary-90: #e2e0f9;
  --theme-secondary-99: #fffbff;
  --theme-secondary-100: #ffffff;
  …
  /* Neutral Variant Colors */
  --theme-neutral-variant-10: #1b1b23;
  --theme-neutral-variant-40: #5e5d67;
  --theme-neutral-variant-90: #e4e1ec;
  --theme-neutral-variant-99: #fffbff;
  --theme-neutral-variant-100: #ffffff;
}

/* Semantic Color Mappings (Light Theme) */
:root {
  --theme-primary: var(--theme-primary-40);
  --theme-on-primary: var(--theme-primary-100);
  --theme-primary-container: var(--theme-primary-90);
  --theme-on-primary-container: var(--theme-primary-10);
  …
  --theme-background: var(--theme-neutral-99);
  --theme-on-background: var(--theme-neutral-10);
  --theme-surface: var(--theme-neutral-99);
  --theme-on-surface: var(--theme-neutral-10);
}
```

Tones 10, 40, 90, 99 and 100 are always emitted because the semantic block refers to them. The palettes covered are primary, secondary, tertiary, error, neutral and neutral-variant. Without `includeTones` you get 0, 10, 20 … 90, 95, 99, 100.

The semantic block is light mode only. For dark mode, override the same variables with the `DARK THEME` values from `generate_material_theme`. The hex values below are copied from the output above:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --theme-primary: #c0c1ff;
    --theme-on-primary: #1000a9;
    --theme-primary-container: #2f2ebe;
    --theme-on-primary-container: #e1e0ff;
    --theme-secondary: #c6c4dd;
    --theme-on-secondary: #2e2f42;
    --theme-secondary-container: #454559;
    --theme-on-secondary-container: #e2e0f9;
    --theme-background: #1c1b1f;
    --theme-on-background: #e5e1e6;
    --theme-surface: #1c1b1f;
    --theme-on-surface: #e5e1e6;
  }
}
```

For any other tone, use `generate_tonal_palette`:

Tool call: `generate_tonal_palette { "color": "#6366f1", "tones": [10, 40, 90, 99] }`

```text
Tonal Palette for #6366f1
HCT: h=284.6°, c=68.0, t=50.1

Tone 10: #07006c
Tone 40: #494bd6
Tone 90: #e1e0ff
Tone 99: #fffbff
```

## A Light + Dark UI Token Set

Material roles are generic. For app UI tokens (surfaces, text hierarchy, borders, states and status colors) with light and dark values whose text pairs are already contrast-checked, use `design_ui_palette`:

> "Design a UI color system for brand #6366f1 and give me CSS."

Tool call: `design_ui_palette { "brand": "#6366f1", "format": "css" }`

```text
:root {
  --color-accent: #a93f8a;
  --color-bg: #fdf9ff;
  --color-border: #d8d5e3;
  --color-border-strong: #868591;
  --color-error: #ae302b;
  …
  --color-primary: #5e60eb;
  --color-primary-active: #3737c5;
  --color-primary-hover: #494bd6;
  --color-primary-subtle: #ebe9ff;
  --color-secondary: #31669c;
  --color-success: #006e25;
  …
  --color-text-muted: #6d6c74;
  --color-text-primary: #1f1f25;
  --color-text-secondary: #504f57;
  --color-warning: #7f5600;
  --color-warning-subtle: #ffebd2;
}

[data-theme="dark"] {
  --color-accent: #f996d4;
  --color-bg: #17171f;
  …
  --color-primary: #adafff;
  --color-primary-active: #d7d6ff;
  --color-primary-hover: #c4c4ff;
  …
  --color-text-primary: #f0ecf5;
  --color-text-secondary: #bdbac4;
  --color-warning: #f0a818;
  --color-warning-subtle: #412c06;
}
```

The full output has 36 tokens per mode, including `on-*` text colors for primary, secondary, accent and each status color. The default `format: "report"` returns the same tokens as a light/dark table with the number of verified contrast checks (`Verified contrast checks: **42**` for this brand), followed by this CSS. `json` and `tokens` formats are also available. Options for `harmony` and `neutralStyle` are documented in [Agent Tools](/tools/agent-tools).

## Harmonizing Existing Status Colors

If you already have status colors, `harmonize_colors` rotates each color's HCT hue toward the first color by `factor` (default 0.5) times the hue difference, at most 15°. Chroma and tone stay the same, and the first color is returned unchanged:

Tool call: `harmonize_colors { "colors": ["#6366f1", "#10b981", "#f59e0b", "#ef4444"] }`

```text
Harmonized Colors (harmonize):
Original: #6366f1, #10b981, #f59e0b, #ef4444
Result: #6366f1, #00b79d, #ff9740, #ee3e72
```

## Checking the Theme

Run the generated pairs through `audit_ui_colors` before shipping. Here are the main Material pairs from above, plus the four accent colors as swatches:

Tool call: `audit_ui_colors` with these arguments:

```json
{
  "pairs": [
    { "name": "onPrimary/primary", "fg": "#ffffff", "bg": "#494bd6" },
    {
      "name": "onPrimaryContainer/primaryContainer",
      "fg": "#07006c",
      "bg": "#e1e0ff"
    },
    { "name": "onSurface/surface", "fg": "#1c1b1f", "bg": "#fffbff" },
    {
      "name": "onSurfaceVariant/surfaceVariant",
      "fg": "#46464f",
      "bg": "#e4e1ec"
    },
    {
      "name": "outline/surface",
      "fg": "#777680",
      "bg": "#fffbff",
      "role": "ui"
    },
    { "name": "dark onPrimary/primary", "fg": "#1000a9", "bg": "#c0c1ff" },
    { "name": "dark onSurface/surface", "fg": "#e5e1e6", "bg": "#1c1b1f" }
  ],
  "swatches": ["#494bd6", "#5d5c72", "#795369", "#ba1a1a"]
}
```

```text
# UI Color Audit

## Pair Checks (7)

| Pair | Role | WCAG | APCA Lc | Status | Fix / Notes |
|---|---|---|---|---|---|
| onPrimary/primary (`#ffffff` on `#494bd6`) | body | 6.44:1 | -86.5 | ✓ Pass | - |
| onPrimaryContainer/primaryContainer (`#07006c` on `#e1e0ff`) | body | 13.31:1 | 85.7 | ✓ Pass | - |
| onSurface/surface (`#1c1b1f` on `#fffbff`) | body | 16.72:1 | 102.3 | ✓ Pass | - |
| onSurfaceVariant/surfaceVariant (`#46464f` on `#e4e1ec`) | body | 7.24:1 | 74.8 | ✓ Pass | - |
| outline/surface (`#777680` on `#fffbff`) | ui | 4.37:1 | 69.4 | ✓ Pass | - |
| dark onPrimary/primary (`#1000a9` on `#c0c1ff`) | body | 7.72:1 | 64.0 | ✓ Pass | - |
| dark onSurface/surface (`#e5e1e6` on `#1c1b1f`) | body | 13.25:1 | -87.8 | ✓ Pass | - |

## Swatch Checks (4)

- CVD collision (deuteranopia): `#5d5c72` ↔ `#795369` (ΔE=6.1)
- CVD collision (protanopia): `#5d5c72` ↔ `#795369` (ΔE=2.5)

**Summary**: 2 item(s) flagged above.
```

Every text pair passes, but the muted secondary and tertiary are almost identical for protanopes and deuteranopes. Don't let those two colors be the only way to tell two things apart.

## Exporting the Theme

`export_palette` turns any list of colors into CSS, SCSS, Tailwind, W3C design tokens, JSON or a DESIGN.md `colors:` block. `names` must have one name per color.

Tool call: `export_palette { "colors": ["#494bd6", "#5d5c72", "#795369"], "names": ["primary", "secondary", "tertiary"], "format": "scss" }`

```text
$primary: #494bd6;
$secondary: #5d5c72;
$tertiary: #795369;
```

Tool call: `export_palette { "colors": ["#494bd6", "#5d5c72", "#795369"], "names": ["primary", "secondary", "tertiary"], "format": "tokens" }`

```text
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": "#494bd6"
    },
    "secondary": {
      "$type": "color",
      "$value": "#5d5c72"
    },
    "tertiary": {
      "$type": "color",
      "$value": "#795369"
    }
  }
}
```

### DESIGN.md

To give coding agents a persistent description of the design system, export the colors as a [DESIGN.md](https://github.com/google-labs-code/design.md) `colors:` block:

Tool call: `export_palette { "colors": ["#494bd6", "#5d5c72", "#795369", "#fffbff", "#1c1b1f"], "names": ["primary", "secondary", "tertiary", "surface", "on-surface"], "format": "design-md" }`

```text
colors:
  primary: "#494bd6"
  secondary: "#5d5c72"
  tertiary: "#795369"
  surface: "#fffbff"
  on-surface: "#1c1b1f"
```

Once the file also declares components, `audit_design_md` checks it. Given this DESIGN.md:

<!-- prettier-ignore -->
```markdown
---
version: alpha
name: Acme
colors:
  primary: "#494bd6"
  on-primary: "#ffffff"
  surface: "#fffbff"
  on-surface: "#1c1b1f"
  success: "#10b981"
  error: "#ef4444"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  badge-success:
    backgroundColor: "{colors.success}"
    textColor: "#ffffff"
---

# Acme design system
```

Tool call: `audit_design_md { "designMd": "<the file's full text>" }`

```text
# DESIGN.md color audit

Color tokens: 6 (6 audited, 0 not audited) · Contrast pairs: 3 (2 declared, 1 inferred) · Failing: 1 · CVD collisions: 0 · Duplicates: 0 exact, 0 near

## Contrast

| text / element | on background | source | WCAG | needs | APCA Lc | result | suggested fix |
|---|---|---|---|---|---|---|---|
| `components.badge-success.textColor` #ffffff | `success` #10b981 | declared · components.badge-success | 2.54:1 | 4.5:1 (text) | -54.2 | ✗ | components.badge-success.textColor → `#383a3b` (4.51:1) |
| `on-primary` #ffffff | `primary` #494bd6 | declared · components.button-primary | 6.44:1 | 4.5:1 (text) | -86.5 | ✓ |  |
| `on-surface` #1c1b1f | `surface` #fffbff | inferred · on-X ↔ X | 16.72:1 | 4.5:1 (text) | 102.3 | ✓ |  |
…
## Color-vision collisions

✓ Accent and status colors stay distinguishable (protanopia, deuteranopia, tritanopia, deuteranomaly).
```

Claude Code does not load DESIGN.md automatically. Reference it as `@DESIGN.md` from your `CLAUDE.md`. See [DESIGN.md](/tools/design-md) for the full format and audit rules.

## From an Image

`generate_theme_from_image` seeds the same Material theme from the most suitable color in an image. See [Image Extraction](/examples/image-extraction) for how to pass pixel data.

## Next Steps

- [CSS Refactoring](/examples/css-refactoring): apply the theme to existing stylesheets
- [Image Extraction](/examples/image-extraction): themes from images
- [Material Design](/tools/material-design): parameters of the Material tools
- [Material Design Concepts](/concepts/material-design): how the palettes and roles are derived
