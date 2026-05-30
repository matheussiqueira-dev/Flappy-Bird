import type { TrendPoint } from "@/lib/mock-data";

type MiniBarsProps = {
  points: TrendPoint[];
  metric: keyof Pick<TrendPoint, "sessions" | "performance" | "stability">;
  label: string;
};

export function MiniBars({ points, metric, label }: MiniBarsProps) {
  const max = Math.max(...points.map((point) => Number(point[metric])));

  return (
    <div className="mini-bars" aria-label={label}>
      {points.map((point) => {
        const value = Number(point[metric]);
        const height = Math.max(16, Math.round((value / max) * 100));

        return (
          <span key={point.label} className="mini-bars__item">
            <span className="mini-bars__bar" style={{ height: `${height}%` }} />
            <span className="mini-bars__label">{point.label}</span>
          </span>
        );
      })}
    </div>
  );
}

export function SignalLine({ points }: { points: TrendPoint[] }) {
  const width = 680;
  const height = 210;
  const padding = 26;
  const max = 100;
  const min = 75;

  const toPoint = (point: TrendPoint, index: number, key: "performance" | "stability") => {
    const x = padding + (index / (points.length - 1)) * (width - padding * 2);
    const y =
      height -
      padding -
      ((point[key] - min) / (max - min)) * (height - padding * 2);

    return `${x},${y}`;
  };

  const performance = points.map((point, index) => toPoint(point, index, "performance"));
  const stability = points.map((point, index) => toPoint(point, index, "stability"));

  return (
    <svg
      className="signal-line"
      role="img"
      aria-label="Tendência de performance e estabilidade"
      viewBox={`0 0 ${width} ${height}`}
    >
      <path d={`M${performance.join(" L")}`} className="signal-line__performance" />
      <path d={`M${stability.join(" L")}`} className="signal-line__stability" />
      {points.map((point, index) => {
        const [x, y] = toPoint(point, index, "performance").split(",").map(Number);
        return <circle key={point.label} cx={x} cy={y} r="4" className="signal-line__dot" />;
      })}
    </svg>
  );
}
