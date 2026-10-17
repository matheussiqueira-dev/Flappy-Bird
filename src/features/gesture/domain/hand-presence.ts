/**
 * Tempo sem ver a mão até o jogo pausar e o gesto em andamento ser descartado.
 * 1 s tolera saídas rápidas do quadro e quedas de detecção em máquinas lentas
 * sem deixar o pássaro cair por muito tempo sem controle.
 */
export const HAND_LOST_GRACE_MS = 1000;

/** Validade temporal da última mão vista; também detecta vídeo congelado. */
export class HandPresence {
  private lastSeenAt: number | null = null;

  constructor(private readonly graceMs = HAND_LOST_GRACE_MS) {}

  observe(timestampMs: number): void {
    if (Number.isFinite(timestampMs)) this.lastSeenAt = timestampMs;
  }

  isAvailable(nowMs: number): boolean {
    return this.lastSeenAt !== null && nowMs >= this.lastSeenAt && nowMs - this.lastSeenAt < this.graceMs;
  }

  reset(): void {
    this.lastSeenAt = null;
  }
}
