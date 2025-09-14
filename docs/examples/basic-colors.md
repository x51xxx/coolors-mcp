# Basic Color Operations Examples

Learn how to perform essential color operations with Coolors MCP through practical examples.

## Color Conversion

### Simple Format Conversion

Convert colors between different formats:

```javascript
// Hex to RGB
"Convert #6366f1 to RGB"
// Result: rgb(99, 102, 241)

// RGB to HSL
"Convert rgb(99, 102, 241) to HSL"
// Result: hsl(239, 84%, 67%)

// HSL to HCT
"Convert hsl(239, 84%, 67%) to HCT"
// Result: hct(265.8, 87.2, 47.9)

// Any format to LAB
"What is #6366f1 in LAB color space?"
// Result: lab(47.9, 35.2, -65.7)
```

### Batch Conversion

Convert multiple colors at once:

```javascript
"Convert these colors to HSL: #6366f1, #ec4899, #10b981"

// Results:
// #6366f1 → hsl(239, 84%, 67%)
// #ec4899 → hsl(330, 81%, 60%)
// #10b981 → hsl(161, 79%, 40%)
```

### Round-Trip Conversion

Verify conversion accuracy:

```javascript
// Original → HCT → Back to original
const original = "#6366f1";
const hct = "hct(265.8, 87.2, 47.9)";
const backToHex = "#6366f1";  // Perfect round-trip
```

## Color Palettes

### Monochromatic Palette

Generate shades of a single color:

```javascript
"Create a monochromatic palette from #6366f1"

// Result: 5 shades
[
  "#1a1d4d",  // Darkest
  "#3336a3",
  "#6366f1",  // Original
  "#9598ff",
  "#c7c8ff"   // Lightest
]
```

### Complementary Colors

Find opposite colors on the color wheel:

```javascript
"What is the complementary color of #6366f1?"

// Result:
{
  original: "#6366f1",
  complementary: "#f1ee66"  // Yellow opposite of blue
}
```

### Analogous Colors

Get neighboring colors:

```javascript
"Generate analogous colors for #6366f1"

// Result: Colors 30° apart
[
  "#8c66f1",  // Purple-blue
  "#6366f1",  // Original blue
  "#66c6f1"   // Cyan-blue
]
```

### Triadic Color Scheme

Three colors evenly spaced on the color wheel:

```javascript
"Create a triadic color scheme from #6366f1"

// Result: Colors 120° apart
[
  "#6366f1",  // Blue (original)
  "#f16366",  // Red
  "#66f163"   // Green
]
```

### Tetradic (Square) Scheme

Four colors evenly spaced:

```javascript
"Generate a tetradic palette from #6366f1"

// Result: Colors 90° apart
[
  "#6366f1",  // Blue
  "#f166c6",  // Magenta
  "#f1ee66",  // Yellow
  "#66f18c"   // Green
]
```

## Contrast Checking

### Basic Contrast Check

```javascript
"Check contrast between #1f2937 and #ffffff"

// Result:
{
  ratio: 15.74,
  passes: {
    AA: { normal: true, large: true },
    AAA: { normal: true, large: true }
  },
  recommendation: "Excellent contrast for all uses"
}
```

### Text on Background

```javascript
"Is #6366f1 readable on white background?"

// Result:
{
  ratio: 3.03,
  passes: {
    AA: { normal: false, large: true },
    AAA: { normal: false, large: false }
  },
  recommendation: "Use for large text only (24px+)"
}
```

### Finding Accessible Colors

```javascript
"What text color works on #6366f1 background?"

// Suggestions:
[
  { color: "#ffffff", ratio: 4.6 },  // White text
  { color: "#f0f0f0", ratio: 4.2 },  // Light gray
  { color: "#000000", ratio: 4.5 }   // Black text
]
```

## Color Distance

### Perceptual Similarity

```javascript
"How similar are #6366f1 and #5355d1?"

// Result using Delta E 2000:
{
  distance: 5.2,
  interpretation: "Noticeable difference but related",
  metric: "deltaE2000"
}
```

### Finding Similar Colors

```javascript
"Find colors similar to #6366f1 in this palette"

const palette = ["#5355d1", "#7c3aed", "#6366f1", "#3b82f6"];

// Results (ΔE < 10):
[
  { color: "#5355d1", distance: 5.2 },   // Very similar
  { color: "#3b82f6", distance: 8.7 }    // Similar
]
```

### Color Matching Threshold

```javascript
"Are these colors close enough to match? #6366f0 and #6366f1"

// Result:
{
  distance: 0.4,
  match: true,
  confidence: 99.5,
  interpretation: "Imperceptible difference"
}
```

## Gradients

### Two-Color Gradient

```javascript
"Create a gradient from #6366f1 to #ec4899"

// Result: 5 steps
[
  "#6366f1",  // Start
  "#8757d5",
  "#ab49b9",
  "#ce3a9d",
  "#ec4899"   // End
]
```

### Multi-Stop Gradient

```javascript
"Create a gradient: #6366f1 → #ec4899 → #10b981"

// Result: Smooth transition through all colors
[
  "#6366f1",
  "#a154c5",
  "#ec4899",
  "#a9636d",
  "#10b981"
]
```

### Perceptual Gradient

```javascript
"Create a perceptually smooth gradient from blue to yellow"

// Using LAB interpolation:
[
  "#0000ff",  // Blue
  "#4040df",
  "#8080bf",
  "#c0c09f",
  "#ffff00"   // Yellow
]
// Avoids muddy colors in the middle
```

