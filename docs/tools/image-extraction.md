# Image Extraction Tools

Tools for extracting colors from images and generating themes based on image content.

## extract_image_colors

Extract dominant colors from an image using Google's Celebi quantization algorithm.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageData` | number[] | ✅ | RGBA pixel array (flat array of values 0-255) |
| `maxColors` | number | ❌ | Maximum colors to extract (default: 5, max: 128) |
| `minPopulation` | number | ❌ | Minimum pixel percentage for color (default: 0.01) |
| `targetChroma` | number | ❌ | Preferred chroma for UI colors (default: 48) |

### Returns

```typescript
{
  colors: Array<{
    hex: string;         // Hex color value
    rgb: [r, g, b];     // RGB values
    hct: {              // HCT values
      hue: number;
      chroma: number;
      tone: number;
    };
    population: number;  // Percentage of image (0-1)
    score: number;      // UI suitability score (0-1)
  }>;
  metadata: {
    totalPixels: number;
    uniqueColors: number;
    processingTime: number;
  }
}
```

### Examples

#### Basic Color Extraction

```javascript
// Extract top 5 colors from image
{
  "name": "extract_image_colors",
  "arguments": {
    "imageData": [/* RGBA pixel array */],
    "maxColors": 5
  }
}

// Response
{
  "colors": [
    {
      "hex": "#6366f1",
      "rgb": [99, 102, 241],
      "hct": { "hue": 265.8, "chroma": 87.2, "tone": 47.9 },
      "population": 0.23,
      "score": 0.89
    },
    {
      "hex": "#ec4899",
      "rgb": [236, 72, 153],
      "population": 0.15,
      "score": 0.76
    }
    // ... more colors
  ],
  "metadata": {
    "totalPixels": 90000,
    "uniqueColors": 1247,
    "processingTime": 145
  }
}
```

#### Extract More Colors

```javascript
// Get detailed color palette
{
  "name": "extract_image_colors",
  "arguments": {
    "imageData": [/* pixels */],
    "maxColors": 12,
    "minPopulation": 0.005  // Include colors with 0.5% coverage
  }
}
```

#### UI-Optimized Extraction

```javascript
// Extract colors suitable for UI
{
  "name": "extract_image_colors",
  "arguments": {
    "imageData": [/* pixels */],
    "maxColors": 5,
    "targetChroma": 48  // Prefer moderate chroma for UI
  }
}
```

### Image Data Preparation

#### From Canvas (Browser)

```javascript
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

// Convert to flat array
const pixels = Array.from(imageData.data);

// Extract colors
const result = await extractColors({
  imageData: pixels
});
```

#### From Image File (Node.js)

```javascript
const sharp = require('sharp');

async function getPixelsFromImage(filepath) {
  const { data, info } = await sharp(filepath)
    .resize(300)  // Resize for performance
    .raw()
    .toBuffer({ resolveWithObject: true });

  return Array.from(data);
}

const pixels = await getPixelsFromImage('photo.jpg');
```

### Use Cases

- Extracting brand colors from logos
- Creating themes from album artwork
- Analyzing color usage in designs
- Generating palettes from photos

## generate_theme_from_image

Generate a complete Material Design 3 theme from an image.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `imageData` | number[] | ✅ | RGBA pixel array |
| `variant` | string | ❌ | Theme variant: tonalSpot, fidelity, vibrant, expressive, neutral, monochrome |
| `contrastLevel` | number | ❌ | Contrast level: 0 (default), 0.5 (medium), 1.0 (high) |
| `sourceColorIndex` | number | ❌ | Which extracted color to use as source (default: 0) |

### Returns

```typescript
{
  sourceColor: string;   // Selected source color
  extractedColors: Array<{
    hex: string;
    score: number;
    selected: boolean;
  }>;
  schemes: {
    light: {
      primary: string;
      onPrimary: string;
      primaryContainer: string;
      onPrimaryContainer: string;
      // ... all Material Design color roles
    };
    dark: {
      // ... dark theme colors
    }
  };
  palettes: {
    primary: object;
    secondary: object;
    tertiary: object;
    neutral: object;
    error: object;
  };
  css: string;  // Generated CSS variables
}
```

### Examples

#### Basic Theme Generation

```javascript
// Generate theme from image
{
  "name": "generate_theme_from_image",
  "arguments": {
    "imageData": [/* RGBA pixels */]
  }
}

// Response includes complete theme
{
  "sourceColor": "#6366f1",
  "schemes": {
    "light": {
      "primary": "#5256c9",
      "onPrimary": "#ffffff",
      "primaryContainer": "#e0e0ff",
      "onPrimaryContainer": "#070764"
      // ... more colors
    },
    "dark": {
      "primary": "#bfc1ff",
      "onPrimary": "#212599",
      "primaryContainer": "#393cb0",
      "onPrimaryContainer": "#e0e0ff"
      // ... more colors
    }
  }
}
```

