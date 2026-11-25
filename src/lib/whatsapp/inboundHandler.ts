import { prisma } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logger";
import { mapInboundMessage } from "./inboundMapper";
import { markMessageAsRead, sendTextMessage } from "./client";
import { applyHumanHandoff, findOrCreateLeadByPhone, touchLeadInbound, touchLeadOutbound } from "@/lib/leads/leadService";
import { recordMessage } from "@/lib/conversation/messageService";
import { getNewLeadsOnlySince, isAiPaused } from "@/lib/aiSwitch";
import { processInboundTurn, buildUnavailableFallback } from "@/lib/ai/aiEngine";

const STALE_MESSAGE_MS = 10 * 60 * 1000;

export interface StatusUpdate {
  id: string;
  status: string;
  errors?: Array<{ message?: string }>;
}

export function mapWhatsAppStatus(status: string): "SENT" | "DELIVERED" | "READ" | "FAILED" | "QUEUED" {
  switch (status) {
    case "sent":
      return "SENT";
    case "delivered":
      return "DELIVERED";
    case "read":
      return "READ";
    case "failed":
      return "FAILED";
    default:
      return "QUEUED";
  }
}

export async function handleStatusUpdate(status: StatusUpdate): Promise<void> {
  try {
    await prisma.message.updateMany({
      where: { whatsappMessageId: status.id },
      data: {
        status: mapWhatsAppStatus(status.status),
        errorMessage: status.errors?.[0]?.message ?? null,
      },
    });
  } catch (error) {
    await logEvent({ scope: "webhook", level: "error", message: `Falha ao atualizar status da mensagem ${status.id}: ${String(error)}` });
  }
}

export async function handleInboundMessage(message: Parameters<typeof mapInboundMessage>[0], profileName?: string): Promise<void> {
  // Idempotência: o provedor pode reenviar o mesmo evento de webhook.
  const alreadyProcessed = await prisma.message.findUnique({ where: { whatsappMessageId: message.id } });
  if (alreadyProcessed) return;

  // Precisa ser lido antes de criar o lead: na primeira vez grava "agora" como marco.
  const onlyNewSince = await getNewLeadsOnlySince();
  const lead = await findOrCreateLeadByPhone(message.from, profileName);
  await touchLeadInbound(lead.id);

  const mapped = await mapInboundMessage(message);

  const inboundMessage = await recordMessage(lead.id, {
    direction: "INBOUND",
    type: mapped.type,
    content: mapped.content,
    mediaId: mapped.mediaId,
    mediaMimeType: mapped.mediaMimeType,
    whatsappMessageId: message.id,
  });

  await markMessageAsRead(message.id);

  // Se um humano assumiu a conversa, a IA fica em silêncio até a equipe
  // reativar a automação pelo painel administrativo.
  if (lead.humanHandoff) {
    await logEvent({ scope: "webhook", level: "info", message: `Mensagem recebida durante atendimento humano, IA não respondeu`, metadata: { leadId: lead.id } });
    return;
  }

  // A IA só responde o que chega de agora em diante: mensagem antiga (reenvio do
  // provedor, histórico sincronizado ao conectar o número) é só registrada.
  const sentAtMs = Number(message.timestamp) * 1000;
  if (Number.isFinite(sentAtMs) && sentAtMs > 0 && Date.now() - sentAtMs > STALE_MESSAGE_MS) {
    await logEvent({ scope: "webhook", level: "info", message: "Mensagem antiga, IA não respondeu", metadata: { leadId: lead.id } });
    return;
  }

  // Por enquanto a IA só atende quem nunca falou com a gente: lead que já existia é ignorado.
  if (onlyNewSince && lead.createdAt < onlyNewSince) {
    // Contato antigo: a IA só faz follow-up. Se ele respondeu a um follow-up nosso, a equipe assume.
    const answeredFollowUp = lead.lastFollowUpAt && lead.lastFollowUpAt > (lead.lastInboundAt ?? new Date(0));
    if (answeredFollowUp && !lead.humanHandoff) {
      await applyHumanHandoff(lead.id, {
        category: "OUTRO",
        reason: "Cliente antigo respondeu ao follow-up automático — atendente deve assumir a conversa.",
      });
    }
    await logEvent({ scope: "webhook", level: "info", message: "Lead anterior ao início da IA, IA não respondeu", metadata: { leadId: lead.id } });
    return;
  }

  if (await isAiPaused()) {
    await logEvent({ scope: "webhook", level: "info", message: "IA pausada no painel, mensagem registrada sem resposta", metadata: { leadId: lead.id } });
    return;
  }

  let replyText: string;
  try {
    const result = await processInboundTurn(lead, inboundMessage.id, mapped.aiBlocks);
    replyText = result.replyText;
  } catch (error) {
    await logEvent({ scope: "ai", level: "error", message: `Falha ao processar turno de IA: ${String(error)}`, metadata: { leadId: lead.id } });
    replyText = await buildUnavailableFallback(lead.id, lead.lastInboundAt === null);
  }

  const sendResult = await sendTextMessage(lead.phone, replyText);
  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: "TEXT",
    content: replyText,
    whatsappMessageId: sendResult.whatsappMessageId ?? null,
    status: sendResult.ok ? "SENT" : "FAILED",
  });
  await touchLeadOutbound(lead.id);
}
