# Creating Themes Examples

Learn how to create comprehensive color themes using Material Design 3 principles and Coolors MCP's advanced theme generation tools.

## Quick Start

### Generate from a Single Color

```javascript
// Create a complete theme from one color
"Generate a Material Design theme from #6366f1";

// Result: Complete light and dark schemes with:
// - Primary, secondary, tertiary, neutral, error palettes
// - Surface colors with elevation levels
// - Semantic color roles
// - Accessible color pairs
```

### Generate from an Image

```javascript
// Extract colors and create theme
"Generate a theme from this logo image";

// Process:
// 1. Extracts dominant colors using Celebi algorithm
// 2. Scores colors for UI suitability
// 3. Generates harmonious Material Design theme
// 4. Provides both light and dark modes
```

## Complete Theme Examples

### Brand Theme Creation

Starting with brand colors to create a full design system:

```javascript
// Brand colors
const brandColors = {
  primary: "#6366f1",    // Indigo
  secondary: "#ec4899",  // Pink
  accent: "#10b981"      // Emerald
};

// Generate Material Design 3 theme
const theme = generateMaterialTheme({
  sourceColor: brandColors.primary,
  customColors: [
    { name: "brand", color: brandColors.primary },
    { name: "accent", color: brandColors.accent }
  ]
});

// Result structure
{
  schemes: {
    light: {
      // Primary colors
      primary: "#5256c9",
      onPrimary: "#ffffff",
      primaryContainer: "#e0e0ff",
      onPrimaryContainer: "#070764",

      // Secondary colors
      secondary: "#5d5d72",
      onSecondary: "#ffffff",
      secondaryContainer: "#e2e0f9",
      onSecondaryContainer: "#1a1b2e",

      // Tertiary colors
      tertiary: "#79536a",
      onTertiary: "#ffffff",
      tertiaryContainer: "#ffd8ec",
      onTertiaryContainer: "#2e1125",

      // Surface colors
      surface: "#fffbff",
      onSurface: "#1b1b1f",
      surfaceVariant: "#e4e1ec",
      onSurfaceVariant: "#46464f",

      // Additional roles
      outline: "#777680",
      outlineVariant: "#c7c5d0",
      shadow: "#000000",
      scrim: "#000000",
      inverseSurface: "#303034",
      inverseOnSurface: "#f2eff4",
      inversePrimary: "#bfc1ff"
    },
    dark: {
      // Dark theme colors...
    }
  },
  palettes: {
    primary: { /* Tonal palette 0-100 */ },
    secondary: { /* Tonal palette 0-100 */ },
    tertiary: { /* Tonal palette 0-100 */ },
    neutral: { /* Tonal palette 0-100 */ },
    neutralVariant: { /* Tonal palette 0-100 */ },
    error: { /* Tonal palette 0-100 */ }
  },
  customColors: [
    {
      name: "brand",
      light: { /* Custom color light scheme */ },
      dark: { /* Custom color dark scheme */ }
    }
  ]
}
```

### Application Themes

#### SaaS Dashboard Theme

```javascript
// Professional dashboard colors
const dashboardTheme = {
  sourceColor: "#2563eb", // Blue
  variant: "neutral", // Minimal color variation
  contrastLevel: 0, // Standard contrast
};

// Generated theme emphasizes:
// - Professional appearance
// - High readability
// - Clear hierarchy
// - Subtle color usage

const result = {
  light: {
    // Main UI
    surface: "#fffbff",
    surfaceContainer: "#f5f5f5",
    surfaceContainerHigh: "#ebebeb",

    // Navigation
    primary: "#2563eb",
    primaryContainer: "#dce4ff",

    // Data visualization
    chart1: "#2563eb",
    chart2: "#10b981",
    chart3: "#f59e0b",
    chart4: "#ef4444",

    // Status colors
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#3b82f6",
  },
};
```

#### E-commerce Theme

