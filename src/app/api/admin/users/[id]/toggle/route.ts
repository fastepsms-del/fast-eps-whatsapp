import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

/** Ativa/desativa um atendente. Quem está desativado não consegue entrar de novo (a sessão atual vale até 12h). */
export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const user = await prisma.adminUser.findUnique({ where: { id: params.id } });
  if (user) {
    await prisma.adminUser.update({ where: { id: user.id }, data: { active: !user.active } });
  }
  const url = new URL("/admin/users", request.url);
  url.searchParams.set("notice", user?.active ? "desativado" : "ativado");
  return NextResponse.redirect(url, { status: 303 });
}
