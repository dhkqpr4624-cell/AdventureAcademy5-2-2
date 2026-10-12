import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {build,transform} from 'esbuild';
import {pathToFileURL} from 'node:url';
import * as THREE from 'three';
const hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
assert.equal(hash('public/assets/dungeon9/vengeful-empress-myeongseong.png'),'6075359d9309a83962eb6a2ca8d540be5282b16146482c86425678a136611e5a');
assert.equal(hash('src/assets/portraits/chapter2/deneb/default.png'),'c151798e0eebd1a36c8428cff5243abf5f942a2533be3864745740b1b2cc5ce4');
const png=fs.readFileSync('public/assets/dungeon9/vengeful-empress-myeongseong.png');assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(png.readUInt32BE(16),1086);assert.equal(png.readUInt32BE(20),1448);assert.equal(png[24],8);assert.equal(png[25],6);
if(fs.existsSync('.git'))assert.equal(execFileSync('git',['diff','--name-only','--','*.png'],{encoding:'utf8'}).trim(),'public/assets/dungeon9/vengeful-empress-myeongseong.png');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'nine-assets-'));
try{
 await build({stdin:{contents:`export {resolveDungeonRoomEvent} from './src/game/dungeon/dungeonRoomEventResolver';export {resolvePlayerDamage} from './src/game/player/playerDamageResolver';export {getMonsterVisualDefinition} from './src/game/monster/monsterDefinitions';`,resolveDir:process.cwd(),loader:'ts'},outfile:path.join(temp,'helpers.mjs'),bundle:true,platform:'node',format:'esm',define:{'import.meta.env':JSON.stringify({BASE_URL:'/AdventureAcademy5-2-2/',DEV:false})},loader:{'.png':'file'},assetNames:'assets/[name]-[hash]'});
 const {resolveDungeonRoomEvent,resolvePlayerDamage,getMonsterVisualDefinition}=await import(pathToFileURL(path.join(temp,'helpers.mjs')));
 const d=getMonsterVisualDefinition('vengeful-goryeo-spirit'),geometry=new THREE.PlaneGeometry(2.05*812/778,2.05),scale=new THREE.Vector3(d.displayScale*d.aspectRatio/(812/778),d.displayScale,1);
 const width=geometry.parameters.width*scale.x,height=geometry.parameters.height*scale.y;assert(Math.abs(width/height-.75)<.01);assert(Math.abs(height-2.419)<1e-10);assert(Math.abs(width/1086-height/1448)<1e-12);
 const source=fs.readFileSync('src/screens/DungeonScreen/DungeonScreen.tsx','utf8');
 const fn=source.slice(source.indexOf('  const finishRoomEventAfterReview ='),source.indexOf('  const continueAfterRoomEvent ='));
 const code=await transform(fn+'\nglobalThis.finish=finishRoomEventAfterReview;', {loader:'ts'});
 for(const startHp of [50,5])for(let floor=1;floor<=10;floor++){
  let hp=startHp,applied=0,defeated=0,message;
  const context={activeRoomEvent:{roomId:'trap',kind:'trap',phase:'review'},pendingRoomEventResultRef:{current:{isCorrect:false}},eventResultProcessingRef:{current:false},mountedRef:{current:true},roomProgressRef:{current:{}},getDungeonRoom:()=>({id:'trap',type:'trap',eventConfig:{damage:999,questionSetId:'trap'}}),resolveDungeonRoomEvent,applyPlayerDamage:damage=>{applied++;assert.equal(damage,10);const r=resolvePlayerDamage(hp,damage);hp=r.nextHp;return r;},setFloatingText:()=>{},setDamageFlash:()=>{},window:{setTimeout:()=>0},enterDefeatedState:()=>{defeated++;},completeRoomEventWithResult:()=>({trap:{eventCompleted:true}}),setRoomProgress:()=>{},setExplorationMessage:m=>{message=m;},updateActiveRoomEvent:()=>{},activeFloorNumber:floor};
  vm.createContext(context);vm.runInContext(code.code,context);context.finish();context.finish();assert.equal(applied,1);assert.equal(hp,Math.max(0,startHp-10));assert.equal(defeated,startHp<=10?1:0);if(startHp>10)assert(message.includes('10의 피해'));
 }
 const retry=source.slice(source.indexOf('  const retryAfterDefeat ='),source.indexOf('  const returnAfterDefeat =')),retryCode=await transform(retry+'\nglobalThis.retry=retryAfterDefeat;',{loader:'ts'});
 let calls=0,restarts=0;const context={dungeonExitProcessingRef:{current:false},setRunActionBusy:()=>{},floorId:'floor-9',dungeonRun:{seed:'layout'},dungeonMap:{},createQuestionAttemptSeed:()=> 'fresh',setQuestionAttemptSeed:s=>assert.equal(s,'fresh'),allocateDungeonRunQuestions:(_,s)=>{calls++;assert.equal(s,'fresh');return {};},setRunQuestionAssignments:()=>{},restartTestDungeon:restore=>{assert(restore);restarts++;}};
 vm.createContext(context);vm.runInContext(retryCode.code,context);context.retry();context.retry();assert.equal(calls,1);assert.equal(restarts,1);
 if(fs.existsSync('.git')){
  const baseline=execFileSync('git',['show','HEAD:src/screens/DungeonScreen/DungeonScreen.tsx'],{encoding:'utf8'}),slice=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b));
  for(const [a,b]of [['  const prepareDungeon9ScriptedMonster =','  const playDungeon10PlayerAttack ='],['  const restartTestDungeon =','  const retryAfterDefeat =']])assert.equal(slice(source,a,b),slice(baseline,a,b));
 }
 console.log('PNG hash/aspect, actual trap handler10/duplicate/HP0, actual retry handler/new queue/duplicate lock, unchanged scripted100 and restart policy: PASS');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
