import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateApiKey } from "@/lib/apiKeys";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const form = await request.formData();
  const label = String(form.get("label") ?? "").trim() || "Sem nome";

  const { plaintext, hash, prefix } = generateApiKey();
  await prisma.apiKey.create({ data: { label, keyHash: hash, keyPrefix: prefix } });

  const redirectUrl = new URL("/admin/api-keys", request.url);
  redirectUrl.searchParams.set("created", plaintext);
  return NextResponse.redirect(redirectUrl, { status: 303 });
}
