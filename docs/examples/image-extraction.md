# Image Extraction Examples

Learn how to extract colors from images and generate dynamic themes using Coolors MCP's advanced quantization and scoring algorithms.

## Quick Start

### Extract Colors from Image

```javascript
// Extract dominant colors
"Extract the main colors from this image"

// Process:
// 1. Quantizes image using Celebi algorithm (Wu + WSMeans)
// 2. Scores colors for UI suitability (target chroma ~48)
// 3. Filters out universally disliked colors
// 4. Returns ranked color palette
```

### Generate Theme from Image

```javascript
// Create Material Design theme from image
"Generate a theme from this album artwork"

// Result:
// - Extracts dominant colors
// - Selects best color for theme generation
// - Creates complete light/dark schemes
// - Provides CSS variables and palettes
```

## Working with Image Data

### Browser Canvas Example

```javascript
// Get image data from canvas
const canvas = document.getElementById('imageCanvas');
const ctx = canvas.getContext('2d');
const img = new Image();

img.onload = function() {
  // Draw image to canvas
  ctx.drawImage(img, 0, 0);

  // Get pixel data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = Array.from(imageData.data);

  // Extract colors
  const colors = await extractImageColors({
    imageData: pixels,
    maxColors: 5
  });

  console.log('Dominant colors:', colors);
};

img.src = 'path/to/image.jpg';
```

### Node.js with Sharp

```javascript
const sharp = require('sharp');

async function extractColorsFromFile(imagePath) {
  // Load and prepare image
  const { data, info } = await sharp(imagePath)
    .resize(300, 300, { fit: 'inside' })  // Resize for performance
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Convert to RGBA array
  const pixels = Array.from(data);

  // Extract colors
  const result = await extractImageColors({
    imageData: pixels,
    maxColors: 8,
    minPopulation: 0.01  // Include colors with 1%+ coverage
  });

  return result;
}

// Usage
const colors = await extractColorsFromFile('logo.png');
console.log(`Found ${colors.colors.length} dominant colors`);
```

### File Upload Example

```html
<!-- HTML -->
<input type="file" id="imageUpload" accept="image/*">
<div id="colorPalette"></div>

<script>
document.getElementById('imageUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Read file as image
  const img = new Image();
  const reader = new FileReader();

  reader.onload = async function(event) {
    img.src = event.target.result;

    img.onload = async function() {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // Resize for performance
      const maxSize = 400;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      // Draw and extract
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Extract colors
      const colors = await extractImageColors({
        imageData: Array.from(imageData.data),
        maxColors: 6
      });

      // Display palette
      displayPalette(colors.colors);
    };
  };

  reader.readAsDataURL(file);
});

function displayPalette(colors) {
  const palette = document.getElementById('colorPalette');
  palette.innerHTML = colors.map(color => `
    <div style="
      background: ${color.hex};
      width: 100px;
      height: 100px;
      display: inline-block;
      margin: 5px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    ">
      <span style="
        background: white;
        padding: 2px 4px;
        font-size: 12px;
      ">${color.hex}</span>
    </div>
  `).join('');
}
</script>
```

## Real-World Examples

### Album Art Dynamic Theming

```javascript
// Music player that adapts to album artwork
class AlbumThemeGenerator {
  async generateFromArtwork(artworkUrl) {
    // Load artwork
    const pixels = await this.loadImage(artworkUrl);

    // Extract colors with UI optimization
    const extraction = await extractImageColors({
      imageData: pixels,
      maxColors: 5,
      targetChroma: 48  // Optimal for UI
    });

    // Generate Material theme
    const theme = await generateThemeFromImage({
      imageData: pixels,
      variant: 'expressive',  // Creative for music
      contrastLevel: 0
    });

    // Create player theme
    return {
      // Background gradient from extracted colors
      backgroundGradient: `linear-gradient(135deg,
        ${extraction.colors[0].hex} 0%,
        ${extraction.colors[1].hex} 100%)`,

      // UI elements from Material theme
      playerBackground: theme.schemes.dark.surface,
      controlsColor: theme.schemes.dark.primary,
      progressBar: theme.schemes.dark.primary,
      textPrimary: theme.schemes.dark.onSurface,
      textSecondary: theme.schemes.dark.onSurfaceVariant,

      // Visualizer colors
      visualizerColors: extraction.colors.map(c => c.hex)
    };
  }
}

// Usage
const player = new AlbumThemeGenerator();
const theme = await player.generateFromArtwork('album.jpg');

// Apply theme
document.querySelector('.player').style.background = theme.backgroundGradient;
document.querySelector('.controls').style.color = theme.controlsColor;
```

### Logo Brand Color Extraction

