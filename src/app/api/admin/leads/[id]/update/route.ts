import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import type { LeadStatus, ProductInterest } from "@prisma/client";

export const runtime = "nodejs";

export async function POST(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const form = await request.formData();

  const toStringOrNull = (key: string): string | null => {
    const value = form.get(key);
    if (value === null) return null;
    const str = String(value).trim();
    return str.length > 0 ? str : null;
  };

  await prisma.lead.update({
    where: { id: params.id },
    data: {
      name: toStringOrNull("name"),
      city: toStringOrNull("city"),
      productInterest: (form.get("productInterest") as ProductInterest) || undefined,
      status: (form.get("status") as LeadStatus) || undefined,
      quantity: toStringOrNull("quantity"),
      measurements: toStringOrNull("measurements"),
      desiredDate: toStringOrNull("desiredDate"),
      notes: toStringOrNull("notes"),
      followUpPaused: form.get("followUpPaused") === "1",
    },
  });

  return NextResponse.redirect(new URL(`/admin/leads/${params.id}`, request.url), { status: 303 });
}
