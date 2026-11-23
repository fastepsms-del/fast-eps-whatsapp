import { logEvent } from "@/lib/logger";
import { evolutionDownloadMedia, evolutionSendMedia, evolutionSendText } from "./evolutionClient";

export type WhatsAppProvider = "meta" | "evolution";

export function whatsappProvider(): WhatsAppProvider {
  return process.env.WHATSAPP_PROVIDER === "evolution" ? "evolution" : "meta";
}

/** Só a Cloud API da Meta tem janela de 24h e exige template fora dela. */
export function usesTemplates(): boolean {
  return whatsappProvider() === "meta";
}

function graphBaseUrl(): string {
  const version = process.env.WHATSAPP_GRAPH_API_VERSION || "v20.0";
  return `https://graph.facebook.com/${version}`;
}

function phoneNumberId(): string {
  const id = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!id) throw new Error("WHATSAPP_PHONE_NUMBER_ID não configurado");
  return id;
}

function accessToken(): string {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error("WHATSAPP_ACCESS_TOKEN não configurado");
  return token;
}

async function graphFetch(path: string, init: RequestInit): Promise<Response> {
  const url = `${graphBaseUrl()}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken()}`,
      ...(init.headers ?? {}),
    },
  });
  return response;
}

export interface SendResult {
  ok: boolean;
  whatsappMessageId?: string;
  errorMessage?: string;
}

export type OutboundMediaKind = "image" | "video" | "audio" | "document";

export interface OutboundMedia {
  kind: OutboundMediaKind;
  base64: string;
  mimeType: string;
  fileName: string;
  caption?: string;
}

/** Define como o arquivo vai aparecer no WhatsApp (foto, vídeo, áudio ou documento) a partir do tipo MIME. */
export function mediaKindFromMime(mimeType: string): OutboundMediaKind {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document";
}

/** Envia foto, vídeo, áudio ou documento. Só disponível com o Evolution API. */
export async function sendMediaMessage(to: string, media: OutboundMedia): Promise<SendResult> {
  if (whatsappProvider() === "evolution") return evolutionSendMedia(to, media);
  return { ok: false, errorMessage: "Envio de mídia pelo painel só está disponível com o Evolution API." };
}

/** Envia uma mensagem de texto simples dentro da janela de 24h de atendimento. */
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
  if (whatsappProvider() === "evolution") return evolutionSendText(to, body);
  return sendPayload({
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: { body, preview_url: false },
  });
}

/**
 * Envia uma mensagem de template aprovado (obrigatório para reabrir a
 * conversa fora da janela de 24h, ex: follow-up automático). O nome do
 * template e os parâmetros devem corresponder ao que foi aprovado no Meta
 * Business Manager.
 */
export async function sendTemplateMessage(
  to: string,
  templateName: string,
  languageCode = "pt_BR",
  bodyParams: string[] = [],
): Promise<SendResult> {
  if (!usesTemplates()) {
    return { ok: false, errorMessage: "Templates não existem no Evolution API; envie texto livre." };
  }
  return sendPayload({
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      ...(bodyParams.length > 0
        ? { components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] }
        : {}),
    },
  });
}

async function sendPayload(payload: Record<string, unknown>): Promise<SendResult> {
  try {
    const response = await graphFetch(`/${phoneNumberId()}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = (await response.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message: string; code?: number };
    };

    if (!response.ok || json.error) {
      const errorMessage = json.error?.message || `HTTP ${response.status}`;
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao enviar mensagem: ${errorMessage}`, metadata: { payload } });
      return { ok: false, errorMessage };
    }

    return { ok: true, whatsappMessageId: json.messages?.[0]?.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logEvent({ scope: "whatsapp", level: "error", message: `Exceção ao enviar mensagem: ${errorMessage}` });
    return { ok: false, errorMessage };
  }
}

export async function markMessageAsRead(whatsappMessageId: string): Promise<void> {
  if (whatsappProvider() === "evolution") return;
  try {
    await graphFetch(`/${phoneNumberId()}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        status: "read",
        message_id: whatsappMessageId,
      }),
    });
  } catch (error) {
    await logEvent({ scope: "whatsapp", level: "warn", message: `Falha ao marcar mensagem como lida: ${String(error)}` });
  }
}

export interface DownloadedMedia {
  base64: string;
  mimeType: string;
}

/** Resolve a URL temporária de uma mídia e baixa o conteúdo em base64. */
export async function downloadMedia(mediaId: string): Promise<DownloadedMedia | null> {
  if (whatsappProvider() === "evolution") return evolutionDownloadMedia(mediaId);
  try {
    const metaResponse = await graphFetch(`/${mediaId}`, { method: "GET" });
    const meta = (await metaResponse.json()) as { url?: string; mime_type?: string; error?: { message: string } };

    if (!metaResponse.ok || !meta.url) {
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao resolver URL de mídia ${mediaId}: ${meta.error?.message ?? "sem URL"}` });
      return null;
    }

    const fileResponse = await fetch(meta.url, {
      headers: { Authorization: `Bearer ${accessToken()}` },
    });
    if (!fileResponse.ok) {
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao baixar mídia ${mediaId}: HTTP ${fileResponse.status}` });
      return null;
    }

    const arrayBuffer = await fileResponse.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { base64, mimeType: meta.mime_type ?? "application/octet-stream" };
  } catch (error) {
    await logEvent({ scope: "whatsapp", level: "error", message: `Exceção ao baixar mídia ${mediaId}: ${String(error)}` });
    return null;
  }
}
