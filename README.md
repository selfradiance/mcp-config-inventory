# MCP Config Inventory

MCP Config Inventory is a local read-only CLI that inspects MCP configuration files and reports which MCP servers an agent is configured to use. It does not start servers, call tools, perform a protocol handshake, scan for malware, or decide whether an agent is safe. It only makes the configured MCP surface visible before runtime.

## What this is

This is a narrow TypeScript CLI for reading MCP configuration JSON and producing a deterministic inventory of declared MCP servers. For v0.1 it focuses on the common Claude Desktop-style `mcpServers` shape.

The CLI reports each server name, inferred transport, command, args, environment variable key names, static category tags, and limitations.

## What this is not

This is not an agent security framework, vulnerability scanner, safety verdict tool, runtime MCP client, firewall, or AgentGate integration.

It does not start MCP servers, execute configured commands, perform MCP handshakes, inspect live tools, read secret values, or decide whether an agent is safe.

## Why this exists

MCP server configuration can be easy to forget about once it is set up locally. This tool makes the declared configuration visible before runtime, using only the static config file on disk.

The goal is a humble inventory: what servers are declared, what command would be used to start them by the host application, which env key names are present, and which broad static surface categories can be inferred from names, commands, args, and env key names.

## Install / Setup

```bash
npm install
```

Node.js 20 or newer is required.

## Usage

Inspect a specific config file:

```bash
npx tsx src/cli.ts --config fixtures/claude-desktop.sample.json
```

Write a JSON artifact as well:

```bash
npx tsx src/cli.ts --config fixtures/claude-desktop.sample.json --json-out output/inventory.json
```

Use the optional Claude Desktop default path helper:

```bash
npx tsx src/cli.ts --claude-desktop
```

The helper only resolves the likely local config path. It does not make Claude Desktop required.

## Example Output

```text
MCP Config Inventory

Config file: fixtures/claude-desktop.sample.json

Server: filesystem
Transport: stdio
Command: npx
Args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/example/Desktop"]
Env keys: none
Static categories:
- filesystem
- local_path_access
- mutation_possible

Notes:
- Tool list not verified at runtime.
- Categories inferred from static config only.
- No server was started.
```

## Category Tags

Category tags are descriptive static surface categories, not risk scores or safety verdicts.

- `filesystem`
- `shell`
- `network`
- `browser`
- `database`
- `credentials`
- `email`
- `calendar`
- `external_api`
- `local_path_access`
- `env_access`
- `mutation_possible`
- `unknown`

Inference is intentionally simple. For example, `@modelcontextprotocol/server-filesystem` is tagged with `filesystem`, `local_path_access`, and `mutation_possible`. Env key names are reported as key names only; values are never included in output. Sensitive-looking env key names such as `TOKEN`, `KEY`, `SECRET`, `PASSWORD`, or `CREDENTIAL` add the `credentials` category.

## JSON Output

Use `--json-out <path>` to write a JSON inventory artifact.

```bash
npx tsx src/cli.ts --config fixtures/env-redaction.sample.json --json-out output/inventory.json
```

The JSON artifact contains env key names only:

```json
{
  "envKeys": ["GITHUB_TOKEN", "PLAIN_SETTING", "SOME_KEY"]
}
```

It does not contain env values.

## Limitations

Many MCP tools are only discoverable at runtime. v0.1 does not perform runtime discovery, handshakes, or tool listing.

Static categories are inferred from server names, command strings, args, and env key names. They are incomplete by design and should not be treated as vulnerability detection or a safety decision.

For v0.1, `stdio` is assumed when a command is present.

## Tests

```bash
npm test
npm run typecheck
npm run build
```

## License

MIT
