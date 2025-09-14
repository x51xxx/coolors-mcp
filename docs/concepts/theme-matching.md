# Theme Matching Algorithm

Coolors MCP provides sophisticated algorithms for matching colors to CSS theme variables, enabling automated refactoring and consistent theming across applications.

## Overview

The theme matching system analyzes CSS variables and finds the best matches for any given color based on multiple factors:

- **Perceptual similarity** using HCT color space
- **Semantic context** from variable naming
- **Accessibility constraints** for contrast requirements
- **Confidence scoring** for replacement decisions

## How It Works

### 1. CSS Variable Parsing

The system first extracts and analyzes CSS variables:

```css
/* Input CSS with theme variables */
:root {
  --color-primary-50: #eef2ff;
  --color-primary-500: #6366f1;
  --color-primary-900: #312e81;
  --color-surface: #ffffff;
  --color-text: #1f2937;
}
```

### 2. Semantic Role Detection

Variable names are analyzed to detect semantic roles:

| Pattern | Detected Role | Usage Context |
|---------|--------------|---------------|
| `*primary*` | Primary | Main brand color |
| `*secondary*` | Secondary | Supporting color |
| `*surface*`, `*background*` | Surface | Backgrounds |
| `*text*`, `*foreground*` | Text | Typography |
| `*border*`, `*outline*` | Outline | Borders, dividers |
| `*error*`, `*danger*` | Error | Error states |
| `*success*` | Success | Success states |
| `*warning*` | Warning | Warning states |

### 3. Multi-Factor Scoring

Each potential match is scored based on multiple factors:

#### Perceptual Distance (60% weight)
Using HCT color space for accurate perception:

```javascript
function calculatePerceptualDistance(color1, color2) {
  const hct1 = toHct(color1);
  const hct2 = toHct(color2);

  // Weighted distance (tone weighted 2x for UI importance)
  return Math.sqrt(
    Math.pow(hct1.hue - hct2.hue, 2) +
    Math.pow(hct1.chroma - hct2.chroma, 2) +
    Math.pow((hct1.tone - hct2.tone) * 2, 2)
  );
}
```

#### Semantic Context (20% weight)
Matching semantic roles improves accuracy:

```javascript
function calculateSemanticScore(colorRole, variableRole, usage) {
  // Perfect match
  if (colorRole === variableRole) return 1.0;

  // Compatible roles
  if (isCompatible(colorRole, variableRole, usage)) return 0.7;

  // Incompatible
  return 0.3;
}
```

#### Accessibility Score (20% weight)
Ensuring contrast requirements are met:

```javascript
function calculateAccessibilityScore(color, background, requiredRatio) {
  const actualRatio = getContrastRatio(color, background);

  if (actualRatio >= requiredRatio) {
    return 1.0; // Meets requirements
  }

  // Partial credit based on how close
  return actualRatio / requiredRatio;
}
```

### 4. Confidence Calculation

Final confidence score determines replacement:

```javascript
confidence = (
  perceptualScore * 0.6 +
  semanticScore * 0.2 +
  accessibilityScore * 0.2
) * 100;
```

## Matching Strategies

### Exact Matching
For colors that exactly match a theme variable:
- **Confidence**: 100%
- **Action**: Direct replacement
- **Example**: `#6366f1` → `var(--color-primary-500)`

### Nearest Neighbor
For colors close to theme variables:
- **Confidence**: 70-99%
- **Action**: Replace with warning
- **Example**: `#6365f0` → `var(--color-primary-500)` (99% confidence)

### Semantic Matching
For colors matching expected roles:
- **Confidence**: 60-90%
- **Action**: Context-aware replacement
- **Example**: Border color `#e5e7eb` → `var(--color-border)`

### Fallback Matching
When no good matches exist:
- **Confidence**: <60%
- **Action**: Keep original or create new variable
- **Example**: `#123456` → `/* No match: #123456 */`

## Usage Examples

### Single Color Matching

```javascript
// Find best theme variable for a color
{
  "name": "match_theme_color",
  "arguments": {
    "color": "#6366f1",
    "themeCSS": ":root { --color-primary: #6366f1; }",
    "context": "background",
    "minConfidence": 70
  }
}

// Response
{
  "match": "--color-primary",
  "confidence": 100,
  "originalColor": "#6366f1",
  "themeColor": "#6366f1",
  "distance": 0
}
```

### CSS Refactoring

```javascript
// Refactor entire CSS file
{
  "name": "refactor_css_with_theme",
  "arguments": {
    "css": ".button { background: #6366f1; color: #ffffff; }",
    "themeCSS": ":root { --primary: #6366f1; --white: #ffffff; }",
    "minConfidence": 70,
    "preserveOriginal": true
  }
}

// Result
.button {
  background: var(--primary); /* was: #6366f1 */
  color: var(--white); /* was: #ffffff */
}
```

