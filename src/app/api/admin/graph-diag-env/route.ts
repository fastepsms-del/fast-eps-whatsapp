import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Diagnóstico de uso único: usa as variáveis de ambiente já configuradas
 * (WHATSAPP_ACCESS_TOKEN etc.) para consultar a Graph API e mostrar o estado
 * real dos números/WABAs. NUNCA devolve o token. Protegida pelo middleware
 * admin. Remover depois de usar.
 */
const KNOWN_WABA_IDS = ["1788934272228503", "2083644548902022"];

async function graphGet(path: string, token: string): Promise<unknown> {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  const sep = path.includes("?") ? "&" : "?";
  const response = await fetch(
    `https://graph.facebook.com/${version}${path}${sep}access_token=${encodeURIComponent(token)}`,
  );
  return response.json();
}

export async function GET(): Promise<NextResponse> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "WHATSAPP_ACCESS_TOKEN ausente" }, { status: 500 });
  }
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID ?? null;
  const envWabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ?? null;
  const wabaIds = Array.from(new Set([...(envWabaId ? [envWabaId] : []), ...KNOWN_WABA_IDS]));

  const [me, debug, phone] = await Promise.all([
    graphGet("/me?fields=id,name", token),
    graphGet(`/debug_token?input_token=${encodeURIComponent(token)}`, token),
    phoneId
      ? graphGet(
          `/${phoneId}?fields=id,display_phone_number,verified_name,code_verification_status,quality_rating,platform_type,status,throughput`,
          token,
        )
      : Promise.resolve(null),
  ]);

  const wabas = await Promise.all(
    wabaIds.map(async (id) => ({
      id,
      info: await graphGet(`/${id}?fields=id,name,account_review_status,business_verification_status`, token),
      phoneNumbers: await graphGet(
        `/${id}/phone_numbers?fields=id,display_phone_number,verified_name,status,platform_type,code_verification_status`,
        token,
      ),
      subscribedApps: await graphGet(`/${id}/subscribed_apps`, token),
    })),
  );

  const d = (debug as { data?: Record<string, unknown> }).data ?? debug;
  return NextResponse.json({
    env: { phoneNumberId: phoneId, wabaId: envWabaId, graphVersion: process.env.WHATSAPP_GRAPH_API_VERSION ?? null },
    me,
    token: {
      type: (d as Record<string, unknown>).type,
      app_id: (d as Record<string, unknown>).app_id,
      is_valid: (d as Record<string, unknown>).is_valid,
      expires_at: (d as Record<string, unknown>).expires_at,
      scopes: (d as Record<string, unknown>).scopes,
      granular_scopes: (d as Record<string, unknown>).granular_scopes,
      error: (debug as { error?: unknown }).error,
    },
    phone,
    wabas,
  });
}

/** Ajuste único: define o fuso (America/Campo_Grande = 23) na WABA — erro 141007. */
export async function POST(): Promise<NextResponse> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  if (!token || !wabaId) {
    return NextResponse.json({ error: "variáveis ausentes" }, { status: 500 });
  }
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  const base = `https://graph.facebook.com/${version}`;
  const update = await (
    await fetch(`${base}/${wabaId}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ timezone_id: "23" }),
    })
  ).json();
  const after = await (
    await fetch(`${base}/${wabaId}?fields=timezone_id`, { headers: { Authorization: `Bearer ${token}` } })
  ).json();
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const health = phoneId
    ? await (
        await fetch(`${base}/${phoneId}?fields=health_status`, { headers: { Authorization: `Bearer ${token}` } })
      ).json()
    : null;
  return NextResponse.json({ update, after, health });
}
