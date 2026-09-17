import * as THREE from "three";
import wallUrl from "../../../assets/dungeon/textures/wall.png";
import floorUrl from "../../../assets/dungeon/textures/floor.png";
import ceilingUrl from "../../../assets/dungeon/textures/ceiling.png";
import crackedWallUrl from "../../../assets/dungeon/textures/cracked-wall.png";
import crackedFloorUrl from "../../../assets/dungeon/textures/cracked-floor.png";
import crackedCeilingUrl from "../../../assets/dungeon/textures/cracked-ceiling.png";
import type { FloorId } from "../../../game/floor/floorTypes";
import { supportsCrackedTiles } from "./crackedTileResolver";
import type { DungeonTextureSet } from "./dungeonVisualTypes";

function configure(texture: THREE.Texture): THREE.Texture {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

function load(loader: THREE.TextureLoader, url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    loader.load(url, (texture) => resolve(configure(texture)), undefined, reject);
  });
}

export async function loadDungeonTextureSet(floorId?: FloorId): Promise<DungeonTextureSet> {
  const loader = new THREE.TextureLoader();
  const [wall, floor, ceiling] = await Promise.all([
    load(loader, wallUrl),
    load(loader, floorUrl),
    load(loader, ceilingUrl),
  ]);
  if (!floorId || !supportsCrackedTiles(floorId)) return { wall, floor, ceiling };
  const [crackedWall, crackedFloor, crackedCeiling] = await Promise.all([
    load(loader, crackedWallUrl),
    load(loader, crackedFloorUrl),
    load(loader, crackedCeilingUrl),
  ]);
  return { wall, floor, ceiling, crackedWall, crackedFloor, crackedCeiling };
}

export function disposeDungeonTextureSet(textures: DungeonTextureSet): void {
  Object.values(textures).forEach((texture) => texture?.dispose());
}
