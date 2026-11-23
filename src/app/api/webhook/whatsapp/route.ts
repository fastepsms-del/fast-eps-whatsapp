import { NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/logger";
import { isValidWhatsAppSignature } from "@/lib/whatsapp/verifySignature";
import type { WhatsAppWebhookPayload } from "@/lib/whatsapp/webhookTypes";
import { handleInboundMessage, handleStatusUpdate } from "@/lib/whatsapp/inboundHandler";

export const runtime = "nodejs";

/**
 * Webhook da WhatsApp Cloud API oficial (Meta). Só é usado quando
 * WHATSAPP_PROVIDER não é "evolution"; com Evolution API o webhook é
 * /api/webhook/evolution.
 *
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
