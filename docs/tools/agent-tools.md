# Agent Tools

A language model reads `#7a6a1f` as a string. It cannot see that this is a muddy olive, which text color reads best on it, or that it falls in the zone most people dislike. These five tools turn such questions into computed answers:

- [`describe_color`](#describe-color): what a color looks like, in words and numbers
- [`fix_contrast`](#fix-contrast): the closest same-hue color that meets a contrast target
- [`design_ui_palette`](#design-ui-palette): a light and dark UI token set from one brand color
- [`audit_ui_colors`](#audit-ui-colors): check many foreground/background pairs and swatches at once
- [`generate_categorical_palette`](#generate-categorical-palette): distinct colors for charts and tags, chosen to survive color-vision deficiency

All five return plain text (Markdown, CSS or JSON). Contrast uses the WCAG 2.x ratio and APCA Lc (positive = dark text on light, negative = light text on dark). Color-vision simulation uses the Machado et al. (2009) matrices at full severity. See [Accessibility concepts](/concepts/accessibility).

---

## `describe_color`

Profiles 1–20 colors in human terms: a name, lightness and vividness, temperature, the values in four color spaces, which text color reads best on it, suggested UI roles, and warnings.

### Parameters

| Parameter | Type     | Required | Default | Description                                           |
| --------- | -------- | -------- | ------- | ----------------------------------------------------- |
| `colors`  | string[] | Yes      | –       | Colors to describe, 1–20 items. Any supported syntax. |

### What each line means

| Line               | Computed from                                                                                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name               | Lightness word + vividness word + hue name. The hue name comes from the OKLCH hue, with contextual names such as _brown_, _olive_ and _peach_ for dark or light variants. Colors with OKLCH C < 0.012 get grey names (_black_, _charcoal_ … _white_). |
| Lightness tier     | HCT tone: near-black < 10 ≤ very-dark < 22 ≤ dark < 36 ≤ medium-dark < 48 ≤ medium < 60 ≤ medium-light < 74 ≤ light < 86 ≤ very-light < 95 ≤ near-white.                                                                                              |
| Vividness tier     | OKLCH chroma: achromatic < 0.015 ≤ muted < 0.055 ≤ soft < 0.1 ≤ balanced < 0.16 ≤ vibrant < 0.23 ≤ electric.                                                                                                                                          |
| Temperature        | `cos(oklch_hue − 55°) × min(1, C / 0.16) × 100`. A score of 15 or more is warm, −15 or less is cool, anything between is neutral.                                                                                                                     |
| Text on this color | White against the dark ink `#0f0f17`, with WCAG and APCA for both. The recommendation is the ink with the larger APCA \|Lc\|.                                                                                                                         |
| Best UI roles      | Rules on tone and chroma, for example tone ≥ 90 → `light-mode-surface`, tone 35–65 with OKLCH C ≥ 0.09 → `primary-cta-on-light`, tone ≤ 22 → `dark-mode-surface`.                                                                                     |
| Warnings           | Disliked dark yellow-green (with the tone-70 fix, see [the dislike rule](/tools/image-extraction#analyze-color-likability)), OKLCH C > 0.24 (neon), near-pure black (tone < 4), near-pure white (tone > 98).                                          |

### Example

```json
{ "colors": ["#6750a4", "#7a6a1f", "#000000"] }
```

```text
# Perceptual Color Profile

## #6750a4 — **medium dark violet**
- **Appearance**: medium-dark, balanced, cool (temp score -42)
- **Spaces**: `oklch(49.6% 0.1305 293.7)` | `hct(299.0, 47.9, 40.1)` | `hsl(256, 34%, 48%)` | `rgb(103, 80, 164)` | L=0.113
- **Text on this color**: use **#ffffff** (light) — light `#ffffff`: 6.44:1 (APCA 87) vs dark `#0f0f17`: 2.96:1 (APCA 22)
- **Best UI roles**: primary-cta-on-light, accent-highlight, focus-ring

## #7a6a1f — **medium dark soft olive**
- **Appearance**: medium-dark, soft, warm (temp score +44)
- **Spaces**: `oklch(52.5% 0.0944 96.8)` | `hct(98.2, 34.9, 45.0)` | `hsl(49, 59%, 30%)` | `rgb(122, 106, 31)` | L=0.145
- **Text on this color**: use **#ffffff** (light) — light `#ffffff`: 5.37:1 (APCA 82) vs dark `#0f0f17`: 3.55:1 (APCA 27)
- **Best UI roles**: primary-cta-on-light, accent-highlight, focus-ring
- **Warnings**: Universally disliked "bile zone" dark yellow-green; consider lightening to #beab59.

## #000000 — **black**
- **Appearance**: near-black, achromatic, neutral (temp score +0)
- **Spaces**: `oklch(0.0% 0.0000 0.0)` | `hct(0.0, 0.0, 0.0)` | `hsl(0, 0%, 0%)` | `rgb(0, 0, 0)` | L=0.000
- **Text on this color**: use **#ffffff** (light) — light `#ffffff`: 21.00:1 (APCA 108) vs dark `#0f0f17`: 1.10:1 (APCA 0)
- **Best UI roles**: body-text-on-light, high-contrast-accent, dark-mode-surface, dark-canvas
- **Warnings**: Near-pure black — can cause OLED smearing and harsh halation with white text; prefer tone 6–12.
```

### Edge cases

- **The ink recommendation follows APCA, not WCAG.** `oklch(0.7 0.25 30)` is first mapped into sRGB (`#ff6551`, OKLCH chroma 0.1916). The tool then recommends `#ffffff` with APCA 60 against 49, although white is only `2.90:1` in WCAG and the dark ink is `6.57:1`. If you need WCAG AA, read both numbers or use [`fix_contrast`](#fix-contrast).
- **Input other than hex** is echoed after the hex: `## #ff6551 (oklch(0.7 0.25 30))`.
- **Invalid colors** get their own `❌ Invalid color format.` section. The other colors are still described and the call does not fail.

---

## `fix_contrast`

Finds the color closest to the original (smallest ΔE2000) that meets a contrast target, by changing only its **HCT tone**. Hue and chroma are kept, except that chroma shrinks where sRGB cannot hold it at the new tone.

### Parameters

| Parameter    | Type   | Required | Default        | Description                                                                                                                                                                           |
| ------------ | ------ | -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `foreground` | string | Yes      | –              | Foreground/text color.                                                                                                                                                                |
| `background` | string | Yes      | –              | Background color.                                                                                                                                                                     |
| `target`     | string | No       | `"aa"`         | `aa` (4.5:1), `aaa` (7:1), `aa-large` (3:1), `ui` (3:1), `apca-body` (\|Lc\| ≥ 75), `apca-content` (\|Lc\| ≥ 60), `apca-large` (\|Lc\| ≥ 45).                                         |
| `adjust`     | string | No       | `"foreground"` | `foreground`, `background`, or `auto` (tries both and keeps the one with the smaller ΔE2000).                                                                                         |
| `prefer`     | string | No       | `"minimal"`    | `minimal` tries both darker and lighter and keeps the closer result. `darker` or `lighter` restricts the direction, and falls back to both if that direction cannot reach the target. |

If no tone of the allowed color reaches the target, the tool returns black or white, whichever contrasts more, marked **⚠ Best possible fallback**.

### Examples

```json
{ "foreground": "#8a8aff", "background": "#ffffff" }
```

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: foreground (ΔE2000 shift = 11.69)
- **Before**: `#8a8aff` on `#ffffff` → 2.93:1 (APCA Lc 55.6)
- **After**:  `#6969dc` on `#ffffff` → **4.51:1** (APCA Lc **71.1**)
```

With `"target": "aaa"`, the same pair gives `#4b4abb` at 7.01:1.

Fix the background instead, for white text on orange:

```json
{ "foreground": "#ffffff", "background": "#ff9800", "adjust": "auto" }
```

```text
# Accessible Contrast Solution (aa)

- **Status**: ✓ Target achieved
- **Adjusted**: background (ΔE2000 shift = 20.00)
- **Before**: `#ffffff` on `#ff9800` → 2.16:1 (APCA Lc -46.5)
- **After**:  `#ffffff` on `#ad6500` → **4.53:1** (APCA Lc **-76.5**)
```

An APCA target on a dark background:

```json
{
  "foreground": "#777777",
  "background": "#222222",
  "target": "apca-body",
  "prefer": "lighter"
}
```

```text
# Accessible Contrast Solution (apca-body)

- **Status**: ✓ Target achieved
- **Adjusted**: foreground (ΔE2000 shift = 26.72)
- **Before**: `#777777` on `#222222` → 3.55:1 (APCA Lc -28.1)
- **After**:  `#d0cfce` on `#222222` → **10.23:1** (APCA Lc **-75.1**)
```

### Edge cases

- **Already passing.** `#1f2937` on `#ffffff` returns `# Contrast Already Passes (aa)` with `WCAG 2.x: **14.68:1** | APCA Lc: **101.5**`.
- **Remaining notes.** The solved pair is audited again. For example, `#ff0000` on `#0000ff` (aa) becomes `#ffa496` at 4.50:1, and the output adds `Low APCA readability (|Lc|=49.1, …)` and `Contrast drops under color-blindness (protanopia (~1%): 2.50:1, tritanopia (~0.003%): 2.89:1)`.
- **Unreachable target.** `#808080` on `#777777` with `aaa` ends at `#000000` (4.69:1), marked `⚠ Best possible fallback`.
- **Invalid color** returns a tool error: `Invalid color format: x`.

---

## `design_ui_palette`

Builds a light and a dark set of 36 UI tokens from one brand color, following the 60-30-10 rule:

- **60%**: background, surfaces, borders and text
- **30%**: secondary, accent and subtle containers
- **10%**: the primary call to action, its states, and four status colors

Text and "on" colors are run through the contrast solver above before they are returned.

### Parameters

| Parameter      | Type   | Required | Default       | Description                                                                                                            |
| -------------- | ------ | -------- | ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `brand`        | string | Yes      | –             | Brand seed color.                                                                                                      |
| `format`       | string | No       | `"report"`    | `report` (Markdown table + CSS), `css`, `json` or `tokens` (W3C design tokens).                                        |
| `harmony`      | string | No       | `"analogous"` | `analogous`, `complementary`, `split-complementary`, `triadic` or `monochromatic`. Sets the secondary and accent hues. |
| `neutralStyle` | string | No       | `"tinted"`    | `tinted` (brand hue, chroma 3–8), `cool` (hue 235), `warm` (hue 50), or `pure` (chroma 0).                             |

### How the tokens are built

All values below are HCT tones (light / dark).

| Group             | Tokens                                                                         | Rule                                                                                                                                                                                                                   |
| ----------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Surfaces          | `bg`, `surface`, `surfaceElevated`, `surfaceSubtle`                            | Neutral at tones 98.5 / 8, 100 / 12, 99.5 / 16, 95 / 19. Dark surfaces get lighter as they rise.                                                                                                                       |
| Borders           | `border`, `borderStrong`                                                       | `border` (86 / 26) is decorative and **not** contrast-checked. `borderStrong` is solved to 3:1 against `surface`.                                                                                                      |
| Text              | `textPrimary`, `textSecondary`, `textMuted`                                    | Solved against `surface`: AAA (7:1) for primary, AA (4.5:1) for the other two.                                                                                                                                         |
| Primary           | `primary`, `primaryHover`, `primaryActive`, `onPrimary`                        | Light: brand tone clamped to 34–48, chroma clamped to 32–86. Dark: tone 74, chroma 0.82 × brand clamped to 28–68, which avoids neon halation. Hover/active are 8/15 tones darker (light) or 7/13 tones lighter (dark). |
| Subtle containers | `primarySubtle`, `onPrimarySubtle`                                             | Tone 93 / 21, with the text solved to AA.                                                                                                                                                                              |
| Secondary, accent | `secondary`, `onSecondary`, `accent`, `onAccent`                               | Hue offsets from the brand (secondary / accent): analogous −30° / +60°, split-complementary −30° / +150°, complementary +180° / +180°, triadic +120° / +240°, monochromatic 0° / 0°.                                   |
| Focus             | `focusRing`                                                                    | Brand hue, solved to 3:1 against `bg`.                                                                                                                                                                                 |
| Status            | `success`, `warning`, `error`, `info`, each with `on*`, `*Subtle`, `on*Subtle` | Fixed HCT hues 148°, 78°, 24° and 245°. `on*Subtle` is solved to AA against `*Subtle`.                                                                                                                                 |

`on*` inks (`onPrimary`, `onSecondary`, `onAccent` and the status inks) start as white or the near-black ink `#0e1016`, whichever has the larger APCA contrast, and are then solved to AA. `Verified contrast checks` (42 in the example) is the tool's own tally of these checks.

### Example

```json
{ "brand": "#6750a4" }
```

````text
# UI Design System (analogous, tinted neutrals)
Brand: `#6750a4` (medium dark violet) | Verified contrast checks: **42**

| Token | Light | Dark |
|---|---|---|
| `accent` | `#9f4e6c` | `#ee9fb9` |
| `bg` | `#fff9ff` | `#19171c` |
| `border` | `#dbd5df` | `#3f3c44` |
| `borderStrong` | `#89858d` | `#747079` |
| `error` | `#9c423b` | `#ff9b91` |
| `errorSubtle` | `#ffe9e6` | `#472825` |
| `focusRing` | `#7b64b9` | `#c5b0fa` |
| `info` | `#006496` | `#81bced` |
| `infoSubtle` | `#e1efff` | `#223240` |
| `onAccent` | `#ffffff` | `#0e1016` |
| `onError` | `#ffffff` | `#0e1016` |
| `onErrorSubtle` | `#6b2723` | `#ffd3ce` |
| `onInfo` | `#ffffff` | `#0e1016` |
| `onInfoSubtle` | `#004164` | `#c1e0ff` |
| `onPrimary` | `#ffffff` | `#0e1016` |
| `onPrimarySubtle` | `#443273` | `#e4d7ff` |
| `onSecondary` | `#ffffff` | `#0e1016` |
| `onSuccess` | `#ffffff` | `#0e1016` |
| `onSuccessSubtle` | `#0a4819` | `#b8e9b5` |
| `onWarning` | `#ffffff` | `#0e1016` |
| `onWarningSubtle` | `#543800` | `#ffd79b` |
| `primary` | `#6750a4` | `#bfabf3` |
| `primaryActive` | `#432b7e` | `#e1d3ff` |
| `primaryHover` | `#543c8f` | `#d2c0ff` |
| `primarySubtle` | `#f0e7ff` | `#352f45` |
| `secondary` | `#53628a` | `#9fabcd` |
| `success` | `#216c2e` | `#8ac489` |
| `successSubtle` | `#dbf5d6` | `#243423` |
| `surface` | `#ffffff` | `#211f24` |
| `surfaceElevated` | `#fffdff` | `#29272c` |
| `surfaceSubtle` | `#f5eff8` | `#302d34` |
| `textMuted` | `#6f6c72` | `#99949b` |
| `textPrimary` | `#211f23` | `#f2ecf2` |
| `textSecondary` | `#524f54` | `#bfbac0` |
| `warning` | `#7f5600` | `#e4ac4e` |
| `warningSubtle` | `#ffebd2` | `#3e2e13` |

## CSS Custom Properties
```css
:root {
  --color-accent: #9f4e6c;
  --color-bg: #fff9ff;
…
}

[data-theme="dark"] {
  --color-accent: #ee9fb9;
  --color-bg: #19171c;
…
}
```
````

`format: "css"` returns only the CSS. Variable names are the token names in kebab case under `--color-`, for example `--color-on-primary-subtle`. The dark values sit under `[data-theme="dark"]`. `format: "json"` returns `{ brandHex, light, dark, harmony, neutralStyle, verifiedChecks }`. `format: "tokens"` returns `{ "color": { "light": { "<token>": { "$type": "color", "$value": "#…" } }, "dark": { … } } }`.

### What is and isn't guaranteed

- **Checked:** text tokens against `surface`, every `on*` ink against its fill, `borderStrong` against `surface` (3:1), and `focusRing` against `bg` (3:1).
- **Not checked:** `border`, which is decorative by design; text placed on `bg` or `surfaceSubtle` instead of `surface`; and whether the status colors stay distinct under color-vision deficiency. The light statuses of the example (`success` `#216c2e`, `error` `#9c423b`, `warning` `#7f5600`) collide under deuteranopia: ΔE2000 3.8 between success and error, as measured by [`audit_design_md`](/tools/design-md#workflow-generate-export-audit-fix). Pair status colors with icons or labels.
- **Disliked brand colors** are replaced by their tone-70 fix first. `#7a6a1f` becomes brand `#beab59`, and the light `primary` is `#beab59` with dark text.

---

## `audit_ui_colors`

Checks up to 100 foreground/background pairs and up to 64 palette swatches in one call. It returns a table with fixes.

### Parameters

| Parameter  | Type     | Required | Default | Description                                     |
| ---------- | -------- | -------- | ------- | ----------------------------------------------- |
| `pairs`    | object[] | No       | –       | Pairs to audit, at most 100 (fields below).     |
| `swatches` | string[] | No       | –       | Standalone palette colors to check, at most 64. |

Each item in `pairs`:

| Field  | Type   | Required | Default  | Description                                                               |
| ------ | ------ | -------- | -------- | ------------------------------------------------------------------------- |
| `fg`   | string | Yes      | –        | Foreground/text color.                                                    |
| `bg`   | string | Yes      | –        | Background color.                                                         |
| `name` | string | No       | –        | Label for the row. Defaults to `pair-1`, `pair-2`, ….                     |
| `role` | string | No       | `"body"` | `body` (needs 4.5:1), `large` (3:1) or `ui` (3:1, for borders and icons). |

If both lists are empty, the tool returns the message "Provide at least one `pairs` entry or `swatches` color to audit." This is not an error.

### Checks

**Each pair:**

- **WCAG:** pass or fail for the role.
- **APCA:** body text with \|Lc\| < 60 gets a note.
- **Color-vision drop:** the pair is simulated under protanopia, deuteranopia and tritanopia. It is flagged when the simulated WCAG ratio falls below 3.5:1 (body) or 2.5:1 (large and ui).
- **Optical vibration (chromostereopsis):** both colors have OKLCH C > 0.14, their hues are at least 95° apart, and their OKLCH lightness differs by less than 0.35.
- **Fix:** a failing pair gets a same-hue foreground fix for the role's target.

**The swatches:**

- Each swatch gets the `describe_color` warnings: disliked, neon, near-black or near-white.
- Every pair of swatches is checked for a collision, meaning ΔE2000 below 8 under deuteranopia, protanopia or tritanopia.

The status is `✓ Pass`, `⚠ Pass w/ notes` or `✗ Fail`. Invalid colors get their own row and count as issues, but the call does not fail.

### Example

```json
{
  "pairs": [
    { "name": "body", "fg": "#1f2937", "bg": "#ffffff" },
    { "name": "link", "fg": "#8a8aff", "bg": "#ffffff" },
    { "name": "badge", "fg": "#ff0000", "bg": "#0000ff", "role": "large" },
    { "name": "icon", "fg": "#9ca3af", "bg": "#ffffff", "role": "ui" }
  ],
  "swatches": ["#d32f2f", "#388e3c", "#7a6a1f", "#1976d2"]
}
```

```text
# UI Color Audit

## Pair Checks (4)

| Pair | Role | WCAG | APCA Lc | Status | Fix / Notes |
|---|---|---|---|---|---|
| body (`#1f2937` on `#ffffff`) | body | 14.68:1 | 101.5 | ✓ Pass | - |
| link (`#8a8aff` on `#ffffff`) | body | 2.93:1 | 55.6 | ✗ Fail | Use fg `#6969dc` (4.51:1); CVD drop (protanopia 2.8:1, deuteranopia 3.1:1, tritanopia 2.8:1) |
| badge (`#ff0000` on `#0000ff`) | large | 2.15:1 | -20.3 | ✗ Fail | Use fg `#ff6853` (3.01:1); Optical vibration risk; CVD drop (protanopia 1.2:1, deuteranopia 2.1:1, tritanopia 1.5:1) |
| icon (`#9ca3af` on `#ffffff`) | ui | 2.54:1 | 49.8 | ✗ Fail | Use fg `#8e95a1` (3.02:1) |

## Swatch Checks (4)

- `#7a6a1f` (medium dark soft olive): ⚠ Universally disliked "bile zone" dark yellow-green; consider lightening to #beab59.
- CVD collision (deuteranopia): `#d32f2f` ↔ `#388e3c` (ΔE=5.0)
- CVD collision (deuteranopia): `#d32f2f` ↔ `#7a6a1f` (ΔE=6.3)
- CVD collision (deuteranopia): `#388e3c` ↔ `#7a6a1f` (ΔE=6.3)

**Summary**: 7 item(s) flagged above.
```

### Edge cases

- **`⚠ Pass w/ notes` with `-` in the notes column.** The pair passes WCAG, but its APCA readability is low, and that note is not shown in the table. Example: `#000000` on `#757575` is 4.56:1 but APCA Lc 32.0. Use [`check_contrast`](/tools/accessibility) with `algorithm: "both"` for the details.
- **Achromatic foregrounds** have no hue to keep, so the fix may flip lightness: `#000000` on `#2563eb` fails at 4.06:1, and the suggested fix is `#f0f0f0` (4.54:1).
- Swatch collisions use a fixed ΔE2000 threshold of 8. For a configurable threshold and the milder anomaly types, use [`check_palette_accessibility`](/tools/accessibility).

---

## `generate_categorical_palette`

Generates 2–12 colors for categories (chart series, tags, avatars) that stay as far apart as possible for normal vision **and** under protanopia, deuteranopia and tritanopia.

### Parameters

| Parameter    | Type   | Required | Default   | Description                                                                                            |
| ------------ | ------ | -------- | --------- | ------------------------------------------------------------------------------------------------------ |
| `count`      | number | Yes      | –         | Number of categories, 2–12. Use an integer.                                                            |
| `background` | string | No       | `"light"` | `light` or `dark`: the canvas the colors sit on.                                                       |
| `seedColor`  | string | No       | –         | Only the OKLCH hue of this color is used, as the starting hue. Without it, the start is OKLCH hue 220. |

### How it works

1. **Candidates.** Every 10° of OKLCH hue from the seed, at OKLCH chroma 0.145 and two lightness levels: 0.56 and 0.47 on light canvases, 0.74 and 0.82 on dark ones. Disliked colors are replaced by their tone-70 fix.
2. **First color.** The seed hue at chroma 0.15 and the base lightness. This is not the seed color itself.
3. **Greedy max-min.** Each next color is the candidate whose smallest "worst-case ΔE2000" to the colors already chosen is largest. Worst case means the minimum over normal vision and the three simulated deficiencies.

The report gives the smallest pairwise ΔE2000 for normal vision and for the worst deficiency, plus the recommended text ink for each color.

### Examples

```json
{ "count": 6 }
```

```text
# Categorical Palette (6 colors, light background)
- Min pairwise ΔE2000 (normal vision): **19.4**
- Min pairwise ΔE2000 (worst CVD): **10.3**

1. `#00829e` — cyan (best text: `#ffffff`)
2. `#cba73e` — medium light yellow-green (best text: `#0f0f17`)
3. `#9c2e37` — medium dark coral-red (best text: `#ffffff`)
4. `#986b00` — amber (best text: `#ffffff`)
5. `#3c51ab` — medium dark blue (best text: `#ffffff`)
6. `#006a5d` — medium dark soft teal (best text: `#ffffff`)
```

```json
{ "count": 4, "background": "dark", "seedColor": "#6750a4" }
```

```text
# Categorical Palette (4 colors, dark background)
- Min pairwise ΔE2000 (normal vision): **29.8**
- Min pairwise ΔE2000 (worst CVD): **10.7**

1. `#b097ff` — medium light violet (best text: `#0f0f17`)
2. `#f8866c` — medium light peach (best text: `#0f0f17`)
3. `#06e2ce` — light teal (best text: `#0f0f17`)
4. `#f1bb43` — light yellow-green (best text: `#0f0f17`)
```

### Edge cases

- **Separation drops as `count` grows.** With 12 colors on a light canvas, the minimums fall to 8.8 (normal) and 5.3 (worst deficiency). At that size, add labels, patterns or direct annotation instead of relying on color alone.
- `count` above 12 fails validation: `Invalid arguments for tool 'generate_categorical_palette': count: Too big: expected number to be <=12`.

## Related

- [Accessibility Tools](/tools/accessibility): `check_contrast`, `simulate_color_blindness`, `check_palette_accessibility`
- [DESIGN.md Audit](/tools/design-md): the same checks applied to a design-system file
- [Accessibility concepts](/concepts/accessibility)
