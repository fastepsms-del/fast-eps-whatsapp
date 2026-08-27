import { prisma } from "@/lib/db/prisma";
import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import { isWithinBusinessHours } from "@/lib/businessHours";
import { sendTemplateMessage, sendTextMessage } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { logEvent } from "@/lib/logger";
import type { Lead, LeadStatus } from "@prisma/client";

const FREE_TEXT_WINDOW_HOURS = 24;

export interface FollowUpSweepResult {
  candidates: number;
  sent: number;
  skippedOutsideHours: boolean;
}

/**
 * Varre os leads elegíveis para follow-up automático (ver seção 27 do
 * briefing): sem resposta do cliente após nossa última mensagem, dentro do
 * limite de tentativas, respeitando o intervalo mínimo entre tentativas e
 * nunca em leads pausados/transferidos para humano. Pensado para ser
 * chamado por um cron (ex: `/api/cron/followups`).
 */
export async function runFollowUpSweep(now: Date = new Date()): Promise<FollowUpSweepResult> {
  const kb = await getKnowledgeBase();
  const settings = kb.FOLLOW_UP_SETTINGS;

  if (!settings.enabled) {
    return { candidates: 0, sent: 0, skippedOutsideHours: false };
  }

  if (!isWithinBusinessHours(kb.BUSINESS_HOURS, now)) {
    return { candidates: 0, sent: 0, skippedOutsideHours: true };
  }

  const delayThreshold = new Date(now.getTime() - settings.delayHoursAfterNoResponse * 60 * 60 * 1000);
  const minIntervalThreshold = new Date(now.getTime() - settings.minHoursBetweenAttempts * 60 * 60 * 1000);

  const candidates = await prisma.lead.findMany({
    where: {
      status: { in: settings.applicableStatuses as LeadStatus[] },
      humanHandoff: false,
      followUpPaused: false,
      followUpCount: { lt: settings.maxAttempts },
      lastOutboundAt: { not: null, lte: delayThreshold },
    },
  });

  const eligible = candidates.filter((lead) => {
    if (!lead.lastOutboundAt || !lead.lastInboundAt) return false;
    // Só faz follow-up se a última mensagem da conversa foi nossa (cliente
    // não respondeu ainda depois disso).
    if (lead.lastInboundAt >= lead.lastOutboundAt) return false;
    if (lead.lastFollowUpAt && lead.lastFollowUpAt > minIntervalThreshold) return false;
    return true;
  });

  let sent = 0;
  for (const lead of eligible) {
    const ok = await sendFollowUpToLead(lead, settings, now);
    if (ok) sent += 1;
  }

  return { candidates: eligible.length, sent, skippedOutsideHours: false };
}

async function sendFollowUpToLead(
  lead: Lead,
  settings: Awaited<ReturnType<typeof getKnowledgeBase>>["FOLLOW_UP_SETTINGS"],
  now: Date,
): Promise<boolean> {
  const hoursSinceLastInbound = lead.lastInboundAt ? (now.getTime() - lead.lastInboundAt.getTime()) / (1000 * 60 * 60) : Infinity;

  const withinFreeWindow = hoursSinceLastInbound < FREE_TEXT_WINDOW_HOURS;

  const result = withinFreeWindow
    ? await sendTextMessage(lead.phone, settings.fallbackMessage)
    : await sendTemplateMessage(lead.phone, settings.messageTemplateName);

  if (!result.ok) {
    await logEvent({
      scope: "cron",
      level: "error",
      message: `Falha ao enviar follow-up para lead ${lead.id}: ${result.errorMessage}`,
      metadata: { leadId: lead.id },
    });
    return false;
  }

  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: withinFreeWindow ? "TEXT" : "TEMPLATE",
    content: withinFreeWindow ? settings.fallbackMessage : `[template: ${settings.messageTemplateName}]`,
    whatsappMessageId: result.whatsappMessageId ?? null,
    isFollowUp: true,
  });

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      followUpCount: { increment: 1 },
      lastFollowUpAt: now,
      lastOutboundAt: now,
    },
  });

  await logEvent({ scope: "cron", level: "info", message: `Follow-up enviado para lead ${lead.id}`, metadata: { leadId: lead.id } });
  return true;
}
