export interface BarDatum {
  label: string;
  value: number;
}

interface HorizontalBarChartProps {
  data: BarDatum[];
  color?: string;
  formatValue?: (value: number) => string;
  width?: number;
}

const BAR_HEIGHT = 18;
const ROW_HEIGHT = 30;
const LABEL_COL_WIDTH = 148;
const VALUE_COL_WIDTH = 44;
const RADIUS = 4;

function roundedBarPath(x0: number, y: number, width: number, height: number): string {
  const r = Math.min(RADIUS, Math.max(width, 0.01));
  const x1 = x0 + width;
  if (width <= 0) return "";
  return `M${x0},${y} H${x1 - r} Q${x1},${y} ${x1},${y + r} V${y + height - r} Q${x1},${y + height} ${x1 - r},${y + height} H${x0} Z`;
}

export function HorizontalBarChart({ data, color = "#2a78d6", formatValue, width = 560 }: HorizontalBarChartProps) {
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  const trackWidth = width - LABEL_COL_WIDTH - VALUE_COL_WIDTH;
  const height = data.length * ROW_HEIGHT;
  const fmt = formatValue ?? ((v: number) => String(v));

  if (data.length === 0) {
    return <p className="text-sm text-slate-400">Sem dados suficientes ainda.</p>;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" role="img" aria-label="Gráfico de barras">
      <line x1={LABEL_COL_WIDTH} y1={0} x2={LABEL_COL_WIDTH} y2={height} stroke="#e1e0d9" strokeWidth={1} />
      {data.map((d, i) => {
        const y = i * ROW_HEIGHT + (ROW_HEIGHT - BAR_HEIGHT) / 2;
        const barWidth = (d.value / maxValue) * trackWidth;
        return (
          <g key={d.label}>
            <text x={LABEL_COL_WIDTH - 10} y={y + BAR_HEIGHT / 2} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#52514e">
              {d.label}
            </text>
            <path d={roundedBarPath(LABEL_COL_WIDTH, y, barWidth, BAR_HEIGHT)} fill={color}>
              <title>{`${d.label}: ${fmt(d.value)}`}</title>
            </path>
            <text x={LABEL_COL_WIDTH + barWidth + 8} y={y + BAR_HEIGHT / 2} textAnchor="start" dominantBaseline="middle" fontSize={12} fontWeight={600} fill="#0b0b0b">
              {fmt(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
