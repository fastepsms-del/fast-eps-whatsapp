import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  await prisma.apiKey.update({ where: { id: params.id }, data: { revokedAt: new Date() } });
  return NextResponse.redirect(new URL("/admin/api-keys", request.url), { status: 303 });
}
