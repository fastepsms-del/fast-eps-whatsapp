import { NextRequest, NextResponse } from "next/server";
import { runFollowUpSweep } from "@/lib/followup/followupService";
import { logEvent } from "@/lib/logger";

export const runtime = "nodejs";
// Evita cache de qualquer tipo nesta rota — cada chamada deve processar de novo.
export const dynamic = "force-dynamic";

/**
 * Endpoint chamado periodicamente (Vercel Cron ou outro agendador externo)
 * para disparar follow-ups automáticos. Protegido por um segredo simples
 * enviado no header Authorization.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;

  if (expected && authHeader !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const result = await runFollowUpSweep();
    await logEvent({ scope: "cron", level: "info", message: "Sweep de follow-up concluído", metadata: result as unknown as Record<string, unknown> });
    return NextResponse.json(result);
  } catch (error) {
    await logEvent({ scope: "cron", level: "error", message: `Erro no sweep de follow-up: ${String(error)}` });
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
