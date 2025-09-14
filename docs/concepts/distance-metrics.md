# Distance Metrics

Understanding how to measure the difference between colors is crucial for color matching, palette generation, and theme creation. Different metrics serve different purposes.

## Overview

Color distance metrics quantify how different two colors appear. The challenge is that simple mathematical distance doesn't match human perception - two colors that are numerically similar might look very different, and vice versa.

## Available Metrics

### Euclidean Distance (RGB)

The simplest metric, calculating straight-line distance in RGB space:

```javascript
distance = √((r₂-r₁)² + (g₂-g₁)² + (b₂-b₁)²)
```

**Pros:**

- Fast to compute
- Simple to understand
- Good for rough comparisons

**Cons:**

- Not perceptually uniform
- Poor for subtle color differences
- Doesn't match human vision

**When to use:**

- Quick filtering
- Performance-critical applications
- When accuracy isn't crucial

### Delta E CIE76

The original perceptual color difference formula using LAB color space:

```javascript
ΔE*₇₆ = √((L₂-L₁)² + (a₂-a₁)² + (b₂-b₁)²)
```

**Characteristics:**

- First attempt at perceptual uniformity
- Simple LAB distance calculation
- Threshold: ΔE < 2.3 is barely perceptible

**When to use:**

- Basic perceptual matching
- Legacy systems
- When computation speed matters

### Delta E CIE94

Improved formula with weighting factors for different color attributes:

```javascript
ΔE*₉₄ = √((ΔL/kₗSₗ)² + (ΔC/kᴄSᴄ)² + (ΔH/kₕSₕ)²)
```

**Improvements:**

- Separate weights for lightness, chroma, hue
- Better for textiles and graphics
- More accurate than CIE76

**When to use:**

- Textile industry
- Graphic arts
- Better accuracy than CIE76

### Delta E 2000 (CIEDE2000)

The most accurate standard for color difference, addressing perceptual non-uniformities:

```javascript
// Complex formula with multiple correction factors
ΔE*₀₀ = √((ΔL'/kₗSₗ)² + (ΔC'/kᴄSᴄ)² + (ΔH'/kₕSₕ)² + Rᴛ(ΔC'/kᴄSᴄ)(ΔH'/kₕSₕ))
```

**Features:**

- Rotation term for blue region
- Lightness, chroma, hue corrections
- Most accurate for human perception
- Industry standard

**When to use:**

- Color matching applications
- Quality control
- When accuracy is paramount
- Default for most use cases

### HCT Distance

Weighted distance in Google's HCT color space:

```javascript
distance = √((Δh × wₕ)² + (Δc × wᴄ)² + (Δt × wᴛ)²)
// Typical weights: wₕ=1, wᴄ=1, wᴛ=2
```

**Advantages:**

- Optimized for UI colors
- Tone component predicts contrast
- Better for Material Design

**When to use:**

- UI/UX design
- Material Design systems
- Theme matching
- Accessibility considerations

## Perceptibility Thresholds

Different ΔE values represent different levels of color difference:

| ΔE Value | Perception             | Use Case           |
| -------- | ---------------------- | ------------------ |
| 0-1      | Not perceptible        | Exact matches      |
| 1-2      | Barely perceptible     | Very close matches |
| 2-3.5    | Perceptible by experts | Close matches      |
| 3.5-5    | Noticeable difference  | Acceptable matches |
| 5-10     | Clear difference       | Related colors     |
| >10      | Different colors       | Distinct colors    |

## Metric Comparison

### Performance Comparison

```javascript
// Relative computation time (normalized)
{
  "euclidean": 1,      // Baseline
  "deltaE76": 2,       // 2x slower
  "deltaE94": 3,       // 3x slower
  "deltaE2000": 10,    // 10x slower
  "hct": 4             // 4x slower
}
```

### Accuracy Comparison

```javascript
// Correlation with human perception (0-1)
{
  "euclidean": 0.65,   // Poor
  "deltaE76": 0.75,    // Fair
  "deltaE94": 0.85,    // Good
  "deltaE2000": 0.95,  // Excellent
  "hct": 0.90          // Very good for UI
}
```

## Using Distance Metrics in Coolors MCP

### Basic Color Distance

```javascript
// Using Delta E 2000 (default)
{
  "name": "color_distance",
  "arguments": {
    "color1": "#6366f1",
    "color2": "#5355d1"
  }
}
// Result: 5.2 (noticeable but related)

// Using specific metric
{
  "name": "color_distance",
  "arguments": {
    "color1": "#6366f1",
    "color2": "#5355d1",
    "metric": "euclidean"
  }
}
// Result: 32.5 (less meaningful number)
```

### Weighted HCT Distance

```javascript
// Custom weights for UI matching
{
  "name": "color_distance",
  "arguments": {
    "color1": "#6366f1",
    "color2": "#5355d1",
    "metric": "weighted",
    "weights": {
      "hue": 1,
      "chroma": 1,
      "tone": 2  // Emphasize lightness
    }
  }
}
```

