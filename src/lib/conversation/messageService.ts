import { prisma } from "@/lib/db/prisma";
import type { Lead, Message, MessageDirection, MessageIntent, MessageStatus, MessageType } from "@prisma/client";
import type { ChatMessage, ContentBlock } from "@/lib/ai/anthropicTypes";

const HISTORY_LIMIT = 24;

export interface RecordMessageInput {
  direction: MessageDirection;
  type?: MessageType;
  status?: MessageStatus;
  content?: string | null;
  mediaId?: string | null;
  mediaMimeType?: string | null;
  whatsappMessageId?: string | null;
  isFollowUp?: boolean;
  isAutomated?: boolean;
  intent?: MessageIntent | null;
}

export async function recordMessage(leadId: string, input: RecordMessageInput): Promise<Message> {
  return prisma.message.create({
    data: {
      leadId,
      direction: input.direction,
      type: input.type ?? "TEXT",
      status: input.status ?? (input.direction === "OUTBOUND" ? "SENT" : "DELIVERED"),
      content: input.content ?? null,
      mediaId: input.mediaId ?? null,
      mediaMimeType: input.mediaMimeType ?? null,
      whatsappMessageId: input.whatsappMessageId ?? null,
      isFollowUp: input.isFollowUp ?? false,
      isAutomated: input.isAutomated ?? true,
      intent: input.intent ?? null,
    },
  });
}

export async function setMessageIntent(messageId: string, intent: MessageIntent): Promise<void> {
  await prisma.message.update({ where: { id: messageId }, data: { intent } });
}

export async function getRecentMessages(leadId: string, limit = HISTORY_LIMIT): Promise<Message[]> {
  const rows = await prisma.message.findMany({
    where: { leadId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return rows.reverse();
}

/**
 * Converte o histórico de mensagens do banco no formato de `messages` da
 * Claude API. A última mensagem inbound pode ser substituída por blocos de
 * conteúdo "ricos" (ex: imagem em base64 recém-baixada), enquanto o restante
 * do histórico usa apenas texto/placeholders (não re-baixamos mídia antiga a
 * cada turno por custo e latência).
 */
export function buildChatHistory(
  messages: Message[],
  overrides?: { messageId: string; blocks: ContentBlock[] },
): ChatMessage[] {
  const chat: ChatMessage[] = [];

  for (const msg of messages) {
    const role = msg.direction === "INBOUND" ? "user" : "assistant";

    if (overrides && msg.id === overrides.messageId) {
      chat.push({ role, content: overrides.blocks });
      continue;
    }

    const text = messageToPlaceholderText(msg);
    // Mensagens consecutivas do mesmo papel são mescladas para manter a
    // alternância user/assistant exigida pela Messages API.
    const last = chat[chat.length - 1];
    if (last && last.role === role && typeof last.content === "string") {
      last.content = `${last.content}\n${text}`;
    } else {
      chat.push({ role, content: text });
    }
  }

  // Garante que a conversa comece com uma mensagem "user" (exigência da API).
  while (chat.length > 0 && chat[0]?.role !== "user") {
    chat.shift();
  }

  return chat;
}

function messageToPlaceholderText(msg: Message): string {
  switch (msg.type) {
    case "IMAGE":
      return msg.content ? `[imagem enviada: ${msg.content}]` : "[imagem enviada pelo cliente]";
    case "DOCUMENT":
      return msg.content ? `[documento/projeto enviado: ${msg.content}]` : "[documento/projeto enviado pelo cliente]";
    case "AUDIO":
      return "[áudio enviado pelo cliente]";
    case "VIDEO":
      return "[vídeo enviado pelo cliente]";
    case "LOCATION":
      return "[localização enviada pelo cliente]";
    case "TEMPLATE":
      return msg.content ?? "[mensagem de template enviada]";
    default:
      return msg.content ?? "";
  }
}

export function leadDisplayName(lead: Lead): string {
  return lead.name ?? lead.profileName ?? lead.phone;
}
