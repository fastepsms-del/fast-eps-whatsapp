import crypto from "crypto";
import { prisma } from "@/lib/db/prisma";
import type { ApiKey } from "@prisma/client";

const KEY_PREFIX = "feps_";

export interface GeneratedApiKey {
  plaintext: string;
  hash: string;
  prefix: string;
}

export function generateApiKey(): GeneratedApiKey {
  const plaintext = `${KEY_PREFIX}${crypto.randomBytes(32).toString("hex")}`;
  const hash = crypto.createHash("sha256").update(plaintext).digest("hex");
  const prefix = plaintext.slice(0, 12);
  return { plaintext, hash, prefix };
}

/** Valida o header Authorization: Bearer <chave> contra as chaves cadastradas. */
export async function verifyApiKey(authHeader: string | null): Promise<ApiKey | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) return null;

  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hash } });
  if (!apiKey || apiKey.revokedAt) return null;

  await prisma.apiKey.update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } });
  return apiKey;
}
