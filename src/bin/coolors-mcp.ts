#!/usr/bin/env node

import { execa } from "execa";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

await yargs(hideBin(process.argv))
  .scriptName("coolors-mcp")
  .command(
    "dev <file>",
    "Start a development server",
    (yargs) => {
      return yargs
        .positional("file", {
          demandOption: true,
          describe: "The path to the server file",
          type: "string",
        })

        .option("watch", {
          alias: "w",
          default: false,
          describe: "Watch for file changes and restart server",
          type: "boolean",
        })

        .option("verbose", {
          alias: "v",
          default: false,
          describe: "Enable verbose logging",
          type: "boolean",
        });
    },

    async (argv) => {
      try {
        const command = argv.watch
          ? `npx @wong2/mcp-cli npx tsx --watch ${argv.file}`
          : `npx @wong2/mcp-cli npx tsx ${argv.file}`;

        if (argv.verbose) {
          console.log(`[CoolorsMCP] Starting server: ${command}`);
          console.log(`[CoolorsMCP] File: ${argv.file}`);
          console.log(
            `[CoolorsMCP] Watch mode: ${argv.watch ? "enabled" : "disabled"}`,
          );
        }

        const { stdout } = await execa({
          shell: true,
          stderr: "inherit",
          stdin: "inherit",
        })`${command}`;

        console.log(stdout);
      } catch (error) {
        console.error(
          "[CoolorsMCP Error] Failed to start development server:",
          error instanceof Error ? error.message : String(error),
        );

        if (argv.verbose && error instanceof Error && error.stack) {
          console.error("[CoolorsMCP Debug] Stack trace:", error.stack);
        }

        process.exit(1);
      }
    },
  )

  .command(
    "inspect <file>",
    "Inspect a server file",
    (yargs) => {
      return yargs.positional("file", {
        demandOption: true,
        describe: "The path to the server file",
        type: "string",
      });
    },

    async (argv) => {
      try {
        await execa({
          stderr: "inherit",
          stdout: "inherit",
        })`npx @modelcontextprotocol/inspector npx tsx ${argv.file}`;
      } catch (error) {
        console.error(
          "[CoolorsMCP Error] Failed to inspect server:",
          error instanceof Error ? error.message : String(error),
        );

        process.exit(1);
      }
    },
  )

  .command(
    "validate <file>",
    "Validate a CoolorsMCP server file for syntax and basic structure",
    (yargs) => {
      return yargs
        .positional("file", {
          demandOption: true,
          describe: "The path to the server file",
          type: "string",
        })

        .option("strict", {
          alias: "s",
          default: false,
          describe: "Enable strict validation (type checking)",
          type: "boolean",
        });
    },

    async (argv) => {
      try {
        const { existsSync } = await import("fs");
        const { resolve } = await import("path");
        const filePath = resolve(argv.file);

        if (!existsSync(filePath)) {
          console.error(`[CoolorsMCP Error] File not found: ${filePath}`);
          process.exit(1);
        }

        console.log(`[CoolorsMCP] Validating server file: ${filePath}`);

        const command = argv.strict
          ? `npx tsc --noEmit --strict ${filePath}`
          : `npx tsc --noEmit ${filePath}`;

        try {
          await execa({
            shell: true,
            stderr: "pipe",
            stdout: "pipe",
          })`${command}`;

          console.log("[CoolorsMCP] ✓ TypeScript compilation successful");
        } catch (tsError) {
          console.error("[CoolorsMCP] ✗ TypeScript compilation failed");

          if (tsError instanceof Error && "stderr" in tsError) {
            console.error(tsError.stderr);
          }

          process.exit(1);
        }

        try {
          await execa({
            shell: true,
            stderr: "pipe",
            stdout: "pipe",
          })`node -e "
            (async () => {
              try {
                const { CoolorsMCP } = await import('coolors-mcp');
                await import('file://${filePath}');
                console.log('[CoolorsMCP] ✓ Server structure validation passed');
              } catch (error) {
                console.error('[CoolorsMCP] ✗ Server structure validation failed:', error.message);
                process.exit(1);
              }
            })();
          "`;
        } catch {
          console.error("[CoolorsMCP] ✗ Server structure validation failed");
          console.error(
            "Make sure the file properly imports and uses CoolorsMCP",
          );

          process.exit(1);
        }

        console.log(
          "[CoolorsMCP] ✓ All validations passed! Server file looks good.",
        );
      } catch (error) {
        console.error(
          "[CoolorsMCP Error] Validation failed:",
          error instanceof Error ? error.message : String(error),
        );

        process.exit(1);
      }
    },
  )

  .help()
  .parseAsync();
