# Coolors MCP Documentation

Coolors MCP is a Model Context Protocol server for color operations, Material Design theme generation, and CSS theme matching.

## Quick Navigation

### Getting Started

- [Installation & Setup](../README.md#installation)
- [Configuration](../README.md#configure-with-claude-desktop)
- [Quick Start Guide](../README.md#quick-start)

### Tools Reference

- [Tools Overview](./tools/README.md) - Complete list of available tools
- [Color Operations](./tools/color-operations.md) - Conversion, distance, contrast
- [Material Design](./tools/material-design.md) - Theme generation, tonal palettes
- [Theme Matching](./tools/theme-matching.md) - CSS refactoring, variable matching
- [Image Extraction](./tools/image-extraction.md) - Extract colors from images
- [Color Psychology](./tools/color-psychology.md) - Dislike analysis and fixes

### API Documentation

- [API Reference](./api/README.md) - Complete API documentation
- [TypeScript Types](./api/types.md) - Type definitions and interfaces

### Concepts

- [HCT Color Space](./concepts/hct-color-space.md) - Understanding HCT vs traditional color spaces
- [Distance Metrics](./concepts/distance-metrics.md) - Color difference calculations
- [Material Design 3](./concepts/material-design-3.md) - Core concepts and principles
- [Theme Matching Algorithm](./concepts/theme-matching-algorithm.md) - How matching works

### Examples & Guides

- [Usage Examples](./examples/README.md) - Practical code examples
- [Design System Migration](./examples/design-system-migration.md) - Converting legacy CSS
- [Accessibility Compliance](./examples/accessibility-compliance.md) - WCAG guidelines
- [Dynamic Theming](./examples/dynamic-theming.md) - Image-based themes
- [Color Harmonization](./examples/color-harmonization.md) - Creating palettes

## Features

### Color Space Support

- RGB, HSL, HSV color models
- LAB, XYZ perceptual spaces
- HCT (Hue, Chroma, Tone) - Google's color space for UI

### Distance Metrics

- Delta E 76 - Basic perceptual difference
- Delta E 94 - Improved for graphics arts
- Delta E 2000 - Most accurate perceptual metric
- HCT distance - Optimized for UI components

### Material Design Integration

- Complete Material Design 3 theme generation
- Tonal palette creation (0-100 tones)
- Color harmonization algorithms
- Light and dark theme variants

### CSS Theme Tools

- Extract theme variables from CSS
- Match colors to closest theme variables
- Automated CSS refactoring
- Context-aware matching (text, background, borders)

### Image Processing

- Extract dominant colors from images
- Generate themes from photographs
- Quantization using Celebi algorithm
- Color scoring for UI suitability

### Color Psychology

- Detect universally disliked colors
- Automatic color correction
- Batch processing for palettes
- Based on research into color perception

## Tool Categories

### 1. Basic Color Operations

Tools for fundamental color manipulation:

- `convert_color` - Format conversion
- `color_distance` - Perceptual difference
- `check_contrast` - WCAG compliance
- `generate_palette` - Create color schemes

### 2. Material Design Tools

Google's Material Design 3 implementation:

- `generate_material_theme` - Complete theme from source color
- `generate_tonal_palette` - Create tonal variations
- `harmonize_colors` - Blend colors together

### 3. Theme Matching & Refactoring

CSS and design system integration:

- `match_theme_color` - Find closest variable
- `refactor_css_with_theme` - Automate CSS updates
- `match_theme_colors_batch` - Process multiple colors
- `generate_theme_css` - Create CSS custom properties

### 4. Image-Based Tools

Extract and generate from images:

- `extract_image_colors` - Get dominant colors
- `generate_theme_from_image` - Create theme from photo

### 5. Color Analysis

Psychology and perception:

- `analyze_color_likability` - Check for problematic colors
- `fix_disliked_colors_batch` - Correct multiple colors

## Use Cases

### Design Systems

- Migrate from hardcoded colors to CSS variables
- Ensure consistency across components
- Generate comprehensive color palettes
- Maintain brand guidelines

### Accessibility

- Verify WCAG AA/AAA compliance
- Find accessible color combinations
- Fix contrast issues automatically
- Test entire themes for compliance

### Dynamic Theming

- Generate themes from user images
- Create seasonal color schemes
- Match brand colors automatically
- Adapt to content dynamically

### Development Workflow

- Refactor legacy CSS efficiently
- Validate color choices during development
- Generate Material Design themes
- Ensure psychological appropriateness

## Architecture Overview

The server is organized into logical modules:

```
src/
├── tools/           # MCP tool implementations
├── color/           # Core color algorithms
│   ├── conversions  # Color space conversions
│   ├── metrics      # Distance calculations
│   ├── hct/        # HCT color space
│   └── quantize/   # Image quantization
├── theme/          # Theme matching system
│   ├── parser      # CSS parsing
│   ├── matcher     # Matching algorithm
│   └── refactor    # CSS transformation
└── bin/            # Server entry point
```

## Performance Considerations

- Color conversions are cached for repeated operations
- Batch operations available for processing multiple colors
- Quantization quality settings for image processing
- Confidence thresholds for theme matching

## Error Handling

All tools include error handling for:

- Invalid color formats
- Out-of-range values
- Missing required parameters
- Malformed CSS input

## Contributing

See the main [README](../README.md#contributing) for contribution guidelines.

## License

MIT License - See [LICENSE](../LICENSE) file for details.
