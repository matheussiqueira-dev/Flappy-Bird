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
  pipeWaveAmplitude: 74,
  ceilingKills: true,
  steerSmoothing: 0.15,
  steerMarginPx: 4,
  tickMs: 1000 / 60,
  maxTicksPerFrame: 5,
});

/**
 * Física assistida para o controle por gestos.
 *
 * Um clique é instantâneo; um flap por gesto exige fechar e abrir a mão
 * (~300–400 ms) mais o atraso de câmera e detecção. Com a física do clique o
 * pássaro cai rápido demais para esse ritmo. Aqui um flap sobe ~104 px e a
 * queda é lenta, então um ciclo de mão a cada 1,5 s ainda mantém o voo
 * (calibrado em gesture-playability.test.ts). Os canos seguem a engine Python
 * original, feita para gestos: vão grande, velocidade 2,0 e intervalo de 150
 * ticks. O teto não encerra a partida, então flaps a mais não são punidos.
 */
export const GESTURE_GAME_CONFIG: Readonly<GameConfig> = Object.freeze({
  ...DEFAULT_GAME_CONFIG,
  gravity: 0.12,
  flapVelocity: -5,
  maxFallSpeed: 2,
  pipeGap: 240,
  pipeGapMargin: 150,
  pipeWaveAmplitude: 40,
  pipeSpeed: 2,
  pipeSpawnInterval: 150,
  ceilingKills: false,
});
