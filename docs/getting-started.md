# Getting Started

Get up and running with Coolors MCP in minutes. This guide covers installation, basic usage, and your first color operations.

## Quick Start

### 1. Install Coolors MCP

#### For Claude Code
```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

#### For Claude Desktop
Add to your configuration:
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

### 2. Verify Installation

Check that Coolors MCP is available:
```
/mcp
```

You should see `coolors` in the list of available servers.

### 3. Your First Color Operation

Try a simple color conversion:
```
Convert #6366f1 to HSL format
```

Claude will use the `convert_color` tool and return: `hsl(239, 84%, 67%)`

## Basic Color Operations

### Color Conversion

Convert between any supported format:

```javascript
// Hex to RGB
"Convert #6366f1 to RGB"
// Result: rgb(99, 102, 241)

// RGB to HSL
"Convert rgb(99, 102, 241) to HSL"
// Result: hsl(239, 84%, 67%)

// HSL to LAB
"Convert hsl(239, 84%, 67%) to LAB"
// Result: lab(47.9, 35.2, -65.7)

// Any color to HCT
"Convert #6366f1 to HCT"
// Result: hct(265.8, 87.2, 47.9)
```

### Color Distance

Calculate perceptual difference between colors:

```javascript
"What's the perceptual distance between #6366f1 and #5355d1?"
// Uses Delta E 2000 algorithm
// Result: 5.2 (very similar colors)

"Compare #ff0000 and #00ff00 using Delta E"
// Result: 86.6 (very different colors)
```

### Contrast Checking

Verify accessibility compliance:

```javascript
"Check contrast between #1f2937 and #ffffff"
// Result: 15.74:1 - Passes AAA for all text sizes

"Is #6366f1 accessible on white background?"
// Result: 3.03:1 - Passes AA for large text only

"What text color works on #6366f1 background?"
// Result: #ffffff (white) provides 4.6:1 contrast
```

## Creating Color Palettes

### Basic Palettes

Generate harmonious color sets:

```javascript
"Create a monochromatic palette from #6366f1"
// Result: 5 shades of the same hue

"Generate complementary colors for #6366f1"
// Result: #6366f1 and its opposite

"Create a triadic color scheme from #6366f1"
// Result: 3 colors 120° apart
```

### Material Design Themes

Generate complete Material Design 3 themes:

```javascript
"Create a Material Design theme from #6366f1"
// Generates:
// - Primary, secondary, tertiary palettes
// - Surface and background colors
// - Error colors
// - Light and dark variants
```

### Custom Gradients

Create smooth color transitions:

```javascript
"Create a gradient from #6366f1 to #ec4899 with 10 steps"
// Result: 10 colors smoothly transitioning

"Generate a gradient using LAB interpolation"
// Result: Perceptually smooth gradient
```

## CSS Theme Matching

### Finding Theme Variables

Match colors to existing CSS variables:

```javascript
"Find the closest theme variable for #6365f0 in my CSS"
// Analyzes your theme CSS and finds best match
// Result: --color-primary-500 (99% confidence)
```

### Refactoring CSS

Automatically replace hardcoded colors:

```javascript
"Refactor this CSS to use theme variables:
.button {
  background: #6366f1;
  border: 1px solid #4f46e5;
}"

// Result:
.button {
  background: var(--color-primary-500);
  border: 1px solid var(--color-primary-600);
}
```

## Working with Images

### Extract Colors

Get dominant colors from images:

```javascript
"Extract the main colors from this image"
// Analyzes image and returns:
// - Top 5 dominant colors
// - Population percentages
// - Suitability scores
```

### Generate Theme from Image

Create a complete theme from an image:

```javascript
"Create a Material Design theme from this album cover"
// Extracts colors and generates:
// - Source color selection
// - Complete color scheme
// - Light/dark variants
```

## Common Workflows

### 1. Building a Color System

Start with a brand color and expand:

```javascript
// Step 1: Define primary color
"My brand color is #6366f1"

// Step 2: Generate palette
"Create a complete color system from this"

// Step 3: Check accessibility
"Verify all color combinations meet WCAG AA"

// Step 4: Export as CSS
"Generate CSS custom properties for this theme"
```

### 2. Migrating to Theme Variables

Convert existing CSS to use variables:

```javascript
// Step 1: Define your theme
"Here's my theme CSS: [paste theme]"

