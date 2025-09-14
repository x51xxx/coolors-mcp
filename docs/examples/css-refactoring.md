# CSS Refactoring Examples

Learn how to modernize your CSS by replacing hardcoded colors with theme variables using Coolors MCP's intelligent matching and refactoring tools.

## Quick Start

### Simple Color Replacement

Replace a single hardcoded color with a theme variable:

```javascript
// Find matching theme variable
"What theme variable matches #6366f1?"

// With theme CSS
const theme = `
  :root {
    --color-primary-500: #6366f1;
    --color-primary-600: #4f46e5;
  }
`;

// Result: --color-primary-500 (100% confidence)
```

### Automatic CSS Refactoring

Refactor an entire stylesheet:

```javascript
"Refactor this CSS to use theme variables:
.button {
  background: #6366f1;
  color: #ffffff;
  border: 1px solid #4f46e5;
}"

// Automatically replaces with:
.button {
  background: var(--color-primary-500);
  color: var(--color-white);
  border: 1px solid var(--color-primary-600);
}
```

## Complete Refactoring Examples

### Component Stylesheet

#### Before (Hardcoded Colors)

```css
/* card.css - Original */
.card {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px;
}

.card-title {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
}

.card-body {
  padding: 16px;
  color: #4b5563;
}

.card-footer {
  background: #f9fafb;
  border-top: 1px solid #e5e7eb;
  padding: 12px 16px;
}

.card-link {
  color: #6366f1;
  text-decoration: none;
}

.card-link:hover {
  color: #4f46e5;
  text-decoration: underline;
}
```

#### Theme Variables

```css
/* theme.css */
:root {
  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-variant: #f9fafb;

  /* Borders */
  --color-border: #e5e7eb;

  /* Text */
  --color-text-primary: #1f2937;
  --color-text-secondary: #4b5563;

  /* Brand */
  --color-primary-500: #6366f1;
  --color-primary-600: #4f46e5;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);

  /* Spacing */
  --spacing-3: 12px;
  --spacing-4: 16px;

  /* Typography */
  --font-size-lg: 18px;
  --font-weight-semibold: 600;
}
```

#### After (Refactored)

```css
/* card.css - Refactored */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: var(--shadow-sm);
}

.card-header {
  background: var(--color-surface-variant);
  border-bottom: 1px solid var(--color-border);
  padding: var(--spacing-4);
}

.card-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

.card-body {
  padding: var(--spacing-4);
  color: var(--color-text-secondary);
}

.card-footer {
  background: var(--color-surface-variant);
  border-top: 1px solid var(--color-border);
  padding: var(--spacing-3) var(--spacing-4);
}

.card-link {
  color: var(--color-primary-500);
  text-decoration: none;
}

.card-link:hover {
  color: var(--color-primary-600);
  text-decoration: underline;
}
```

### Form Styles Refactoring

#### Before

```css
/* forms.css - Original */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  color: #374151;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
}

.form-input {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #1f2937;
  padding: 8px 12px;
  width: 100%;
}

.form-input:focus {
  border-color: #6366f1;
  outline: 2px solid rgba(99, 102, 241, 0.2);
  outline-offset: 2px;
}

.form-input:disabled {
  background: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.form-error {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.form-hint {
  color: #6b7280;
  font-size: 12px;
  margin-top: 4px;
}
```

#### After (With Original as Comments)

