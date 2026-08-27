import { NextRequest, NextResponse } from "next/server";
import { applyHumanHandoff } from "@/lib/leads/leadService";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await applyHumanHandoff(params.id, {
    category: "OUTRO",
    reason: "Transferido manualmente pela equipe pelo painel administrativo.",
  });
  return NextResponse.redirect(new URL(`/admin/leads/${params.id}`, request.url), { status: 303 });
}
