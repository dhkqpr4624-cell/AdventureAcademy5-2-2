import * as THREE from "three";
import {
  DENEB_GUARD_SHEET,
  DUNGEON10_ASSET_URLS,
  getGuardFrameAt,
  getGuardFrameCell,
} from "../../game/dungeon10/dungeon10Assets";
import {
  FINAL_MAP_GROUND_Y,
  FINAL_MAP_PARTY_ORDER,
  computeFinalMapView,
  computeGuardOverlayTransform,
  createFinalMapLayout,
  type FinalMapLayout,
  type FinalMapPartyId,
  type GuardOverlayTransform,
  type PlacedSprite,
} from "./finalMapLayout";

/**
 * Final map: a procedural white-hole side view rendered with an orthographic
 * camera. No background/ground PNG is used. Layers (back → front):
 *   0 white-hole background · 1 glow particles · 2 reflections ·
 *   3 water surface · 4 ground line / contact shadows · 6+ characters · 20 VFX
 * The DOM UI (portrait, Dialogue, buttons) is above the canvas.
 */

const RENDER_ORDER = { background: 0, particles: 1, reflection: 2, surface: 3, ground: 4, shadow: 5, character: 6, vfx: 20 } as const;
const PARTICLE_COUNT = 64;
const REFLECTION_OPACITY = 0.32;
const REFLECTION_FADE_UNITS = 1.9;
const BOSS_REFLECTION_SHAKE_RATIO = 0.6;
const GUARD_SHAKE_PIXELS = 3;

const BACKGROUND_VERTEX = /* glsl */ `
  varying vec2 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xy;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

// Colours are authored directly in display space (no colour-space conversion).
const BACKGROUND_FRAGMENT = /* glsl */ `
  uniform vec2 uCenter;
  uniform float uScale;
  uniform float uTime;
  uniform float uGroundY;
  varying vec2 vWorld;
  void main() {
    vec2 p = (vWorld - uCenter) / uScale;
    float r = length(p * vec2(0.82, 1.0));
    vec3 edge = vec3(0.78, 0.81, 0.87);
    vec3 mid = vec3(0.885, 0.9, 0.935);
    vec3 core = vec3(1.0, 0.988, 0.962);
    vec3 color = mix(mid, edge, smoothstep(0.22, 1.0, r));
    color += vec3(0.07, 0.065, 0.05) * exp(-r * r / 0.07);
    color = mix(color, core, exp(-r * r / 0.012));
    float angle = atan(p.y, p.x);
    float swirl = sin(angle * 3.0 + r * 15.0 - uTime * 0.09);
    color += vec3(0.03, 0.034, 0.045) * swirl * smoothstep(0.04, 0.16, r) * (1.0 - smoothstep(0.3, 0.62, r));
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float direction = mod(fi, 2.0) < 0.5 ? 1.0 : -1.0;
      float rot = uTime * (0.018 + fi * 0.01) * direction + fi * 1.1;
      mat2 m = mat2(cos(rot), -sin(rot), sin(rot), cos(rot));
      vec2 q = m * p;
      float ellipse = length(q * vec2(1.0, 2.3 - fi * 0.4));
      float radius = 0.2 + fi * 0.13;
      float ring = exp(-pow((ellipse - radius) / 0.007, 2.0));
      float arc = 0.5 + 0.5 * sin(atan(q.y, q.x) * 2.0 + fi * 1.7);
      color = mix(color, vec3(1.0, 0.975, 0.92), ring * arc * 0.5);
    }
    float below = smoothstep(0.0, 0.25, (uGroundY - vWorld.y) / uScale);
    color = mix(color, color * vec3(0.955, 0.97, 1.0), below);
    gl_FragColor = vec4(color, 1.0);
  }
