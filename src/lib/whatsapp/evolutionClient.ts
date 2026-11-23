import type { DownloadedMedia, OutboundMedia, SendResult } from "./client";
import { logEvent } from "@/lib/logger";

interface EvolutionConfig {
  baseUrl: string;
  apiKey: string;
  instance: string;
}

export function evolutionConfig(): EvolutionConfig {
  const baseUrl = process.env.EVOLUTION_API_URL?.replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instance = process.env.EVOLUTION_INSTANCE;
  if (!baseUrl || !apiKey || !instance) {
    throw new Error("EVOLUTION_API_URL, EVOLUTION_API_KEY e EVOLUTION_INSTANCE precisam estar configurados");
  }
  return { baseUrl, apiKey, instance };
}

export async function evolutionFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { baseUrl, apiKey } = evolutionConfig();
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { apikey: apiKey, "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
}

export function instancePath(prefix: string): string {
  return `${prefix}/${encodeURIComponent(evolutionConfig().instance)}`;
}

function describeError(json: unknown, status: number): string {
  const j = json as { response?: { message?: unknown }; message?: unknown; error?: unknown } | null;
  const detail = j?.response?.message ?? j?.message ?? j?.error ?? `HTTP ${status}`;
  return typeof detail === "string" ? detail : JSON.stringify(detail);
}

export async function evolutionSendText(to: string, body: string): Promise<SendResult> {
  try {
    const response = await evolutionFetch(instancePath("/message/sendText"), {
      method: "POST",
      // delay simula "digitando…" antes de enviar, deixando o envio com cara de humano.
      body: JSON.stringify({ number: to, text: body, delay: Math.min(2500, 500 + body.length * 15) }),
    });
    const json = (await response.json().catch(() => null)) as { key?: { id?: string } } | null;

    if (!response.ok || !json?.key?.id) {
      const errorMessage = describeError(json, response.status);
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao enviar mensagem (Evolution): ${errorMessage}`, metadata: { to } });
      return { ok: false, errorMessage };
    }
    return { ok: true, whatsappMessageId: json.key.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logEvent({ scope: "whatsapp", level: "error", message: `Exceção ao enviar mensagem (Evolution): ${errorMessage}`, metadata: { to } });
    return { ok: false, errorMessage };
  }
}

/** Envia foto, vídeo, documento (endpoint sendMedia) ou áudio como mensagem de voz (sendWhatsAppAudio). */
export async function evolutionSendMedia(to: string, media: OutboundMedia): Promise<SendResult> {
  try {
    const isAudio = media.kind === "audio";
    const response = await evolutionFetch(instancePath(isAudio ? "/message/sendWhatsAppAudio" : "/message/sendMedia"), {
      method: "POST",
      body: JSON.stringify(
        isAudio
          ? { number: to, audio: media.base64, encoding: true }
          : {
              number: to,
              mediatype: media.kind,
              mimetype: media.mimeType,
              caption: media.caption ?? "",
              media: media.base64,
              fileName: media.fileName,
            },
      ),
    });
    const json = (await response.json().catch(() => null)) as { key?: { id?: string } } | null;

    if (!response.ok || !json?.key?.id) {
      const errorMessage = describeError(json, response.status);
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao enviar mídia (Evolution): ${errorMessage}`, metadata: { to, kind: media.kind } });
      return { ok: false, errorMessage };
    }
    return { ok: true, whatsappMessageId: json.key.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logEvent({ scope: "whatsapp", level: "error", message: `Exceção ao enviar mídia (Evolution): ${errorMessage}`, metadata: { to, kind: media.kind } });
    return { ok: false, errorMessage };
  }
}

/** Baixa a mídia de uma mensagem recebida; `messageId` é o id da mensagem no WhatsApp. */
export async function evolutionDownloadMedia(messageId: string): Promise<DownloadedMedia | null> {
  try {
    const response = await evolutionFetch(instancePath("/chat/getBase64FromMediaMessage"), {
      method: "POST",
      body: JSON.stringify({ message: { key: { id: messageId } }, convertToMp4: false }),
    });
    const json = (await response.json().catch(() => null)) as { base64?: string; mimetype?: string } | null;

    if (!response.ok || !json?.base64) {
      await logEvent({ scope: "whatsapp", level: "error", message: `Falha ao baixar mídia ${messageId} (Evolution): ${describeError(json, response.status)}` });
      return null;
    }
    return {
      base64: json.base64.replace(/^data:[^;]+;base64,/, ""),
      mimeType: json.mimetype ?? "application/octet-stream",
    };
  } catch (error) {
    await logEvent({ scope: "whatsapp", level: "error", message: `Exceção ao baixar mídia ${messageId} (Evolution): ${String(error)}` });
    return null;
  }
}
