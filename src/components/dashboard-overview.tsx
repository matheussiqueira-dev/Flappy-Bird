import {
  Activity,
  AlertTriangle,
  Gauge,
  LineChart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { MiniBars, SignalLine } from "@/components/charts";
import type { DashboardSnapshot } from "@/lib/dashboard-data";

const iconMap = [Activity, Gauge, Sparkles, ShieldCheck];

type DashboardOverviewProps = {
  snapshot: DashboardSnapshot;
};

export function DashboardOverview({ snapshot }: DashboardOverviewProps) {
  const {
    alerts,
    architectureLayers,
    comparisons,
    generatedAt,
    insights,
    kpis,
    qualityScore,
    source,
    trends,
  } = snapshot;

  return (
    <div className="dashboard-grid">
      <section className="kpi-grid" aria-label="Indicadores principais">
        {kpis.map((kpi, index) => {
          const Icon = iconMap[index] ?? Activity;
          return (
            <article className="metric-card" key={kpi.label}>
              <div className="metric-card__icon">
                <Icon size={18} aria-hidden />
              </div>
              <span>{kpi.label}</span>
              <strong>{kpi.value}</strong>
              <small className={`delta delta--${kpi.intent}`}>{kpi.delta}</small>
            </article>
          );
        })}
      </section>

      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Tendência operacional</span>
            <h2>Qualidade da experiência</h2>
          </div>
          <LineChart size={20} aria-hidden />
        </div>
        <SignalLine points={trends} />
        <div className="legend-row">
          <span><i className="legend legend--performance" /> Performance</span>
          <span><i className="legend legend--stability" /> Estabilidade</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Score</span>
            <h2>Saúde do produto</h2>
          </div>
          <Gauge size={20} aria-hidden />
        </div>
        <div className="health-score" aria-label={`Score de qualidade ${qualityScore}%`}>
          <strong>{qualityScore}%</strong>
          <span>Índice composto de performance e estabilidade.</span>
        </div>
        <div className="data-meta">
          <span>Fonte: {source}</span>
          <span>
            Atualizado:{" "}
            {new Intl.DateTimeFormat("pt-BR").format(new Date(generatedAt))}
          </span>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Adoção</span>
            <h2>Sessões por dia</h2>
          </div>
          <Activity size={20} aria-hidden />
        </div>
        <MiniBars points={trends} metric="sessions" label="Sessões por dia" />
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Comparativo</span>
            <h2>Última janela</h2>
          </div>
          <Activity size={20} aria-hidden />
        </div>
        <div className="comparison-grid">
          {comparisons.map((comparison) => (
            <article key={comparison.label}>
              <span>{comparison.label}</span>
              <strong>{comparison.current}</strong>
              <small>
                anterior {comparison.previous} · {comparison.delta}
              </small>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Insights</span>
            <h2>Recomendações</h2>
          </div>
          <Sparkles size={20} aria-hidden />
        </div>
        <div className="insight-list">
          {insights.map((insight) => (
            <article className="insight-item" key={insight.title}>
              <span className={`severity severity--${insight.severity}`}>
                {insight.severity}
              </span>
              <h3>{insight.title}</h3>
              <p>{insight.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--wide">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Arquitetura</span>
            <h2>Camadas do produto</h2>
          </div>
          <ShieldCheck size={20} aria-hidden />
        </div>
        <div className="layer-table">
          {architectureLayers.map((layer) => (
            <article key={layer.name}>
              <strong>{layer.name}</strong>
              <span>{layer.detail}</span>
              <em>{layer.status}</em>
            </article>
          ))}
        </div>
      </section>

      <section className="panel panel--alert">
        <div className="panel__header">
          <div>
            <span className="eyebrow">Alertas</span>
            <h2>Monitoramento</h2>
          </div>
          <AlertTriangle size={20} aria-hidden />
        </div>
        <div className="alert-list">
          {alerts.map((alert) => (
            <article className={`alert-item alert-item--${alert.intent}`} key={alert.title}>
              <strong>{alert.title}</strong>
              <p>{alert.description}</p>
              <span>{alert.action}</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