`;

const SURFACE_FRAGMENT = /* glsl */ `
  uniform float uGroundY;
  uniform float uDepth;
  uniform float uTime;
  varying vec2 vWorld;
  void main() {
    float depth = clamp((uGroundY - vWorld.y) / uDepth, 0.0, 1.0);
    float ripple = 0.5 + 0.5 * sin(vWorld.y * 38.0 + sin(vWorld.x * 0.7 + uTime * 0.4) * 2.0 + uTime * 0.6);
    float alpha = (1.0 - depth) * 0.11 + ripple * 0.035 * (1.0 - depth);
    gl_FragColor = vec4(vec3(0.62, 0.68, 0.77), alpha);
  }
`;

const SHADOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const SHADOW_FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float falloff = 1.0 - smoothstep(0.15, 1.0, length(p));
    gl_FragColor = vec4(vec3(0.32, 0.34, 0.4), falloff * 0.3 * uOpacity);
  }
`;

const REFLECTION_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying float vWorldY;
  void main() {
    vUv = uv;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldY = world.y;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const REFLECTION_FRAGMENT = /* glsl */ `
  uniform sampler2D map;
  uniform float uOpacity;
  uniform float uGroundY;
  uniform float uFade;
  uniform float uTime;
  uniform float uTexelX;
  varying vec2 vUv;
  varying float vWorldY;
  void main() {
    float depth = max(0.0, uGroundY - vWorldY);
    float mask = clamp(1.0 - depth / uFade, 0.0, 1.0);
    mask *= mask;
    if (mask <= 0.002) discard;
    vec2 uv = vUv;
    uv.x += sin(depth * 16.0 + uTime * 1.5) * uTexelX * 4.0 * clamp(depth * 1.5, 0.0, 1.0);
    vec4 color = texture2D(map, uv);
    color += texture2D(map, uv + vec2(uTexelX * 3.0, 0.0));
    color += texture2D(map, uv - vec2(uTexelX * 3.0, 0.0));
    color /= 3.0;
    gl_FragColor = vec4(mix(color.rgb, vec3(0.85, 0.88, 0.94), 0.18), color.a * uOpacity * mask);
    #include <colorspace_fragment>
  }
`;

const PARTICLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aSpeed;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform vec4 uBounds;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    float height = uBounds.w - uBounds.z;
    p.y = uBounds.z + mod(p.y - uBounds.z + uTime * aSpeed, height);
    p.x += sin(uTime * 0.21 + aPhase) * 0.18;
    float edge = smoothstep(0.0, 0.12, (p.y - uBounds.z) / height) * (1.0 - smoothstep(0.82, 1.0, (p.y - uBounds.z) / height));
    vAlpha = edge * (0.55 + 0.45 * sin(uTime * 0.7 + aPhase * 3.0));
    gl_PointSize = aSize * uPixelRatio;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const PARTICLE_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  void main() {
    float falloff = 1.0 - smoothstep(0.1, 0.5, length(gl_PointCoord - 0.5));
    if (falloff <= 0.0) discard;
    gl_FragColor = vec4(1.0, 0.9, 0.68, falloff * vAlpha * 0.55);
  }
`;

type Tween = {
  startedAt: number | null;
  duration: number;
  update: (progress: number, elapsedMs: number) => void;
  resolve: () => void;
};

type CharacterNode = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  reflection: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  placed: PlacedSprite;
};

function seededGenerator(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function loadDecodedTexture(url: string, pixelArt = false): Promise<THREE.Texture> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const texture = new THREE.Texture(image);
  texture.colorSpace = THREE.SRGBColorSpace;
  if (pixelArt) {
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
  } else {
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
  }
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  return texture;
}

export type FinalMapBossState = "standing" | "charging";

export class FinalMapRenderer {
  readonly layout: FinalMapLayout = createFinalMapLayout();
  readonly guardTransform: GuardOverlayTransform = computeGuardOverlayTransform(this.layout);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -50, 50);
  private readonly geometries: THREE.BufferGeometry[] = [];
  private readonly materials: THREE.Material[] = [];
  private readonly textures = new Map<string, THREE.Texture>();
  private readonly characters = new Map<FinalMapPartyId | "boss", CharacterNode>();
  private readonly tweens = new Set<Tween>();
  private readonly timeUniforms: Array<{ value: number }> = [];
  private background: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private surface: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null;
  private groundLine: THREE.Mesh | null = null;
  private groundGlow: THREE.Mesh | null = null;
  private particles: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial> | null = null;
  private guard: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> | null = null;
  private guardPlayback: { startedAt: number | null; resolve: () => void } | null = null;
  private bossOffsetX = 0;
  private cameraShake: { amplitude: number; elapsed: number } | null = null;
  private frameId = 0;
  private loaded = false;
  private disposed = false;
  private bossState: FinalMapBossState = "standing";
  private readonly startedAt = performance.now();
  private readonly resizeObserver: ResizeObserver | null;
  private readonly onWindowResize = () => this.resize();

  constructor(private readonly container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(0xe4e7ee, 1);
    this.renderer.domElement.className = "final-map-canvas";
    container.appendChild(this.renderer.domElement);
    this.camera.position.set(0, 0, 10);
    this.buildEnvironment();
    this.resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(() => this.resize());
    this.resizeObserver?.observe(container);
    window.addEventListener("resize", this.onWindowResize);
    this.resize();
  }

  get isLoaded(): boolean {
    return this.loaded;
  }

  get currentBossState(): FinalMapBossState {
    return this.bossState;
  }

  private track<T extends THREE.BufferGeometry | THREE.Material>(value: T): T {
    if (value instanceof THREE.BufferGeometry) this.geometries.push(value);
    else this.materials.push(value);
    return value;
  }

  private buildEnvironment() {
    const timeUniform = { value: 0 };
    this.timeUniforms.push(timeUniform);
    const backgroundMaterial = this.track(new THREE.ShaderMaterial({
      vertexShader: BACKGROUND_VERTEX,
      fragmentShader: BACKGROUND_FRAGMENT,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uCenter: { value: new THREE.Vector2(0, FINAL_MAP_GROUND_Y + 3) },
        uScale: { value: 10 },
        uTime: timeUniform,
        uGroundY: { value: FINAL_MAP_GROUND_Y },
      },
    }));
    this.background = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), backgroundMaterial);
    this.background.renderOrder = RENDER_ORDER.background;
    this.background.position.z = -10;
    this.scene.add(this.background);

    const random = seededGenerator(0xf1a1);
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const speeds = new Float32Array(PARTICLE_COUNT);
    const phases = new Float32Array(PARTICLE_COUNT);
    for (let index = 0; index < PARTICLE_COUNT; index += 1) {
      positions.set([(random() - 0.5) * 22, FINAL_MAP_GROUND_Y + random() * 7, -9], index * 3);
      sizes[index] = 1.5 + random() * 2.5;
      speeds[index] = 0.05 + random() * 0.12;
      phases[index] = random() * Math.PI * 2;
    }
    const particleGeometry = this.track(new THREE.BufferGeometry());
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    particleGeometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    particleGeometry.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    this.particles = new THREE.Points(particleGeometry, this.track(new THREE.ShaderMaterial({
      vertexShader: PARTICLE_VERTEX,
      fragmentShader: PARTICLE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTime: timeUniform,
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uBounds: { value: new THREE.Vector4(-11, 11, FINAL_MAP_GROUND_Y + 0.2, FINAL_MAP_GROUND_Y + 7.2) },
      },
    })));
    this.particles.renderOrder = RENDER_ORDER.particles;
    this.particles.frustumCulled = false;
    this.scene.add(this.particles);

    this.surface = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), this.track(new THREE.ShaderMaterial({
      vertexShader: BACKGROUND_VERTEX,
      fragmentShader: SURFACE_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uGroundY: { value: FINAL_MAP_GROUND_Y }, uDepth: { value: 3.5 }, uTime: timeUniform },
    })));
    this.surface.renderOrder = RENDER_ORDER.surface;
    this.scene.add(this.surface);

    this.groundGlow = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), this.track(new THREE.MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false,
    })));
    this.groundGlow.renderOrder = RENDER_ORDER.ground;
    this.scene.add(this.groundGlow);
    this.groundLine = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), this.track(new THREE.MeshBasicMaterial({
      color: 0x9aa2b0, transparent: true, opacity: 0.85, depthTest: false, depthWrite: false,
    })));
    this.groundLine.renderOrder = RENDER_ORDER.ground;
    this.scene.add(this.groundLine);
  }

  /** Loads and decodes every texture before anything is shown. */
  async load(): Promise<void> {
    const urls = {
      theo: DUNGEON10_ASSET_URLS.theoCombat,
      luna: DUNGEON10_ASSET_URLS.lunaCombat,
      karp: DUNGEON10_ASSET_URLS.karpCombat,
      aron: DUNGEON10_ASSET_URLS.aronCombat,
      deneb: DUNGEON10_ASSET_URLS.denebStandingRight,
      bossStanding: DUNGEON10_ASSET_URLS.bossStandingLeft,
      bossCharging: DUNGEON10_ASSET_URLS.bossCharging,
    } as const;
    const entries = await Promise.all(Object.entries(urls).map(async ([key, url]) => [key, await loadDecodedTexture(url)] as const));
    const sheet = await loadDecodedTexture(DUNGEON10_ASSET_URLS.guardSpriteSheet, true);
    if (this.disposed) {
      entries.forEach(([, texture]) => texture.dispose());
      sheet.dispose();
      return;
    }
    entries.forEach(([key, texture]) => this.textures.set(key, texture));
    this.textures.set("guardSheet", sheet);
    for (const id of FINAL_MAP_PARTY_ORDER) this.addCharacter(id, this.textures.get(id)!, this.layout.party[id]);
    this.addCharacter("boss", this.textures.get("bossStanding")!, this.layout.bossStanding);
    this.buildGuardOverlay(sheet);
    // Upload every texture to the GPU now so later swaps never hitch.
    this.textures.forEach((texture) => this.renderer.initTexture(texture));
    this.loaded = true;
    this.renderFrame(performance.now());
  }

  private addCharacter(id: FinalMapPartyId | "boss", texture: THREE.Texture, placed: PlacedSprite) {
    const geometry = this.track(new THREE.PlaneGeometry(1, 1));
    const material = this.track(new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthTest: false, depthWrite: false }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `FinalMap:${id}`;
    const image = texture.image as HTMLImageElement;
    const reflectionMaterial = this.track(new THREE.ShaderMaterial({
      vertexShader: REFLECTION_VERTEX,
      fragmentShader: REFLECTION_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        map: { value: texture },
        uOpacity: { value: REFLECTION_OPACITY },
        uGroundY: { value: FINAL_MAP_GROUND_Y },
        uFade: { value: REFLECTION_FADE_UNITS * (id === "boss" ? 1.35 : 1) },
        uTime: this.timeUniforms[0],
        uTexelX: { value: 1 / Math.max(1, image.naturalWidth || image.width || 1) },
      },
    }));
    const reflection = new THREE.Mesh(geometry, reflectionMaterial);
    reflection.name = `FinalMapReflection:${id}`;
    const shadowMaterial = this.track(new THREE.ShaderMaterial({
      vertexShader: SHADOW_VERTEX,
      fragmentShader: SHADOW_FRAGMENT,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uOpacity: { value: 1 } },
    }));
    const shadow = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), shadowMaterial);
    const order = FINAL_MAP_PARTY_ORDER.indexOf(id as FinalMapPartyId);
    mesh.renderOrder = RENDER_ORDER.character + (id === "boss" ? 0 : order + 1);
    reflection.renderOrder = RENDER_ORDER.reflection;
    shadow.renderOrder = RENDER_ORDER.shadow;
    this.scene.add(reflection, shadow, mesh);
    const node: CharacterNode = { mesh, reflection, shadow, placed };
    this.characters.set(id, node);
    this.applyPlacement(node, placed, 0);
  }

  private applyPlacement(node: CharacterNode, placed: PlacedSprite, offsetX: number) {
    node.placed = placed;
    node.mesh.scale.set(placed.planeWidth, placed.planeHeight, 1);
    node.mesh.position.set(placed.centerX + offsetX, placed.centerY, 0);
    // Mirror about the ground line: the reflected foot row meets the original one.
    node.reflection.scale.set(placed.planeWidth, -placed.planeHeight, 1);
    node.reflection.position.set(placed.centerX + offsetX * BOSS_REFLECTION_SHAKE_RATIO, 2 * FINAL_MAP_GROUND_Y - placed.centerY, -1);
    const visibleWidth = placed.visibleRight - placed.visibleLeft;
    node.shadow.scale.set(visibleWidth * 0.72, Math.max(0.12, visibleWidth * 0.07), 1);
    node.shadow.position.set((placed.visibleLeft + placed.visibleRight) / 2 + offsetX * BOSS_REFLECTION_SHAKE_RATIO, FINAL_MAP_GROUND_Y, -0.5);
  }

  private buildGuardOverlay(sheet: THREE.Texture) {
    const material = this.track(new THREE.MeshBasicMaterial({ map: sheet, transparent: true, depthTest: false, depthWrite: false }));
    sheet.repeat.set(
      (DENEB_GUARD_SHEET.frameWidth - DENEB_GUARD_SHEET.leftInsetPx) / DENEB_GUARD_SHEET.width,
      DENEB_GUARD_SHEET.frameHeight / DENEB_GUARD_SHEET.height,
    );
    this.guard = new THREE.Mesh(this.track(new THREE.PlaneGeometry(1, 1)), material);
    this.guard.name = "FinalMapGuardVfx";
    this.guard.renderOrder = RENDER_ORDER.vfx;
    this.guard.visible = false;
    const { scale, rotation } = this.guardTransform;
    this.guard.scale.set((DENEB_GUARD_SHEET.frameWidth - DENEB_GUARD_SHEET.leftInsetPx) * scale, DENEB_GUARD_SHEET.frameHeight * scale, 1);
    this.guard.rotation.z = rotation;
    this.positionGuard(0, 0);
    this.scene.add(this.guard);
  }

  private positionGuard(shakeX: number, shakeY: number) {
    if (!this.guard) return;
    const { scale, rotation, frameCenterX, frameCenterY } = this.guardTransform;
    // The 1px left inset moves the visible region's centre half a pixel right.
    const local = { x: DENEB_GUARD_SHEET.leftInsetPx / 2 * scale, y: 0 };
    this.guard.position.set(
      frameCenterX + local.x * Math.cos(rotation) - local.y * Math.sin(rotation) + shakeX,
      frameCenterY + local.x * Math.sin(rotation) + local.y * Math.cos(rotation) + shakeY,
      1,
    );
  }

  private setGuardFrame(index: number) {
    const sheet = this.textures.get("guardSheet");
    if (!sheet) return;
    const [column, row] = getGuardFrameCell(index);
    sheet.offset.set(
      (column * DENEB_GUARD_SHEET.frameWidth + DENEB_GUARD_SHEET.leftInsetPx) / DENEB_GUARD_SHEET.width,
      1 - ((row + 1) * DENEB_GUARD_SHEET.frameHeight) / DENEB_GUARD_SHEET.height,
    );
  }

  get guardVisible(): boolean {
    return Boolean(this.guard?.visible);
  }

  start(): void {
    if (this.frameId || this.disposed) return;
    const loop = (now: number) => {
      this.frameId = 0;
      if (this.disposed) return;
      this.renderFrame(now);
      this.frameId = requestAnimationFrame(loop);
    };
    this.frameId = requestAnimationFrame(loop);
  }

  private resize() {
    if (this.disposed) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.renderer.setSize(width, height, false);
    const view = computeFinalMapView(this.layout, width / height);
    this.camera.left = view.left;
    this.camera.right = view.right;
    this.camera.top = view.top;
    this.camera.bottom = view.bottom;
    this.camera.updateProjectionMatrix();
    const centerY = (view.top + view.bottom) / 2;
    if (this.background) {
      this.background.scale.set(view.viewWidth * 1.2, view.viewHeight * 1.2, 1);
      this.background.position.set(0, centerY, -10);
      this.background.material.uniforms.uScale.value = Math.max(view.viewHeight, 10);
    }
    if (this.surface) {
      const depth = FINAL_MAP_GROUND_Y - view.bottom;
      this.surface.scale.set(view.viewWidth * 1.2, depth + 0.2, 1);
      this.surface.position.set(0, FINAL_MAP_GROUND_Y - depth / 2, -2);
    }
    const pixel = view.viewHeight / height;
    this.groundLine?.scale.set(view.viewWidth * 1.2, Math.max(pixel * 2, 0.025), 1);
    this.groundLine?.position.set(0, FINAL_MAP_GROUND_Y, -1.5);
    this.groundGlow?.scale.set(view.viewWidth * 1.2, Math.max(pixel * 6, 0.07), 1);
    this.groundGlow?.position.set(0, FINAL_MAP_GROUND_Y + Math.max(pixel * 2, 0.02), -1.6);
    if (this.particles) {
      this.particles.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio();
    }
    this.renderFrame(performance.now());
  }

  private worldPerScreenPixel(): number {
    const height = Math.max(1, this.container.clientHeight);
    return (this.camera.top - this.camera.bottom) / height;
  }

  private renderFrame(now: number) {
    if (this.disposed) return;
    const seconds = (now - this.startedAt) / 1000;
    this.timeUniforms.forEach((uniform) => { uniform.value = seconds; });
    for (const tween of [...this.tweens]) {
      if (tween.startedAt === null) tween.startedAt = now;
      const elapsed = now - tween.startedAt;
      const progress = Math.min(1, elapsed / tween.duration);
      tween.update(progress, elapsed);
      if (progress >= 1) {
        this.tweens.delete(tween);
        tween.resolve();
      }
    }
    if (this.guardPlayback && this.guard) {
      if (this.guardPlayback.startedAt === null) this.guardPlayback.startedAt = now;
      const elapsed = now - this.guardPlayback.startedAt;
      const frame = getGuardFrameAt(elapsed);
      if (frame === null) {
        this.finishGuard();
      } else {
        this.setGuardFrame(frame);
        this.guard.visible = true;
        const amplitude = GUARD_SHAKE_PIXELS * this.worldPerScreenPixel();
        const t = elapsed / 1000;
        this.positionGuard(Math.sin(t * Math.PI * 2 * 13) * amplitude, Math.sin(t * Math.PI * 2 * 17 + 1) * amplitude * 0.35);
      }
    }
    if (this.cameraShake) {
      const t = this.cameraShake.elapsed / 1000;
      this.camera.position.set(
        Math.sin(t * 57) * this.cameraShake.amplitude + Math.sin(t * 21) * this.cameraShake.amplitude * 0.4,
        Math.sin(t * 43 + 1.2) * this.cameraShake.amplitude * 0.7,
        10,
      );
    } else {
      this.camera.position.set(0, 0, 10);
    }
    const boss = this.characters.get("boss");
    if (boss) this.applyPlacement(boss, boss.placed, this.bossOffsetX);
    this.renderer.render(this.scene, this.camera);
  }

  private addTween(duration: number, update: Tween["update"]): Promise<void> {
    if (this.disposed) return Promise.resolve();
    return new Promise((resolve) => {
      this.tweens.add({ startedAt: null, duration: Math.max(1, duration), update, resolve });
    });
  }

  /** standing ↔ charging: same position, size, aspect and ground anchor; reflection follows. */
  setBossState(state: FinalMapBossState): void {
    const boss = this.characters.get("boss");
    const texture = this.textures.get(state === "charging" ? "bossCharging" : "bossStanding");
    if (!boss || !texture) return;
    this.bossState = state;
    boss.mesh.material.map = texture;
    boss.mesh.material.needsUpdate = true;
    boss.reflection.material.uniforms.map.value = texture;
    this.applyPlacement(boss, state === "charging" ? this.layout.bossCharging : this.layout.bossStanding, this.bossOffsetX);
  }

  /** Beam vs barrier VFX: 24 frames at 8 fps, once, with a light overlay-only shake. */
  playGuardVfx(): Promise<void> {
    if (!this.guard || this.disposed) return Promise.resolve();
    if (this.guardPlayback) return Promise.resolve();
    return new Promise((resolve) => {
      this.setGuardFrame(0);
      this.guardPlayback = { startedAt: null, resolve };
    });
  }

  private finishGuard() {
    const playback = this.guardPlayback;
    this.guardPlayback = null;
    if (this.guard) {
      this.guard.visible = false;
      this.positionGuard(0, 0);
    }
    playback?.resolve();
  }

  /** Fast left-right shake of the devourer only (reflection follows at lower intensity). */
  shakeBoss(durationMs: number): Promise<void> {
    return this.addTween(durationMs, (progress, elapsed) => {
      const envelope = Math.min(1, elapsed / 80) * (progress >= 1 ? 0 : 1);
      this.bossOffsetX = Math.sin((elapsed / 1000) * Math.PI * 2 * 12) * 0.14 * envelope;
      if (progress >= 1) this.bossOffsetX = 0;
    });
  }

  fadeOutBoss(durationMs: number): Promise<void> {
    const boss = this.characters.get("boss");
    if (!boss) return Promise.resolve();
    return this.addTween(durationMs, (progress) => {
      const opacity = 1 - progress;
      boss.mesh.material.opacity = opacity;
      boss.reflection.material.uniforms.uOpacity.value = REFLECTION_OPACITY * opacity;
      boss.shadow.material.uniforms.uOpacity.value = opacity;
      if (progress >= 1) {
        boss.mesh.visible = false;
        boss.reflection.visible = false;
        boss.shadow.visible = false;
      }
    });
  }

  get bossVisible(): boolean {
    return Boolean(this.characters.get("boss")?.mesh.visible);
  }

  /** Shakes the Final map camera only; DOM UI is outside the canvas. */
  shakeCamera(durationMs: number, amplitude = 0.09): Promise<void> {
    this.cameraShake = { amplitude, elapsed: 0 };
    return this.addTween(durationMs, (progress, elapsed) => {
      if (!this.cameraShake) return;
      const envelope = Math.min(1, elapsed / 100) * Math.min(1, (durationMs - elapsed) / 250);
      this.cameraShake.elapsed = elapsed;
      this.cameraShake.amplitude = amplitude * Math.max(0, envelope);
      if (progress >= 1) this.cameraShake = null;
    });
  }

  /** Debug/test snapshot of the world layout actually applied to the meshes. */
  describe() {
    const entries = [...this.characters.entries()].map(([id, node]) => ({
      id,
      meshCenterY: node.mesh.position.y,
      placedCenterY: node.placed.centerY,
      footY: node.placed.footY,
      scaleX: node.mesh.scale.x,
      scaleY: node.mesh.scale.y,
      reflectionScaleY: node.reflection.scale.y,
      reflectionY: node.reflection.position.y,
      sharesTexture: node.reflection.material.uniforms.map.value === node.mesh.material.map,
      reflectionOpacity: node.reflection.material.uniforms.uOpacity.value as number,
      visible: node.mesh.visible,
    }));
    return { entries, guard: this.guardTransform, camera: { left: this.camera.left, right: this.camera.right, top: this.camera.top, bottom: this.camera.bottom } };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.frameId) cancelAnimationFrame(this.frameId);
    this.frameId = 0;
    this.resizeObserver?.disconnect();
    window.removeEventListener("resize", this.onWindowResize);
    this.tweens.forEach((tween) => tween.resolve());
    this.tweens.clear();
    this.guardPlayback?.resolve();
    this.guardPlayback = null;
    this.scene.clear();
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());
    this.textures.clear();
    this.characters.clear();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
