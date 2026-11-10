import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logger";
import { findOrCreateLeadByPhone } from "@/lib/leads/leadService";
import { recordMessage } from "@/lib/conversation/messageService";
import { sendTemplateMessage } from "@/lib/whatsapp/client";
import type { LeadTemperature, ProductInterest } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Entrada de leads do formulário de qualificação (fast-eps-formulario).
 * O formulário chama esta rota ao ser concluído. Leads com temperatura
 * Excelente/Bom/Morno recebem a primeira mensagem (template aprovado) e já
 * entram no CRM com os dados do formulário, então a IA continua a conversa
 * sem perguntar de novo o que o lead já respondeu. Leads Frio só são salvos.
 */

interface FormLeadBody {
  phone?: string;
  name?: string;
  temperature?: string; // Excelente | Bom | Morno | Frio
  score?: number;
  product?: string; // painel | moldura | treinamento | nao_sei
  city?: string;
  cityType?: string; // campo_grande | ms_outra | fora_ms
  hasProject?: string; // completo | sem_medidas | sem_projeto
  deadline?: string; // texto legível
  size?: string; // texto legível
  profile?: string;
  model?: string;
  notes?: string;
  utmSource?: string;
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 10 || digits.length === 11) digits = `55${digits}`;
  return digits.length >= 12 && digits.length <= 13 && digits.startsWith("55") ? digits : null;
}

const PRODUCT: Record<string, { value: ProductInterest; label: string } | undefined> = {
  painel: { value: "PAINEL_MONOLITICO", label: "Painel Monolítico em EPS" },
  moldura: { value: "MOLDURA_EPS", label: "Molduras em EPS" },
  treinamento: { value: "OUTRO", label: "treinamento técnico" },
  nao_sei: { value: "INDEFINIDO", label: "soluções em EPS" },
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.FORM_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "missing_secret_config" }, { status: 500 });
  if (!safeEqual(request.headers.get("x-form-secret") ?? "", secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: FormLeadBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone);
  if (!phone) return NextResponse.json({ error: "invalid_phone" }, { status: 400 });

  const name = (body.name ?? "").trim().slice(0, 120) || undefined;
  const product = PRODUCT[body.product ?? ""] ?? PRODUCT.nao_sei!;
  const hot = body.temperature === "Excelente" || body.temperature === "Bom";
  const warm = body.temperature === "Morno";
  const temperature: LeadTemperature = hot ? "QUENTE" : warm ? "MORNO" : "FRIO";

  const summary = [
    "Origem: formulário de qualificação (anúncio)",
    `Nota do formulário: ${body.temperature ?? "?"} (${body.score ?? "?"}/12)`,
    body.cityType ? `Local: ${body.city || body.cityType}` : null,
    body.size ? `Porte: ${body.size}` : null,
    body.deadline ? `Prazo: ${body.deadline}` : null,
    body.hasProject ? `Projeto: ${body.hasProject}` : null,
    body.profile ? `Perfil: ${body.profile}` : null,
    body.model ? `Modelo de atendimento: ${body.model}` : null,
    body.notes ? `Observação do lead: ${body.notes}` : null,
  ].filter(Boolean).join("\n");

  const existing = await findOrCreateLeadByPhone(phone, undefined, "TRAFEGO_PAGO");
  const lead = await prisma.lead.update({
    where: { id: existing.id },
    data: {
      name: existing.name ?? name,
      city: existing.city ?? (body.city || undefined),
      productInterest: existing.productInterest === "INDEFINIDO" ? product.value : existing.productInterest,
      measurements: existing.measurements ?? (body.size || undefined),
      desiredDate: existing.desiredDate ?? (body.deadline || undefined),
      hasProject: existing.hasProject ?? (body.hasProject === "completo" ? true : body.hasProject === "sem_projeto" ? false : undefined),
      temperature: existing.temperature === "DESCONHECIDA" ? temperature : existing.temperature,
      source: existing.source === "DESCONHECIDA" ? "TRAFEGO_PAGO" : existing.source,
      notes: existing.notes ? `${existing.notes}\n---\n${summary}` : summary,
    },
  });

  // Frio: só registra. Quem já conversa com o bot ou com humano: não manda de novo.
  if (!hot && !warm) return NextResponse.json({ ok: true, sent: false, reason: "cold" });
  if (lead.lastOutboundAt || lead.lastInboundAt || lead.humanHandoff) {
    return NextResponse.json({ ok: true, sent: false, reason: "already_in_conversation" });
  }

  const template = process.env.FORM_TEMPLATE_NAME || "novo_lead_formulario";
  const firstName = (name ?? "").split(/\s+/)[0] || "tudo bem";
  const result = await sendTemplateMessage(phone, template, "pt_BR", [firstName, product.label]);

  if (!result.ok) {
    await logEvent({ scope: "webhook", level: "error", message: `Formulário: falha ao enviar template ao lead ${lead.id}: ${result.errorMessage}`, metadata: { leadId: lead.id } });
    return NextResponse.json({ ok: true, sent: false, reason: "send_failed" });
  }

  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: "TEMPLATE",
    content: `[template: ${template}] ${firstName} · ${product.label}`,
    whatsappMessageId: result.whatsappMessageId ?? null,
  });
  await prisma.lead.update({ where: { id: lead.id }, data: { lastOutboundAt: new Date() } });
  await logEvent({ scope: "webhook", level: "info", message: `Formulário: template enviado ao lead ${lead.id}`, metadata: { leadId: lead.id } });
  return NextResponse.json({ ok: true, sent: true });
}
