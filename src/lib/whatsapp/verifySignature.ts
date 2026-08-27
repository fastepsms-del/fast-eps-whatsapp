import crypto from "node:crypto";

/**
 * Valida a assinatura HMAC-SHA256 enviada pela Meta no header
 * `X-Hub-Signature-256` para garantir que a requisição realmente veio do
 * WhatsApp e não foi forjada por terceiros.
 */
export function isValidWhatsAppSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) {
    // Sem app secret configurado não há como validar; o chamador decide
    // se bloqueia ou apenas loga (ver rota do webhook).
    return false;
  }
  if (!signatureHeader) return false;

  const expected = `sha256=${crypto.createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(signatureHeader);
  if (expectedBuffer.length !== receivedBuffer.length) return false;

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}
