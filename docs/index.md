---
layout: home

hero:
  name: "Coolors MCP"
  text: "Advanced Color Operations for MCP"
  tagline: "Professional color utilities with Material Design 3 support, CSS theme matching, image extraction, and accessibility compliance — <span style='color: #FFFFFF; background-color: #6366F1; padding: 2px 8px; border-radius: 6px; font-size: 14px; font-weight: 600; margin-left: 4px; display: inline-block; vertical-align: middle;'>built for Claude Code</span>"
  actions:
    - theme: brand
      text: Get Started
      link: /getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/x51xxx/coolors-mcp

features:
  - icon: 🎨
    title: Multi-Format Color Conversion
    details: |
      Convert between hex, RGB, HSL, LAB, and Google's HCT color spaces with perfect accuracy
  - icon: 🎭
    title: Material Design 3 Themes
    details: Generate complete Material Design color systems from any source color
  - icon: 🔍
    title: Smart CSS Theme Matching
    details: |
      <span style="color: #3b82f6;">Automatically match colors to CSS variables</span><br>
      <span style="color: #10b981;">with perceptual accuracy and semantic understanding</span>
  - icon: 🖼️
    title: Image Color Extraction
    details: Extract dominant colors from images using Google's Celebi quantization algorithm
  - icon: ♿
    title: WCAG Accessibility
    details: Check contrast ratios and ensure your color choices meet accessibility standards
  - icon: 🚀
    title: HCT Color Space
    details: Use Google's perceptually uniform color space for superior UI color operations
---

<div class="explore-hint" style="text-align: center; margin: 32px 0 48px; position: relative;">
  <div class="explore-dots" style="display: inline-flex; align-items: center; gap: 4px;">
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease;">•</span>
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease; transition-delay: 0.1s;">•</span>
    <span class="dot" style="font-size: 11px; letter-spacing: 0.5px; color: var(--vp-c-text-3); opacity: 0.8; transition: all 0.3s ease; transition-delay: 0.2s;">•</span>
  </div>
  <p class="explore-text" style="font-size: 13px; color: var(--vp-c-text-3); margin-top: 8px; opacity: 0.7; transition: all 0.3s ease;">
    Professional color tools for modern development
  </p>
</div>

<div style="margin-top: 48px;">

## What is Coolors MCP?

</div>

Coolors MCP is a Model Context Protocol (MCP) server that provides advanced color operations and utilities to AI assistants like Claude. It integrates Google's Material Color Utilities algorithms with sophisticated CSS theme matching capabilities, enabling AI-powered color workflows that were previously impossible.

### Key Features

- **🎨 Complete Color Toolkit**: Convert between any color format, calculate perceptual distances, and generate harmonious palettes
- **🎭 Material Design Integration**: Generate full Material Design 3 themes with tonal palettes and semantic roles
- **🔄 CSS Theme Refactoring**: Automatically replace hardcoded colors with theme variables in your CSS
- **📊 HCT Color Space**: Use Google's perceptually uniform color space for accurate color operations
- **🖼️ Image Analysis**: Extract dominant colors and generate themes from images
- **♿ Accessibility First**: Built-in WCAG contrast checking and accessibility compliance
- **🎯 Smart Matching**: Multi-factor algorithm considers perceptual distance, semantic context, and accessibility

### Why HCT Over LAB?

HCT (Hue, Chroma, Tone) is Google's color space specifically designed for UI applications:

- **Tone Component**: Directly correlates with contrast ratios (40 tone = 3:1, 50 tone = 4.5:1)
- **Perceptual Uniformity**: Better than LAB for UI color operations
- **Material Design Native**: Used in production by Android and Material Design
- **Semantic Understanding**: Better mapping between color relationships and UI roles

<div style="margin-top: 48px;">

## Quick Start

</div>

### For Claude Code Users

```bash
# One-command installation
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp

# Verify installation
/mcp
```

### For Claude Desktop Users

Add to your configuration file:

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

### Example Usage

Once installed, you can use natural language to work with colors:

```
// Color conversion
"convert #6366F1 to HSL and LAB formats"

// Generate Material theme
"create a Material Design 3 theme from #6366F1"

// CSS refactoring
"match all hardcoded colors in my CSS to theme variables"

// Image analysis
"extract the dominant colors from this image and create a theme"

// Accessibility checking
"check the contrast between #6366F1 and white"
```

<div style="margin-top: 48px;">

## Core Capabilities

</div>

### Color Operations

- Convert between hex, RGB, HSL, LAB, and HCT formats
- Calculate perceptual distance using Delta E 2000
- Generate color palettes (monochromatic, analogous, complementary, etc.)
- Create smooth gradients with multiple interpolation methods

### Material Design

- Generate complete Material Design 3 themes
- Create tonal palettes with standard Material tones
- Harmonize multiple colors to work together
- Fix universally disliked colors (dark yellow-greens)

### CSS Theme Matching

- Find closest theme variables for any color
- Automatically refactor CSS with theme variables
- Batch process multiple colors at once
- Confidence scoring for replacements

### Image Processing

- Extract dominant colors using Celebi quantization
- Generate themes from image colors
- Score colors for UI suitability
- Detect and fix disliked colors

<div style="margin-top: 48px;">

## Documentation

</div>

- [Getting Started](/getting-started) - Installation and setup guide
- [Tools Reference](/tools/README) - Complete tool documentation
- [Color Spaces](/concepts/color-spaces) - Understanding different color models
- [HCT System](/concepts/hct) - Google's perceptually uniform color space
- [Material Design](/concepts/material-design) - Material Design 3 integration

<div style="margin-top: 48px;">

## Community & Support

</div>

- **GitHub**: [x51xxx/coolors-mcp](https://github.com/x51xxx/coolors-mcp)
- **Issues**: [Report bugs or request features](https://github.com/x51xxx/coolors-mcp/issues)
- **NPM**: [@trishchuk/coolors-mcp](https://www.npmjs.com/package/@trishchuk/coolors-mcp)

<div style="margin-top: 48px;">

## License

</div>

This project is licensed under the MIT License. See the [LICENSE](https://github.com/x51xxx/coolors-mcp/blob/main/LICENSE) file for details.

**Built with** ❤️ **using Google's Material Color Utilities algorithms**
