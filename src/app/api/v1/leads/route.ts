import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

/** Lista leads. Autenticação: header `Authorization: Bearer <chave de API>`. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiKey = await verifyApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1);
  const phone = request.nextUrl.searchParams.get("phone");

  const where = phone ? { phone } : {};

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.lead.count({ where }),
  ]);

  return NextResponse.json({
    data: leads,
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
