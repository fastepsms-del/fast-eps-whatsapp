import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { CONVERSATION_MESSAGE_LIMIT, toClientMessage } from "@/lib/conversation/clientMessage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mensagens recentes da conversa, usadas pela tela do painel para atualizar sozinha. */
export async function GET(_request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const messages = await prisma.message.findMany({
    where: { leadId: params.id },
    orderBy: { createdAt: "desc" },
    take: CONVERSATION_MESSAGE_LIMIT,
  });
  return NextResponse.json({ messages: messages.reverse().map(toClientMessage) });
}
