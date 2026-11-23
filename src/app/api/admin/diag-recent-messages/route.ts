import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Rota de diagnóstico de uso único: mostra as mensagens e logs mais
 * recentes do banco, pra investigar por que o histórico parece estar
 * "parado" numa data antiga. Protegida pelo middleware admin.
 */
export async function GET(): Promise<NextResponse> {
  const [recentMessages, recentErrorLogs, recentWhatsappLogs, leadCount, messageCount] = await Promise.all([
    prisma.message.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.integrationLog.findMany({ where: { level: "error" }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.integrationLog.findMany({ where: { scope: "whatsapp" }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.lead.count(),
    prisma.message.count(),
  ]);

  return NextResponse.json({
    now: new Date().toISOString(),
    leadCount,
    messageCount,
    recentMessages,
    recentErrorLogs,
    recentWhatsappLogs,
  });
}
