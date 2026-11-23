import { prisma } from "@/lib/db/prisma";
import { applyHumanHandoff, touchLeadOutbound } from "@/lib/leads/leadService";
import { attendantNameFor, type AdminSession } from "@/lib/adminAuth";
import type { Lead } from "@prisma/client";

const MANUAL_HANDOFF_REASON = "Atendente humano respondeu manualmente pelo painel — atendimento humano assumiu a conversa.";

/**
 * Passos comuns depois que alguém da equipe responde pelo painel (texto ou
 * mídia): marca a resposta enviada, registra quem atendeu (se o lead ainda não
 * tem atendente) e pausa a IA, já que um humano assumiu a conversa.
 */
export async function finishManualReply(lead: Lead, session: AdminSession | null): Promise<void> {
  await touchLeadOutbound(lead.id);

  const attendant = attendantNameFor(session);
  if (attendant && !lead.assignedToName) {
    await prisma.lead.update({ where: { id: lead.id }, data: { assignedToName: attendant } });
  }

  if (!lead.humanHandoff) {
    await applyHumanHandoff(lead.id, { category: "OUTRO", reason: MANUAL_HANDOFF_REASON });
  }
}
