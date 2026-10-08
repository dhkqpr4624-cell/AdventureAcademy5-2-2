import * as THREE from "three";

/**
 * Per-dungeon cache of monster billboard textures.
 *
 * Without it every combat-room entry created a new texture from the PNG, and
 * the first frame that drew it decoded and uploaded a 1–1.5 megapixel image
 * inside the combat camera transition. The cache keeps one texture per image
 * URL for the lifetime of the dungeon view, and `preload` decodes the floor's
 * monster images off-frame and uploads them before any room is entered.
 * Texture settings are exactly the ones the dungeon used before.
 */
export type MonsterTextureCache = {
  load(url: string): Promise<THREE.Texture | null>;
  preload(urls: readonly string[]): void;
  dispose(): void;
};

type TextureUploader = { initTexture(texture: THREE.Texture): void };

export function createMonsterTextureCache(
  uploader: TextureUploader,
  createLoader: () => Pick<THREE.TextureLoader, "load"> = () => new THREE.TextureLoader(),
): MonsterTextureCache {
  const entries = new Map<string, Promise<THREE.Texture | null>>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;

  const load = (url: string) => {
    const cached = entries.get(url);
    if (cached) return cached;
    let resolve!: (texture: THREE.Texture | null) => void;
    const entry = new Promise<THREE.Texture | null>((settle) => { resolve = settle; });
    // Registered before loading so an immediate failure can still remove it.
    entries.set(url, entry);
    createLoader().load(
      url,
      (texture) => {
        if (disposed) {
          texture.dispose();
          resolve(null);
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.generateMipmaps = false;
        textures.add(texture);
        resolve(texture);
      },
      undefined,
      () => {
        // A failed load is retried on the next request instead of being cached.
        if (entries.get(url) === entry) entries.delete(url);
        resolve(null);
      },
    );
    return entry;
  };

  const preload = (urls: readonly string[]) => {
    for (const url of new Set(urls)) {
      void load(url).then(async (texture) => {
        if (!texture || disposed) return;
        const image = texture.image as HTMLImageElement | undefined;
        if (image && typeof image.decode === "function") await image.decode().catch(() => undefined);
        if (!disposed && textures.has(texture)) uploaderInit(texture);
      });
    }
  };

  const uploaderInit = (texture: THREE.Texture) => {
    try {
      uploader.initTexture(texture);
    } catch {
      // Upload simply happens on first draw, as before.
    }
  };

  return {
    load,
    preload,
    dispose() {
      disposed = true;
      textures.forEach((texture) => texture.dispose());
      textures.clear();
      entries.clear();
    },
  };
}
