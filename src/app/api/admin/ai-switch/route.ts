import { NextRequest, NextResponse } from "next/server";
import { setAiPaused } from "@/lib/aiSwitch";
import { getSessionFromRequest } from "@/lib/session";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const paused = form.get("paused") === "1";
  const session = await getSessionFromRequest(request);
  await setAiPaused(paused, session?.username);
  await logEvent({ scope: "admin", level: "warn", message: paused ? "IA pausada para todos os leads" : "IA reativada para todos os leads" });
  return NextResponse.redirect(new URL("/admin/leads", request.url), { status: 303 });
}
