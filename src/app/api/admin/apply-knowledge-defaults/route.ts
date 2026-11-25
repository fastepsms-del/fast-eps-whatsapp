import { NextResponse } from "next/server";
import { DEFAULT_KNOWLEDGE_BASE } from "@/lib/config/defaults";
import { updateKnowledgeSection } from "@/lib/config/knowledgeService";
import type { KnowledgeKey } from "@/lib/config/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTIONS: KnowledgeKey[] = ["COMPANY_INFO", "PRODUCTS", "PRICING", "DELIVERY", "INSTALLATION", "GREETING_SETTINGS"];

/**
 * Rota de uso único (só administrador): grava no banco as seções da base de conhecimento
 * que foram atualizadas no código (produtos, preços, entrega, instalação, tom). Sobrescreve o
 * que estiver salvo nessas seções em /admin/settings. As demais seções não são tocadas.
 */
export async function GET(): Promise<NextResponse> {
  for (const key of SECTIONS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await updateKnowledgeSection(key, DEFAULT_KNOWLEDGE_BASE[key] as any, "apply-knowledge-defaults");
  }
  return NextResponse.json({ ok: true, updated: SECTIONS });
}
