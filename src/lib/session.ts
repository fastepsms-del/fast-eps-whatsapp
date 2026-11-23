import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionToken, type AdminSession } from "@/lib/adminAuth";

/** Sessão do usuário logado, para Server Components e rotas dentro do painel. */
export async function getCurrentSession(): Promise<AdminSession | null> {
  return verifySessionToken(cookies().get(ADMIN_COOKIE_NAME)?.value);
}

export async function getSessionFromRequest(request: NextRequest): Promise<AdminSession | null> {
  return verifySessionToken(request.cookies.get(ADMIN_COOKIE_NAME)?.value);
}
