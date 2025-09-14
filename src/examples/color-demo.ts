/**
 * Example demonstrating the color utilities module
 */

import {
  areColorsSimilar,
  // Distance metrics
  colorDistance,
  darken,
  findMostSimilarColor,
  getContrastRatio,

  // Utility functions
  getLuminance,
  hexToRgb,
  lighten,
  meetsContrastAA,
  mixColors,
  // Types
  type RGB,
  // Conversion functions
  rgbToHex,
  rgbToHsl,
  rgbToLab,
} from "../color/index.js";

// Example colors
const red: RGB = { b: 0, g: 0, r: 255 };
const blue: RGB = { b: 255, g: 0, r: 0 };
const green: RGB = { b: 0, g: 255, r: 0 };
const white: RGB = { b: 255, g: 255, r: 255 };
const black: RGB = { b: 0, g: 0, r: 0 };

console.log("=== Color Conversions ===");
console.log("Red to Hex:", rgbToHex(red)); // #ff0000
console.log("Hex to RGB:", hexToRgb("#00ff00")); // { r: 0, g: 255, b: 0 }
console.log("Red to HSL:", rgbToHsl(red)); // { h: 0, s: 100, l: 50 }
console.log("Red to LAB:", rgbToLab(red)); // L*a*b* color space

console.log("\n=== Color Distance Metrics ===");
console.log("Distance Red-Blue (Delta E 2000):", colorDistance(red, blue));
console.log("Distance Red-Green (Delta E 2000):", colorDistance(red, green));
console.log(
  "Are Red and slightly darker Red similar?",
  areColorsSimilar(red, { b: 5, g: 5, r: 250 }),
);

// Find most similar color from a palette
const palette: RGB[] = [
  { b: 0, g: 0, r: 200 }, // Dark red
  { b: 0, g: 200, r: 0 }, // Dark green
  { b: 200, g: 0, r: 0 }, // Dark blue
  { b: 100, g: 100, r: 255 }, // Light red
];

const target: RGB = { b: 50, g: 50, r: 255 }; // Reddish color
const mostSimilar = findMostSimilarColor(target, palette);
console.log("Most similar to reddish:", mostSimilar);

console.log("\n=== Color Utilities ===");
console.log("Luminance of white:", getLuminance(white)); // ~1.0
console.log("Luminance of black:", getLuminance(black)); // 0.0
console.log("Contrast ratio (black/white):", getContrastRatio(black, white)); // 21:1
console.log("Meets AA standard?", meetsContrastAA(black, white)); // true

console.log("\n=== Color Manipulation ===");
const lightRed = lighten(red, 20);
console.log("Lightened red:", lightRed);

const darkBlue = darken(blue, 30);
console.log("Darkened blue:", darkBlue);

const purple = mixColors(red, blue, 0.5);
console.log("Mix red and blue (purple):", purple);

console.log("\n=== Advanced Examples ===");

// Example 1: Check if a text color has enough contrast
function checkTextContrast(textColor: RGB, backgroundColor: RGB): void {
  const ratio = getContrastRatio(textColor, backgroundColor);
  const meetsAA = meetsContrastAA(textColor, backgroundColor);
  const meetsAAA = ratio >= 7.0; // AAA standard for normal text

  console.log(`Contrast ratio: ${ratio.toFixed(2)}:1`);
  console.log(`WCAG AA: ${meetsAA ? "✓" : "✗"}`);
  console.log(`WCAG AAA: ${meetsAAA ? "✓" : "✗"}`);
}

console.log("\nChecking dark gray on white:");
checkTextContrast({ b: 85, g: 85, r: 85 }, white);

// Example 2: Find perceptually different colors
function findDistinctColors(baseColor: RGB, candidates: RGB[]): RGB[] {
  return candidates.filter(
    (color) => colorDistance(baseColor, color, { metric: "deltaE2000" }) > 50,
  );
}

const distinctFromRed = findDistinctColors(red, palette);
console.log("\nColors distinct from red:", distinctFromRed);

// Example 3: Create a color scheme
function createMonochromaticScheme(baseColor: RGB, steps: number = 5): RGB[] {
  const scheme: RGB[] = [];
  const stepSize = 100 / (steps - 1);

  for (let i = 0; i < steps; i++) {
    const amount = stepSize * i - 50; // -50 to +50
    if (amount < 0) {
      scheme.push(darken(baseColor, Math.abs(amount)));
    } else if (amount > 0) {
      scheme.push(lighten(baseColor, amount));
    } else {
      scheme.push(baseColor);
    }
  }

  return scheme;
}

const blueScheme = createMonochromaticScheme(blue, 5);
console.log("\nMonochromatic blue scheme:");
blueScheme.forEach((color, i) => {
  console.log(`  Step ${i + 1}:`, rgbToHex(color));
});
