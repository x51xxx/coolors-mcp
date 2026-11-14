# DESIGN.md Audit

[DESIGN.md](https://github.com/google-labs-code/design.md) is a format from Google Labs for describing a design system to coding agents. One Markdown file holds machine-readable design tokens together with prose that explains them. Coolors MCP can audit the color tokens of such a file with [`audit_design_md`](#audit-design-md), and write a `colors:` block for one with [`export_palette`](#export-palette-with-format-design-md).

## The format in brief

This section covers only what the auditor reads. The full specification is in the [repository](https://github.com/google-labs-code/design.md).

- **Spec version.** The current spec is `alpha`, written as `version: alpha`.
- **Where tokens live.** Tokens go in the YAML front matter (between the `---` lines at the top of the file) and in fenced ` ```yaml ` blocks in the body. All of these are merged into one token tree. A top-level key that appears in more than one block is an error.
- **`colors`.** A map from token name to a CSS color, for example `primary: "#6750a4"`. **Quote hex values.** In YAML, an unquoted `#` starts a comment, so `ink: #1c1b22` is read as an empty value.
- **`components`.** A map from component name to its properties. The color properties are `backgroundColor` and `textColor`.
- **References.** `{colors.primary}` points to another token. References can chain.
- **Other groups.** Typography, spacing and rounding tokens also exist. The auditor ignores them.

A minimal file:

```markdown
---
version: alpha
name: Example
colors:
  primary: "#6750a4"
  on-primary: "#ffffff"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
---

# Example

Prose about the brand, layout and components…
```

::: tip Claude Code
Claude Code does not load `DESIGN.md` automatically. To make it part of every session, reference it from your `CLAUDE.md`:

```markdown
## Design system

Follow the tokens and rules in @DESIGN.md.
```

:::

---

## `audit_design_md`

Audits the `colors` and `components` of a DESIGN.md file and returns a Markdown report. Pass the **full text** of the file. The tool reads no files itself.

### Parameters

| Parameter       | Type    | Required | Default | Description                                                                                                    |
| --------------- | ------- | -------- | ------- | -------------------------------------------------------------------------------------------------------------- |
| `designMd`      | string  | Yes      | –       | Full text of the DESIGN.md file, 1–500 000 characters.                                                         |
| `textThreshold` | number  | No       | `4.5`   | Minimum WCAG ratio for text pairs, 3–7. 4.5 is AA for normal text and 7 is AAA.                                |
| `cvdThreshold`  | number  | No       | `10`    | ΔE2000 below which two accent or status colors count as indistinguishable under color-vision deficiency, 1–30. |
| `maxItems`      | integer | No       | `25`    | Maximum rows listed per report section, 5–200.                                                                 |

Problems in the file never set `isError`. They appear in the report, mostly under "Spec errors". Only schema violations are tool errors, for example `textThreshold: 8` gives `Invalid arguments for tool 'audit_design_md': textThreshold: Too big: expected number to be <=7`.

### What is checked

**1. Parsing and spec rules** (reported under "Spec errors"):

- The front matter is never closed.
- A YAML parse error in a block.
- A top-level key defined twice. Only the first definition is audited.
- No `colors` group, or `colors` is not a map.
- `colors.primary` is missing.
- A broken `{colors.x}` reference, or a reference cycle.

**2. Values the auditor cannot evaluate** are listed under "Not audited / caveats", never guessed:

- An empty value (usually an unquoted `#…`).
- Hex without `#`.
- `transparent` and `currentColor`.
- `hwb()`, `lab()`, `lch()`, `color()`, `color-mix()` and `light-dark()`. These are valid DESIGN.md syntax, but the auditor cannot evaluate them yet.

A color with alpha below 1 is audited as if it were opaque, with a note.

**3. Contrast pairs**

- **Declared pairs.** Every component that has both `backgroundColor` and `textColor` gives one pair, checked against `textThreshold`. A component whose name contains a `disabled` segment (`button-primary-disabled`) is **exempt**, because WCAG 1.4.3 exempts inactive controls. If the same two tokens are also paired somewhere that is not exempt, the real check wins.
- **Inferred pairs**, guessed from token names:
  - `on-X` ↔ `X`.
  - If there is no token `X`, `on-X` is paired with every surface token whose name contains the segment `X`, so `on-dark` ↔ `surface-dark`.
  - Text tokens ↔ surface tokens of the same mode, at `textThreshold`. Text tokens are names starting with `ink`, `text`, `body`, `foreground`, `fg`, `heading`, `headline`, `title`, `caption`, `muted`, `subtle`, `copy` or `content`, or containing a `text` segment. Surface tokens are names starting with `canvas`, `surface`, `background`, `bg`, `paper` or `page`, except `tint` tokens. A name with a `dark` or `night` segment only pairs with dark surfaces, and other names only with light ones.
  - `border*`, `outline*` and `stroke*` ↔ surfaces at **3:1** (WCAG 1.4.11). `*-variant` outlines, hairlines and dividers are treated as decorative and skipped.
- **Fixes.** Every failing pair gets a suggested foreground with the same hue, from the same solver as [`fix_contrast`](/tools/agent-tools#fix-contrast). The target is AA, or AAA when `textThreshold` is above 4.5; UI pairs use 3:1. Only the foreground is changed. If you would rather keep the text color, run `fix_contrast` with `adjust: "background"`.

**4. Color-vision collisions.** The candidates are:

- **Accent and status colors:** every token with a status segment (`success`, `positive`, `warning`, `caution`, `error`, `danger`, `negative`, `info`).
- Every other token with HCT chroma ≥ 16, except `on-*`, text, surface and border tokens.

At most 24 candidates are used. Each pair is simulated under protanopia, deuteranopia, tritanopia and deuteranomaly. A pair is reported when it is distinct for normal vision but its simulated ΔE2000 falls below `cvdThreshold`. Shades of one family are skipped: the same status word, one name a prefix of the other (`primary`, `primary-deep`), or the same first name segment with hues within 20°. Pairs where both colors are status colors are marked ⚠ and listed first.

**5. Duplicates.** Tokens with the same hex are listed with a suggestion to alias one to the other. Tokens that are already `{colors.x}` references count as deliberate aliases and are not listed. Distinct tokens closer than ΔE2000 2 are listed as near-duplicates.

**6. Universally disliked colors.** Tokens in the dark yellow-green zone are listed with the same hue at tone 70 (see [the dislike rule](/tools/image-extraction#analyze-color-likability)).

### Report sections

1. A summary line: token counts, contrast pairs (declared/inferred), failing pairs, CVD collisions and duplicates.
2. `## Spec errors` (only when there are errors).
3. `## Contrast`: a table, failing pairs first, then declared before inferred, worst ratio first.
4. `## Color-vision collisions`.
5. `## Duplicates`, `## Universally disliked colors` and `## Not audited / caveats` (only when they have entries).

Each section lists at most `maxItems` rows and then `… and N more`. The contrast table ends with `… N more passing pairs not listed`.

### Example

A synthetic DESIGN.md with some deliberate problems:

````markdown
---
version: alpha
name: Lumen Notes
description: Calm note-taking app with a violet accent.
colors:
  primary: "#7c5cff"
  on-primary: "#ffffff"
  surface: "#fbfaff"
  on-surface: "#1c1b22"
  text-muted: "#9a96a8"
  border: "#e4e1ee"
  success: "#2e9e5b"
  error: "#d64545"
  warning: "#c98a00"
  highlight: "#7a6a1f"
  accent: "#7c5cfe"
  brand: "#7c5cff"
  link: "{colors.primary}"
  focus: "{colors.focus-ring}"
  overlay: "color-mix(in srgb, #000 40%, transparent)"
  surface-dark: "#111014"
  on-dark: "#f4f2fa"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
  button-primary-disabled:
    backgroundColor: "{colors.border}"
    textColor: "{colors.text-muted}"
  badge-warning:
    backgroundColor: "{colors.warning}"
    textColor: "#ffffff"
---

# Lumen Notes

## Typography

```yaml
typography:
  body-md:
    fontFamily: Inter
    fontSize: 16px
```
````

```json
{ "designMd": "<the file above>" }
```

```text
# DESIGN.md color audit

Color tokens: 17 (15 audited, 2 not audited) · Contrast pairs: 7 (3 declared, 4 inferred) · Failing: 4 · CVD collisions: 3 · Duplicates: 1 exact, 1 near

## Spec errors

- ✗ colors.focus: broken reference {colors.focus-ring} (from colors.focus)

## Contrast

| text / element | on background | source | WCAG | needs | APCA Lc | result | suggested fix |
|---|---|---|---|---|---|---|---|
| `components.badge-warning.textColor` #ffffff | `warning` #c98a00 | declared · components.badge-warning | 2.95:1 | 4.5:1 (text) | -61.0 | ✗ | components.badge-warning.textColor → `#2e3030` (4.50:1) |
| `on-primary` #ffffff | `primary` #7c5cff | declared · components.button-primary | 4.35:1 | 4.5:1 (text) | -75.0 | ✗ | on-primary → `#0a0c0d` (4.51:1) |
| `border` #e4e1ee | `surface` #fbfaff | inferred · border/outline ↔ surface | 1.24:1 | 3:1 (UI) | 11.6 | ✗ | border → `#92909c` (3.02:1) |
| `text-muted` #9a96a8 | `surface` #fbfaff | inferred · text token ↔ surface | 2.77:1 | 4.5:1 (text) | 52.4 | ✗ | text-muted → `#757283` (4.50:1) |
| `text-muted` #9a96a8 | `border` #e4e1ee | declared · components.button-primary-disabled | 2.23:1 | exempt (disabled) | 38.3 | ✓ |  |
| `on-surface` #1c1b22 | `surface` #fbfaff | inferred · on-X ↔ X | 16.45:1 | 4.5:1 (text) | 101.3 | ✓ |  |
| `on-dark` #f4f2fa | `surface-dark` #111014 | inferred · on-dark ↔ *-dark surfaces | 17.08:1 | 4.5:1 (text) | -99.5 | ✓ |  |

Declared pairs come from `components`; inferred pairs are guesses from token names — confirm the pairing before acting on them. Decorative dividers, hairlines and `outline-variant` are not checked.

## Color-vision collisions

- ⚠ status pair `success` ↔ `error` under deuteranopia: ΔE2000 6.6
- ⚠ status pair `success` ↔ `warning` under protanopia: ΔE2000 9.6
- `error` ↔ `highlight` under deuteranopia: ΔE2000 9.3

Do not rely on hue alone for these: add icons/labels or separate them in lightness.

## Duplicates

- `primary`, `brand` share #7c5cff — alias one to the other with `{colors.primary}` if intentional.
- `primary` ≈ `accent` (ΔE2000 0.13) — visually indistinguishable.

## Universally disliked colors

- `highlight` #7a6a1f sits in the dark yellow-green "bile" zone; same hue at tone 70: #beab59

## Not audited / caveats

- `overlay`: `color-mix(in srgb, #000 40%, transparent)` — `color-mix()` is valid DESIGN.md syntax but this auditor cannot evaluate it yet
```

How to read this report:

- **A hard-coded `textColor`** (`"#ffffff"` in `badge-warning`) has no token name, so its row shows the component path.
- **`link: "{colors.primary}"`** is an alias, so it is not reported as a duplicate. `brand` repeats the hex instead and is reported.
- **A suggested fix may flip the text color.** White on `primary` reaches 4.5:1 only as near-black `#0a0c0d`, because white cannot get lighter. To keep white text, change the background instead: `fix_contrast` with `{ "foreground": "#ffffff", "background": "#7c5cff", "adjust": "background" }` gives `#7a59fc` at 4.50:1, a ΔE2000 shift of 1.02.
- **The disabled button** is listed as exempt and does not count as failing.

### Options

- `textThreshold: 7` makes every text pair need 7:1. In the example, the `text-muted` row reads `7:1 (text)` and suggests `#575465` (7.07:1).
- Any `textThreshold` above 4.5 solves fixes to AAA. With `textThreshold: 5`, the same row needs `5:1` but still suggests `#575465` (7.07:1).
- `cvdThreshold: 5` reduces the collisions in the example from 3 to 0. Lower values only report the most severe confusions.

### Edge cases

This file has several problems that make tokens unauditable:

````markdown
---
name: X
colors:
  brand: "#6750a4"
  ink: #1c1b22
  glass: "#ffffff80"
  hex-no-hash: "6750a4"
  clear: transparent
  tone: "lch(50% 40 300)"
---

```yaml
colors:
  primary: "#000000"
```
````

```text
# DESIGN.md color audit

Color tokens: 6 (2 audited, 4 not audited) · Contrast pairs: 0 (0 declared, 0 inferred) · Failing: 0 · CVD collisions: 0 · Duplicates: 0 exact, 0 near

## Spec errors

- ✗ Top-level key `colors` is defined more than once (yaml block #1); the spec rejects such files. Only the first definition is audited.
- ✗ `colors.primary` is required by the spec but missing.

## Contrast

No pairs found. Declare `backgroundColor`/`textColor` in `components`, or use `on-X` token names.

## Color-vision collisions

✓ Accent and status colors stay distinguishable (protanopia, deuteranopia, tritanopia, deuteranomaly).

## Not audited / caveats

- `ink`: `` — empty value — an unquoted `#...` starts a YAML comment; quote hex colors
- `hex-no-hash`: `6750a4` — not a CSS color — hex values need a leading `#`
- `clear`: `transparent` — not an opaque color; contrast cannot be evaluated
- `tone`: `lch(50% 40 300)` — `lch()` is valid DESIGN.md syntax but this auditor cannot evaluate it yet
- colors.glass has alpha 0.5; contrast is computed for the opaque color — the real contrast depends on what is underneath.
```

Text with no tokens at all (`# Just prose, no tokens`) reports ``✗ No `colors` token group found.`` under "Spec errors".

---

## `export_palette` with `format: "design-md"`

[`export_palette`](/tools/palettes) can write a `colors:` block to paste into the front matter. Its parameters are `colors` (1–256), `format`, `names` (optional, same length as `colors`) and `prefix` (optional). Hex values are always quoted, so `#` is never read as a YAML comment.

```json
{
  "format": "design-md",
  "colors": ["#ffffff", "rgb(111,108,114)"],
  "names": ["On Primary", "Text Muted"]
}
```

```text
colors:
  on-primary: "#ffffff"
  text-muted: "#6f6c72"
```

- **Names are normalized** to lowercase `a–z0–9-`. Every input color is written as `#rrggbb`.
- **Default names.** Without `names`, tokens are named on a 50/100…900 scale and quoted because they start with a digit: `"50": "#6750a4"`, `"100": "#9a83db"`, ….
- **Prefix.** `prefix: "brand"` gives `brand-50`, `brand-100`, ….
- **Duplicates.** Names that collide after normalization are rejected: `Duplicate token names after normalization: "ink" (colors 1 and 2). Give each color a distinct name.`

The block contains only `colors`. Add `version`, `name` and `components` yourself, and use DESIGN.md's own token names (`primary`, `on-primary`, `surface` …) so the audit can infer pairs.

---

## Workflow: generate, export, audit, fix

**1. Generate** a UI palette, then pick the light tokens you want:

```json
{ "brand": "#6750a4" }
```

This calls [`design_ui_palette`](/tools/agent-tools#design-ui-palette). Among its light tokens are `primary` `#6750a4`, `onPrimary` `#ffffff`, `surface` `#ffffff`, `textPrimary` `#211f23`, `textMuted` `#6f6c72`, `border` `#dbd5df`, `success` `#216c2e`, `error` `#9c423b` and `warning` `#7f5600`.

**2. Export** them under DESIGN.md names:

```json
{
  "format": "design-md",
  "colors": [
    "#6750a4",
    "#ffffff",
    "#ffffff",
    "#211f23",
    "#6f6c72",
    "#dbd5df",
    "#216c2e",
    "#9c423b",
    "#7f5600"
  ],
  "names": [
    "primary",
    "on-primary",
    "surface",
    "on-surface",
    "text-muted",
    "border",
    "success",
    "error",
    "warning"
  ]
}
```

```text
colors:
  primary: "#6750a4"
  on-primary: "#ffffff"
  surface: "#ffffff"
  on-surface: "#211f23"
  text-muted: "#6f6c72"
  border: "#dbd5df"
  success: "#216c2e"
  error: "#9c423b"
  warning: "#7f5600"
```

**3. Audit.** Paste the block into the front matter with `version: alpha`, a `name` and a `button-primary` component (`{colors.primary}` / `{colors.on-primary}`), then run `audit_design_md`:

```text
Color tokens: 9 (9 audited, 0 not audited) · Contrast pairs: 4 (1 declared, 3 inferred) · Failing: 1 · CVD collisions: 5 · Duplicates: 1 exact, 0 near
…
| `border` #dbd5df | `surface` #ffffff | inferred · border/outline ↔ surface | 1.44:1 | 3:1 (UI) | 21.0 | ✗ | border → `#98939d` (3.00:1) |
…
- ⚠ status pair `success` ↔ `error` under deuteranopia: ΔE2000 3.8
- ⚠ status pair `success` ↔ `warning` under protanopia: ΔE2000 5.4
- ⚠ status pair `error` ↔ `warning` under deuteranopia: ΔE2000 7.8
- ⚠ status pair `error` ↔ `warning` under tritanopia: ΔE2000 8.8
- ⚠ status pair `success` ↔ `warning` under deuteranopia: ΔE2000 8.9
…
- `on-primary`, `surface` share #ffffff — alias one to the other with `{colors.on-primary}` if intentional.
```

**4. Fix** what the audit found:

- **`border`.** `design_ui_palette` makes `border` deliberately subtle. Keep that value as a decorative `divider`, which is not checked, and use a 3:1 color for `border`. `fix_contrast` with `{ "foreground": "#dbd5df", "background": "#ffffff", "target": "ui" }` returns `#98939d` (3.00:1).
- **Duplicate.** Alias it: `on-primary: "{colors.surface}"`.

The re-audit:

```text
Color tokens: 10 (10 audited, 0 not audited) · Contrast pairs: 4 (1 declared, 3 inferred) · Failing: 0 · CVD collisions: 5 · Duplicates: 0 exact, 0 near
```

The **5 CVD collisions remain**. The status hues of `design_ui_palette` are fixed, and success, error and warning are hard to tell apart under deuteranopia and protanopia. Show status with icons and text labels, not color alone. Alternatively, change the lightness of one status color and audit again.

**5. Use it.** Commit the file as `DESIGN.md` and reference it from `CLAUDE.md` as `@DESIGN.md` (see the [tip above](#the-format-in-brief)).

## Related

- [Agent Tools](/tools/agent-tools): `design_ui_palette`, `fix_contrast`, `audit_ui_colors`
- [Palettes](/tools/palettes): `export_palette` and its other formats
- [Accessibility concepts](/concepts/accessibility)
