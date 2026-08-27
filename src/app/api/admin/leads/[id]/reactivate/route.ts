import { NextRequest, NextResponse } from "next/server";
import { reactivateAutomation } from "@/lib/leads/leadService";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await reactivateAutomation(params.id);
  await logEvent({ scope: "admin", level: "info", message: `Automação reativada manualmente para o lead ${params.id}` });
  return NextResponse.redirect(new URL(`/admin/leads/${params.id}`, request.url), { status: 303 });
}
