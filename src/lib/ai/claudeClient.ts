import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY não configurada");
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export function getClaudeModel(): string {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-5";
}

export const MAX_RESPONSE_TOKENS = 700;
