import { NextRequest, NextResponse } from "next/server";
import { updateKnowledgeSection } from "@/lib/config/knowledgeService";
import { buildSectionFromForm } from "@/lib/config/formCodec";
import type { KnowledgeKey } from "@/lib/config/types";
import { verifySessionToken, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

const VALID_KEYS: KnowledgeKey[] = [
  "COMPANY_INFO",
  "PRODUCTS",
  "PRICING",
  "DELIVERY",
  "INSTALLATION",
  "TECHNICAL_INFORMATION",
  "CONTACT_INFORMATION",
  "BUSINESS_HOURS",
  "FOLLOW_UP_SETTINGS",
  "HUMAN_HANDOFF_SETTINGS",
  "GREETING_SETTINGS",
];

export async function POST(request: NextRequest, { params }: { params: { key: string } }): Promise<NextResponse> {
  const key = params.key as KnowledgeKey;
  if (!VALID_KEYS.includes(key)) {
    return NextResponse.json({ error: "invalid_section" }, { status: 400 });
  }

  const form = await request.formData();

  let parsed: unknown;
  if (key === "PRODUCTS") {
    const raw = String(form.get("value") ?? "");
    try {
      parsed = JSON.parse(raw);
    } catch {
      const url = new URL("/admin/settings", request.url);
      url.searchParams.set("error", `JSON inválido em ${key}`);
      return NextResponse.redirect(url, { status: 303 });
    }
  } else {
    parsed = buildSectionFromForm(key, form);
  }

  const session = await verifySessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await updateKnowledgeSection(key, parsed as any, session?.username);
  await logEvent({ scope: "admin", level: "info", message: `Seção ${key} da base de conhecimento atualizada`, metadata: { by: session?.username } });

  const url = new URL("/admin/settings", request.url);
  url.searchParams.set("saved", key);
  return NextResponse.redirect(url, { status: 303 });
}
