interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warning" | "good";
}

export function StatTile({ label, value, hint, tone = "default" }: StatTileProps) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
        ? "border-emerald-300 bg-emerald-50"
        : "border-slate-200 bg-white";
  const valueClasses = tone === "warning" ? "text-amber-700" : tone === "good" ? "text-emerald-700" : "text-slate-900";

  return (
    <div className={`rounded-lg border p-4 ${toneClasses}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${valueClasses}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </div>
  );
}
