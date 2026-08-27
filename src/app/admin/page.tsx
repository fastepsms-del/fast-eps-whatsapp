import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { LEAD_STATUS_VALUES, PRODUCT_INTEREST_VALUES } from "@/lib/ai/tools";
import type { LeadStatus, ProductInterest } from "@prisma/client";

export const dynamic = "force-dynamic";

interface SearchParams {
  status?: string;
  product?: string;
  city?: string;
  temperature?: string;
  handoff?: string;
}

export default async function AdminLeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const where: Record<string, unknown> = {};
  if (searchParams.status) where.status = searchParams.status as LeadStatus;
  if (searchParams.product) where.productInterest = searchParams.product as ProductInterest;
  if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
  if (searchParams.temperature) where.temperature = searchParams.temperature;
  if (searchParams.handoff === "1") where.humanHandoff = true;

  const [leads, statusCounts, handoffCount] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" }, take: 100 }),
    prisma.lead.groupBy({ by: ["status"], _count: true }),
    prisma.lead.count({ where: { humanHandoff: true } }),
  ]);

  const countByStatus = Object.fromEntries(statusCounts.map((s) => [s.status, s._count]));

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <SummaryCard label="Total" value={leads.length < 100 ? leads.length : `${leads.length}+`} />
        <SummaryCard label="Aguardando humano" value={handoffCount} highlight />
        {["NOVO", "ORCAMENTO_SOLICITADO", "NEGOCIACAO", "CONVERTIDO"].map((s) => (
          <SummaryCard key={s} label={s.replaceAll("_", " ")} value={countByStatus[s] ?? 0} />
        ))}
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <Field label="Status">
          <select name="status" defaultValue={searchParams.status ?? ""} className="select">
            <option value="">Todos</option>
            {LEAD_STATUS_VALUES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Produto">
          <select name="product" defaultValue={searchParams.product ?? ""} className="select">
            <option value="">Todos</option>
            {PRODUCT_INTEREST_VALUES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Cidade">
          <input name="city" defaultValue={searchParams.city ?? ""} className="select" placeholder="ex: Curitiba" />
        </Field>
        <Field label="Temperatura">
          <select name="temperature" defaultValue={searchParams.temperature ?? ""} className="select">
            <option value="">Todas</option>
            <option value="QUENTE">Quente</option>
            <option value="MORNO">Morno</option>
            <option value="FRIO">Frio</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" name="handoff" value="1" defaultChecked={searchParams.handoff === "1"} />
          Só atendimento humano
        </label>
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Filtrar
        </button>
        <Link href="/admin" className="text-sm text-slate-400 hover:text-slate-700">
          Limpar
        </Link>
      </form>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Contato</th>
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3">Cidade</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Temperatura</th>
              <th className="px-4 py-3">Última msg.</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{lead.name ?? lead.profileName ?? "Sem nome"}</div>
                  <div className="text-xs text-slate-400">{lead.phone}</div>
                </td>
                <td className="px-4 py-3">{lead.productInterest}</td>
                <td className="px-4 py-3">{lead.city ?? "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status} handoff={lead.humanHandoff} />
                </td>
                <td className="px-4 py-3">{lead.temperature}</td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {lead.lastInboundAt ? new Date(lead.lastInboundAt).toLocaleString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/admin/leads/${lead.id}`} className="text-brand-600 hover:underline">
                    Ver conversa
                  </Link>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Nenhum lead encontrado para este filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"}`}>
      <div className="text-xs uppercase text-slate-400">{label}</div>
      <div className={`text-xl font-semibold ${highlight ? "text-amber-700" : "text-slate-800"}`}>{value}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col text-sm text-slate-600">
      <span className="mb-1">{label}</span>
      {children}
    </label>
  );
}

function StatusBadge({ status, handoff }: { status: string; handoff: boolean }) {
  if (handoff) {
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">ATENDIMENTO HUMANO</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{status}</span>;
}
