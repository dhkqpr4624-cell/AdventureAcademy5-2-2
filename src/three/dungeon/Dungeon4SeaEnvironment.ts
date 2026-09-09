import * as THREE from "three";
import type { DungeonMapDefinition } from "../../game/dungeon/dungeonTypes";

type Dungeon4SeaEnvironment = {
  root: THREE.Group;
  fog: THREE.Fog;
  update: (elapsedSeconds: number) => void;
  dispose: () => void;
};

export function createDungeon4SeaEnvironment(map: DungeonMapDefinition): Dungeon4SeaEnvironment {
  const root = new THREE.Group();
  root.name = "Dungeon4SeaEnvironment";
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];
  const zs = map.rooms.map((room) => room.position.z);
  const centerZ = (Math.min(...zs) + Math.max(...zs)) / 2;
  const depth = Math.max(180, Math.max(...zs) - Math.min(...zs) + 150);

  const waterGeometry = new THREE.PlaneGeometry(180, depth, 1, 1);
  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vWorld;
      void main() {
        vec4 world = modelMatrix * vec4(position, 1.0);
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vWorld;
      void main() {
        float waveA = sin(vWorld.x * 0.34 + uTime * 0.55) * 0.5 + 0.5;
        float waveB = sin(vWorld.z * 0.22 - uTime * 0.38) * 0.5 + 0.5;
        float line = smoothstep(0.86, 1.0, waveA * waveB);
        vec3 deep = vec3(0.055, 0.30, 0.50);
        vec3 crest = vec3(0.20, 0.54, 0.69);
        gl_FragColor = vec4(mix(deep, crest, line * 0.42), 1.0);
      }
    `,
  });
  const water = new THREE.Mesh(waterGeometry, waterMaterial);
  water.name = "Dungeon4WaterFloor";
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -3, centerZ);
  root.add(water);
  geometries.push(waterGeometry);
  materials.push(waterMaterial);

  const skyGeometry = new THREE.SphereGeometry(280, 32, 18);
  const skyMaterial = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    vertexShader: `varying vec3 vPosition; void main(){ vPosition=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `
      varying vec3 vPosition;
      void main(){
        float h = clamp(vPosition.y / 180.0 + 0.45, 0.0, 1.0);
        vec3 horizon = vec3(0.58, 0.80, 0.91);
        vec3 zenith = vec3(0.13, 0.39, 0.67);
        gl_FragColor = vec4(mix(horizon, zenith, h), 1.0);
      }
    `,
  });
  const sky = new THREE.Mesh(skyGeometry, skyMaterial);
  sky.name = "Dungeon4Sky";
  sky.position.set(0, 8, centerZ);
  sky.renderOrder = -20;
  root.add(sky);
  geometries.push(skyGeometry);
  materials.push(skyMaterial);

  [-1, 1].forEach((side, index) => {
    const islandGeometry = new THREE.ConeGeometry(18 + index * 4, 8, 7);
    const islandMaterial = new THREE.MeshBasicMaterial({ color: index ? 0x496d73 : 0x5b7d7d, fog: true });
    const island = new THREE.Mesh(islandGeometry, islandMaterial);
    island.name = `Dungeon4DistantIsland-${index + 1}`;
    island.position.set(side * 48, -4, centerZ - depth / 2 + 25 + index * 16);
    island.scale.z = 0.42;
    island.renderOrder = -5;
    root.add(island);
    geometries.push(islandGeometry);
    materials.push(islandMaterial);
  });

  const startRoom = map.rooms.find((room) => room.id === map.startRoomId) ?? map.rooms[0];
  const startConnection = map.connections.find((connection) =>
    connection.fromRoomId === startRoom?.id || connection.toRoomId === startRoom?.id
  );
  const nextRoomId = startConnection
    ? startConnection.fromRoomId === startRoom?.id ? startConnection.toRoomId : startConnection.fromRoomId
    : undefined;
  const nextRoom = map.rooms.find((room) => room.id === nextRoomId);
  const forward = new THREE.Vector2(
    (nextRoom?.position.x ?? 0) - (startRoom?.position.x ?? 0),
    (nextRoom?.position.z ?? 1) - (startRoom?.position.z ?? 0),
  ).normalize();
  if (forward.lengthSq() === 0) forward.set(0, 1);
  const lateral = new THREE.Vector2(-forward.y, forward.x);
  const horizonCenter = new THREE.Vector2(startRoom?.position.x ?? 0, startRoom?.position.z ?? centerZ)
    .addScaledVector(forward, 105);
  const distantLand = new THREE.Group();
  distantLand.name = "Dungeon4DistantLandGroup";
  const landMaterial = new THREE.MeshBasicMaterial({ color: 0x58747d, fog: true });
  const ridgeMaterial = new THREE.MeshBasicMaterial({ color: 0x4b6672, fog: true });
  materials.push(landMaterial, ridgeMaterial);

  [-58, -39, -20, 0, 22, 43, 61].forEach((lateralOffset, index) => {
    const landGeometry = new THREE.SphereGeometry(14 + (index % 3) * 3, 8, 5);
    const land = new THREE.Mesh(landGeometry, landMaterial);
    land.name = `Dungeon4LowIsland-${index + 1}`;
    land.scale.set(1.35, 0.22 + (index % 2) * 0.04, 0.7);
    const position = horizonCenter.clone()
      .addScaledVector(lateral, lateralOffset)
      .addScaledVector(forward, (index % 2) * 6);
    land.position.set(position.x, -5.2, position.y);
    land.renderOrder = -6;
    distantLand.add(land);
    geometries.push(landGeometry);
  });

  [-44, -26, -8, 13, 34, 52].forEach((lateralOffset, index) => {
    const ridgeGeometry = new THREE.ConeGeometry(12 + (index % 2) * 4, 15 + (index % 3) * 3, 6);
    const ridge = new THREE.Mesh(ridgeGeometry, ridgeMaterial);
    ridge.name = `Dungeon4MountainRidge-${index + 1}`;
    ridge.scale.z = 0.55;
    const position = horizonCenter.clone()
      .addScaledVector(lateral, lateralOffset)
      .addScaledVector(forward, 8 + (index % 2) * 5);
    ridge.position.set(position.x, -4.5, position.y);
    ridge.renderOrder = -7;
    distantLand.add(ridge);
    geometries.push(ridgeGeometry);
  });
  root.add(distantLand);

  return {
    root,
    fog: new THREE.Fog(0x7fb5cb, 38, 125),
    update: (elapsedSeconds) => { waterMaterial.uniforms.uTime.value = elapsedSeconds; },
    dispose: () => {
      root.removeFromParent();
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
    },
  };
}
