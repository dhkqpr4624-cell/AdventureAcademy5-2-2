import * as THREE from "three";

/**
 * Dungeon10 boss-room environment: staged wall/ceiling cracks, the shatter
 * into fragments and the procedural space behind the room.
 *
 * Nothing replaces the original wall/ceiling textures: cracks are transparent
 * overlay meshes on top of the existing surfaces, generated from deterministic
 * crack data (stage 2 extends and adds to stage 1 geometry, it is not just a
 * higher opacity). The shatter hides the original surfaces and spawns one
 * shader-animated fragment mesh per surface material (1 draw call each).
 * Only floor-10 creates this object, so Dungeon1~9 geometry is never touched.
 */
export type Dungeon10CollapseStage = "intact" | "crack1" | "crack2" | "shattered";

type Surface = {
  mesh: THREE.Mesh;
  kind: "wall" | "ceiling";
  width: number;
  height: number;
  uvScale: THREE.Vector2;
  overlays: Partial<Record<"crack1" | "crack2", THREE.Mesh>>;
};

type FragmentBatch = {
  mesh: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>;
};

const CRACK_PIXELS_PER_UNIT = 32;
const FRAGMENT_DURATION_S = 1.9;
const SPACE_STAR_COUNT = 900;

export function stableSeed(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createSeededGenerator(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type CrackPolyline = { points: Array<readonly [number, number]>; width: 1 | 2 };
export type CrackStageData = { polylines: CrackPolyline[]; chips: Array<readonly [number, number]> };

/**
 * Deterministic crack data for one surface in normalized [0,1]² coordinates.
 * Stage 2 contains every stage-1 polyline, extended further, plus new branches
 * and origins, so the two stages differ in actual geometry.
 */
export function createCrackData(seedKey: string, aspect: number): { crack1: CrackStageData; crack2: CrackStageData } {
  const random = createSeededGenerator(stableSeed(seedKey));
  const walk = (start: readonly [number, number], heading: number, steps: number, stepLength: number) => {
    const points: Array<readonly [number, number]> = [start];
    let [x, y] = start;
    let drift = 0;
    let angle = heading;
    for (let index = 0; index < steps; index += 1) {
      // Mostly straight with jagged kinks: a slow drift plus per-step jitter.
      drift += (random() - 0.5) * 0.35;
      angle = heading + drift + (random() - 0.5) * 1.1;
      const nextX = x + Math.cos(angle) * stepLength;
      const nextY = y + Math.sin(angle) * stepLength * aspect;
      // A crack stops at the surface edge instead of running along it.
      if (nextX < 0.02 || nextX > 0.98 || nextY < 0.02 || nextY > 0.98) break;
      x = nextX;
      y = nextY;
      points.push([x, y]);
    }
    return { points, angle };
  };
  const origins = Array.from({ length: 2 }, () =>
    [0.25 + random() * 0.5, 0.25 + random() * 0.5] as const,
  );
  const stage1: CrackPolyline[] = [];
  const stage2: CrackPolyline[] = [];
  for (const origin of origins) {
    const arms = 3;
    for (let arm = 0; arm < arms; arm += 1) {
      const heading = (arm / arms) * Math.PI * 2 + random() * 0.8;
      const short = walk(origin, heading, 6 + Math.floor(random() * 4), 0.018);
      stage1.push({ points: short.points, width: 1 });
      const extended = walk(short.points[short.points.length - 1], short.angle, 10 + Math.floor(random() * 8), 0.024);
      const fullPoints = [...short.points, ...extended.points.slice(1)];
      stage2.push({ points: fullPoints, width: 2 });
      // Side branches only exist in stage 2.
      for (let branch = 0; branch < 2; branch += 1) {
        const from = fullPoints[Math.min(fullPoints.length - 1, 1 + Math.floor(random() * Math.max(1, fullPoints.length - 1)))]!;
        const side = walk(from, heading + (random() < 0.5 ? -1 : 1) * (0.7 + random() * 0.6), 6 + Math.floor(random() * 6), 0.018);
        stage2.push({ points: side.points, width: 1 });
      }
    }
  }
  // A new origin that only appears in stage 2.
  const lateOrigin = [0.1 + random() * 0.8, 0.1 + random() * 0.8] as const;
  for (let arm = 0; arm < 2; arm += 1) {
    stage2.push({ points: walk(lateOrigin, random() * Math.PI * 2, 8 + Math.floor(random() * 6), 0.02).points, width: 1 });
  }
  const chips = Array.from({ length: 6 }, () => {
    const line = stage2[Math.floor(random() * stage2.length)];
    return line.points[Math.floor(random() * line.points.length)];
  });
  return { crack1: { polylines: stage1, chips: [] }, crack2: { polylines: stage2, chips } };
}

function drawCrackTexture(data: CrackStageData, width: number, height: number): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(8, Math.round(width));
  canvas.height = Math.max(8, Math.round(height));
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.imageSmoothingEnabled = false;
  const plot = (x: number, y: number, size: number, color: string) => {
    context.fillStyle = color;
    context.fillRect(Math.round(x), Math.round(y), size, size);
  };
  const line = (from: readonly [number, number], to: readonly [number, number], size: number) => {
    const x0 = from[0] * (canvas.width - 1);
    const y0 = (1 - from[1]) * (canvas.height - 1);
    const x1 = to[0] * (canvas.width - 1);
    const y1 = (1 - to[1]) * (canvas.height - 1);
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    for (let step = 0; step <= steps; step += 1) {
      const x = x0 + ((x1 - x0) * step) / steps;
      const y = y0 + ((y1 - y0) * step) / steps;
      plot(x + 1, y + 1, size, "rgba(255, 236, 214, 0.22)");
      plot(x, y, size, "rgba(8, 6, 10, 0.92)");
    }
  };
  for (const polyline of data.polylines) {
    for (let index = 1; index < polyline.points.length; index += 1) {
      line(polyline.points[index - 1], polyline.points[index], polyline.width);
    }
  }
  for (const [x, y] of data.chips) {
    plot(x * (canvas.width - 1) - 1, (1 - y) * (canvas.height - 1) - 1, 3, "rgba(4, 3, 6, 0.95)");
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  return texture;
}

const FRAGMENT_VERTEX = /* glsl */ `
  attribute vec3 aCenter;
  attribute vec3 aVelocity;
  attribute vec3 aAxis;
  attribute float aSpin;
  attribute float aDelay;
  uniform float uTime;
  varying vec2 vUv;
  varying float vLife;
  vec3 rotateAround(vec3 v, vec3 axis, float angle) {
    float c = cos(angle);
    float s = sin(angle);
    return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
  }
  void main() {
    float t = max(0.0, uTime - aDelay);
    vec3 offset = rotateAround(position, normalize(aAxis), aSpin * t);
    vec3 world = aCenter + aVelocity * t + vec3(0.0, -2.2, 0.0) * t * t * 0.5 + offset;
    vUv = uv;
    vLife = t;
    gl_Position = projectionMatrix * viewMatrix * vec4(world, 1.0);
  }
`;

const FRAGMENT_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform vec3 uTint;
  uniform float uDuration;
  varying vec2 vUv;
  varying float vLife;
  void main() {
    vec4 color = texture2D(map, vUv);
    float alpha = 1.0 - smoothstep(uDuration * 0.55, uDuration, vLife);
    if (alpha <= 0.01) discard;
    gl_FragColor = vec4(color.rgb * uTint, alpha);
    #include <colorspace_fragment>
  }
`;

const SPACE_VERTEX = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SPACE_FRAGMENT = /* glsl */ `
  uniform vec3 uSeed;
  varying vec3 vDirection;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i), n100 = hash(i + vec3(1,0,0)), n010 = hash(i + vec3(0,1,0)), n110 = hash(i + vec3(1,1,0));
    float n001 = hash(i + vec3(0,0,1)), n101 = hash(i + vec3(1,0,1)), n011 = hash(i + vec3(0,1,1)), n111 = hash(i + vec3(1,1,1));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int octave = 0; octave < 4; octave++) {
      value += noise(p) * amplitude;
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }
  void main() {
    vec3 d = normalize(vDirection);
    vec3 deep = vec3(0.008, 0.01, 0.03);
    vec3 navy = vec3(0.025, 0.035, 0.10);
    vec3 color = mix(deep, navy, smoothstep(-0.6, 0.8, d.y));
    float cloud = fbm(d * 2.6 + uSeed);
    float detail = fbm(d * 6.0 + uSeed.zxy);
    float nebula = smoothstep(0.48, 0.82, cloud) * (0.55 + 0.45 * detail);
    color += vec3(0.11, 0.05, 0.17) * nebula * 0.55;
    color += vec3(0.03, 0.06, 0.14) * smoothstep(0.55, 0.9, detail) * 0.5;
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const STAR_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aBrightness;
  uniform float uPixelRatio;
  varying float vBrightness;
  void main() {
    vBrightness = aBrightness;
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const STAR_FRAGMENT = /* glsl */ `
  varying float vBrightness;
  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float falloff = 1.0 - smoothstep(0.15, 0.5, length(p));
    if (falloff <= 0.0) discard;
    gl_FragColor = vec4(vec3(0.88, 0.92, 1.0) * vBrightness, falloff * vBrightness);
  }
`;

/** Deterministic, Dungeon10-only space backdrop. Hidden until the room shatters. */
class DungeonSpaceBackground {
  readonly root = new THREE.Group();
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];

  constructor(center: THREE.Vector3, seed: string, pixelRatio: number) {
    this.root.name = "Dungeon10SpaceBackground";
    this.root.position.copy(center);
    this.root.visible = false;
    const random = createSeededGenerator(stableSeed(`${seed}:space`));

    const sphereGeometry = new THREE.SphereGeometry(84, 48, 24);
    const sphereMaterial = new THREE.ShaderMaterial({
      vertexShader: SPACE_VERTEX,
      fragmentShader: SPACE_FRAGMENT,
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: { uSeed: { value: new THREE.Vector3(random() * 40, random() * 40, random() * 40) } },
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.renderOrder = -20;
    this.root.add(sphere);

    const positions = new Float32Array(SPACE_STAR_COUNT * 3);
    const sizes = new Float32Array(SPACE_STAR_COUNT);
    const brightness = new Float32Array(SPACE_STAR_COUNT);
    for (let index = 0; index < SPACE_STAR_COUNT; index += 1) {
      const u = random() * 2 - 1;
      const theta = random() * Math.PI * 2;
      const radial = Math.sqrt(1 - u * u);
      const radius = 78;
      positions.set([Math.cos(theta) * radial * radius, u * radius, Math.sin(theta) * radial * radius], index * 3);
      const big = random();
      sizes[index] = big > 0.97 ? 3.4 : big > 0.85 ? 2.3 : 1.4;
      brightness[index] = 0.35 + random() * 0.65;
    }
    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    starGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    starGeometry.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    const starMaterial = new THREE.ShaderMaterial({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      transparent: true,
      depthWrite: false,
      uniforms: { uPixelRatio: { value: pixelRatio } },
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    stars.renderOrder = -19;
    this.root.add(stars);
    this.geometries.push(sphereGeometry, starGeometry);
    this.materials.push(sphereMaterial, starMaterial);
  }

  dispose() {
    this.root.removeFromParent();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
  }
}

export class Dungeon10BossRoomCollapse {
  private readonly surfaces: Surface[] = [];
  private readonly overlayTextures: THREE.Texture[] = [];
  private readonly overlayGeometries: THREE.BufferGeometry[] = [];
  private readonly overlayMaterials: THREE.Material[] = [];
  private readonly space: DungeonSpaceBackground;
  private fragments: FragmentBatch[] = [];
  private fragmentStartedAt: number | null = null;
  private shake: { startedAt: number; duration: number; amplitude: number; base: THREE.Vector3; resolve: () => void } | null = null;
  private stage: Dungeon10CollapseStage = "intact";
  private disposed = false;

  constructor(
    private readonly scene: THREE.Scene,
    private readonly camera: THREE.Camera,
    private readonly roomGroup: THREE.Group | null,
    private readonly seed: string,
    pixelRatio: number,
  ) {
    const center = new THREE.Vector3();
    if (roomGroup) {
      roomGroup.updateMatrixWorld(true);
      roomGroup.getWorldPosition(center);
    }
    this.space = new DungeonSpaceBackground(center, seed, pixelRatio);
    scene.add(this.space.root);
    if (roomGroup) this.collectSurfaces(roomGroup);
  }

  get currentStage(): Dungeon10CollapseStage {
    return this.stage;
  }

  get surfaceCount(): number {
    return this.surfaces.length;
  }

  get spaceVisible(): boolean {
    return this.space.root.visible;
  }

  private collectSurfaces(group: THREE.Group) {
    group.children.forEach((child, index) => {
      if (!(child instanceof THREE.Mesh) || !(child.geometry instanceof THREE.PlaneGeometry)) return;
      const isHorizontal = Math.abs(Math.abs(child.rotation.x) - Math.PI / 2) < 0.01;
      if (isHorizontal && child.position.y < 0) return; // the floor stays.
      const { width, height } = child.geometry.parameters;
      const uv = child.geometry.getAttribute("uv");
      let maxU = 0;
      let maxV = 0;
      for (let vertex = 0; vertex < uv.count; vertex += 1) {
        maxU = Math.max(maxU, uv.getX(vertex));
        maxV = Math.max(maxV, uv.getY(vertex));
      }
      const surface: Surface = {
        mesh: child,
        kind: isHorizontal ? "ceiling" : "wall",
        width,
        height,
        uvScale: new THREE.Vector2(maxU || 1, maxV || 1),
        overlays: {},
      };
      const crackData = createCrackData(`${this.seed}:surface-${index}`, width / height);
      (["crack1", "crack2"] as const).forEach((stage) => {
        const texture = drawCrackTexture(crackData[stage], width * CRACK_PIXELS_PER_UNIT, height * CRACK_PIXELS_PER_UNIT);
        if (!texture) return;
        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
          side: THREE.FrontSide,
        });
        const overlay = new THREE.Mesh(geometry, material);
        overlay.name = `Dungeon10Crack:${stage}:${index}`;
        overlay.position.copy(child.position);
        overlay.rotation.copy(child.rotation);
        overlay.translateZ(0.012);
        overlay.visible = false;
        overlay.renderOrder = 2;
        group.add(overlay);
        surface.overlays[stage] = overlay;
        this.overlayTextures.push(texture);
        this.overlayGeometries.push(geometry);
        this.overlayMaterials.push(material);
      });
      this.surfaces.push(surface);
    });
  }

  /** Applies a crack stage; stage 2 swaps to its own, larger crack data. */
  setStage(stage: "intact" | "crack1" | "crack2"): void {
    if (this.disposed || this.stage === "shattered") return;
    this.stage = stage;
    for (const surface of this.surfaces) {
      if (surface.overlays.crack1) surface.overlays.crack1.visible = stage === "crack1";
      if (surface.overlays.crack2) surface.overlays.crack2.visible = stage === "crack2";
    }
  }

  /** Shakes only the Three.js dungeon camera (UI DOM never moves). */
  shakeCamera(durationMs: number, amplitude = 0.075): Promise<void> {
    this.stopShake();
    return new Promise((resolve) => {
      this.shake = { startedAt: performance.now(), duration: durationMs, amplitude, base: this.camera.position.clone(), resolve };
    });
  }

  private stopShake() {
    if (!this.shake) return;
    this.camera.position.copy(this.shake.base);
    const resolve = this.shake.resolve;
    this.shake = null;
    resolve();
  }

  /** Hides walls/ceiling, reveals space and spawns the fragment burst. */
  shatter(): void {
    if (this.disposed || this.stage === "shattered") return;
    this.stage = "shattered";
    this.space.root.visible = true;
    const random = createSeededGenerator(stableSeed(`${this.seed}:fragments`));
    const center = new THREE.Vector3();
    this.roomGroup?.getWorldPosition(center);
    const batches = new Map<THREE.Material, {
      positions: number[]; uvs: number[]; centers: number[]; velocities: number[]; axes: number[]; spins: number[]; delays: number[];
    }>();
    const corner = new THREE.Vector3();
    for (const surface of this.surfaces) {
      surface.mesh.visible = false;
      Object.values(surface.overlays).forEach((overlay) => { if (overlay) overlay.visible = false; });
      const material = surface.mesh.material as THREE.Material;
      const batch = batches.get(material) ?? { positions: [], uvs: [], centers: [], velocities: [], axes: [], spins: [], delays: [] };
      batches.set(material, batch);
      surface.mesh.updateMatrixWorld(true);
      const columns = Math.max(2, Math.round(surface.width * 0.85));
      const rows = Math.max(2, Math.round(surface.height * 0.85));
      const grid: THREE.Vector2[][] = [];
      for (let row = 0; row <= rows; row += 1) {
        grid.push([]);
        for (let column = 0; column <= columns; column += 1) {
          const edge = row === 0 || row === rows || column === 0 || column === columns;
          const jitterX = edge ? 0 : (random() - 0.5) * 0.55;
          const jitterY = edge ? 0 : (random() - 0.5) * 0.55;
          grid[row].push(new THREE.Vector2(
            ((column + jitterX) / columns - 0.5) * surface.width,
            ((row + jitterY) / rows - 0.5) * surface.height,
          ));
        }
      }
      const normal = new THREE.Vector3(0, 0, 1).transformDirection(surface.mesh.matrixWorld);
      const outward = normal.clone().negate(); // surfaces face the room interior.
      for (let row = 0; row < rows; row += 1) {
        for (let column = 0; column < columns; column += 1) {
          const quad = [grid[row][column], grid[row][column + 1], grid[row + 1][column + 1], grid[row + 1][column]];
          const worldCorners = quad.map((point) => corner.set(point.x, point.y, 0).applyMatrix4(surface.mesh.matrixWorld).clone());
          const fragmentCenter = worldCorners.reduce((sum, value) => sum.add(value), new THREE.Vector3()).multiplyScalar(0.25);
          const away = fragmentCenter.clone().sub(center).normalize();
          const velocity = outward.clone().multiplyScalar(2.4 + random() * 3.2)
            .add(away.multiplyScalar(1.2 + random() * 1.6))
            .add(new THREE.Vector3((random() - 0.5) * 2, (random() - 0.2) * 2, (random() - 0.5) * 2));
          const axis = new THREE.Vector3(random() - 0.5, random() - 0.5, random() - 0.5).normalize();
          const spin = (random() - 0.5) * 7;
          const delay = random() * 0.22;
          const uvOf = (point: THREE.Vector2) => [
            (point.x / surface.width + 0.5) * surface.uvScale.x,
            (point.y / surface.height + 0.5) * surface.uvScale.y,
          ];
          for (const index of [0, 1, 2, 0, 2, 3]) {
            const offset = worldCorners[index].clone().sub(fragmentCenter);
            batch.positions.push(offset.x, offset.y, offset.z);
            batch.uvs.push(...uvOf(quad[index]));
            batch.centers.push(fragmentCenter.x, fragmentCenter.y, fragmentCenter.z);
            batch.velocities.push(velocity.x, velocity.y, velocity.z);
            batch.axes.push(axis.x, axis.y, axis.z);
            batch.spins.push(spin);
            batch.delays.push(delay);
          }
        }
      }
    }
    for (const [sourceMaterial, batch] of batches) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(batch.positions, 3));
      geometry.setAttribute("uv", new THREE.Float32BufferAttribute(batch.uvs, 2));
      geometry.setAttribute("aCenter", new THREE.Float32BufferAttribute(batch.centers, 3));
      geometry.setAttribute("aVelocity", new THREE.Float32BufferAttribute(batch.velocities, 3));
      geometry.setAttribute("aAxis", new THREE.Float32BufferAttribute(batch.axes, 3));
      geometry.setAttribute("aSpin", new THREE.Float32BufferAttribute(batch.spins, 1));
      geometry.setAttribute("aDelay", new THREE.Float32BufferAttribute(batch.delays, 1));
      const basic = sourceMaterial as THREE.MeshBasicMaterial;
      const material = new THREE.ShaderMaterial({
        vertexShader: FRAGMENT_VERTEX,
        fragmentShader: FRAGMENT_FRAGMENT,
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          map: { value: basic.map ?? null },
          uTint: { value: basic.color ? basic.color.clone() : new THREE.Color(1, 1, 1) },
          uTime: { value: 0 },
          uDuration: { value: FRAGMENT_DURATION_S },
        },
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.name = "Dungeon10Fragments";
      mesh.frustumCulled = false;
      mesh.renderOrder = 5;
      this.scene.add(mesh);
      this.fragments.push({ mesh });
    }
    this.fragmentStartedAt = performance.now();
  }

  get fragmentBatchCount(): number {
    return this.fragments.length;
  }

  private clearFragments() {
    this.fragments.forEach(({ mesh }) => {
      mesh.removeFromParent();
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.fragments = [];
    this.fragmentStartedAt = null;
  }

  /** Timestamp driven, so the order stays correct at low frame rates. */
  update(now: number): void {
    if (this.disposed) return;
    if (this.shake) {
      const elapsed = now - this.shake.startedAt;
      if (elapsed >= this.shake.duration) {
        this.stopShake();
      } else {
        const envelope = Math.min(1, elapsed / 120) * Math.min(1, (this.shake.duration - elapsed) / 260);
        const time = elapsed / 1000;
        const amplitude = this.shake.amplitude * envelope;
        this.camera.position.set(
          this.shake.base.x + Math.sin(time * 61.0) * amplitude + Math.sin(time * 23.7) * amplitude * 0.5,
          this.shake.base.y + Math.sin(time * 47.3 + 1.3) * amplitude * 0.8,
          this.shake.base.z + Math.sin(time * 29.1 + 0.4) * amplitude * 0.3,
        );
      }
    }
    if (this.fragmentStartedAt !== null) {
      const seconds = (now - this.fragmentStartedAt) / 1000;
      if (seconds >= FRAGMENT_DURATION_S + 0.3) {
        this.clearFragments();
      } else {
        this.fragments.forEach(({ mesh }) => { mesh.material.uniforms.uTime.value = seconds; });
      }
    }
  }

  /** Back to the intact room (used when a defeated run restarts). */
  reset(): void {
    this.stopShake();
    this.clearFragments();
    this.stage = "intact";
    this.space.root.visible = false;
    for (const surface of this.surfaces) {
      surface.mesh.visible = true;
      Object.values(surface.overlays).forEach((overlay) => { if (overlay) overlay.visible = false; });
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.stopShake();
    this.disposed = true;
    this.clearFragments();
    for (const surface of this.surfaces) {
      surface.mesh.visible = true;
      Object.values(surface.overlays).forEach((overlay) => overlay?.removeFromParent());
    }
    this.overlayTextures.forEach((texture) => texture.dispose());
    this.overlayGeometries.forEach((geometry) => geometry.dispose());
    this.overlayMaterials.forEach((material) => material.dispose());
    this.space.dispose();
  }
}