```javascript
// Vibrant shopping experience
const ecommerceTheme = {
  sourceColor: "#ec4899", // Pink
  variant: "vibrant", // Higher chroma
  contrastLevel: 0.5, // Medium contrast
};

// Features:
// - Engaging, energetic colors
// - Clear CTAs
// - Product emphasis
// - Sale/promotion support

const shopTheme = {
  light: {
    // Product cards
    surface: "#fffbff",
    surfaceVariant: "#ffeef6",

    // CTAs
    buyButton: "#ec4899",
    onBuyButton: "#ffffff",

    // Promotions
    saleBadge: "#ef4444",
    newBadge: "#10b981",

    // Reviews
    starActive: "#f59e0b",
    starInactive: "#e5e7eb",
  },
};
```

#### Music Player Theme

```javascript
// Dynamic album-based theming
async function createMusicTheme(albumArtUrl) {
  // Extract colors from album art
  const imageColors = await extractImageColors(albumArtUrl);

  // Generate theme from dominant color
  const theme = await generateThemeFromImage({
    imageData: imageColors,
    variant: "expressive", // Creative combinations
    contrastLevel: 0,
  });

  return {
    // Player background (dark for immersion)
    playerBg: theme.dark.surface,

    // Controls
    playButton: theme.dark.primary,
    controls: theme.dark.onSurface,

    // Progress bar
    progressBar: theme.dark.primary,
    progressBg: theme.dark.surfaceVariant,

    // Album info
    artistName: theme.dark.onSurface,
    songTitle: theme.dark.onSurfaceVariant,

    // Visualizer colors
    visualizer: [theme.dark.primary, theme.dark.secondary, theme.dark.tertiary],
  };
}
```

### Design System Creation

#### Complete Design System

```javascript
// Foundation color
const systemFoundation = "#6366f1";

// Generate comprehensive system
const designSystem = {
  // Core palettes
  palettes: generateTonalPalettes(systemFoundation),

  // Semantic colors
  semantic: {
    // Actions
    action: {
      primary: "#6366f1",
      secondary: "#8b92ff",
      disabled: "#c7c7c7",
    },

    // Feedback
    feedback: {
      success: "#10b981",
      warning: "#f59e0b",
      error: "#ef4444",
      info: "#3b82f6",
    },

    // Content
    content: {
      primary: "#1f2937",
      secondary: "#4b5563",
      disabled: "#9ca3af",
      inverse: "#ffffff",
    },
  },

  // Component tokens
  components: {
    button: {
      primary: {
        bg: "palette.primary.500",
        text: "white",
        hover: "palette.primary.600",
        active: "palette.primary.700",
      },
      secondary: {
        bg: "palette.primary.100",
        text: "palette.primary.700",
        hover: "palette.primary.200",
        active: "palette.primary.300",
      },
    },

    input: {
      bg: "white",
      border: "palette.neutral.300",
      text: "content.primary",
      placeholder: "content.secondary",
      focus: "palette.primary.500",
    },

    card: {
      bg: "white",
      border: "palette.neutral.200",
      shadow: "0 1px 3px rgba(0,0,0,0.1)",
    },
  },
};
```

## Theme Variants

### Material Design 3 Variants

Each variant creates a different aesthetic:

```javascript
// TonalSpot (Default)
// Balanced, versatile theme
{
  sourceColor: "#6366f1",
  variant: "tonalSpot"
}
// Result: Subtle secondary/tertiary colors

// Fidelity
// Preserves brand color exactly
{
  sourceColor: "#ff5722",  // Brand orange
  variant: "fidelity"
}
// Result: Primary palette matches brand precisely

// Vibrant
// Energetic, playful theme
{
  sourceColor: "#6366f1",
  variant: "vibrant"
}
// Result: Higher chroma throughout

// Expressive
// Creative, unexpected combinations
{
  sourceColor: "#6366f1",
  variant: "expressive"
}
// Result: Unique secondary/tertiary colors

// Neutral
// Professional, minimal color
{
  sourceColor: "#6366f1",
  variant: "neutral"
}
// Result: Grayed secondary colors

// Monochrome
// Single-hue theme
{
  sourceColor: "#6366f1",
  variant: "monochrome"
}
// Result: All colors from same hue family
```

### Contrast Levels

