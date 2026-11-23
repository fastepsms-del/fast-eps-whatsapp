import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, checkAdminCredentials, createSessionToken, type AdminSession } from "@/lib/adminAuth";
import { verifyPassword } from "@/lib/passwords";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/** Só aceita caminhos internos como destino pós-login (evita redirecionar para outro site). */
function safeNext(next: string): string {
  return next.startsWith("/") && !next.startsWith("//") ? next : "/admin";
}

async function checkDatabaseUser(username: string, password: string): Promise<AdminSession | null> {
  try {
    const user = await prisma.adminUser.findUnique({ where: { username: username.trim().toLowerCase() } });
    if (!user || !user.active) return null;
    if (!(await verifyPassword(password, user.passwordHash))) return null;
    await prisma.adminUser.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }).catch(() => undefined);
    return { username: user.username, name: user.displayName, role: user.role };
  } catch {
    // Tabela ainda não criada ou banco indisponível: só o login-mestre funciona.
    return null;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const username = String(form.get("username") ?? "");
  const password = String(form.get("password") ?? "");
  const next = safeNext(String(form.get("next") ?? "/admin"));

  const session: AdminSession | null = checkAdminCredentials(username, password)
    ? { username, name: username, role: "ADMIN" }
    : await checkDatabaseUser(username, password);

  if (!session) {
    const url = new URL("/admin/login", request.url);
    url.searchParams.set("error", "1");
    url.searchParams.set("next", next);
    return NextResponse.redirect(url, { status: 303 });
  }

  const token = await createSessionToken(session);
  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 12 * 60 * 60,
  });
  return response;
}
