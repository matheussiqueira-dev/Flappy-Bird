/** Ponto normalizado (0–1) no formato produzido pelo MediaPipe Hand Landmarker. */
export type Landmark = {
  x: number;
  y: number;
};

export type HandPose = "open" | "closed" | "uncertain";

export type HandClassification = {
  pose: HandPose;
  extendedFingers: number;
};

const WRIST = 0;

/** Pares [ponta, articulação PIP] de indicador, médio, anelar e mínimo. */
const FINGERS: ReadonlyArray<readonly [tip: number, pip: number]> = [
  [8, 6],
  [12, 10],
  [16, 14],
  [20, 18],
];

/** A ponta precisa estar ao menos 10% mais longe do pulso que a articulação. */
const EXTENSION_RATIO = 1.1;
const OPEN_MIN_FINGERS = 3;
const CLOSED_MAX_FINGERS = 1;
const LANDMARK_COUNT = 21;

/**
 * Classifica a mão pela distância das pontas dos dedos ao pulso.
 *
 * A engine Python compara apenas o eixo Y (ponta acima da articulação), o que
 * falha com a mão inclinada ou de lado. Comparar distâncias ao pulso é
 * invariante à rotação. O polegar fica de fora porque o eixo dele é
 * perpendicular aos outros dedos e gera falsos positivos com o punho fechado.
 *
 * Entre os limiares de aberta e fechada a pose é "uncertain", uma histerese
 * que evita alternância rápida quando a mão está meio aberta.
 */
export function classifyHand(landmarks: ReadonlyArray<Landmark>): HandClassification {
  if (landmarks.length < LANDMARK_COUNT) {
    return { pose: "uncertain", extendedFingers: 0 };
  }

  const wrist = landmarks[WRIST];
  let extendedFingers = 0;

  for (const [tipIndex, pipIndex] of FINGERS) {
    const tipDistance = distance(landmarks[tipIndex], wrist);
    const pipDistance = distance(landmarks[pipIndex], wrist);

    if (tipDistance > pipDistance * EXTENSION_RATIO) {
      extendedFingers += 1;
    }
  }

  const pose: HandPose =
    extendedFingers >= OPEN_MIN_FINGERS
      ? "open"
      : extendedFingers <= CLOSED_MAX_FINGERS
        ? "closed"
        : "uncertain";

  return { pose, extendedFingers };
}

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
