#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildInventory } from "./infer.js";
import { ConfigInventoryError, loadMcpConfigFile } from "./parser.js";
import { renderInventoryReport } from "./report.js";

interface CliOptions {
  config?: string;
  jsonOut?: string;
  claudeDesktop: boolean;
  help: boolean;
}

interface CliIo {
  cwd: string;
  stdout: Pick<NodeJS.WriteStream, "write">;
  stderr: Pick<NodeJS.WriteStream, "write">;
}

export async function runCli(
  argv = process.argv.slice(2),
  io: CliIo = {
    cwd: process.cwd(),
    stdout: process.stdout,
    stderr: process.stderr
  }
): Promise<number> {
  let options: CliOptions;

  try {
    options = parseArgs(argv);
  } catch (error) {
    io.stderr.write(`${error instanceof Error ? error.message : String(error)}\n\n`);
    io.stderr.write(usage());
    return 1;
  }

  if (options.help) {
    io.stdout.write(usage());
    return 0;
  }

  const configPath = options.config ?? (options.claudeDesktop ? defaultClaudeDesktopConfigPath() : undefined);

  if (!configPath) {
    io.stderr.write("Missing required --config <path> or --claude-desktop.\n\n");
    io.stderr.write(usage());
    return 1;
  }

  try {
    const resolvedConfigPath = path.resolve(io.cwd, configPath);
    const parsedConfig = await loadMcpConfigFile(resolvedConfigPath, configPath);
    const inventory = buildInventory(parsedConfig);

    if (options.jsonOut) {
      const jsonOutPath = path.resolve(io.cwd, options.jsonOut);
      await mkdir(path.dirname(jsonOutPath), { recursive: true });
      await writeFile(jsonOutPath, `${JSON.stringify(inventory, null, 2)}\n`, "utf8");
    }

    io.stdout.write(renderInventoryReport(inventory));
    return 0;
  } catch (error) {
    if (error instanceof ConfigInventoryError) {
      io.stderr.write(`${error.message}\n`);
      return 1;
    }

    const message = error instanceof Error ? error.message : String(error);
    io.stderr.write(`Unexpected error: ${message}\n`);
    return 1;
  }
}

export function defaultClaudeDesktopConfigPath(): string {
  if (process.platform === "darwin") {
    return path.join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }

  if (process.platform === "win32") {
    return path.join(
      process.env.APPDATA ?? path.join(homedir(), "AppData", "Roaming"),
      "Claude",
      "claude_desktop_config.json"
    );
  }

  return path.join(homedir(), ".config", "Claude", "claude_desktop_config.json");
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    claudeDesktop: false,
    help: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    switch (arg) {
      case "--config": {
        const value = argv[index + 1];

        if (!value || value.startsWith("--")) {
          throw new Error("Missing value for --config.");
        }

        options.config = value;
        index += 1;
        break;
      }
      case "--json-out": {
        const value = argv[index + 1];

        if (!value || value.startsWith("--")) {
          throw new Error("Missing value for --json-out.");
        }

        options.jsonOut = value;
        index += 1;
        break;
      }
      case "--claude-desktop":
        options.claudeDesktop = true;
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
      default:
        throw new Error(`Unknown option: ${arg}`);
    }
  }

  return options;
}

function usage(): string {
  return [
    "Usage:",
    "  mcp-config-inventory --config <path> [--json-out <path>]",
    "  mcp-config-inventory --claude-desktop [--json-out <path>]",
    "",
    "Examples:",
    "  npx tsx src/cli.ts --config fixtures/claude-desktop.sample.json",
    "  npx tsx src/cli.ts --config fixtures/claude-desktop.sample.json --json-out output/inventory.json",
    ""
  ].join("\n");
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runCli().then((exitCode) => {
    process.exitCode = exitCode;
  });
}
