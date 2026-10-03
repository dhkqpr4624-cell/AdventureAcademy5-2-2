import {
  BOSS_CHARGING_MOUTH_PX,
  DENEB_GUARD_SHEET,
  FINAL_MAP_SOURCE_BOUNDS,
  type SpriteSourceBounds,
} from "../../game/dungeon10/dungeon10Assets";

/**
 * Pure world-space layout of the Final map (orthographic side view).
 * Every character is scaled uniformly (same factor on X and Y) and its real
 * alpha foot row touches the single shared ground line.
 */
export const FINAL_MAP_GROUND_Y = 0;
export const FINAL_MAP_BASE_VIEW_HEIGHT = 10;
/** Fraction of the view height below the ground line. */
export const FINAL_MAP_GROUND_FROM_BOTTOM = 0.42;
export const FINAL_MAP_SIDE_MARGIN = 0.7;

export type FinalMapPartyId = "theo" | "luna" | "karp" | "aron" | "deneb";

/** Left → right order on the ground line. */
export const FINAL_MAP_PARTY_ORDER: readonly FinalMapPartyId[] = ["theo", "luna", "karp", "aron", "deneb"];

/** Visible (alpha-box) height in world units: the only per-character display choice. */
export const FINAL_MAP_VISIBLE_HEIGHT: Readonly<Record<FinalMapPartyId | "boss", number>> = {
  theo: 2.55,
  luna: 2.45,
  karp: 2.3,
  aron: 2.6,
  deneb: 2.55,
  boss: 4.7,
};

const PARTY_GAP = 0.06;
const BOSS_GAP = 0.75;

export type PlacedSprite = {
  /** World units per source pixel (uniform on X and Y). */
  unitsPerPixel: number;
  planeWidth: number;
  planeHeight: number;
  centerX: number;
  centerY: number;
  visibleLeft: number;
  visibleRight: number;
  visibleTop: number;
  /** World Y of the bottom of the alpha foot row (must equal the ground). */
  footY: number;
};

export function placeSprite(
  bounds: SpriteSourceBounds,
  visibleHeight: number,
  visibleLeft: number,
  groundY = FINAL_MAP_GROUND_Y,
  unitsPerPixelOverride?: number,
): PlacedSprite {
  const [left, top, right, bottom] = bounds.alphaBox;
  const unitsPerPixel = unitsPerPixelOverride ?? visibleHeight / (bottom - top + 1);
  const planeWidth = bounds.width * unitsPerPixel;
  const planeHeight = bounds.height * unitsPerPixel;
  const planeLeft = visibleLeft - left * unitsPerPixel;
  const planeTop = groundY + (bottom + 1) * unitsPerPixel;
  return {
    unitsPerPixel,
    planeWidth,
    planeHeight,
    centerX: planeLeft + planeWidth / 2,
    centerY: planeTop - planeHeight / 2,
    visibleLeft,
    visibleRight: planeLeft + (right + 1) * unitsPerPixel,
    visibleTop: planeTop - top * unitsPerPixel,
    footY: planeTop - (bottom + 1) * unitsPerPixel,
  };
}

export type FinalMapLayout = {
  party: Record<FinalMapPartyId, PlacedSprite>;
  bossStanding: PlacedSprite;
  bossCharging: PlacedSprite;
  contentLeft: number;
  contentRight: number;
  contentTop: number;
  mouth: { x: number; y: number };
  barrier: { x: number; y: number };
};

