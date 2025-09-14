# Accessibility Tools

Tools for ensuring color choices meet WCAG accessibility standards.

## check_contrast

Check the contrast ratio between two colors and verify WCAG compliance.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `foreground` | string | ✅ | Foreground/text color (hex, rgb, hsl) |
| `background` | string | ✅ | Background color (hex, rgb, hsl) |
| `fontSize` | number | ❌ | Font size in pixels (for determining large text) |
| `fontWeight` | number | ❌ | Font weight (for determining bold text) |

### Returns

```typescript
{
  ratio: number;          // Contrast ratio (1-21)
  ratioString: string;    // Formatted as "X.XX:1"
  passes: {
    AA: {
      normal: boolean;    // Passes AA for normal text (4.5:1)
      large: boolean;     // Passes AA for large text (3:1)
      nonText: boolean;   // Passes AA for UI elements (3:1)
    };
    AAA: {
      normal: boolean;    // Passes AAA for normal text (7:1)
      large: boolean;     // Passes AAA for large text (4.5:1)
    }
  };
  recommendation: string; // Human-readable recommendation
  luminance: {
    foreground: number;   // Relative luminance (0-1)
    background: number;   // Relative luminance (0-1)
  };
  isLargeText: boolean;  // Whether text qualifies as large
}
```

### Examples

#### Basic Contrast Check

```javascript
// Check black text on white background
{
  "name": "check_contrast",
  "arguments": {
    "foreground": "#000000",
    "background": "#ffffff"
  }
}

// Response
{
  "ratio": 21,
  "ratioString": "21:1",
  "passes": {
    "AA": {
      "normal": true,
      "large": true,
      "nonText": true
    },
    "AAA": {
      "normal": true,
      "large": true
    }
  },
  "recommendation": "Excellent contrast - passes all WCAG standards",
  "luminance": {
    "foreground": 0,
    "background": 1
  }
}
```

#### With Font Size Context

```javascript
// Check specific text size
{
  "name": "check_contrast",
  "arguments": {
    "foreground": "#6366f1",
    "background": "#ffffff",
    "fontSize": 24,  // 24px = large text
    "fontWeight": 400
  }
}

// Response
{
  "ratio": 3.03,
  "ratioString": "3.03:1",
  "passes": {
    "AA": {
      "normal": false,  // Needs 4.5:1
      "large": true,    // Passes 3:1 for large
      "nonText": true
    }
  },
  "isLargeText": true,
  "recommendation": "Passes AA for large text only. Consider darker foreground for normal text."
}
```

#### Check Multiple Combinations

```javascript
// Test color pairs
const pairs = [
  { fg: "#1f2937", bg: "#ffffff" },  // Dark gray on white
  { fg: "#6366f1", bg: "#f3f4f6" },  // Blue on light gray
  { fg: "#ffffff", bg: "#dc2626" }   // White on red
];

for (const pair of pairs) {
  const result = await checkContrast(pair.fg, pair.bg);
  console.log(`${pair.fg} on ${pair.bg}: ${result.ratioString}`);
}
```

### Large Text Definition

Text is considered "large" when:
- Font size ≥ 18pt (24px)
- Font size ≥ 14pt (18.67px) AND bold (weight ≥ 700)

### Use Cases

- Validating text/background combinations
- Ensuring button accessibility
- Checking form field contrast
- Verifying icon visibility

## ensure_contrast

Automatically adjust a color to meet contrast requirements.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `foreground` | string | ✅ | Color to adjust |
| `background` | string | ✅ | Background color |
| `targetRatio` | number | ✅ | Minimum contrast ratio needed |
| `preferLighter` | boolean | ❌ | Prefer lightening over darkening |

### Returns

```typescript
{
  original: {
    color: string;
    ratio: number;
  };
  adjusted: {
    color: string;
    ratio: number;
  };
  adjustmentMade: boolean;
  adjustmentType: 'lightened' | 'darkened' | 'none';
  toneChange: number;     // HCT tone difference
}
```

### Examples

#### Ensure AA Compliance

```javascript
// Make color accessible
{
  "name": "ensure_contrast",
  "arguments": {
    "foreground": "#8b92f0",  // Light blue
    "background": "#ffffff",
    "targetRatio": 4.5  // AA for normal text
  }
}

// Response
{
  "original": {
    "color": "#8b92f0",
    "ratio": 2.8
  },
  "adjusted": {
    "color": "#5256c9",  // Darkened
    "ratio": 4.51
  },
  "adjustmentMade": true,
  "adjustmentType": "darkened",
  "toneChange": -15
}
```

#### Ensure AAA Compliance

