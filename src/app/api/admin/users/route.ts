import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/passwords";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[a-z0-9._-]{3,30}$/;
const MIN_PASSWORD_LENGTH = 8;

function back(request: NextRequest, notice: string): NextResponse {
  const url = new URL("/admin/users", request.url);
  url.searchParams.set("notice", notice);
  return NextResponse.redirect(url, { status: 303 });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const displayName = String(form.get("displayName") ?? "").trim().slice(0, 60);
  const password = String(form.get("password") ?? "");
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "ATTENDANT";

  if (!USERNAME_PATTERN.test(username)) return back(request, "usuario_invalido");
  if (!displayName) return back(request, "nome_obrigatorio");
  if (password.length < MIN_PASSWORD_LENGTH) return back(request, "senha_curta");

  try {
    await prisma.adminUser.create({ data: { username, displayName, passwordHash: await hashPassword(password), role } });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return back(request, "usuario_existe");
    return back(request, "erro_banco");
  }
  return back(request, "criado");
}
