import type { HandPose } from "./hand-pose";

export type GestureMapperOptions = {
  /** Frames consecutivos com a mesma pose antes de aceitá-la como estável. */
  stableFrames: number;
  /** Intervalo mínimo entre dois flaps gerados por gesto, em ms. */
  cooldownMs: number;
};

export type GestureObservation = {
  /** `null` quando nenhuma mão foi detectada no frame. */
  pose: HandPose | null;
  timestampMs: number;
};

export type GestureOutput = {
  shouldFlap: boolean;
  stablePose: Exclude<HandPose, "uncertain"> | null;
};

export const DEFAULT_GESTURE_OPTIONS: Readonly<GestureMapperOptions> = Object.freeze({
  stableFrames: 2,
  cooldownMs: 180,
});

/**
 * Traduz poses de mão em comandos de jogo, como o modo discreto da engine
 * Python: abrir a mão depois de fechá-la gera um flap.
 *
 * Exigir algumas leituras iguais antes de trocar de pose filtra o ruído do
 * detector, e o cooldown impede rajadas de flaps quando a mão oscila.
 */
export class GestureMapper {
  private readonly options: GestureMapperOptions;
  private stablePose: GestureOutput["stablePose"] = null;
  private candidatePose: GestureOutput["stablePose"] = null;
  private candidateFrames = 0;
  private lastFlapAt = Number.NEGATIVE_INFINITY;

  constructor(options: Partial<GestureMapperOptions> = {}) {
    this.options = { ...DEFAULT_GESTURE_OPTIONS, ...options };
  }

  update({ pose, timestampMs }: GestureObservation): GestureOutput {
    if (pose === null || pose === "uncertain") {
      this.candidatePose = null;
      this.candidateFrames = 0;
      return { shouldFlap: false, stablePose: this.stablePose };
    }

    if (pose === this.candidatePose) {
      this.candidateFrames += 1;
    } else {
      this.candidatePose = pose;
      this.candidateFrames = 1;
    }

    if (this.candidateFrames < this.options.stableFrames || pose === this.stablePose) {
      return { shouldFlap: false, stablePose: this.stablePose };
    }

    const previous = this.stablePose;
    this.stablePose = pose;

    const opened = previous === "closed" && pose === "open";
    const cooledDown = timestampMs - this.lastFlapAt >= this.options.cooldownMs;
    const shouldFlap = opened && cooledDown;

    if (shouldFlap) {
      this.lastFlapAt = timestampMs;
    }

    return { shouldFlap, stablePose: this.stablePose };
  }

  reset(): void {
    this.stablePose = null;
    this.candidatePose = null;
    this.candidateFrames = 0;
    this.lastFlapAt = Number.NEGATIVE_INFINITY;
  }
}
