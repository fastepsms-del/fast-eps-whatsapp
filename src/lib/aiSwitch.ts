import { prisma } from "@/lib/db/prisma";

const KEY = "AI_PAUSED";

/** Interruptor geral: quando pausado, a IA não responde ninguém (as mensagens continuam sendo registradas). */
export async function isAiPaused(): Promise<boolean> {
  try {
    const row = await prisma.knowledgeConfig.findUnique({ where: { key: KEY } });
    return (row?.value as { paused?: boolean } | null)?.paused === true;
  } catch {
    return false;
  }
}

export async function setAiPaused(paused: boolean, updatedBy?: string): Promise<void> {
  await prisma.knowledgeConfig.upsert({
    where: { key: KEY },
    create: { key: KEY, value: { paused }, updatedBy },
    update: { value: { paused }, updatedBy },
  });
}

const NEW_ONLY_KEY = "AI_ONLY_NEW_SINCE";

/**
 * A IA só atende leads criados depois desta data (quem nunca falou com a Fast EPS antes).
 * Na primeira consulta grava "agora", então todo lead que já existia fica de fora.
 */
export async function getNewLeadsOnlySince(): Promise<Date | null> {
  try {
    const row = await prisma.knowledgeConfig.findUnique({ where: { key: NEW_ONLY_KEY } });
    const stored = (row?.value as { since?: string } | null)?.since;
    if (stored && !Number.isNaN(Date.parse(stored))) return new Date(stored);
    if (row && (row.value as { disabled?: boolean } | null)?.disabled) return null;
    const now = new Date();
    await prisma.knowledgeConfig.upsert({
      where: { key: NEW_ONLY_KEY },
      create: { key: NEW_ONLY_KEY, value: { since: now.toISOString() } },
      update: { value: { since: now.toISOString() } },
    });
    return now;
  } catch {
    return null;
  }
}
