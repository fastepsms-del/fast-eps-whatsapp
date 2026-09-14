import { prisma } from "@/lib/db/prisma";
import type { DailyPoint } from "@/components/charts/DualLineChart";

export interface DashboardKpis {
  totalLeads: number;
  humanHandoffCount: number;
  hotLeadsCount: number;
  convertedThisMonth: number;
  newLeadsThisWeek: number;
  newLeadsPreviousWeek: number;
}

export async function getDashboardKpis(): Promise<DashboardKpis> {
  const now = new Date();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startOfPreviousWeek = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalLeads, humanHandoffCount, hotLeadsCount, convertedThisMonth, newLeadsThisWeek, newLeadsPreviousWeek] =
    await Promise.all([
      prisma.lead.count(),
      prisma.lead.count({ where: { humanHandoff: true } }),
      prisma.lead.count({ where: { temperature: "QUENTE" } }),
      prisma.lead.count({ where: { status: "CONVERTIDO", updatedAt: { gte: startOfMonth } } }),
      prisma.lead.count({ where: { createdAt: { gte: startOfWeek } } }),
      prisma.lead.count({ where: { createdAt: { gte: startOfPreviousWeek, lt: startOfWeek } } }),
    ]);

  return { totalLeads, humanHandoffCount, hotLeadsCount, convertedThisMonth, newLeadsThisWeek, newLeadsPreviousWeek };
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: "Novo",
  EM_ATENDIMENTO: "Em atendimento",
  INTERESSADO: "Interessado",
  AGUARDANDO_INFORMACOES: "Aguardando informações",
  ORCAMENTO_SOLICITADO: "Orçamento solicitado",
  ORCAMENTO_ENVIADO: "Orçamento enviado",
  NEGOCIACAO: "Negociação",
  AGUARDANDO_RESPOSTA: "Aguardando resposta",
  CONVERTIDO: "Convertido",
  PERDIDO: "Perdido",
  ATENDIMENTO_HUMANO: "Atendimento humano",
};

export async function getLeadStatusCounts(): Promise<Array<{ label: string; value: number }>> {
  const rows = await prisma.lead.groupBy({ by: ["status"], _count: true });
  return rows
    .map((r) => ({ label: STATUS_LABELS[r.status] ?? r.status, value: r._count }))
    .sort((a, b) => b.value - a.value);
}

const PRODUCT_LABELS: Record<string, string> = {
  INDEFINIDO: "Indefinido",
  MOLDURA_EPS: "Moldura em EPS",
  PAINEL_MONOLITICO: "Painel monolítico",
  OUTRO: "Outro",
};

export async function getProductInterestCounts(): Promise<Array<{ label: string; value: number }>> {
  const rows = await prisma.lead.groupBy({ by: ["productInterest"], _count: true });
  return rows
    .map((r) => ({ label: PRODUCT_LABELS[r.productInterest] ?? r.productInterest, value: r._count }))
    .sort((a, b) => b.value - a.value);
}

const TEMPERATURE_LABELS: Record<string, string> = {
  DESCONHECIDA: "Desconhecida",
  FRIO: "Frio",
  MORNO: "Morno",
  QUENTE: "Quente",
};

export async function getTemperatureCounts(): Promise<Array<{ label: string; value: number }>> {
  const rows = await prisma.lead.groupBy({ by: ["temperature"], _count: true });
  return rows
    .map((r) => ({ label: TEMPERATURE_LABELS[r.temperature] ?? r.temperature, value: r._count }))
    .sort((a, b) => b.value - a.value);
}

export async function getMessagesPerDay(days = 14): Promise<DailyPoint[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await prisma.$queryRaw<Array<{ day: Date; direction: string; count: bigint }>>`
    SELECT date_trunc('day', "createdAt") AS day, direction, COUNT(*)::bigint AS count
    FROM messages
    WHERE "createdAt" >= ${since}
    GROUP BY day, direction
    ORDER BY day ASC
  `;

  const byDay = new Map<string, { a: number; b: number }>();
  for (let i = 0; i < days; i += 1) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    byDay.set(key, { a: 0, b: 0 });
  }

  for (const row of rows) {
    const key = row.day.toISOString().slice(0, 10);
    const entry = byDay.get(key);
    if (!entry) continue;
    if (row.direction === "INBOUND") entry.a += Number(row.count);
    else entry.b += Number(row.count);
  }

  return Array.from(byDay.entries()).map(([date, { a, b }]) => ({ date, a, b }));
}
