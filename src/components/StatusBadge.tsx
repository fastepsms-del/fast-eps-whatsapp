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