Adjust contrast for accessibility needs:

```javascript
// Standard contrast (WCAG AA)
const standard = {
  sourceColor: "#6366f1",
  contrastLevel: 0, // Default
};

// Medium contrast (Between AA and AAA)
const medium = {
  sourceColor: "#6366f1",
  contrastLevel: 0.5,
};

// High contrast (WCAG AAA)
const high = {
  sourceColor: "#6366f1",
  contrastLevel: 1.0,
};

// Results in different tone mappings:
// Standard: primary on primaryContainer = 4.5:1
// Medium: primary on primaryContainer = 7:1
// High: primary on primaryContainer = 10:1
```

## Dynamic Theming

### User Preference Based

```javascript
// Adapt to user preferences
function createUserTheme(preferences) {
  const {
    favoriteColor,
    contrastNeeds, // "normal", "high", "maximum"
    colorBlindness, // null, "protanopia", "deuteranopia", etc.
    darkMode,
  } = preferences;

  // Base theme
  let theme = generateMaterialTheme({
    sourceColor: favoriteColor,
    contrastLevel: contrastNeeds === "high" ? 1.0 : 0,
  });

  // Adjust for color blindness
  if (colorBlindness) {
    theme = adjustForColorBlindness(theme, colorBlindness);
  }

  // Return appropriate scheme
  return darkMode ? theme.schemes.dark : theme.schemes.light;
}
```

### Time-Based Themes

```javascript
// Change theme based on time of day
function getTimeBasedTheme() {
  const hour = new Date().getHours();

  if (hour < 6) {
    // Night theme (very dark)
    return {
      sourceColor: "#1a1a2e",
      variant: "monochrome",
      scheme: "dark",
    };
  } else if (hour < 12) {
    // Morning theme (bright, energetic)
    return {
      sourceColor: "#fbbf24",
      variant: "vibrant",
      scheme: "light",
    };
  } else if (hour < 18) {
    // Afternoon theme (balanced)
    return {
      sourceColor: "#3b82f6",
      variant: "tonalSpot",
      scheme: "light",
    };
  } else {
    // Evening theme (warm, relaxed)
    return {
      sourceColor: "#f97316",
      variant: "neutral",
      scheme: "dark",
    };
  }
}
```

### Content-Aware Themes

```javascript
// Generate theme based on content
async function createContentTheme(contentType, contentData) {
  switch (contentType) {
    case "article":
      // Clean, readable theme
      return {
        sourceColor: "#1f2937",
        variant: "neutral",
        contrastLevel: 0.5,
      };

    case "gallery":
      // Let images stand out
      return {
        sourceColor: contentData.dominantColor,
        variant: "monochrome",
        scheme: "dark",
      };

    case "video":
      // Dark, immersive theme
      return {
        sourceColor: "#0f172a",
        variant: "monochrome",
        scheme: "dark",
      };

    case "product":
      // Match product color
      return generateThemeFromImage(contentData.productImage);
  }
}
```

## CSS Generation

### CSS Custom Properties

```javascript
// Generate CSS variables
const cssTheme = generateThemeCSS({
  sourceColor: "#6366f1",
  prefix: "theme",
  includeTones: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99, 100]
});

// Output:
:root {
  /* Primary palette */
  --theme-primary-0: #000000;
  --theme-primary-10: #00006e;
  --theme-primary-20: #0001ac;
  --theme-primary-30: #1e2bdb;
  --theme-primary-40: #4046f4;
  --theme-primary-50: #6366f1;
  --theme-primary-60: #7f81ff;
  --theme-primary-70: #9da0ff;
  --theme-primary-80: #bcc0ff;
  --theme-primary-90: #dee0ff;
  --theme-primary-95: #eff0ff;
  --theme-primary-99: #fffbff;
  --theme-primary-100: #ffffff;

  /* Secondary, tertiary, neutral, error palettes... */
}

/* Dark mode overrides */
@media (prefers-color-scheme: dark) {
  :root {
    /* Dark scheme mappings */
  }
}
```

### Tailwind Configuration

