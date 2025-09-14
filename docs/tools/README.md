# Tools Overview

Coolors MCP provides 15 tools organized into 5 categories for comprehensive color manipulation and theme management.

## Available Tools

### Color Operations

Basic color manipulation and analysis tools.

| Tool                                                         | Description                     | Primary Use Case     |
| ------------------------------------------------------------ | ------------------------------- | -------------------- |
| [`convert_color`](./color-operations.md#convert_color)       | Convert between color formats   | Format compatibility |
| [`color_distance`](./color-operations.md#color_distance)     | Calculate perceptual difference | Color similarity     |
| [`check_contrast`](./color-operations.md#check_contrast)     | WCAG contrast ratio             | Accessibility        |
| [`generate_palette`](./color-operations.md#generate_palette) | Create color schemes            | Design systems       |

### Material Design

Google's Material Design 3 implementation.

| Tool                                                                      | Description       | Primary Use Case  |
| ------------------------------------------------------------------------- | ----------------- | ----------------- |
| [`generate_material_theme`](./material-design.md#generate_material_theme) | Complete M3 theme | App theming       |
| [`generate_tonal_palette`](./material-design.md#generate_tonal_palette)   | Tonal variations  | Component states  |
| [`harmonize_colors`](./material-design.md#harmonize_colors)               | Blend colors      | Color consistency |

### Theme Matching

CSS refactoring and design system integration.

| Tool                                                                       | Description           | Primary Use Case      |
| -------------------------------------------------------------------------- | --------------------- | --------------------- |
| [`match_theme_color`](./theme-matching.md#match_theme_color)               | Find closest variable | Single color matching |
| [`match_theme_colors_batch`](./theme-matching.md#match_theme_colors_batch) | Match multiple colors | Bulk processing       |
| [`refactor_css_with_theme`](./theme-matching.md#refactor_css_with_theme)   | Automate CSS updates  | Legacy migration      |
| [`generate_theme_css`](./theme-matching.md#generate_theme_css)             | Create CSS variables  | New projects          |

### Image Extraction

Color extraction from images.

| Tool                                                                           | Description             | Primary Use Case |
| ------------------------------------------------------------------------------ | ----------------------- | ---------------- |
| [`extract_image_colors`](./image-extraction.md#extract_image_colors)           | Get dominant colors     | Color analysis   |
| [`generate_theme_from_image`](./image-extraction.md#generate_theme_from_image) | Create theme from photo | Dynamic theming  |

### Color Psychology

Analysis based on color perception research.

| Tool                                                                           | Description               | Primary Use Case   |
| ------------------------------------------------------------------------------ | ------------------------- | ------------------ |
| [`analyze_color_likability`](./color-psychology.md#analyze_color_likability)   | Detect problematic colors | Quality assurance  |
| [`fix_disliked_colors_batch`](./color-psychology.md#fix_disliked_colors_batch) | Fix multiple colors       | Palette correction |

## Tool Selection Guide

### By Task

**Converting colors between formats:**

- Use `convert_color` for single conversions
- Supports hex, rgb, hsl, lab, hct formats

**Checking color accessibility:**

- Use `check_contrast` for WCAG compliance
- Returns AA/AAA pass/fail for normal and large text

**Creating a color palette:**

- Use `generate_palette` for basic schemes (monochromatic, analogous, etc.)
- Use `generate_material_theme` for complete Material Design themes
- Use `generate_tonal_palette` for Material Design tonal variations

**Matching colors to theme variables:**

- Use `match_theme_color` for single colors
- Use `match_theme_colors_batch` for multiple colors
- Use `refactor_css_with_theme` for entire CSS files

**Working with images:**

- Use `extract_image_colors` to get dominant colors
- Use `generate_theme_from_image` for complete themes

**Fixing problematic colors:**

- Use `analyze_color_likability` to check single colors
- Use `fix_disliked_colors_batch` for entire palettes

### By Input Type

**Single color input:**

- `convert_color` - format conversion
- `generate_tonal_palette` - create variations
- `analyze_color_likability` - check perception

**Two color input:**

- `color_distance` - calculate difference
- `check_contrast` - check accessibility

**Multiple colors input:**

- `harmonize_colors` - blend together
- `match_theme_colors_batch` - find matches
- `fix_disliked_colors_batch` - fix problems

**CSS input:**

- `refactor_css_with_theme` - update to use variables
- `match_theme_color` - with themeCSS parameter

**Image input:**

- `extract_image_colors` - get colors
- `generate_theme_from_image` - create theme

## Common Workflows

### 1. Design System Setup

```
1. generate_material_theme (create base theme)
2. generate_theme_css (export as CSS variables)
3. refactor_css_with_theme (update existing CSS)
```

### 2. Accessibility Audit

```
1. extract colors from CSS
2. check_contrast for each color pair
3. suggest alternatives for failures
```

### 3. Image-Based Theming

```
1. extract_image_colors (analyze image)
2. generate_theme_from_image (create theme)
3. generate_theme_css (export for use)
```

### 4. Color Palette Creation

```
1. generate_palette (create base palette)
2. harmonize_colors (ensure consistency)
3. fix_disliked_colors_batch (fix problems)
4. check_contrast (verify accessibility)
```

## Parameter Patterns

Most tools follow consistent parameter patterns:

### Color Parameters

- Accept hex (#ffffff), rgb(255,255,255), or hsl(0,0%,100%)
- Case-insensitive
- With or without # prefix for hex

### Optional Parameters

- `metric` - for distance calculations (default: deltaE2000)
- `context` - for theme matching (text, background, border, etc.)
- `minConfidence` - threshold for matching (0-100)
- `quality` - for image processing (low, medium, high)

### Return Formats

- Single values return strings
- Multiple values return JSON objects
- Batch operations return arrays
- Errors return descriptive messages

## Performance Tips

1. **Use batch operations** when processing multiple colors
2. **Set appropriate quality** for image processing (low for previews, high for final)
3. **Cache theme CSS** when doing multiple matches
4. **Use confidence thresholds** to control matching strictness

## Error Handling

All tools handle common errors:

- Invalid color format → Returns error message
- Out of range values → Automatically clamped
- Missing parameters → Clear error description
- Malformed input → Validation feedback

## Integration Examples

### With Claude Desktop

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

### With MCP Inspector

```bash
npx fastmcp inspect src/bin/server.ts
```

### Programmatic Usage

```typescript
import { colorConversionTool } from "coolors-mcp/tools";

const result = await colorConversionTool.execute({
  color: "#6750a4",
  to: "hct",
});
```

## Next Steps

- [Color Operations](./color-operations.md) - Detailed documentation for basic color tools
- [Material Design](./material-design.md) - Material Design 3 theme generation
- [Theme Matching](./theme-matching.md) - CSS refactoring and variable matching
- [API Reference](../api/README.md) - Complete API documentation
