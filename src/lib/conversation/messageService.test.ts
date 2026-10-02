import { describe, expect, it } from "vitest";
import { buildChatHistory } from "./messageService";
import type { Message } from "@prisma/client";

function fakeMessage(overrides: Partial<Message>): Message {
  return {
    id: "msg_1",
    leadId: "lead_1",
    direction: "INBOUND",
    type: "TEXT",
    status: "DELIVERED",
    content: "olá",
    mediaId: null,
    mediaMimeType: null,
    intent: null,
    isFollowUp: false,
    isAutomated: true,
    whatsappMessageId: null,
    errorMessage: null,
    createdAt: new Date("2026-01-01T10:00:00Z"),
    ...overrides,
  } as Message;
}

describe("buildChatHistory", () => {
  it("converte inbound/outbound para user/model", () => {
    const messages = [
      fakeMessage({ id: "1", direction: "INBOUND", content: "oi" }),
      fakeMessage({ id: "2", direction: "OUTBOUND", content: "olá, tudo bem?" }),
    ];
    const chat = buildChatHistory(messages);
    expect(chat).toEqual([
      { role: "user", parts: [{ text: "oi" }] },
      { role: "model", parts: [{ text: "olá, tudo bem?" }] },
    ]);
  });

  it("mescla mensagens consecutivas do mesmo papel", () => {
    const messages = [
      fakeMessage({ id: "1", direction: "INBOUND", content: "oi" }),
      fakeMessage({ id: "2", direction: "INBOUND", content: "tudo bem?" }),
      fakeMessage({ id: "3", direction: "OUTBOUND", content: "tudo ótimo!" }),
    ];
    const chat = buildChatHistory(messages);
    expect(chat).toHaveLength(2);
    expect(chat[0]).toEqual({ role: "user", parts: [{ text: "oi\ntudo bem?" }] });
  });

  it("remove mensagens iniciais do assistente para começar com 'user'", () => {
    const messages = [
      fakeMessage({ id: "1", direction: "OUTBOUND", content: "mensagem de sistema perdida" }),
      fakeMessage({ id: "2", direction: "INBOUND", content: "oi" }),
    ];
    const chat = buildChatHistory(messages);
    expect(chat[0]?.role).toBe("user");
    expect(chat).toHaveLength(1);
  });

  it("substitui o conteúdo da mensagem indicada por partes ricas (ex: imagem)", () => {
    const messages = [fakeMessage({ id: "1", direction: "INBOUND", content: "foto" })];
    const parts = [{ text: "[imagem]" }];
    const chat = buildChatHistory(messages, { messageId: "1", parts });
    expect(chat[0]).toEqual({ role: "user", parts });
  });

  it("usa placeholder para mensagens de imagem sem legenda", () => {
    const messages = [fakeMessage({ id: "1", direction: "INBOUND", type: "IMAGE", content: null })];
    const chat = buildChatHistory(messages);
    expect(chat[0]?.parts?.[0]).toEqual({ text: "[imagem enviada pelo cliente]" });
  });
});
