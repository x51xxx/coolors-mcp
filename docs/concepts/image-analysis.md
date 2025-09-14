# Image Color Analysis

Coolors MCP provides advanced image color extraction using Google's Material Color Utilities algorithms, enabling dynamic theme generation from images.

## Overview

Image color extraction involves:

1. **Quantization** - Reducing colors to a representative set
2. **Scoring** - Evaluating colors for UI suitability
3. **Selection** - Choosing optimal source colors
4. **Theme Generation** - Creating complete color schemes

## The Extraction Process

### 1. Quantization

Quantization is a lossy compression process that selects a limited number of colors that best represent the original image.

#### Celebi Algorithm

Coolors MCP uses the Celebi quantizer, which combines:

- **Wu's algorithm**: Fast color quantization
- **WSMeans**: Weighted spatial color clustering

```javascript
// Extract up to 128 representative colors
const colors = quantize(pixels, 128);
```

#### How It Works

1. **Spatial clustering**: Groups similar colors that appear near each other
2. **Color frequency**: Weights colors by how often they appear
3. **Perceptual grouping**: Merges perceptually similar colors
4. **Output**: Typically 5-128 distinct colors

### 2. Color Scoring

Not all colors are suitable for UI themes. The scoring algorithm evaluates colors based on:

#### Key Metrics

**Chroma Score**
Colors closer to the target chroma of 48 receive higher scores:

```javascript
chromaScore = 1 - Math.abs(chroma - 48) / 48;
```

**Population Score**
More frequent colors score higher:

```javascript
populationScore = pixelCount / totalPixels;
```

**Color Diversity**
Promotes visually distinct colors:

- Higher scores for well-represented hues (30° neighborhood)
- Penalizes colors too similar to already selected ones
- Ensures good distribution across color wheel

#### Filtering Criteria

Colors are filtered out if they:

- Have very low chroma (<15) - too close to grayscale
- Are extremely rare (<0.01% of pixels)
- Fall in the "dislike zone" (dark yellow-greens)
- Are too similar to already selected colors

### 3. Source Color Selection

The system selects multiple source colors for theme options:

```javascript
// Typical selection process
1. Extract and score all colors
2. Select top-scoring distinct colors (usually 3-5)
3. Present as theme options to user
4. Use selected color as source for theme generation
```

## Image Sources

### Wallpapers

User device wallpapers provide personalized color schemes:

- Analyzed on device for privacy
- Updates dynamically when wallpaper changes
- Creates cohesive system-wide theming

### App Content

Content-based colors adapt to current context:

- **Album art** → Music player theme
- **Product images** → E-commerce theme
- **Video thumbnails** → Media player theme
- **Logos** → Brand-consistent theme

### User Photos

Personal photos for custom themes:

- Profile pictures for personal spaces
- Gallery images for creative apps
- Artwork for design applications

## Implementation

### Basic Extraction

```javascript
{
  "name": "extract_image_colors",
  "arguments": {
    "imageData": [/* RGBA pixel array */],
    "maxColors": 5
  }
}

// Returns
{
  "colors": [
    { "hex": "#6366f1", "population": 0.23, "score": 0.89 },
    { "hex": "#ec4899", "population": 0.15, "score": 0.76 },
    { "hex": "#10b981", "population": 0.12, "score": 0.71 }
  ]
}
```

### Theme from Image

```javascript
{
  "name": "generate_theme_from_image",
  "arguments": {
    "imageData": [/* RGBA pixel array */],
    "variant": "tonalSpot"
  }
}

// Returns complete Material Design theme
{
  "source": "#6366f1",
  "schemes": {
    "light": { /* light theme colors */ },
    "dark": { /* dark theme colors */ }
  }
}
```

## Advanced Features

### Dislike Color Detection

The system automatically detects and adjusts universally disliked colors:

#### The "Bile Zone"

Dark yellow-greens (reminiscent of biological waste) are universally disliked:

- **Hue range**: 50-120° (yellow-green)
- **Chroma**: 20-50
- **Tone**: 20-50

#### Automatic Fixing

```javascript
if (isDisliked(color)) {
  // Shift hue away from dislike zone
  color.hue = adjustHue(color.hue);
  // Increase tone for lighter appearance
  color.tone = Math.max(60, color.tone);
}
```

### Multi-Region Analysis

For complex images, analyze different regions:

```javascript
// Analyze specific image regions
const regions = [
  { x: 0, y: 0, width: 100, height: 100 }, // Top-left
  { x: 100, y: 100, width: 200, height: 200 }, // Center
];

regions.forEach((region) => {
  const colors = extractFromRegion(image, region);
  // Process regional colors
});
```

### Temporal Consistency

For video or animated content:

