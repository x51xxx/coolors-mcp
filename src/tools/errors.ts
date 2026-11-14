/**
 * Shared tool error + annotation helpers.
 *
 * Tools throw `ToolInputError` for bad input; the session turns any thrown
 * error into a `CallToolResult` with `isError: true`, so the calling model
 * sees the message and can correct itself (MCP 2025-11-25 tool errors).
 */

export class ToolInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolInputError";
  }
}

/**
 * Every tool here is a pure, local computation: no writes, no network.
 * (`idempotentHint` is about side effects and only matters when
 * `readOnlyHint` is false — MCP ToolAnnotations — so it is simply true here.)
 */
export const READ_ONLY_TOOL = {
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
  readOnlyHint: true,
} as const;