```javascript
// Maximize readability
{
  "name": "ensure_contrast",
  "arguments": {
    "foreground": "#6366f1",
    "background": "#ffffff",
    "targetRatio": 7  // AAA standard
  }
}
```

#### Prefer Lighter Adjustment

```javascript
// For dark backgrounds, prefer lightening
{
  "name": "ensure_contrast",
  "arguments": {
    "foreground": "#6366f1",
    "background": "#1f2937",  // Dark background
    "targetRatio": 4.5,
    "preferLighter": true  // Lighten the foreground
  }
}
```

### Use Cases

- Auto-fixing inaccessible colors
- Creating accessible variations
- Generating readable text colors
- Building high-contrast modes

## get_accessible_pairs

Generate accessible color pairs for different UI contexts.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `baseColor` | string | ✅ | Starting color |
| `count` | number | ❌ | Number of pairs to generate (default: 5) |
| `contrastLevels` | string[] | ❌ | Required levels: AA, AAA (default: ['AA']) |
| `contexts` | string[] | ❌ | UI contexts: text, button, border (default: all) |

### Returns

```typescript
{
  baseColor: string;
  pairs: Array<{
    foreground: string;
    background: string;
    contrast: number;
    passes: object;
    context: string;
    recommendation: string;
  }>;
}
```

### Examples

#### Generate Text Color Pairs

```javascript
// Get accessible text colors
{
  "name": "get_accessible_pairs",
  "arguments": {
    "baseColor": "#6366f1",
    "count": 5,
    "contexts": ["text"]
  }
}

// Returns various accessible combinations
{
  "pairs": [
    {
      "foreground": "#6366f1",
      "background": "#ffffff",
      "contrast": 3.03,
      "context": "text",
      "recommendation": "Use for large text only"
    },
    {
      "foreground": "#ffffff",
      "background": "#6366f1",
      "contrast": 3.03,
      "context": "text",
      "recommendation": "Inverted - use for buttons"
    }
    // ... more pairs
  ]
}
```

#### Generate AAA Pairs

```javascript
// Maximum accessibility
{
  "name": "get_accessible_pairs",
  "arguments": {
    "baseColor": "#6366f1",
    "contrastLevels": ["AAA"],
    "contexts": ["text", "button"]
  }
}
```

### Use Cases

- Building accessible color systems
- Creating theme variations
- Generating style guides
- Testing color combinations

## validate_palette_accessibility

Check all color combinations in a palette for accessibility.

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `palette` | object | ✅ | Color palette with role names and values |
| `level` | string | ❌ | WCAG level to test: AA, AAA (default: AA) |
| `includeReport` | boolean | ❌ | Generate detailed report (default: true) |

### Returns

```typescript
{
  valid: boolean;         // All combinations pass
  totalCombinations: number;
  passingCombinations: number;
  failingCombinations: number;
  issues: Array<{
    foreground: string;
    foregroundRole: string;
    background: string;
    backgroundRole: string;
    ratio: number;
    required: number;
    suggestion: string;
  }>;
  report?: {
    byRole: object;       // Issues grouped by role
    summary: string;      // Human-readable summary
    recommendations: string[];
  }
}
```

### Examples

#### Validate Material Theme

```javascript
// Check Material Design theme
{
  "name": "validate_palette_accessibility",
  "arguments": {
    "palette": {
      "primary": "#6366f1",
      "onPrimary": "#ffffff",
      "primaryContainer": "#e0e0ff",
      "onPrimaryContainer": "#070764",
      "surface": "#fffbff",
      "onSurface": "#1b1b1f"
    },
    "level": "AA"
  }
}

// Response shows any issues
{
  "valid": false,
  "totalCombinations": 6,
  "passingCombinations": 5,
  "failingCombinations": 1,
  "issues": [
    {
      "foreground": "#6366f1",
      "foregroundRole": "primary",
      "background": "#e0e0ff",
      "backgroundRole": "primaryContainer",
      "ratio": 2.1,
      "required": 4.5,
      "suggestion": "Darken primary or lighten primaryContainer"
    }
  ]
}
```

#### Validate Custom Palette

```javascript
// Check brand colors
{
  "name": "validate_palette_accessibility",
  "arguments": {
    "palette": {
      "brand": "#FF5722",
      "text": "#212121",
      "background": "#FFFFFF",
      "accent": "#00BCD4",
      "muted": "#9E9E9E"
    },
    "level": "AAA",
    "includeReport": true
  }
}
```

### Use Cases

- Validating design systems
- Testing theme accessibility
- Generating accessibility reports
- Finding problem combinations

## Best Practices

### Contrast Requirements

