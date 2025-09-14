# Theme Matching Tools

Tools for matching colors to CSS theme variables and automated refactoring.

## match_theme_color

Find the closest matching theme variable for a given color.

### Parameters

| Parameter       | Type   | Required | Description                                                         |
| --------------- | ------ | -------- | ------------------------------------------------------------------- |
| `color`         | string | ✅       | Color to match (hex, rgb, hsl)                                      |
| `themeCSS`      | string | ✅       | CSS containing theme variables                                      |
| `context`       | string | ❌       | Usage context: text, background, border, shadow, accent, decorative |
| `minConfidence` | number | ❌       | Minimum confidence threshold (0-100, default: 70)                   |

### Returns

```typescript
{
  match: string; // CSS variable name
  confidence: number; // Confidence score (0-100)
  originalColor: string; // Input color
  themeColor: string; // Matched theme color
  distance: number; // Perceptual distance
  semantic: {
    role: string; // Detected semantic role
    compatible: boolean; // Context compatibility
  }
}
```

### Examples

#### Basic Matching

```javascript
// Find closest theme variable
{
  "name": "match_theme_color",
  "arguments": {
    "color": "#6366f1",
    "themeCSS": ":root { --color-primary-500: #6366f1; --color-primary-600: #4f46e5; }"
  }
}

// Response
{
  "match": "--color-primary-500",
  "confidence": 100,
  "originalColor": "#6366f1",
  "themeColor": "#6366f1",
  "distance": 0,
  "semantic": {
    "role": "primary",
    "compatible": true
  }
}
```

#### Context-Aware Matching

```javascript
// Match for specific usage
{
  "name": "match_theme_color",
  "arguments": {
    "color": "#e5e7eb",
    "themeCSS": ":root { --color-border: #e5e7eb; --color-gray-200: #e5e7eb; }",
    "context": "border"
  }
}

// Prefers semantic match
{
  "match": "--color-border",
  "confidence": 100,
  "semantic": {
    "role": "border",
    "compatible": true
  }
}
```

#### With Confidence Threshold

```javascript
// Only return high-confidence matches
{
  "name": "match_theme_color",
  "arguments": {
    "color": "#6365f0",
    "themeCSS": ":root { --color-primary: #6366f1; }",
    "minConfidence": 95
  }
}

// Close but not exact
{
  "match": "--color-primary",
  "confidence": 98.5,
  "distance": 1.2
}
```

### Use Cases

- Finding existing theme variables for colors
- Identifying duplicate color definitions
- Migrating hardcoded colors to variables
- Validating color consistency

## refactor_css_with_theme

Automatically replace hardcoded colors with theme variables in CSS.

### Parameters

| Parameter          | Type    | Required | Description                                           |
| ------------------ | ------- | -------- | ----------------------------------------------------- |
| `css`              | string  | ✅       | CSS content to refactor                               |
| `themeCSS`         | string  | ✅       | CSS containing theme variables                        |
| `minConfidence`    | number  | ❌       | Minimum confidence for replacements (default: 70)     |
| `preserveOriginal` | boolean | ❌       | Keep original values as comments (default: true)      |
| `generateReport`   | boolean | ❌       | Generate detailed refactoring report (default: false) |

### Returns

```typescript
{
  refactoredCSS: string;  // Updated CSS
  changes: Array<{
    original: string;     // Original color
    replacement: string;  // Theme variable
    confidence: number;   // Match confidence
    line: number;        // Line number
  }>;
  report?: {
    totalColors: number;
    replaced: number;
    skipped: number;
    averageConfidence: number;
    unmatchedColors: string[];
  }
}
```

### Examples

#### Basic Refactoring

```javascript
{
  "name": "refactor_css_with_theme",
  "arguments": {
    "css": ".button { background: #6366f1; color: #ffffff; }",
    "themeCSS": ":root { --primary: #6366f1; --white: #ffffff; }"
  }
}

// Result
{
  "refactoredCSS": ".button {\n  background: var(--primary); /* was: #6366f1 */\n  color: var(--white); /* was: #ffffff */\n}",
  "changes": [
    { "original": "#6366f1", "replacement": "--primary", "confidence": 100 },
    { "original": "#ffffff", "replacement": "--white", "confidence": 100 }
  ]
}
```

#### Complex CSS Refactoring

