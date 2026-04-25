import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";

const repoRoot = process.cwd();
const tempDirs: string[] = [];

describe("CLI", () => {
  afterEach(async () => {
    await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
  });

  it("writes a report that includes the no-server-started limitation", async () => {
    const io = createIo();
    const exitCode = await runCli(["--config", "fixtures/claude-desktop.sample.json"], io);

    expect(exitCode).toBe(0);
    expect(io.stdoutText()).toContain("MCP Config Inventory");
    expect(io.stdoutText()).toContain("No server was started.");
    expect(io.stderrText()).toBe("");
  });

  it("writes JSON output with no env values", async () => {
    const tempDir = await makeTempDir();
    const jsonOut = path.join(tempDir, "inventory.json");
    const io = createIo();

    const exitCode = await runCli(
      ["--config", "fixtures/env-redaction.sample.json", "--json-out", jsonOut],
      io
    );

    expect(exitCode).toBe(0);

    const artifact = await readFile(jsonOut, "utf8");
    expect(artifact).toContain("GITHUB_TOKEN");
    expect(artifact).toContain("SOME_KEY");
    expect(artifact).not.toContain("secret-token");
    expect(artifact).not.toContain("secret-value");
    expect(artifact).not.toContain("not-for-output");
  });

  it("exits nonzero on a missing config file", async () => {
    const io = createIo();
    const exitCode = await runCli(["--config", "fixtures/missing.json"], io);

    expect(exitCode).toBe(1);
    expect(io.stderrText()).toContain("Config file not found");
  });

  it("exits nonzero on invalid JSON", async () => {
    const tempDir = await makeTempDir();
    const invalidConfig = path.join(tempDir, "invalid.json");
    await writeFile(invalidConfig, "{ invalid json", "utf8");

    const io = createIo();
    const exitCode = await runCli(["--config", invalidConfig], io);

    expect(exitCode).toBe(1);
    expect(io.stderrText()).toContain("Invalid JSON");
  });
});

async function makeTempDir(): Promise<string> {
  const tempDir = await mkdtemp(path.join(tmpdir(), "mcp-config-inventory-"));
  tempDirs.push(tempDir);
  return tempDir;
}

function createIo() {
  let stdout = "";
  let stderr = "";

  return {
    cwd: repoRoot,
    stdout: {
      write(chunk: string) {
        stdout += chunk;
        return true;
      }
    },
    stderr: {
      write(chunk: string) {
        stderr += chunk;
        return true;
      }
    },
    stdoutText() {
      return stdout;
    },
    stderrText() {
      return stderr;
    }
  };
}
