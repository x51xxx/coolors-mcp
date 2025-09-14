# HCT Color System

HCT (Hue, Chroma, Tone) is Google's perceptually uniform color space, specifically designed for user interface applications. It forms the foundation of Material Design 3's dynamic color system.

## What is HCT?

HCT is a color space that combines the best aspects of LAB (perceptual uniformity) with practical considerations for UI design:

- **Hue** (0-360°): The color's position on the color wheel
- **Chroma** (0-120+): The color's intensity or purity
- **Tone** (0-100): The color's perceptual lightness

## Why HCT?

### Problem with Traditional Color Spaces

Traditional color spaces have significant limitations for UI design:

1. **RGB**: Not perceptually uniform; equal numeric changes don't produce equal visual changes
2. **HSL**: Lightness is not perceptually accurate; colors with same L can appear very different
3. **LAB**: While perceptually uniform, it's not optimized for UI contrast requirements

### HCT's Solutions

HCT addresses these issues with UI-specific optimizations:

1. **Predictable Contrast**: Tone values directly correlate with WCAG contrast ratios
2. **Perceptual Uniformity**: Equal changes produce equal perceptual differences
3. **No Impossible Colors**: All HCT values represent real, displayable colors
4. **Chroma Preservation**: Maintains color intensity across tone changes better than HSL

## Tone and Contrast

The most powerful feature of HCT is the predictable relationship between tone values and contrast ratios:

### Contrast Guarantees

```
Tone Difference | Approximate Contrast Ratio
----------------|---------------------------
      40        |         3:1 (WCAG AA large text)
      50        |         4.5:1 (WCAG AA normal text)
      70        |         7:1 (WCAG AAA)
```

### Example: Accessible Color Pairs

```javascript
// Base color
const primary = { h: 265, c: 50, t: 50 };

// Guaranteed accessible combinations
const onPrimary = { h: 265, c: 50, t: 100 }; // t: 50 → 100 = 50 diff = 4.5:1
const primaryContainer = { h: 265, c: 25, t: 90 }; // Lower chroma, high tone
const onPrimaryContainer = { h: 265, c: 50, t: 10 }; // t: 90 → 10 = 80 diff = 7:1+
```

## Material Design Integration

HCT is the foundation of Material Design 3's color system:

### Tonal Palettes

Material Design uses 13 standard tones:

```
[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
```

Each tone has specific use cases:

- **0-10**: On-colors for light surfaces
- **20-40**: Accent and emphasis colors
- **50**: Medium, often primary color
- **60-80**: Containers and surfaces
- **90-100**: Backgrounds and on-colors for dark surfaces

### Color Roles

HCT enables semantic color roles with guaranteed contrast:

```javascript
// Primary color family
primary: tone(40); // Main brand color
onPrimary: tone(100); // Text on primary
primaryContainer: tone(90); // Light container
onPrimaryContainer: tone(10); // Text on container

// Surface colors
surface: tone(99); // Main background
onSurface: tone(10); // Text on surface
surfaceVariant: tone(95); // Secondary background
onSurfaceVariant: tone(30); // Secondary text
```

## Chroma Behavior

Chroma in HCT represents color intensity, but unlike saturation in HSL, it maintains perceptual consistency:

### Chroma Ranges

- **0-20**: Neutral, grayscale colors
- **20-40**: Muted, subtle colors
- **40-60**: Moderate intensity (recommended for UI)
- **60-80**: Vibrant colors
- **80+**: Very vibrant (use sparingly)

### Chroma and Tone Interaction

Maximum achievable chroma varies by tone:

```
Tone 0-10:   Low max chroma (dark colors can't be very colorful)
Tone 40-60:  Highest max chroma (mid-tones most colorful)
Tone 90-100: Low max chroma (light colors can't be very colorful)
```

## Practical Applications

### 1. Theme Generation

Generate a complete theme from a single color:

```javascript
function generateTheme(sourceColor) {
  const hct = toHct(sourceColor);

  return {
    primary: { ...hct, t: 40 },
    secondary: { h: hct.h + 60, c: hct.c * 0.5, t: 40 },
    tertiary: { h: hct.h + 120, c: hct.c * 0.7, t: 40 },
    error: { h: 25, c: 84, t: 40 },
    neutral: { h: hct.h, c: 4, t: 50 },
    neutralVariant: { h: hct.h, c: 8, t: 50 },
  };
}
```

