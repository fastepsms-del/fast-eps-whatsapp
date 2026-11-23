import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { downloadMedia } from "@/lib/whatsapp/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Entrega a foto/áudio/documento de uma mensagem recebida, buscando o arquivo no provedor do WhatsApp. */
export async function GET(_request: NextRequest, { params }: { params: { messageId: string } }): Promise<NextResponse> {
  const message = await prisma.message.findUnique({ where: { id: params.messageId } });
  if (!message?.mediaId) return new NextResponse("Mídia não encontrada", { status: 404 });

  const media = await downloadMedia(message.mediaId);
  if (!media) return new NextResponse("Não foi possível baixar a mídia", { status: 502 });

  return new NextResponse(new Uint8Array(Buffer.from(media.base64, "base64")), {
    headers: {
      "Content-Type": media.mimeType.split(";")[0] || "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
