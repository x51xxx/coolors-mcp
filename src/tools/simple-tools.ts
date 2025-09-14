import { z } from "zod";

import { UnifiedTool } from "./registry.js";

const pingArgsSchema = z.object({
  prompt: z.string().default("").describe("Message to echo "),
});

export const pingTool: UnifiedTool = {
  category: "simple",
  description: "Echo",
  execute: async (args) => {
    const message = args.prompt || args.message || "Pong!";
    // Return message directly to avoid cross-platform issues with echo command
    return message as string;
  },
  name: "ping",
  prompt: {
    description: "Echo test message with structured response.",
  },
  zodSchema: pingArgsSchema,
};

const helpArgsSchema = z.object({});

export const helpTool: UnifiedTool = {
  category: "simple",
  description: "receive help information",
  execute: async () => {
    return "Help information for Coolors MCP:\n\nAvailable tools for color manipulation, theme generation, and CSS refactoring.\nSee documentation for details.";
  },
  name: "Help",
  prompt: {
    description: "receive help information",
  },
  zodSchema: helpArgsSchema,
};
