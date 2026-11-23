import type { Message } from "@prisma/client";

/** Mensagem no formato enviado ao navegador (datas em texto ISO, sem expor ids internos da mídia). */
export interface ClientMessage {
  id: string;
  direction: "INBOUND" | "OUTBOUND";
  type: string;
  status: string;
  content: string | null;
  hasMedia: boolean;
  mediaMimeType: string | null;
  isFollowUp: boolean;
  isAutomated: boolean;
  intent: string | null;
  createdAt: string;
}

export function toClientMessage(message: Message): ClientMessage {
  return {
    id: message.id,
    direction: message.direction,
    type: message.type,
    status: message.status,
    content: message.content,
    hasMedia: Boolean(message.mediaId),
    mediaMimeType: message.mediaMimeType,
    isFollowUp: message.isFollowUp,
    isAutomated: message.isAutomated,
    intent: message.intent,
    createdAt: message.createdAt.toISOString(),
  };
}

/** Quantidade de mensagens recentes carregadas na tela de conversa. */
export const CONVERSATION_MESSAGE_LIMIT = 300;
