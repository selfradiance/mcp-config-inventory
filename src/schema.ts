import { z } from "zod";

export const McpServerConfigSchema = z
  .object({
    command: z.string().min(1).optional(),
    args: z.array(z.string()).optional(),
    env: z.record(z.unknown()).optional()
  })
  .passthrough();

export const McpConfigSchema = z
  .object({
    mcpServers: z.record(McpServerConfigSchema)
  })
  .passthrough();

export type RawMcpConfig = z.infer<typeof McpConfigSchema>;
