import { Prompt, Tool } from "@modelcontextprotocol/sdk/types.js"; // Each tool definition includes its metadata, schema, prompt, and execution logic in one place.
import { ZodError, ZodTypeAny } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

export interface UnifiedTool {
  category?: "codex" | "simple" | "utility";
  description: string;
  execute: (
    args: Record<string, unknown>,
    onProgress?: (newOutput: string) => void,
  ) => Promise<string>;

  name: string;

  prompt?: {
    arguments?: Array<{
      description: string;
      name: string;
      required: boolean;
    }>;
    description: string;
  };
  zodSchema: ZodTypeAny;
}

export const toolRegistry: UnifiedTool[] = [];

export async function executeTool(
  toolName: string,
  args: Record<string, unknown>,
  onProgress?: (newOutput: string) => void,
): Promise<string> {
  const tool = toolRegistry.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Unknown tool: ${toolName}`);
  }
  try {
    const validatedArgs = tool.zodSchema.parse(args);
    return tool.execute(validatedArgs, onProgress);
  } catch (error) {
    if (error instanceof ZodError) {
      const issues = error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join(", ");
      throw new Error(`Invalid arguments for ${toolName}: ${issues}`);
    }
    throw error;
  }
}

export function getPromptDefinitions(): Prompt[] {
  // Helper to get MCP Prompt definitions from registry
  return toolRegistry
    .filter((tool) => tool.prompt)
    .map((tool) => ({
      arguments:
        tool.prompt!.arguments || extractPromptArguments(tool.zodSchema),
      description: tool.prompt!.description,
      name: tool.name,
    }));
}

export function getPromptMessage(
  toolName: string,
  args: Record<string, unknown>,
): string {
  const tool = toolRegistry.find((t) => t.name === toolName);
  if (!tool?.prompt) {
    throw new Error(`No prompt defined for tool: ${toolName}`);
  }
  const paramStrings: string[] = [];

  if (args.prompt) {
    paramStrings.push(args.prompt as string);
  }

  Object.entries(args).forEach(([key, value]) => {
    if (
      key !== "prompt" &&
      value !== undefined &&
      value !== null &&
      value !== false
    ) {
      if (typeof value === "boolean" && value) {
        paramStrings.push(`[${key}]`);
      } else if (typeof value !== "boolean") {
        paramStrings.push(`(${key}: ${value})`);
      }
    }
  });

  return `Use the ${toolName} tool${paramStrings.length > 0 ? ": " + paramStrings.join(" ") : ""}`;
}

export function getToolDefinitions(): Tool[] {
  // get Tool definitions from registry
  return toolRegistry.map((tool) => {
    const raw = zodToJsonSchema(tool.zodSchema, tool.name) as {
      definitions?: Record<string, unknown>;
      properties?: Record<string, unknown>;
      required?: string[];
    };
    const def = (raw.definitions?.[tool.name] ?? raw) as {
      properties?: Record<string, unknown>;
      required?: string[];
    };
    const inputSchema: Tool["inputSchema"] = {
      properties: def.properties || {},
      required: def.required || [],
      type: "object",
    };

    return {
      description: tool.description,
      inputSchema,
      name: tool.name,
    };
  });
}

export function toolExists(toolName: string): boolean {
  return toolRegistry.some((t) => t.name === toolName);
}

function extractPromptArguments(zodSchema: ZodTypeAny): Array<{
  description: string;
  name: string;
  required: boolean;
}> {
  const jsonSchema = zodToJsonSchema(zodSchema) as {
    properties?: Record<string, { description?: string }>;
    required?: string[];
  };
  const properties = jsonSchema.properties || {};
  const required = jsonSchema.required || [];

  return Object.entries(properties).map(([name, prop]) => ({
    description: prop.description || `${name} parameter`,
    name,
    required: required.includes(name),
  }));
}
