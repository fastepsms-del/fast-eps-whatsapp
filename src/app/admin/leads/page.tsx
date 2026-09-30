import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { LEAD_STATUS_VALUES, PRODUCT_INTEREST_VALUES } from "@/lib/ai/tools";
import { StatusBadge, TemperatureBadge } from "@/components/StatusBadge";
import type { Lead, LeadStatus, ProductInterest } from "@prisma/client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type RespondFilter = "now" | "recent" | "paused";

interface SearchParams {
  q?: string;
  status?: string;
  product?: string;
  city?: string;
  temperature?: string;
  handoff?: string;
  page?: string;
  catchup?: string;
  respond?: string;
}

export default async function AdminLeadsListPage({ searchParams }: { searchParams: SearchParams }) {
  const respondFilter = (["now", "recent", "paused"] as const).includes(searchParams.respond as RespondFilter)
    ? (searchParams.respond as RespondFilter)
    : undefined;

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  let leads: Lead[];
  let total: number;

  if (respondFilter) {
    // "Responder agora" e "Respondido há pouco" dependem de comparar duas
    // colunas da mesma linha (lastInboundAt x lastOutboundAt), o que o
    // Prisma não expressa direto num where — busca o conjunto candidato e
    // filtra/pagina em memória (volume de leads de uma PME, sem problema).
    const where: Record<string, unknown> = {};
    if (searchParams.status) where.status = searchParams.status as LeadStatus;
    if (searchParams.product) where.productInterest = searchParams.product as ProductInterest;
    if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
    if (searchParams.temperature) where.temperature = searchParams.temperature;
    if (searchParams.q) {
      const q = searchParams.q;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { profileName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }
    if (respondFilter === "paused") {
      where.OR = [...(where.OR as unknown[] ?? []), { humanHandoff: true }, { followUpPaused: true }];
    }

    const candidates = await prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" } });
    const filtered = candidates.filter((lead) => {
      if (respondFilter === "paused") return lead.humanHandoff || lead.followUpPaused;
      if (lead.humanHandoff) return false;
      const needsReply = Boolean(lead.lastInboundAt) && (!lead.lastOutboundAt || lead.lastInboundAt! > lead.lastOutboundAt);
      return respondFilter === "now" ? needsReply : !needsReply && Boolean(lead.lastOutboundAt);
    });
    total = filtered.length;
    leads = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  } else {
    const where: Record<string, unknown> = {};
    if (searchParams.status) where.status = searchParams.status as LeadStatus;
    if (searchParams.product) where.productInterest = searchParams.product as ProductInterest;
    if (searchParams.city) where.city = { contains: searchParams.city, mode: "insensitive" };
    if (searchParams.temperature) where.temperature = searchParams.temperature;
    if (searchParams.handoff === "1") where.humanHandoff = true;
    if (searchParams.q) {
      const q = searchParams.q;
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { profileName: { contains: q, mode: "insensitive" } },
        { phone: { contains: q } },
        { city: { contains: q, mode: "insensitive" } },
      ];
    }
    [leads, total] = await Promise.all([
      prisma.lead.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
      prisma.lead.count({ where }),
    ]);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const buildPageHref = (targetPage: number) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.product) params.set("product", searchParams.product);
    if (searchParams.city) params.set("city", searchParams.city);
    if (searchParams.temperature) params.set("temperature", searchParams.temperature);
    if (searchParams.handoff) params.set("handoff", searchParams.handoff);
    if (searchParams.respond) params.set("respond", searchParams.respond);
    params.set("page", String(targetPage));
    return `/admin/leads?${params.toString()}`;
  };

  const buildRespondHref = (value: RespondFilter | null) => {
    const params = new URLSearchParams();
    if (searchParams.q) params.set("q", searchParams.q);
    if (searchParams.status) params.set("status", searchParams.status);
    if (searchParams.product) params.set("product", searchParams.product);
    if (searchParams.city) params.set("city", searchParams.city);
    if (searchParams.temperature) params.set("temperature", searchParams.temperature);
    if (value) params.set("respond", value);
    return `/admin/leads${params.toString() ? `?${params.toString()}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">Leads</h1>
          <p className="text-sm text-slate-500">
            {total} lead{total === 1 ? "" : "s"} no total
            {searchParams.q || searchParams.status || searchParams.product || searchParams.city || searchParams.temperature || searchParams.handoff || respondFilter
              ? " (filtrado)"
              : ""}
          </p>
        </div>
        <form action="/api/admin/catchup" method="POST">
          <button
            type="submit"
            className="shrink-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
            title="Reprocessa e responde todo lead cuja última mensagem foi do cliente e ainda não recebeu resposta"
          >
            Responder pendências
          </button>
        </form>
      </div>

      {searchParams.catchup && <CatchupBanner value={searchParams.catchup} />}

      <div className="flex gap-2 border-b border-slate-200">
        <RespondTab href={buildRespondHref(null)} active={!respondFilter}>
          Todos
        </RespondTab>
        <RespondTab href={buildRespondHref("now")} active={respondFilter === "now"}>
          Responder agora
        </RespondTab>
        <RespondTab href={buildRespondHref("recent")} active={respondFilter === "recent"}>
          Respondido há pouco
        </RespondTab>
        <RespondTab href={buildRespondHref("paused")} active={respondFilter === "paused"}>
          Não responder
        </RespondTab>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <Field label="Buscar">
          <input name="q" defaultValue={searchParams.q ?? ""} className="select w-56" placeholder="Nome, telefone ou cidade" />
        </Field>
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
        {!respondFilter && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" name="handoff" value="1" defaultChecked={searchParams.handoff === "1"} />
            Só atendimento humano
          </label>
        )}
        <button type="submit" className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
          Filtrar
        </button>
        <Link href="/admin/leads" className="text-sm text-slate-400 hover:text-slate-700">
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
                <td className="px-4 py-3">
                  <TemperatureBadge temperature={lead.temperature} />
                </td>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex gap-2">
            <PageLink href={buildPageHref(page - 1)} disabled={page <= 1}>
              ← Anterior
            </PageLink>
            <PageLink href={buildPageHref(page + 1)} disabled={page >= totalPages}>
              Próxima →
            </PageLink>
          </div>
        </div>
      )}
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

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) {
    return <span className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-300">{children}</span>;
  }
  return (
    <Link href={href} className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-600 hover:bg-slate-50">
      {children}
    </Link>
  );
}

function RespondTab({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`border-b-2 px-3 py-2 text-sm font-medium ${
        active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-slate-800"
      }`}
    >
      {children}
    </Link>
  );
}

function CatchupBanner({ value }: { value: string }) {
  const parts = value.split("|").map((n) => Number(n) || 0);
  const total = parts[0] ?? 0;
  const processed = parts[1] ?? 0;
  const failed = parts[2] ?? 0;
  const reengaged = parts[3] ?? 0;
  const reactivated = parts[4] ?? 0;
  return (
    <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
      {reactivated > 0 &&
        `${reactivated} lead(s) que tinham ficado travado(s) em "atendimento humano" por falha técnica foram reativados. `}
      {total === 0
        ? "Nenhum lead pendente de resposta encontrado."
        : `${processed} de ${total} lead(s) pendente(s) foram respondidos agora.`}
      {reengaged > 0 && ` ${reengaged} estavam fora da janela de 24h e receberam o template de reengajamento.`}
      {failed > 0 && ` ${failed} falharam ao enviar (confira os Logs).`}
    </div>
  );
}