```javascript
// Generate Tailwind config from theme
function generateTailwindConfig(theme) {
  return {
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: theme.primary,
            50: theme.palettes.primary[95],
            100: theme.palettes.primary[90],
            200: theme.palettes.primary[80],
            300: theme.palettes.primary[70],
            400: theme.palettes.primary[60],
            500: theme.palettes.primary[50],
            600: theme.palettes.primary[40],
            700: theme.palettes.primary[30],
            800: theme.palettes.primary[20],
            900: theme.palettes.primary[10],
            950: theme.palettes.primary[0],
          },
          surface: {
            DEFAULT: theme.surface,
            container: theme.surfaceContainer,
            variant: theme.surfaceVariant,
          },
        },
      },
    },
  };
}
```

### Sass/SCSS Variables

```scss
// Generate Sass variables
$theme-primary: #6366f1;
$theme-on-primary: #ffffff;
$theme-primary-container: #e0e0ff;
$theme-on-primary-container: #070764;

// Mixin for component theming
@mixin apply-theme($role: "surface") {
  @if $role == "primary" {
    background: $theme-primary;
    color: $theme-on-primary;
  } @else if $role == "primary-container" {
    background: $theme-primary-container;
    color: $theme-on-primary-container;
  }
}

// Usage
.button-primary {
  @include apply-theme("primary");
}
```

## Accessibility Considerations

### Ensuring Contrast

```javascript
// Validate theme accessibility
function validateThemeAccessibility(theme) {
  const checks = [
    // Text on backgrounds
    { fg: theme.onSurface, bg: theme.surface, min: 4.5 },
    { fg: theme.onPrimary, bg: theme.primary, min: 4.5 },
    { fg: theme.onSecondary, bg: theme.secondary, min: 4.5 },

    // Interactive elements
    { fg: theme.primary, bg: theme.surface, min: 3.0 },
    { fg: theme.outline, bg: theme.surface, min: 3.0 },
  ];

  const results = checks.map((check) => {
    const ratio = checkContrast(check.fg, check.bg);
    return {
      ...check,
      ratio,
      passes: ratio >= check.min,
    };
  });

  return {
    allPass: results.every((r) => r.passes),
    failures: results.filter((r) => !r.passes),
  };
}
```

### High Contrast Mode

```javascript
// Generate high contrast variant
function createHighContrastTheme(baseTheme) {
  return {
    ...baseTheme,
    // Maximize contrast
    surface: "#ffffff",
    onSurface: "#000000",

    // Bold colors
    primary: adjustTone(baseTheme.primary, 30),
    onPrimary: "#ffffff",

    // Strong outlines
    outline: "#000000",
    outlineVariant: "#424242",

    // Remove subtle variations
    surfaceVariant: "#ffffff",
    surfaceContainer: "#ffffff",
  };
}
```

### Color Blindness Support

```javascript
// Adjust theme for color blindness
function adjustForColorBlindness(theme, type) {
  switch (type) {
    case "protanopia": // Red-blind
      // Shift reds toward blue
      return shiftProblemColors(theme, ["red"], "blue");

    case "deuteranopia": // Green-blind
      // Enhance red-blue distinction
      return enhanceColorDistinction(theme, ["red", "blue"]);

    case "tritanopia": // Blue-blind
      // Use red-green distinction
      return shiftProblemColors(theme, ["blue"], "green");

    case "achromatopsia": // Total color blindness
      // Use only lightness variations
      return createMonochromeTheme(theme);
  }
}
```

## Real-World Examples

### News Website

```javascript
// Serious, trustworthy appearance
const newsTheme = {
  // Core colors
  primary: "#1e40af", // Deep blue
  secondary: "#dc2626", // Breaking news red
  neutral: "#1f2937", // Text

  // Sections
  politics: "#1e40af",
  business: "#059669",
  sports: "#ea580c",
  entertainment: "#9333ea",
  technology: "#0891b2",

  // UI elements
  surface: "#ffffff",
  surfaceRaised: "#f9fafb",
  border: "#e5e7eb",

  // Typography
  headline: "#111827",
  body: "#374151",
  caption: "#6b7280",
};
```

