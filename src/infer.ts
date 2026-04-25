import {
  DEFAULT_LIMITATION_NOTES,
  STATIC_CATEGORY_ORDER,
  type McpConfigInventory,
  type ParsedMcpConfig,
  type ParsedMcpServer,
  type StaticCategory
} from "./types.js";

export function buildInventory(parsedConfig: ParsedMcpConfig): McpConfigInventory {
  return {
    configFile: parsedConfig.configFile,
    servers: parsedConfig.servers.map((server) => ({
      ...server,
      staticCategories: inferStaticCategories(server),
      notes: [...DEFAULT_LIMITATION_NOTES]
    })),
    limitations: [...DEFAULT_LIMITATION_NOTES]
  };
}

export function inferStaticCategories(server: ParsedMcpServer): StaticCategory[] {
  const categories = new Set<StaticCategory>();
  const text = [server.name, server.command ?? "", ...server.args]
    .join(" ")
    .toLowerCase();

  if (
    text.includes("@modelcontextprotocol/server-filesystem") ||
    hasAnyToken(text, ["filesystem", "file-system"])
  ) {
    categories.add("filesystem");
    categories.add("local_path_access");
    categories.add("mutation_possible");
  }

  if (
    hasAnyToken(text, [
      "shell",
      "bash",
      "zsh",
      "powershell",
      "cmd.exe",
      "terminal",
      "process",
      "exec",
      "spawn"
    ])
  ) {
    categories.add("shell");
    categories.add("mutation_possible");
  }

  if (
    hasAnyToken(text, [
      "browser",
      "playwright",
      "puppeteer",
      "chromium",
      "chrome",
      "firefox",
      "webkit",
      "selenium"
    ])
  ) {
    categories.add("browser");
    categories.add("network");
    categories.add("mutation_possible");
  }

  if (
    hasAnyToken(text, [
      "postgres",
      "postgresql",
      "sqlite",
      "mysql",
      "mariadb",
      "mongodb",
      "redis",
      "database"
    ])
  ) {
    categories.add("database");
    categories.add("mutation_possible");

    if (!hasAnyToken(text, ["sqlite"])) {
      categories.add("network");
    }
  }

  if (
    hasAnyToken(text, [
      "github",
      "gitlab",
      "slack",
      "notion",
      "google",
      "linear",
      "jira",
      "asana",
      "stripe",
      "twilio",
      "aws",
      "azure",
      "gcp",
      "shopify",
      "hubspot",
      "api"
    ])
  ) {
    categories.add("external_api");
    categories.add("network");
    categories.add("mutation_possible");
  }

  if (hasAnyToken(text, ["email", "gmail", "smtp", "imap", "mailgun", "sendgrid"])) {
    categories.add("email");
    categories.add("external_api");
    categories.add("network");
    categories.add("mutation_possible");
  }

  if (hasAnyToken(text, ["calendar", "caldav"])) {
    categories.add("calendar");
    categories.add("external_api");
    categories.add("network");
    categories.add("mutation_possible");
  }

  if (server.envKeys.length > 0) {
    categories.add("env_access");
  }

  if (server.envKeys.some((key) => /TOKEN|KEY|SECRET|PASSWORD|CREDENTIAL/i.test(key))) {
    categories.add("credentials");
  }

  if (categories.size === 0) {
    categories.add("unknown");
  }

  return STATIC_CATEGORY_ORDER.filter((category) => categories.has(category));
}

function hasAnyToken(text: string, tokens: string[]): boolean {
  return tokens.some((token) => {
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, "i").test(text);
  });
}
