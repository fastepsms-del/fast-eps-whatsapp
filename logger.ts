import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export type LogScope = "whatsapp" | "ai" | "webhook" | "cron" | "db" | "admin";
export type LogLevel = "info" | "warn" | "error";

export interface LogEventInput {
  scope: LogScope;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Log best-effort: sempre escreve no console; tenta persistir no banco para
 * diagnóstico no painel administrativo, mas nunca lança erro se o banco
 * estiver indisponível (para não derrubar o fluxo principal do webhook).
 */
export async function logEvent({ scope, level, message, metadata }: LogEventInput): Promise<void> {
  const line = `[${scope}] [${level}] ${message}`;
  if (level === "error") {
    // eslint-disable-next-line no-console
    console.error(line, metadata ?? "");
  } else if (level === "warn") {
    // eslint-disable-next-line no-console
    console.warn(line, metadata ?? "");
  } else {
    // eslint-disable-next-line no-console
    console.log(line, metadata ?? "");
  }

  try {
    await prisma.integrationLog.create({
      data: {
        scope,
        level,
        message: message.slice(0, 4000),
        metadata: metadata ? (sanitizeMetadata(metadata) as Prisma.InputJsonValue) : undefined,
      },
    });
  } catch {
    // Banco indisponível: já registramos no console, não propaga o erro.
  }
}

const SENSITIVE_KEYS = ["token", "secret", "password", "authorization", "api_key", "apikey"];

function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEYS.some((sensitive) => key.toLowerCase().includes(sensitive))) {
      clean[key] = "[REDACTED]";
    } else {
      clean[key] = value;
    }
  }
  return clean;
}
