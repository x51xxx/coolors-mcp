# Installation

Multiple ways to install the Coolors MCP server, depending on your needs.

## Prerequisites

- Node.js v18.0.0 or higher
- Claude Desktop or Claude Code with MCP support

## Method 1: NPX (Recommended)

No installation needed - runs directly:

### Claude Desktop Configuration

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

### Claude Code Configuration

```bash
claude mcp add coolors --npm-package @trishchuk/coolors-mcp
```

## Method 2: Global Installation

### Install globally

```bash
npm install -g @trishchuk/coolors-mcp
```

### Claude Desktop Configuration

```json
{
  "mcpServers": {
    "coolors": {
      "command": "coolors-mcp"
    }
  }
}
```

### Claude Code Configuration

```bash
claude mcp add coolors --command coolors-mcp
```

## Method 3: Local Development

For development or local testing:

```bash
# Clone the repository
git clone https://github.com/x51xxx/coolors-mcp.git
cd coolors-mcp

# Install dependencies
npm install

# Build the project
npm run build

# Test locally
node dist/bin/server.js
```

### Claude Desktop Configuration (Local)

```json
{
  "mcpServers": {
    "coolors-dev": {
      "command": "node",
      "args": ["/path/to/coolors-mcp/dist/bin/server.js"]
    }
  }
}
```

## Verification

Test your installation with a simple color conversion:

```json
{
  "name": "convert_color",
  "arguments": {
    "color": "#6366F1",
    "to": "hsl"
  }
}
```

Expected response: `"hsl(239, 84%, 67%)"`

## Available Tools

Once installed, you'll have access to these tools:

### Color Operations

- `convert_color` - Convert between color formats
- `color_distance` - Calculate perceptual distance
- `check_contrast` - WCAG contrast checking
- `generate_palette` - Create color palettes
- `generate_gradient` - Create smooth gradients

### Material Design

- `generate_material_theme` - Full Material Design 3 theme
- `harmonize_colors` - Harmonize multiple colors
- `generate_tonal_palette` - Material tonal palette
- `analyze_color_likability` - Check for disliked colors

### CSS Theme Matching

- `match_theme_color` - Find closest theme variable
- `refactor_css_with_theme` - Automated CSS refactoring
- `match_theme_colors_batch` - Batch color matching
- `generate_theme_css` - Generate CSS custom properties

### Image Processing

- `extract_image_colors` - Extract dominant colors
- `generate_theme_from_image` - Create theme from image

## Troubleshooting

Common issues:

- **Node.js version**: Ensure you have Node.js ≥18.0.0 (`node --version`)
- **Permission errors**: Try running with appropriate permissions
- **MCP connection issues**: Restart your Claude client after configuration changes
- **Module not found**: Ensure npm packages are properly installed

For more help, see the [FAQ](resources/faq) or [Troubleshooting Guide](resources/troubleshooting).

## Support

Need help with installation or setup? Here's how to get assistance:

### 🤝 Get Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/x51xxx/coolors-mcp/issues)
- **GitHub Discussions**: [Ask questions and share ideas](https://github.com/x51xxx/coolors-mcp/discussions)
- **Email**: [taras@trishchuk.com](mailto:taras@trishchuk.com) for direct support

### 📖 Documentation

- **[Getting Started Guide](getting-started)** - Complete setup and configuration
- **[Tools Reference](tools/README)** - Detailed tool documentation
- **[Examples](examples/basic-colors)** - Practical usage patterns

### 🚀 Contributing

Interested in contributing? Check out our [Contributing Guide](https://github.com/x51xxx/coolors-mcp/blob/main/CONTRIBUTING.md) or reach out directly!

---

**Developed by [Taras Trishchuk](https://github.com/x51xxx)** | Licensed under MIT
