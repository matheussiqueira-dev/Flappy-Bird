"use client";

import { Gamepad2, Hand, Timer, Trash2, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";

import { summarizeSessions, type GameSessionRecord } from "@/features/telemetry/domain/session";
import { getSessionRepository } from "@/features/telemetry/infrastructure/session-repository";

const NO_SESSIONS: readonly GameSessionRecord[] = [];

const subscribe = (listener: () => void) => getSessionRepository().subscribe(listener);
const getSnapshot = () => getSessionRepository().list();
const getServerSnapshot = () => NO_SESSIONS;

const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 0 });

function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return seconds ? `${minutes}min ${seconds}s` : `${minutes}min`;
}

/**
 * Telemetria real, gravada pela demo neste navegador. Fica ao lado do dataset
 * de amostra para deixar claro o que é medido e o que é ilustrativo.
 */
export function SessionInsights() {
  const sessions = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const summary = useMemo(() => summarizeSessions(sessions), [sessions]);

  if (summary.totalGames === 0) {
    return (
      <section className="panel panel--full session-insights" aria-labelledby="session-insights-title">
        <PanelHeader />
        <div className="empty-state">
          <Gamepad2 size={28} aria-hidden />
          <p>
            Nenhuma partida registrada ainda. Cada partida da demo grava pontuação, duração e
            input usado, só neste navegador.
          </p>
          <Link className="button button--primary" href="/play">
            Jogar a primeira partida
          </Link>
        </div>
      </section>
    );
  }

  const maxRecent = Math.max(1, ...summary.recentScores);
  const trend = summary.scoreTrend;

  const cards = [
    { label: "Partidas", value: numberFormat.format(summary.totalGames), icon: Gamepad2 },
    { label: "Melhor pontuação", value: numberFormat.format(summary.bestScore), icon: Trophy },
    {
      label: "Pontuação média",
      value: numberFormat.format(summary.averageScore),
      icon: TrendingUp,
      detail:
        trend === null
          ? "tendência após 10 partidas"
          : `${trend >= 0 ? "+" : ""}${numberFormat.format(trend)} nas últimas 5`,
    },
    {
      label: "Tempo jogado",
      value: formatDuration(summary.totalPlayMs),
      icon: Timer,
      detail: `média ${formatDuration(summary.averageDurationMs)} por partida`,
    },
    {
      label: "Flaps por gesto",
      value: percentFormat.format(summary.gestureShare),
      icon: Hand,
      detail: `${numberFormat.format(summary.flapsByInput.gesture)} de ${numberFormat.format(summary.totalFlaps)} flaps`,
    },
  ];

  return (
    <section className="panel panel--full session-insights" aria-labelledby="session-insights-title">
      <PanelHeader onClear={() => getSessionRepository().clear()} />

      <div className="session-insights__cards">
        {cards.map(({ label, value, icon: Icon, detail }) => (
          <article key={label}>
            <Icon size={16} aria-hidden />
            <span>{label}</span>
            <strong>{value}</strong>
            {detail ? <small>{detail}</small> : null}
          </article>
        ))}
      </div>

      <div
        className="score-bars"
        role="img"
        aria-label={`Pontuações das últimas ${summary.recentScores.length} partidas: ${summary.recentScores.join(", ")}`}
      >
        {summary.recentScores.map((score, index) => (
          <span key={index} className="score-bars__item">
            <span
              className="score-bars__bar"
              style={{ height: `${Math.max(6, Math.round((score / maxRecent) * 100))}%` }}
            />
            <span className="score-bars__value">{score}</span>
          </span>
        ))}
      </div>
    </section>
  );
}

function PanelHeader({ onClear }: { onClear?: () => void }) {
  return (
    <div className="panel__header">
      <div>
        <span className="eyebrow">Dados reais · este navegador</span>
        <h2 id="session-insights-title">Suas partidas</h2>
      </div>
      {onClear ? (
        <button className="button button--ghost" type="button" onClick={onClear}>
          <Trash2 size={16} aria-hidden />
          Limpar dados
        </button>
      ) : null}
    </div>
  );
}
