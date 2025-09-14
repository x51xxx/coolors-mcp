import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { EventEmitter } from "events";
import { StrictEventEmitter } from "strict-event-emitter-types";

import { CoolorsMCPSession } from "./session.js";
import {
  CoolorsMCPEvents,
  CoolorsMCPSessionAuth,
  ServerOptions,
  Tool,
  ToolParameters,
} from "./types.js";

export class CoolorsMcp extends (EventEmitter as {
  new (): StrictEventEmitter<EventEmitter, CoolorsMCPEvents>;
}) {
  #sessions: CoolorsMCPSession[] = [];
  #tools: Tool<CoolorsMCPSessionAuth>[] = [];

  constructor(public options: ServerOptions<CoolorsMCPSessionAuth>) {
    super();
  }

  public addTool<Params extends ToolParameters>(
    tool: Tool<CoolorsMCPSessionAuth, Params>,
  ) {
    this.#tools.push(tool as unknown as Tool<CoolorsMCPSessionAuth>);
  }

  public async start() {
    const transport = new StdioServerTransport();
    const session = new CoolorsMCPSession(this.options, this.#tools);
    this.#sessions.push(session);
    await session.connect(transport);
    this.emit("connect", { session });
  }
}
