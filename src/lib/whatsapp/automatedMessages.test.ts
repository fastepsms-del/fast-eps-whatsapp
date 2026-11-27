import { describe, expect, it } from "vitest";
import { isAutomatedMessage } from "./automatedMessages";

describe("mensagens automáticas", () => {
  it("reconhece saudação e ausência do WhatsApp Business", () => {
    expect(isAutomatedMessage("Teste EPS agradece seu contato. Em breve um especialista entrará em contato com você.")).toBe(true);
    expect(isAutomatedMessage("Fast Eps Comercial agradece seu contato. Em breve um especialista falará com você.")).toBe(true);
    expect(isAutomatedMessage("No momento não estamos disponíveis. Retornaremos assim que possível.")).toBe(true);
  });

  it("reconhece o texto pré-preenchido do anúncio, só quando é a mensagem inteira", () => {
    expect(isAutomatedMessage("Oi, como podemos ajudar?")).toBe(true);
    expect(isAutomatedMessage("Oi, quero fazer meu orçamento em painéis monolíticos")).toBe(false);
  });

  it("não confunde conversa de gente com automática", () => {
    expect(isAutomatedMessage("Bom dia! Te mando o orçamento em instantes.")).toBe(false);
    expect(isAutomatedMessage("")).toBe(false);
    expect(isAutomatedMessage(null)).toBe(false);
  });
});
