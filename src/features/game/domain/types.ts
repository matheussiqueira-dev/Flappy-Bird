export type GameStatus = "ready" | "playing" | "paused" | "game-over";

export type InputSource = "pointer" | "keyboard" | "gesture";

export type Pipe = {
  x: number;
  gapY: number;
  passed: boolean;
};

export type GameConfig = {
  width: number;
  height: number;
  birdX: number;
  birdRadius: number;
  pipeWidth: number;
  pipeGap: number;
  groundHeight: number;
  /** Aceleração em px/tick². */
  gravity: number;
  /** Velocidade vertical aplicada no flap, em px/tick. */
  flapVelocity: number;
  maxFallSpeed: number;
  /** Velocidade horizontal dos canos, em px/tick. */
  pipeSpeed: number;
  /** Ticks entre canos consecutivos. */
  pipeSpawnInterval: number;
  /** Margem mínima entre o centro do vão e as bordas jogáveis. */
  pipeGapMargin: number;
  /** Duração fixa de um tick de simulação, em ms. */
  tickMs: number;
  /** Limite de ticks por frame para evitar a "espiral da morte" após travamentos. */
  maxTicksPerFrame: number;
};

export type GameState = {
  status: GameStatus;
  birdY: number;
  birdVelocity: number;
  pipes: Pipe[];
  score: number;
  highScore: number;
  /** Ticks simulados desde a criação; também anima cenário fora de partida. */
  tick: number;
  spawnTimer: number;
  flaps: Record<InputSource, number>;
  /** Tempo jogado na partida atual, em ms de simulação. */
  elapsedMs: number;
  /** Resto de tempo real ainda não convertido em ticks. */
  accumulatorMs: number;
};

export type GameEvent =
  | { type: "started" }
  | { type: "flapped"; source: InputSource }
  | { type: "scored"; score: number }
  | { type: "game-over"; score: number; highScore: number; isNewRecord: boolean };
