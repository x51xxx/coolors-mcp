# Material Design Tools

Tools for generating Material Design 3 themes, tonal palettes, and color harmonization.

## Tools

### `generate_material_theme`

Generate a complete Material Design 3 color theme from a source color.

#### Parameters

| Parameter             | Type    | Required | Default | Description                     |
| --------------------- | ------- | -------- | ------- | ------------------------------- |
| `sourceColor`         | string  | Yes      | -       | Base color for theme generation |
| `includeCustomColors` | boolean | No       | false   | Include custom color palettes   |

#### Returns

Complete theme object with light and dark schemes:

```typescript
{
  "schemes": {
    "light": {
      "primary": "#6750a4",
      "onPrimary": "#ffffff",
      "primaryContainer": "#e9ddff",
      "onPrimaryContainer": "#22005d",
      "secondary": "#625b71",
      "onSecondary": "#ffffff",
      "secondaryContainer": "#e8def8",
      "onSecondaryContainer": "#1e192b",
      "tertiary": "#7e5260",
      "onTertiary": "#ffffff",
      "tertiaryContainer": "#ffd9e3",
      "onTertiaryContainer": "#31101d",
      "error": "#ba1a1a",
      "onError": "#ffffff",
      "errorContainer": "#ffdad6",
      "onErrorContainer": "#410002",
      "background": "#fffbff",
      "onBackground": "#1c1b1e",
      "surface": "#fffbff",
      "onSurface": "#1c1b1e",
      "surfaceVariant": "#e7e0eb",
      "onSurfaceVariant": "#49454e",
      "outline": "#7a757f"
    },
    "dark": {
      // Dark theme colors...
    }
  },
  "sourceColor": "#6750a4"
}
```

#### Color Roles Explained

| Role               | Purpose               | Light Theme | Dark Theme |
| ------------------ | --------------------- | ----------- | ---------- |
| `primary`          | Main brand color      | Tone 40     | Tone 80    |
| `onPrimary`        | Text on primary       | Tone 100    | Tone 20    |
| `primaryContainer` | Primary surface       | Tone 90     | Tone 30    |
| `secondary`        | Supporting color      | Tone 40     | Tone 80    |
| `tertiary`         | Accent color          | Tone 40     | Tone 80    |
| `error`            | Error states          | #ba1a1a     | #ffb4ab    |
| `surface`          | Card/sheet background | Tone 99     | Tone 10    |
| `background`       | App background        | Tone 99     | Tone 10    |
| `outline`          | Borders/dividers      | Tone 50     | Tone 60    |

#### Examples

```typescript
// Generate theme from brand color
{
  "sourceColor": "#6750a4"
}
// Returns complete Material Design 3 theme

// Include custom colors
{
  "sourceColor": "#00695c",
  "includeCustomColors": true
}
// Returns theme with additional custom palettes
```

#### Use Cases

- Creating consistent app themes
- Implementing Material Design 3
- Generating light/dark mode variants
- Ensuring accessible color combinations

---

### `generate_tonal_palette`

Generate Material Design tonal palette from a color.

#### Parameters

| Parameter | Type     | Required | Default                                  | Description             |
| --------- | -------- | -------- | ---------------------------------------- | ----------------------- |
| `color`   | string   | Yes      | -                                        | Base color for palette  |
| `tones`   | number[] | No       | [0,10,20,30,40,50,60,70,80,90,95,99,100] | Tone values to generate |

#### Returns

Object mapping tone values to colors:

```typescript
{
  "0": "#000000",
  "10": "#22005d",
  "20": "#381e72",
  "30": "#4f378a",
  "40": "#6750a4",
  "50": "#8069bf",
  "60": "#9a83db",
  "70": "#b59df7",
  "80": "#cfbcff",
  "90": "#e9ddff",
  "95": "#f6edff",
  "99": "#fffbff",
  "100": "#ffffff"
}
```

#### Tone Values

Material Design 3 standard tones:

- **0**: Pure black
- **10**: Very dark
- **20-40**: Dark tones (primary colors in light theme)
- **50**: Mid-tone
- **60-80**: Light tones (primary colors in dark theme)
- **90-95**: Very light (containers in light theme)
- **99**: Near white (surfaces)
- **100**: Pure white

#### Examples

```typescript
// Standard Material tones
{
  "color": "#6750a4"
}
// Returns 13 standard tones

// Custom tone values
{
  "color": "#00695c",
  "tones": [0, 25, 50, 75, 100]
}
// Returns 5 custom tones

// Extended tones for granular control
{
  "color": "#e91e63",
  "tones": [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 92, 94, 96, 98, 99, 100]
}
// Returns 25 tones
```