### 2. Accessible Color Variations

Create accessible color variations:

```javascript
function createAccessiblePair(baseHct, contrastRatio = 4.5) {
  const toneDiff = contrastRatio >= 7 ? 70 : contrastRatio >= 4.5 ? 50 : 40;

  const lighter = { ...baseHct, t: Math.min(100, baseHct.t + toneDiff) };
  const darker = { ...baseHct, t: Math.max(0, baseHct.t - toneDiff) };

  return baseHct.t > 50 ? darker : lighter;
}
```

### 3. Color Harmonization

Harmonize colors to work together:

```javascript
function harmonize(color1Hct, color2Hct) {
  // Adjust hues to be more harmonious
  const hueDiff = Math.abs(color2Hct.h - color1Hct.h);

  if (hueDiff > 180) {
    // Colors are opposite, increase harmony
    const targetHue = color1Hct.h + (hueDiff > 270 ? 60 : -60);
    return { ...color2Hct, h: targetHue };
  }

  return color2Hct;
}
```

## HCT vs Other Color Spaces

### HCT vs LAB

| Aspect                | HCT                     | LAB                       |
| --------------------- | ----------------------- | ------------------------- |
| Perceptual Uniformity | ✅ Optimized for UI     | ✅ General purpose        |
| Contrast Prediction   | ✅ Direct tone mapping  | ❌ Requires calculation   |
| UI Optimization       | ✅ Designed for screens | ❌ Designed for all media |
| Impossible Colors     | ❌ None                 | ✅ Can represent          |

### HCT vs HSL

| Aspect                | HCT               | HSL                     |
| --------------------- | ----------------- | ----------------------- |
| Perceptual Uniformity | ✅ Yes            | ❌ No                   |
| Lightness Accuracy    | ✅ Perceptual     | ❌ Mathematical         |
| Contrast Prediction   | ✅ Built-in       | ❌ Requires calculation |
| Designer Familiarity  | 🔶 Learning curve | ✅ Well known           |

## Advanced Concepts

### CAM16 Foundation

HCT is built on the CAM16 color appearance model, which models how humans perceive color under different viewing conditions.

### Viewing Conditions

HCT assumes standard viewing conditions:

- Average surround
- Adapting luminance of 200 cd/m²
- 20% background luminance
- D65 white point

### Gamut Mapping

HCT automatically maps colors to the sRGB gamut, ensuring all colors are displayable:

```javascript
// HCT handles gamut mapping internally
const vibrantHct = { h: 120, c: 200, t: 50 }; // Very high chroma
const displayable = hctToRgb(vibrantHct); // Automatically in gamut
```

## Best Practices

1. **Use standard tones** for consistency with Material Design
2. **Maintain 50+ tone difference** for text on backgrounds
3. **Keep chroma between 40-60** for most UI elements
4. **Use lower chroma (4-16)** for neutral colors
5. **Test with different tones** to ensure accessibility

## Common Patterns

### Dark/Light Theme Switching

```javascript
// Light theme
const lightPrimary = { h: 265, c: 50, t: 40 };
const lightSurface = { h: 265, c: 0, t: 99 };

// Dark theme (invert tones)
const darkPrimary = { h: 265, c: 50, t: 80 };
const darkSurface = { h: 265, c: 0, t: 10 };
```

### Error States

```javascript
// Standard error colors in HCT
const error = { h: 25, c: 84, t: 40 }; // Red-orange, high chroma
const errorContainer = { h: 25, c: 30, t: 90 }; // Muted, light
const onError = { h: 25, c: 0, t: 100 }; // White
const onErrorContainer = { h: 25, c: 84, t: 10 }; // Dark red
```

## Implementation Details

Coolors MCP implements HCT using Google's Material Color Utilities algorithms:

1. **Color Conversion**: Accurate CAM16 to/from RGB conversion
2. **Gamut Mapping**: Automatic sRGB gamut clipping
3. **Tone Mapping**: Precise tone to luminance conversion
4. **Chroma Maximization**: Finding maximum chroma for any hue/tone

## See Also

- [Color Spaces](./color-spaces.md) - Comparison with other color models
- [Material Design](./material-design.md) - HCT in Material Design 3
- [Accessibility](./accessibility.md) - Using tone for contrast
- [Theme Matching](./theme-matching.md) - HCT-based matching algorithm
