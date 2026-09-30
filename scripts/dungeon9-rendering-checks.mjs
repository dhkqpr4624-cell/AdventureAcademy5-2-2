// Run with node scripts/dungeon9-rendering-checks.mjs. No package/lock changes.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { build, transform } from 'esbuild';
import * as THREE from 'three';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'd9-render-check-'));
try {
  await build({entryPoints:['src/three/monster/MonsterAnimationController.ts'],outfile:path.join(temp,'animation.mjs'),bundle:true,platform:'node',format:'esm'});
  const { MonsterAnimationController } = await import(pathToFileURL(path.join(temp,'animation.mjs')));
  const source = fs.readFileSync('src/screens/DungeonScreen/DungeonScreen.tsx','utf8');
  const encounter = fs.readFileSync('src/components/Dungeon9ScriptedEncounter.tsx','utf8');
  const geometry = new THREE.PlaneGeometry(2.05 * 812 / 778, 2.05);
  const mesh = new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({transparent:true}));
  const root = new THREE.Group(); root.add(mesh); root.visible = false;
  const scene = new THREE.Scene(); scene.add(root);
  const camera = new THREE.PerspectiveCamera(60,16/9,.1,1000);
  camera.position.set(48,1.6,-60); camera.lookAt(48,-.15,-64); camera.updateMatrixWorld();
  const monster = new MonsterAnimationController(mesh);
  const visuals = {monsterRoot:root,monsterMesh:mesh,monster,monsterTexture:null,camera};
  let decodeDone = false, textureReady = false, resolveLoad;
  const loaded = new Promise(resolve=>resolveLoad=resolve);
  const context = {visualsRef:{current:visuals},mountedRef:{current:true},monsterPositionTargetRef:{current:new THREE.Vector3()},currentRoomId:'final',
    getDungeonRoom:()=>({explorationCameraPose:{lookAt:[48,-.15,-64]}}),
    applyDungeonEventVisualVerticalOffset:([x,y,z])=>[x,y+.62,z],
    getMonsterVisualDefinition:id=>{assert.equal(id,'dungeon9-corrupted-citizen');return {id}},
    applyMonsterVisual:async()=>{await loaded; visuals.monsterTexture={image:{complete:true,naturalWidth:1024,decode:async()=>{decodeDone=true}}};mesh.material.map=new THREE.Texture();mesh.scale.set(1.15/(812/778),1.15,1);textureReady=true},
    playRandomizedOneShot:()=>{},HIT_SFX_URL:'hit',HEAL_SFX_URL:'heal',DUNGEON9_SCRIPTED_ATTACK_DAMAGE:100,
    dungeon9AttackFeedbackTimerRef:{current:null},playerHpRef:{current:100},maxHp:100,setPlayerHp:()=>{},setFloatingText:()=>{},setDamageFlash:()=>{},window:{setTimeout:()=>0}};
  vm.createContext(context);
  // Execute the actual integrated closures, not a second implementation.
  const block = source.slice(source.indexOf('  const prepareDungeon9ScriptedMonster ='),source.indexOf('  const playDungeon10PlayerAttack ='));
  const executable = await transform(block+'\nglobalThis.actions={prepareDungeon9ScriptedMonster,revealDungeon9ScriptedMonster,hideDungeon9ScriptedMonster,playDungeon9ScriptedEnemyAttack,playDungeon9FullHeal,playDungeon9ScriptedStrike};',{loader:'ts'});
  vm.runInContext(executable.code,context);
  const a = context.actions;
  const preparing = a.prepareDungeon9ScriptedMonster();
  assert.equal(root.visible,false); assert.equal(textureReady,false);
  resolveLoad(); await preparing; assert(decodeDone);assert.equal(root.visible,false);
  // Screen's phase-driven visibility effect must yield ownership to Dungeon9.
  const effect = source.slice(source.indexOf('    const showMonster ='),source.indexOf('  useEffect(() => {\n    visualAssemblyRef'));
  assert(source.includes('if (floorId === "floor-9" && objectiveEvent === "first") return;'));
  assert(effect.includes('objectiveEvent]'));
  const isRendered=()=>{
    scene.updateMatrixWorld(); camera.updateMatrixWorld();
    assert(root.visible && mesh.visible && mesh.material.visible && mesh.material.opacity>0);
    assert(mesh.scale.x>0 && mesh.scale.y>0);assert.equal(root.children.filter(x=>x===mesh).length,1);
    assert.equal(root.parent,scene);assert(camera.layers.test(mesh.layers));
    assert(new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsObject(mesh));
  };
  // The former hardcoded origin is outside this final-room camera frustum.
  root.position.set(0,.05,-5);scene.updateMatrixWorld();
  assert(!new THREE.Frustum().setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse)).intersectsObject(mesh));
  root.position.copy(context.monsterPositionTargetRef.current);root.lookAt(camera.position);
  a.revealDungeon9ScriptedMonster(); isRendered();monster.update(.4);isRendered();
  const beforeCamera=camera.matrixWorld.clone(),beforeRoom=root.position.clone();
  const enemy=a.playDungeon9ScriptedEnemyAttack();monster.update(.32);isRendered();monster.update(.4);await enemy;isRendered();assert.equal(context.playerHpRef.current,0);
  a.hideDungeon9ScriptedMonster();assert.equal(root.visible,false);
  a.revealDungeon9ScriptedMonster();a.playDungeon9FullHeal();monster.update(.4);isRendered();assert.equal(context.playerHpRef.current,100);
  const strike=a.playDungeon9ScriptedStrike();const originalX=mesh.position.x;
  monster.update(.041);isRendered();assert.notEqual(mesh.position.x,originalX);
  assert(camera.matrixWorld.equals(beforeCamera));assert(root.position.equals(beforeRoom));
  monster.update(1.8);isRendered();monster.update(.16);isRendered();await new Promise(resolve=>setImmediate(resolve));
  // defeat only starts after the two-second shake.
  monster.update(.35);isRendered();monster.update(.4);await strike;assert.equal(root.visible,false);
  assert(encounter.indexOf('await prepareMonster()')<encounter.indexOf('DUNGEON9_MONSTER_APPEAR_DELAY_MS);'));
  assert(encounter.includes('await revealMonster();\n        if (!mountedRef.current) return;\n        setPhase("appearance")'));
  assert(encounter.includes('void revealMonster();\n    setPhase("healing")'));
  assert(encounter.includes('if (phase !== "command" || actionLockedRef.current) return;'));
  assert(encounter.includes('clearTimers();\n      hideMonster();'));
  // Ordinary monsters share the unchanged geometry, texture scaling, layers and controller.
  for(let floor=1;floor<=8;floor++){
    monster.reset();root.visible=true;root.position.set(48,.47,-64);mesh.scale.set(1,1,1);isRendered();
    const hit=monster.play('hit');monster.update(.4);await hit;isRendered();
  }
  monster.dispose();geometry.dispose();mesh.material.dispose();
  console.log('Dungeon9 actual closure rendering/lifecycle checks: PASS (texture/decode gate, hidden preparation, frustum, visibility, opacity, scale, layers, one plane, attack, healing, 2s isolated shake, defeat)');
  console.log('Dungeon1–8 shared ordinary monster geometry/controller checks: PASS');
  console.log('Browser PNG pixel rendering: NOT VERIFIED');
} finally {fs.rmSync(temp,{recursive:true,force:true});}
