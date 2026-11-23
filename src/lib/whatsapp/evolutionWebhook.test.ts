import { describe, expect, it } from "vitest";
import { describeForRecord, mapEvolutionStatus, normalizeEvent, phoneFromKey, toInboundMessage } from "./evolutionWebhook";

describe("normalizeEvent", () => {
  it("aceita os dois formatos de nome de evento", () => {
    expect(normalizeEvent("MESSAGES_UPSERT")).toBe("messages.upsert");
    expect(normalizeEvent("messages.upsert")).toBe("messages.upsert");
  });
});

describe("phoneFromKey", () => {
  it("extrai o telefone de um JID comum", () => {
    expect(phoneFromKey({ remoteJid: "556799186768@s.whatsapp.net" })).toBe("556799186768");
  });

  it("ignora grupos, status e canais", () => {
    expect(phoneFromKey({ remoteJid: "1203630@g.us" })).toBeNull();
    expect(phoneFromKey({ remoteJid: "status@broadcast" })).toBeNull();
    expect(phoneFromKey({ remoteJid: "12345@newsletter" })).toBeNull();
  });

  it("usa remoteJidAlt quando o JID principal é @lid", () => {
    expect(phoneFromKey({ remoteJid: "98765@lid", remoteJidAlt: "556799186768@s.whatsapp.net" })).toBe("556799186768");
  });

  it("devolve null para @lid sem telefone alternativo", () => {
    expect(phoneFromKey({ remoteJid: "98765@lid" })).toBeNull();
  });
});

describe("toInboundMessage", () => {
  const key = { id: "ABC123", remoteJid: "556799186768@s.whatsapp.net" };

  it("converte texto simples e texto estendido", () => {
    expect(toInboundMessage({ key, message: { conversation: "oi" } }, "556799186768")).toMatchObject({ type: "text", text: { body: "oi" } });
    expect(toInboundMessage({ key, message: { extendedTextMessage: { text: "olá" } } }, "556799186768")).toMatchObject({ type: "text", text: { body: "olá" } });
  });

  it("usa o id da mensagem como id da mídia", () => {
    const result = toInboundMessage({ key, message: { imageMessage: { mimetype: "image/png", caption: "foto" } } }, "556799186768");
    expect(result).toMatchObject({ type: "image", image: { id: "ABC123", mime_type: "image/png", caption: "foto" } });
  });

  it("desembrulha mensagens efêmeras e documento com legenda", () => {
    const ephemeral = toInboundMessage({ key, message: { ephemeralMessage: { message: { conversation: "temporária" } } } }, "556799186768");
    expect(ephemeral).toMatchObject({ type: "text", text: { body: "temporária" } });

    const doc = toInboundMessage(
      { key, message: { documentWithCaptionMessage: { message: { documentMessage: { mimetype: "application/pdf", fileName: "planta.pdf" } } } } },
      "556799186768",
    );
    expect(doc).toMatchObject({ type: "document", document: { mime_type: "application/pdf", filename: "planta.pdf" } });
  });

  it("ignora reações e tipos desconhecidos", () => {
    expect(toInboundMessage({ key, message: { reactionMessage: { text: "👍" } } }, "556799186768")).toBeNull();
    expect(toInboundMessage({ key: {}, message: { conversation: "sem id" } }, "556799186768")).toBeNull();
  });
});

describe("describeForRecord", () => {
  it("usa a legenda como conteúdo de mídia", () => {
    expect(describeForRecord({ id: "1", from: "55", timestamp: "", type: "image", image: { id: "1", mime_type: "image/png", caption: "obra" } })).toEqual({
      type: "IMAGE",
      content: "obra",
    });
  });
});

describe("mapEvolutionStatus", () => {
  it("traduz os status do Evolution para os internos", () => {
    expect(mapEvolutionStatus("DELIVERY_ACK")).toBe("delivered");
    expect(mapEvolutionStatus("READ")).toBe("read");
    expect(mapEvolutionStatus("ERROR")).toBe("failed");
    expect(mapEvolutionStatus("QUALQUER")).toBeNull();
  });
});
