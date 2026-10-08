import * as THREE from "three";
import { createMonsterTextureCache } from "./three/dungeon/monsterTextureCache";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeonPerfFollowupChecks] ${message}`);
}

/** Loader stand-in: resolves synchronously, fails for URLs containing "missing". */
function createFakeLoader(log: string[]) {
  return () => ({
    load(url: string, onLoad?: (texture: THREE.Texture) => void, _onProgress?: unknown, onError?: (error: unknown) => void) {
      log.push(url);
      if (url.includes("missing")) onError?.(new Error("404"));
      else onLoad?.(new THREE.Texture({ decode: () => Promise.resolve() } as unknown as HTMLImageElement));
      return new THREE.Texture();
    },
  }) as unknown as Pick<THREE.TextureLoader, "load">;
}

export async function runDungeonPerfFollowupChecks(): Promise<void> {
  const loads: string[] = [];
  const uploads: THREE.Texture[] = [];
  const cache = createMonsterTextureCache({ initTexture: (texture) => uploads.push(texture) }, createFakeLoader(loads));

  cache.preload(["a.png", "b.png", "a.png"]);
  const a1 = await cache.load("a.png");
  const a2 = await cache.load("a.png");
  const b = await cache.load("b.png");
  await Promise.resolve();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert(a1 && a1 === a2 && b && a1 !== b, "one texture per image URL");
  assert(loads.filter((url) => url === "a.png").length === 1, "a cached URL must not be fetched again");
  assert(uploads.length === 2 && uploads.includes(a1) && uploads.includes(b), "preload uploads each floor monster texture exactly once");
  assert(a1.colorSpace === THREE.SRGBColorSpace && a1.magFilter === THREE.NearestFilter && a1.minFilter === THREE.NearestFilter && a1.generateMipmaps === false,
    "texture settings must match the previous per-room loader");

  assert((await cache.load("missing.png")) === null, "a failed load resolves to null (map cleared as before)");
  await cache.load("missing.png");
  assert(loads.filter((url) => url === "missing.png").length === 2, "a failed load is retried instead of cached");

  let disposed = 0;
  a1.addEventListener("dispose", () => { disposed += 1; });
  b.addEventListener("dispose", () => { disposed += 1; });
  cache.dispose();
  assert(disposed === 2, "dispose releases every cached texture");
  assert((await cache.load("c.png")) === null, "loads finishing after dispose are released immediately");
}
