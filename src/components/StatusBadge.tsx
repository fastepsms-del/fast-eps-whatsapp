export function StatusBadge({ status, handoff }: { status: string; handoff: boolean }) {
  if (handoff) {
    return <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">ATENDIMENTO HUMANO</span>;
  }
  return <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{status.replaceAll("_", " ")}</span>;
}

const TEMPERATURE_STYLES: Record<string, string> = {
  QUENTE: "bg-red-100 text-red-700",
  MORNO: "bg-amber-100 text-amber-700",
  FRIO: "bg-sky-100 text-sky-700",
  DESCONHECIDA: "bg-slate-100 text-slate-500",
};

export function TemperatureBadge({ temperature }: { temperature: string }) {
  const classes = TEMPERATURE_STYLES[temperature] ?? TEMPERATURE_STYLES.DESCONHECIDA;
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{temperature}</span>;
}

/** Etapa do processo — etiqueta manual da equipe, separada do status controlado pela IA. */
export const PIPELINE_STAGE_VALUES = ["PROSPECCAO", "ORCAMENTO", "PAGAMENTO", "ENTREGA", "POS_VENDA"] as const;

export const PIPELINE_STAGE_LABELS: Record<string, string> = {
  PROSPECCAO: "Prospecção",
  ORCAMENTO: "Orçamento",
  PAGAMENTO: "Pagamento",
  ENTREGA: "Entrega",
  POS_VENDA: "Pós-venda",
};

const PIPELINE_STAGE_STYLES: Record<string, string> = {
  PROSPECCAO: "bg-sky-100 text-sky-700",
  ORCAMENTO: "bg-amber-100 text-amber-700",
  PAGAMENTO: "bg-emerald-100 text-emerald-700",
  ENTREGA: "bg-indigo-100 text-indigo-700",
  POS_VENDA: "bg-brand-100 text-brand-700",
};

export function PipelineStageBadge({ stage }: { stage: string | null }) {
  if (!stage) return null;
  const classes = PIPELINE_STAGE_STYLES[stage] ?? "bg-slate-100 text-slate-600";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes}`}>{PIPELINE_STAGE_LABELS[stage] ?? stage}</span>;
}

/** Nome de quem está atendendo manualmente agora, como uma etiqueta simples. */
export function AssigneeBadge({ name }: { name: string | null }) {
  if (!name) return null;
  return (
    <span className="rounded-full bg-violet-100 px-2 py-1 text-xs font-medium text-violet-700">
      👤 {name}
    </span>
  );
}
