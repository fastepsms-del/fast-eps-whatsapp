import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de diagnóstico de uso único: recebe um token (via POST, nunca em
 * query string) e roda várias checagens diretas na Graph API pra obter
 * fatos concretos (quem é o dono do token, status de verificação das
 * empresas, WABAs de fato acessíveis) em vez de inferir pela interface.
 * Protegida pelo middleware admin. Remover depois de usar.
 */
const KNOWN_WABA_IDS = ["1788934272228503", "2083644548902022"];

function graphBaseUrl(): string {
  return "https://graph.facebook.com/v20.0";
}

async function graphGet(path: string, token: string): Promise<unknown> {
  const response = await fetch(`${graphBaseUrl()}${path}${path.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(token)}`);
  return response.json();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: "token ausente" }, { status: 400 });
  }

  const me = await graphGet("/me?fields=id,name", token);
  const businesses = await graphGet("/me/businesses?fields=id,name,verification_status", token);

  const businessList = (businesses as { data?: Array<{ id: string; name: string }> }).data ?? [];
  const businessDetails = await Promise.all(
    businessList.map((b) => graphGet(`/${b.id}?fields=id,name,verification_status`, token)),
  );

  const wabaChecks = await Promise.all(
    KNOWN_WABA_IDS.map(async (wabaId) => ({
      wabaId,
      info: await graphGet(`/${wabaId}?fields=id,name,timezone_id,message_template_namespace`, token),
      phoneNumbers: await graphGet(`/${wabaId}/phone_numbers`, token),
      subscribedApps: await graphGet(`/${wabaId}/subscribed_apps`, token),
    })),
  );

  return NextResponse.json({
    me,
    businesses,
    businessDetails,
    wabaChecks,
  });
}
