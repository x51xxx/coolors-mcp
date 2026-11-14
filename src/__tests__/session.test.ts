import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { CoolorsMCPSession } from "../session.js";
import { READ_ONLY_TOOL, ToolInputError } from "../tools/errors.js";

const echoTool = {
  annotations: READ_ONLY_TOOL,
  description: "test tool",
  execute: async (args: { color: string; metric?: string }) => {
    if (args.color === "bad") {
      throw new ToolInputError("Invalid color format: bad");
    }
    return `${args.color}:${args.metric}`;
  },
  name: "echo",
  parameters: z.object({
    color: z.string(),
    metric: z.enum(["a", "b"]).optional().default("a"),
  }),
};

describe("CoolorsMCPSession MCP contract", () => {
  const client = new Client({ name: "test", version: "0.0.0" });

  beforeAll(async () => {
    const [clientTransport, serverTransport] =
      InMemoryTransport.createLinkedPair();
    const session = new CoolorsMCPSession(
      { instructions: "Use echo.", name: "t", version: "0.0.1" },
      [echoTool as never],
    );
    await session.connect(serverTransport);
    await client.connect(clientTransport);
  });

  afterAll(async () => {
    await client.close();
  });

  it("sends server instructions", () => {
    expect(client.getInstructions()).toBe("Use echo.");
  });

  it("advertises input-mode schemas (defaulted fields are optional) and annotations", async () => {
    const { tools } = await client.listTools();
    expect(tools[0].inputSchema.required).toEqual(["color"]);
    expect(tools[0].annotations).toMatchObject({ readOnlyHint: true });
  });

  it("applies defaults and returns text content", async () => {
    const result = await client.callTool({
      arguments: { color: "#fff" },
      name: "echo",
    });
    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ text: "#fff:a", type: "text" }]);
  });

  it("reports validation failures as tool errors (isError)", async () => {
    const result = await client.callTool({
      arguments: { color: 42 },
      name: "echo",
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toMatch(/Invalid arguments/);
  });

  it("reports thrown tool errors as isError results", async () => {
    const result = await client.callTool({
      arguments: { color: "bad" },
      name: "echo",
    });
    expect(result.isError).toBe(true);
    expect(JSON.stringify(result.content)).toContain(
      "Invalid color format: bad",
    );
  });

  it("keeps unknown tools a protocol error", async () => {
    await expect(
      client.callTool({ arguments: {}, name: "nope" }),
    ).rejects.toThrow(/Unknown tool/);
  });
});