```javascript
{
  "name": "refactor_css_with_theme",
  "arguments": {
    "css": `
      .card {
        background: #ffffff;
        border: 1px solid #e5e7eb;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
      .card-title {
        color: #1f2937;
      }
    `,
    "themeCSS": `
      :root {
        --color-white: #ffffff;
        --color-border: #e5e7eb;
        --color-text: #1f2937;
        --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
      }
    `,
    "preserveOriginal": true
  }
}
```

#### With Report Generation

```javascript
{
  "name": "refactor_css_with_theme",
  "arguments": {
    "css": "/* your CSS */",
    "themeCSS": "/* theme */",
    "generateReport": true,
    "minConfidence": 80
  }
}

// Includes detailed report
{
  "report": {
    "totalColors": 15,
    "replaced": 12,
    "skipped": 3,
    "averageConfidence": 92.5,
    "unmatchedColors": ["#123456", "#789abc", "#def012"]
  }
}
```

### Use Cases

- Migrating legacy CSS to use variables
- Enforcing consistent color usage
- Identifying hardcoded colors
- Modernizing stylesheets

## match_theme_colors_batch

Match multiple colors to theme variables in a single operation.

### Parameters

| Parameter  | Type     | Required | Description                       |
| ---------- | -------- | -------- | --------------------------------- |
| `colors`   | string[] | ✅       | Array of colors to match (max 50) |
| `themeCSS` | string   | ✅       | CSS containing theme variables    |
| `context`  | string   | ❌       | Usage context for all colors      |

### Returns

```typescript
{
  matches: Array<{
    color: string; // Input color
    match: string | null; // Matched variable or null
    confidence: number; // Match confidence
    distance: number; // Perceptual distance
  }>;
  summary: {
    total: number; // Total colors processed
    matched: number; // Successfully matched
    unmatched: number; // No suitable match
    averageConfidence: number;
  }
}
```

### Examples

#### Batch Color Matching

```javascript
{
  "name": "match_theme_colors_batch",
  "arguments": {
    "colors": ["#6366f1", "#ec4899", "#10b981", "#f59e0b"],
    "themeCSS": `
      :root {
        --color-primary: #6366f1;
        --color-pink: #ec4899;
        --color-green: #10b981;
        --color-amber: #f59e0b;
      }
    `
  }
}

// Response
{
  "matches": [
    { "color": "#6366f1", "match": "--color-primary", "confidence": 100 },
    { "color": "#ec4899", "match": "--color-pink", "confidence": 100 },
    { "color": "#10b981", "match": "--color-green", "confidence": 100 },
    { "color": "#f59e0b", "match": "--color-amber", "confidence": 100 }
  ],
  "summary": {
    "total": 4,
    "matched": 4,
    "unmatched": 0,
    "averageConfidence": 100
  }
}
```

#### Finding Unmatched Colors

```javascript
{
  "name": "match_theme_colors_batch",
  "arguments": {
    "colors": ["#6366f1", "#123456", "#789abc"],
    "themeCSS": ":root { --primary: #6366f1; }"
  }
}

// Shows which colors need variables
{
  "matches": [
    { "color": "#6366f1", "match": "--primary", "confidence": 100 },
    { "color": "#123456", "match": null, "confidence": 0 },
    { "color": "#789abc", "match": null, "confidence": 0 }
  ],
  "summary": {
    "unmatched": 2
  }
}
```

### Use Cases

- Auditing color usage across a project
- Finding all unique colors in CSS
- Identifying colors that need theme variables
- Bulk color migration

## generate_theme_css

Generate CSS custom properties for a complete theme from a source color.

### Parameters

| Parameter      | Type     | Required | Description                                             |
| -------------- | -------- | -------- | ------------------------------------------------------- |
| `sourceColor`  | string   | ✅       | Source color for theme generation                       |
| `prefix`       | string   | ❌       | Prefix for CSS variables (default: "color")             |
| `includeTones` | number[] | ❌       | Tone values to include (default: Material Design tones) |

### Returns

```typescript
{
  css: string;           // Generated CSS with custom properties
  theme: {
    primary: object;     // Primary palette
    secondary: object;   // Secondary palette
    tertiary: object;    // Tertiary palette
    neutral: object;     // Neutral palette
    error: object;       // Error palette
  };
  variables: string[];   // List of generated variable names
}
```

### Examples

#### Basic Theme Generation

```javascript
{
  "name": "generate_theme_css",
  "arguments": {
    "sourceColor": "#6366f1"
  }
}

// Generates
:root {
  /* Primary palette */
  --color-primary-0: #000000;
  --color-primary-10: #00006e;
  --color-primary-20: #0001ac;
  --color-primary-30: #1e2bdb;
  --color-primary-40: #4046f4;
  --color-primary-50: #6366f1;
  --color-primary-60: #7f81ff;
  --color-primary-70: #9da0ff;
  --color-primary-80: #bcc0ff;
  --color-primary-90: #dee0ff;
  --color-primary-95: #eff0ff;
  --color-primary-99: #fffbff;
  --color-primary-100: #ffffff;

  /* Secondary, tertiary, neutral, error palettes... */
}
```

#### Custom Prefix and Tones

```javascript
{
  "name": "generate_theme_css",
  "arguments": {
    "sourceColor": "#6366f1",
    "prefix": "theme",
    "includeTones": [0, 25, 50, 75, 100]
  }
}

// Generates with custom prefix
:root {
  --theme-primary-0: #000000;
  --theme-primary-25: #0f15c5;
  --theme-primary-50: #6366f1;
  --theme-primary-75: #a1a3ff;
  --theme-primary-100: #ffffff;
  /* ... */
}
```

### Use Cases

- Creating new design systems
- Generating Material Design themes
- Building accessible color palettes
- Creating consistent color systems

## Best Practices

### Theme Variable Naming

Use clear, semantic names:

```css
/* Good */
--color-primary-500
--color-text-primary
--color-surface-elevated

/* Avoid */
--blue
--color1
--my-color
```

### Confidence Thresholds

| Use Case    | Recommended | Rationale                 |
| ----------- | ----------- | ------------------------- |
| Production  | 85-100%     | Avoid false matches       |
| Development | 70-85%      | Balance accuracy/coverage |
| Exploration | 50-70%      | Find possibilities        |

### Performance Tips

1. **Cache theme CSS** when doing multiple operations
2. **Batch color matching** instead of individual calls
3. **Pre-process theme** to extract variables once
4. **Use appropriate confidence** to avoid unnecessary processing

### Error Handling

```javascript
// Handle no matches
const result = await matchThemeColor(color, theme);
if (result.confidence < minConfidence) {
  // Create new variable or keep original
}

// Handle invalid CSS
try {
  const refactored = await refactorCSS(css, theme);
} catch (error) {
  console.error("Invalid CSS:", error);
}
```

## Common Patterns

### Progressive Enhancement

```javascript
// 1. Start with exact matches
let confidence = 100;
let result = match(color, theme, confidence);

// 2. Gradually lower threshold
while (!result && confidence > 50) {
  confidence -= 10;
  result = match(color, theme, confidence);
}

// 3. Create new variable if needed
if (!result) {
  createNewVariable(color);
}
```

### Theme Validation

```javascript
// Check all theme colors are unique
const colors = extractThemeColors(themeCSS);
const unique = new Set(colors.values());
if (unique.size < colors.size) {
  console.warn("Duplicate colors in theme");
}
```

### Migration Workflow

```javascript
// 1. Extract all colors from existing CSS
const colors = findAllColors(css);

// 2. Generate theme from primary color
const theme = generateTheme(colors[0]);

// 3. Match remaining colors
const matches = matchBatch(colors, theme);

// 4. Refactor CSS with theme
const refactored = refactorWithTheme(css, theme);
```

## Troubleshooting

### Low Confidence Matches

**Problem**: All matches have low confidence
**Solution**:

- Check theme has enough color variations
- Lower minConfidence threshold
- Add more theme variables

### Wrong Semantic Matches

**Problem**: Colors match wrong semantic role
**Solution**:

- Use clearer variable naming
- Provide context parameter
- Adjust semantic weight in matching

### Performance Issues

**Problem**: Slow with large CSS files
**Solution**:

- Split CSS into smaller chunks
- Use batch operations
- Cache parsed theme variables

## See Also

- [Theme Matching Concepts](../concepts/theme-matching.md) - How matching works
- [CSS Refactoring Examples](../examples/css-refactoring.md) - Practical examples
- [Material Design Tools](./material-design.md) - Theme generation
- [Color Operations](./color-operations.md) - Basic color tools
