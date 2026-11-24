import { NextRequest, NextResponse } from "next/server";
import { evolutionFindChats } from "@/lib/whatsapp/evolutionClient";
import { importChat } from "@/lib/whatsapp/historyImport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CHATS_PER_CALL = 4;

/** Importa o histórico em lotes: o painel chama de novo com o `next` devolvido até terminar. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = (await request.json().catch(() => ({}))) as { offset?: number };
  const offset = Math.max(0, Number(body.offset) || 0);
  try {
    const chats = await evolutionFindChats();
    const slice = chats.slice(offset, offset + CHATS_PER_CALL);
    let messages = 0;
    let newLeads = 0;
    let skipped = 0;
    for (const chat of slice) {
      try {
        const r = await importChat(chat);
        messages += r.messages;
        if (r.createdLead) newLeads += 1;
        if (r.skipped) skipped += 1;
      } catch {
        skipped += 1;
      }
    }
    const next = offset + slice.length;
    return NextResponse.json({ ok: true, total: chats.length, next, done: next >= chats.length, messages, newLeads, skipped });
  } catch (error) {
    return NextResponse.json({ ok: false, error: String(error) }, { status: 502 });
  }
}
