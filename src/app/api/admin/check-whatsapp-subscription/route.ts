import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de uso único: usa o WHATSAPP_ACCESS_TOKEN já configurado no Vercel
 * para verificar (e, se preciso, corrigir) a inscrição do app na WABA
 * correta (1788934272228503, "fast eps" / GLK Engenharia), sem precisar
 * gerar ou expor nenhum token novo. Protegida pelo middleware admin.
 * Remover esta rota depois de confirmar que funcionou.
 */
const WABA_ID = "1788934272228503";

function graphBaseUrl(): string {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  return `https://graph.facebook.com/${version}`;
}

export async function GET(): Promise<NextResponse> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "WHATSAPP_ACCESS_TOKEN não configurado" }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${token}` };

  const beforeResponse = await fetch(`${graphBaseUrl()}/${WABA_ID}/subscribed_apps`, { headers });
  const before = await beforeResponse.json();

  const alreadySubscribed =
    beforeResponse.ok && Array.isArray(before?.data) && before.data.length > 0;

  if (alreadySubscribed) {
    return NextResponse.json({ ok: true, action: "none", alreadySubscribed: true, before });
  }

  const subscribeResponse = await fetch(`${graphBaseUrl()}/${WABA_ID}/subscribed_apps`, {
    method: "POST",
    headers,
  });
  const subscribeResult = await subscribeResponse.json();

  const afterResponse = await fetch(`${graphBaseUrl()}/${WABA_ID}/subscribed_apps`, { headers });
  const after = await afterResponse.json();

  return NextResponse.json({
    ok: subscribeResponse.ok,
    action: "subscribed",
    before,
    subscribeResult,
    after,
  });
}