```javascript
// Extract brand colors from company logo
async function extractBrandColors(logoPath) {
  const pixels = await loadLogo(logoPath);

  // Extract with focus on distinct colors
  const result = await extractImageColors({
    imageData: pixels,
    maxColors: 3,  // Most logos have 1-3 colors
    minPopulation: 0.05  // 5% minimum for significance
  });

  // Check for disliked colors and fix
  const fixedColors = await fixDislikedColorsBatch({
    colors: result.colors.map(c => c.hex)
  });

  // Build brand palette
  const brandPalette = {
    primary: fixedColors.fixedColors[0],
    secondary: fixedColors.fixedColors[1] || null,
    accent: fixedColors.fixedColors[2] || null
  };

  // Generate full theme from primary
  const fullTheme = await generateMaterialTheme({
    sourceColor: brandPalette.primary,
    customColors: brandPalette.secondary ? [
      { name: 'brand', color: brandPalette.secondary }
    ] : []
  });

  return {
    extractedColors: result.colors,
    brandPalette,
    fullTheme,
    cssVariables: generateBrandCSS(brandPalette)
  };
}

function generateBrandCSS(palette) {
  return `
    :root {
      --brand-primary: ${palette.primary};
      --brand-secondary: ${palette.secondary || palette.primary};
      --brand-accent: ${palette.accent || palette.primary};

      /* Generate shades */
      ${generateShades('brand-primary', palette.primary)}
    }
  `;
}
```

### Product Photo Color Analysis

```javascript
// E-commerce product color detection
class ProductColorAnalyzer {
  async analyzeProduct(imageUrl) {
    const pixels = await this.loadProductImage(imageUrl);

    // Extract more colors for products
    const extracted = await extractImageColors({
      imageData: pixels,
      maxColors: 10,
      minPopulation: 0.02  // 2% threshold
    });

    // Categorize colors
    const categorized = this.categorizeColors(extracted.colors);

    // Generate variants
    const variants = await this.generateProductVariants(categorized);

    return {
      mainColor: categorized.primary,
      accentColors: categorized.accents,
      availableVariants: variants,
      colorDescription: this.generateDescription(categorized),
      searchTags: this.generateSearchTags(categorized)
    };
  }

  categorizeColors(colors) {
    // Sort by population
    const sorted = colors.sort((a, b) => b.population - a.population);

    return {
      primary: sorted[0],  // Most dominant
      accents: sorted.slice(1, 4),  // Next 3 colors
      details: sorted.slice(4)  // Remaining colors
    };
  }

  generateProductVariants(categorized) {
    // Find similar products in different colors
    const hue = categorized.primary.hct.hue;

    return [
      { name: 'Original', color: categorized.primary.hex },
      { name: 'Darker', color: adjustTone(categorized.primary, -20) },
      { name: 'Lighter', color: adjustTone(categorized.primary, +20) },
      { name: 'Vibrant', color: adjustChroma(categorized.primary, +30) }
    ];
  }

  generateDescription(categorized) {
    const primary = categorized.primary;
    const hue = primary.hct.hue;
    const chroma = primary.hct.chroma;
    const tone = primary.hct.tone;

    // Generate human-readable description
    let description = '';

    // Hue description
    if (hue >= 0 && hue < 20) description += 'Red';
    else if (hue >= 20 && hue < 40) description += 'Orange';
    else if (hue >= 40 && hue < 60) description += 'Yellow';
    // ... etc

    // Saturation
    if (chroma < 20) description += ', muted';
    else if (chroma > 60) description += ', vibrant';

    // Lightness
    if (tone < 30) description += ', dark';
    else if (tone > 70) description += ', light';

    return description;
  }
}
```

### Website Screenshot Theming

```javascript
// Extract theme from website screenshot
async function extractWebsiteTheme(screenshotUrl) {
  const pixels = await loadScreenshot(screenshotUrl);

  // Extract with UI-appropriate settings
  const colors = await extractImageColors({
    imageData: pixels,
    maxColors: 8,
    targetChroma: 40  // Lower chroma for web UI
  });

  // Identify UI elements
  const identified = identifyUIColors(colors.colors);

  // Generate compatible theme
  const theme = {
    // Primary brand color (most vibrant)
    primary: identified.brand || colors.colors[0].hex,

    // Background (lightest color)
    background: identified.background || '#ffffff',

    // Surface (cards, modals)
    surface: identified.surface || '#ffffff',

    // Text colors
    textPrimary: identified.textPrimary || '#1f2937',
    textSecondary: identified.textSecondary || '#6b7280',

    // Borders and dividers
    border: identified.border || '#e5e7eb',

    // Interactive elements
    link: identified.link || colors.colors[0].hex,
    button: identified.button || colors.colors[0].hex
  };

  return {
    extractedColors: colors,
    identifiedTheme: theme,
    css: generateThemeCSS(theme)
  };
}

function identifyUIColors(colors) {
  const identified = {};

  colors.forEach(color => {
    const { hue, chroma, tone } = color.hct;

    // Very light colors are likely backgrounds
    if (tone > 95) {
      identified.background = color.hex;
    }
    // Light grays are surfaces
    else if (tone > 90 && chroma < 10) {
      identified.surface = color.hex;
    }
    // Dark colors are text
    else if (tone < 30) {
      identified.textPrimary = color.hex;
    }
    // Medium grays are secondary text or borders
    else if (tone > 40 && tone < 70 && chroma < 10) {
      if (!identified.textSecondary) {
        identified.textSecondary = color.hex;
      } else {
        identified.border = color.hex;
      }
    }
    // Vibrant colors are brand/interactive
    else if (chroma > 40) {
      identified.brand = color.hex;
    }
  });

  return identified;
}
```

