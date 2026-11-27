import { NextRequest, NextResponse } from "next/server";
import { setAiPaused, setOldLeadsFollowUp } from "@/lib/aiSwitch";
import { getSessionFromRequest } from "@/lib/session";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const session = await getSessionFromRequest(request);
  if (form.has("oldFollowUp")) {
    const enabled = form.get("oldFollowUp") === "1";
    await setOldLeadsFollowUp(enabled, session?.username);
    await logEvent({ scope: "admin", level: "warn", message: enabled ? "Follow-up de contatos antigos LIGADO" : "Follow-up de contatos antigos desligado" });
    return NextResponse.redirect(new URL("/admin/leads", request.url), { status: 303 });
  }
  const paused = form.get("paused") === "1";
  await setAiPaused(paused, session?.username);
  await logEvent({ scope: "admin", level: "warn", message: paused ? "IA pausada para todos os leads" : "IA reativada para todos os leads" });
  return NextResponse.redirect(new URL("/admin/leads", request.url), { status: 303 });
}