### Batch Processing

```javascript
// Match multiple colors at once
{
  "name": "match_theme_colors_batch",
  "arguments": {
    "colors": ["#6366f1", "#ec4899", "#10b981"],
    "themeCSS": "/* theme variables */",
    "context": "accent"
  }
}
```

## Advanced Features

### Context-Aware Matching

Different contexts have different priorities:

| Context | Priority | Factors |
|---------|----------|---------|
| `text` | Contrast > Semantic > Color | Readability first |
| `background` | Color > Semantic > Contrast | Visual accuracy |
| `border` | Semantic > Color > Contrast | Structural meaning |
| `accent` | Color > Contrast > Semantic | Brand consistency |
| `decorative` | Color > Semantic > Contrast | Visual appeal |

### Threshold Configuration

Fine-tune matching behavior:

```javascript
{
  minConfidence: 70,        // Minimum confidence for replacement
  maxDistance: 10,          // Maximum perceptual distance
  requireAccessibility: true, // Enforce contrast requirements
  preserveOriginal: true    // Keep original as comment
}
```

### Smart Variable Creation

When no match exists above threshold:

```javascript
// Input: #123456 with no close match
// Output:
:root {
  --color-custom-1: #123456; /* Auto-generated */
}

.element {
  color: var(--color-custom-1);
}
```

## Implementation Details

### Parser Architecture

1. **Tokenization**: Break CSS into tokens
2. **AST Building**: Create abstract syntax tree
3. **Variable Extraction**: Find all custom properties
4. **Color Detection**: Identify color values
5. **Context Analysis**: Determine usage context

### Matching Pipeline

```
Input Color → HCT Conversion → Distance Calculation
                                        ↓
Final Match ← Confidence Score ← Multi-Factor Analysis
                                        ↑
                              Semantic & Accessibility
```

### Performance Optimization

- **Caching**: Theme variables cached after first parse
- **Indexing**: Pre-computed HCT values for all theme colors
- **Batching**: Process multiple colors in single pass
- **Early Exit**: Skip processing if exact match found

## Best Practices

### Theme Variable Naming

Use semantic, hierarchical naming:

```css
/* Good - Clear hierarchy and purpose */
--color-primary-50
--color-primary-500
--color-primary-900
--color-text-primary
--color-text-secondary

/* Avoid - Ambiguous or color-specific */
--blue
--light-blue
--text-color
--col1
```

### Confidence Thresholds

Recommended thresholds by use case:

| Use Case | Min Confidence | Rationale |
|----------|---------------|-----------|
| Production refactor | 85% | High accuracy needed |
| Development assist | 70% | Balance speed/accuracy |
| Exploration | 50% | See all possibilities |
| Exact only | 100% | No false positives |

### Handling Edge Cases

#### Very Similar Colors
```css
/* Original */
.element1 { color: #6366f1; }
.element2 { color: #6366f0; }

/* After matching - both map to same variable */
.element1 { color: var(--color-primary); }
.element2 { color: var(--color-primary); }
```

#### No Good Matches
```css
/* Original */
.special { background: #742a2a; }

/* After - preserved with comment */
.special {
  background: #742a2a; /* No theme match (confidence: 45%) */
}
```

## Integration Patterns

### Build Tools

```javascript
// Webpack plugin example
module.exports = {
  plugins: [
    new ThemeMatcherPlugin({
      themeFile: './theme.css',
      minConfidence: 80,
      generateReport: true
    })
  ]
};
```

### CI/CD Pipeline

```yaml
# GitHub Actions example
- name: Refactor CSS with Theme
  run: |
    coolors-mcp refactor \
      --input src/styles \
      --theme src/theme.css \
      --confidence 85 \
      --report
```

### IDE Extensions

```javascript
// VS Code extension config
"coolors.themeMatching": {
  "enabled": true,
  "themeFile": "${workspaceFolder}/theme.css",
  "minConfidence": 75,
  "showInlineHints": true
}
```

## Troubleshooting

### Common Issues

#### Low Confidence Scores
- **Cause**: Colors too different from theme
- **Solution**: Lower threshold or add more theme variables

#### Wrong Semantic Matches
- **Cause**: Ambiguous variable names
- **Solution**: Use clearer naming conventions

#### Accessibility Failures
- **Cause**: Insufficient contrast with background
- **Solution**: Adjust theme colors or use different variables

### Debugging

Enable detailed logging:

```javascript
{
  "generateReport": true,
  "verboseLogging": true,
  "showDistanceMatrix": true
}
```

## See Also

- [Color Spaces](./color-spaces.md) - Understanding color models
- [HCT System](./hct.md) - Perceptual color space
- [Accessibility](./accessibility.md) - Contrast requirements
- [Material Design](./material-design.md) - Theme generation