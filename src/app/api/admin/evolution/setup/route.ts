import { NextRequest, NextResponse } from "next/server";
import { evolutionConfig, evolutionFetch, instancePath } from "@/lib/whatsapp/evolutionClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function call(path: string, body?: unknown, method = "POST"): Promise<{ ok: boolean; status: number; body: unknown }> {
  const response = await evolutionFetch(path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
  return { ok: response.ok, status: response.status, body: await response.json().catch(() => null) };
}

/**
 * Prepara o Evolution para este sistema: cria a instância se ainda não existir,
 * cadastra o webhook (com o segredo na URL) e liga as opções que evitam ruído
 * (ignorar grupos, não sincronizar histórico). Idempotente.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let instance: string;
  try {
    instance = evolutionConfig().instance;
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 400 });
  }

  const secret = process.env.EVOLUTION_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ ok: false, error: "EVOLUTION_WEBHOOK_SECRET não configurado" }, { status: 400 });
  }
  const webhookUrl = `${request.nextUrl.origin}/api/webhook/evolution?secret=${encodeURIComponent(secret)}`;

  const results: Record<string, unknown> = {};

  const state = await call(instancePath("/instance/connectionState"), undefined, "GET");
  results.instanceCheck = { status: state.status };
  if (state.status === 404) {
    results.createInstance = await call("/instance/create", {
      instanceName: instance,
      integration: "WHATSAPP-BAILEYS",
      qrcode: true,
    });
  }

  const events = ["MESSAGES_UPSERT", "MESSAGES_UPDATE", "CONNECTION_UPDATE"];
  let webhook = await call(instancePath("/webhook/set"), {
    webhook: { enabled: true, url: webhookUrl, webhookByEvents: false, webhookBase64: false, events },
  });
  if (!webhook.ok) {
    // Versões mais antigas do Evolution esperam o corpo sem o objeto "webhook".
    webhook = await call(instancePath("/webhook/set"), {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events,
    });
  }
  results.webhook = webhook;

  results.settings = await call(instancePath("/settings/set"), {
    rejectCall: false,
    groupsIgnore: true,
    alwaysOnline: false,
    readMessages: false,
    readStatus: false,
    syncFullHistory: false,
  });

  return NextResponse.json({ ok: true, webhookUrlConfigured: webhookUrl.replace(secret, "***"), results });
}
