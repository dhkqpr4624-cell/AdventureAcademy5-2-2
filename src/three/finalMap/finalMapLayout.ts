import {
  BOSS_CHARGING_MOUTH_PX,
  DENEB_GUARD_SHEET,
  FINAL_MAP_BODY_COLUMNS,
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

/**
 * Visible (alpha-box) height in world units before the party scale. The boss
 * value is its final size; the party values are multiplied by
 * FINAL_MAP_PARTY_SCALE.
 */
export const FINAL_MAP_VISIBLE_HEIGHT: Readonly<Record<FinalMapPartyId | "boss", number>> = {
  theo: 2.55,
  luna: 2.45,
  karp: 2.3,
  aron: 2.6,
  deneb: 2.55,
  boss: 4.7,
};

/** Party display scale relative to the first Final map version (18% smaller). */
export const FINAL_MAP_PARTY_SCALE = 0.82;

/** View width at the base 16:9 composition (camera centred on x = 0). */
export const FINAL_MAP_BASE_VIEW_WIDTH = FINAL_MAP_BASE_VIEW_HEIGHT * (16 / 9);

/** Horizontal share of the 16:9 view the packed party occupies (left edge → right edge). */
export const FINAL_MAP_PARTY_VIEW_RANGE = [0.08, 0.46] as const;

/**
 * World X of the devourer's visible left edge. It equals the value of the first
 * Final map version, so the boss keeps its right-hand position and size.
 */
export const FINAL_MAP_BOSS_VISIBLE_LEFT = 3.321974573718448;

/** Minimum clear space between neighbouring body columns (world units). */
const MIN_BODY_GAP = 0.08;

/**
 * Clear space between Deneb's visible right edge and the left-most pixel of
 * the barrier arc (world units), so the shield stands in front of her body
 * without touching it.
 */
export const FINAL_MAP_BARRIER_CLEARANCE = 0.12;

/** Barrier centre height as a fraction of Deneb's visible height (raised if the shield would cut the ground). */
const BARRIER_HEIGHT_RATIO = 0.6;

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
  // 1. Scale the party (uniform per character) and measure body columns.
  const scaled = FINAL_MAP_PARTY_ORDER.map((id) => {
    const bounds = FINAL_MAP_SOURCE_BOUNDS[id];
    const [left, top, right, bottom] = bounds.alphaBox;
    const unitsPerPixel = (FINAL_MAP_VISIBLE_HEIGHT[id] * FINAL_MAP_PARTY_SCALE) / (bottom - top + 1);
    const [bodyLeft, bodyRight] = FINAL_MAP_BODY_COLUMNS[id];
    return {
      id,
      unitsPerPixel,
      // Distances measured from the visible left edge.
      bodyStart: (bodyLeft - left) * unitsPerPixel,
      bodyEnd: (bodyRight + 1 - left) * unitsPerPixel,
      visibleWidth: (right + 1 - left) * unitsPerPixel,
    };
  });
  // 2. Pack bodies left → right with one equal gap so the party fills the target range.
  const viewLeft = -FINAL_MAP_BASE_VIEW_WIDTH / 2;
  const partyLeft = viewLeft + FINAL_MAP_BASE_VIEW_WIDTH * FINAL_MAP_PARTY_VIEW_RANGE[0];
  const partyRight = viewLeft + FINAL_MAP_BASE_VIEW_WIDTH * FINAL_MAP_PARTY_VIEW_RANGE[1];
  const first = scaled[0]!;
  const last = scaled[scaled.length - 1]!;
  const bodiesWidth = scaled.reduce((sum, entry) => sum + (entry.bodyEnd - entry.bodyStart), 0);
  const fixedWidth = first.bodyStart + bodiesWidth + (last.visibleWidth - last.bodyEnd);
  const bodyGap = Math.max(MIN_BODY_GAP, (partyRight - partyLeft - fixedWidth) / (scaled.length - 1));
  const party = {} as Record<FinalMapPartyId, PlacedSprite>;
  let bodyCursor = partyLeft + first.bodyStart;
  for (const entry of scaled) {
    const visibleLeft = bodyCursor - entry.bodyStart;
    party[entry.id] = placeSprite(FINAL_MAP_SOURCE_BOUNDS[entry.id], 0, visibleLeft, FINAL_MAP_GROUND_Y, entry.unitsPerPixel);
    bodyCursor = visibleLeft + entry.bodyEnd + bodyGap;
  }
  // 3. The devourer keeps its size and position.
  const bossStanding = placeSprite(FINAL_MAP_SOURCE_BOUNDS.bossStanding, FINAL_MAP_VISIBLE_HEIGHT.boss, FINAL_MAP_BOSS_VISIBLE_LEFT);
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
  // 4. Beam-source anchor: the charging devourer's mouth.
  const chargingPlaneLeft = bossCharging.centerX - bossCharging.planeWidth / 2;
  const chargingPlaneTop = bossCharging.centerY + bossCharging.planeHeight / 2;
  const mouth = {
    x: chargingPlaneLeft + BOSS_CHARGING_MOUTH_PX.x * bossCharging.unitsPerPixel,
    y: chargingPlaneTop - BOSS_CHARGING_MOUTH_PX.y * bossCharging.unitsPerPixel,
  };
  // 5. Barrier-impact anchor, in front of Deneb's right side. The VFX scale
  //    depends on the anchor and the anchor on the scale (the arc must clear
  //    Deneb and must not dip under the ground line), so a few fixed-point
  //    steps settle both; they converge in well under 12 iterations.
  const deneb = party.deneb;
  const denebHeight = deneb.visibleTop - FINAL_MAP_GROUND_Y;
  const arcLeftPx = DENEB_GUARD_SHEET.barrierPx.x - DENEB_GUARD_SHEET.barrierExtentPx.left;
  const shieldHalfHeightPx = DENEB_GUARD_SHEET.barrierPx.y - DENEB_GUARD_SHEET.barrierExtentPx.top;
  const barrier = { x: deneb.visibleRight + FINAL_MAP_BARRIER_CLEARANCE, y: FINAL_MAP_GROUND_Y + denebHeight * BARRIER_HEIGHT_RATIO };
  for (let iteration = 0; iteration < 12; iteration += 1) {
    const { scale } = solveSimilarity(mouth, barrier);
    barrier.x = deneb.visibleRight + FINAL_MAP_BARRIER_CLEARANCE + arcLeftPx * scale;
    barrier.y = Math.max(FINAL_MAP_GROUND_Y + denebHeight * BARRIER_HEIGHT_RATIO, FINAL_MAP_GROUND_Y + shieldHalfHeightPx * scale + 0.02);
  }
  const partyTop = Math.max(...FINAL_MAP_PARTY_ORDER.map((id) => party[id].visibleTop));
  return {
    party,
    bossStanding,
    bossCharging,
    contentLeft: party.theo.visibleLeft,
    contentRight: Math.max(bossStanding.visibleRight, bossCharging.visibleRight),
    contentTop: Math.max(partyTop, bossStanding.visibleTop, bossCharging.visibleTop),
    mouth,
    barrier,
  };
}

