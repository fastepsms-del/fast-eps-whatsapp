import type { MessageType } from "@prisma/client";
import type { ContentBlock } from "@/lib/ai/anthropicTypes";
import type { WhatsAppInboundMessage } from "./webhookTypes";
import { downloadMedia } from "./client";
import { logEvent } from "@/lib/logger";

export interface MappedInboundMessage {
  type: MessageType;
  content: string | null;
  mediaId: string | null;
  mediaMimeType: string | null;
  aiBlocks: ContentBlock[];
}

const SUPPORTED_IMAGE_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

/**
 * Converte uma mensagem recebida do WhatsApp para (a) o que é persistido no
 * banco e (b) os blocos de conteúdo enviados à IA (incluindo baixar e
 * codificar imagens em base64 para permitir que o Claude "veja" a foto).
 */
export async function mapInboundMessage(message: WhatsAppInboundMessage): Promise<MappedInboundMessage> {
  switch (message.type) {
    case "text": {
      const text = message.text?.body ?? "";
      return { type: "TEXT", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ type: "text", text }] };
    }

    case "image": {
      const caption = message.image?.caption ?? null;
      const mediaId = message.image?.id ?? null;
      const mimeType = message.image?.mime_type ?? "image/jpeg";
      const blocks: ContentBlock[] = [];

      if (mediaId && SUPPORTED_IMAGE_MIME.has(mimeType.split(";")[0] ?? "")) {
        const media = await downloadMedia(mediaId);
        if (media) {
          blocks.push({
            type: "image",
            source: { type: "base64", media_type: normalizeImageMime(media.mimeType), data: media.base64 },
          });
        }
      }
      blocks.push({
        type: "text",
        text: caption ? `[Cliente enviou uma foto com a legenda: "${caption}"]` : "[Cliente enviou uma foto]",
      });

      return { type: "IMAGE", content: caption, mediaId, mediaMimeType: mimeType, aiBlocks: blocks };
    }

    case "document": {
      const caption = message.document?.caption ?? message.document?.filename ?? null;
      const mediaId = message.document?.id ?? null;
      const mimeType = message.document?.mime_type ?? "application/octet-stream";
      const blocks: ContentBlock[] = [];

      if (mediaId && mimeType === "application/pdf") {
        const media = await downloadMedia(mediaId);
        if (media) {
          blocks.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: media.base64 } });
        }
      }
      blocks.push({
        type: "text",
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
        aiBlocks: [{ type: "text", text: "[Cliente enviou um áudio. Transcrição não disponível — pergunte educadamente o que ele precisa em texto.]" }],
      };

    case "video":
      return {
        type: "VIDEO",
        content: message.video?.caption ?? null,
        mediaId: message.video?.id ?? null,
        mediaMimeType: message.video?.mime_type ?? null,
        aiBlocks: [{ type: "text", text: "[Cliente enviou um vídeo.]" }],
      };

    case "location": {
      const loc = message.location;
      const text = loc
        ? `[Cliente compartilhou localização: ${loc.name ?? ""} ${loc.address ?? ""} (${loc.latitude}, ${loc.longitude})]`
        : "[Cliente compartilhou uma localização]";
      return { type: "LOCATION", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ type: "text", text }] };
    }

    case "interactive": {
      const title = message.interactive?.button_reply?.title ?? message.interactive?.list_reply?.title ?? "";
      return { type: "INTERACTIVE", content: title, mediaId: null, mediaMimeType: null, aiBlocks: [{ type: "text", text: title }] };
    }

    case "button": {
      const text = message.button?.text ?? "";
      return { type: "TEXT", content: text, mediaId: null, mediaMimeType: null, aiBlocks: [{ type: "text", text }] };
    }

    default:
      await logEvent({ scope: "whatsapp", level: "warn", message: `Tipo de mensagem não suportado: ${message.type}` });
      return {
        type: "UNSUPPORTED",
        content: null,
        mediaId: null,
        mediaMimeType: null,
        aiBlocks: [{ type: "text", text: "[Cliente enviou um tipo de mensagem não suportado.]" }],
      };
  }
}

function normalizeImageMime(mime: string): "image/jpeg" | "image/png" | "image/webp" | "image/gif" {
  const base = mime.split(";")[0];
  if (base === "image/png" || base === "image/webp" || base === "image/gif") return base;
  return "image/jpeg";
}
