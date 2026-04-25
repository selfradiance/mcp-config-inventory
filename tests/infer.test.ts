import { describe, expect, it } from "vitest";
import { inferStaticCategories } from "../src/infer.js";
import type { ParsedMcpServer } from "../src/types.js";

describe("inferStaticCategories", () => {
  it("infers filesystem categories from @modelcontextprotocol/server-filesystem", () => {
    const server: ParsedMcpServer = {
      name: "filesystem",
      transport: "stdio",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/example/Desktop"],
      envKeys: []
    };

    expect(inferStaticCategories(server)).toEqual([
      "filesystem",
      "local_path_access",
      "mutation_possible"
    ]);
  });

  it("infers env_access and credentials from sensitive env key names", () => {
    const server: ParsedMcpServer = {
      name: "github",
      transport: "stdio",
      command: "npx",
      args: ["@modelcontextprotocol/server-github"],
      envKeys: ["GITHUB_TOKEN", "PLAIN_SETTING"]
    };

    expect(inferStaticCategories(server)).toEqual([
      "network",
      "credentials",
      "external_api",
      "env_access",
      "mutation_possible"
    ]);
  });

  it("tags unknown servers as unknown", () => {
    const server: ParsedMcpServer = {
      name: "mystery",
      transport: "stdio",
      command: "node",
      args: ["server.js"],
      envKeys: []
    };

    expect(inferStaticCategories(server)).toEqual(["unknown"]);
  });
});
