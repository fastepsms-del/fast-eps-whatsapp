import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Detalhe de um lead. Autenticação: header `Authorization: Bearer <chave de API>`. */
export async function GET(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const apiKey = await verifyApiKey(request.headers.get("authorization"));
  if (!apiKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ data: lead });
}
