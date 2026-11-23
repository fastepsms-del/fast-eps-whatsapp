import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { finishManualReply } from "@/lib/leads/manualReply";
import { getSessionFromRequest } from "@/lib/session";

export const runtime = "nodejs";

/**
 * Envio manual de mensagem pelo painel (atendente humano respondendo).
 * Assim que um humano manda uma mensagem manual, a automação é pausada
 * automaticamente (mesmo efeito de request_human_handoff): quando é
 * atendimento humano, só o humano fala — a IA não entra mais na conversa até
 * alguém reativar pelo botão "Reativar atendimento automático".
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const form = await request.formData();
  const message = String(form.get("message") ?? "").trim();

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (lead && message) {
    const result = await sendTextMessage(lead.phone, message);
    await recordMessage(lead.id, {
      direction: "OUTBOUND",
      type: "TEXT",
      content: message,
      whatsappMessageId: result.whatsappMessageId ?? null,
      status: result.ok ? "SENT" : "FAILED",
      isAutomated: false,
    });
    await finishManualReply(lead, await getSessionFromRequest(request));
  }

  return NextResponse.redirect(new URL(`/admin/leads/${params.id}`, request.url), { status: 303 });
}
