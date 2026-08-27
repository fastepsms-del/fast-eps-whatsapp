import { logEvent } from "@/lib/logger";

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

/** Envia uma mensagem de texto simples dentro da janela de 24h de atendimento. */
export async function sendTextMessage(to: string, body: string): Promise<SendResult> {
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
