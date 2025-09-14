# Accessibility

Coolors MCP ensures color choices meet accessibility standards through comprehensive contrast checking and automatic adjustments based on WCAG guidelines.

## Contrast Standards

### WCAG Overview

The Web Content Accessibility Guidelines (WCAG) define contrast requirements for readable content:

| Level   | Normal Text | Large Text | Non-Text |
| ------- | ----------- | ---------- | -------- |
| **AA**  | 4.5:1       | 3:1        | 3:1      |
| **AAA** | 7:1         | 4.5:1      | N/A      |

**Large text** is defined as:

- 18pt (24px) or larger
- 14pt (18.5px) or larger if bold

### Contrast Ratio Calculation

Contrast ratio is based on relative luminance:

```javascript
// Relative luminance calculation
function getLuminance(rgb) {
  const [r, g, b] = rgb.map((val) => {
    val = val / 255;
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// Contrast ratio
function getContrastRatio(color1, color2) {
  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}
```

### Understanding Contrast Ratios

- **1:1** - No contrast (same color)
- **4.5:1** - Minimum for normal text (AA)
- **7:1** - Enhanced contrast (AAA)
- **21:1** - Maximum (black on white)

## HCT and Accessibility

### Tone-Based Contrast

HCT's tone component directly correlates with contrast:

| Tone Difference | Approximate Contrast | Use Case                |
| --------------- | -------------------- | ----------------------- |
| 40              | ~3:1                 | Large text, UI elements |
| 50              | ~4.5:1               | Normal text (AA)        |
| 70              | ~7:1                 | Enhanced (AAA)          |
| 90              | ~15:1                | Maximum readability     |

### Predictable Relationships

```javascript
// Guaranteed accessible pairs in HCT
const background = { h: 200, c: 20, t: 95 }; // Light surface
const text = { h: 200, c: 20, t: 20 }; // Dark text
// Tone difference: 75 = guaranteed 7:1+ contrast
```

## Checking Contrast

### Basic Contrast Check

```javascript
{
  "name": "check_contrast",
  "arguments": {
    "foreground": "#1f2937",
    "background": "#ffffff"
  }
}

// Returns
{
  "ratio": 15.74,
  "passes": {
    "AA": { "normal": true, "large": true },
    "AAA": { "normal": true, "large": true }
  },
  "recommendation": "Excellent contrast for all uses"
}
```

### Context-Aware Checking

```javascript
// Check with specific requirements
{
  "name": "check_contrast",
  "arguments": {
    "foreground": "#6366f1",
    "background": "#f3f4f6",
    "fontSize": 14,
    "fontWeight": 400
  }
}
```

## Material Design Contrast Levels

### Default Contrast (0.0)

Meets AA accessibility:

- **Guaranteed minimums**:
  - 4.5:1 for all text and icons
  - 3:1 for required non-text elements
- **Targets**:
  - 7:1 for high emphasis text

### Medium Contrast (+0.5)

Exceeds AA requirements:

- **Guaranteed minimums**:
  - 4.5:1 for all text
  - 3:1 for all non-text elements
- **Targets**:
  - 7:1 for normal text
  - 11:1 for high emphasis

### High Contrast (+1.0)

Meets AAA accessibility:

- **Guaranteed minimums**:
  - 7:1 for all text and icons
  - 4.5:1 for all non-text elements
- **Targets**:
  - 11:1 for normal text
  - 21:1 for high emphasis

## Automatic Adjustments

### Tone Adjustment Algorithm

When colors don't meet contrast requirements:

