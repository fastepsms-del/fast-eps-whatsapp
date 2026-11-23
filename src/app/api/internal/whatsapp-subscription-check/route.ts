import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de uso único (fora de /api/admin, não depende de cookie de login):
 * usa o WHATSAPP_ACCESS_TOKEN já configurado no Vercel para checar se o
 * app está inscrito nos webhooks da WABA 1788934272228503 ("fast eps",
 * GLK Engenharia) e, se não estiver, inscreve via POST. Protegida por um
 * segredo em query string (INTERNAL_CHECK_SECRET). Remover esta rota e a
 * variável depois de confirmar que funcionou.
 */
const WABA_ID = "1788934272228503";

function graphBaseUrl(): string {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  return `https://graph.facebook.com/${version}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = request.nextUrl.searchParams.get("secret");
  const expected = process.env.INTERNAL_CHECK_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ ok: false, error: "WHATSAPP_ACCESS_TOKEN não configurado" }, { status: 500 });
  }

  const headers = { Authorization: `Bearer ${token}` };

  const beforeResponse = await fetch(`${graphBaseUrl()}/${WABA_ID}/subscribed_apps`, { headers });
  const before = await beforeResponse.json();

  const alreadySubscribed =
    beforeResponse.ok && Array.isArray(before?.data) && before.data.length > 0;

  const phoneNumbersResponse = await fetch(`${graphBaseUrl()}/${WABA_ID}/phone_numbers`, { headers });
  const phoneNumbers = await phoneNumbersResponse.json();

  if (alreadySubscribed) {
    return NextResponse.json({ ok: true, action: "none", alreadySubscribed: true, before, phoneNumbers });
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
    phoneNumbers,
  });
}
