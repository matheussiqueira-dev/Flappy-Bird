import { DEFAULT_GAME_CONFIG } from "../domain/config";
import type { GameConfig, GameState, Pipe } from "../domain/types";

export type RenderOptions = {
  /** Texto exibido na tela inicial, adaptado ao input ativo. */
  startHint: string;
};

/**
 * Camada de apresentação: lê o estado e desenha. Não altera a simulação, o
 * que permite trocar o canvas 2D por WebGL ou rodar o engine sem tela.
 */
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): void {
  const { width, height, groundHeight } = config;
  const frame = state.tick;

  ctx.clearRect(0, 0, width, height);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#a9dcf2");
  sky.addColorStop(0.62, "#e7f6f6");
  sky.addColorStop(1, "#f7f8f4");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawCloud(ctx, 130 + ((frame * 0.18) % 860), 82, 1);
  drawCloud(ctx, 620 - ((frame * 0.12) % 760), 146, 0.78);
  drawCloud(ctx, 780 - ((frame * 0.08) % 900), 62, 0.56);

  for (const pipe of state.pipes) {
    drawPipe(ctx, pipe, config);
  }

  ctx.fillStyle = "#2c8c63";
  ctx.fillRect(0, height - groundHeight, width, 12);
  ctx.fillStyle = "#50483f";
  ctx.fillRect(0, height - groundHeight + 12, width, groundHeight - 12);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  for (let x = -80 + (frame % 80); x < width; x += 80) {
    ctx.fillRect(x, height - 30, 42, 4);
  }

  drawBird(ctx, state, config);
  drawHud(ctx, state);

  if (state.status !== "playing") {
    drawOverlay(ctx, state, options, config);
  }
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(255, 255, 255, 0.78)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 45, 22, 0, 0, Math.PI * 2);
  ctx.ellipse(38, 14, 52, 25, 0, 0, Math.PI * 2);
  ctx.ellipse(76, 19, 38, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPipe(ctx: CanvasRenderingContext2D, pipe: Pipe, config: GameConfig) {
  const { pipeWidth, pipeGap, height, groundHeight } = config;
  const topHeight = pipe.gapY - pipeGap / 2;
  const bottomY = pipe.gapY + pipeGap / 2;
  const bottomHeight = height - groundHeight - bottomY;

  ctx.fillStyle = "#2faa72";
  ctx.strokeStyle = "#16724a";
  ctx.lineWidth = 4;

  ctx.fillRect(pipe.x, 0, pipeWidth, topHeight);
  ctx.strokeRect(pipe.x, 0, pipeWidth, topHeight);
  ctx.fillRect(pipe.x - 7, topHeight - 28, pipeWidth + 14, 28);
  ctx.strokeRect(pipe.x - 7, topHeight - 28, pipeWidth + 14, 28);

  ctx.fillRect(pipe.x, bottomY, pipeWidth, bottomHeight);
  ctx.strokeRect(pipe.x, bottomY, pipeWidth, bottomHeight);
  ctx.fillRect(pipe.x - 7, bottomY, pipeWidth + 14, 28);
  ctx.strokeRect(pipe.x - 7, bottomY, pipeWidth + 14, 28);
}

function drawBird(ctx: CanvasRenderingContext2D, state: GameState, config: GameConfig) {
  const { birdX, birdRadius } = config;
  const wing = Math.sin(state.tick / 4) * 5;

  ctx.save();
  ctx.translate(birdX, state.birdY);
  ctx.rotate(Math.max(-0.42, Math.min(0.65, state.birdVelocity / 18)));

  ctx.fillStyle = "#f6bd3c";
  ctx.strokeStyle = "#4d3613";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, birdRadius + 8, birdRadius, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f1873b";
  ctx.beginPath();
  ctx.moveTo(birdRadius + 6, -2);
  ctx.lineTo(birdRadius + 28, 5);
  ctx.lineTo(birdRadius + 5, 13);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(10, -8, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#111417";
  ctx.beginPath();
  ctx.arc(13, -7, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#dd8e2f";
  ctx.beginPath();
  ctx.ellipse(-9, 8 + wing, 16, 8, -0.35, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = "rgba(17, 20, 23, 0.76)";
  ctx.fillRect(24, 24, 160, 74);
  ctx.fillStyle = "#ffffff";
  ctx.font = "700 34px Arial";
  ctx.fillText(String(state.score), 42, 66);
  ctx.font = "500 14px Arial";
  ctx.fillText(`recorde ${state.highScore}`, 42, 86);
}

function drawOverlay(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  options: RenderOptions,
  config: GameConfig,
) {
  const { width, height, groundHeight } = config;

  ctx.fillStyle = "rgba(14, 18, 22, 0.58)";
  ctx.fillRect(0, 0, width, height - groundHeight);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.font = "700 42px Arial";
  const title = state.status === "game-over" ? "Game over" : "Flappy Gestures";
  ctx.fillText(title, width / 2, height / 2 - 24);
  ctx.font = "500 18px Arial";
  const subtitle =
    state.status === "paused"
      ? "Partida pausada"
      : state.status === "game-over"
        ? `Pontuação ${state.score} · ${options.startHint}`
        : options.startHint;
  ctx.fillText(subtitle, width / 2, height / 2 + 12);
  ctx.textAlign = "left";
}