```css
/* forms.css - Refactored with preservation */
.form-group {
  margin-bottom: 24px;
}

.form-label {
  color: var(--color-text-secondary); /* was: #374151 */
  font-size: var(--font-size-sm); /* was: 14px */
  font-weight: var(--font-weight-medium); /* was: 500 */
  margin-bottom: var(--spacing-2); /* was: 8px */
}

.form-input {
  background: var(--color-surface); /* was: #ffffff */
  border: 1px solid var(--color-border-light); /* was: #d1d5db */
  border-radius: var(--radius-md); /* was: 6px */
  color: var(--color-text-primary); /* was: #1f2937 */
  padding: var(--spacing-2) var(--spacing-3); /* was: 8px 12px */
  width: 100%;
}

.form-input:focus {
  border-color: var(--color-primary-500); /* was: #6366f1 */
  outline: 2px solid var(--color-primary-100); /* was: rgba(99, 102, 241, 0.2) */
  outline-offset: 2px;
}

.form-input:disabled {
  background: var(--color-gray-100); /* was: #f3f4f6 */
  color: var(--color-text-disabled); /* was: #9ca3af */
  cursor: not-allowed;
}

.form-error {
  color: var(--color-error); /* was: #ef4444 */
  font-size: var(--font-size-xs); /* was: 12px */
  margin-top: var(--spacing-1); /* was: 4px */
}

.form-hint {
  color: var(--color-text-muted); /* was: #6b7280 */
  font-size: var(--font-size-xs); /* was: 12px */
  margin-top: var(--spacing-1); /* was: 4px */
}
```

## Batch Color Processing

### Finding All Unique Colors

