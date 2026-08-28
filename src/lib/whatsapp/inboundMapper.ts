import type { MessageType } from "@prisma/client";
import type { Part } from "@google/genai";
import type { WhatsAppInboundMessage } from "./webhookTypes";
import { downloadMedia } from "./client";
import { logEvent } from "@/lib/logger";

export interface MappedInboundMessage {
    type: MessageType;
    content: string | null;
    mediaId: string | null;
    mediaMimeType: string | null;
    aiBlocks: Part[];
}

const SUPPORTED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Converte uma mensagem recebida do WhatsApp para (a) o que é persistido no
 * banco e (b) as partes de conteúdo enviadas à IA (incluindo baixar e
 * codificar imagens em base64 para permitir que o Gemini "veja" a foto).
 */
export async function mapInboundMessage(message: WhatsAppInboundMessage): Promise<MappedInboundMessage> {
    switch (message.type) {
      case "text": {
              const text = message.text?.body ?? "";
              return { type: "TEXT", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ text }] };
      }

      case "image": {
              const caption = message.image?.caption ?? null;
              const mediaId = message.image?.id ?? null;
              const mimeType = message.image?.mime_type ?? "image/jpeg";
              const blocks: Part[] = [];

              if (mediaId && SUPPORTED_IMAGE_MIME.has(mimeType.split(";")[0] ?? "")) {
                        const media = await downloadMedia(mediaId);
                        if (media) {
                                    blocks.push({ inlineData: { mimeType: media.mimeType, data: media.base64 } });
                        }
              }
              blocks.push({
                        text: caption ? `[Cliente enviou uma foto com a legenda: "${caption}"]` : "[Cliente enviou uma foto]",
              });

              return { type: "IMAGE", content: caption, mediaId, mediaMimeType: mimeType, aiBlocks: blocks };
      }

      case "document": {
              const caption = message.document?.caption ?? message.document?.filename ?? null;
              const mediaId = message.document?.id ?? null;
              const mimeType = message.document?.mime_type ?? "application/octet-stream";
              const blocks: Part[] = [];

              if (mediaId && mimeType === "application/pdf") {
                        const media = await downloadMedia(mediaId);
                        if (media) {
                                    blocks.push({ inlineData: { mimeType: "application/pdf", data: media.base64 } });
                        }
              }
              blocks.push({
                        text: caption
                          ? `[Cliente enviou um documento/projeto: "${caption}"]`
                                    : "[Cliente enviou um documento/projeto]",
              });

              return { type: "DOCUMENT", content: caption, mediaId, mediaMimeType: mimeType, aiBlocks: blocks };
      }

      case "audio":
              return {
                        type: "AUDIO",
                        content: null,
                        mediaId: message.audio?.id ?? null,
                        mediaMimeType: message.audio?.mime_type ?? null,
                        aiBlocks: [{ text: "[Cliente enviou um áudio. Transcrição não disponível — pergunte educadamente o que ele precisa em texto.]" }],
              };

      case "video":
              return {
                        type: "VIDEO",
                        content: message.video?.caption ?? null,
                        mediaId: message.video?.id ?? null,
                        mediaMimeType: message.video?.mime_type ?? null,
                        aiBlocks: [{ text: "[Cliente enviou um vídeo.]" }],
              };

      case "location": {
              const loc = message.location;
              const text = loc
                ? `[Cliente compartilhou localização: ${loc.name ?? ""} ${loc.address ?? ""} (${loc.latitude}, ${loc.longitude})]`
                        : "[Cliente compartilhou uma localização]";
              return { type: "LOCATION", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ text }] };
      }

      case "interactive": {
              const title = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? "";
              return { type: "INTERACTIVE", content: title, mediaId: null, mediaMimeType: null, aiBlocks: [{ text: title }] };
      }

      case "button": {
              const text = message.button?.text ?? "";
              return { type: "TEXT", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ text }] };
      }

      default:
              await logEvent({ scope: "whatsapp", level: "warn", message: `Tipo de mensagem não suportado: ${message.type}` });
              return {
                        type: "UNSUPPORTED",
                        content: null,
                        mediaId: null,
                        mediaMimeType: null,
                        aiBlocks: [{ text: "[Cliente enviou um tipo de mensagem não suportado.]" }],
              };
    }
}
