import type { FloorId } from "../../../game/floor/floorTypes";

export type CrackedSurface = "floor" | "wall" | "ceiling";

export function supportsCrackedTiles(floorId: FloorId): boolean {
  return floorId === "floor-8" || floorId === "floor-9";
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function selectCrackedTileSlot(
  visualSeed: string,
  roomId: string,
  surface: CrackedSurface,
  slotCount: number,
): number {
  if (slotCount <= 0) return -1;
  return stableHash(`${visualSeed}:${roomId}:${surface}`) % slotCount;
}
