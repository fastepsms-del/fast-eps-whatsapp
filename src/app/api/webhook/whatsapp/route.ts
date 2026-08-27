import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { logEvent } from "@/lib/logger";
import { isValidWhatsAppSignature } from "@/lib/whatsapp/verifySignature";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/webhookTypes";
import { mapInboundMessage } from "@/lib/whatsapp/inboundMapper";
import { markMessageAsRead, sendTextMessage } from "@/lib/whatsapp/client";
import { findOrCreateLeadByPhone, touchLeadInbound, touchLeadOutbound } from "@/lib/leads/leadService";
import { recordMessage } from "@/lib/conversation/messageService";
import { processInboundTurn, buildUnavailableFallback } from "@/lib/ai/aiEngine";

export const runtime = "nodejs";

/**
 * Verificação do webhook (setup único no Meta App > WhatsApp > Configuration).
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verification-requests
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  await logEvent({ scope: "webhook", level: "warn", message: "Tentativa de verificação de webhook com token inválido" });
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();

  const appSecretConfigured = Boolean(process.env.WHATSAPP_APP_SECRET);
  if (appSecretConfigured) {
    const signature = request.headers.get("x-hub-signature-256");
    if (!isValidWhatsAppSignature(rawBody, signature)) {
      await logEvent({ scope: "webhook", level: "error", message: "Assinatura do webhook inválida — requisição rejeitada" });
      return new NextResponse("Invalid signature", { status: 401 });
    }
  } else {
    await logEvent({ scope: "webhook", level: "warn", message: "WHATSAPP_APP_SECRET não configurado — assinatura não verificada (não use assim em produção)" });
  }

  let payload: WhatsAppWebhookPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 });
  }

  // Responder rápido é importante para a Meta não re-tentar o webhook, mas
  // processamos de forma síncrona por simplicidade (ver README para notas
  // sobre escalar isso com uma fila em alto volume).
  try {
    await handlePayload(payload);
  } catch (error) {
    await logEvent({ scope: "webhook", level: "error", message: `Erro não tratado processando webhook: ${String(error)}` });
  }

  return NextResponse.json({ received: true });
}

async function handlePayload(payload: WhatsAppWebhookPayload): Promise<void> {
  if (payload.object !== "whatsapp_business_account") return;

  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;

      for (const status of value.statuses ?? []) {
        await handleStatusUpdate(status);
      }

      for (const message of value.messages ?? []) {
        const profileName = value.contacts?.find((c) => c.wa_id === message.from)?.profile?.name;
        await handleInboundMessage(message, profileName);
      }
    }
  }
}

async function handleStatusUpdate(status: { id: string; status: string; errors?: Array<{ message?: string }> }): Promise<void> {
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

function mapWhatsAppStatus(status: string): "SENT" | "DELIVERED" | "READ" | "FAILED" | "QUEUED" {
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

async function handleInboundMessage(message: Parameters<typeof mapInboundMessage>[0], profileName?: string): Promise<void> {
  // Idempotência: a Meta pode reenviar o mesmo evento de webhook.
  const alreadyProcessed = await prisma.message.findUnique({ where: { whatsappMessageId: message.id } });
  if (alreadyProcessed) return;

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

  let replyText: string;
  try {
    const result = await processInboundTurn(lead, inboundMessage.id, mapped.aiBlocks);
    replyText = result.replyText;
  } catch (error) {
    await logEvent({ scope: "ai", level: "error", message: `Falha ao processar turno de IA: ${String(error)}`, metadata: { leadId: lead.id } });
    replyText = await buildUnavailableFallback(lead.id);
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
