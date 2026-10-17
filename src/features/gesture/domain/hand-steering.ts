import type { Landmark } from "./hand-pose";

/** Pulso e base dos dedos: pontos estáveis mesmo com a mão abrindo e fechando. */
const CENTER_LANDMARKS = [0, 5, 9, 13, 17] as const;

export type SteeringOptions = {
  /** Faixa vertical útil da câmera; fora dela o valor satura. */
  minY: number;
  maxY: number;
  /** Variação mínima (na escala 0–1 de saída) para mover o alvo. */
  deadZone: number;
};

/** Mesmos valores do modo contínuo da engine Python (`gesture_mapping.py`). */
export const DEFAULT_STEERING_OPTIONS: Readonly<SteeringOptions> = Object.freeze({
  minY: 0.2,
  maxY: 0.8,
  deadZone: 0.02,
});

/** Altura do centro da mão, normalizada pela imagem (0 = topo). */
export function handCenterY(landmarks: ReadonlyArray<Landmark>): number | null {
  if (landmarks.length < 21) return null;

  let sum = 0;
  for (const index of CENTER_LANDMARKS) sum += landmarks[index].y;
  return sum / CENTER_LANDMARKS.length;
}

/**
 * Converte a altura da mão em alvo do jogo (0 = topo, 1 = chão).
 *
 * A faixa útil evita que o jogador precise levar a mão até a borda da
 * câmera, e a zona morta segura o alvo parado contra o tremor natural da mão.
 * Com a mão fora de cena, o alvo fica onde estava.
 */
export class HandSteering {
  private readonly options: SteeringOptions;
  private target: number | null = null;

  constructor(options: Partial<SteeringOptions> = {}) {
    this.options = { ...DEFAULT_STEERING_OPTIONS, ...options };
  }

  update(centerY: number | null): number | null {
    if (centerY === null || !Number.isFinite(centerY)) return this.target;

    const { minY, maxY, deadZone } = this.options;
    const clamped = Math.min(maxY, Math.max(minY, centerY));
    const normalized = (clamped - minY) / (maxY - minY);

    if (this.target === null || Math.abs(normalized - this.target) >= deadZone) {
      this.target = normalized;
    }

    return this.target;
  }

  reset(): void {
    this.target = null;
  }
}
