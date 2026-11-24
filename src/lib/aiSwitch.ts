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