export function createFinalMapLayout(): FinalMapLayout {
  let cursor = 0;
  const party = {} as Record<FinalMapPartyId, PlacedSprite>;
  for (const id of FINAL_MAP_PARTY_ORDER) {
    const placed = placeSprite(FINAL_MAP_SOURCE_BOUNDS[id], FINAL_MAP_VISIBLE_HEIGHT[id], cursor);
    party[id] = placed;
    cursor = placed.visibleRight + PARTY_GAP;
  }
  const bossLeft = party.deneb.visibleRight + BOSS_GAP;
  const bossStanding = placeSprite(FINAL_MAP_SOURCE_BOUNDS.bossStanding, FINAL_MAP_VISIBLE_HEIGHT.boss, bossLeft);
  // Same canvas size and the same scale: keep the plane's X, re-anchor the feet.
  const chargingLeft = bossStanding.centerX - bossStanding.planeWidth / 2
    + FINAL_MAP_SOURCE_BOUNDS.bossCharging.alphaBox[0] * bossStanding.unitsPerPixel;
  const bossCharging = placeSprite(
    FINAL_MAP_SOURCE_BOUNDS.bossCharging,
    FINAL_MAP_VISIBLE_HEIGHT.boss,
    chargingLeft,
    FINAL_MAP_GROUND_Y,
    bossStanding.unitsPerPixel,
  );
  const contentLeft = party.theo.visibleLeft;
  const contentRight = Math.max(bossStanding.visibleRight, bossCharging.visibleRight);
  // Re-centre everything around x = 0.
  const shift = -(contentLeft + contentRight) / 2;
  const shiftSprite = (sprite: PlacedSprite): PlacedSprite => ({
    ...sprite,
    centerX: sprite.centerX + shift,
    visibleLeft: sprite.visibleLeft + shift,
    visibleRight: sprite.visibleRight + shift,
  });
  for (const id of FINAL_MAP_PARTY_ORDER) party[id] = shiftSprite(party[id]);
  const standing = shiftSprite(bossStanding);
  const charging = shiftSprite(bossCharging);
  const chargingPlaneLeft = charging.centerX - charging.planeWidth / 2;
  const chargingPlaneTop = charging.centerY + charging.planeHeight / 2;
  const mouth = {
    x: chargingPlaneLeft + BOSS_CHARGING_MOUTH_PX.x * charging.unitsPerPixel,
    y: chargingPlaneTop - BOSS_CHARGING_MOUTH_PX.y * charging.unitsPerPixel,
  };
  const deneb = party.deneb;
  const barrier = {
    x: deneb.visibleRight + 0.1,
    y: FINAL_MAP_GROUND_Y + (deneb.visibleTop - FINAL_MAP_GROUND_Y) * 0.68,
  };
  return {
    party,
    bossStanding: standing,
    bossCharging: charging,
    contentLeft: contentLeft + shift,
    contentRight: contentRight + shift,
    contentTop: Math.max(...FINAL_MAP_PARTY_ORDER.map((id) => party[id].visibleTop), standing.visibleTop, charging.visibleTop),
    mouth,
    barrier,
  };
}

export type GuardOverlayTransform = {
  /** World units per sheet pixel (uniform). */
  scale: number;
  rotation: number;
  /** World centre of the full 320x180 frame. */
  frameCenterX: number;
  frameCenterY: number;
};

/**
 * Similarity transform (uniform scale + rotation + translation, never a
 * non-uniform stretch) that puts the sheet's beam entry on the devourer's mouth
 * and the barrier centre in front of Deneb.
 */
export function computeGuardOverlayTransform(layout: FinalMapLayout): GuardOverlayTransform {
  const toFrame = (point: { x: number; y: number }) => ({
    x: point.x - DENEB_GUARD_SHEET.frameWidth / 2,
    y: DENEB_GUARD_SHEET.frameHeight / 2 - point.y,
  });
  const beam = toFrame(DENEB_GUARD_SHEET.beamStartPx);
  const barrier = toFrame(DENEB_GUARD_SHEET.barrierPx);
  const frameVector = { x: beam.x - barrier.x, y: beam.y - barrier.y };
  const worldVector = { x: layout.mouth.x - layout.barrier.x, y: layout.mouth.y - layout.barrier.y };
  const scale = Math.hypot(worldVector.x, worldVector.y) / Math.hypot(frameVector.x, frameVector.y);
  const rotation = Math.atan2(worldVector.y, worldVector.x) - Math.atan2(frameVector.y, frameVector.x);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotated = { x: (barrier.x * cos - barrier.y * sin) * scale, y: (barrier.x * sin + barrier.y * cos) * scale };
  return {
    scale,
    rotation,
    frameCenterX: layout.barrier.x - rotated.x,
    frameCenterY: layout.barrier.y - rotated.y,
  };
}

/** Maps a sheet-frame pixel (y down) to world space with the overlay transform. */
export function guardFramePointToWorld(transform: GuardOverlayTransform, point: { x: number; y: number }) {
  const local = { x: point.x - DENEB_GUARD_SHEET.frameWidth / 2, y: DENEB_GUARD_SHEET.frameHeight / 2 - point.y };
  const cos = Math.cos(transform.rotation);
  const sin = Math.sin(transform.rotation);
  return {
    x: transform.frameCenterX + (local.x * cos - local.y * sin) * transform.scale,
    y: transform.frameCenterY + (local.x * sin + local.y * cos) * transform.scale,
  };
}

/** View size for a viewport aspect: keeps the whole cast visible on narrow screens. */
export function computeFinalMapView(layout: FinalMapLayout, aspect: number) {
  const contentWidth = layout.contentRight - layout.contentLeft + FINAL_MAP_SIDE_MARGIN * 2;
  const safeAspect = Math.max(0.1, aspect);
  const viewHeight = Math.max(FINAL_MAP_BASE_VIEW_HEIGHT, contentWidth / safeAspect);
  const viewWidth = viewHeight * safeAspect;
  const bottom = FINAL_MAP_GROUND_Y - viewHeight * FINAL_MAP_GROUND_FROM_BOTTOM;
  return {
    viewWidth,
    viewHeight,
    left: -viewWidth / 2,
    right: viewWidth / 2,
    bottom,
    top: bottom + viewHeight,
  };
}
