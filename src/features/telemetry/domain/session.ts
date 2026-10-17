import type { InputSource } from "@/features/game/domain/types";

export const INPUT_SOURCES: readonly InputSource[] = ["pointer", "keyboard", "gesture"];

export type GameSessionRecord = {
  id: string;
  /** Instante do game over, em ISO 8601. */
  endedAt: string;
  durationMs: number;
  score: number;
  flaps: Record<InputSource, number>;
};

export type SessionSummary = {
  totalGames: number;
  bestScore: number;
  averageScore: number;
  averageDurationMs: number;
  totalPlayMs: number;
  totalFlaps: number;
  flapsByInput: Record<InputSource, number>;
  /** Fração (0–1) dos flaps feitos por gesto. */
  gestureShare: number;
  /** Até 12 pontuações mais recentes, em ordem cronológica. */
  recentScores: number[];
  /** Média das 5 últimas partidas menos a média das 5 anteriores. */
  scoreTrend: number | null;
};

const RECENT_WINDOW = 12;
const TREND_WINDOW = 5;

export function summarizeSessions(records: readonly GameSessionRecord[]): SessionSummary {
  const flapsByInput: Record<InputSource, number> = { pointer: 0, keyboard: 0, gesture: 0 };
  let bestScore = 0;
  let scoreSum = 0;
  let totalPlayMs = 0;

  for (const record of records) {
    bestScore = Math.max(bestScore, record.score);
    scoreSum += record.score;
    totalPlayMs += record.durationMs;
    for (const source of INPUT_SOURCES) {
      flapsByInput[source] += record.flaps[source];
    }
  }

  const totalGames = records.length;
  const totalFlaps = flapsByInput.pointer + flapsByInput.keyboard + flapsByInput.gesture;
  const chronological = [...records].sort((a, b) => a.endedAt.localeCompare(b.endedAt));
  const scores = chronological.map((record) => record.score);

  return {
    totalGames,
    bestScore,
    averageScore: totalGames ? round(scoreSum / totalGames, 1) : 0,
    averageDurationMs: totalGames ? Math.round(totalPlayMs / totalGames) : 0,
    totalPlayMs,
    totalFlaps,
    flapsByInput,
    gestureShare: totalFlaps ? flapsByInput.gesture / totalFlaps : 0,
    recentScores: scores.slice(-RECENT_WINDOW),
    scoreTrend: computeTrend(scores),
  };
}

function computeTrend(scores: number[]): number | null {
  if (scores.length < TREND_WINDOW * 2) {
    return null;
  }

  const latest = scores.slice(-TREND_WINDOW);
  const previous = scores.slice(-TREND_WINDOW * 2, -TREND_WINDOW);

  return round(average(latest) - average(previous), 1);
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
