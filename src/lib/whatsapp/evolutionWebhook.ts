import type { MessageType } from "@prisma/client";
import type { WhatsAppInboundMessage } from "./webhookTypes";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface EvolutionKey {
  remoteJid?: string;
  remoteJidAlt?: string;
  fromMe?: boolean;
  id?: string;
}

export interface EvolutionMessageData {
  key?: EvolutionKey;
  pushName?: string;
  message?: Record<string, any>;
  messageType?: string;
  messageTimestamp?: number | string;
}

/** Normaliza "MESSAGES_UPSERT" / "messages.upsert" para "messages.upsert". */
export function normalizeEvent(event: unknown): string {
  return String(event ?? "").toLowerCase().replace(/_/g, ".");
}

/** Extrai o telefone (só dígitos) do JID; null para grupos, status, canais e JIDs sem telefone (@lid). */
export function phoneFromKey(key: EvolutionKey | undefined): string | null {
  if (!key) return null;
  const jid = key.remoteJid?.endsWith("@lid") && key.remoteJidAlt ? key.remoteJidAlt : key.remoteJid;
  if (!jid) return null;
  if (jid.endsWith("@g.us") || jid.endsWith("@broadcast") || jid.endsWith("@newsletter") || jid.endsWith("@lid")) return null;
  const digits = jid.split("@")[0]?.split(":")[0]?.replace(/\D/g, "");
  return digits || null;
}

function unwrap(message: Record<string, any> | undefined): Record<string, any> {
  let current = message ?? {};
  for (let i = 0; i < 4; i += 1) {
    const inner =
      current.ephemeralMessage?.message ??
      current.viewOnceMessage?.message ??
      current.viewOnceMessageV2?.message ??
      current.documentWithCaptionMessage?.message;
    if (!inner) break;
    current = inner;
  }
  return current;
}

/**
 * Converte uma mensagem do Evolution para o formato interno (o mesmo da Cloud
 * API). O `id` da mídia é o id da própria mensagem, que é o que o Evolution usa
 * para baixar o arquivo. Retorna null para eventos que não são mensagens do
 * cliente (reações, protocolo, enquetes etc).
 */
export function toInboundMessage(data: EvolutionMessageData, phone: string): WhatsAppInboundMessage | null {
  const id = data.key?.id;
  if (!id) return null;
  const msg = unwrap(data.message);
  const base = { id, from: phone, timestamp: String(data.messageTimestamp ?? "") };

  const text = msg.conversation ?? msg.extendedTextMessage?.text;
  if (typeof text === "string") return { ...base, type: "text", text: { body: text } };

  if (msg.imageMessage) {
    return { ...base, type: "image", image: { id, mime_type: msg.imageMessage.mimetype ?? "image/jpeg", caption: msg.imageMessage.caption } };
  }
  if (msg.documentMessage) {
    const d = msg.documentMessage;
    return { ...base, type: "document", document: { id, mime_type: d.mimetype ?? "application/octet-stream", filename: d.fileName, caption: d.caption } };
  }
  if (msg.audioMessage) {
    return { ...base, type: "audio", audio: { id, mime_type: msg.audioMessage.mimetype ?? "audio/ogg" } };
  }
  if (msg.videoMessage) {
    return { ...base, type: "video", video: { id, mime_type: msg.videoMessage.mimetype ?? "video/mp4", caption: msg.videoMessage.caption } };
  }
  if (msg.stickerMessage) {
    return { ...base, type: "sticker", sticker: { id, mime_type: msg.stickerMessage.mimetype ?? "image/webp" } };
  }
  if (msg.locationMessage) {
    const l = msg.locationMessage;
    return { ...base, type: "location", location: { latitude: l.degreesLatitude, longitude: l.degreesLongitude, name: l.name, address: l.address } };
  }
  if (msg.contactMessage || msg.contactsArrayMessage) return { ...base, type: "contacts" };
  if (msg.buttonsResponseMessage) {
    return { ...base, type: "button", button: { text: msg.buttonsResponseMessage.selectedDisplayText ?? "" } };
  }
  if (msg.templateButtonReplyMessage) {
    return { ...base, type: "button", button: { text: msg.templateButtonReplyMessage.selectedDisplayText ?? "" } };
  }
  if (msg.listResponseMessage) {
    return { ...base, type: "interactive", interactive: { type: "list_reply", list_reply: { id: "", title: msg.listResponseMessage.title ?? "" } } };
  }
  return null;
}

/** Tipo e conteúdo para gravar no histórico uma mensagem enviada pelo celular (não passa pela IA). */
export function describeForRecord(message: WhatsAppInboundMessage): { type: MessageType; content: string | null } {
  switch (message.type) {
    case "text":
      return { type: "TEXT", content: message.text?.body ?? "" };
    case "image":
      return { type: "IMAGE", content: message.image?.caption ?? null };
    case "document":
      return { type: "DOCUMENT", content: message.document?.caption ?? message.document?.filename ?? null };
    case "audio":
      return { type: "AUDIO", content: null };
    case "video":
      return { type: "VIDEO", content: message.video?.caption ?? null };
    case "sticker":
      return { type: "STICKER", content: null };
    case "location":
      return { type: "LOCATION", content: null };
    case "contacts":
      return { type: "CONTACTS", content: null };
    case "button":
      return { type: "TEXT", content: message.button?.text ?? "" };
    case "interactive":
      return { type: "INTERACTIVE", content: message.interactive?.list_reply?.title ?? null };
    default:
      return { type: "UNSUPPORTED", content: null };
  }
}

const EVOLUTION_STATUS_TO_INTERNAL: Record<string, string> = {
  PENDING: "sent",
  SERVER_ACK: "sent",
  DELIVERY_ACK: "delivered",
  READ: "read",
  PLAYED: "read",
  ERROR: "failed",
};

export function mapEvolutionStatus(status: unknown): string | null {
  return EVOLUTION_STATUS_TO_INTERNAL[String(status ?? "").toUpperCase()] ?? null;
}
