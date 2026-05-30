import { architectureLayers, insights, kpis, trends } from "@/lib/mock-data";

export type DashboardAlert = {
  title: string;
  description: string;
  intent: "success" | "warning" | "critical";
  action: string;
};

export type DashboardSnapshot = {
  schemaVersion: "2026-05-30";
  source: "mock";
  generatedAt: string;
  qualityScore: number;
  kpis: typeof kpis;
  trends: typeof trends;
  insights: typeof insights;
  architectureLayers: typeof architectureLayers;
  comparisons: Array<{
    label: string;
    current: string;
    previous: string;
    delta: string;
  }>;
  alerts: DashboardAlert[];
};

export function getDashboardSnapshot(now = new Date()): DashboardSnapshot {
  const latest = trends.at(-1);
  const previous = trends.at(-2);
  const qualityScore = latest
    ? Math.round((latest.performance * 0.55 + latest.stability * 0.45) * 10) / 10
    : 0;

  return {
    schemaVersion: "2026-05-30",
    source: "mock",
    generatedAt: now.toISOString(),
    qualityScore,
    kpis,
    trends,
    insights,
    architectureLayers,
    comparisons: [
      {
        label: "Sessões",
        current: latest ? String(latest.sessions) : "0",
        previous: previous ? String(previous.sessions) : "0",
        delta: latest && previous ? `+${latest.sessions - previous.sessions}` : "0",
      },
      {
        label: "Performance",
        current: latest ? `${latest.performance}%` : "0%",
        previous: previous ? `${previous.performance}%` : "0%",
        delta:
          latest && previous ? `+${latest.performance - previous.performance} pts` : "0 pts",
      },
      {
        label: "Estabilidade",
        current: latest ? `${latest.stability}%` : "0%",
        previous: previous ? `${previous.stability}%` : "0%",
        delta:
          latest && previous ? `+${latest.stability - previous.stability} pts` : "0 pts",
      },
    ],
    alerts: [
      {
        title: "Operação estável",
        description:
          "Nenhum incidente ativo foi detectado na amostra atual de telemetria.",
        intent: "success",
        action: "Manter monitoramento de Core Web Vitals após deploy.",
      },
      {
        title: "Dados ainda demonstrativos",
        description:
          "O dashboard está desacoplado e pronto para receber eventos reais.",
        intent: "warning",
        action: "Conectar GA4, Vercel Analytics export ou banco analítico.",
      },
    ],
  };
}
