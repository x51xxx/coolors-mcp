# Coolors MCP

Advanced color operations MCP server with Material Design 3 support, CSS theme matching, image color extraction, and accessibility compliance.

## Features

- 🎨 **Color Space Conversions** - RGB, HSL, HSV, LAB, XYZ, and Google's HCT
- 📏 **Perceptual Color Metrics** - Delta E (76/94/2000) and HCT-based distance
- 🎭 **Material Design 3** - Complete theme generation with tonal palettes
- 🔍 **Smart Theme Matching** - Find closest CSS variables for any color
- 🖼️ **Image Color Extraction** - Extract dominant colors using Celebi quantization
- ♿ **WCAG Compliance** - Automatic contrast ratio checking
- 🔄 **CSS Refactoring** - Automated legacy color replacement with theme variables
- 🎯 **Context-Aware** - Different matching strategies for text, background, borders
- 🌈 **Advanced Palette Generation** - Create palettes with locked colors
- 🎨 **Gradient Generation** - Smooth gradients with multiple interpolation methods
- 🚫 **Dislike Analysis** - Detect and fix universally disliked colors

## Installation

### Method 1: NPX (Recommended)

No installation needed - runs directly:

#### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp"]
    }
  }
}
```

#### Claude Code Configuration

```bash
claude mcp add coolors --npm-package @trishchuk/coolors-mcp
```

### Method 2: NPM Install

```bash
npm install @trishchuk/coolors-mcp
```

### Method 3: From Source

```bash
git clone https://github.com/x51xxx/coolors-mcp
cd coolors-mcp
npm install
npm run build
```

## Quick Start

### Run as MCP Server

```bash
# Run the built server
node dist/bin/server.js

# Or use with MCP Inspector for testing
npx fastmcp inspect src/bin/server.ts
```

### Configure with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "coolors": {
      "command": "node",
      "args": ["/path/to/coolors-mcp/dist/bin/server.js"]
    }
  }
}
```

## Available Tools

### Core Color Operations

#### `convert_color`

Convert colors between formats (hex, rgb, hsl, lab, hct).

```typescript
{
  "color": "#6750a4",
  "to": "hct"
}
// Output: "hct(258.1, 47.3, 41.2)"
```

#### `color_distance`

Calculate perceptual distance between colors.

```typescript
{
  "color1": "#6750a4",
  "color2": "#7f67be",
  "metric": "deltaE2000"
}
// Output: "Distance: 8.45"
```

#### `check_contrast`

Check WCAG contrast ratio compliance.

```typescript
{
  "foreground": "#000000",
  "background": "#ffffff"
}
// Output: Contrast Ratio: 21.00:1 ✓ WCAG AAA
```

### Palette Generation

#### `generate_palette`

Generate color palettes (monochromatic, analogous, complementary, triadic, tetradic).

```typescript
{
  "baseColor": "#6750a4",
  "type": "analogous",
  "count": 5
}
```

#### `generate_palette_with_locks`

Generate palettes while preserving specific colors.

```typescript
{
  "lockedColors": ["#6750a4", "#ff6b6b"],
  "totalColors": 7,
  "mode": "harmony",  // or "contrast", "gradient"
  "colorSpace": "lab"  // or "hsl"
}
```

#### `generate_gradient`

Create smooth gradients with advanced interpolation.

```typescript
{
  "colors": ["#6750a4", "#ff6b6b"],
  "steps": 10,
  "interpolation": "lab",  // or "hsl", "rgb", "lch", "hct"
  "easing": "ease-in-out",  // or "linear", "ease-in", "ease-out"
  "format": "css-linear"  // or "array", "hex", "css-radial"
}
```

### Material Design 3

#### `generate_material_theme`

Generate complete Material Design 3 color theme.

```typescript
{
  "sourceColor": "#6750a4",
  "includeCustomColors": true
}
```

#### `generate_tonal_palette`

Create Material Design tonal palettes.

```typescript
{
  "color": "#6750a4",
  "tones": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
}
```

#### `harmonize_colors`

Harmonize multiple colors to work together.

```typescript
{
  "colors": ["#6750a4", "#ff6b6b", "#4ecdc4"],
  "method": "harmonize",  // or "blend", "temperature"
  "factor": 0.5
}
```

### CSS Theme Matching

#### `match_theme_color`

Find closest theme variable for any color.

```typescript
{
  "color": "#6850a0",
  "themeCSS": ":root { --color-primary-40: #6750a4; }",
  "context": "background",
  "minConfidence": 70
}
```

#### `refactor_css_with_theme`

