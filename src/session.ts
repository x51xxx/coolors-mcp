import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { EventEmitter } from "events";
import { StrictEventEmitter } from "strict-event-emitter-types";
import { toJsonSchema } from "xsschema";

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
      { capabilities: { tools: {} } },
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
                ? await toJsonSchema(tool.parameters)
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
          request.params.arguments,
        );

        if (parsed.issues) {
          const friendlyErrors = parsed.issues
            .map((issue) => {
              const path = issue.path?.join(".") || "root";
              return `${path}: ${issue.message}`;
            })
            .join(", ");

          throw new McpError(
            ErrorCode.InvalidParams,
            `Tool '${request.params.name}' parameter validation failed: ${friendlyErrors}. Please check the parameter types and values according to the tool's schema.`,
          );
        }

        args = parsed.value;
      }

      const result = await tool.execute(
        args as Parameters<typeof tool.execute>[0],
        {} as CoolorsMCPSessionAuth,
      );

      if (typeof result === "string") {
        return {
          content: [{ text: result, type: "text" }],
        };
      }

      return result;
    });
  }
}