/** Uniform scale and rotation that map the sheet's barrier→beam vector onto barrier→mouth. */
function solveSimilarity(mouth: { x: number; y: number }, barrier: { x: number; y: number }) {
  const beam = { x: DENEB_GUARD_SHEET.beamStartPx.x - DENEB_GUARD_SHEET.frameWidth / 2, y: DENEB_GUARD_SHEET.frameHeight / 2 - DENEB_GUARD_SHEET.beamStartPx.y };
  const shield = { x: DENEB_GUARD_SHEET.barrierPx.x - DENEB_GUARD_SHEET.frameWidth / 2, y: DENEB_GUARD_SHEET.frameHeight / 2 - DENEB_GUARD_SHEET.barrierPx.y };
  const frameVector = { x: beam.x - shield.x, y: beam.y - shield.y };
  const worldVector = { x: mouth.x - barrier.x, y: mouth.y - barrier.y };
  return {
    shield,
    scale: Math.hypot(worldVector.x, worldVector.y) / Math.hypot(frameVector.x, frameVector.y),
    rotation: Math.atan2(worldVector.y, worldVector.x) - Math.atan2(frameVector.y, frameVector.x),
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
  const { shield, scale, rotation } = solveSimilarity(layout.mouth, layout.barrier);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const rotated = { x: (shield.x * cos - shield.y * sin) * scale, y: (shield.x * sin + shield.y * cos) * scale };
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

/**
 * View for a viewport aspect. The camera stays centred on x = 0, so at 16:9
 * every resolution shows the same composition (party at 8%~46%, boss on the
 * right); narrower screens grow the view until the whole cast fits.
 */
export function computeFinalMapView(layout: FinalMapLayout, aspect: number) {
  const halfContent = Math.max(Math.abs(layout.contentLeft), Math.abs(layout.contentRight)) + FINAL_MAP_SIDE_MARGIN;
  const safeAspect = Math.max(0.1, aspect);
  const viewHeight = Math.max(FINAL_MAP_BASE_VIEW_HEIGHT, (halfContent * 2) / safeAspect);
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
