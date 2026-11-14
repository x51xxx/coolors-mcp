import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { StandardSchemaV1 } from "@standard-schema/spec";
import { EventEmitter } from "node:events";
import { StrictEventEmitter } from "strict-event-emitter-types";
import { toJsonSchema } from "xsschema";
import { z } from "zod";

import {
  CoolorsMCPSessionAuth,
  CoolorsMCPSessionEvents,
  ServerOptions,
  Tool,
} from "./types.js";

export class CoolorsMCPSession extends (EventEmitter as {
  new (): StrictEventEmitter<EventEmitter, CoolorsMCPSessionEvents>;
}) {
  #server: Server;
  #tools: Tool<CoolorsMCPSessionAuth>[];

  constructor(
    options: ServerOptions<CoolorsMCPSessionAuth>,
    tools: Tool<CoolorsMCPSessionAuth>[],
  ) {
    super();
    this.#server = new Server(
      { name: options.name, version: options.version },
      {
        capabilities: { tools: {} },
        ...(options.instructions && { instructions: options.instructions }),
      },
    );
    this.#tools = tools;
    this.setupToolHandlers();
  }

  public async connect(transport: Transport) {
    await this.#server.connect(transport);
    this.emit("ready");
  }

  private setupToolHandlers() {
    this.#server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: await Promise.all(
          this.#tools.map(async (tool) => {
            return {
              annotations: tool.annotations,
              description: tool.description,
              inputSchema: tool.parameters
                ? await toInputJsonSchema(tool.parameters)
                : {
                    additionalProperties: false,
                    properties: {},
                    type: "object",
                  },
              name: tool.name,
            };
          }),
        ),
      };
    });

    this.#server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const tool = this.#tools.find(
        (tool) => tool.name === request.params.name,
      );

      if (!tool) {
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${request.params.name}`,
        );
      }

      let args: unknown = undefined;

      if (tool.parameters) {
        const parsed = await tool.parameters["~standard"].validate(
          request.params.arguments ?? {},
        );

        if (parsed.issues) {
          const friendlyErrors = parsed.issues
            .map((issue) => {
              const path =
                issue.path
                  ?.map((p) => (typeof p === "object" ? p.key : p))
                  .join(".") || "root";
              return `${path}: ${issue.message}`;
            })
            .join(", ");

          // Input validation errors are tool errors (isError), not protocol
          // errors, so the model can read them and retry (MCP 2025-11-25).
          return toolError(
            `Invalid arguments for tool '${request.params.name}': ${friendlyErrors}`,
          );
        }

        args = parsed.value;
      }

      const noop = () => {};
      const context = {
        client: { version: this.#server.getClientVersion() },
        log: { debug: noop, error: noop, info: noop, warn: noop },
        reportProgress: async () => {},
        session: undefined,
        streamContent: async () => {},
      };

      let result: Awaited<ReturnType<typeof tool.execute>>;
      try {
        result = await tool.execute(
          args as Parameters<typeof tool.execute>[0],
          context as Parameters<typeof tool.execute>[1],
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : String(error),
        );
      }

      if (typeof result === "string") {
        return {
          content: [{ text: result, type: "text" }],
        };
      }

      if ("content" in result) {
        return result;
      }

      // A bare content item (text/image/audio/resource) → wrap it.
      return { content: [result] };
    });
  }
}

/**
 * JSON Schema describing what a client may *send*: for zod schemas use input
 * mode so fields with defaults are optional (output mode marks them required).
 */
async function toInputJsonSchema(schema: StandardSchemaV1) {
  if (schema["~standard"].vendor === "zod") {
    return z.toJSONSchema(schema as unknown as z.ZodType, { io: "input" });
  }
  return toJsonSchema(schema);
}

function toolError(message: string) {
  return {
    content: [{ text: message, type: "text" as const }],
    isError: true,
  };
}