#### With Specific Variant

```javascript
// Generate vibrant theme
{
  "name": "generate_theme_from_image",
  "arguments": {
    "imageData": [/* pixels */],
    "variant": "vibrant",
    "contrastLevel": 0.5  // Medium contrast
  }
}
```

#### Choose Different Source Color

```javascript
// Use second extracted color as source
{
  "name": "generate_theme_from_image",
  "arguments": {
    "imageData": [/* pixels */],
    "sourceColorIndex": 1  // Use second color
  }
}

// Shows which color was selected
{
  "extractedColors": [
    { "hex": "#6366f1", "score": 0.89, "selected": false },
    { "hex": "#ec4899", "score": 0.76, "selected": true },  // Used
    { "hex": "#10b981", "score": 0.71, "selected": false }
  ],
  "sourceColor": "#ec4899"
}
```

### Theme Variants

| Variant | Description | Best For |
|---------|-------------|----------|
| `tonalSpot` | Default, balanced | General use |
| `fidelity` | Preserves source color | Brand-critical |
| `vibrant` | Higher chroma | Playful, energetic |
| `expressive` | Unexpected combinations | Creative, artistic |
| `neutral` | Minimal color | Professional |
| `monochrome` | Single hue | Minimalist |

### Use Cases

- Dynamic theming from user photos
- Content-aware UI adaptation
- Brand extraction from logos
- Seasonal theme generation

## analyze_color_likability

Check if a color falls in the universally disliked "bile zone" and get a fixed version.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `color` | string | ✅ | Color to analyze (hex, rgb, hsl) |
| `autoFix` | boolean | ❌ | Automatically return fixed version (default: true) |

### Returns

```typescript
{
  original: string;      // Input color
  isDisliked: boolean;   // Falls in dislike zone
  reason?: string;       // Why it's disliked
  fixed?: string;        // Improved version
  adjustments?: {
    hueShift: number;    // Degrees shifted
    toneIncrease: number; // Tone adjustment
  }
}
```

### Examples

#### Check Color Likability

```javascript
// Check if color is disliked
{
  "name": "analyze_color_likability",
  "arguments": {
    "color": "#6b7c3a"  // Dark yellow-green
  }
}

// Response
{
  "original": "#6b7c3a",
  "isDisliked": true,
  "reason": "Falls in 'bile zone' - dark yellow-green associated with biological waste",
  "fixed": "#7c8b4a",  // Shifted and lightened
  "adjustments": {
    "hueShift": 15,
    "toneIncrease": 10
  }
}
```

#### Check Without Auto-Fix

```javascript
{
  "name": "analyze_color_likability",
  "arguments": {
    "color": "#6b7c3a",
    "autoFix": false
  }
}

// Just reports the issue
{
  "original": "#6b7c3a",
  "isDisliked": true,
  "reason": "Falls in 'bile zone'"
}
```

### The Dislike Zone

Colors are universally disliked when they have:
- **Hue**: 50-120° (yellow-green range)
- **Chroma**: 20-50 (moderate saturation)
- **Tone**: 20-50 (dark to medium)

These colors resemble biological waste and are instinctively avoided.

### Use Cases

- Validating color choices
- Improving generated palettes
- Fixing extracted colors
- Ensuring pleasant UI colors

## fix_disliked_colors_batch

Analyze and fix multiple colors, returning only liked versions.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `colors` | string[] | ✅ | Array of colors to check |
| `strategy` | string | ❌ | Fix strategy: shift, lighten, both (default: both) |

### Returns

```typescript
{
  results: Array<{
    original: string;
    isDisliked: boolean;
    fixed?: string;
    kept: boolean;      // Whether original or fixed was kept
  }>;
  summary: {
    total: number;
    disliked: number;
    fixed: number;
    unchanged: number;
  };
  fixedColors: string[]; // Final list of all liked colors
}
```

### Examples

#### Fix Multiple Colors

```javascript
{
  "name": "fix_disliked_colors_batch",
  "arguments": {
    "colors": ["#6b7c3a", "#6366f1", "#5c6b2f", "#ec4899"]
  }
}

// Response
{
  "results": [
    { "original": "#6b7c3a", "isDisliked": true, "fixed": "#7c8b4a", "kept": false },
    { "original": "#6366f1", "isDisliked": false, "kept": true },
    { "original": "#5c6b2f", "isDisliked": true, "fixed": "#6b7a3e", "kept": false },
    { "original": "#ec4899", "isDisliked": false, "kept": true }
  ],
  "summary": {
    "total": 4,
    "disliked": 2,
    "fixed": 2,
    "unchanged": 2
  },
  "fixedColors": ["#7c8b4a", "#6366f1", "#6b7a3e", "#ec4899"]
}
```

