import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { GetPromptResult, Root } from "@modelcontextprotocol/sdk/types.js";
import { StandardSchemaV1 } from "@standard-schema/spec";

export type AudioContent = {
  data: string;
  mimeType: string;
  type: "audio";
};

export type Content =
  | AudioContent
  | ImageContent
  | ResourceContent
  | ResourceLink
  | TextContent;

export type ContentResult = {
  content: Content[];
  isError?: boolean;
};

export type Context<T extends CoolorsMCPSessionAuth> = {
  client: {
    version: ReturnType<Server["getClientVersion"]>;
  };
  log: {
    debug: (message: string, data?: SerializableValue) => void;
    error: (message: string, data?: SerializableValue) => void;
    info: (message: string, data?: SerializableValue) => void;
    warn: (message: string, data?: SerializableValue) => void;
  };
  reportProgress: (progress: Progress) => Promise<void>;
  session: T | undefined;
  streamContent: (content: Content | Content[]) => Promise<void>;
};

export type CoolorsMCPEvents = {
  connect: (event: { session: any }) => void;
  disconnect: (event: { session: any }) => void;
};

export type CoolorsMCPSessionAuth = Record<string, unknown> | undefined;

export type CoolorsMCPSessionData = Record<string, unknown>;

export type CoolorsMCPSessionEvents = {
  error: (event: { error: Error }) => void;
  ready: () => void;
  rootsChanged: (event: { roots: Root[] }) => void;
};

export type ImageContent = {
  data: string;
  mimeType: string;
  type: "image";
};

export type Literal = boolean | null | number | string | undefined;

export interface Logger {
  debug(...args: unknown[]): void;

  error(...args: unknown[]): void;

  info(...args: unknown[]): void;

  log(...args: unknown[]): void;

  warn(...args: unknown[]): void;
}

export type LoggingLevel =
  | "alert"
  | "critical"
  | "debug"
  | "emergency"
  | "error"
  | "info"
  | "notice"
  | "warning";

export type Progress = {
  progress: number;
  total?: number;
};

export type PromptResult = Pick<GetPromptResult, "messages"> | string;

export type ResourceContent = {
  resource: {
    blob?: string;
    mimeType?: string;
    text?: string;
    uri: string;
  };
  type: "resource";
};

export type ResourceLink = {
  description?: string;
  mimeType?: string;
  name: string;
  title?: string;
  type: "resource_link";
  uri: string;
};

export type SerializableValue =
  | { [key: string]: SerializableValue }
  | Literal
  | SerializableValue[];

export type ServerOptions<T extends CoolorsMCPSessionAuth> = {
  authenticate?: (request: unknown) => Promise<T>;
  health?: {
    enabled?: boolean;
    message?: string;
    path?: string;
    status?: number;
  };
  instructions?: string;
  logger?: Logger;
  name: string;
  ping?: {
    enabled?: boolean;
    intervalMs?: number;
    logLevel?: LoggingLevel;
  };
  roots?: {
    enabled?: boolean;
  };
  utils?: {
    formatInvalidParamsErrorMessage?: (
      issues: readonly StandardSchemaV1.Issue[],
    ) => string;
  };
  version: `${number}.${number}.${number}`;
};

export type TextContent = {
  text: string;
  type: "text";
};

export type Tool<
  T extends CoolorsMCPSessionAuth,
  Params extends ToolParameters = ToolParameters,
> = {
  annotations?: {
    streamingHint?: boolean;
  } & ToolAnnotations;
  canAccess?: (auth: T) => boolean;
  description?: string;

  execute: (
    args: StandardSchemaV1.InferOutput<Params>,
    context: Context<T>,
  ) => Promise<
    | AudioContent
    | ContentResult
    | ImageContent
    | ResourceContent
    | ResourceLink
    | string
    | TextContent
    | void
  >;
  name: string;
  parameters?: Params;
  timeoutMs?: number;
};

export type ToolAnnotations = {
  destructiveHint?: boolean;
  idempotentHint?: boolean;
  openWorldHint?: boolean;
  readOnlyHint?: boolean;
  title?: string;
};

export type ToolParameters = StandardSchemaV1;
