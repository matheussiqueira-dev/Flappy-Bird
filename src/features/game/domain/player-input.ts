import { DEFAULT_GAME_CONFIG } from "./config";
import { flap, togglePause } from "./engine";
import type { GameConfig, GameEvent, GameState, InputSource } from "./types";

export function pauseWhenHandLost(state: GameState, gestureOnly: boolean, handAvailable: boolean): boolean {
  if (!gestureOnly || handAvailable || state.status !== "playing") return false;
  togglePause(state);
  return true;
}

/** Durante uma sessão gestual, só uma nova transição da mão pode jogar/retomar. */
export function applyPlayerFlap(
  state: GameState,
  source: InputSource,
  gestureOnly: boolean,
  handAvailable: boolean,
  config: GameConfig = DEFAULT_GAME_CONFIG,
): GameEvent[] {
  if (gestureOnly && (source !== "gesture" || !handAvailable)) return [];
  if (gestureOnly && state.status === "paused") togglePause(state);
  return flap(state, source, config);
}
