export type ReelSymbol =
  | "heart"
  | "heartbreak"
  | "letter"
  | "flower"
  | "spark"
  | "gift";

export const REEL_TARGET_INDEX = 30;

export const REEL_RESULTS = [
  ["letter", "heart", "flower"],
  ["spark", "flower", "heart"],
  ["heart", "heart", "heart"],
] as const satisfies readonly (readonly ReelSymbol[])[];

const SYMBOL_ORDER: readonly ReelSymbol[] = [
  "heart",
  "flower",
  "heartbreak",
  "letter",
  "spark",
  "gift",
];

export const RESTING_SYMBOLS: readonly ReelSymbol[] = ["flower", "letter", "spark"];

// Одна непрерывная кривая: быстрый ход в начале и нулевая скорость на финише.
// Без промежуточных keyframe-стыков, которые ощущались как рывки.
export const REEL_DECELERATION_EASE = [0.12, 0.62, 0.18, 1] as const;

// Разбитое сердце не фиксируется на линии: оно медленно проходит от +12px
// до -12px относительно центра и только затем уступает место выигрышу.
export const FINAL_NEAR_MISS_OFFSETS = [12, -12] as const;
export const FINAL_NEAR_MISS_TIMES = [0, 0.72, 0.88, 1] as const;

const REEL_STOP_SECONDS = [
  [2.7, 3.6, 4.5],
  [2.7, 3.6, 4.5],
  [2.9, 4, 8.2],
] as const;

export function getReelStopSeconds(round: number, reel: number): number {
  return REEL_STOP_SECONDS[round]?.[reel] ?? REEL_STOP_SECONDS[0][2];
}

export function getRoundRevealDelayMs(round: number): number {
  const stops = REEL_STOP_SECONDS[round] ?? REEL_STOP_SECONDS[0];
  return Math.round((stops[2] + 0.22) * 1_000);
}

export function getReelResult(round: number, reel: number): ReelSymbol {
  return REEL_RESULTS[round]?.[reel] ?? "heart";
}

export function buildReelTrack(round: number, reel: number): ReelSymbol[] {
  const track = Array.from(
    { length: REEL_TARGET_INDEX + 3 },
    (_, index) => SYMBOL_ORDER[(index + reel * 2 + round) % SYMBOL_ORDER.length],
  );

  // На последнем барабане разбитое сердце почти попадает в линию,
  // но итог сценария всегда остаётся выигрышным.
  track[REEL_TARGET_INDEX - 1] =
    round === 2 && reel === 2 ? "heartbreak" : "heart";
  track[REEL_TARGET_INDEX] = getReelResult(round, reel);
  return track;
}
