# Color Operations Tools

Tools for fundamental color manipulation, conversion, and analysis.

## Tools

### `convert_color`

Convert colors between different format representations.

#### Parameters

| Parameter | Type   | Required | Default | Description                                      |
| --------- | ------ | -------- | ------- | ------------------------------------------------ |
| `color`   | string | Yes      | -       | Input color (hex, rgb, hsl)                      |
| `to`      | enum   | Yes      | -       | Target format: "hex", "rgb", "hsl", "lab", "hct" |

#### Returns

String containing the color in the requested format.

#### Examples

```typescript
// Hex to RGB
{
  "color": "#6750a4",
  "to": "rgb"
}
// Returns: "rgb(103, 80, 164)"

// RGB to HCT
{
  "color": "rgb(103, 80, 164)",
  "to": "hct"
}
// Returns: "hct(258.1, 47.3, 41.2)"

// HSL to LAB
{
  "color": "hsl(258, 35%, 48%)",
  "to": "lab"
}
// Returns: "lab(39.4, 31.2, -42.8)"
```

#### Use Cases

- Converting design tool colors to CSS formats
- Preparing colors for perceptual calculations
- Migrating between color systems
- Ensuring format compatibility across tools

---

### `color_distance`

Calculate the perceptual difference between two colors using various metrics.

#### Parameters

| Parameter | Type   | Required | Default      | Description                                                                    |
| --------- | ------ | -------- | ------------ | ------------------------------------------------------------------------------ |
| `color1`  | string | Yes      | -            | First color                                                                    |
| `color2`  | string | Yes      | -            | Second color                                                                   |
| `metric`  | enum   | No       | "deltaE2000" | Distance metric: "euclidean", "deltaE76", "deltaE94", "deltaE2000", "weighted" |

#### Returns

Number representing the perceptual distance between colors.

#### Distance Metrics Explained

- **euclidean**: Simple RGB distance, fast but not perceptually accurate
- **deltaE76**: CIE 1976 standard, basic perceptual difference
- **deltaE94**: Improved for graphics arts applications
- **deltaE2000**: Most accurate perceptual metric, recommended for most uses
- **weighted**: Custom weighting for specific use cases

#### Interpreting Results

| Delta E Value | Perception                            |
| ------------- | ------------------------------------- |
| < 1.0         | Not perceptible by human eyes         |
| 1-2           | Perceptible through close observation |
| 2-10          | Perceptible at a glance               |
| 10-50         | Colors are more similar than opposite |
| > 50          | Colors are more opposite than similar |

#### Examples

```typescript
// Compare similar colors
{
  "color1": "#6750a4",
  "color2": "#6751a5",
  "metric": "deltaE2000"
}
// Returns: 0.34 (imperceptible difference)

// Compare different colors
{
  "color1": "#ff0000",
  "color2": "#00ff00",
  "metric": "deltaE2000"
}
// Returns: 86.61 (very different)

// Quick RGB comparison
{
  "color1": "rgb(100, 100, 100)",
  "color2": "rgb(110, 110, 110)",
  "metric": "euclidean"
}
// Returns: 17.32
```

#### Use Cases

- Determining if colors are visually distinct
- Finding similar colors in a palette
- Quality control for color reproduction
- Grouping colors by similarity

---

### `check_contrast`

Check WCAG contrast ratio between foreground and background colors.

#### Parameters

| Parameter    | Type   | Required | Default | Description           |
| ------------ | ------ | -------- | ------- | --------------------- |
| `foreground` | string | Yes      | -       | Text/foreground color |
| `background` | string | Yes      | -       | Background color      |

#### Returns

Object containing contrast ratio and WCAG compliance levels.

```typescript
{
  "ratio": 21.0,
  "aa": {
    "normal": true,
    "large": true
  },
  "aaa": {
    "normal": true,
    "large": true
  }
}
```

#### WCAG Standards

| Level | Normal Text | Large Text |
| ----- | ----------- | ---------- |
| AA    | 4.5:1       | 3:1        |
| AAA   | 7:1         | 4.5:1      |

Large text is defined as:

- 18pt (24px) or larger
- 14pt (18.66px) or larger if bold

#### Examples

```typescript
// High contrast (black on white)
{
  "foreground": "#000000",
  "background": "#ffffff"
}
// Returns:
// Ratio: 21:1
// AA: ✓ Pass (normal & large)
// AAA: ✓ Pass (normal & large)

// Medium contrast
{
  "foreground": "#6750a4",
  "background": "#ffffff"
}
// Returns:
// Ratio: 6.23:1
// AA: ✓ Pass (normal & large)
// AAA: ✗ Fail (normal), ✓ Pass (large)

// Low contrast
{
  "foreground": "#aaaaaa",
  "background": "#ffffff"
}
// Returns:
// Ratio: 2.32:1
// AA: ✗ Fail (normal), ✗ Fail (large)
// AAA: ✗ Fail (normal & large)
```

