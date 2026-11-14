# CSS Refactoring Examples

Replace hardcoded colors in existing stylesheets with your theme's custom properties. Three tools are involved:

- `match_theme_color`: the best theme variable for one color, with confidence and alternatives
- `match_theme_colors_batch`: the same for up to 50 colors
- `refactor_css_with_theme`: rewrites a whole stylesheet and reports what it changed

All three take your theme as `themeCSS`. Every result on this page is real output from the current server; long results are trimmed with `…`. Parameter details are on [Theme Matching](/tools/theme-matching).

## The Theme Input

`themeCSS` is plain CSS that defines **color custom properties**. Most examples on this page use this theme:

```css
:root {
  --color-surface: #ffffff;
  --color-surface-variant: #f9fafb;
  --color-border: #e5e7eb;
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;
  --radius-md: 8px;
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
}
```

How the theme is read:

- Every `--name: value;` declaration is read, whatever selector it is in. Light and dark definitions (`:root`, `[data-theme="dark"]`, media queries) are all collected.
- Only opaque colors in supported syntaxes count: hex, CSS named colors, `rgb()`, `hsl()`, `oklch()`, `oklab()`, `hct()`. `--radius-md` and `--shadow-sm` above are not colors and are ignored, and so are translucent values like `rgba(0, 0, 0, 0.5)`.
- `var()` aliases such as `--text: var(--gray-800)` are not resolved and never become match targets.
- If no color variables are found, the tool returns an error instead of an empty result:

Tool call: `refactor_css_with_theme { "css": ".a{color:#1f2937}", "themeCSS": "colors:\n  text: \"#1f2937\"\n" }` returns `isError: true` with:

```text
themeCSS contains no CSS custom properties with color values (expected e.g. `:root { --color-primary: #6750a4; }`).
```

::: tip Minified themes work
The last declaration in a block may omit its `;` and comments inside values are ignored, so a minified theme such as `:root{--color-text:#1f2937;--color-bg:#ffffff}[data-theme=dark]{--color-text:#f9fafb}` is read in full. Selector scope is not tracked, though: light and dark values of the same variable are both collected.
:::

## Matching a Single Color

> "Which theme variable should I use for #5b5ff0?"

Tool call: `match_theme_color { "color": "#5b5ff0", "themeCSS": "<theme above>" }`

```text
Best Match:
Variable: --color-primary-500
Value: #6366f1
Distance: 4.74
Confidence: 84%
Semantic Role: primary

Alternatives:
- --color-primary-600 (confidence: 71%)
```

The semantic role comes from the variable name, here `primary`. Passing `"context": "accent"` raises the confidence to 89%, because accents prefer primary and secondary roles.

`Distance` is a weighted HCT distance (hue, chroma and tone differences, with tone weighted double). Confidence is 100% below distance 0.5, 98% below 1 and 95% below 2. Above that it mixes the distance with a score for how well the variable's role and tone fit the usage context. See [Theme Matching Concepts](/concepts/theme-matching).

## Matching Many Colors

Tool call: `match_theme_colors_batch { "colors": ["#6366f1", "#5b5ff0", "#e2e8f0", "#374151", "#ec4899"], "themeCSS": "<theme above>" }`

```text
Theme Color Matches:

#6366f1 → --color-primary-500 (100%)
#5b5ff0 → --color-primary-500 (84%)
#e2e8f0 → --color-border (86%)
#374151 → --color-text-secondary (68%)
#ec4899 → No match found

Summary:
- Matched: 4/5
- Average confidence: 85%
```

The usage context changes the result. Asked as a **text** color, `#374151` gets no match:

Tool call: `match_theme_color { "color": "#374151", "context": "text", "themeCSS": "<theme above>" }`

```text
No matching theme variable found
```

Each context has a maximum distance: `text` 10, `background` and `accent` 15, `border` 20, `shadow` 25, `decorative` 30, and 30 when no context is given. Text is strict on purpose, because a near-miss text color can change readability.

## Refactoring a Stylesheet

> "Refactor card.css to use the theme variables."

Before (`card.css`):

```css
/* Card component — brand color #6366f1 */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.card-title {
  color: #1f2937;
}

.card-body {
  color: #4b5563;
}

.card-link {
  color: #6366f1;
}

.card-link:hover {
  color: #4f46e5;
}
```

Tool call: `refactor_css_with_theme { "css": "<card.css>", "themeCSS": "<theme above>" }`

```text
Refactoring Complete!

Statistics:
- Total colors found: 9
- Colors replaced: 8
- Average confidence: 100%
- Accessibility issues: 3

Refactored CSS:
----------------------------------------
/* CSS Refactored with Theme Variables
 * Total colors found: 9
 * Colors replaced: 8
 * Average confidence: 100%
 * Warnings: 4
 */

/* Card component — brand color #6366f1 */
.card {
  background: /* #ffffff */ var(--color-surface);
  border: 1px solid /* #e5e7eb */ var(--color-border);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: /* #f9fafb */ var(--color-surface-variant);
  border-bottom: 1px solid /* #e5e7eb */ var(--color-border);
}

.card-title {
  color: /* #1f2937 */ var(--color-text-primary);
}

.card-body {
  color: /* #4b5563 */ var(--color-text-secondary);
}

.card-link {
  color: /* #6366f1 */ var(--color-primary-500);
}

.card-link:hover {
  color: /* #4f46e5 */ var(--color-primary-600);
}

----------------------------------------

Warnings (4):
- Color #ffffff replaced with --color-surface may have accessibility issues
- Translucent color rgba(0, 0, 0, 0.1) (alpha 0.1) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
- Color #f9fafb replaced with --color-surface-variant may have accessibility issues
- Color #6366f1 replaced with --color-primary-500 may have accessibility issues
```

What happened:

- With `preserveOriginal: true` (the default) each original value is kept as a `/* #hex */` comment in front of the `var()`, and a summary comment is added at the top. `"preserveOriginal": false` produces clean `var(...)` values and no summary comment.
- The comment that mentions `#6366f1` was not touched.
- The translucent shadow was left alone with a warning. Theme variables are opaque, so a translucent color is never replaced by one.
- The tool only replaces colors. Lengths such as `8px` stay as they are, even though the theme has `--radius-md: 8px`.
- The "may have accessibility issues" warnings are a rough heuristic. They compare the chosen variable with theme variables whose names say surface, background or neutral, and they appear even for exact matches. Check real foreground/background pairs with `audit_ui_colors` ([Agent Tools](/tools/agent-tools)).

`"generateReport": true` appends a per-line report:

```text
# CSS Refactoring Report

## Summary
- Total colors found: 9
- Colors replaced: 8
- Replacement rate: 89%
- Average confidence: 100%
- Accessibility issues: 3

## Replacements

### High Confidence (≥90%)
- Line 3: #ffffff → --color-surface (100%)
- Line 4: #e5e7eb → --color-border (100%)
- Line 10: #f9fafb → --color-surface-variant (100%)
…
```

The tool returns text and does not write files. The assistant writes the refactored CSS back to your file.

## What Is Never Touched

Colors are only rewritten inside declaration values. This stylesheet has hex-like text everywhere else:

<!-- prettier-ignore -->
```css
/* Header: was #1f2937 before the rebrand */
#cafe, .site-header {
  color: #1f2937;
  border-bottom: 1px solid /* old: #d1d5db */ #e5e7eb;
  background: #fff url("icons.svg#f9fafb") no-repeat;
  box-shadow: 0 1px 2px #0000001a;
}
.site-header a:hover {
  color: #5b5ff0;
  outline: 2px solid hsl(239 84% 67% / 0.5);
}
.site-header::after {
  content: "#6366f1";
  --header-accent: #4f46e5;
}
```

Tool call: `refactor_css_with_theme { "css": "<above>", "themeCSS": "<theme above>" }`

```text
Refactoring Complete!

Statistics:
- Total colors found: 6
- Colors replaced: 4
- Average confidence: 97%
- Accessibility issues: 2

Refactored CSS:
----------------------------------------
…
/* Header: was #1f2937 before the rebrand */
#cafe, .site-header {
  color: /* #1f2937 */ var(--color-text-primary);
  border-bottom: 1px solid /* old: #d1d5db */ /* #e5e7eb */ var(--color-border);
  background: /* #fff */ var(--color-surface) url("icons.svg#f9fafb") no-repeat;
  box-shadow: 0 1px 2px #0000001a;
}
.site-header a:hover {
  color: /* #5b5ff0 */ var(--color-primary-500);
  outline: 2px solid hsl(239 84% 67% / 0.5);
}
.site-header::after {
  content: "#6366f1";
  --header-accent: #4f46e5;
}

----------------------------------------

Warnings (4):
- Color #fff replaced with --color-surface may have accessibility issues
- Translucent color #0000001a (alpha 0.1) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
- Color #5b5ff0 replaced with --color-primary-500 may have accessibility issues
- Translucent color hsl(239 84% 67% / 0.5) (alpha 0.5) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
```

Left unchanged:

- the `#cafe` selector
- comments, including the `/* old: #d1d5db */` comment inside a value
- the `#f9fafb` fragment inside `url(...)`
- the quoted string in `content`
- the custom-property definition `--header-accent`
- the translucent `#0000001a` and `hsl(… / 0.5)`, each with a warning

## Minified CSS

Minified stylesheets work the same way. Run with `"preserveOriginal": false`:

```text
#fff,.btn{background:#6366f1;color:#fff}.btn:hover{background:#4f46e5;box-shadow:0 0 0 3px rgba(99,102,241,.4)}.btn--ghost{color:white;border:1px solid #e5e7eb}.hero{background:linear-gradient(135deg,#6366f1,#4f46e5),url(img/bg-1f2937.png);--accent:#ec4899}
```

Result:

```text
Refactoring Complete!

Statistics:
- Total colors found: 7
- Colors replaced: 6
- Average confidence: 100%
- Accessibility issues: 3

Refactored CSS:
----------------------------------------
#fff,.btn{background:var(--color-primary-500);color:var(--color-surface)}.btn:hover{background:var(--color-primary-600);box-shadow:0 0 0 3px rgba(99,102,241,.4)}.btn--ghost{color:white;border:1px solid var(--color-border)}.hero{background:linear-gradient(135deg,var(--color-primary-500),var(--color-primary-600)),url(img/bg-1f2937.png);--accent:#ec4899}
----------------------------------------

Warnings (4):
…
- Translucent color rgba(99,102,241,.4) (alpha 0.4) left unchanged — theme variables are opaque
…
```

Notes:

- Gradient stops are replaced individually.
- **Named colors are not detected.** `color:white` is neither replaced nor counted in "Total colors found". Convert named colors to hex first if you want them themed.
- `color:#fff` became `var(--color-surface)`, the only variable with that exact value. If the theme also had `--color-on-primary: #ffffff`, the result would still be `--color-surface`. `match_theme_color` with `"context": "text"` (the context used for `color`) then lists `--color-on-primary (confidence: 100%)` under `Alternatives`. When several variables share a value, review those replacements by hand.

## Tuning `minConfidence`

`minConfidence` (default 70) is the minimum confidence needed to replace a color. Below it, the color is kept and reported.

| Tool call                                                                                       | Refactored CSS                                |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `refactor_css_with_theme { "css": ".nav a { color: #5b5ff0; }", "preserveOriginal": false, … }` | `.nav a { color: var(--color-primary-500); }` |
| same with `"minConfidence": 90`                                                                 | `.nav a { color: #5b5ff0; }`                  |

The second run warns instead:

```text
Warnings (1):
- Low confidence match for #5b5ff0: --color-primary-500 (86%)
  Suggestion: Consider using --color-primary-500 or defining a new theme variable
```

Confidence depends on where the color is used, because each CSS property maps to a context: `color` → text, `background`/`background-color` → background, `border*`/`outline*`/`stroke` → border, `box-shadow`/`text-shadow` → shadow, `fill`/`stop-color` → decorative. The same `#5b5ff0` scores 86% as `color` and 79% as `border-color`:

```text
### Medium Confidence (70-89%)
- Line 1: #5b5ff0 → --color-primary-500 (86%)
- Line 1: #5b5ff0 → --color-primary-500 (79%)
```

## Refactoring Against a Generated Theme

You can pass the output of `generate_theme_css` directly as `themeCSS`. Here the theme is `generate_theme_css { "sourceColor": "#6366f1", "includeTones": [10, 40, 90, 99, 100] }` and the stylesheet uses Material colors, one of them slightly off (`#4a4cd5` instead of `#494bd6`):

```css
.btn-primary {
  background: #4a4cd5;
  color: #ffffff;
}
.chip {
  background: #e1e0ff;
  color: #07006c;
}
.page {
  background: #fffbff;
  color: #1c1b1f;
}
```

Tool call: `refactor_css_with_theme { "css": "<above>", "themeCSS": "<generate_theme_css output>", "preserveOriginal": false }`

```text
Refactoring Complete!

Statistics:
- Total colors found: 6
- Colors replaced: 6
- Average confidence: 100%
- Accessibility issues: 0

Refactored CSS:
----------------------------------------
.btn-primary {
  background: var(--color-primary-40);
  color: var(--color-neutral-100);
}
.chip {
  background: var(--color-primary-90);
  color: var(--color-primary-10);
}
.page {
  background: var(--color-primary-99);
  color: var(--color-neutral-10);
}
----------------------------------------
```

Values map to tonal variables such as `--color-primary-40`, never to the semantic aliases (`--color-primary: var(--color-primary-40)`), because `var()` aliases are not resolved. Every palette has tone 99 = `#fffbff`, so `.page` got `--color-primary-99` where you might expect `--color-neutral-99`. To end up with semantic names, either define them with literal colors in the theme you pass, or rename the tonal variables afterwards.

## Troubleshooting

| Symptom                                       | Cause and fix                                                                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `themeCSS contains no CSS custom properties…` | The theme has no `--x: <color>;` declarations (YAML, a JS config, or only `var()` aliases were passed). Pass CSS with literal colors.  |
| A theme variable is never used                | Check for a missing `;` after the last declaration in a block (see the warning above), a translucent value, or a `var()` alias.        |
| Many "No suitable theme variable" warnings    | The colors are far from every theme color, especially for `color` (text has the strictest limit). Add the missing colors to the theme. |
| A color was mapped to an unexpected variable  | Several variables have the same or nearly the same value. Look at `Alternatives` from `match_theme_color` and fix those lines by hand. |
| `white`, `black` etc. were not replaced       | Named colors are not detected in the stylesheet. Convert them to hex first.                                                            |
| Translucent colors left over                  | Expected. Define dedicated translucent tokens (scrims, overlays, focus rings) yourself.                                                |
| Input too large                               | `css` is limited to 500 000 characters and `themeCSS` to 200 000. Split large stylesheets.                                             |

## Next Steps

- [Creating Themes](/examples/creating-themes): generate the theme you refactor against
- [Theme Matching](/tools/theme-matching): parameter reference
- [Theme Matching Concepts](/concepts/theme-matching): how distance and confidence are computed
- [Image Extraction](/examples/image-extraction): build a theme from an image