```javascript
function adjustForContrast(foreground, background, targetRatio) {
  const currentRatio = getContrastRatio(foreground, background);

  if (currentRatio >= targetRatio) {
    return foreground; // Already accessible
  }

  // Convert to HCT for tone adjustment
  const fgHct = toHct(foreground);
  const bgHct = toHct(background);

  // Determine adjustment direction
  const lighten = bgHct.tone < 50;

  // Binary search for optimal tone
  let low = lighten ? bgHct.tone : 0;
  let high = lighten ? 100 : bgHct.tone;

  while (high - low > 1) {
    const mid = (low + high) / 2;
    const testColor = { ...fgHct, tone: mid };
    const ratio = getContrastRatio(toRgb(testColor), background);

    if (ratio >= targetRatio) {
      if (lighten) high = mid;
      else low = mid;
    } else {
      if (lighten) low = mid;
      else high = mid;
    }
  }

  return toRgb({ ...fgHct, tone: lighten ? high : low });
}
```

### Contrast Libraries

Pre-calculated adjustments for common scenarios:

```javascript
// Ensure text is readable on any background
function getAccessibleTextColor(background) {
  const bgLuminance = getLuminance(background);

  // Use white or black based on background
  if (bgLuminance > 0.5) {
    return "#000000"; // Dark text on light background
  } else {
    return "#ffffff"; // Light text on dark background
  }
}
```

## Color Roles and Accessibility

### Guaranteed Accessible Pairs

Material Design ensures these pairs always meet contrast requirements:

| Background       | Foreground         | Min Contrast | Use Case        |
| ---------------- | ------------------ | ------------ | --------------- |
| surface          | onSurface          | 4.5:1        | Main content    |
| primary          | onPrimary          | 4.5:1        | Primary actions |
| primaryContainer | onPrimaryContainer | 4.5:1        | Containers      |
| error            | onError            | 4.5:1        | Error states    |

### Role-Based Adjustments

```javascript
// Automatic role assignment with contrast guarantee
function assignColorRoles(sourceColor, contrastLevel = 0) {
  const palette = generateTonalPalette(sourceColor);

  // Adjust tone mappings based on contrast level
  const toneMap = {
    primary: 40 - contrastLevel * 10,
    onPrimary: 100,
    primaryContainer: 90 + contrastLevel * 5,
    onPrimaryContainer: 10 - contrastLevel * 5,
  };

  // Ensure minimum contrast
  return Object.entries(toneMap).map(([role, tone]) => ({
    role,
    color: palette[tone],
    meetsContrast: true,
  }));
}
```

## Best Practices

### Design Guidelines

#### DO's

- ✅ Test all color combinations for contrast
- ✅ Provide high contrast mode options
- ✅ Use semantic color roles consistently
- ✅ Consider different types of color blindness
- ✅ Test with real content, not just color swatches

#### DON'Ts

- ❌ Rely on color alone to convey information
- ❌ Use low contrast for aesthetic reasons
- ❌ Assume large text allows poor contrast
- ❌ Ignore user preference for high contrast
- ❌ Use pure black on pure white (too harsh)

### Testing Strategies

#### Automated Testing

```javascript
// Test all color combinations in theme
function testThemeAccessibility(theme) {
  const results = [];

  // Test each foreground/background pair
  theme.pairs.forEach(({ fg, bg, context }) => {
    const ratio = getContrastRatio(fg, bg);
    const required = getRequiredRatio(context);

    results.push({
      pair: `${fg} on ${bg}`,
      context,
      ratio,
      passes: ratio >= required,
      recommendation: getRecommendation(ratio, context),
    });
  });

  return results;
}
```

#### Manual Testing

1. **Blur test**: Blur your vision - can you still read it?
2. **Grayscale test**: Convert to grayscale - still distinguishable?
3. **Sunlight test**: View in bright light conditions
4. **Distance test**: Step back from screen
5. **Squint test**: Squint eyes - text still readable?

## Special Considerations

### Color Blindness

Approximately 8% of men and 0.5% of women have color vision deficiency:

| Type         | Frequency | Description     | Design Impact         |
| ------------ | --------- | --------------- | --------------------- |
| Protanopia   | 1.3%      | No red cones    | Red/green confusion   |
| Deuteranopia | 1.2%      | No green cones  | Red/green confusion   |
| Tritanopia   | 0.001%    | No blue cones   | Blue/yellow confusion |
| Monochromacy | Rare      | No color vision | Rely on contrast only |