#### Use Cases

- Creating component state variations
- Building custom Material palettes
- Generating accessible color ramps
- Ensuring consistent tone progression

---

### `harmonize_colors`

Harmonize multiple colors to work better together.

#### Parameters

| Parameter | Type     | Required | Default     | Description                                 |
| --------- | -------- | -------- | ----------- | ------------------------------------------- |
| `colors`  | string[] | Yes      | -           | Array of colors to harmonize                |
| `method`  | enum     | No       | "harmonize" | Method: "blend", "harmonize", "temperature" |
| `factor`  | number   | No       | 0.5         | Harmonization strength (0-1)                |

#### Returns

Array of harmonized colors in hex format.

#### Harmonization Methods

- **blend**: Mix colors together for consistency
- **harmonize**: Shift hues toward a common direction
- **temperature**: Adjust color temperature uniformly

#### Factor Values

- **0.0**: No change (original colors)
- **0.5**: Moderate harmonization (default)
- **1.0**: Maximum harmonization

#### Examples

```typescript
// Harmonize brand colors
{
  "colors": ["#ff6b6b", "#4ecdc4", "#45b7d1"],
  "method": "harmonize",
  "factor": 0.5
}
// Returns colors shifted toward common hue

// Blend for consistency
{
  "colors": ["#e91e63", "#9c27b0", "#673ab7"],
  "method": "blend",
  "factor": 0.3
}
// Returns slightly blended colors

// Temperature adjustment
{
  "colors": ["#ff5722", "#ff9800", "#ffc107"],
  "method": "temperature",
  "factor": 0.7
}
// Returns temperature-adjusted colors
```

#### Use Cases

- Unifying colors from different sources
- Creating cohesive color schemes
- Fixing clashing color combinations
- Adapting external colors to design system

## Material Design 3 Concepts

### Dynamic Color

Material Design 3 uses dynamic color to create personalized experiences:

1. Extract source color (from image, brand, or user preference)
2. Generate tonal palettes for each color role
3. Apply appropriate tones for light/dark themes
4. Ensure accessibility through tone relationships

### Tonal Relationships

Contrast is guaranteed by tone differences:

- **3:1 contrast**: 40 tone difference
- **4.5:1 contrast**: 50 tone difference
- **7:1 contrast**: 60 tone difference

### Color Roles

Each role serves a specific purpose:

- **Primary**: Main actions and key components
- **Secondary**: Less prominent components
- **Tertiary**: Contrasting accents
- **Error**: Error states and validation
- **Neutral**: Surfaces and backgrounds
- **Neutral Variant**: Medium emphasis elements

## Common Patterns

### Theme Generation Workflow

```typescript
// 1. Start with brand color
const sourceColor = "#6750a4";

// 2. Generate complete theme
const theme = await generateMaterialTheme({ sourceColor });

// 3. Extract specific palettes if needed
const primaryPalette = await generateTonalPalette({
  color: sourceColor,
});

// 4. Harmonize with existing colors
const harmonized = await harmonizeColors({
  colors: [sourceColor, "#00695c", "#e91e63"],
  method: "harmonize",
});
```

### Creating Custom Palettes

```typescript
// Generate primary palette
const primary = await generateTonalPalette({
  color: "#6750a4",
  tones: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100],
});

// Generate secondary with reduced chroma
const secondary = await generateTonalPalette({
  color: "#625b71",
  tones: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100],
});

// Generate tertiary with hue shift
const tertiary = await generateTonalPalette({
  color: "#7e5260",
  tones: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100],
});
```

### Ensuring Accessibility

```typescript
// Light theme combinations
const lightCombos = [
  { bg: theme.light.surface, fg: theme.light.onSurface }, // 15:1
  { bg: theme.light.primary, fg: theme.light.onPrimary }, // 15:1
  { bg: theme.light.primaryContainer, fg: theme.light.onPrimaryContainer }, // 11:1
];

// All combinations meet WCAG AAA standards
```

## Best Practices

1. **Start with meaningful source colors** that represent your brand
2. **Use standard tones** for consistency with Material Design
3. **Test both light and dark themes** for accessibility
4. **Harmonize imported colors** before using in themes
5. **Maintain tone relationships** for guaranteed contrast

## Performance Considerations

- Theme generation: ~10ms for complete theme
- Tonal palette: ~2ms per palette
- Harmonization: ~5ms for 10 colors

## Related Documentation

- [Material Design 3 Concepts](../concepts/material-design-3.md)
- [HCT Color Space](../concepts/hct-color-space.md)
- [Dynamic Theming Example](../examples/dynamic-theming.md)
- [API Reference](../api/README.md#material-design)
