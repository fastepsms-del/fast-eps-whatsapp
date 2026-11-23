import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const APP_ID = "1403363668433200";

function graphBaseUrl(): string {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  return `https://graph.facebook.com/${version}`;
}

/**
 * Troca o código de autorização do Embedded Signup (Coexistência) por um
 * token de acesso de longa duração, usando o APP_SECRET já configurado no
 * Vercel. Protegida pelo middleware admin (precisa estar logado em /admin).
 * Rota de uso único — remover depois de confirmar que a conexão funcionou.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { code } = await request.json();
  if (!code) {
    return NextResponse.json({ ok: false, error: "código ausente" }, { status: 400 });
  }

  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    return NextResponse.json({ ok: false, error: "WHATSAPP_APP_SECRET não configurado" }, { status: 500 });
  }

  const tokenUrl = new URL(`${graphBaseUrl()}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", APP_ID);
  tokenUrl.searchParams.set("client_secret", appSecret);
  tokenUrl.searchParams.set("code", code);

  const tokenResponse = await fetch(tokenUrl.toString());
  const tokenResult = await tokenResponse.json();

  if (!tokenResponse.ok || !tokenResult.access_token) {
    return NextResponse.json({ ok: false, step: "token_exchange", result: tokenResult }, { status: 502 });
  }

  const accessToken = tokenResult.access_token as string;

  const debugResponse = await fetch(
    `${graphBaseUrl()}/debug_token?input_token=${encodeURIComponent(accessToken)}&access_token=${encodeURIComponent(accessToken)}`,
  );
  const debugResult = await debugResponse.json();

  return NextResponse.json({
    ok: true,
    accessToken,
    tokenDebug: debugResult,
  });
}
