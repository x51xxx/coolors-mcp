#!/usr/bin/env node

/**
 * Coolors MCP Server - Advanced Color Operations & Theme Intelligence
 *
 * A comprehensive Model Context Protocol server providing:
 * - Color space conversions (RGB, HSL, HSV, LAB, XYZ, HCT)
 * - Material Design 3 theme generation with tonal palettes
 * - Intelligent CSS theme matching with multi-factor scoring
 * - Image color extraction using Celebi quantization
 * - WCAG accessibility compliance checking
 * - Universal color preference analysis (dislike detection)
 * - Context-aware color selection for UI components
 *
 * Built on Google's HCT color space for perceptually uniform operations
 * and Material Color Utilities algorithms for professional-grade results.
 */

import { createRequire } from "node:module";

import { CoolorsMcp } from "../coolors-mcp.js";
import * as tools from "../tools/index.js";

// src/bin/server.ts and dist/bin/server.js both sit two levels below the
// package root, so the version always comes from the shipped package.json.
const packageJson = createRequire(import.meta.url)("../../package.json") as {
  version: string;
};

// Create the MCP server
const server = new CoolorsMcp({
  instructions:
    "Advanced perceptual color theory & UI design server. Compensates for agent hex blindness: use describe_color to 'see' any hex/CSS color, fix_contrast to solve WCAG/APCA contrast without guessing, design_ui_palette for verified 60-30-10 Light/Dark UI tokens, audit_ui_colors for one-shot pair & CVD checks, and generate_categorical_palette for color-blind-safe chart/tag palettes. Supports hex, CSS named colors, rgb(), hsl(), oklch(), oklab(), and hct().",
  name: "coolors-mcp",
  version: packageJson.version as `${number}.${number}.${number}`,
});

// Agent-compensating color intelligence
server.addTool(tools.describeColorTool);
server.addTool(tools.fixContrastTool);
server.addTool(tools.designUiPaletteTool);
server.addTool(tools.auditUiColorsTool);
server.addTool(tools.generateCategoricalPaletteTool);

// Core color operations: conversion, distance metrics, accessibility
server.addTool(tools.colorConversionTool);
server.addTool(tools.colorDistanceTool);
server.addTool(tools.contrastCheckerTool);
server.addTool(tools.adjustColorTool);
server.addTool(tools.paletteGeneratorTool);
server.addTool(tools.paletteWithLocksTool);
server.addTool(tools.gradientGeneratorTool);
server.addTool(tools.exportPaletteTool);

// Color-blindness simulation & accessibility audit
server.addTool(tools.simulateColorBlindnessTool);
server.addTool(tools.checkPaletteAccessibilityTool);

// Visual cohesion: tonal scales, state colors, palette consistency, semantics
server.addTool(tools.generateTonalScaleTool);
server.addTool(tools.generateStateColorsTool);
server.addTool(tools.analyzePaletteConsistencyTool);
server.addTool(tools.generateSemanticPaletteTool);

// Material Design 3: theme generation, harmonization, tonal palettes
server.addTool(tools.generateMaterialThemeTool);
server.addTool(tools.harmonizeColorsTool);
server.addTool(tools.generateTonalPaletteTool);

// CSS theme intelligence: matching, refactoring, migration
server.addTool(tools.matchThemeColorTool);
server.addTool(tools.refactorCssWithThemeTool);
server.addTool(tools.matchThemeColorsBatchTool);
server.addTool(tools.generateThemeCssTool);

// Image analysis: color extraction, theme generation from photos
server.addTool(tools.extractImageColorsTool);
server.addTool(tools.generateThemeFromImageTool);

// DESIGN.md: audit design-system color tokens
server.addTool(tools.auditDesignMdTool);

// Color psychology: detect and fix universally disliked colors
server.addTool(tools.analyzeColorLikabilityTool);
server.addTool(tools.fixDislikedColorsBatchTool);

// Start the server
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