#### Use Cases

- Ensuring web accessibility compliance
- Validating design system colors
- Finding accessible color combinations
- Automated accessibility testing

---

### `generate_palette`

Generate harmonious color palettes from a base color.

#### Parameters

| Parameter   | Type   | Required | Default         | Description                                                                        |
| ----------- | ------ | -------- | --------------- | ---------------------------------------------------------------------------------- |
| `baseColor` | string | Yes      | -               | Starting color for palette                                                         |
| `type`      | enum   | No       | "monochromatic" | Palette type: "monochromatic", "analogous", "complementary", "triadic", "tetradic" |
| `count`     | number | No       | 5               | Number of colors (3-10)                                                            |

#### Palette Types Explained

- **monochromatic**: Variations of a single hue with different saturation/lightness
- **analogous**: Adjacent colors on the color wheel (harmonious)
- **complementary**: Opposite colors on the wheel (high contrast)
- **triadic**: Three evenly spaced colors (balanced contrast)
- **tetradic**: Four colors in complementary pairs (rich schemes)

#### Returns

Array of color strings in hex format.

#### Examples

```typescript
// Monochromatic palette
{
  "baseColor": "#6750a4",
  "type": "monochromatic",
  "count": 5
}
// Returns: ["#2a2042", "#4a3872", "#6750a4", "#9580c4", "#c4b8e4"]

// Analogous palette
{
  "baseColor": "#3498db",
  "type": "analogous",
  "count": 5
}
// Returns: ["#34d8db", "#34b8db", "#3498db", "#3478db", "#3458db"]

// Complementary palette
{
  "baseColor": "#ff6b6b",
  "type": "complementary",
  "count": 2
}
// Returns: ["#ff6b6b", "#6bffc9"]

// Triadic palette
{
  "baseColor": "#e74c3c",
  "type": "triadic",
  "count": 3
}
// Returns: ["#e74c3c", "#3ce74c", "#4c3ce7"]
```

#### Use Cases

- Creating brand color palettes
- Generating UI color schemes
- Finding harmonious color combinations
- Exploring color variations

## Common Patterns

### Color Input Formats

All color parameters accept:

- **Hex**: `#rgb`, `#rrggbb` (with or without #)
- **RGB**: `rgb(r, g, b)` where values are 0-255
- **HSL**: `hsl(h, s%, l%)` where h is 0-360, s and l are 0-100

### Error Handling

Invalid colors return descriptive errors:

```
"Error: Invalid color format: xyz123"
"Error: Color values out of range"
```

### Performance Considerations

- `convert_color`: O(1) - Direct calculation
- `color_distance`: O(1) - Direct calculation
- `check_contrast`: O(1) - Direct calculation
- `generate_palette`: O(n) - Linear with count

## Integration Examples

### Accessibility Checker

```typescript
async function checkAccessibility(colors) {
  const results = [];
  for (const fg of colors.foregrounds) {
    for (const bg of colors.backgrounds) {
      const contrast = await checkContrast(fg, bg);
      if (contrast.aa.normal) {
        results.push({ fg, bg, ratio: contrast.ratio });
      }
    }
  }
  return results;
}
```

### Palette Generator

```typescript
async function createBrandPalette(brandColor) {
  const monochromatic = await generatePalette({
    baseColor: brandColor,
    type: "monochromatic",
    count: 5,
  });

  const accent = await generatePalette({
    baseColor: brandColor,
    type: "complementary",
    count: 2,
  });

  return {
    primary: monochromatic,
    accent: accent[1],
  };
}
```

### Format Converter

```typescript
async function normalizeColors(colors) {
  const normalized = [];
  for (const color of colors) {
    const hex = await convertColor(color, "hex");
    const rgb = await convertColor(color, "rgb");
    const hsl = await convertColor(color, "hsl");
    normalized.push({ original: color, hex, rgb, hsl });
  }
  return normalized;
}
```

## Best Practices

1. **Use deltaE2000** for most perceptual comparisons
2. **Always check contrast** for text/background combinations
3. **Convert to HCT or LAB** before perceptual operations
4. **Use monochromatic palettes** for consistent UI elements
5. **Validate accessibility** early in design process

## Related Documentation

- [HCT Color Space](../concepts/hct-color-space.md)
- [Distance Metrics](../concepts/distance-metrics.md)
- [Accessibility Compliance](../examples/accessibility-compliance.md)
- [API Reference](../api/README.md#color-operations)