## Practical Color Operations

### Lighten and Darken

```javascript
"Make #6366f1 20% lighter"
// Result: #8c8ff5

"Make #6366f1 30% darker"
// Result: #3a3d94
```

### Saturation Adjustment

```javascript
"Desaturate #6366f1 by 50%"
// Result: #8a8cc4 (more gray)

"Make #6366f1 more vibrant"
// Result: #5050ff (higher chroma)
```

### Mix Colors

```javascript
"Mix #6366f1 and #ec4899"
// Result: #a857c5 (purple)

"Mix #ff0000 and #00ff00 and #0000ff equally"
// Result: #808080 (gray)
```

## Real-World Examples

### Button States

```javascript
// Generate button color variations
const primary = "#6366f1";

const buttonStates = {
  default: primary,
  hover: lighten(primary, 10),    // #797cf3
  active: darken(primary, 10),    // #5053d0
  disabled: desaturate(primary, 60) // #9a9bc7
};
```

### Status Colors

```javascript
// Create accessible status colors
const statusColors = {
  success: {
    bg: "#10b981",
    text: "#ffffff",  // Contrast: 4.5:1 ✓
  },
  warning: {
    bg: "#f59e0b",
    text: "#000000",  // Contrast: 10.7:1 ✓
  },
  error: {
    bg: "#ef4444",
    text: "#ffffff",  // Contrast: 4.5:1 ✓
  },
  info: {
    bg: "#3b82f6",
    text: "#ffffff",  // Contrast: 4.6:1 ✓
  }
};
```

### Brand Color System

```javascript
// Build a complete color system from brand color
const brand = "#6366f1";

const colorSystem = {
  // Primary shades
  primary: {
    50: "#eef2ff",
    100: "#e0e7ff",
    500: brand,
    900: "#312e81"
  },

  // Grays from brand
  gray: generateNeutralPalette(brand),

  // Semantic colors
  semantic: {
    success: harmonize("#10b981", brand),
    warning: harmonize("#f59e0b", brand),
    error: harmonize("#ef4444", brand)
  }
};
```

### Form Field Colors

```javascript
// Accessible form field colors
const input = {
  background: "#ffffff",
  border: "#d1d5db",        // 3:1 contrast ✓
  text: "#1f2937",          // 15.7:1 contrast ✓
  placeholder: "#9ca3af",   // 4.5:1 contrast ✓
  focus: "#6366f1",         // 3:1 contrast ✓
  error: "#ef4444"          // 4.5:1 contrast ✓
};
```

## Color Utilities

### Get Luminance

```javascript
"What is the luminance of #6366f1?"
// Result: 0.166 (scale 0-1)
```

### Get Dominant Channel

```javascript
"Which color channel is strongest in #6366f1?"
// Result: Blue (241 of 255)
```

### Color Temperature

```javascript
"Is #6366f1 a warm or cool color?"
// Result: Cool (blue hue at 239°)

"Is #ff6b6b warm or cool?"
// Result: Warm (red hue at 0°)
```

## Common Patterns

### Theme-Safe Colors

```javascript
// Ensure colors work in both light and dark themes
function getThemeSafeColor(color) {
  const lightContrast = checkContrast(color, "#ffffff");
  const darkContrast = checkContrast(color, "#000000");

  if (lightContrast.ratio >= 4.5 && darkContrast.ratio >= 4.5) {
    return color; // Works on both
  }

  // Adjust if needed
  return adjustForBothThemes(color);
}
```

### Color Validation

```javascript
// Validate color format
function validateColor(input) {
  const formats = [
    /^#[0-9a-f]{6}$/i,        // Hex
    /^rgb\(\d+,\s*\d+,\s*\d+\)$/,  // RGB
    /^hsl\(\d+,\s*\d+%,\s*\d+%\)$/  // HSL
  ];

  return formats.some(regex => regex.test(input));
}
```

### Palette Generation

```javascript
// Generate a complete palette
function generatePalette(baseColor, options = {}) {
  const {
    shades = 5,
    includeComplementary = true,
    includeAnalogous = true
  } = options;

  return {
    base: baseColor,
    shades: generateShades(baseColor, shades),
    complementary: includeComplementary ? getComplement(baseColor) : null,
    analogous: includeAnalogous ? getAnalogous(baseColor) : null
  };
}
```

## Tips and Best Practices

### Color Conversion
- ✅ Use HCT for perceptual operations
- ✅ Use RGB/Hex for final output
- ❌ Don't chain too many conversions

### Palette Generation
- ✅ Start with 5-7 colors maximum
- ✅ Test palettes with color blindness simulators
- ❌ Don't use pure black (#000000) with pure white

### Contrast Checking
- ✅ Always check against actual backgrounds
- ✅ Test at different font sizes
- ❌ Don't rely on color alone for meaning

### Gradients
- ✅ Use LAB/HCT for smooth gradients
- ✅ Limit to 5-10 steps for performance
- ❌ Don't interpolate in RGB (causes muddy colors)

## Next Steps

- Try [Creating Themes](./creating-themes.md) for complete design systems
- Learn [CSS Refactoring](./css-refactoring.md) to modernize stylesheets
- Explore [Image Extraction](./image-extraction.md) for dynamic colors
- Read about [Distance Metrics](../concepts/distance-metrics.md) for color matching