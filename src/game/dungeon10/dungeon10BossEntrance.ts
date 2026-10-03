/**
 * Boss-room first-entry destruction sequence (data + runner). The runner is
 * pure so the exact order and timings can be verified without a renderer.
 */
export type Dungeon10EntranceStep =
  | { action: "hold"; durationMs: number }
  | { action: "cameraShake"; durationMs: number }
  | { action: "crack1" }
  | { action: "crack2" }
  | { action: "shatter" }
  | { action: "bossAppear" }
  | { action: "combat" };

export const DUNGEON10_ENTRANCE_TIMELINE: readonly Dungeon10EntranceStep[] = [
  { action: "hold", durationMs: 2000 },
  { action: "cameraShake", durationMs: 2000 },
  { action: "crack1" },
  { action: "hold", durationMs: 1000 },
  { action: "crack2" },
  { action: "hold", durationMs: 2000 },
  { action: "shatter" },
  { action: "bossAppear" },
  { action: "combat" },
];

export type Dungeon10EntranceHandlers = {
  hold: (durationMs: number) => Promise<void>;
  cameraShake: (durationMs: number) => Promise<void>;
  /** First crack SFX (once) + crack stage 1. */
  crack1: () => void;
  /** Second, heavier crack SFX (once) + crack stage 2. */
  crack2: () => void;
  /** Shatter SFX (once) + fragments + walls/ceiling removed + space shown. */
  shatter: () => void;
  bossAppear: () => Promise<void>;
  combat: () => void;
};

/** Runs every step exactly once, stopping as soon as `isCancelled` is true. */
export async function runDungeon10BossEntrance(
  handlers: Dungeon10EntranceHandlers,
  isCancelled: () => boolean,
): Promise<boolean> {
  for (const step of DUNGEON10_ENTRANCE_TIMELINE) {
    if (isCancelled()) return false;
    switch (step.action) {
      case "hold": await handlers.hold(step.durationMs); break;
      case "cameraShake": await handlers.cameraShake(step.durationMs); break;
      case "crack1": handlers.crack1(); break;
      case "crack2": handlers.crack2(); break;
      case "shatter": handlers.shatter(); break;
      case "bossAppear": await handlers.bossAppear(); break;
      case "combat": handlers.combat(); break;
    }
  }
  return !isCancelled();
}
