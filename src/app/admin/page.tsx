import {
  getDashboardKpis,
  getLeadStatusCounts,
  getProductInterestCounts,
  getTemperatureCounts,
  getMessagesPerDay,
} from "@/lib/analytics/dashboardStats";
import { StatTile } from "@/components/charts/StatTile";
import { HorizontalBarChart } from "@/components/charts/HorizontalBarChart";
import { DualLineChart } from "@/components/charts/DualLineChart";

export const dynamic = "force-dynamic";

function weekOverWeekHint(current: number, previous: number): string {
  if (previous === 0) {
    return current > 0 ? "novo esta semana" : "sem variação";
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return "estável vs. semana anterior";
  return `${change > 0 ? "▲" : "▼"} ${Math.abs(change)}% vs. semana anterior`;
}

export default async function AdminDashboardPage() {
  const [kpis, statusCounts, productCounts, temperatureCounts, messagesPerDay] = await Promise.all([
    getDashboardKpis(),
    getLeadStatusCounts(),
    getProductInterestCounts(),
    getTemperatureCounts(),
    getMessagesPerDay(14),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-800">Painel geral</h1>
        <p className="text-sm text-slate-500">Visão consolidada do funil de atendimento da Fast EPS.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatTile label="Leads totais" value={kpis.totalLeads} />
        <StatTile
          label="Novos (7 dias)"
          value={kpis.newLeadsThisWeek}
          hint={weekOverWeekHint(kpis.newLeadsThisWeek, kpis.newLeadsPreviousWeek)}
        />
        <StatTile label="Leads quentes" value={kpis.hotLeadsCount} tone={kpis.hotLeadsCount > 0 ? "good" : "default"} />
        <StatTile
          label="Aguardando humano"
          value={kpis.humanHandoffCount}
          tone={kpis.humanHandoffCount > 0 ? "warning" : "default"}
        />
        <StatTile label="Convertidos no mês" value={kpis.convertedThisMonth} tone="good" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Mensagens por dia (últimos 14 dias)</h2>
          <DualLineChart data={messagesPerDay} labelA="Recebidas" labelB="Enviadas" colorA="#2a78d6" colorB="#eb6834" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Leads por status</h2>
          <HorizontalBarChart data={statusCounts} color="#2a78d6" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Interesse por produto</h2>
          <HorizontalBarChart data={productCounts} color="#eb6834" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Temperatura dos leads</h2>
          <HorizontalBarChart data={temperatureCounts} color="#1baf7a" />
        </div>
      </div>
    </div>
  );
}