#### Text Content
| Context | AA Minimum | AAA Minimum |
|---------|------------|-------------|
| Normal text | 4.5:1 | 7:1 |
| Large text | 3:1 | 4.5:1 |
| Incidental text | No requirement | No requirement |
| Logotypes | No requirement | No requirement |

#### Non-Text Content
| Context | AA Minimum | Notes |
|---------|------------|-------|
| UI components | 3:1 | Active components |
| Graphics | 3:1 | Essential graphics |
| Decorative | No requirement | Purely decorative |

### Testing Strategy

```javascript
// Comprehensive testing
async function testAccessibility(theme) {
  // 1. Check individual pairs
  const criticalPairs = [
    { fg: theme.text, bg: theme.background },
    { fg: theme.primary, bg: theme.surface }
  ];

  for (const pair of criticalPairs) {
    const result = await checkContrast(pair.fg, pair.bg);
    if (result.ratio < 4.5) {
      console.warn(`Low contrast: ${pair.fg} on ${pair.bg}`);
    }
  }

  // 2. Validate entire palette
  const validation = await validatePalette(theme);
  if (!validation.valid) {
    console.error('Palette has accessibility issues:', validation.issues);
  }

  // 3. Generate report
  return validation.report;
}
```

### Automatic Fixing

```javascript
// Fix accessibility issues automatically
async function fixAccessibility(theme) {
  const fixed = { ...theme };

  // Ensure all text meets AA
  fixed.text = await ensureContrast({
    foreground: theme.text,
    background: theme.background,
    targetRatio: 4.5
  });

  // Ensure buttons are accessible
  fixed.buttonText = await ensureContrast({
    foreground: theme.buttonText,
    background: theme.buttonBg,
    targetRatio: 4.5
  });

  return fixed;
}
```

## Common Patterns

### Dark Mode Accessibility

```javascript
// Ensure dark mode meets standards
function validateDarkMode(darkTheme) {
  const checks = [
    // Primary text should be readable
    {
      fg: darkTheme.text,
      bg: darkTheme.background,
      min: 4.5
    },
    // But not too harsh (avoid pure white on black)
    {
      fg: darkTheme.text,
      bg: darkTheme.background,
      max: 18  // Avoid excessive contrast
    }
  ];

  return checks.every(check => {
    const ratio = getContrast(check.fg, check.bg);
    return ratio >= (check.min || 0) && ratio <= (check.max || 21);
  });
}
```

### Progressive Enhancement

```javascript
// Provide multiple contrast levels
function generateContrastLevels(baseTheme) {
  return {
    // Default - AA compliance
    default: baseTheme,

    // Medium - Enhanced readability
    medium: adjustContrast(baseTheme, 1.2),

    // High - AAA compliance
    high: adjustContrast(baseTheme, 1.5),

    // Maximum - For accessibility needs
    maximum: {
      text: '#000000',
      background: '#ffffff',
      primary: '#0000ff'
    }
  };
}
```

### Form Validation

```javascript
// Ensure form fields are accessible
function validateFormColors(formTheme) {
  const requirements = {
    // Input fields need clear boundaries
    inputBorder: { min: 3.0, against: formTheme.inputBg },

    // Error text must be readable
    errorText: { min: 4.5, against: formTheme.background },

    // Focus indicators must be visible
    focusRing: { min: 3.0, against: formTheme.inputBg },

    // Placeholder text (relaxed requirement)
    placeholder: { min: 3.0, against: formTheme.inputBg }
  };

  return Object.entries(requirements).map(([element, req]) => ({
    element,
    passes: checkContrast(formTheme[element], req.against).ratio >= req.min
  }));
}
```

## Troubleshooting

### Low Contrast Issues

**Problem**: Colors don't meet minimum contrast
**Solution**:
- Use `ensure_contrast` to auto-adjust
- Increase tone difference between colors
- Consider different color roles

### Harsh Contrast

**Problem**: Maximum contrast (21:1) is too harsh
**Solution**:
- Use off-white (#fafafa) instead of pure white
- Use very dark gray (#0a0a0a) instead of pure black
- Aim for 12-15:1 for comfortable reading

### Color Meaning Lost

**Problem**: Adjusted colors lose brand identity
**Solution**:
- Adjust the background instead of foreground
- Use borders or icons to supplement color
- Provide high-contrast mode as option

## See Also

- [Accessibility Concepts](../concepts/accessibility.md) - WCAG standards explained
- [HCT System](../concepts/hct.md) - Tone-based contrast
- [Color Operations](./color-operations.md) - Color manipulation
- [Material Design Tools](./material-design.md) - Accessible themes