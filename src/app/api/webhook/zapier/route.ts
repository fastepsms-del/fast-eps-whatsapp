import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { findOrCreateLeadByPhone, touchLeadInbound, touchLeadOutbound } from "@/lib/leads/leadService";
import { recordMessage } from "@/lib/conversation/messageService";
import { processInboundTurn, buildUnavailableFallback } from "@/lib/ai/aiEngine";

export const runtime = "nodejs";

/**
 * Caminho alternativo de entrada, usado quando o número roda via Zapier
 * (Baileys) em vez da API oficial da Meta. O Zap "Webhooks by Zapier" chama
 * esta rota a cada mensagem recebida; a resposta JSON `{ reply }` é usada
 * pelo próximo passo do Zap para enviar a mensagem de volta ao cliente.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.ZAPIER_WEBHOOK_SECRET;
  if (secret) {
    const provided = request.headers.get("x-zapier-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  } else {
    await logEvent({ scope: "webhook", level: "warn", message: "ZAPIER_WEBHOOK_SECRET não configurado — endpoint aceitando qualquer chamada (não use assim em produção)" });
  }

  let body: { phone?: string; message?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const phone = normalizePhone(body.phone);
  const message = (body.message ?? "").trim();

  if (!phone || !message) {
    return NextResponse.json({ error: "phone_and_message_required" }, { status: 400 });
  }

  const lead = await findOrCreateLeadByPhone(phone, body.name);
  await touchLeadInbound(lead.id);

  const inboundMessage = await recordMessage(lead.id, {
    direction: "INBOUND",
    type: "TEXT",
    content: message,
  });

  if (lead.humanHandoff) {
    await logEvent({ scope: "webhook", level: "info", message: "Mensagem recebida (Zapier) durante atendimento humano, IA não respondeu", metadata: { leadId: lead.id } });
    return NextResponse.json({ reply: null });
  }

  let replyText: string;
  try {
    const result = await processInboundTurn(lead, inboundMessage.id, [{ text: message }]);
    replyText = result.replyText;
  } catch (error) {
    await logEvent({ scope: "ai", level: "error", message: `Falha ao processar turno de IA (Zapier): ${String(error)}`, metadata: { leadId: lead.id } });
    replyText = await buildUnavailableFallback(lead.id);
  }

  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: "TEXT",
    content: replyText,
  });
  await touchLeadOutbound(lead.id);

  return NextResponse.json({ reply: replyText });
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 8 ? digits : null;
}
