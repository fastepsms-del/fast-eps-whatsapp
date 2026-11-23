import { beforeAll, describe, expect, it } from "vitest";
import { attendantNameFor, createSessionToken, isPathAllowedForRole, verifySessionToken } from "./adminAuth";
import { hashPassword, verifyPassword } from "./passwords";

beforeAll(() => {
  process.env.ADMIN_SESSION_SECRET = "segredo-de-teste";
  process.env.ADMIN_USERNAME = "fasteps";
});

describe("sessão do painel", () => {
  it("guarda nome e papel, inclusive com acento", async () => {
    const token = await createSessionToken({ username: "joao", name: "João da Silva", role: "ATTENDANT" });
    expect(await verifySessionToken(token)).toEqual({ username: "joao", name: "João da Silva", role: "ATTENDANT" });
  });

  it("rejeita token adulterado, truncado ou no formato antigo", async () => {
    const token = await createSessionToken({ username: "caio", name: "Caio", role: "ATTENDANT" });
    const [version, payload, signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ u: "caio", n: "Caio", r: "ADMIN", e: Date.now() + 1e9 })).toString("base64url");
    expect(await verifySessionToken(`${version}.${forgedPayload}.${signature}`)).toBeNull();
    expect(await verifySessionToken(`${version}.${payload}`)).toBeNull();
    expect(await verifySessionToken("fasteps.9999999999999.abc")).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });
});

describe("permissões por papel", () => {
  it("administrador acessa tudo", () => {
    expect(isPathAllowedForRole("/admin/settings", "ADMIN")).toBe(true);
    expect(isPathAllowedForRole("/api/admin/users", "ADMIN")).toBe(true);
  });

  it("atendente acessa só painel, leads e mídia", () => {
    for (const path of ["/admin", "/admin/leads", "/admin/leads/abc", "/api/admin/leads/abc/send", "/api/admin/media/abc"]) {
      expect(isPathAllowedForRole(path, "ATTENDANT")).toBe(true);
    }
    for (const path of ["/admin/settings", "/admin/users", "/admin/api-keys", "/admin/logs", "/api/admin/catchup", "/api/admin/users", "/admin/leadsx"]) {
      expect(isPathAllowedForRole(path, "ATTENDANT")).toBe(false);
    }
  });
});

describe("atendente registrado no lead", () => {
  it("usa o nome do atendente, mas não o do login-mestre", () => {
    expect(attendantNameFor({ username: "caio", name: "Caio", role: "ATTENDANT" })).toBe("Caio");
    expect(attendantNameFor({ username: "fasteps", name: "fasteps", role: "ADMIN" })).toBeNull();
    expect(attendantNameFor(null)).toBeNull();
  });
});

describe("senhas", () => {
  it("confere a senha certa e recusa a errada", async () => {
    const hash = await hashPassword("senha-segura-123");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("senha-segura-123", hash)).toBe(true);
    expect(await verifyPassword("outra-senha", hash)).toBe(false);
    expect(await verifyPassword("qualquer", "formato-invalido")).toBe(false);
  });
});