## Advanced Extraction Techniques

### Focusing on Specific Regions

```javascript
// Extract colors from specific image region
function extractFromRegion(imageData, region) {
  const { x, y, width, height } = region;
  const fullWidth = Math.sqrt(imageData.length / 4);

  // Extract pixels from region
  const regionPixels = [];
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      const idx = (row * fullWidth + col) * 4;
      regionPixels.push(
        imageData[idx],     // R
        imageData[idx + 1], // G
        imageData[idx + 2], // B
        imageData[idx + 3]  // A
      );
    }
  }

  // Extract colors from region
  return extractImageColors({
    imageData: regionPixels,
    maxColors: 5
  });
}

// Usage: Extract logo colors from header
const headerRegion = { x: 0, y: 0, width: 200, height: 100 };
const logoColors = await extractFromRegion(pixels, headerRegion);
```

### Excluding Background Colors

```javascript
// Remove background color from extraction
async function extractForegroundColors(imageData, backgroundColor) {
  // Extract all colors
  const allColors = await extractImageColors({
    imageData,
    maxColors: 10
  });

  // Filter out colors similar to background
  const foregroundColors = allColors.colors.filter(color => {
    const distance = colorDistance(color.hex, backgroundColor);
    return distance > 10;  // Significant difference
  });

  return foregroundColors;
}

// Usage: Extract product colors without white background
const productColors = await extractForegroundColors(pixels, '#ffffff');
```

### Weighted Extraction

```javascript
// Weight center pixels more heavily
function createWeightedPixelArray(imageData, width, height) {
  const weighted = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Calculate weight based on distance from center
      const dist = Math.sqrt(
        Math.pow(x - centerX, 2) +
        Math.pow(y - centerY, 2)
      );
      const weight = 1 - (dist / maxDist) * 0.5;  // 50-100% weight

      // Add pixel multiple times based on weight
      const copies = Math.ceil(weight * 3);
      for (let i = 0; i < copies; i++) {
        weighted.push(
          imageData[idx],
          imageData[idx + 1],
          imageData[idx + 2],
          imageData[idx + 3]
        );
      }
    }
  }

  return weighted;
}

// Usage: Focus on center of image
const weighted = createWeightedPixelArray(pixels, 300, 300);
const centralColors = await extractImageColors({
  imageData: weighted,
  maxColors: 5
});
```

## Dislike Zone Handling

### Automatic Correction

```javascript
// Fix universally disliked colors
async function extractLikableColors(imageData) {
  // Extract colors
  const extracted = await extractImageColors({
    imageData,
    maxColors: 8
  });

  // Check and fix disliked colors
  const colorHexes = extracted.colors.map(c => c.hex);
  const fixed = await fixDislikedColorsBatch({
    colors: colorHexes,
    strategy: 'both'  // Shift hue and adjust tone
  });

  // Map back to full color objects
  const likableColors = extracted.colors.map((color, i) => {
    if (fixed.results[i].isDisliked) {
      return {
        ...color,
        hex: fixed.results[i].fixed,
        wasFixed: true,
        originalHex: color.hex
      };
    }
    return color;
  });

  return {
    colors: likableColors,
    fixedCount: fixed.summary.fixed,
    originalColors: extracted.colors
  };
}
```

### Bile Zone Detection

```javascript
// Identify problematic colors in palette
function detectBileZoneColors(colors) {
  const problematic = [];

  colors.forEach(color => {
    const { hue, chroma, tone } = color.hct;

    // Bile zone: dark yellow-greens
    if (hue >= 50 && hue <= 120 &&  // Yellow-green range
        chroma >= 20 && chroma <= 50 &&  // Moderate saturation
        tone >= 20 && tone <= 50) {  // Dark to medium
      problematic.push({
        color: color.hex,
        reason: 'Falls in universally disliked "bile zone"',
        suggestion: adjustToLikable(color)
      });
    }
  });

  return problematic;
}

function adjustToLikable(color) {
  // Shift hue away from problematic range
  let newHue = color.hct.hue;
  if (newHue >= 50 && newHue <= 120) {
    newHue = newHue < 85 ? 40 : 130;  // Shift to yellow or green
  }

  // Increase tone for lighter appearance
  const newTone = Math.min(color.hct.tone + 20, 80);

  return hctToHex({ hue: newHue, chroma: color.hct.chroma, tone: newTone });
}
```