// Step 2: Analyze existing styles
"Find all hardcoded colors in styles.css"

// Step 3: Refactor automatically
"Replace hardcoded colors with theme variables"

// Step 4: Review changes
"Show me colors that couldn't be matched"
```

### 3. Creating Accessible Designs

Ensure your colors meet standards:

```javascript
// Step 1: Test current colors
"Check contrast for my primary colors"

// Step 2: Fix issues
"Adjust colors to meet WCAG AA"

// Step 3: Generate alternatives
"Create high contrast version of theme"

// Step 4: Validate
"Verify all combinations are accessible"
```

## Advanced Features

### Color Harmonization

Make multiple colors work together:

```javascript
"Harmonize these colors: #6366f1, #ec4899, #10b981"
// Adjusts colors to be more harmonious while maintaining identity
```

### Dislike Detection

Avoid universally disliked colors:

```javascript
"Is #6b7c3a a good color for UI?"
// Detects "bile zone" colors and suggests alternatives
```

### Batch Processing

Process multiple colors efficiently:

```javascript
"Match all these colors to my theme: [list of colors]"
// Processes all colors and returns best matches
```

## Tips and Tricks

### Performance

- **Resize images** before extraction (300px width is usually enough)
- **Cache theme variables** when doing multiple matches
- **Use batch operations** when processing multiple colors

### Accuracy

- **Use HCT** for perceptual operations
- **Use LAB** for color matching
- **Use RGB/Hex** for final output

### Accessibility

- **Always check contrast** for text/background pairs
- **Provide high contrast options** for users who need them
- **Don't rely on color alone** to convey information

## Next Steps

### Learn More

- [Color Spaces](concepts/color-spaces.md) - Understand different color models
- [HCT System](concepts/hct.md) - Google's perceptual color space
- [Material Design](concepts/material-design.md) - Complete theming system
- [Accessibility](concepts/accessibility.md) - WCAG compliance

### Explore Tools

- [Color Operations](tools/color-operations.md) - All conversion tools
- [Material Design Tools](tools/material-design.md) - Theme generation
- [Theme Matching](tools/theme-matching.md) - CSS refactoring
- [Image Extraction](tools/image-extraction.md) - Working with images

### See Examples

- [Basic Colors](examples/basic-colors.md) - Simple operations
- [Creating Themes](examples/creating-themes.md) - Theme generation
- [CSS Refactoring](examples/css-refactoring.md) - Modernizing CSS
- [Image Extraction](examples/image-extraction.md) - Image-based themes

## Getting Help

### Common Issues

#### "Tool not found"
Make sure Coolors MCP is properly installed and Claude has been restarted.

#### "Invalid color format"
Check that your color is in a supported format: hex (#RRGGBB), rgb(), hsl(), etc.

#### "No theme matches found"
Lower the confidence threshold or add more theme variables.

### Support

- **GitHub Issues**: [Report bugs](https://github.com/x51xxx/coolors-mcp/issues)
- **Documentation**: [Full docs](https://x51xxx.github.io/coolors-mcp/)
- **Examples**: [Code samples](examples/basic-colors.md)

## Quick Reference

### Supported Color Formats
- **Hex**: `#RRGGBB` or `#RGB`
- **RGB**: `rgb(r, g, b)` or `{r, g, b}`
- **HSL**: `hsl(h, s%, l%)` or `{h, s, l}`
- **LAB**: `lab(l, a, b)` or `{l, a, b}`
- **HCT**: `hct(h, c, t)` or `{h, c, t}`

### Common Tools
- `convert_color` - Format conversion
- `color_distance` - Perceptual difference
- `check_contrast` - WCAG compliance
- `generate_palette` - Color schemes
- `generate_material_theme` - Material Design
- `match_theme_color` - Find CSS variables
- `refactor_css_with_theme` - Update CSS
- `extract_image_colors` - Image analysis

### Contrast Requirements
- **Normal text**: 4.5:1 (AA), 7:1 (AAA)
- **Large text**: 3:1 (AA), 4.5:1 (AAA)
- **UI elements**: 3:1 (AA)

Ready to start? Try your first color operation above!