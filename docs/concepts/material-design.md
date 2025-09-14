# Material Design 3 Color System

Material Design 3 introduces a revolutionary approach to color through dynamic color schemes that adapt to user preferences and content while maintaining accessibility and visual harmony.

## Dynamic Color Overview

Dynamic color is the heart of Material Design 3, enabling personalized experiences through:

- **User-generated color**: Extracted from wallpapers or user preferences
- **Content-based color**: Derived from app content like album art or logos
- **Systematic generation**: Creating complete themes from a single source color

## Color Roles

Material Design 3 defines semantic color roles that map to UI elements consistently:

### Primary Colors
- **primary**: Main brand or theme color (tone 40 in light, 80 in dark)
- **onPrimary**: Text/icons on primary color (tone 100 in light, 20 in dark)
- **primaryContainer**: Light container variant (tone 90 in light, 30 in dark)
- **onPrimaryContainer**: Text on primary container (tone 10 in light, 90 in dark)

### Secondary Colors
- **secondary**: Supporting brand color
- **onSecondary**: Text/icons on secondary
- **secondaryContainer**: Light container variant
- **onSecondaryContainer**: Text on secondary container

### Tertiary Colors
- **tertiary**: Accent for special emphasis
- **onTertiary**: Text/icons on tertiary
- **tertiaryContainer**: Light container variant
- **onTertiaryContainer**: Text on tertiary container

### Surface Colors
- **surface**: Main background color (tone 99 in light, 10 in dark)
- **onSurface**: Primary text color (tone 10 in light, 90 in dark)
- **surfaceVariant**: Secondary background (tone 95 in light, 30 in dark)
- **onSurfaceVariant**: Secondary text (tone 30 in light, 80 in dark)

### Additional Roles
- **error**: Error states (hue ~25, chroma 84)
- **outline**: Borders and dividers
- **shadow**: Shadow colors
- **scrim**: Modal overlays
- **inverseSurface**: Inverted surface for emphasis
- **inverseOnSurface**: Text on inverted surface
- **inversePrimary**: Primary color on inverted surface

## Tonal Palettes

Material Design 3 uses 13 standard tones for each color palette:

```
[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
```

### Tone Usage Guidelines

| Tone Range | Light Theme Usage | Dark Theme Usage |
|------------|------------------|------------------|
| 0-10 | On-colors, high emphasis text | Surfaces, containers |
| 20-40 | Primary actions, emphasis | On-colors, text |
| 50 | Neutral midpoint | Neutral midpoint |
| 60-80 | Containers, surfaces | Primary actions |
| 90-100 | Backgrounds, surfaces | On-colors, text |

## Key Colors

From a single source color, Material Design generates five key colors:

1. **Primary**: Directly from source color
2. **Secondary**: Complementary color (hue shift ~60°, chroma × 0.5)
3. **Tertiary**: Triadic color (hue shift ~120°, chroma × 0.7)
4. **Error**: Standardized error color (hue 25, chroma 84)
5. **Neutral**: Grayscale derived from source (chroma 4-8)

## Scheme Variants

Material Design 3 offers multiple scheme variants for different moods:

### Tonal Spot (Default)
- Balanced use of primary color
- Secondary and tertiary are complementary
- Most versatile for general use

### Fidelity
- Preserves source color's exact appearance
- Adjusts tones to maintain chroma
- Best for brand-critical applications

### Vibrant
- Higher chroma across all colors
- More colorful, energetic appearance
- Good for creative, playful apps

### Expressive
- Unexpected color combinations
- Creative hue rotations
- For bold, artistic interfaces

### Neutral
- Minimal color, maximum elegance
- Reduced chroma values
- Professional, understated look

### Monochrome
- Single hue, varying tones
- Ultimate minimalism
- Focus on content over color

## Contrast Levels

Material Design 3 supports three contrast levels:

### Default (0.0)
- WCAG AA compliant
- 4.5:1 for normal text
- 3:1 for large text

### Medium (+0.5)
- Enhanced readability
- ~6:1 for normal text
- Better for outdoor/bright conditions

### High (+1.0)
- WCAG AAA compliant
- 7:1 for normal text
- Maximum accessibility

