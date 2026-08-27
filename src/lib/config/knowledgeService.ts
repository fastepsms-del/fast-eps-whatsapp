import { prisma } from "@/lib/db/prisma";
import { DEFAULT_KNOWLEDGE_BASE } from "./defaults";
import type { KnowledgeBase, KnowledgeKey } from "./types";
import { logEvent } from "@/lib/logger";

const CACHE_TTL_MS = 30_000;

let cache: { data: KnowledgeBase; expiresAt: number } | null = null;

/**
 * Retorna a base de conhecimento completa, mesclando o que está cadastrado
 * no banco (editável pelo painel admin) com os valores padrão (fallback)
 * para qualquer seção ainda não configurada. Cacheado por curto período
 * para não bater no banco a cada mensagem recebida.
 */
export async function getKnowledgeBase(options?: { skipCache?: boolean }): Promise<KnowledgeBase> {
  if (!options?.skipCache && cache && cache.expiresAt > Date.now()) {
    return cache.data;
  }

  try {
    const rows = await prisma.knowledgeConfig.findMany();
    const merged: KnowledgeBase = { ...DEFAULT_KNOWLEDGE_BASE };

    for (const row of rows) {
      const key = row.key as KnowledgeKey;
      if (key in merged) {
        // @ts-expect-error - o valor em runtime é validado por quem grava (admin API)
        merged[key] = row.value;
      }
    }

    cache = { data: merged, expiresAt: Date.now() + CACHE_TTL_MS };
    return merged;
  } catch (error) {
    await logEvent({ scope: "db", level: "error", message: "Falha ao carregar knowledge base do banco, usando defaults", metadata: { error: String(error) } });
    return DEFAULT_KNOWLEDGE_BASE;
  }
}

export async function getKnowledgeSection<K extends KnowledgeKey>(key: K): Promise<KnowledgeBase[K]> {
  const kb = await getKnowledgeBase();
  return kb[key];
}

export async function updateKnowledgeSection<K extends KnowledgeKey>(
  key: K,
  value: KnowledgeBase[K],
  updatedBy?: string,
): Promise<void> {
  await prisma.knowledgeConfig.upsert({
    where: { key },
    create: { key, value: value as object, updatedBy },
    update: { value: value as object, updatedBy },
  });
  invalidateKnowledgeCache();
}

export function invalidateKnowledgeCache(): void {
  cache = null;
}
