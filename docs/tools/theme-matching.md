# Theme Matching Tools

Four tools connect hard-coded colors to the CSS custom properties of a theme:

- [`match_theme_color`](#match-theme-color): the closest theme variable for one color
- [`match_theme_colors_batch`](#match-theme-colors-batch): the same for up to 50 colors
- [`refactor_css_with_theme`](#refactor-css-with-theme): rewrite a stylesheet to use `var(--…)`
- [`generate_theme_css`](#generate-theme-css): produce a Material-based set of theme variables

All four return plain text. For the scoring model in more depth, see [Theme Matching concepts](/concepts/theme-matching).

## How `themeCSS` is read

The first three tools take a `themeCSS` string (at most 200 000 characters). The parser:

- Reads every `--name: value;` declaration anywhere in the text. **Selector scope is ignored.** Variables in `:root` and in `[data-theme="dark"]` are all collected. If the same name is defined twice, both values become candidates.
- Reads a declaration with or without a trailing `;`, so the last line of `:root { --bg: #ffffff }` is read. Comments inside a value are ignored: `--a: #fff /* note */;` is read as `#fff`.
- Keeps only **opaque colors** in a supported syntax: hex, CSS named colors, `rgb()`/`hsl()`, `oklch()`/`oklab()` and `hct()`. It skips translucent values like `rgba(0,0,0,.5)`, numbers (a value like `999999` is never read as hex), lengths, and `var()` aliases. Aliases are **not resolved**.
- Detects a semantic role from the variable name: `primary`, `secondary`, `tertiary`, `error`/`danger`, `neutral`/`gray`, `surface`, `background`/`bg`, `outline`/`border` or `shadow`. The `context` scoring uses this role.

If no color variable is found, the tool returns an error:

```text
themeCSS contains no CSS custom properties with color values (expected e.g. `:root { --color-primary: #6750a4; }`).
```

Common causes are passing YAML, a file path, or only `var()` aliases.

## How matching works

Matching runs in HCT (the code is in `src/theme/matcher.ts` in the repository):

1. **Distance.** A weighted HCT distance: `√((Δhue/180)² + (Δchroma/120)² + (2·Δtone/100)²) × 100`. Tone counts double.
2. **Cut-off.** Only variables within a maximum distance are candidates. The limit depends on `context`: `text` 10, `background` 15, `accent` 15, `border` 20, `shadow` 25, `decorative` 30. With no context, the limit is 30. A stricter context can therefore turn a match into "no match".
3. **Score.** 60% perceptual closeness, 20% semantic fit between the context and the variable's role, and 20% tone fit for the context.
4. **Confidence.** A distance below 0.5 gives 100%, below 1 gives 98%, and below 2 gives 95%. Otherwise confidence is `round(((100 − 2·distance) + 100·score) / 2)`.

With `context: "text"` or `"background"`, the result also includes an "Accessibility" block. This is a heuristic, not a check of your real pair. It takes the matched value's highest contrast against the theme's background-like variables (surface roles at tone ≥ 90 or ≤ 10, background roles, neutral roles at tone ≥ 95 or ≤ 5) and its highest contrast against its foreground-like variables (neutral roles at tones 20–40 and 60–80, surface roles at tones 10–30). If the theme has no variables of one kind, that line reads `0.00`. To check a real pair, use [`check_contrast`](/tools/accessibility).

The examples below use this theme:

```css
:root {
  --color-primary: #6366f1;
  --color-primary-dark: #4f46e5;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-border: #e5e7eb;
  --color-error: #dc2626;
}
```

---

## `match_theme_color`

Finds the theme variable closest to one color. It reports the distance, a confidence score and up to three alternatives.

### Parameters

| Parameter       | Type   | Required | Default | Description                                                                                                            |
| --------------- | ------ | -------- | ------- | ---------------------------------------------------------------------------------------------------------------------- |
| `color`         | string | Yes      | –       | Color to match. Any supported color syntax.                                                                            |
| `themeCSS`      | string | Yes      | –       | CSS containing theme variables, at most 200 000 characters.                                                            |
| `context`       | string | No       | –       | `text`, `background`, `border`, `shadow`, `accent` or `decorative`. Sets the distance cut-off and the role preference. |
| `minConfidence` | number | No       | `70`    | 0–100. A best match below this value is reported as "below confidence threshold".                                      |

### Examples

A near-exact color:

```json
{ "color": "#6365f0", "themeCSS": "<theme above>" }
```

```text
Best Match:
Variable: --color-primary
Value: #6366f1
Distance: 0.63
Confidence: 98%
Semantic Role: primary

Alternatives:
- --color-primary-dark (confidence: 66%)
```

With a `text` context, which adds the accessibility block:

```json
{ "color": "#1e293b", "themeCSS": "<theme above>", "context": "text" }
```

```text
Best Match:
Variable: --color-text
Value: #1f2937
Distance: 3.28
Confidence: 91%

Accessibility:
Contrast with background: 14.68
Contrast with foreground: 0.00
Meets AA: Yes
Meets AAA: Yes
```

`--color-text` has no semantic role, because "text" is not one of the recognized role words. The theme has no foreground-like variables, so that line is `0.00`.

A best match below `minConfidence`:

```json
{ "color": "#5b5bd6", "themeCSS": "<theme above>", "minConfidence": 95 }
```

```text
Best match below confidence threshold:
Variable: --color-primary
Distance: 11.11
Confidence: 76%

Consider adding a new theme variable for this color.
```

### Edge cases

- **No variable within the cut-off.** `#22c55e` against this theme returns `No matching theme variable found`. This is a normal result (`isError: false`).
- **Invalid `color`.** Returns a tool error: `Invalid color format: nope`.
- **Light and dark definitions.** With `:root { --color-bg: #ffffff; } [data-theme=dark] { --color-bg: #121212; }`, the color `#121212` matches `--color-bg` with value `#121212` at 100%. Check `Value` to see which definition matched.

---

## `match_theme_colors_batch`

Matches up to 50 colors against the same theme in one call. It returns one line per color and a summary.

### Parameters

| Parameter  | Type     | Required | Default | Description                                                 |
| ---------- | -------- | -------- | ------- | ----------------------------------------------------------- |
| `colors`   | string[] | Yes      | –       | Colors to match, 1–50 items.                                |
| `themeCSS` | string   | Yes      | –       | CSS containing theme variables, at most 200 000 characters. |
| `context`  | string   | No       | –       | One usage context for all colors (same values as above).    |

This tool has no `minConfidence`. Every color with a candidate inside the cut-off is reported as matched, even at 68–69%. Filter the confidences yourself.

### Example

```json
{
  "colors": ["#6366f1", "#4f46e6", "#fff", "#ef4444", "#22c55e", "nope"],
  "themeCSS": "<theme above>"
}
```

```text
Theme Color Matches:

#6366f1 → --color-primary (100%)
#4f46e6 → --color-primary-dark (100%)
#fff → --color-surface (100%)
#ef4444 → --color-error (69%)
#22c55e → No match found
nope → ✗ invalid color format

Summary:
- Matched: 4/6
- Average confidence: 92%
```

An invalid color appears as its own `✗` line. It does not fail the whole call.

### Effect of `context`

The same two colors, without and with `context: "background"`:

```text
#f9fafb → --color-surface (82%)
#111827 → --color-text (68%)
```

```text
#f9fafb → --color-surface (92%)
#111827 → No match found
```

The `background` context cuts candidates off at distance 15, which removes `#111827 → --color-text`. It also gives the surface variable a higher score.

---

## `refactor_css_with_theme`

Rewrites a stylesheet so that color literals become `var(--theme-variable)` references.

### Parameters

| Parameter          | Type    | Required | Default | Description                                                                                          |
| ------------------ | ------- | -------- | ------- | ---------------------------------------------------------------------------------------------------- |
| `css`              | string  | Yes      | –       | CSS to refactor, at most 500 000 characters.                                                         |
| `themeCSS`         | string  | Yes      | –       | CSS containing theme variables, at most 200 000 characters.                                          |
| `minConfidence`    | number  | No       | `70`    | 0–100. Matches below this value are left alone and reported as low-confidence warnings.              |
| `preserveOriginal` | boolean | No       | `true`  | Puts the original value in a comment before each `var()` and adds a summary comment at the top.      |
| `generateReport`   | boolean | No       | `false` | Appends a Markdown report with every replacement, its line number and confidence, plus all warnings. |

### What gets rewritten

The tool only changes colors **inside declaration values** (`property: value;`). It never touches:

- selectors (for example `#cafe .card` or `a:hover`)
- comments
- quoted strings (`content: "#dc2626"`)
- `url(...)` arguments
- custom-property definitions (`--card-accent: #6366f1;`), so theme definitions are never turned into self-references
- translucent colors (alpha < 1). These stay as they are, with a warning.

It detects hex literals (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`) and `rgb()`, `rgba()`, `hsl()`, `hsla()`, `oklch()` and `oklab()` calls. It does not detect named colors in the stylesheet. In `color: white`, `white` is not detected and not counted.

The context comes from each declaration's property, so the same color can match in one place and not in another:

| Property                                                                         | Context      | Max distance |
| -------------------------------------------------------------------------------- | ------------ | ------------ |
| `color`                                                                          | `text`       | 10           |
| `background`, `background-color`                                                 | `background` | 15           |
| `border`, `border-color`, `border-*-color`, `outline`, `outline-color`, `stroke` | `border`     | 20           |
| `box-shadow`, `text-shadow`                                                      | `shadow`     | 25           |
| `fill`, `stop-color`                                                             | `decorative` | 30           |
| any other property                                                               | none         | 30           |

For example, with `--color-border: #e5e7eb`, the color `#d1d5db` was replaced under `border-color` and `outline-color` but not under `color`, where the text cut-off is stricter.

### Example

Theme:

```css
:root {
  --color-primary: #6366f1;
  --color-surface: #ffffff;
  --color-text: #1f2937;
  --color-border: #e5e7eb;
  --color-error: #dc2626;
}
```

Stylesheet passed as `css`:

```css
/* Brand: #6366f1 */
#cafe .card {
  --card-accent: #6366f1;
  background: #fff;
  color: #1f2937;
  border: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card a:hover {
  color: rgb(99, 102, 241);
  background-image: url("#6366f1.svg");
}
.badge::after {
  content: "#dc2626";
  color: #22c55e;
}
```

Result with the defaults:

```text
Refactoring Complete!

Statistics:
- Total colors found: 6
- Colors replaced: 4
- Average confidence: 100%
- Accessibility issues: 2

Refactored CSS:
----------------------------------------
/* CSS Refactored with Theme Variables
 * Total colors found: 6
 * Colors replaced: 4
 * Average confidence: 100%
 * Warnings: 4
 */

/* Brand: #6366f1 */
#cafe .card {
  --card-accent: #6366f1;
  background: /* #fff */ var(--color-surface);
  color: /* #1f2937 */ var(--color-text);
  border: 1px solid /* #e5e7eb */ var(--color-border);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
.card a:hover {
  color: /* rgb(99, 102, 241) */ var(--color-primary);
  background-image: url("#6366f1.svg");
}
.badge::after {
  content: "#dc2626";
  color: #22c55e;
}

----------------------------------------

Warnings (4):
- Color #fff replaced with --color-surface may have accessibility issues
- Translucent color rgba(0, 0, 0, 0.1) (alpha 0.1) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
- Color rgb(99, 102, 241) replaced with --color-primary may have accessibility issues
- No suitable theme variable found for #22c55e
  Suggestion: Consider adding this color to your theme
```

The selector `#cafe`, the comment, the `--card-accent` definition, the string and the `url()` are unchanged. "Total colors found" counts the translucent `rgba()` too.

With `preserveOriginal: false`, the replacements are bare `var()` calls and there is no summary comment:

```text
#cafe .card {
  --card-accent: #6366f1;
  background: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
…
```

With `generateReport: true`, the output ends with a report (excerpt):

```text
# CSS Refactoring Report

## Summary
- Total colors found: 6
- Colors replaced: 4
- Replacement rate: 67%
- Average confidence: 100%
- Accessibility issues: 2

## Replacements

### High Confidence (≥90%)
- Line 4: #fff → --color-surface (100%)
- Line 5: #1f2937 → --color-text (100%)
- Line 6: #e5e7eb → --color-border (100%)
- Line 10: rgb(99, 102, 241) → --color-primary (100%)
…
```

### Warnings

- **Low confidence.** A candidate exists but is below `minConfidence`. For example, with `minConfidence: 90`, `border-color: #d1d5db` against `--color-border: #e5e7eb` gives `Low confidence match for #d1d5db: --color-border (80%)`.
- **No match.** No variable is inside the context's cut-off.
- **"May have accessibility issues".** This uses the same heuristic as the accessibility block above, not your real foreground/background pair. In the example, `#fff → --color-surface` is flagged because the theme has no foreground-like neutral variables, so the best contrast found is surface against itself (1:1). Treat these warnings as hints and confirm with [`check_contrast`](/tools/accessibility).
- The main output lists the first 5 warnings and then `... and N more warnings`. `generateReport: true` lists them all.

---

## `generate_theme_css`

Generates CSS custom properties for six Material core palettes from one source color, plus a small light-theme semantic block. The palettes are the same ones `generate_material_theme` uses: primary, secondary, tertiary, error, neutral and neutral variant (see [Material Design Tools](/tools/material-design#generate-material-theme)).

### Parameters

| Parameter      | Type     | Required | Default                                    | Description                                                                                 |
| -------------- | -------- | -------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `sourceColor`  | string   | Yes      | –                                          | Source color for the theme.                                                                 |
| `prefix`       | string   | No       | `"color"`                                  | Variable prefix: `color` gives `--color-primary-40`. An empty string falls back to `color`. |
| `includeTones` | number[] | No       | `[0,10,20,30,40,50,60,70,80,90,95,99,100]` | Tones to emit, each 0–100, at most 32 items.                                                |

### Output structure

- One `:root` block with `--{prefix}-{palette}-{tone}` for `primary`, `secondary`, `tertiary`, `error`, `neutral` and `neutral-variant`.
- A second `:root` block, "Semantic Color Mappings (Light Theme)", with 12 aliases: `primary`, `on-primary`, `primary-container`, `on-primary-container`, the same four for `secondary`, and `background`, `on-background`, `surface`, `on-surface`. Each is a `var()` reference to a tone variable. There is no dark-theme block and no tertiary or error alias.
- **Tones 10, 40, 90, 99 and 100 are always emitted**, because the semantic block refers to them. Your `includeTones` are merged with these tones, de-duplicated and sorted.

### Example

```json
{ "sourceColor": "#6366f1" }
```

```text
:root {
  /* Primary Colors */
  --color-primary-0: #000000;
  --color-primary-10: #07006c;
  --color-primary-20: #1000a9;
  --color-primary-30: #2f2ebe;
  --color-primary-40: #494bd6;
  --color-primary-50: #6366f1;
  --color-primary-60: #8083ff;
  --color-primary-70: #a0a3ff;
  --color-primary-80: #c0c1ff;
  --color-primary-90: #e1e0ff;
  --color-primary-95: #f2efff;
  --color-primary-99: #fffbff;
  --color-primary-100: #ffffff;

  /* Secondary Colors */
  --color-secondary-0: #000000;
  --color-secondary-10: #191a2c;
…
}

/* Semantic Color Mappings (Light Theme) */
:root {
  --color-primary: var(--color-primary-40);
  --color-on-primary: var(--color-primary-100);
  --color-primary-container: var(--color-primary-90);
  --color-on-primary-container: var(--color-primary-10);

  --color-secondary: var(--color-secondary-40);
  --color-on-secondary: var(--color-secondary-100);
  --color-secondary-container: var(--color-secondary-90);
  --color-on-secondary-container: var(--color-secondary-10);

  --color-background: var(--color-neutral-99);
  --color-on-background: var(--color-neutral-10);
  --color-surface: var(--color-neutral-99);
  --color-on-surface: var(--color-neutral-10);
}
```

Custom prefix and tones. `[50, 0]` becomes `0, 10, 40, 50, 90, 99, 100`:

```json
{ "sourceColor": "#6366f1", "prefix": "brand", "includeTones": [50, 0] }
```

```text
:root {
  /* Primary Colors */
  --brand-primary-0: #000000;
  --brand-primary-10: #07006c;
  --brand-primary-40: #494bd6;
  --brand-primary-50: #6366f1;
  --brand-primary-90: #e1e0ff;
  --brand-primary-99: #fffbff;
  --brand-primary-100: #ffffff;
…
  /* Error Colors */
  --brand-error-0: #000000;
  --brand-error-10: #410002;
  --brand-error-40: #ba1a1a;
  --brand-error-50: #de3730;
  --brand-error-90: #ffdad6;
  --brand-error-99: #fffbff;
  --brand-error-100: #ffffff;
…
```

### Using the output as `themeCSS`

You can pass the output straight to the matching tools. The semantic aliases are `var()` references and are not resolved, so matches point at tone variables. Against the default output above, `#4a4cd5` matches `--color-primary-40` (`#494bd6`) at 98%.

## Related

- [Theme Matching concepts](/concepts/theme-matching)
- [Material Design Tools](/tools/material-design)
- [Accessibility Tools](/tools/accessibility): verify real foreground/background pairs
