import { NextRequest, NextResponse } from "next/server";
import type { MessageType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { mediaKindFromMime, sendMediaMessage, type OutboundMediaKind } from "@/lib/whatsapp/client";
import { recordMessage } from "@/lib/conversation/messageService";
import { MAX_MEDIA_BYTES } from "@/lib/conversation/mediaLimits";
import { finishManualReply } from "@/lib/leads/manualReply";
import { getSessionFromRequest } from "@/lib/session";

export const runtime = "nodejs";
export const maxDuration = 60;

const TYPE_BY_KIND: Record<OutboundMediaKind, MessageType> = {
  image: "IMAGE",
  video: "VIDEO",
  audio: "AUDIO",
  document: "DOCUMENT",
};

function back(request: NextRequest, leadId: string, notice?: string, detail?: string): NextResponse {
  const url = new URL(`/admin/leads/${leadId}`, request.url);
  if (notice) url.searchParams.set("notice", notice);
  if (detail) url.searchParams.set("detail", detail.slice(0, 200));
  return NextResponse.redirect(url, { status: 303 });
}

/** Envio de foto, vídeo, áudio ou documento pelo painel (atendente humano). Pausa a IA como o envio de texto. */
export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.redirect(new URL("/admin/leads", request.url), { status: 303 });

  const form = await request.formData();
  const file = form.get("file");
  const caption = String(form.get("caption") ?? "").trim();

  if (!file || typeof file === "string" || file.size === 0) return back(request, lead.id, "sem_arquivo");
  if (file.size > MAX_MEDIA_BYTES) return back(request, lead.id, "arquivo_grande");

  const mimeType = file.type || "application/octet-stream";
  const kind = mediaKindFromMime(mimeType);
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");

  const result = await sendMediaMessage(lead.phone, {
    kind,
    base64,
    mimeType,
    fileName: file.name || "arquivo",
    caption: caption || undefined,
  });

  await recordMessage(lead.id, {
    direction: "OUTBOUND",
    type: TYPE_BY_KIND[kind],
    content: caption || file.name || null,
    mediaMimeType: mimeType,
    whatsappMessageId: result.whatsappMessageId ?? null,
    status: result.ok ? "SENT" : "FAILED",
    isAutomated: false,
  });
  await finishManualReply(lead, await getSessionFromRequest(request));

  return result.ok ? back(request, lead.id) : back(request, lead.id, "falha_envio", result.errorMessage);
}
