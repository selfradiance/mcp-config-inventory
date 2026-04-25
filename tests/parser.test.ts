import path from "node:path";
import { describe, expect, it } from "vitest";
import { loadMcpConfigFile, parseMcpConfigJson } from "../src/parser.js";

const repoRoot = process.cwd();

describe("parser", () => {
  it("parses the mcpServers object", async () => {
    const parsed = await loadMcpConfigFile(
      path.join(repoRoot, "fixtures", "claude-desktop.sample.json"),
      "fixtures/claude-desktop.sample.json"
    );

    expect(parsed.servers).toEqual([
      {
        name: "filesystem",
        transport: "stdio",
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/example/Desktop"],
        envKeys: []
      }
    ]);
  });

  it("redacts env values and keeps only env key names", () => {
    const parsed = parseMcpConfigJson(
      JSON.stringify({
        mcpServers: {
          github: {
            command: "npx",
            args: ["@modelcontextprotocol/server-github"],
            env: {
              GITHUB_TOKEN: "super-secret",
              PLAIN_SETTING: "also-not-output"
            }
          }
        }
      }),
      "inline.json"
    );

    expect(parsed.servers[0]?.envKeys).toEqual(["GITHUB_TOKEN", "PLAIN_SETTING"]);
    expect(JSON.stringify(parsed)).not.toContain("super-secret");
    expect(JSON.stringify(parsed)).not.toContain("also-not-output");
  });

  it("rejects an empty command string", () => {
    expect(() =>
      parseMcpConfigJson(
        JSON.stringify({
          mcpServers: {
            empty: {
              command: "",
              args: []
            }
          }
        }),
        "inline.json"
      )
    ).toThrow("Invalid MCP config");
  });
});