#### Different Fix Strategies

```javascript
// Only shift hue, don't lighten
{
  "name": "fix_disliked_colors_batch",
  "arguments": {
    "colors": ["#6b7c3a", "#5c6b2f"],
    "strategy": "shift"  // Only hue adjustment
  }
}

// Only lighten, don't shift
{
  "name": "fix_disliked_colors_batch",
  "arguments": {
    "colors": ["#6b7c3a", "#5c6b2f"],
    "strategy": "lighten"  // Only tone adjustment
  }
}
```

### Use Cases

- Cleaning up extracted color palettes
- Validating theme colors
- Ensuring pleasant color schemes
- Batch color improvement

## Best Practices

### Image Preparation

#### Optimal Size
- Resize images to 200-500px width
- Larger images don't improve accuracy
- Smaller images process faster

```javascript
// Resize before extraction
const resized = await sharp(image)
  .resize(300, null, { fit: 'inside' })
  .toBuffer();
```

#### Image Quality
- Use uncompressed or lightly compressed images
- Avoid heavily filtered images
- Ensure good color representation

### Performance Optimization

#### Caching Results

```javascript
const cache = new Map();

function getCachedColors(imageHash) {
  if (cache.has(imageHash)) {
    return cache.get(imageHash);
  }

  const colors = extractColors(image);
  cache.set(imageHash, colors);
  return colors;
}
```

#### Batch Processing

```javascript
// Process multiple images efficiently
const images = [img1, img2, img3];
const results = await Promise.all(
  images.map(img => extractColors(img))
);
```

### Color Selection

#### For UI Themes
- Prefer colors with chroma 40-60
- Avoid very dark or very light colors
- Check for accessibility

#### For Artistic Palettes
- Include wider chroma range
- Keep accent colors
- Preserve unique hues

## Common Patterns

### Album Art Theming

```javascript
async function themeFromAlbumArt(artworkUrl) {
  // 1. Load and prepare image
  const pixels = await loadImage(artworkUrl);

  // 2. Generate theme
  const theme = await generateThemeFromImage({
    imageData: pixels,
    variant: 'vibrant'  // Music apps often use vibrant themes
  });

  // 3. Apply to UI
  applyTheme(theme.schemes.dark);  // Music apps often use dark themes
}
```

### Logo Color Extraction

```javascript
async function extractBrandColors(logoPath) {
  // 1. Load logo
  const pixels = await loadLogo(logoPath);

  // 2. Extract colors
  const extracted = await extractColors({
    imageData: pixels,
    maxColors: 3,  // Logos typically have few colors
    minPopulation: 0.05  // Higher threshold for logos
  });

  // 3. Fix any disliked colors
  const fixed = await fixDislikedColors(extracted.colors);

  return fixed;
}
```

### Dynamic Background

```javascript
async function adaptiveBackground(imageUrl) {
  // 1. Extract dominant color
  const colors = await extractColors(imageUrl);
  const dominant = colors[0];

  // 2. Create subtle background
  const background = {
    ...dominant.hct,
    chroma: dominant.hct.chroma * 0.3,  // Reduce chroma
    tone: 95  // Very light
  };

  return hctToHex(background);
}
```

## Troubleshooting

### No Colors Extracted

**Problem**: Empty result from extraction
**Solution**:
- Check image data format (must be RGBA)
- Verify pixel array is not empty
- Lower minPopulation threshold

### Poor Color Selection

**Problem**: Extracted colors don't represent image well
**Solution**:
- Increase maxColors
- Adjust targetChroma for different types
- Try different quantization settings

### Disliked Colors in Results

**Problem**: Extracted colors are unpleasant
**Solution**:
- Use `fix_disliked_colors_batch`
- Adjust extraction to avoid bile zone
- Post-process results

### Performance Issues

**Problem**: Slow extraction for large images
**Solution**:
- Resize images before extraction
- Use sampling (process every nth pixel)
- Cache results for repeated images

## See Also

- [Image Analysis Concepts](../concepts/image-analysis.md) - How extraction works
- [Material Design Tools](./material-design.md) - Theme generation
- [Color Operations](./color-operations.md) - Color manipulation
- [Image Extraction Examples](../examples/image-extraction.md) - Practical examples