import { prisma } from "@/lib/db/prisma";
import { getKnowledgeBase } from "@/lib/config/knowledgeService";
import { isWithinBusinessHours } from "@/lib/businessHours";
import { generateFollowUpText } from "@/lib/ai/aiEngine";
import { getNewLeadsOnlySince, isAiPaused, isOldLeadsFollowUpEnabled } from "@/lib/aiSwitch";
import { sendTemplateMessage, sendTextMessage, usesTemplates } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { logEvent } from "@/lib/logger";
import type { Lead, LeadStatus } from "@prisma/client";

const FREE_TEXT_WINDOW_HOURS = 24;
const MAX_CONVERSATION_AGE_DAYS = 90;

const FOLLOW_UP_CUTOVER_AT = new Date("2026-09-16T00:00:00Z");

export interface FollowUpSweepResult {
  candidates: number;
  sent: number;
  skippedOutsideHours: boolean;
}

export async function runFollowUpSweep(now: Date = new Date()): Promise<FollowUpSweepResult> {
  const kb = await getKnowledgeBase();
  const settings = kb.FOLLOW_UP_SETTINGS;

  if (!settings.enabled) {
    return { candidates: 0, sent: 0, skippedOutsideHours: false };
  }

  // Com IA pausada ou com follow-up desligado explicitamente (EVOLUTION_FOLLOWUPS=off), nada é enviado.
  if (await isAiPaused()) return { candidates: 0, sent: 0, skippedOutsideHours: false };
  if (!usesTemplates() && process.env.EVOLUTION_FOLLOWUPS === "off") {
    return { candidates: 0, sent: 0, skippedOutsideHours: false };
  }

  if (!isWithinBusinessHours(kb.BUSINESS_HOURS, now)) {
    return { candidates: 0, sent: 0, skippedOutsideHours: true };
  }

  const delayThreshold = new Date(now.getTime() - settings.delayHoursAfterNoResponse * 60 * 60 * 1000);
  const minIntervalThreshold = new Date(now.getTime() - settings.minHoursBetweenAttempts * 60 * 60 * 1000);

  // Modo Evolution: cobre também as conversas antigas (importadas do celular). Aí o status do lead não é
  // confiável, então a IA lê a conversa e decide se vale o follow-up (ver generateFollowUpText). Limita a
  // conversas dos últimos 90 dias e a poucos envios por rodada para não parecer disparo em massa.
  const evolutionMode = !usesTemplates();
  const maxAgeThreshold = new Date(now.getTime() - MAX_CONVERSATION_AGE_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await prisma.lead.findMany({
    where: {
      ...(evolutionMode
        ? { status: { notIn: ["CONVERTIDO", "PERDIDO"] as LeadStatus[] } }
        : { status: { in: settings.applicableStatuses as LeadStatus[] }, createdAt: { gte: FOLLOW_UP_CUTOVER_AT } }),
      humanHandoff: false,
      followUpPaused: false,
      followUpCount: { lt: settings.maxAttempts },
      lastOutboundAt: evolutionMode ? { not: null, lte: delayThreshold, gte: maxAgeThreshold } : { not: null, lte: delayThreshold },
    },
    orderBy: { lastOutboundAt: "desc" },
  });

  // Por padrão o follow-up só alcança quem chegou depois do início da IA. Contatos antigos entram quando o
  // administrador liga "Follow-up de contatos antigos" no painel.
  const onlyNewSince = evolutionMode && !(await isOldLeadsFollowUpEnabled()) ? await getNewLeadsOnlySince() : null;

  const eligible = candidates.filter((lead) => {
    if (onlyNewSince && lead.createdAt < onlyNewSince) return false;
    if (!lead.lastOutboundAt || !lead.lastInboundAt) return false;
    if (lead.lastInboundAt >= lead.lastOutboundAt) return false;
    if (lead.lastFollowUpAt && lead.lastFollowUpAt > minIntervalThreshold) return false;
    return true;
  });

  const maxPerSweep = evolutionMode ? Number(process.env.FOLLOWUP_MAX_PER_SWEEP) || 10 : Infinity;
  let sent = 0;
  for (const lead of eligible) {
    if (sent >= maxPerSweep) break;
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

  // Só a Cloud API da Meta limita texto livre a 24h; com Evolution API sempre dá pra mandar texto.
  const withinFreeWindow = !usesTemplates() || hoursSinceLastInbound < FREE_TEXT_WINDOW_HOURS;

  let followUpText = settings.fallbackMessage;
  if (withinFreeWindow) {
    try {
      const generated = await generateFollowUpText(lead);
      if (generated === null) {
        // Conversa encerrada ou cliente sem interesse: conta como tentativa e não insiste.
        await prisma.lead.update({ where: { id: lead.id }, data: { followUpCount: { increment: 1 }, lastFollowUpAt: now } });
        return false;
      }
      followUpText = generated;
    } catch (error) {
      await logEvent({ scope: "cron", level: "warn", message: `IA não gerou follow-up para ${lead.id}, usando texto padrão: ${String(error)}` });
    }
  }

  const result = withinFreeWindow
    ? await sendTextMessage(lead.phone, followUpText)
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
    content: withinFreeWindow ? followUpText : `[template: ${settings.messageTemplateName}]`,
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