### Social Media Platform

```javascript
// Friendly, engaging theme
const socialTheme = generateMaterialTheme({
  sourceColor: "#3b82f6", // Facebook-like blue
  customColors: [
    { name: "like", color: "#ef4444" }, // Red heart
    { name: "share", color: "#10b981" }, // Green share
    { name: "comment", color: "#6366f1" }, // Blue comment
  ],
  variant: "vibrant",
});

// Additional social elements
const socialElements = {
  // User-generated content
  userPost: socialTheme.surface,
  userPostHover: socialTheme.surfaceVariant,

  // Interactions
  likeButton: "#ef4444",
  likeButtonActive: "#dc2626",

  // Status indicators
  online: "#10b981",
  away: "#f59e0b",
  offline: "#6b7280",
};
```

### Educational Platform

```javascript
// Clear, focused learning environment
const eduTheme = {
  // Subject colors
  math: "#3b82f6", // Blue
  science: "#10b981", // Green
  literature: "#8b5cf6", // Purple
  history: "#f59e0b", // Amber
  arts: "#ec4899", // Pink

  // Progress indicators
  notStarted: "#e5e7eb",
  inProgress: "#fbbf24",
  completed: "#10b981",

  // Difficulty levels
  beginner: "#10b981",
  intermediate: "#3b82f6",
  advanced: "#7c3aed",
  expert: "#dc2626",
};
```

## Theme Testing

### Visual Testing

```javascript
// Generate theme preview
function previewTheme(theme) {
  const preview = {
    // Color swatches
    swatches: Object.entries(theme).map(([name, color]) => ({
      name,
      color,
      hex: color,
      rgb: hexToRgb(color),
      hsl: hexToHsl(color),
    })),

    // Sample components
    components: {
      button: generateButtonPreview(theme),
      card: generateCardPreview(theme),
      form: generateFormPreview(theme),
    },

    // Accessibility report
    accessibility: validateThemeAccessibility(theme),

    // Color harmony analysis
    harmony: analyzeColorHarmony(theme),
  };

  return preview;
}
```

### Automated Testing

```javascript
// Test theme generation
describe("Theme Creation", () => {
  test("generates accessible color pairs", () => {
    const theme = generateMaterialTheme("#6366f1");

    // Check primary colors
    const ratio = getContrast(
      theme.schemes.light.primary,
      theme.schemes.light.onPrimary,
    );
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  test("maintains brand color fidelity", () => {
    const brand = "#ff5722";
    const theme = generateMaterialTheme({
      sourceColor: brand,
      variant: "fidelity",
    });

    const distance = colorDistance(brand, theme.schemes.light.primary);
    expect(distance).toBeLessThan(5);
  });
});
```

## Export Formats

### JSON Export

```javascript
// Export theme as JSON
const themeJson = {
  version: "1.0.0",
  name: "My Theme",
  author: "Designer Name",
  colors: theme,
  metadata: {
    created: new Date().toISOString(),
    sourceColor: "#6366f1",
    variant: "tonalSpot",
    contrastLevel: 0,
  },
};

fs.writeFileSync("theme.json", JSON.stringify(themeJson, null, 2));
```

### Design Tokens

```javascript
// Export as design tokens
const tokens = {
  color: {
    primary: {
      value: theme.primary,
      type: "color",
    },
    onPrimary: {
      value: theme.onPrimary,
      type: "color",
    },
  },
  spacing: {
    small: { value: "8px", type: "dimension" },
    medium: { value: "16px", type: "dimension" },
    large: { value: "24px", type: "dimension" },
  },
  typography: {
    heading: {
      value: {
        fontFamily: "Inter",
        fontSize: "24px",
        fontWeight: 600,
      },
      type: "typography",
    },
  },
};
```

## Next Steps

- Explore [Image Extraction](./image-extraction.md) for dynamic theme generation
- Learn about [CSS Refactoring](./css-refactoring.md) to apply themes
- Read [Material Design Concepts](../concepts/material-design.md) for theory
- Check [Theme Matching Tools](../tools/theme-matching.md) for implementation