```javascript
// Extract colors from multiple frames
const frames = [0, 30, 60, 90, 120];
const frameColors = frames.map((f) => extractFrame(video, f));

// Find consistent colors across frames
const stableColors = findStableColors(frameColors);
```

## Color Suitability Scoring

### UI Suitability Factors

| Factor        | Weight | Description                          |
| ------------- | ------ | ------------------------------------ |
| Chroma        | 40%    | Preference for moderate chroma (~48) |
| Population    | 30%    | How much of image uses this color    |
| Diversity     | 20%    | Distinctness from other colors       |
| Accessibility | 10%    | Potential for good contrast          |

### Scoring Algorithm

```javascript
function scoreColor(color, population, existingColors) {
  const chromaScore = scoreChroma(color.chroma);
  const popScore = population / totalPopulation;
  const diversityScore = scoreDiversity(color, existingColors);
  const accessScore = scoreAccessibility(color);

  return (
    chromaScore * 0.4 +
    popScore * 0.3 +
    diversityScore * 0.2 +
    accessScore * 0.1
  );
}
```

## Best Practices

### Image Preparation

#### Optimal Images

- **Resolution**: 200-500px wide (resize larger images)
- **Format**: RGB/RGBA
- **Quality**: Avoid heavily compressed images
- **Content**: Clear subject with distinct colors

#### Pre-processing

```javascript
// Resize for performance
const resized = resizeImage(original, 300);

// Enhance contrast if needed
const enhanced = enhanceContrast(resized, 1.2);

// Extract colors
const colors = extractColors(enhanced);
```

### Performance Optimization

#### Sampling Strategies

```javascript
// Fast: Sample every 5th pixel
const fastColors = quantize(pixels, 128, { sampling: 5 });

// Quality: Full pixel analysis
const qualityColors = quantize(pixels, 128, { sampling: 1 });

// Adaptive: Based on image size
const sampling = pixels.length > 100000 ? 5 : 1;
```

#### Caching

```javascript
// Cache extracted colors
const cache = new Map();
const hash = hashImage(imageData);

if (cache.has(hash)) {
  return cache.get(hash);
}

const colors = extractColors(imageData);
cache.set(hash, colors);
```

## Use Cases

### Dynamic Theming

Apps that adapt to content:

- Music players matching album art
- News readers matching article images
- Photo galleries with ambient themes

### Brand Extraction

Deriving brand colors from logos:

```javascript
const logo = loadImage("logo.png");
const brandColors = extractColors(logo, {
  maxColors: 3,
  minChroma: 30, // Ensure vibrant colors
});
```

### Palette Generation

Creating artist palettes from artwork:

```javascript
const artwork = loadImage("painting.jpg");
const palette = extractColors(artwork, {
  maxColors: 12,
  includeNeutrals: true,
});
```

## Integration Examples

### Web Applications

```javascript
// Extract colors from uploaded image
async function themeFromUpload(file) {
  const image = await loadImage(file);
  const canvas = createCanvas(image);
  const pixels = getPixelData(canvas);

  const response = await coolorsMCP.extractColors({
    imageData: pixels,
    maxColors: 5,
  });

  return response.colors[0]; // Use top color
}
```

### React Component

```jsx
function ImageThemeProvider({ imageUrl, children }) {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    extractThemeFromImage(imageUrl).then(setTheme);
  }, [imageUrl]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
```

### Node.js Server

```javascript
const sharp = require("sharp");

async function extractFromBuffer(buffer) {
  // Resize and convert to raw pixels
  const { data, info } = await sharp(buffer)
    .resize(300)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Extract colors
  const colors = await coolorsMCP.extractColors({
    imageData: Array.from(data),
    width: info.width,
    height: info.height,
  });

  return colors;
}
```

## Limitations

### Technical Constraints

- Maximum image size: ~5MB recommended
- Color count: 128 colors maximum per extraction
- Processing time: ~100-500ms for typical images

### Accuracy Considerations

- Compressed images may lose color fidelity
- Very dark/light images provide limited options
- Monochrome images need fallback strategies

## Troubleshooting

### Common Issues

#### No Suitable Colors Found

**Cause**: Image too monochrome or low contrast
**Solution**: Adjust scoring thresholds or provide fallback

#### Inconsistent Results

**Cause**: Image compression or resizing artifacts
**Solution**: Use higher quality source images

#### Performance Problems

**Cause**: Processing large images
**Solution**: Resize before extraction

## See Also

- [Material Design](./material-design.md) - Theme generation from colors
- [Color Spaces](./color-spaces.md) - Understanding color models
- [HCT System](./hct.md) - Perceptual color space
- [Accessibility](./accessibility.md) - Ensuring extracted colors are usable
