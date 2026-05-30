export type Kpi = {
  label: string;
  value: string;
  delta: string;
  intent: "positive" | "warning" | "neutral";
};

export type Insight = {
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
};

export type TrendPoint = {
  label: string;
  sessions: number;
  performance: number;
  stability: number;
};

export const kpis: Kpi[] = [
  {
    label: "Sessões demo",
    value: "1.284",
    delta: "+18,4%",
    intent: "positive",
  },
  {
    label: "FPS médio",
    value: "58,7",
    delta: "estável",
    intent: "positive",
  },
  {
    label: "Confiança gestual",
    value: "91%",
    delta: "+6,2%",
    intent: "positive",
  },
  {
    label: "Quedas detectadas",
    value: "0,8%",
    delta: "-2,1%",
    intent: "neutral",
  },
];

export const trends: TrendPoint[] = [
  { label: "Seg", sessions: 42, performance: 84, stability: 91 },
  { label: "Ter", sessions: 58, performance: 86, stability: 93 },
  { label: "Qua", sessions: 75, performance: 88, stability: 92 },
  { label: "Qui", sessions: 68, performance: 91, stability: 94 },
  { label: "Sex", sessions: 94, performance: 90, stability: 95 },
  { label: "Sáb", sessions: 112, performance: 92, stability: 96 },
  { label: "Dom", sessions: 126, performance: 94, stability: 97 },
];

export const insights: Insight[] = [
  {
    title: "Performance visual saudável",
    description:
      "A demo web mantém o loop de canvas abaixo do orçamento de 16,7 ms na maior parte das sessões simuladas.",
    severity: "low",
  },
  {
    title: "Pipeline gestual pronto para telemetria real",
    description:
      "Os eventos de partida e game over já passam por uma camada desacoplada, preparada para GA4 e Vercel Analytics.",
    severity: "medium",
  },
  {
    title: "Risco original isolado",
    description:
      "O engine Python segue preservado, mas a experiência de portfólio agora roda sem webcam ou dependências nativas.",
    severity: "high",
  },
];

export const architectureLayers = [
  {
    name: "Web Experience",
    detail: "Next.js, React, TypeScript, canvas e PWA.",
    status: "Produção",
  },
  {
    name: "Game Engine Original",
    detail: "Python, Pygame, OpenCV e MediaPipe.",
    status: "Preservado",
  },
  {
    name: "Observabilidade",
    detail: "Vercel Analytics, Speed Insights e GA4 opcional.",
    status: "Pronto",
  },
  {
    name: "Dados Futuros",
    detail: "Mock data isolado para troca por banco, API ou eventos reais.",
    status: "Escalável",
  },
];
