/** Validade temporal da última mão vista; também detecta vídeo congelado. */
export class HandPresence {
  private lastSeenAt: number | null = null;

  constructor(private readonly graceMs = 600) {}

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
