# Theme Matching Algorithm

`match_theme_color`, `match_theme_colors_batch` and `refactor_css_with_theme` map hard-coded colors to the custom properties of a theme. This page describes how they do it (`src/theme/parser.ts`, `matcher.ts`, `refactor.ts`), including where the method breaks down. Parameters are in [Theme Matching tools](/tools/theme-matching).

## 1. Reading the theme (`themeCSS`)

The parser scans the whole string for `--name: value;` declarations:

- **Selector scope is ignored.** Variables in `:root`, `.dark`, `@media` blocks and so on are all collected, so light and dark definitions are candidates side by side.
- **Only opaque colors count**, in any [supported syntax](/concepts/color-spaces#accepted-input): hex, named colors, `rgb()`, `hsl()`, `oklch()`, `oklab()`, `hct()`. Translucent values (`rgba(0, 0, 0, 0.3)`, `#0000004d`) are skipped.
- **Numbers are not colors.** `--z: 999999;` or `--weight: 600;` are not read as bare hex.
- **`var()` aliases are not resolved.** `--accent: var(--color-primary);` is ignored.
- If no color variable is found, the tool returns an error result (`isError: true`):

```text
themeCSS contains no CSS custom properties with color values (expected e.g. `:root { --color-primary: #6750a4; }`).
```

Each variable is converted to HCT and gets a **semantic role** from the first substring its name contains, checked in this order:

| Substring in the name | Role       |
| --------------------- | ---------- |
| `primary`             | primary    |
| `secondary`           | secondary  |
| `tertiary`            | tertiary   |
| `error`, `danger`     | error      |
| `neutral`, `gray`     | neutral    |
| `surface`             | surface    |
| `background`, `bg`    | background |
| `outline`, `border`   | outline    |
| `shadow`              | shadow     |

First match wins, so `--color-on-primary` is a _primary_ variable and `--surface-border` a _surface_ one. There are no text, success, warning or info roles; such variables are still matched by color, just without a role.

## 2. HCT distance

Candidates are compared with a weighted distance in [HCT](/concepts/hct), not with ΔE:

```text
Δh = circular hue difference (0–180°) / 180
Δc = |chroma₁ − chroma₂| / 120
Δt = |tone₁ − tone₂| / 100

distance = 100 × √( Δh² + Δc² + (2·Δt)² )
```

On this scale, 1 tone step adds 2 units, 1° of hue ≈ 0.56 and 1 chroma unit ≈ 0.83. A candidate is dropped if its distance exceeds the limit for the usage context:

| Context      | Max distance |
| ------------ | ------------ |
| `text`       | 10           |
| `background` | 15           |
| `accent`     | 15           |
| `border`     | 20           |
| `shadow`     | 25           |
| `decorative` | 30           |
| none         | 30           |

`match_theme_color` and `match_theme_colors_batch` take the context from the `context` parameter. `refactor_css_with_theme` infers it from each declaration's property (see below).

## 3. Score

Each remaining candidate gets a score:

```text
score = 0.6 × perceptual + 0.2 × semantic + 0.2 × accessibility
perceptual = (100 − distance) / 100
```

**Semantic** — a variable without a role always scores 0.5, and so does every candidate when no context is given:

| Context      | Semantic score                             |
| ------------ | ------------------------------------------ |
| `accent`     | 1.0 for primary/secondary, else 0.5        |
| `background` | 1.0 for surface/background, else 0.3       |
| `border`     | 1.0 for outline, 0.4 for neutral, else 0.2 |
| `shadow`     | 1.0 for shadow, else 0.3                   |
| `text`       | 0.8 for neutral/surface, else 0.5          |
| `decorative` | 0.7 for any role                           |

**Accessibility** looks at the candidate's tone only: for `text`, 1.0 if tone < 30 or > 70, else 0.3; for `background`, 1.0 if tone ≥ 90 or ≤ 10, else 0.5; 0.5 for every other context.

The highest score wins; up to three runners-up are listed as alternatives.

## 4. Confidence

```text
distance < 0.5  → 100
distance < 1    → 98
distance < 2    → 95
otherwise       → round(( max(0, 100 − 2·distance) + 100·score ) / 2)
```

Without a context this works out to about **90 − 1.3 × distance** for distances of 2 or more, so the default `minConfidence: 70` accepts distances up to roughly 15.

Example with the theme `--color-primary: #6750a4` and no context: `#6a52a8` (HCT 299.2 / 48.6 / 41.1 against 299.0 / 47.9 / 40.1) is at distance 2.13:

```text
Best Match:
Variable: --color-primary
Value: #6750a4
Distance: 2.13
Confidence: 87%
Semantic Role: primary
```

For the `text` and `background` contexts, `match_theme_color` also prints accessibility info. This is the matched variable's highest WCAG contrast against the theme's own "typical" backgrounds (surface variables with tone ≥ 90 or ≤ 10, all background variables, neutral variables with tone ≥ 95 or ≤ 5) and "typical" foregrounds (neutral variables with tone 20–40 or 60–80, surface variables with tone 10–30). It is a heuristic about the theme, not a check of the declaration being replaced.

## 5. Refactoring CSS

`refactor_css_with_theme` walks the stylesheet once and only looks at **declaration values**:

- It skips selectors (`#cafe {` is never touched), comments, quoted strings and `url(...)`.
- It skips custom-property definitions (`--x: …`), so the theme itself is never rewritten into self-references.
- It finds hex colors (3/4/6/8 digits) and `rgb()`/`rgba()`/`hsl()`/`hsla()`/`oklch()`/`oklab()` functions. **Named colors (`white`) and `hct()` in stylesheets are not rewritten.**
- Translucent colors are left unchanged, with a warning.

The context comes from the property:

| Property                                                                                               | Context      |
| ------------------------------------------------------------------------------------------------------ | ------------ |
| `color`                                                                                                | `text`       |
| `background`, `background-color`                                                                       | `background` |
| `border`, `border-color`, `border-{top,right,bottom,left}-color`, `outline`, `outline-color`, `stroke` | `border`     |
| `box-shadow`, `text-shadow`                                                                            | `shadow`     |
| `fill`, `stop-color`                                                                                   | `decorative` |
| anything else                                                                                          | none         |

The scoring weights also change per declaration: perceptual 0.6; semantic 0.3 when a context is known (else 0.2); accessibility 0.3 for `text`/`background` (else 0.1).

These weights add up to 1.2 for `text` and `background`, so the raw score can exceed 1; the reported confidence is clamped to 0–100%.

With `preserveOriginal: true` (the default) each replacement keeps the old value as a comment, and a summary comment is added at the top. Real run:

```json
{
  "themeCSS": ":root {\n  --color-primary: #6750a4;\n  --color-on-primary: #ffffff;\n  --color-surface: #fffbff;\n  --color-on-surface: #1c1b1e;\n  --color-outline: #7a757f;\n}",
  "css": "/* #6750a4 in a comment is ignored */\n.button {\n  background: #6750a4;\n  color: #ffffff;\n  border: 1px solid #7d7880;\n  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);\n}"
}
```

```text
Refactoring Complete!

Statistics:
- Total colors found: 4
- Colors replaced: 3
- Average confidence: 98%
- Accessibility issues: 0

Refactored CSS:
----------------------------------------
/* CSS Refactored with Theme Variables
 * Total colors found: 4
 * Colors replaced: 3
 * Average confidence: 98%
 * Warnings: 1
 */

/* #6750a4 in a comment is ignored */
.button {
  background: /* #6750a4 */ var(--color-primary);
  color: /* #ffffff */ var(--color-on-primary);
  border: 1px solid /* #7d7880 */ var(--color-outline);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}
----------------------------------------

Warnings (1):
- Translucent color rgba(0, 0, 0, 0.3) (alpha 0.3) left unchanged — theme variables are opaque
  Suggestion: Define a dedicated translucent token (e.g. a scrim/overlay variable) if this value repeats
```

With `preserveOriginal: false` the value becomes a bare `var(--…)` and no comments are added.

## 6. Batch matching

`match_theme_colors_batch` runs the same matcher for up to 50 colors with one shared `context`. It has **no `minConfidence`**: any candidate within the context's max distance is reported, with its confidence. Invalid colors are reported per entry instead of failing the call (theme: `--color-on-primary: #ffffff; --color-primary: #6750a4;`):

```text
Theme Color Matches:

#6750a4 → --color-primary (100%)
#ffffff → --color-on-primary (100%)
nope → ✗ invalid color format
#00ff00 → No match found

Summary:
- Matched: 2/4
- Average confidence: 100%
```

## Limitations

- **Near-greys and the hue term.** The distance always includes the full hue term, even when chroma is close to zero and hue is meaningless. `#1f1f1f` is HCT 209.5 / 0.9 / 11.8; `--color-on-surface: #1c1b1e` is 293.5 / 3.5 / 10.0. Their ΔE2000 is only 2.76, but the 84° hue gap alone adds about 47 units, so `match_theme_color` with `context: "text"` returns `No matching theme variable found`.
- **Roles come from names**, by first substring (`--color-on-primary` is "primary").
- **No `var()` resolution and no selector awareness.** A color can match a dark-mode variable.
- **Opaque colors only**, in the theme and in the CSS.
- **Accessibility info and warnings are heuristics** about the theme's variables (see section 4), not contrast checks of the rewritten declarations.
- **Nothing is created.** Unmatched colors are left in place with a warning; no new variables are generated.

## See Also

- [HCT Color System](/concepts/hct) — what hue, chroma and tone mean here
- [Distance Metrics](/concepts/distance-metrics) — ΔE metrics for comparison
- [Theme Matching tools](/tools/theme-matching) — parameters and more examples
