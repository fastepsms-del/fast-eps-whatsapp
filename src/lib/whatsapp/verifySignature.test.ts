import { describe, expect, it, beforeEach, afterEach } from "vitest";
import crypto from "node:crypto";
import { isValidWhatsAppSignature } from "./verifySignature";

const ORIGINAL_SECRET = process.env.WHATSAPP_APP_SECRET;

describe("isValidWhatsAppSignature", () => {
  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = "meu-segredo-de-teste";
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = ORIGINAL_SECRET;
  });

  it("aceita uma assinatura válida", () => {
    const body = JSON.stringify({ hello: "world" });
    const signature = `sha256=${crypto.createHmac("sha256", "meu-segredo-de-teste").update(body).digest("hex")}`;
    expect(isValidWhatsAppSignature(body, signature)).toBe(true);
  });

  it("rejeita uma assinatura inválida", () => {
    const body = JSON.stringify({ hello: "world" });
    expect(isValidWhatsAppSignature(body, "sha256=abcdef")).toBe(false);
  });

  it("rejeita quando não há header de assinatura", () => {
    expect(isValidWhatsAppSignature("{}", null)).toBe(false);
  });

  it("rejeita quando o corpo foi alterado", () => {
    const originalBody = JSON.stringify({ hello: "world" });
    const signature = `sha256=${crypto.createHmac("sha256", "meu-segredo-de-teste").update(originalBody).digest("hex")}`;
    const tamperedBody = JSON.stringify({ hello: "mundo" });
    expect(isValidWhatsAppSignature(tamperedBody, signature)).toBe(false);
  });

  it("retorna false quando o app secret não está configurado", () => {
    delete process.env.WHATSAPP_APP_SECRET;
    expect(isValidWhatsAppSignature("{}", "sha256=qualquercoisa")).toBe(false);
  });
});