## Choosing the Right Metric

### Decision Tree

```
Is performance critical?
├─ Yes → Euclidean
└─ No → Is it for UI/UX?
    ├─ Yes → HCT Distance
    └─ No → Need maximum accuracy?
        ├─ Yes → Delta E 2000
        └─ No → Delta E 76
```

### Use Case Guidelines

| Use Case             | Recommended Metric | Reason                |
| -------------------- | ------------------ | --------------------- |
| CSS color matching   | Delta E 2000       | Accuracy              |
| Real-time filtering  | Euclidean          | Speed                 |
| Theme generation     | HCT                | UI optimization       |
| Print color matching | Delta E 2000       | Industry standard     |
| Palette creation     | HCT                | Perceptual uniformity |
| Image quantization   | Delta E 76         | Balance               |

## Implementation Examples

### Finding Similar Colors

```javascript
function findSimilarColors(targetColor, palette, threshold = 5) {
  return palette.filter((color) => {
    const distance = colorDistance(targetColor, color, "deltaE2000");
    return distance < threshold;
  });
}

// Usage
const similar = findSimilarColors("#6366f1", myPalette, 10);
// Returns colors within ΔE 10 of target
```

### Color Clustering

```javascript
function clusterColors(colors, maxDistance = 5) {
  const clusters = [];

  colors.forEach((color) => {
    let added = false;

    for (const cluster of clusters) {
      const distance = colorDistance(color, cluster.center, "deltaE2000");
      if (distance < maxDistance) {
        cluster.colors.push(color);
        added = true;
        break;
      }
    }

    if (!added) {
      clusters.push({
        center: color,
        colors: [color],
      });
    }
  });

  return clusters;
}
```

### Perceptual Interpolation

```javascript
function interpolatePerceptual(color1, color2, steps) {
  // Convert to LAB for perceptual interpolation
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);

  const colors = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const lab = {
      l: lab1.l + (lab2.l - lab1.l) * t,
      a: lab1.a + (lab2.a - lab1.a) * t,
      b: lab1.b + (lab2.b - lab1.b) * t,
    };
    colors.push(labToRgb(lab));
  }

  return colors;
}
```

## Advanced Concepts

### Weighted Metrics

Different applications benefit from custom weightings:

```javascript
// UI Design - emphasize tone differences
const uiWeights = { lightness: 2, chroma: 1, hue: 0.5 };

// Brand Colors - emphasize hue accuracy
const brandWeights = { lightness: 1, chroma: 1.5, hue: 2 };

// Accessibility - focus on lightness
const a11yWeights = { lightness: 3, chroma: 0.5, hue: 0.5 };
```

### Context-Aware Distance

Distance perception changes based on viewing conditions:

```javascript
function contextualDistance(color1, color2, context) {
  switch (context) {
    case "small-text":
      // Need larger differences for readability
      return colorDistance(color1, color2) * 1.5;

    case "large-area":
      // Subtle differences more noticeable
      return colorDistance(color1, color2) * 0.8;

    case "dark-mode":
      // Adjust for dark backgrounds
      return adjustedDarkModeDistance(color1, color2);

    default:
      return colorDistance(color1, color2);
  }
}
```

### Multi-Dimensional Distance

Sometimes you need to consider multiple factors:

```javascript
function multiFactorDistance(color1, color2) {
  const perceptual = deltaE2000(color1, color2);
  const contrast = Math.abs(getContrast(color1) - getContrast(color2));
  const semantic = getSemanticDistance(color1, color2);

  return {
    overall: perceptual * 0.6 + contrast * 0.3 + semantic * 0.1,
    components: { perceptual, contrast, semantic },
  };
}
```

## Common Pitfalls

### RGB Distance Misuse

❌ Don't use RGB distance for perceptual matching
✅ Use Delta E or HCT distance instead

### Ignoring Context

❌ Don't use the same threshold for all use cases
✅ Adjust thresholds based on application

### Over-Engineering

❌ Don't always use the most complex metric
✅ Choose based on actual requirements

### Wrong Color Space

❌ Don't interpolate in RGB for gradients
✅ Use LAB or HCT for smooth transitions

## Best Practices

1. **Start with Delta E 2000** - It's the most accurate general-purpose metric
2. **Use HCT for UI** - Better for interface design and accessibility
3. **Cache computations** - Distance calculations can be expensive
4. **Test with real users** - Perception varies between individuals
5. **Consider viewing conditions** - Screen, lighting affect perception
6. **Document your choice** - Explain why you chose a specific metric

## See Also

- [Color Spaces](./color-spaces.md) - Understanding different color models
- [HCT System](./hct.md) - Google's perceptual color space
- [Theme Matching](./theme-matching.md) - Using distance for matching
- [Accessibility](./accessibility.md) - Contrast and perception