#### Design Strategies

```javascript
// Ensure information isn't conveyed by color alone
✓ Error: "❌ Invalid input" (icon + text)
✗ Error: Red border only

// Use patterns or icons
✓ Status: "🟢 Active" / "🔴 Inactive"
✗ Status: Green/Red backgrounds only

// Provide sufficient contrast
✓ Different tones for different states
✗ Same tone, different hues only
```

### Dark Mode Considerations

Dark themes require special attention:

```javascript
// Light theme
const lightTheme = {
  surface: { tone: 99 }, // Very light
  onSurface: { tone: 10 }, // Very dark
  // Contrast: ~15:1
};

// Dark theme - NOT just inverted
const darkTheme = {
  surface: { tone: 10 }, // Very dark
  onSurface: { tone: 90 }, // Light, not white
  // Contrast: ~13:1 (slightly less harsh)
};
```

### Transparency and Overlays

Colors with transparency need special handling:

```javascript
function getEffectiveColor(foreground, background, alpha) {
  // Composite the colors
  const composite = blendColors(foreground, background, alpha);

  // Check contrast of composite
  return getContrastRatio(composite, background);
}

// Ensure minimum opacity for text
const minOpacity = {
  normalText: 0.87, // ~87% opacity minimum
  secondaryText: 0.6, // ~60% for secondary
  disabledText: 0.38, // ~38% for disabled
};
```

## Implementation Examples

### React Component

```jsx
function AccessibleButton({ color, children }) {
  const [textColor, setTextColor] = useState("#ffffff");

  useEffect(() => {
    // Automatically choose accessible text color
    const accessible = getAccessibleTextColor(color);
    setTextColor(accessible);
  }, [color]);

  return (
    <button
      style={{
        backgroundColor: color,
        color: textColor,
      }}
      aria-label={children}
    >
      {children}
    </button>
  );
}
```

### CSS Custom Properties

```css
:root {
  /* Define with guaranteed contrast */
  --color-background: hsl(0, 0%, 98%);
  --color-text: hsl(0, 0%, 13%);
  /* Contrast ratio: 15.3:1 ✓ */

  --color-primary: hsl(239, 84%, 67%);
  --color-on-primary: hsl(0, 0%, 100%);
  /* Contrast ratio: 4.6:1 ✓ */
}

/* High contrast mode */
@media (prefers-contrast: high) {
  :root {
    --color-background: hsl(0, 0%, 100%);
    --color-text: hsl(0, 0%, 0%);
    /* Contrast ratio: 21:1 ✓ */
  }
}
```

### Validation Tool

```javascript
class AccessibilityValidator {
  constructor(minRatio = 4.5) {
    this.minRatio = minRatio;
  }

  validate(theme) {
    const issues = [];

    Object.entries(theme).forEach(([role, color]) => {
      const background = this.getBackground(role, theme);
      const ratio = getContrastRatio(color, background);

      if (ratio < this.minRatio) {
        issues.push({
          role,
          color,
          background,
          ratio,
          required: this.minRatio,
          suggestion: this.suggestFix(color, background),
        });
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }

  suggestFix(fg, bg) {
    return adjustForContrast(fg, bg, this.minRatio);
  }
}
```

## Resources

### Testing Tools

- Chrome DevTools (Lighthouse)
- Firefox Accessibility Inspector
- axe DevTools
- WAVE (WebAIM)
- Stark (Figma/Sketch plugin)

### Guidelines

- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/)
- [Material Design Accessibility](https://m3.material.io/foundations/accessible-design)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## See Also

- [HCT System](./hct.md) - Tone-based contrast
- [Material Design](./material-design.md) - Contrast levels
- [Theme Matching](./theme-matching.md) - Accessibility scoring
- [Color Spaces](./color-spaces.md) - Understanding luminance