## Implementation with Coolors MCP

### Generate Material Theme

```javascript
// From a source color
{
  "name": "generate_material_theme",
  "arguments": {
    "sourceColor": "#6366F1"
  }
}
```

### Create Tonal Palette

```javascript
// Generate standard Material tones
{
  "name": "generate_tonal_palette",
  "arguments": {
    "color": "#6366F1",
    "tones": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
  }
}
```

### Generate Theme CSS

```javascript
// Create CSS custom properties
{
  "name": "generate_theme_css",
  "arguments": {
    "sourceColor": "#6366F1",
    "prefix": "md"
  }
}
```

## Color Harmonization

Material Design uses harmonization to ensure colors work together:

### Harmonization Algorithm
1. Analyze hue relationships
2. Adjust hues toward harmony angles (0°, 60°, 120°, 180°, 240°, 300°)
3. Maintain original chroma and tone
4. Blend based on harmonization strength

### Example
```javascript
{
  "name": "harmonize_colors",
  "arguments": {
    "colors": ["#6366F1", "#EC4899", "#10B981"],
    "factor": 0.5
  }
}
```

## Design Tokens

Material Design 3 uses design tokens for consistent application:

### Token Structure
```css
/* Color tokens */
--md-sys-color-primary: #6366F1;
--md-sys-color-on-primary: #FFFFFF;
--md-sys-color-primary-container: #E0E2FF;
--md-sys-color-on-primary-container: #000747;

/* Elevation tokens */
--md-sys-elevation-level0: 0px;
--md-sys-elevation-level1: 1px;
--md-sys-elevation-level2: 3px;

/* Shape tokens */
--md-sys-shape-corner-small: 4px;
--md-sys-shape-corner-medium: 8px;
--md-sys-shape-corner-large: 16px;
```

## Accessibility Considerations

Material Design 3 ensures accessibility through:

1. **Guaranteed Contrast**: Tone relationships ensure WCAG compliance
2. **Color Independence**: Information not conveyed by color alone
3. **Predictable Patterns**: Consistent color role usage
4. **Adjustable Contrast**: Support for user preferences

## Dynamic Color Algorithm

The complete process for generating a Material theme:

1. **Extract source color** from image or user input
2. **Generate key colors** through hue/chroma manipulation
3. **Create tonal palettes** for each key color
4. **Map tones to roles** based on scheme variant
5. **Adjust for contrast** requirements
6. **Apply fidelity corrections** if needed
7. **Output theme** as usable color values

## Best Practices

### Do's
- ✅ Use semantic color roles consistently
- ✅ Test with all three contrast levels
- ✅ Validate color combinations for accessibility
- ✅ Consider both light and dark themes
- ✅ Use harmonization for multiple brand colors

### Don'ts
- ❌ Override tone assignments arbitrarily
- ❌ Use colors outside the tonal palettes
- ❌ Ignore contrast requirements
- ❌ Mix scheme variants in one interface
- ❌ Use extreme chroma values for large surfaces

## Integration Examples

### React/CSS
```css
:root {
  --md-sys-color-primary: rgb(99, 102, 241);
  --md-sys-color-surface: rgb(252, 252, 255);
}

.button-primary {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}
```

### Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'md-primary': 'var(--md-sys-color-primary)',
        'md-surface': 'var(--md-sys-color-surface)',
      }
    }
  }
}
```

## Advanced Features

### Dislike Prevention
Material Design automatically detects and adjusts universally disliked colors (dark yellow-greens that resemble biological waste) by shifting their hue and increasing tone.

### Content-Based Schemes
Generate schemes that adapt to content:
- Album artwork → Music player theme
- Product images → E-commerce theme
- User photos → Gallery theme

### Cross-Platform Consistency
The same source color produces identical themes across:
- Android (Material You)
- Web (Material Web)
- Flutter
- Coolors MCP

## See Also

- [HCT Color System](./hct.md) - Understanding the HCT color space
- [Color Spaces](./color-spaces.md) - Color space comparisons
- [Accessibility](./accessibility.md) - Contrast and accessibility
- [Image Analysis](./image-analysis.md) - Extracting colors from images
- [Material Design Guidelines](https://m3.material.io) - Official documentation