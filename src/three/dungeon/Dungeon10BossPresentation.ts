import * as THREE from "three";
import { DungeonCameraController } from "./DungeonCameraController";
import { MonsterAnimationController } from "../monster/MonsterAnimationController";

const BOSS_PLANE_HEIGHT = 18;
const BOSS_FACE_TARGET = new THREE.Vector3(0, 7.5, -57);
const APPEAR_FADE_MS = 900;
const TILT_MS = 1500;

/**
 * Front-centre boss plane of the Dungeon10 boss room. The plane keeps the
 * texture's real aspect ratio (uniform X/Y scale) and its bottom rests on the
 * scaled boss-room floor.
 */
export class Dungeon10BossPresentation {
  private readonly root = new THREE.Group();
  private readonly geometry = new THREE.PlaneGeometry(1, 1);
  private readonly material = new THREE.MeshBasicMaterial({
    transparent: true,
    alphaTest: 0.04,
    depthWrite: true,
    side: THREE.DoubleSide,
  });
  private readonly plane = new THREE.Mesh(this.geometry, this.material);
  private readonly animation = new MonsterAnimationController(this.plane);
  private texture: THREE.Texture | null = null;
  private loading: Promise<void> | null = null;
  private loadingUrl: string | null = null;
  private frameIds = new Set<number>();
  private disposed = false;

  constructor(
    scene: THREE.Scene,
    private readonly camera: THREE.PerspectiveCamera,
    private readonly cameraController: DungeonCameraController,
  ) {
    this.root.name = "Dungeon10BossPlane";
    this.root.position.set(0, 6, -57);
    this.root.visible = false;
    this.plane.renderOrder = 80;
    this.plane.scale.set(BOSS_PLANE_HEIGHT, BOSS_PLANE_HEIGHT, 1);
    this.root.add(this.plane);
    scene.add(this.root);
  }

  /** Loads and decodes the boss texture once; safe to call repeatedly. */
  preload(imageUrl: string): Promise<void> {
    if (this.loading && this.loadingUrl === imageUrl) return this.loading;
    this.loadingUrl = imageUrl;
    this.loading = new Promise((resolve) => {
      new THREE.TextureLoader().load(imageUrl, (texture) => {
        if (this.disposed) {
          texture.dispose();
          resolve();
          return;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.magFilter = THREE.LinearFilter;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        const image = texture.image as { width?: number; height?: number } | undefined;
        const aspect = image?.width && image?.height ? image.width / image.height : 1;
        this.plane.scale.set(BOSS_PLANE_HEIGHT * aspect, BOSS_PLANE_HEIGHT, 1);
        this.texture?.dispose();
        this.texture = texture;
        this.material.map = texture;
        this.material.needsUpdate = true;
        resolve();
      }, undefined, () => resolve());
    });
    return this.loading;
  }

  private animate(duration: number, step: (eased: number) => void): Promise<void> {
    return new Promise((resolve) => {
      const startedAt = performance.now();
      let frameId = 0;
      const tick = (now: number) => {
        this.frameIds.delete(frameId);
        if (this.disposed) {
          resolve();
          return;
        }
        const progress = THREE.MathUtils.clamp((now - startedAt) / duration, 0, 1);
        step(THREE.MathUtils.smoothstep(progress, 0, 1));
        if (progress >= 1) {
          resolve();
          return;
        }
        frameId = requestAnimationFrame(tick);
        this.frameIds.add(frameId);
      };
      frameId = requestAnimationFrame(tick);
      this.frameIds.add(frameId);
    });
  }

  /** Front-centre appearance: fade in while the camera tilts up to the face. */
  async appear(imageUrl: string): Promise<void> {
    this.cameraController.cancel();
    this.camera.rotation.order = "YXZ";
    await this.preload(imageUrl);
    if (this.disposed) return;
    this.material.opacity = 0;
    this.root.visible = true;
    const fromPitch = this.camera.rotation.x;
    const direction = BOSS_FACE_TARGET.clone().sub(this.camera.position).normalize();
    const targetPitch = Math.asin(direction.y);
    await Promise.all([
      this.animate(APPEAR_FADE_MS, (eased) => { this.material.opacity = eased; }),
      this.animate(TILT_MS, (eased) => { this.camera.rotation.x = fromPitch + (targetPitch - fromPitch) * eased; }),
    ]);
    this.material.opacity = 1;
  }

  update(deltaTime: number): void {
    this.animation.update(deltaTime);
  }

  playHit(): Promise<void> {
    return this.animation.play("hit");
  }

  playAttack(onImpact: () => void): Promise<void> {
    return this.animation.play("attack", onImpact);
  }

  reset(): void {
    this.frameIds.forEach((id) => cancelAnimationFrame(id));
    this.frameIds.clear();
    this.animation.reset();
    this.root.visible = false;
  }

  dispose(): void {
    this.disposed = true;
    this.cameraController.cancel();
    this.frameIds.forEach((id) => cancelAnimationFrame(id));
    this.frameIds.clear();
    this.animation.dispose();
    this.root.removeFromParent();
    this.texture?.dispose();
    this.geometry.dispose();
    this.material.dispose();
  }
}
