# Color Spaces

Understanding different color spaces is crucial for professional color operations. Each color space has its strengths and optimal use cases.

## RGB (Red, Green, Blue)

The fundamental color model for digital displays.

- **Range**: 0-255 for each channel
- **Use Cases**: Screen display, web colors
- **Format**: `rgb(255, 99, 71)` or `#FF6347`

```javascript
// RGB representation
{
  r: 255,  // Red channel (0-255)
  g: 99,   // Green channel (0-255)
  b: 71    // Blue channel (0-255)
}
```

## HSL (Hue, Saturation, Lightness)

Intuitive color model for human understanding.

- **Hue**: 0-360° (color wheel position)
- **Saturation**: 0-100% (color purity)
- **Lightness**: 0-100% (brightness)
- **Use Cases**: Color picking, theme generation

```javascript
// HSL representation
{
  h: 9,    // Hue in degrees
  s: 100,  // Saturation percentage
  l: 64    // Lightness percentage
}
```

## LAB (CIE L*a*b\*)

Perceptually uniform color space based on human vision.

- **L**: Lightness (0-100)
- **a**: Green-red axis (-128 to 127)
- **b**: Blue-yellow axis (-128 to 127)
- **Use Cases**: Color difference calculations, print

```javascript
// LAB representation
{
  l: 62.2,  // Lightness
  a: 57.8,  // Green-red component
  b: 46.4   // Blue-yellow component
}
```

## HCT (Hue, Chroma, Tone)

Google's perceptually uniform color space, optimized for UI.

- **Hue**: 0-360° (color wheel position)
- **Chroma**: 0-120+ (color intensity)
- **Tone**: 0-100 (perceptual lightness)
- **Use Cases**: Material Design, UI theming

### Why HCT is Superior for UI

1. **Predictable Contrast**: Tone values directly correlate with WCAG contrast ratios
   - 40 tone difference ≈ 3:1 contrast
   - 50 tone difference ≈ 4.5:1 contrast

2. **Perceptual Uniformity**: Equal changes in values produce equal perceptual changes

3. **UI-Optimized**: Designed specifically for interface design, not general color science

```javascript
// HCT representation
{
  h: 25.5,   // Hue in degrees
  c: 48.2,   // Chroma (color intensity)
  t: 67.5    // Tone (perceptual lightness)
}
```

## Color Space Conversions

Coolors MCP handles all conversions through RGB as the central format:

```
HSL ↔ RGB ↔ HEX
     ↓ ↑
    XYZ
     ↓ ↑
    LAB
     ↓ ↑
    HCT
```

### Conversion Examples

```javascript
// Convert hex to multiple formats
const hex = "#6366F1";

// To RGB
("rgb(99, 102, 241)");

// To HSL
("hsl(239, 84%, 67%)");

// To LAB
("lab(47.9, 35.2, -65.7)");

// To HCT
("hct(265.8, 87.2, 47.9)");
```

## Choosing the Right Color Space

### For Color Picking

Use **HSL** - intuitive for users to understand and manipulate.

### For Color Matching

Use **LAB** or **HCT** - perceptually uniform for accurate comparisons.

### For UI Themes

Use **HCT** - designed for interface design with predictable contrast.

### For Web/Digital

Use **RGB/Hex** - native format for browsers and displays.

### For Print

Use **LAB** - device-independent and accurate for print reproduction.

## Perceptual Distance Metrics

Different color spaces affect distance calculations:

### RGB Distance (Euclidean)

Simple but perceptually inaccurate:

```
distance = √((r₂-r₁)² + (g₂-g₁)² + (b₂-b₁)²)
```

### Delta E (LAB-based)

Industry standard for color difference:

- **Delta E 76**: Original formula
- **Delta E 94**: Improved for textiles
- **Delta E 2000**: Most accurate, accounts for human perception

### HCT Distance

Weighted for UI applications:

```
distance = √((h₂-h₁)² + (c₂-c₁)² + 2×(t₂-t₁)²)
```

Tone is weighted 2x because lightness differences are more noticeable in UI.

## Color Space Limitations

### RGB Limitations

- Not perceptually uniform
- Difficult for humans to predict color changes
- Poor for color difference calculations

### HSL Limitations

- Saturation and lightness are not perceptually uniform
- Colors with same L value may appear different brightness
- Not suitable for accessibility calculations

### LAB Limitations

- Can represent impossible colors
- Less intuitive for designers
- Blue region has known inaccuracies

### HCT Advantages

- Specifically designed for UI/UX
- Predictable contrast ratios
- Perceptually uniform
- No impossible colors

## Practical Applications

### Theme Generation

HCT enables predictable theme generation:

```javascript
// Generate accessible color variations
const baseHCT = { h: 265, c: 50, t: 50 };

// Light variant (3:1 contrast)
const light = { ...baseHCT, t: 90 };

// Dark variant (4.5:1 contrast)
const dark = { ...baseHCT, t: 20 };
```

### Color Harmonies

Different spaces excel at different harmonies:

- **HSL**: Best for analogous colors (rotate hue)
- **HCT**: Best for tonal variations (adjust tone)
- **LAB**: Best for perceptual interpolation

### Gradient Generation

Color space affects gradient smoothness:

- **RGB**: Can produce muddy colors in middle
- **HSL**: Can produce unnatural brightness shifts
- **LAB/HCT**: Smooth perceptual transitions

## Best Practices

1. **Store colors in RGB/Hex** for compatibility
2. **Convert to HCT** for manipulation and theming
3. **Use LAB/Delta E** for color matching
4. **Display in HSL** for user interfaces
5. **Calculate contrast** in relative luminance

## See Also

- [HCT Color System](./hct.md) - Deep dive into HCT
- [Material Design](./material-design.md) - Using HCT in practice
- [Accessibility](./accessibility.md) - Color contrast and WCAG
- [Theme Matching](./theme-matching.md) - Algorithm details
