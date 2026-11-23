// Implementado com a Web Crypto API (globalThis.crypto) em vez de
// `node:crypto` para que também funcione no runtime Edge do middleware do
// Next.js, além do runtime Node.js das rotas de API.

export const ADMIN_COOKIE_NAME = "fasteps_admin_session";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 horas

export type AdminRole = "ADMIN" | "ATTENDANT";

export interface AdminSession {
  username: string;
  /** Nome exibido no painel (e gravado como "atendido por"). */
  name: string;
  role: AdminRole;
}

function getSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) throw new Error("ADMIN_SESSION_SECRET não configurado");
  return secret;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(secret);
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
}

async function sign(payload: string): Promise<string> {
  const key = await importHmacKey(getSecret());
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return bufferToHex(signatureBuffer);
}

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4);
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Token de sessão: `v2.<dados em base64url>.<assinatura HMAC>`. */
export async function createSessionToken(session: AdminSession): Promise<string> {
  const data = { u: session.username, n: session.name, r: session.role, e: Date.now() + SESSION_TTL_MS };
  const payload = toBase64Url(new TextEncoder().encode(JSON.stringify(data)));
  const signature = await sign(payload);
  return `v2.${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<AdminSession | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v2") return null;
  const payload = parts[1] ?? "";
  const signature = parts[2] ?? "";

  const expectedSignature = await sign(payload);
  if (!timingSafeStringEqual(signature, expectedSignature)) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { u?: unknown; n?: unknown; r?: unknown; e?: unknown };
    if (typeof data.e !== "number" || Date.now() > data.e) return null;
    return {
      username: String(data.u ?? ""),
      name: String(data.n ?? data.u ?? ""),
      // Qualquer valor desconhecido cai no papel de menor privilégio.
      role: data.r === "ADMIN" ? "ADMIN" : "ATTENDANT",
    };
  } catch {
    return null;
  }
}

/** Login-mestre definido nas variáveis de ambiente (sempre administrador). */
export function checkAdminCredentials(username: string, password: string): boolean {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) return false;

  return timingSafeStringEqual(username, expectedUser) && timingSafeStringEqual(password, expectedPass);
}

/** Atendentes só acessam o painel, a lista/conversas de leads e a mídia das conversas. */
export function isPathAllowedForRole(pathname: string, role: AdminRole): boolean {
  if (role === "ADMIN") return true;
  return (
    pathname === "/admin" ||
    pathname === "/admin/leads" ||
    pathname.startsWith("/admin/leads/") ||
    pathname.startsWith("/api/admin/leads/") ||
    pathname.startsWith("/api/admin/media/") ||
    pathname === "/api/admin/auth/logout"
  );
}

/** Nome a gravar como "atendido por"; null para o login-mestre (que não é uma pessoa específica). */
export function attendantNameFor(session: AdminSession | null): string | null {
  if (!session) return null;
  if (session.name === process.env.ADMIN_USERNAME) return null;
  return session.name || null;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
