/**
 * Dungeon10 (final floor) asset registry and measured source-image data.
 *
 * Every PNG listed here is a byte-for-byte copy of a user-provided file.
 * Alpha bounds were measured on the real files with an alpha >= 32 threshold
 * (see scripts/dungeon10-asset-checks.mjs, which re-measures them) so that
 * faint anti-aliasing noise never moves a character's foot anchor.
 */

const base = `${import.meta.env.BASE_URL}assets/dungeon10/`;

export const DUNGEON10_ASSET_URLS = {
  bossCombat: `${base}boss/hungry-history-devourer-combat.png`,
  bossStandingLeft: `${base}boss/hungry-history-devourer-standing-left.png`,
  bossCharging: `${base}boss/hungry-history-devourer-charging.png`,
  guardSpriteSheet: `${base}vfx/deneb-guard-spritesheet.png`,
  helpDeneb: `${base}help/deneb-help.png`,
  helpKarp: `${base}help/karp-help.png`,
  helpAron: `${base}help/aron-help.png`,
  theoCombat: `${base}final/theo-combat.png`,
  lunaCombat: `${base}final/luna-combat.png`,
  karpCombat: `${base}final/karp-combat.png`,
  aronCombat: `${base}final/aron-combat.png`,
  /** The provided Deneb standing_R.png is byte-identical to this existing project file. */
  denebStandingRight: `${import.meta.env.BASE_URL}assets/npcs/chapter2/deneb/standing_R.png`,
  dungeonExit: `${base}ending/dungeon-exit.png`,
  farewell01: `${base}ending/farewell01.png`,
  farewell02: `${base}ending/farewell02.png`,
  farewell03: `${base}ending/farewell03.png`,
  farewell04: `${base}ending/farewell04.png`,
  creditReturn: `${base}ending/credits/return.png`,
  creditTheoLuna: `${base}ending/credits/theo-luna.png`,
  creditAron: `${base}ending/credits/aron.png`,
  creditKarp: `${base}ending/credits/karp.png`,
  creditDeneb: `${base}ending/credits/deneb.png`,
} as const;

export const DUNGEON10_BOSS_NAME = "굶주린 역사 포식자";

/** Source pixel size and alpha bounding box (inclusive) of a character PNG. */
export type SpriteSourceBounds = {
  width: number;
  height: number;
  /** [left, top, right, bottom] inclusive, alpha >= 32. */
  alphaBox: readonly [number, number, number, number];
};

export type FinalMapCharacterId = "theo" | "luna" | "karp" | "aron" | "deneb" | "boss";

export const FINAL_MAP_SOURCE_BOUNDS: Readonly<Record<
  "theo" | "luna" | "karp" | "aron" | "deneb" | "bossStanding" | "bossCharging",
  SpriteSourceBounds
>> = {
  theo: { width: 1231, height: 1278, alphaBox: [260, 34, 1003, 1244] },
  luna: { width: 1024, height: 1536, alphaBox: [9, 221, 1015, 1280] },
  karp: { width: 1374, height: 1145, alphaBox: [49, 84, 1363, 1083] },
  aron: { width: 1086, height: 1448, alphaBox: [60, 157, 998, 1392] },
  deneb: { width: 400, height: 700, alphaBox: [1, 38, 397, 681] },
  bossStanding: { width: 1254, height: 1254, alphaBox: [7, 31, 1248, 1248] },
  bossCharging: { width: 1254, height: 1254, alphaBox: [6, 2, 1253, 1253] },
};

/** Mouth (beam origin) of the charging devourer, in source pixels (y down). */
export const BOSS_CHARGING_MOUTH_PX = { x: 384, y: 594 } as const;

/** deneb-guard-spritesheet.png: 1920x720, 6 columns x 4 rows of 320x180 frames. */
export const DENEB_GUARD_SHEET = {
  width: 1920,
  height: 720,
  frameWidth: 320,
  frameHeight: 180,
  columns: 6,
  rows: 4,
  frameCount: 24,
  fps: 8,
  sha256: "1c7f6eaf5f28071f41907583e14f27f89a24e5182644655d981ff11604389fe6",
  /**
   * The source sheet carries a 1px column of the neighbouring frame's beam at
   * x=0 of frames 1, 4, 7, 10 and 13. Every frame is sampled from x=1, so no
   * pixel of a neighbouring frame can ever be shown.
   */
  leftInsetPx: 1,
  /** Beam entry point at the right edge of every frame (frame pixels, y down). */
  beamStartPx: { x: 320, y: 89 },
  /** Centre of the cyan barrier (median of its pixels, frame pixels, y down). */
  barrierPx: { x: 147, y: 90 },
} as const;

/** Index → [column, row] in left→right, top→bottom order. */
export function getGuardFrameCell(index: number): readonly [number, number] {
  const clamped = Math.max(0, Math.min(DENEB_GUARD_SHEET.frameCount - 1, Math.floor(index)));
  return [clamped % DENEB_GUARD_SHEET.columns, Math.floor(clamped / DENEB_GUARD_SHEET.columns)];
}

/** Frame shown at `elapsedMs`, or null once the single playthrough is over. */
export function getGuardFrameAt(elapsedMs: number): number | null {
  if (elapsedMs < 0) return 0;
  const index = Math.floor((elapsedMs / 1000) * DENEB_GUARD_SHEET.fps);
  return index >= DENEB_GUARD_SHEET.frameCount ? null : index;
}

export const DENEB_GUARD_DURATION_MS = (DENEB_GUARD_SHEET.frameCount / DENEB_GUARD_SHEET.fps) * 1000;

export type Dungeon10SupportNpc = {
  id: "deneb" | "karp" | "aron";
  name: string;
  subject: string;
  imageUrl: string;
};

/** Data-driven help candidates; the boss screen picks uniformly from this list. */
export const DUNGEON10_SUPPORT_NPCS: readonly Dungeon10SupportNpc[] = [
  { id: "deneb", name: "데네브", subject: "데네브가", imageUrl: DUNGEON10_ASSET_URLS.helpDeneb },
  { id: "karp", name: "카프", subject: "카프가", imageUrl: DUNGEON10_ASSET_URLS.helpKarp },
  { id: "aron", name: "아론", subject: "아론이", imageUrl: DUNGEON10_ASSET_URLS.helpAron },
];

export const DUNGEON10_MAX_SUPPORT_COUNT = 2;
