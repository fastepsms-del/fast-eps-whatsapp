import { prisma } from "@/lib/db/prisma";
import type { Lead, LeadSource } from "@prisma/client";
import type { RequestHumanHandoffArgs, SetLeadStatusArgs, UpdateLeadArgs } from "@/lib/ai/tools";
import { logEvent } from "@/lib/logger";

/**
 * Busca o lead pelo telefone (wa_id) ou cria um novo caso seja o primeiro
 * contato. `profileName` é o nome de exibição que o WhatsApp envia no
 * webhook (contacts[0].profile.name) — usado apenas como sugestão inicial,
 * nunca sobrescreve um nome já confirmado pelo cliente na conversa.
 */
export async function findOrCreateLeadByPhone(phone: string, profileName?: string, source?: LeadSource): Promise<Lead> {
  const existing = await prisma.lead.findUnique({ where: { phone } });
  if (existing) {
    if (profileName && existing.profileName !== profileName) {
      return prisma.lead.update({ where: { id: existing.id }, data: { profileName } });
    }
    return existing;
  }

  return prisma.lead.create({
    data: {
      phone,
      profileName,
      source: source ?? "DESCONHECIDA",
    },
  });
}

export async function getLeadById(id: string): Promise<Lead | null> {
  return prisma.lead.findUnique({ where: { id } });
}

export async function touchLeadInbound(leadId: string): Promise<void> {
  // Uma nova mensagem do cliente encerra a sequência de follow-up em
  // andamento (ver seção 27 do briefing: interromper ao haver nova interação).
  await prisma.lead.update({ where: { id: leadId }, data: { lastInboundAt: new Date(), followUpCount: 0 } });
}

export async function touchLeadOutbound(leadId: string): Promise<void> {
  await prisma.lead.update({ where: { id: leadId }, data: { lastOutboundAt: new Date() } });
}

/** Aplica os campos vindos da ferramenta `update_lead` chamada pela IA. */
export async function applyLeadUpdate(leadId: string, args: UpdateLeadArgs): Promise<Lead> {
  const data: Record<string, unknown> = {};
  if (args.name !== undefined) data.name = args.name;
  if (args.city !== undefined) data.city = args.city;
  if (args.productInterest !== undefined) data.productInterest = args.productInterest;
  if (args.quantity !== undefined) data.quantity = args.quantity;
  if (args.measurements !== undefined) data.measurements = args.measurements;
  if (args.hasProject !== undefined) data.hasProject = args.hasProject;
  if (args.hasPhoto !== undefined) data.hasPhoto = args.hasPhoto;
  if (args.desiredDate !== undefined) data.desiredDate = args.desiredDate;
  if (args.wantsQuote !== undefined) data.wantsQuote = args.wantsQuote;
  if (args.source !== undefined) data.source = args.source;
  if (args.temperature !== undefined) data.temperature = args.temperature;
  if (args.notes !== undefined) data.notes = args.notes;

  if (Object.keys(data).length === 0) {
    return (await getLeadById(leadId))!;
  }

  return prisma.lead.update({ where: { id: leadId }, data });
}

export async function applyLeadStatus(leadId: string, args: SetLeadStatusArgs): Promise<Lead> {
  return prisma.lead.update({ where: { id: leadId }, data: { status: args.status } });
}

export async function applyHumanHandoff(leadId: string, args: RequestHumanHandoffArgs): Promise<Lead> {
  const lead = await prisma.lead.update({
    where: { id: leadId },
    data: {
      humanHandoff: true,
      humanHandoffReason: args.reason,
      humanHandoffCategory: args.category,
      humanHandoffAt: new Date(),
      status: "ATENDIMENTO_HUMANO",
    },
  });
  await logEvent({
    scope: "ai",
    level: "info",
    message: `Lead ${leadId} transferido para atendimento humano (${args.category})`,
    metadata: { leadId, category: args.category, reason: args.reason },
  });
  return lead;
}

/** Usado pelo painel admin para reativar a IA após um atendimento humano. */
export async function reactivateAutomation(leadId: string): Promise<Lead> {
  return prisma.lead.update({
    where: { id: leadId },
    data: {
      humanHandoff: false,
      humanHandoffReason: null,
      humanHandoffCategory: null,
      status: "EM_ATENDIMENTO",
    },
  });
}
