# Color Spaces

Every tool parses its color inputs into an 8-bit sRGB color first and computes every other space from that value. This page lists what the tools accept, what they can output, and how the spaces relate.

## Accepted input

Every color parameter of every tool accepts the same syntaxes (case-insensitive):

| Syntax                   | Example                                      | Parsed as                            |
| ------------------------ | -------------------------------------------- | ------------------------------------ |
| Hex `#rgb` / `#rrggbb`   | `#abc`, `#6750a4`                            | `#aabbcc`, `#6750a4`                 |
| Hex with alpha           | `#abcd`, `#6750a480`                         | `#aabbcc`, `#6750a4` (alpha ignored) |
| Bare 6/8-digit hex       | `6750a4`                                     | `#6750a4`                            |
| CSS named colors         | `rebeccapurple`, `RebeccaPurple`             | `#663399`                            |
| `rgb()` / `rgba()`       | `rgb(103 80 164)`, `rgba(103, 80, 164, 0.5)` | `#6750a4`                            |
| `rgb()` with percentages | `rgb(40%, 31%, 64%)`                         | `#664fa3`                            |
| Out-of-range channels    | `rgb(300, -5, 128)`                          | `#ff0080` (clamped like CSS)         |
| `hsl()` / `hsla()`       | `hsl(256, 34%, 48%)`, `hsl(616 34% 48%)`     | `#6751a4` (hue wraps)                |
| `oklch()`                | `oklch(49.6% 0.1305 293.7)`                  | `#6750a4`                            |
| `oklab()`                | `oklab(49.6% 0.0525 -0.1194)`                | `#6750a4`                            |
| `hct(h, c, t)`           | `hct(299, 47.9, 40.1)`                       | `#6750a4`                            |

Not supported: `hwb()`, `lab()`, `lch()`, `color()`, `color-mix()`, `transparent`, and invalid hex such as `#ggg`. They return an error result (`isError: true`) with a message such as:

```text
Invalid color format: lab(40 30 -45)
```

::: tip Alpha is dropped
Alpha in `#rrggbbaa`, `rgba()`, `hsla()` and `/ alpha` is parsed but ignored: tools work with the opaque color. The theme-matching tools are the exception: they skip translucent values instead (see [Theme Matching](/concepts/theme-matching)).
:::

## Output formats

`convert_color` writes these formats (`to` parameter). Real output for `#6750a4`, `#0000ff` and `#808080`:

| `to`    | `#6750a4`                     | `#0000ff`                      | `#808080`                    |
| ------- | ----------------------------- | ------------------------------ | ---------------------------- |
| `hex`   | `#6750a4`                     | `#0000ff`                      | `#808080`                    |
| `rgb`   | `rgb(103, 80, 164)`           | `rgb(0, 0, 255)`               | `rgb(128, 128, 128)`         |
| `hsl`   | `hsl(256, 34%, 48%)`          | `hsl(240, 100%, 50%)`          | `hsl(0, 0%, 50%)`            |
| `lab`   | `lab(40.08, 29.43, -42.24)`   | `lab(32.30, 79.19, -107.86)`   | `lab(53.59, -0.00, 0.00)`    |
| `hct`   | `hct(299.0, 47.9, 40.1)`      | `hct(282.8, 87.2, 32.3)`       | `hct(209.5, 1.9, 53.6)`      |
| `oklab` | `oklab(49.6% 0.0525 -0.1194)` | `oklab(45.2% -0.0325 -0.3115)` | `oklab(60.0% 0.0000 0.0000)` |
| `oklch` | `oklch(49.6% 0.1305 293.7)`   | `oklch(45.2% 0.3132 264.1)`    | `oklch(60.0% 0.0000 0.0)`    |

The `oklch`, `oklab` and `hct` outputs are accepted as input, and `#6750a4` round-trips through all three. The round trip is not always exact, though: the printed values are rounded, and a value near the sRGB gamut edge can land just outside it and get gamut-mapped. In a sweep of 5,832 colors, 518 (`hct`), 480 (`oklch`) and 340 (`oklab`) came back as a different hex. Most differ by 1 in one channel; a few (8, 13 and 5 respectively) by more than 10:

