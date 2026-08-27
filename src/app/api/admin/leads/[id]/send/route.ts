import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { sendTextMessage } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { touchLeadOutbound } from "@/lib/leads/leadService";

export const runtime = "nodejs";

/** Envio manual de mensagem pelo painel (ex: atendente humano respondendo). */
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
    await touchLeadOutbound(lead.id);
  }

  return NextResponse.redirect(new URL(`/admin/leads/${params.id}`, request.url), { status: 303 });
}
