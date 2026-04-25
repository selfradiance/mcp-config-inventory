import type { InventoryServer, McpConfigInventory } from "./types.js";

export function renderInventoryReport(inventory: McpConfigInventory): string {
  const sections = [
    "MCP Config Inventory",
    "",
    `Config file: ${inventory.configFile}`,
    "",
    ...inventory.servers.flatMap((server, index) => [
      ...renderServer(server),
      ...(index === inventory.servers.length - 1 ? [] : [""])
    ])
  ];

  return `${sections.join("\n")}\n`;
}

function renderServer(server: InventoryServer): string[] {
  return [
    `Server: ${server.name}`,
    `Transport: ${server.transport}`,
    `Command: ${server.command ?? "none"}`,
    `Args: ${formatStringArray(server.args)}`,
    `Env keys: ${server.envKeys.length > 0 ? formatStringArray(server.envKeys) : "none"}`,
    "Static categories:",
    ...server.staticCategories.map((category) => `- ${category}`),
    "",
    "Notes:",
    ...server.notes.map((note) => `- ${note}`)
  ];
}

function formatStringArray(values: string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}