```text
#0000a5  →  oklch(32.6% 0.2261 264.1)  →  #001897
#00001e  →  hct(282.9, 24.6, 0.8)      →  #00001d
```

Two outputs are lossy by design:

- **`lab` is output-only.** `lab(...)` is not accepted as input.
- **`hsl` is rounded to whole numbers**, so `hsl(256, 34%, 48%)` parses back to `#6751a4`, not `#6750a4`.

## The spaces

| Space             | What it is                                                                                                   | Where the tools use it                                                                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **sRGB**          | 8-bit red/green/blue, the common format every input is parsed into                                           | `convert_color` (`hex`, `rgb`); `color_distance` `euclidean` and `weighted`; `generate_gradient` `interpolation: "rgb"`                                                             |
| **HSL**           | Cylindrical sRGB; lightness is not perceptual                                                                | `convert_color`; `adjust_color` `space: "hsl"`; `generate_palette` `space: "hsl"`; `generate_palette_with_locks`; `generate_gradient`                                               |
| **CIE L\*a\*b\*** | D65-relative Lab computed from sRGB via XYZ                                                                  | `convert_color` (`lab`, output only); all ΔE metrics; `generate_gradient` `"lab"` (the default) and `"lch"`; `generate_palette_with_locks`                                          |
| **OKLab / OKLCH** | Björn Ottosson's perceptual space; out-of-gamut OKLCH is brought into sRGB by reducing chroma (L and H kept) | `convert_color`; `adjust_color` (default `space`); `generate_palette` `space: "oklch"`; `generate_palette_with_locks` (default `colorSpace`); `generate_gradient`; `describe_color` |
| **HCT**           | Google's CAM16 hue & chroma + L\* tone ([details](/concepts/hct))                                            | `convert_color`; Material tools; `fix_contrast`; theme matching; `generate_palette` (default `space`); `adjust_color`; `generate_gradient`                                          |
| **RYB**           | Painter's red-yellow-blue hue wheel (a hue remapping, not a full color space)                                | `generate_palette` `space: "ryb"` only                                                                                                                                              |

`lch` (the polar form of CIE Lab) exists only as a `generate_gradient` interpolation option; there is no `lch` input or output.

### Lab is D65, not CSS `lab()`

The `lab` output uses the D65 white point (X 95.047, Y 100, Z 108.883). CSS `lab()` is defined relative to D50, so values from browser devtools will not match `convert_color` output.

### OKLCH gamut mapping

Out-of-gamut OKLCH input keeps lightness and hue and loses chroma:

```text
oklch(0.7 0.4 150)  →  #00be58  →  oklch(70.1% 0.1928 150.0)
```

HCT behaves the same way: tone is kept and chroma is reduced (see [HCT](/concepts/hct#out-of-gamut-chroma-is-reduced-never-tone)).

## Lightness is not the same in every space

The same two colors in three spaces:

| Color     | HSL lightness | OKLCH L | HCT tone (= Lab L\*) |
| --------- | ------------- | ------- | -------------------- |
| `#ffff00` | 50%           | 96.8%   | 97.1                 |
| `#0000ff` | 50%           | 45.2%   | 32.3                 |

HSL gives yellow and blue the same lightness; OKLCH L and L\* (HCT tone) both show a large difference. Of these, only HCT tone / Lab L\* is a direct function of WCAG luminance, which is why the contrast tools search in tone (see [Accessibility](/concepts/accessibility)).

## See Also

- [HCT Color System](/concepts/hct) — hue, chroma, tone in depth
- [Distance Metrics](/concepts/distance-metrics) — RGB and Lab-based differences
- [Color Operations tools](/tools/color-operations) — `convert_color`, `adjust_color`, `generate_gradient`
