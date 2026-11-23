import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyApiKey } from "@/lib/apiKeys";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { applyHumanHandoff, touchLeadOutbound } from "@/lib/leads/leadService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXTERNAL_HANDOFF_REASON = "Mensagem enviada por sistema externo via API — atendimento humano assumiu a conversa.";

/** Histórico de mensagens de um lead. Autenticação: `Authorization: Bearer <chave de API>`. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const apiKey = await verifyApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const messages = await prisma.message.findMany({
    where: { leadId: lead.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ data: messages });
}

/**
 * Envia uma mensagem de texto para o lead a partir de um sistema externo.
 * Pausa a IA automaticamente para esse lead (mesmo comportamento do envio
 * manual pelo painel), já que um sistema externo assumiu o atendimento.
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const apiKey = await verifyApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const message = String(body?.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "campo 'message' obrigatório" }, { status: 400 });
  }

  const result = await sendTextMessage(lead.phone, message);
  const saved = await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: "TEXT",
    content: message,
    whatsappMessageId: result.whatsappMessageId ?? null,
    status: result.ok ? "SENT" : "FAILED",
    isAutomated: false,
  });
  await touchLeadOutbound(lead.id);
  if (!lead.humanHandoff) {
    await applyHumanHandoff(lead.id, { category: "OUTRO", reason: EXTERNAL_HANDOFF_REASON });
  }

  return NextResponse.json({ ok: result.ok, message: saved, errorMessage: result.errorMessage ?? null });
}