Automatically refactor CSS to use theme variables.

```typescript
{
  "css": ".button { background: #6750a4; }",
  "themeCSS": ":root { --color-primary-40: #6750a4; }",
  "preserveOriginal": true,
  "generateReport": true
}
```

#### `generate_theme_css`

Generate CSS custom properties for a complete theme.

```typescript
{
  "sourceColor": "#6750a4",
  "prefix": "color",
  "includeTones": [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
}
```

### Image Color Extraction

#### `extract_image_colors`

Extract dominant colors from images using Celebi quantization.

```typescript
{
  "imageData": {
    "data": [/* RGBA array */],
    "width": 1920,
    "height": 1080
  },
  "maxColors": 5,
  "quality": "high",
  "format": "json"
}
```

#### `generate_theme_from_image`

Generate Material Design theme from image colors.

```typescript
{
  "imageData": {/* image data */},
  "isDark": false,
  "includeCustomColors": true
}
```

### Color Psychology

#### `analyze_color_likability`

Check if colors fall in universally disliked ranges.

```typescript
{
  "color": "#6b6b00"  // Dark yellow-green
}
// Output: Analysis with fix suggestions
```

#### `fix_disliked_colors_batch`

Fix multiple disliked colors automatically.

```typescript
{
  "colors": ["#6b6b00", "#7a7a10", "#808020"],
  "strategy": "hue_shift"  // or "desaturate", "brighten"
}
```

## Color Science

### HCT Color Space

Google's HCT (Hue, Chroma, Tone) color space provides:

- **Hue** (0-360°): Color wheel position
- **Chroma** (0-150): Color intensity
- **Tone** (0-100): Lightness with guaranteed WCAG contrast

Key benefits:

- Tone difference of 40 = 3:1 contrast ratio
- Tone difference of 50 = 4.5:1 contrast ratio
- Perceptually uniform for UI design

### Interpolation Methods

Different color spaces for gradient generation:

- **RGB**: Simple but can produce muddy colors
- **HSL**: Good for hue-based transitions
- **LAB**: Perceptually uniform brightness
- **LCH**: Cylindrical LAB, smooth hue transitions
- **HCT**: Material Design optimized

### Theme Matching Algorithm

Multi-factor scoring system:

1. **Perceptual Distance (60%)** - HCT-based similarity
2. **Semantic Context (20%)** - Role appropriateness
3. **Accessibility (20%)** - Contrast compliance

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Format code
npm run format

# Lint
npm run lint
```

## Architecture

```
src/
├── bin/
│   └── server.ts               # MCP server entry
├── tools/                      # Tool implementations
│   ├── color-conversion.tool.ts
│   ├── color-distance.tool.ts
│   ├── contrast-checker.tool.ts
│   ├── palette-generator.tool.ts
│   ├── palette-with-locks.tool.ts
│   ├── gradient-generator.tool.ts
│   ├── material-theme.tools.ts
│   ├── theme-matching.tools.ts
│   ├── image-extraction.tools.ts
│   └── dislike-analyzer.tool.ts
├── color/                      # Core color utilities
│   ├── conversions.ts          # Color space conversions
│   ├── metrics.ts              # Distance calculations
│   ├── utils.ts                # Color utilities
│   ├── hct/                   # HCT color space
│   ├── quantize/               # Celebi quantization
│   ├── score/                  # Color scoring
│   └── dislike/                # Dislike analysis
└── theme/                      # Theme system
    ├── parser.ts               # CSS parsing
    ├── matcher.ts              # Variable matching
    └── refactor.ts             # CSS refactoring
```

## Use Cases

### Design System Migration

Convert hardcoded colors to CSS variables with confidence scores.

### Accessibility Compliance

Ensure all color combinations meet WCAG AA/AAA standards.

### Material Design Adoption

Generate complete Material Design 3 themes with tonal palettes.

### Brand Color Harmonization

Create cohesive palettes that work well together.

### Image-Based Theming

Extract colors from logos or photos to generate matching themes.

### Gradient Design

Create smooth, perceptually uniform gradients for modern UIs.

## Contributing

Contributions welcome! Please ensure:

- Tests pass (`npm test`)
- Code is formatted (`npm run format`)
- Type checking passes (`npm run lint`)

## License

MIT

## Credits

- Built with [MCP SDK](https://modelcontextprotocol.io/) by Anthropic
- Incorporates algorithms from [Material Color Utilities](https://github.com/material-foundation/material-color-utilities) by Google
- HCT color space developed for Material Design 3
- Celebi quantization algorithm for optimal color extraction