## Performance Optimization

### Image Preprocessing

```javascript
// Optimize image before extraction
async function preprocessImage(imageUrl) {
  const img = await loadImage(imageUrl);

  // Resize for performance
  const maxDimension = 400;
  const scale = Math.min(
    maxDimension / img.width,
    maxDimension / img.height,
    1
  );

  // Apply slight blur to reduce noise
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;

  // Enable image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw scaled image
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Optional: Apply slight blur
  ctx.filter = 'blur(0.5px)';
  ctx.drawImage(canvas, 0, 0);

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}
```

### Caching Extracted Colors

```javascript
// Cache extraction results
class ColorExtractionCache {
  constructor() {
    this.cache = new Map();
  }

  async extractColors(imageUrl, options = {}) {
    // Generate cache key
    const key = this.generateKey(imageUrl, options);

    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Extract colors
    const pixels = await loadImage(imageUrl);
    const result = await extractImageColors({
      imageData: pixels,
      ...options
    });

    // Cache result
    this.cache.set(key, result);

    // Limit cache size
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    return result;
  }

  generateKey(url, options) {
    return `${url}_${JSON.stringify(options)}`;
  }
}
```

### Batch Processing

```javascript
// Process multiple images efficiently
async function batchExtractColors(imageUrls, options = {}) {
  const batchSize = 5;  // Process 5 at a time
  const results = [];

  for (let i = 0; i < imageUrls.length; i += batchSize) {
    const batch = imageUrls.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async url => {
        try {
          const pixels = await loadImage(url);
          return await extractImageColors({
            imageData: pixels,
            ...options
          });
        } catch (error) {
          console.error(`Failed to process ${url}:`, error);
          return null;
        }
      })
    );

    results.push(...batchResults);

    // Progress callback
    if (options.onProgress) {
      options.onProgress({
        processed: Math.min(i + batchSize, imageUrls.length),
        total: imageUrls.length
      });
    }
  }

  return results.filter(r => r !== null);
}
```

## Integration Examples

### React Component

```jsx
// React hook for image color extraction
function useImageColors(imageUrl) {
  const [colors, setColors] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!imageUrl) return;

    const extractColors = async () => {
      setLoading(true);
      setError(null);

      try {
        const pixels = await loadImageFromUrl(imageUrl);
        const result = await extractImageColors({
          imageData: pixels,
          maxColors: 5
        });
        setColors(result.colors);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    extractColors();
  }, [imageUrl]);

  return { colors, loading, error };
}

// Usage in component
function ImagePalette({ imageUrl }) {
  const { colors, loading, error } = useImageColors(imageUrl);

  if (loading) return <div>Extracting colors...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!colors) return null;

  return (
    <div className="palette">
      {colors.map((color, i) => (
        <div
          key={i}
          className="color-swatch"
          style={{ backgroundColor: color.hex }}
        >
          <span>{color.hex}</span>
          <span>{Math.round(color.population * 100)}%</span>
        </div>
      ))}
    </div>
  );
}
```

### Vue Component

```vue
<template>
  <div class="image-theme-generator">
    <input
      type="file"
      @change="handleFileUpload"
      accept="image/*"
    >

    <div v-if="loading">Generating theme...</div>

    <div v-if="theme" class="theme-preview">
      <div
        v-for="(color, name) in theme.schemes.light"
        :key="name"
        :style="{ backgroundColor: color }"
        class="color-block"
      >
        {{ name }}: {{ color }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      theme: null,
      loading: false
    };
  },

  methods: {
    async handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.loading = true;

      try {
        const pixels = await this.getImagePixels(file);
        const theme = await this.generateTheme(pixels);
        this.theme = theme;
      } catch (error) {
        console.error('Failed to generate theme:', error);
      } finally {
        this.loading = false;
      }
    },

    async getImagePixels(file) {
      // Implementation here
    },

    async generateTheme(pixels) {
      return await generateThemeFromImage({
        imageData: pixels,
        variant: 'tonalSpot'
      });
    }
  }
};
</script>
```

## Next Steps

- Learn about [Creating Themes](./creating-themes.md) for comprehensive design systems
- Explore [CSS Refactoring](./css-refactoring.md) to apply extracted colors
- Read [Image Analysis Concepts](../concepts/image-analysis.md) for theory
- Check [Image Extraction Tools](../tools/image-extraction.md) for API reference