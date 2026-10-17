import type { GameConfig } from "./types";

/**
 * Valores calibrados para 60 ticks/s. O loop usa timestep fixo, então a
 * sensação do jogo é a mesma em monitores de 60 Hz, 144 Hz ou com quedas de FPS.
 */
export const DEFAULT_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({
  width: 960,
  height: 540,
  birdX: 210,
  birdRadius: 20,
  pipeWidth: 72,
  pipeGap: 165,
  groundHeight: 58,
  gravity: 0.48,
  flapVelocity: -9.8,
  maxFallSpeed: 10.5,
  pipeSpeed: 3.1,
  pipeSpawnInterval: 96,
  pipeGapMargin: 110,
  steerSmoothing: 0.15,
  steerMarginPx: 4,
  tickMs: 1000 / 60,
  maxTicksPerFrame: 5,
});
