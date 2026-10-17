export type GameStatus = "ready" | "playing" | "paused" | "game-over";

export type InputSource = "pointer" | "keyboard" | "gesture";

/**
 * `flap`: gravidade + impulso, o Flappy Bird clássico.
 * `steer`: a altura do pássaro segue um alvo (a altura da mão), como o modo
 * contínuo da engine Python. Sem gravidade, então só os canos encerram a partida.
 */
export type ControlMode = "flap" | "steer";

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
  /** Variação vertical (±px) do centro do vão entre canos consecutivos. */
  pipeWaveAmplitude: number;
  /** Se falso, o teto só bloqueia o pássaro em vez de encerrar a partida. */
  ceilingKills: boolean;
  /** Fração da distância até o alvo percorrida por tick no modo `steer`. */
  steerSmoothing: number;
  /** Folga entre o pássaro e o teto/chão no modo `steer`, em px. */
  steerMarginPx: number;
  /** Duração fixa de um tick de simulação, em ms. */
  tickMs: number;
  /** Limite de ticks por frame para evitar a "espiral da morte" após travamentos. */
  maxTicksPerFrame: number;
};

export type GameState = {
  status: GameStatus;
  controlMode: ControlMode;
  /** Alvo normalizado (0 = topo, 1 = chão) usado no modo `steer`. */
  steerTarget: number;
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
