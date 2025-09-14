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

import { CoolorsMcp } from "../coolors-mcp.js";
import * as tools from "../tools/index.js";

// Create the MCP server
const server = new CoolorsMcp({
  instructions:
    "Advanced color operations server with Material Design 3 support, CSS theme matching, image extraction, and accessibility compliance. Uses HCT color space for perceptually accurate operations.",
  name: "coolors-mcp",
  version: "1.0.0",
});

// Core color operations: conversion, distance metrics, accessibility
server.addTool(tools.colorConversionTool);
server.addTool(tools.colorDistanceTool);
server.addTool(tools.contrastCheckerTool);
server.addTool(tools.paletteGeneratorTool);
server.addTool(tools.paletteWithLocksTool);
server.addTool(tools.gradientGeneratorTool);

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

// Color psychology: detect and fix universally disliked colors
server.addTool(tools.analyzeColorLikabilityTool);
server.addTool(tools.fixDislikedColorsBatchTool);

// Start the server
server.start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
