// Run with node scripts/dungeon9-rendering-checks.mjs. No package/lock changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { build, transform } from 'esbuild';
import * as THREE from 'three';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

function readRgbaPng(file) {
  const bytes = fs.readFileSync(file);
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const width = bytes.readUInt32BE(16), height = bytes.readUInt32BE(20);
  assert.equal(bytes[24], 8); assert.equal(bytes[25], 6); assert.equal(bytes[28], 0);
  const idat = [];
  for (let offset = 8; offset < bytes.length;) {
    const length = bytes.readUInt32BE(offset), type = bytes.toString('ascii', offset + 4, offset + 8);
    if (type === 'IDAT') idat.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = width * 4;
  const pixels = Buffer.alloc(stride * height);
  const paeth = (a, b, c) => {
    const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
    return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
  };
  let minX = width, minY = height, maxX = -1, maxY = -1;
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; assert(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x, a = x >= 4 ? pixels[i - 4] : 0;
      const b = y > 0 ? pixels[i - stride] : 0, c = y > 0 && x >= 4 ? pixels[i - stride - 4] : 0;
      pixels[i] = raw[y * (stride + 1) + x + 1] + [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter];
      if (x % 4 === 3 && pixels[i] > 0) {
        const px = (x - 3) / 4;
        minX = Math.min(minX, px); maxX = Math.max(maxX, px);
        minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  return { width, height, alphaBox: [minX, minY, maxX + 1, maxY + 1] };
}
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'd9-render-check-'));
try {
  await build({stdin:{contents:`export { MonsterAnimationController } from './src/three/monster/MonsterAnimationController'; export { getMonsterVisualDefinition } from './src/game/monster/monsterDefinitions'; export { prepareFloorDungeonMap } from './src/screens/DungeonScreen/DungeonScreen'; export { createDungeonRun } from './src/game/dungeon/generation/floor1DungeonRuntime';`,resolveDir:process.cwd(),loader:'ts'},outfile:path.join(temp,'modules.mjs'),bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({BASE_URL:'/AdventureAcademy5-2-2/',DEV:false,PROD:true})},loader:{'.png':'file'},assetNames:'assets/[name]-[hash]'});
  const { MonsterAnimationController, getMonsterVisualDefinition, prepareFloorDungeonMap, createDungeonRun } = await import(pathToFileURL(path.join(temp,'modules.mjs')));
  const source = fs.readFileSync('src/screens/DungeonScreen/DungeonScreen.tsx','utf8');
  const encounter = fs.readFileSync('src/components/Dungeon9ScriptedEncounter.tsx','utf8');
  const png = readRgbaPng('public/assets/dungeon9/corrupted-korean-empire-citizen.png');
  assert.deepEqual([png.width,png.height],[1774,887]);
  assert.deepEqual(png.alphaBox,[0,0,1774,887]);
  const sourceAspect = png.width / png.height;
  const definition = getMonsterVisualDefinition('dungeon9-corrupted-citizen');
  assert.equal(definition.image,'/AdventureAcademy5-2-2/assets/dungeon9/corrupted-korean-empire-citizen.png');
  assert.equal(definition.aspectRatio,sourceAspect);
  const constant = name => Number(source.match(new RegExp(`const ${name} = ([0-9.]+);`))[1]);
  const height = constant('MONSTER_PLANE_HEIGHT');
  const baseAspect = 812 / 778;
  assert(source.includes('const MONSTER_TEXTURE_ASPECT = 812 / 778;'));
  const geometry = new THREE.PlaneGeometry(height * baseAspect,height);
  const mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({transparent:true}));
  const root = new THREE.Group(); root.add(mesh); root.visible = false;
  const scene = new THREE.Scene(); scene.add(root);
  const camera = new THREE.PerspectiveCamera(64,16/9,.1,100);
  const run = createDungeonRun('floor-9','d9-aspect-check');
  const map = prepareFloorDungeonMap(run.map,'floor-9',run.seed);
  const room = map.rooms.find(r=>r.isFinalQuestRoom);
  camera.position.set(...room.explorationCameraPose.position);camera.lookAt(...room.explorationCameraPose.lookAt);camera.updateMatrixWorld();
  const monster = new MonsterAnimationController(mesh);
  const visuals = {monsterRoot:root,monsterMesh:mesh,monster,monsterTexture:null,camera};
  let decodeDone = false, textureReady = false, resolveLoad;
  const loaded = new Promise(resolve=>resolveLoad=resolve);
  const image = {complete:true,naturalWidth:png.width,naturalHeight:png.height,decode:async()=>{decodeDone=true}};
  class TextureLoader { load(url,onLoad) { assert.equal(url,definition.image);void loaded.then(()=>{const t=new THREE.Texture(image);onLoad(t);textureReady=true;}); } }
  const context = {THREE:{...THREE,TextureLoader},visualsRef:{current:visuals},mountedRef:{current:true},monsterVisualRevisionRef:{current:0},monsterPositionTargetRef:{current:new THREE.Vector3()},currentRoomId:room.id,
    getDungeonRoom:()=>room,getMonsterVisualDefinition,
    MONSTER_TEXTURE_ASPECT:baseAspect,MONSTER_POSITION_RESPONSE:13,monsterBillboard:root,camera,
    playRandomizedOneShot:()=>{},HIT_SFX_URL:'hit',HEAL_SFX_URL:'heal',DUNGEON9_SCRIPTED_ATTACK_DAMAGE:100,
    dungeon9AttackFeedbackTimerRef:{current:null},playerHpRef:{current:100},maxHp:100,setPlayerHp:()=>{},setFloatingText:()=>{},setDamageFlash:()=>{},window:{setTimeout:()=>0}};
  vm.createContext(context);
  // Execute the actual loader, encounter actions and per-frame billboard update.
  const loader = source.slice(source.indexOf('  const applyMonsterVisual ='),source.indexOf('  const playSword ='));
  const actions = source.slice(source.indexOf('  const prepareDungeon9ScriptedMonster ='),source.indexOf('  const playDungeon10PlayerAttack ='));
  const frame = source.slice(source.indexOf('      const positionBlend ='),source.indexOf('      renderer.render(scene, camera);'));
  const executable = await transform(loader+actions+'\nglobalThis.actions={applyMonsterVisual,prepareDungeon9ScriptedMonster,revealDungeon9ScriptedMonster,hideDungeon9ScriptedMonster,playDungeon9ScriptedEnemyAttack,playDungeon9FullHeal,playDungeon9ScriptedStrike};\nglobalThis.updateBillboard=(delta)=>{'+frame+'};',{loader:'ts'});
  vm.runInContext(executable.code,context);
  const a = context.actions;
  const preparing = a.prepareDungeon9ScriptedMonster();
  assert.equal(root.visible,false);assert.equal(textureReady,false);
  resolveLoad();await preparing;assert(decodeDone);assert.equal(root.visible,false);
  assert(source.includes('if (floorId === "floor-9" && objectiveEvent === "first") return;'));
  const aspect = () => geometry.parameters.width * Math.abs(mesh.scale.x) / (geometry.parameters.height * Math.abs(mesh.scale.y));
  const checkAspect = () => {assert(Math.abs(aspect()-sourceAspect)<=.01);assert(Math.abs(geometry.parameters.height*Math.abs(mesh.scale.y)-2.3575)<1e-10);};
  const projection = (w,h) => {
    camera.aspect=w/h;camera.updateProjectionMatrix();context.updateBillboard(0);scene.updateMatrixWorld();camera.updateMatrixWorld();
    const p=geometry.attributes.position,points=[];
    for(let i=0;i<p.count;i++) {
      const v=new THREE.Vector3().fromBufferAttribute(p,i).applyMatrix4(mesh.matrixWorld).project(camera);
      points.push([(v.x+1)*w/2,(1-v.y)*h/2]);
    }
    const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
    const box={left:Math.min(...xs),top:Math.min(...ys),right:Math.max(...xs),bottom:Math.max(...ys)};
    const c=mesh.getWorldPosition(new THREE.Vector3()).project(camera);
    return {...box,centerX:(c.x+1)*w/2,centerY:(1-c.y)*h/2,width:box.right-box.left,height:box.bottom-box.top};
  };
  const isRendered = () => {
    context.updateBillboard(0);scene.updateMatrixWorld();camera.updateMatrixWorld();checkAspect();
    assert(root.visible&&mesh.visible&&mesh.material.visible&&mesh.material.opacity>0);
    assert.equal(root.children.length,1);assert.equal(root.parent,scene);assert(camera.layers.test(mesh.layers));
    assert(new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsObject(mesh));
    const box=projection(1920,1080);assert(Math.abs(box.width/box.height-sourceAspect)<=.01);
  };
  const baseScale=mesh.scale.clone(),baseGeometry=geometry.uuid;
  const sizes=[[1920,1080],[1600,900],[1366,768],[1280,720]];
  a.revealDungeon9ScriptedMonster();isRendered();monster.update(.17);isRendered();monster.update(.2);isRendered();
  for(const [w,h]of sizes) {
    const box=projection(w,h);
    assert(Math.abs(box.centerX-w/2)<1e-5&&Math.abs(box.centerY-h/2)<1e-5);
    assert(Math.abs(box.width/box.height-sourceAspect)<=.01);
    // Existing message panel's desktop max 36vh is a conservative occlusion envelope.
    // Use actual min-height for the idle message footprint, plus bottom 2.2vh.
    const messageHeight=Math.max(8.5*16,Math.min(.2*h,11.5*16));
    const panelTop=h-.022*h-messageHeight;
    assert(box.bottom<panelTop,`idle monster overlaps message panel at ${w}x${h}`);
    console.log(JSON.stringify({viewport:[w,h],box,panelTop}));
  }
  const beforeCamera=camera.matrixWorld.clone(),beforeRoot=root.position.clone();
  const enemy=a.playDungeon9ScriptedEnemyAttack();
  for(let i=0;i<31;i++){monster.update(.02);isRendered();assert(mesh.scale.equals(baseScale));}
  monster.update(.02);await enemy;isRendered();assert.equal(context.playerHpRef.current,0);
  assert.equal(geometry.uuid,baseGeometry);
  a.hideDungeon9ScriptedMonster();assert.equal(root.visible,false);
  a.revealDungeon9ScriptedMonster();a.playDungeon9FullHeal();monster.update(.4);isRendered();assert.equal(context.playerHpRef.current,100);
  for(const [w,h]of sizes){const box=projection(w,h);assert(Math.abs(box.centerY-h/2)<1e-5);}
  const hit=monster.play('hit');for(let i=0;i<18;i++){monster.update(.02);isRendered();assert(mesh.scale.equals(baseScale));}await hit;
  const strike=a.playDungeon9ScriptedStrike();const originalX=mesh.position.x,originalY=mesh.position.y;
  for(let i=0;i<100;i++){
    monster.update(.02);isRendered();assert.equal(mesh.position.y,originalY);assert(mesh.scale.equals(baseScale));
    if(i===0)assert.notEqual(mesh.position.x,originalX);
    assert(camera.matrixWorld.equals(beforeCamera));assert(root.position.equals(beforeRoot));
  }
  await new Promise(resolve=>setImmediate(resolve));
  for(let i=0;i<34;i++){monster.update(.02);isRendered();assert(mesh.scale.equals(baseScale));}
  monster.update(.04);checkAspect();await strike;assert.equal(root.visible,false);
  assert(encounter.includes('await prepareMonster();'));
  assert(encounter.includes('await revealMonster();\n        if (!mountedRef.current) return;\n        setPhase("appearance")'));
  assert(encounter.includes('void revealMonster();\n    setPhase("healing")'));
  assert(encounter.includes('if (phase !== "command" || actionLockedRef.current) return;'));
  assert(encounter.includes('clearTimers();\n      hideMonster();'));
  // Execute the same loader for every ordinary combat/elite definition in floors 1–8.
  let normalCount=0;
  for(let floor=1;floor<=8;floor++){
    const ordinaryRun=createDungeonRun(`floor-${floor}`,`normal-aspect-${floor}`);
    const ordinaryMap=prepareFloorDungeonMap(ordinaryRun.map,`floor-${floor}`,ordinaryRun.seed);
    const ids=new Set(ordinaryMap.rooms.flatMap(r=>[r.combatConfig?.monsterId,r.eliteConfig?.monsterId]).filter(Boolean));
    for(const id of ids){
      const d=getMonsterVisualDefinition(id);
      // Loader URL gate is only for the citizen fixture, so feed the actual definition with fixture URL.
      await a.applyMonsterVisual({...d,image:definition.image});
      assert.equal(geometry.uuid,baseGeometry);
      assert.equal(mesh.scale.x,d.displayScale*(d.aspectRatio/baseAspect));assert.equal(mesh.scale.y,d.displayScale);
      assert(Math.abs(aspect()-d.aspectRatio)<1e-10);
      monster.reset();root.visible=true;root.position.copy(new THREE.Vector3(...room.explorationCameraPose.lookAt));
      context.monsterPositionTargetRef.current.copy(root.position);context.updateBillboard(0);
      const expected=new THREE.Group();expected.position.copy(root.position);expected.lookAt(camera.position);
      assert(root.quaternion.equals(expected.quaternion));
      const oldScale=mesh.scale.clone();const animation=monster.play('hit');monster.update(.4);await animation;assert(mesh.scale.equals(oldScale));normalCount++;
    }
  }
  console.log('PNG canvas/alpha box',JSON.stringify(png));
  console.log('geometry',geometry.parameters,'citizen scale',baseScale.toArray(),'display dimensions',[4.715,2.3575],'aspect',sourceAspect);
  console.log(`Dungeon9 actual loader/actions/projection/animation checks: PASS; Dungeon1–8 actual ordinary definitions: ${normalCount} PASS`);
  console.log('Browser pixel rendering and actual DOM Dialogue bounds: NOT VERIFIED');
  monster.dispose();geometry.dispose();mesh.material.dispose();
} finally {fs.rmSync(temp,{recursive:true,force:true});}
