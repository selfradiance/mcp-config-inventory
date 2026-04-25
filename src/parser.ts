import { readFile } from "node:fs/promises";
import { ZodError } from "zod";
import { McpConfigSchema } from "./schema.js";
import type { ParsedMcpConfig, ParsedMcpServer } from "./types.js";

export class ConfigInventoryError extends Error {
  constructor(
    message: string,
    readonly code: string
  ) {
    super(message);
    this.name = "ConfigInventoryError";
  }
}

export class ConfigFileNotFoundError extends ConfigInventoryError {
  constructor(configFile: string) {
    super(`Config file not found: ${configFile}`, "CONFIG_FILE_NOT_FOUND");
    this.name = "ConfigFileNotFoundError";
  }
}

export class InvalidJsonConfigError extends ConfigInventoryError {
  constructor(configFile: string, detail: string) {
    super(`Invalid JSON in ${configFile}: ${detail}`, "INVALID_JSON");
    this.name = "InvalidJsonConfigError";
  }
}

export class InvalidMcpConfigError extends ConfigInventoryError {
  constructor(configFile: string, detail: string) {
    super(`Invalid MCP config in ${configFile}: ${detail}`, "INVALID_MCP_CONFIG");
    this.name = "InvalidMcpConfigError";
  }
}

export async function loadMcpConfigFile(
  filePath: string,
  displayPath = filePath
): Promise<ParsedMcpConfig> {
  let jsonText: string;

  try {
    jsonText = await readFile(filePath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new ConfigFileNotFoundError(displayPath);
    }

    const detail = error instanceof Error ? error.message : "unknown read error";
    throw new ConfigInventoryError(
      `Could not read config file ${displayPath}: ${detail}`,
      "CONFIG_FILE_READ_ERROR"
    );
  }

  return parseMcpConfigJson(jsonText, displayPath);
}

export function parseMcpConfigJson(
  jsonText: string,
  configFile: string
): ParsedMcpConfig {
  let jsonValue: unknown;

  try {
    jsonValue = JSON.parse(jsonText);
  } catch (error) {
    const detail = error instanceof Error ? error.message : "invalid JSON";
    throw new InvalidJsonConfigError(configFile, detail);
  }

  const parseResult = McpConfigSchema.safeParse(jsonValue);

  if (!parseResult.success) {
    throw new InvalidMcpConfigError(configFile, formatZodError(parseResult.error));
  }

  const servers = Object.entries(parseResult.data.mcpServers)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, server]) => {
      const parsedServer: ParsedMcpServer = {
        name,
        transport: server.command ? "stdio" : "unknown",
        args: server.args ?? [],
        envKeys: Object.keys(server.env ?? {}).sort()
      };

      if (server.command) {
        parsedServer.command = server.command;
      }

      return parsedServer;
    });

  return {
    configFile,
    servers
  };
}

function formatZodError(error: ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "root";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