```javascript
// Extract all colors from CSS
"Find all unique colors in this CSS file"

const css = `
  .header { background: #1f2937; color: #ffffff; }
  .nav { background: #374151; border-bottom: 1px solid #4b5563; }
  .link { color: #6366f1; }
  .link:hover { color: #4f46e5; }
  .footer { background: #1f2937; color: #9ca3af; }
`;

// Result:
{
  uniqueColors: [
    "#1f2937",  // Used 2 times
    "#ffffff",  // Used 1 time
    "#374151",  // Used 1 time
    "#4b5563",  // Used 1 time
    "#6366f1",  // Used 1 time
    "#4f46e5",  // Used 1 time
    "#9ca3af"   // Used 1 time
  ],
  suggestions: [
    "Color #1f2937 is used multiple times - consider creating a variable",
    "7 unique colors found - consider consolidating similar shades"
  ]
}
```

### Batch Matching to Theme

```javascript
// Match multiple colors at once
const colors = ["#6366f1", "#ec4899", "#10b981", "#f59e0b"];
const theme = `
  :root {
    --primary: #6366f1;
    --accent: #ec4899;
    --success: #10b981;
    --warning: #f59e0b;
  }
`;

// Results with confidence scores
[
  { color: "#6366f1", match: "--primary", confidence: 100 },
  { color: "#ec4899", match: "--accent", confidence: 100 },
  { color: "#10b981", match: "--success", confidence: 100 },
  { color: "#f59e0b", match: "--warning", confidence: 100 }
]
```

## Migration Strategies

### Progressive Enhancement

Start with high-confidence matches and gradually include lower confidence ones:

```javascript
// Step 1: Replace exact matches (100% confidence)
const exactMatches = refactorCSS(css, theme, { minConfidence: 100 });

// Step 2: Review and approve near matches (85-99% confidence)
const nearMatches = refactorCSS(css, theme, { minConfidence: 85 });

// Step 3: Handle remaining colors manually or create new variables
const remaining = findUnmatchedColors(css, theme);
```

### Department-by-Department Migration

Migrate large codebases incrementally:

```javascript
// 1. Start with utility classes
refactorFile('styles/utilities.css', theme);

// 2. Then base components
refactorFile('styles/buttons.css', theme);
refactorFile('styles/forms.css', theme);

// 3. Finally, complex components
refactorFile('styles/navigation.css', theme);
refactorFile('styles/modals.css', theme);
```

### Creating Missing Variables

When colors don't match existing theme:

```javascript
// Identify unmatched colors
const unmatched = [
  { color: "#7c3aed", usage: ["buttons", "links"] },
  { color: "#0ea5e9", usage: ["alerts", "badges"] }
];

// Generate appropriate variables
const newVariables = `
  /* Additional theme colors */
  --color-purple-500: #7c3aed;
  --color-sky-500: #0ea5e9;
`;

// Update theme and re-refactor
const updatedTheme = theme + newVariables;
refactorCSS(css, updatedTheme);
```

## Context-Aware Refactoring

### Semantic Matching

The refactoring tool understands context:

```javascript
// Border colors prefer border variables
.card { border: 1px solid #e5e7eb; }
// → border: 1px solid var(--color-border);

// Text colors prefer text variables
.title { color: #1f2937; }
// → color: var(--color-text-primary);

// Backgrounds prefer surface variables
.modal { background: #ffffff; }
// → background: var(--color-surface);
```

### Confidence Levels

Understanding match confidence:

| Confidence | Meaning | Action |
|------------|---------|--------|
| 100% | Exact match | Auto-replace |
| 95-99% | Very close (ΔE < 2) | Auto-replace with comment |
| 85-94% | Close (ΔE < 5) | Suggest replacement |
| 70-84% | Similar (ΔE < 10) | Manual review |
| <70% | Different | Keep original |

### Handling Edge Cases

#### Gradients

```css
/* Before */
.gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* After */
.gradient {
  background: linear-gradient(
    135deg,
    var(--color-purple-500) 0%,
    var(--color-purple-700) 100%
  );
}
```

#### RGBA Colors

```css
/* Before */
.overlay {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* After */
.overlay {
  background: rgba(var(--color-black-rgb), 0.5);
  border: 1px solid rgba(var(--color-white-rgb), 0.2);
}

/* Where theme includes: */
:root {
  --color-black-rgb: 0, 0, 0;
  --color-white-rgb: 255, 255, 255;
}
```

#### Box Shadows

```css
/* Before */
.card {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* After */
.card {
  box-shadow: var(--shadow-md);
}
```

## Real-World Refactoring

### E-commerce Site

```css
/* Original product card */
.product-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.product-image {
  background: #f5f5f5;
}

.product-title {
  color: #333333;
  font-size: 18px;
}

.product-price {
  color: #0066cc;
  font-size: 24px;
  font-weight: bold;
}

.product-sale-badge {
  background: #ff4444;
  color: white;
  padding: 4px 8px;
}

.product-add-to-cart {
  background: #00aa00;
  color: white;
  padding: 12px 24px;
}
```

```css
/* Refactored with design system */
.product-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.product-image {
  background: var(--color-surface-variant);
}

.product-title {
  color: var(--color-text-primary);
  font-size: var(--font-size-lg);
}

.product-price {
  color: var(--color-primary);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.product-sale-badge {
  background: var(--color-error);
  color: var(--color-on-error);
  padding: var(--spacing-1) var(--spacing-2);
}

.product-add-to-cart {
  background: var(--color-success);
  color: var(--color-on-success);
  padding: var(--spacing-3) var(--spacing-6);
}
```

### Dashboard Application

```css
/* Original dashboard styles */
.dashboard {
  background: #f8f9fa;
}

.sidebar {
  background: #2c3e50;
  color: #ecf0f1;
}

.sidebar-item:hover {
  background: #34495e;
}

.sidebar-item.active {
  background: #3498db;
}

.metric-card {
  background: white;
  border: 1px solid #dee2e6;
}

.metric-value {
  color: #2c3e50;
  font-size: 32px;
}

.metric-change.positive {
  color: #27ae60;
}

.metric-change.negative {
  color: #e74c3c;
}
```

```css
/* Refactored with consistent theme */
.dashboard {
  background: var(--color-background);
}

.sidebar {
  background: var(--color-surface-inverse);
  color: var(--color-on-surface-inverse);
}

.sidebar-item:hover {
  background: var(--color-surface-inverse-hover);
}

.sidebar-item.active {
  background: var(--color-primary);
}

.metric-card {
  background: var(--color-surface);
  border: 1px solid var(--color-outline);
}

.metric-value {
  color: var(--color-on-surface);
  font-size: var(--font-size-4xl);
}

.metric-change.positive {
  color: var(--color-success);
}

.metric-change.negative {
  color: var(--color-error);
}
```

## Automation Scripts

### Full Project Refactoring

```javascript
// refactor-project.js
const { refactorCSS, generateReport } = require('coolors-mcp');
const fs = require('fs');
const path = require('path');

async function refactorProject(srcDir, themeFile) {
  const theme = fs.readFileSync(themeFile, 'utf-8');
  const cssFiles = findCSSFiles(srcDir);
  const results = [];

  for (const file of cssFiles) {
    const original = fs.readFileSync(file, 'utf-8');
    const refactored = await refactorCSS(original, theme, {
      minConfidence: 85,
      preserveOriginal: true,
      generateReport: true
    });

    // Backup original
    fs.writeFileSync(`${file}.backup`, original);

    // Write refactored
    fs.writeFileSync(file, refactored.css);

    results.push({
      file,
      changes: refactored.changes.length,
      confidence: refactored.averageConfidence
    });
  }

  return generateReport(results);
}
```

### Pre-commit Hook

```javascript
// .husky/pre-commit
#!/bin/sh

# Check for hardcoded colors in staged CSS files
staged_css=$(git diff --cached --name-only --diff-filter=ACM | grep '\.css$')

if [ -n "$staged_css" ]; then
  for file in $staged_css; do
    # Check for hex colors not using variables
    if grep -E '#[0-9a-fA-F]{3,6}(?![0-9a-fA-F])' "$file" | grep -v 'var(--'; then
      echo "⚠️  Warning: Hardcoded colors found in $file"
      echo "Consider using theme variables instead"
      exit 1
    fi
  done
fi
```

## Best Practices

### 1. Start with a Complete Theme

Before refactoring, ensure your theme covers all use cases:

```css
:root {
  /* Surface colors */
  --color-surface: #ffffff;
  --color-surface-variant: #f5f5f5;
  --color-surface-inverse: #1a1a1a;

  /* Text colors */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #666666;
  --color-text-disabled: #999999;

  /* Interactive colors */
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-primary-active: #4338ca;

  /* Semantic colors */
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
}
```

### 2. Use Semantic Naming

Choose variable names that describe purpose, not appearance:

```css
/* Good */
--color-text-primary
--color-surface-elevated
--color-interactive-hover

/* Avoid */
--color-black
--color-gray-light
--color-blue-dark
```

### 3. Preserve Original Values

Keep original values as comments for reference:

```css
.button {
  background: var(--color-primary); /* was: #6366f1 */
}
```

### 4. Test After Refactoring

Always verify visual appearance after refactoring:

```javascript
// Visual regression test
const screenshots = {
  before: captureScreenshots(originalCSS),
  after: captureScreenshots(refactoredCSS)
};

const differences = compareScreenshots(screenshots);
if (differences.length > 0) {
  console.warn('Visual differences detected:', differences);
}
```

### 5. Document Your Theme

Include documentation with your theme variables:

```css
:root {
  /* Primary brand color - used for CTAs and primary actions */
  --color-primary: #6366f1;

  /* Text on primary color - must meet WCAG AA */
  --color-on-primary: #ffffff;

  /* Surface colors - ordered by elevation */
  --color-surface-0: #ffffff;  /* Base level */
  --color-surface-1: #fafafa;  /* Slightly elevated */
  --color-surface-2: #f5f5f5;  /* More elevated */
}
```

## Troubleshooting

### Common Issues and Solutions

#### Low Confidence Matches

**Problem**: Most matches have <70% confidence
**Solution**:
- Check if theme has enough color variations
- Consider adding intermediate shades
- Use more specific theme variables

#### Wrong Semantic Matches

**Problem**: Border colors matching to text variables
**Solution**:
- Use clearer variable naming conventions
- Provide context parameter when matching
- Create role-specific variables

#### Performance with Large Files

**Problem**: Slow refactoring for large CSS files
**Solution**:
- Split CSS into smaller modules
- Process files in parallel
- Cache theme parsing results

#### Gradient Refactoring

**Problem**: Complex gradients not refactoring correctly
**Solution**:
- Define gradient variables directly
- Use CSS custom properties for gradient stops
- Consider keeping complex gradients as-is

## Next Steps

- Learn about [Creating Themes](./creating-themes.md) to build comprehensive design systems
- Explore [Image Extraction](./image-extraction.md) for dynamic theme generation
- Read [Theme Matching Concepts](../concepts/theme-matching.md) to understand the algorithms
- Check [Material Design Tools](../tools/material-design.md) for advanced theming