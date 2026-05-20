// Tool Registry Index - Export all tools

export { adjustColorTool } from "./adjust-color.tool.js";
// Visual cohesion: tonal scales, state colors, palette consistency
export {
  analyzePaletteConsistencyTool,
  generateSemanticPaletteTool,
  generateStateColorsTool,
  generateTonalScaleTool,
} from "./cohesion.tools.js";
// Color-blindness simulation & accessibility audit
export {
  checkPaletteAccessibilityTool,
  simulateColorBlindnessTool,
} from "./color-blindness.tool.js";
// Color tools
export { colorConversionTool } from "./color-conversion.tool.js";
export { colorDistanceTool } from "./color-distance.tool.js";
export { contrastCheckerTool } from "./contrast-checker.tool.js";

// Dislike analyzer tools
export {
  analyzeColorLikabilityTool,
  fixDislikedColorsBatchTool,
} from "./dislike-analyzer.tool.js";

export { gradientGeneratorTool } from "./gradient-generator.tool.js";

// Image extraction tools
export {
  extractImageColorsTool,
  generateThemeFromImageTool,
} from "./image-extraction.tools.js";

// Material Design tools
export {
  generateMaterialThemeTool,
  generateTonalPaletteTool,
  harmonizeColorsTool,
} from "./material-theme.tools.js";

export { exportPaletteTool } from "./palette-export.tool.js";
export { paletteGeneratorTool } from "./palette-generator.tool.js";
export { paletteWithLocksTool } from "./palette-with-locks.tool.js";

// Theme matching tools
export {
  generateThemeCssTool,
  matchThemeColorsBatchTool,
  matchThemeColorTool,
  refactorCssWithThemeTool,
} from "./theme-matching.tools.js";
