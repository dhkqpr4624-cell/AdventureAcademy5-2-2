import type { Dungeon10FinalSegmentId } from "../../data/stories/dungeon10Stories";
import { DUNGEON10_ASSET_URLS } from "./dungeon10Assets";

/**
 * The Final Story from the boss's defeat to the credits, as ordered data.
 * The sequence component interprets it step by step; nothing here can be
 * skipped (no skip control exists for any of these steps).
 */
export type Dungeon10FinalStep =
  | { kind: "coverIn"; durationMs: number }
  | { kind: "mapPrepare" }
  | { kind: "mapFadeIn"; durationMs: number }
  | { kind: "wait"; durationMs: number }
  | { kind: "story"; segment: Dungeon10FinalSegmentId }
  | { kind: "chargingSfx" }
  | { kind: "bossCharging" }
  | { kind: "guardVfx" }
  | { kind: "attackButton" }
  | { kind: "hitSfx" }
  | { kind: "bossShakeWithRoar"; shakeMs: number; roarDelayMs: number }
  | { kind: "bossFadeOut"; durationMs: number }
  | { kind: "stopBossBgm" }
  | { kind: "cameraShake"; durationMs: number }
  | { kind: "backdropIn"; durationMs: number }
  | { kind: "disposeMap" }
  | { kind: "endingBgm" }
  | { kind: "illustIn"; imageUrl: string; durationMs: number }
  | { kind: "illustOut"; durationMs: number }
  | { kind: "credits" };

export const DUNGEON10_ILLUST_FADE_MS = 700;
const ILLUST_GAP_MS = 500;

const illustSwap = (imageUrl: string, holdMs: number): Dungeon10FinalStep[] => [
  { kind: "illustOut", durationMs: DUNGEON10_ILLUST_FADE_MS },
  { kind: "wait", durationMs: ILLUST_GAP_MS },
  { kind: "illustIn", imageUrl, durationMs: DUNGEON10_ILLUST_FADE_MS },
  ...(holdMs > 0 ? [{ kind: "wait", durationMs: holdMs } as const] : []),
];

export const DUNGEON10_FINAL_TIMELINE: readonly Dungeon10FinalStep[] = [
  // Final map: battle UI is gone, map builds behind black, then fades in.
  { kind: "coverIn", durationMs: 500 },
  { kind: "mapPrepare" },
  { kind: "mapFadeIn", durationMs: 1000 },
  { kind: "wait", durationMs: 2000 },
  { kind: "story", segment: "afterBattle" },
  // Charging.
  { kind: "chargingSfx" },
  { kind: "bossCharging" },
  { kind: "wait", durationMs: 1500 },
  { kind: "story", segment: "charging" },
  // Deneb's barrier against the beam: 24 frames, 8 fps, once (~3 s).
  { kind: "guardVfx" },
  { kind: "story", segment: "counter" },
  // Counter-attack.
  { kind: "attackButton" },
  { kind: "hitSfx" },
  { kind: "bossShakeWithRoar", shakeMs: 3000, roarDelayMs: 320 },
  { kind: "bossFadeOut", durationMs: 900 },
  { kind: "stopBossBgm" },
  { kind: "story", segment: "fled" },
  { kind: "cameraShake", durationMs: 2000 },
  { kind: "story", segment: "collapse" },
  // Dungeon exit and farewells on a persistent black backdrop.
  { kind: "backdropIn", durationMs: 900 },
  { kind: "disposeMap" },
  { kind: "endingBgm" },
  { kind: "illustIn", imageUrl: DUNGEON10_ASSET_URLS.dungeonExit, durationMs: DUNGEON10_ILLUST_FADE_MS },
  { kind: "story", segment: "exit" },
  ...illustSwap(DUNGEON10_ASSET_URLS.farewell01, 0),
  { kind: "story", segment: "farewell01" },
  ...illustSwap(DUNGEON10_ASSET_URLS.farewell02, 0),
  { kind: "story", segment: "farewell02" },
  ...illustSwap(DUNGEON10_ASSET_URLS.farewell03, 1500),
  { kind: "story", segment: "farewell03" },
  ...illustSwap(DUNGEON10_ASSET_URLS.farewell04, 1500),
  { kind: "story", segment: "farewell04" },
  ...illustSwap(DUNGEON10_ASSET_URLS.farewell03, 1500),
  { kind: "story", segment: "narration" },
  { kind: "illustOut", durationMs: DUNGEON10_ILLUST_FADE_MS },
  { kind: "credits" },
];

/** Images the sequence preloads (and decodes) before they are first shown. */
export const DUNGEON10_FINAL_PRELOAD_URLS: readonly string[] = [
  DUNGEON10_ASSET_URLS.dungeonExit,
  DUNGEON10_ASSET_URLS.farewell01,
  DUNGEON10_ASSET_URLS.farewell02,
  DUNGEON10_ASSET_URLS.farewell03,
  DUNGEON10_ASSET_URLS.farewell04,
  DUNGEON10_ASSET_URLS.creditReturn,
  DUNGEON10_ASSET_URLS.creditTheoLuna,
  DUNGEON10_ASSET_URLS.creditAron,
  DUNGEON10_ASSET_URLS.creditKarp,
  DUNGEON10_ASSET_URLS.creditDeneb,
];
