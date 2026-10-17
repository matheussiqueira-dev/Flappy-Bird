export type DetectionBudgetOptions = {
  /** Fração máxima da thread principal que a inferência pode ocupar (0–1). */
  maxMainThreadShare: number;
  /** Teto de inferências por segundo; a câmera raramente passa de 30 fps. */
  maxRateHz: number;
  /** Primeiras inferências ignoradas na média: incluem o aquecimento do grafo. */
  warmupRuns: number;
};

export const DEFAULT_DETECTION_BUDGET: Readonly<DetectionBudgetOptions> = Object.freeze({
  maxMainThreadShare: 0.3,
  maxRateHz: 30,
  warmupRuns: 2,
});

/**
 * Espaça as inferências conforme o custo medido de cada uma.
 *
 * `detectForVideo` é síncrono e roda na thread principal, a mesma do loop do
 * jogo. Numa GPU boa ele leva poucos ms; em máquinas lentas ou com WebGL por
 * software pode passar de 300 ms e derrubar o jogo para 3 fps. Com o
 * orçamento, uma inferência de custo C só volta a rodar depois de
 * C / maxMainThreadShare ms, então o jogo mantém a maior parte do tempo.
 */
export class DetectionBudget {
  private readonly options: DetectionBudgetOptions;
  private averageCostMs = 0;
  private lastRunAt = Number.NEGATIVE_INFINITY;
  private runs = 0;

  constructor(options: Partial<DetectionBudgetOptions> = {}) {
    this.options = { ...DEFAULT_DETECTION_BUDGET, ...options };
  }

  /** Intervalo mínimo atual entre duas inferências, em ms. */
  get minIntervalMs(): number {
    const byRate = 1000 / this.options.maxRateHz;
    const byCost = this.averageCostMs / this.options.maxMainThreadShare;
    return Math.max(byRate, byCost);
  }

  shouldRun(nowMs: number): boolean {
    return nowMs - this.lastRunAt >= this.minIntervalMs;
  }

  record(startedAtMs: number, costMs: number): void {
    this.lastRunAt = startedAtMs;
    this.runs += 1;
    if (this.runs <= this.options.warmupRuns) return;
    if (!Number.isFinite(costMs) || costMs < 0) return;
    // Média móvel exponencial: reage a mudanças sem oscilar a cada frame.
    this.averageCostMs = this.averageCostMs === 0 ? costMs : this.averageCostMs * 0.7 + costMs * 0.3;
  }
}
