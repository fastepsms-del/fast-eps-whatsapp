export interface DailyPoint {
  date: string;
  a: number;
  b: number;
}

interface DualLineChartProps {
  data: DailyPoint[];
  labelA: string;
  labelB: string;
  colorA?: string;
  colorB?: string;
  width?: number;
  height?: number;
}

const PADDING_LEFT = 32;
const PADDING_RIGHT = 12;
const PADDING_TOP = 28;
const PADDING_BOTTOM = 24;

function niceCeil(value: number): number {
  if (value <= 0) return 5;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)));
  const steps = [1, 2, 2.5, 5, 10];
  for (const step of steps) {
    const candidate = step * magnitude;
    if (candidate >= value) return candidate;
  }
  return 10 * magnitude;
}

function formatShortDate(iso: string): string {
  const [, month, day] = iso.split("-");
  return `${day}/${month}`;
}

export function DualLineChart({
  data,
  labelA,
  labelB,
  colorA = "#2a78d6",
  colorB = "#eb6834",
  width = 640,
  height = 220,
}: DualLineChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  const plotW = width - PADDING_LEFT - PADDING_RIGHT;
  const plotH = height - PADDING_TOP - PADDING_BOTTOM;
  const maxRaw = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)));
  const maxValue = niceCeil(maxRaw);
  const xStep = data.length > 1 ? plotW / (data.length - 1) : 0;
  const toX = (i: number) => PADDING_LEFT + i * xStep;
  const toY = (v: number) => PADDING_TOP + plotH - (v / maxValue) * plotH;
  const pathFor = (key: "a" | "b") => data.map((d, i) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(d[key])}`).join(" ");
  const gridTicks = [0, maxValue / 2, maxValue];
  const lastIndex = data.length - 1;
  const tickLabelIndices = Array.from(new Set([0, Math.floor(lastIndex / 2), lastIndex]));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: colorA }} />
          {labelA}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-0.5 w-4 rounded-full" style={{ backgroundColor: colorB }} />
          {labelB}
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Mensagens por dia">
        {gridTicks.map((tick) => (
          <g key={tick}>
            <line x1={PADDING_LEFT} x2={width - PADDING_RIGHT} y1={toY(tick)} y2={toY(tick)} stroke="#e1e0d9" strokeWidth={1} />
            <text x={PADDING_LEFT - 6} y={toY(tick)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#898781">
              {Math.round(tick)}
            </text>
          </g>
        ))}
        {tickLabelIndices.map((i) => (
          <text key={i} x={toX(i)} y={height - 6} textAnchor="middle" fontSize={10} fill="#898781">
            {formatShortDate(data[i]!.date)}
          </text>
        ))}
        <path d={pathFor("a")} fill="none" stroke={colorA} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathFor("b")} fill="none" stroke={colorB} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {(["a", "b"] as const).map((key) => {
          const last = data[lastIndex]!;
          const color = key === "a" ? colorA : colorB;
          const cx = toX(lastIndex);
          const cy = toY(last[key]);
          return (
            <g key={key}>
              <circle cx={cx} cy={cy} r={6} fill="#fcfcfb" />
              <circle cx={cx} cy={cy} r={4} fill={color} />
              <text x={cx + 8} y={cy} dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#0b0b0b">
                {last[key]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
