export const STATIC_CATEGORY_ORDER = [
  "filesystem",
  "shell",
  "network",
  "browser",
  "database",
  "credentials",
  "email",
  "calendar",
  "external_api",
  "local_path_access",
  "env_access",
  "mutation_possible",
  "unknown"
] as const;

export type StaticCategory = (typeof STATIC_CATEGORY_ORDER)[number];

export type Transport = "stdio" | "unknown";

export const DEFAULT_LIMITATION_NOTES = [
  "Tool list not verified at runtime.",
  "Categories inferred from static config only.",
  "No server was started."
] as const;

export interface ParsedMcpServer {
  name: string;
  transport: Transport;
  command?: string;
  args: string[];
  envKeys: string[];
}

export interface ParsedMcpConfig {
  configFile: string;
  servers: ParsedMcpServer[];
}

export interface InventoryServer extends ParsedMcpServer {
  staticCategories: StaticCategory[];
  notes: string[];
}

export interface McpConfigInventory {
  configFile: string;
  servers: InventoryServer[];
  limitations: string[];
}
