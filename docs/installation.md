# Installation

Coolors MCP is a stdio MCP server published on npm as [`@trishchuk/coolors-mcp`](https://www.npmjs.com/package/@trishchuk/coolors-mcp). Your MCP client starts it with `npx`, so there is nothing to install by hand.

## Requirements

- **Node.js 20 or newer.** Check with `node --version`.
- An MCP client that can launch stdio servers: Claude Code, Claude Desktop, Cursor and others.

The server needs no API keys, accounts, environment variables or configuration options. All 31 tools run locally and never use the network.

## Claude Code

```bash
claude mcp add coolors -- npx -y @trishchuk/coolors-mcp
```

The server is added to the current project by default. Add `--scope user` to make it available in all your projects:

```bash
claude mcp add --scope user coolors -- npx -y @trishchuk/coolors-mcp
```

Run `claude mcp list` in a terminal, or `/mcp` inside Claude Code, to check that `coolors` is connected.

## Claude Desktop

Open the configuration file:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

Add the server and restart Claude Desktop:

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp"]
    }
  }
}
```

## Cursor and other clients

Clients that use the `mcpServers` format take the same entry. For Cursor, put it in `.cursor/mcp.json` in your project or in `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp"]
    }
  }
}
```

For any other client, configure a stdio server with the command `npx` and the arguments `-y @trishchuk/coolors-mcp`.

## Global install

If you prefer not to go through `npx` on every start:

```bash
npm install -g @trishchuk/coolors-mcp
```

This installs a `coolors-mcp` command that starts the server.

```bash
claude mcp add coolors -- coolors-mcp
```

```json
{
  "mcpServers": {
    "coolors": {
      "command": "coolors-mcp"
    }
  }
}
```

## From source

The project uses [pnpm](https://pnpm.io) (`npm i -g pnpm` or `corepack enable`):

```bash
git clone https://github.com/x51xxx/coolors-mcp.git
cd coolors-mcp
pnpm install
pnpm run build
```

The server is built to `dist/bin/server.js`. Point your client at it with an absolute path:

```json
{
  "mcpServers": {
    "coolors-dev": {
      "command": "node",
      "args": ["/absolute/path/to/coolors-mcp/dist/bin/server.js"]
    }
  }
}
```

To call the tools by hand in a browser UI, run the built server under the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node dist/bin/server.js
```

## Verify the installation

Ask your assistant:

```
Convert #6366f1 to HSL
```

It calls `convert_color` with `{"color": "#6366f1", "to": "hsl"}` and gets back:

```
hsl(239, 84%, 67%)
```

Running `npx -y @trishchuk/coolors-mcp` in a terminal prints nothing: the server waits for MCP messages on stdin. Press `Ctrl+C` to stop it.

## Updating

`npx` reuses the version in its cache. To pick up a new release, ask for `@latest` in the arguments:

```json
{
  "mcpServers": {
    "coolors": {
      "command": "npx",
      "args": ["-y", "@trishchuk/coolors-mcp@latest"]
    }
  }
}
```

For a global install, run `npm install -g @trishchuk/coolors-mcp` again. Release notes are in the [Changelog](/changelog).

## Troubleshooting

- **The server does not start:** check that `node --version` is 20 or newer, and restart the client after editing its configuration.
- **An old version keeps running:** use `@trishchuk/coolors-mcp@latest`, or clear the npx cache.
- **A tool returns `Invalid color format`:** the color syntax is not supported. See the [supported color formats](/tools/README#supported-color-formats).

More cases and the exact error messages: [Troubleshooting](/resources/troubleshooting).

## Next steps

- [Getting Started](/getting-started): first calls with real output
- [Tools Overview](/tools/README): all 31 tools
- [GitHub Issues](https://github.com/x51xxx/coolors-mcp/issues): report a bug or request a feature
