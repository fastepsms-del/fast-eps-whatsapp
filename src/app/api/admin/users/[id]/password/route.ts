import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/passwords";

export const runtime = "nodejs";

const MIN_PASSWORD_LENGTH = 8;

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const form = await request.formData();
  const password = String(form.get("password") ?? "");

  const url = new URL("/admin/users", request.url);
  if (password.length < MIN_PASSWORD_LENGTH) {
    url.searchParams.set("notice", "senha_curta");
    return NextResponse.redirect(url, { status: 303 });
  }

  await prisma.adminUser.update({ where: { id: params.id }, data: { passwordHash: await hashPassword(password) } });
  url.searchParams.set("notice", "senha_alterada");
  return NextResponse.redirect(url, { status: 303 });
}
