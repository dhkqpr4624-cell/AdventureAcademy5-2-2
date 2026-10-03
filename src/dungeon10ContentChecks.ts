import * as THREE from "three";
import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import {
  DUNGEON10_ENTRY_STORY,
  DUNGEON10_FINAL_SEGMENTS,
  DUNGEON10_QUEST_OFFER_STORY,
  DUNGEON10_QUEST_OFFER_STORY_ID,
  type Dungeon10FinalSegmentId,
} from "./data/stories/dungeon10Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { DUNGEON10_BOSS_ROOM_ID, DUNGEON10_MAP, DUNGEON10_START_ROOM_ID } from "./game/dungeon/dungeon10Map";
import {
  DENEB_GUARD_DURATION_MS,
  DENEB_GUARD_SHEET,
  DUNGEON10_ASSET_URLS,
  DUNGEON10_BOSS_NAME,
  DUNGEON10_MAX_SUPPORT_COUNT,
  DUNGEON10_SUPPORT_NPCS,
  getGuardFrameAt,
  getGuardFrameCell,
} from "./game/dungeon10/dungeon10Assets";
import { DUNGEON10_ENTRANCE_TIMELINE, runDungeon10BossEntrance } from "./game/dungeon10/dungeon10BossEntrance";
import {
  DUNGEON10_CREDIT_IMAGES,
  DUNGEON10_CREDIT_IMAGE_FADE_MS,
  DUNGEON10_CREDIT_SECTIONS,
  computeCreditTimeline,
  creditImageOpacity,
  resolveCreditText,
} from "./game/dungeon10/dungeon10Credits";
import { DUNGEON10_FINAL_TIMELINE, type Dungeon10FinalStep } from "./game/dungeon10/dungeon10FinalTimeline";
import { BOSS_QUIZ_QUESTION_COUNT } from "./game/bossCombat/BossQuizFlow";
import { DUNGEON10_DODGE_FAILURE_DAMAGE, DUNGEON10_WRONG_ANSWER_DAMAGE } from "./game/bossCombat/bossDamageBalance";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { resolveNpcStorySequence } from "./game/npc/npcStoryResolver";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { completeQuestStateAfterRewardClaim } from "./game/quest/questRewardCompletionResolver";
import { changeItemQuantity } from "./game/inventory/inventoryState";
import { supportsCrackedTiles } from "./three/dungeon/visuals/crackedTileResolver";
import { Dungeon10BossRoomCollapse, createCrackData } from "./three/dungeon/Dungeon10BossRoomCollapse";
import {
  FINAL_MAP_GROUND_Y,
  FINAL_MAP_PARTY_ORDER,
  computeFinalMapView,
  computeGuardOverlayTransform,
  createFinalMapLayout,
  guardFramePointToWorld,
} from "./three/finalMap/finalMapLayout";
import {
  DUNGEON10_CHECKPOINT_KEY,
  createDungeon10Checkpoint,
  readDungeon10Checkpoint,
  resolveDungeon10RestoreSave,
} from "./save/dungeon10Checkpoint";
import { validateCurrentSave } from "./save/saveSchema";
import { applySaveDataToGameState } from "./save/saveStateAdapter";
import { CURRENT_SAVE_VERSION } from "./save/saveTypes";
import { playDungeon10Sfx, stopAllDungeon10Sfx } from "./game/audio/dungeon10ProceduralSfx";
import type { StorySequence, StoryStep } from "./types/story";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon10 checks] ${message}`);
}

type ClickStep = Extract<StoryStep, { type: "dialogue" } | { type: "narration" }>;
const clickSteps = (sequence: StorySequence): ClickStep[] =>
  sequence.scenes.flatMap((scene) => scene.steps).filter((step): step is ClickStep => step.type === "dialogue" || step.type === "narration");
const describe = (step: ClickStep) => step.type === "narration"
  ? ["Narration", "", step.text]
  : [step.speakerName, step.expression ?? "default", step.text];
const QUEST_ID = "quest-floor-10-final-source";

/** The specification's dialogue, line by line (speaker, expression, text). */
const EXPECTED_OFFER: ReadonlyArray<readonly [string, string, string]> = [
  ["데네브", "angry", "(플레이어 이름), 이제 최종결전이군요. 준비는 되셨나요?"],
  ["데네브", "sad", "사실··· 저는 조금 두려워요."],
  ["데네브", "sad", "여러분과 함께하겠다는 저의 선택 때문에 여러분이 잘못된다면···"],
  ["데네브", "sad", "계속 악몽을 꿔요···. 그 꿈 속에서는, 저의 통제를 벗어난 괴물이 여러분을···."],
  ["데네브", "sad", "어쩌면 여러분의 제안을 거절하고, 계속 던전 안에서 그 괴물을 붙잡고 있었어야 했던 것이 아닐까 계속 생각하게 돼요."],
  ["테오", "sad", "··· 그런 말씀 마십시오."],
  ["테오", "sad", "데네브님의 희생을 발판으로 한 승리는 진정한 승리라고 볼 수 없지요."],
  ["루나", "sad", "데네브 대장, 줄곧 그런 슬픈 생각을 해 왔던 거야...?"],
  ["루나", "sad", "그런 건 싫어! 세상을 구하기 위해 소중한 동료가 희생하는 것을 지켜만 보라니···."],
  ["루나", "sad", "그리고 만약 우리가 잘못되더라도, 그게 데네브 대장 탓일 리 없잖아!"],
  ["아론", "sad", "···."],
  ["아론", "smile", "그리고 전, 저희가 할 수 있을 것이라 믿습니다."],
  ["아론", "smile", "데네브님을 잃고 난 후 7년 동안, 저희는 데네브님 구출만을 생각하며 단련해 왔습니다."],
  ["아론", "smile", "더는 데네브님께 짐이 되지 않을 것입니다."],
  ["카프", "sad", "···들었죠, 데네브."],
  ["카프", "sad", "다시는 그런 생각 하지 말아요. 또 그런 말을 하면 걷어 차 주겠어요."],
  ["데네브", "sad", "여러분···."],
  ["카프", "smile", "고맙다는 인사는 넣어둬요. 못다 한 말은 이곳을 나가고 하죠."],
  ["데네브", "smile", "···후후, 알겠어요."],
  ["데네브", "angry", "여러분 덕분에, 저도 이제 준비가 되었어요."],
  ["데네브", "angry", "고맙다는 말은, 괴물을 무찌른 후에 하겠습니다."],
  ["데네브", "angry", "갑시다! 던전의 심장으로!"],
];

const EXPECTED_SEGMENT_SPEAKERS: Readonly<Record<Dungeon10FinalSegmentId, string>> = {
  afterBattle: "루나/angry 루나/angry 테오/angry 카프/angry",
  charging: "아론/angry 아론/angry 아론/angry 테오/angry 데네브/angry 데네브/angry",
  counter: "데네브/angry",
  fled: "테오/surprised 아론/angry",
  collapse: "데네브/angry 데네브/angry 카프/default 데네브/smile 데네브/smile 데네브/smile",
  exit: "루나/default 테오/smile",
  farewell01: "루나/smile 테오/smile 루나/smile 루나/smile 테오/smile 테오/smile 테오/smile 테오/smile",
  farewell02: "아론/smile 카프/smile 아론/smile 카프/smile 카프/smile 아론/smile 카프/smile",
  farewell03: "데네브/smile",
  farewell04: Array.from({ length: 12 }, () => "데네브/smile").join(" "),
  narration: "Narration/ Narration/ Narration/ Narration/",
};

const EXPECTED_CREDITS = [
  "ADVENTURE ACADEMY", "어드벤처 아카데미",
  "기획 · 제작", "[고구마맛탕탕]",
  "GAME DESIGN", "게임 기획", "학습 콘텐츠 설계", "스토리 및 퀘스트 구성", "전투 및 던전 시스템 설계", "[고구마맛탕탕]",
  "DEVELOPMENT", "게임 프로그래밍", "UI / UX 구현", "게임 시스템 개발", "[고구마맛탕탕]",
  "ART & DESIGN", "캐릭터 디자인", "몬스터 디자인", "배경 및 던전 디자인", "UI 디자인", "아이템 및 이펙트 디자인", "[고구마맛탕탕]",
  "STORY", "세계관 설정", "시나리오", "캐릭터 및 대사", "[고구마맛탕탕, 해장국밥]",
  "EDUCATIONAL CONTENT", "학습 콘텐츠 기획", "문제 및 해설 제작", "교육과정 연계", "[고구마맛탕탕, 해장국밥]",
  "MUSIC & SOUND", "Background Music", "Sound Effects", "[Eleven labs]",
  "SPECIAL THANKS", "이 모험을 함께해 준", "모든 학생들에게", "그리고", "끝까지 이 이야기를 플레이해 준", "당신에게.",
  "ADVENTURE ACADEMY",
  "정찰 담당", "「루나」",
  "보급 담당", "「테오」",
  "전투 및 부지휘관", "「카프」",
  "지휘관", "「아론」",
  "되돌아온 영웅", "「데네브」",
  "주인공", "「(플레이어 이름)」",
];

function checkQuestAndStories() {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === QUEST_ID);
  assert(quest && quest.targetFloorId === "floor-10", "existing Dungeon10 quest id kept");
  assert(FLOOR_DEFINITIONS.some((floor) => floor.id === "floor-10" && floor.questId === QUEST_ID && floor.title === "10층"), "existing floor-10 id and title kept");
  assert(DUNGEON_FLOOR_TITLES.some((entry) => entry.floorId === "floor-10" && entry.title === "던전 10층"), "existing Dungeon10 display title kept");
  assert(quest.giverNpcId === "denebCommander" && quest.turnInNpcId === undefined && !quest.completeStorySequenceId, "Deneb gives the quest; no completion NPC");
  assert(NPC_BY_ID.denebCommander.offeredQuestIds.includes(QUEST_ID), "Deneb offers Dungeon10");
  assert(!NPC_BY_ID.kaiden.offeredQuestIds.includes(QUEST_ID), "Aron no longer offers Dungeon10");
  const unlocked = completeQuestStateAfterRewardClaim({ "quest-floor-9-goryeo-society-culture": "active", [QUEST_ID]: "locked" }, "quest-floor-9-goryeo-society-culture");
  assert(unlocked[QUEST_ID] === "available", "Dungeon9 reward claim makes Dungeon10 available");
  const debug = createDebugFloorJumpState("floor-10");
  assert(debug.questState[QUEST_ID] === "available" && debug.clearedFloorIds.length === 9, "debug jump keeps Dungeon1~9 complete");
  assert(resolveNpcStorySequence("denebCommander", debug.questState) === DUNGEON10_QUEST_OFFER_STORY_ID, "Deneb starts the Dungeon10 offer");
  assert(NPC_STORY_SEQUENCES[quest.offerStorySequenceId] === DUNGEON10_QUEST_OFFER_STORY, "offer story registered");
  assert(quest.activeStorySequenceId && NPC_STORY_SEQUENCES[quest.activeStorySequenceId], "active story registered");
  assert(!quest.acceptStorySequenceId, "no auto-story replaces the accept button");

  const offer = clickSteps(DUNGEON10_QUEST_OFFER_STORY);
  assert(offer.length === 22, "offer story is exactly 22 click steps");
  offer.forEach((step, index) => {
    assert(step.type === "dialogue" && step.advanceMode === "click", `offer step ${index + 1} is a click dialogue`);
    assert(JSON.stringify(describe(step)) === JSON.stringify(EXPECTED_OFFER[index]), `offer step ${index + 1} text/speaker/expression`);
  });
  assert(DUNGEON10_QUEST_OFFER_STORY.dialogueSkip === true, "ordinary skip still opens the quest popup");

  const entry = clickSteps(DUNGEON10_ENTRY_STORY);
  assert(entry.length === 3 && entry.every((step) => step.type === "dialogue" && step.speakerName === "데네브" && step.expression === "angry"), "start-room story: 3 Deneb lines");
  assert(entry[2]!.text === "준비를 단단히 하고 나아가요, (플레이어 이름).", "start-room final line");

  let finalCount = 0;
  for (const [segmentId, expected] of Object.entries(EXPECTED_SEGMENT_SPEAKERS) as Array<[Dungeon10FinalSegmentId, string]>) {
    const sequence = DUNGEON10_FINAL_SEGMENTS[segmentId];
    const steps = clickSteps(sequence);
    finalCount += steps.length;
    assert(steps.map((step) => describe(step).slice(0, 2).join("/")).join(" ") === expected, `final segment ${segmentId} speakers/expressions`);
    assert(sequence.dialogueSkip === false && !sequence.skipTarget && sequence.skippable === false, `final segment ${segmentId} cannot be skipped`);
    assert(steps.every((step) => step.advanceMode === "click" && !step.text.includes("\n")), `final segment ${segmentId}: one quote per click`);
  }
  assert(finalCount === 53, "final story total click steps");
  const farewell02 = clickSteps(DUNGEON10_FINAL_SEGMENTS.farewell02).map((step) => step.text);
  assert(farewell02[3] === "저도 마찬가지예요. 무엇보다 당신 덕분에 데네브를" && farewell02[4] === "제 소중한 친구를 구할 수 있었어요. 정말 고마워요.", "split quotes stay separate");
  assert(clickSteps(DUNGEON10_FINAL_SEGMENTS.narration).every((step) => step.type === "narration"), "narration has no portrait");
}

async function checkEntrance() {
  assert(DUNGEON10_MAP.rooms.length === 2 && DUNGEON10_MAP.startRoomId === DUNGEON10_START_ROOM_ID, "start and boss rooms only");
  assert(DUNGEON10_MAP.connections.length === 1 && DUNGEON10_MAP.connections[0]!.toRoomId === DUNGEON10_BOSS_ROOM_ID && DUNGEON10_MAP.connections[0]!.directionFromSource === "forward", "forward leads to the boss room");
  assert(!supportsCrackedTiles("floor-10") && supportsCrackedTiles("floor-8") && supportsCrackedTiles("floor-9"), "Dungeon8·9 cracked tiles untouched");
  const order = DUNGEON10_ENTRANCE_TIMELINE.map((step) => "durationMs" in step ? `${step.action}:${step.durationMs}` : step.action).join(" ");
  assert(order === "hold:2000 cameraShake:2000 crack1 hold:1000 crack2 hold:2000 shatter bossAppear combat", "entrance order and timing");
  const calls: string[] = [];
  const done = await runDungeon10BossEntrance({
    hold: async (ms) => { calls.push(`hold:${ms}`); },
    cameraShake: async (ms) => { calls.push(`shake:${ms}`); },
    crack1: () => calls.push("crack1"),
    crack2: () => calls.push("crack2"),
    shatter: () => calls.push("shatter"),
    bossAppear: async () => { calls.push("boss"); },
    combat: () => calls.push("combat"),
  }, () => false);
  assert(done && calls.join(",") === "hold:2000,shake:2000,crack1,hold:1000,crack2,hold:2000,shatter,boss,combat", "each beat exactly once, in order");
  assert(calls.filter((call) => call.startsWith("crack")).length === 2 && calls.filter((call) => call === "shatter").length === 1, "two cracks and one shatter");
  let cancel = false;
  const cancelledCalls: string[] = [];
  const cancelled = await runDungeon10BossEntrance({
    hold: async () => { cancel = true; },
    cameraShake: async () => { cancelledCalls.push("shake"); },
    crack1: () => cancelledCalls.push("crack1"), crack2: () => cancelledCalls.push("crack2"),
    shatter: () => cancelledCalls.push("shatter"), bossAppear: async () => { cancelledCalls.push("boss"); },
    combat: () => cancelledCalls.push("combat"),
  }, () => cancel);
  assert(!cancelled && cancelledCalls.length === 0, "unmount/cancel stops the remaining beats");
}

function checkCollapse() {
  const crackA = createCrackData("seed:surface-1", 10 / 6);
  const crackB = createCrackData("seed:surface-1", 10 / 6);
  assert(JSON.stringify(crackA) === JSON.stringify(crackB), "crack data is deterministic");
  const count = (stage: typeof crackA.crack1) => stage.polylines.reduce((sum, line) => sum + line.points.length, 0);
  assert(crackA.crack2.polylines.length > crackA.crack1.polylines.length && count(crackA.crack2) > count(crackA.crack1) * 2, "stage 2 has more and longer cracks");
  assert(crackA.crack1.polylines.every((line) => crackA.crack2.polylines.some((other) => JSON.stringify(other.points.slice(0, line.points.length)) === JSON.stringify(line.points))), "stage 2 grows from stage 1 geometry");
  assert(JSON.stringify(crackA.crack1) !== JSON.stringify(crackA.crack2), "stages use different crack data");
  for (let index = 0; index < 300; index += 1) {
    const sample = createCrackData(`sweep:${index}`, [10 / 6, 1, 0.3, 3][index % 4]!);
    const inside = (line: { points: Array<readonly [number, number]> }) => line.points.every(([x, y]) => x >= 0 && x <= 1 && y >= 0 && y <= 1);
    assert(sample.crack1.polylines.length > 0 && count(sample.crack2) > count(sample.crack1), `crack data valid for seed ${index}`);
    assert(sample.crack2.polylines.every(inside) && sample.crack1.polylines.every(inside), `cracks stay on the surface for seed ${index}`);
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();
  const room = new THREE.Group();
  const wallMaterial = new THREE.MeshBasicMaterial();
  const ceilingMaterial = new THREE.MeshBasicMaterial();
  const floorMaterial = new THREE.MeshBasicMaterial();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), floorMaterial);
  floor.position.set(0, -3, 0); floor.rotation.set(-Math.PI / 2, 0, 0);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), ceilingMaterial);
  ceiling.position.set(0, 3, 0); ceiling.rotation.set(Math.PI / 2, 0, 0);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(10, 6), wallMaterial);
  wall.position.set(0, 0, -5);
  room.add(floor, ceiling, wall);
  room.scale.set(3, 3, 3);
  scene.add(room);
  const baseline = scene.children.length;
  for (let round = 0; round < 2; round += 1) {
    const collapse = new Dungeon10BossRoomCollapse(scene, camera, room, "floor-10:check", 1);
    const stage = (): string => collapse.currentStage;
    const batches = (): number => collapse.fragmentBatchCount;
    assert(collapse.surfaceCount === 2, "walls and ceiling collapse; the floor stays");
    assert(!collapse.spaceVisible, "space hidden before the shatter");
    collapse.setStage("crack1");
    assert(stage() === "crack1" && !collapse.spaceVisible, "crack 1 keeps the room intact");
    collapse.setStage("crack2");
    collapse.shatter();
    assert(stage() === "shattered" && collapse.spaceVisible, "shatter reveals space");
    assert(!wall.visible && !ceiling.visible && floor.visible, "walls/ceiling removed, floor kept for movement");
    assert(batches() === 2, "one fragment batch (draw call) per surface material");
    collapse.shatter();
    assert(batches() === 2, "a second shatter call is ignored");
    collapse.update(performance.now() + 10_000);
    assert(batches() === 0, "fragments removed after the animation");
    collapse.reset();
    assert(wall.visible && ceiling.visible && !collapse.spaceVisible, "reset restores the room");
    collapse.dispose();
    assert(scene.children.length === baseline, "dispose leaves no space/fragment objects behind");
  }
}

function checkBossCombatAndHelp() {
  assert(BOSS_QUIZ_QUESTION_COUNT === 20 && DUNGEON10_WRONG_ANSWER_DAMAGE === 44 && DUNGEON10_DODGE_FAILURE_DAMAGE === 24, "existing BossCombat question count and damage unchanged");
  assert(DUNGEON10_BOSS_NAME === "굶주린 역사 포식자", "boss name");
  assert(DUNGEON10_SUPPORT_NPCS.map((npc) => npc.id).join(",") === "deneb,karp,aron", "help candidates: Deneb, Karp, Aron only");
  assert(DUNGEON10_SUPPORT_NPCS.every((npc) => !/kaiden|luna|theo/.test(npc.imageUrl)), "no Kaiden/Luna/Theo help PNG");
  assert(DUNGEON10_MAX_SUPPORT_COUNT === 2, "help at most twice");
}

function stepKey(step: Dungeon10FinalStep): string {
  switch (step.kind) {
    case "story": return `story:${step.segment}`;
    case "illustIn": return `in:${step.imageUrl.split("/").pop()}`;
    case "wait": return `wait:${step.durationMs}`;
    case "bossShakeWithRoar": return `shake:${step.shakeMs}`;
    case "cameraShake": return `camera:${step.durationMs}`;
    default: return step.kind;
  }
}

function checkFinalTimeline() {
  const keys = DUNGEON10_FINAL_TIMELINE.map(stepKey);
  const expected = [
    "coverIn", "mapPrepare", "mapFadeIn", "wait:2000", "story:afterBattle",
    "chargingSfx", "bossCharging", "wait:1500", "story:charging",
    "guardVfx", "story:counter",
    "attackButton", "hitSfx", "shake:3000", "bossFadeOut", "stopBossBgm", "story:fled",
    "camera:2000", "story:collapse",
    "backdropIn", "disposeMap", "endingBgm", "in:dungeon-exit.png", "story:exit",
    "illustOut", "wait:500", "in:farewell01.png", "story:farewell01",
    "illustOut", "wait:500", "in:farewell02.png", "story:farewell02",
    "illustOut", "wait:500", "in:farewell03.png", "wait:1500", "story:farewell03",
    "illustOut", "wait:500", "in:farewell04.png", "wait:1500", "story:farewell04",
    "illustOut", "wait:500", "in:farewell03.png", "wait:1500", "story:narration",
    "illustOut", "credits",
  ];
  assert(JSON.stringify(keys) === JSON.stringify(expected), `final timeline order\n${keys.join(" ")}`);
  assert(keys.filter((key) => key === "attackButton").length === 1 && keys.filter((key) => key === "hitSfx").length === 1, "single attack button and hit SFX");
  assert(keys.at(-1) === "credits", "credits last");
  assert(DENEB_GUARD_SHEET.frameCount === 24 && DENEB_GUARD_SHEET.columns * DENEB_GUARD_SHEET.rows === 24 && DENEB_GUARD_SHEET.columns * DENEB_GUARD_SHEET.frameWidth === DENEB_GUARD_SHEET.width && DENEB_GUARD_SHEET.rows * DENEB_GUARD_SHEET.frameHeight === DENEB_GUARD_SHEET.height, "1920x720 sheet of 6x4 320x180 frames");
  assert(DENEB_GUARD_DURATION_MS === 3000, "24 frames at 8 fps ≈ 3 s");
  assert(getGuardFrameAt(0) === 0 && getGuardFrameAt(124) === 0 && getGuardFrameAt(125) === 1 && getGuardFrameAt(2999) === 23 && getGuardFrameAt(3000) === null, "frame timing and single playthrough");
  assert(JSON.stringify(getGuardFrameCell(0)) === "[0,0]" && JSON.stringify(getGuardFrameCell(5)) === "[5,0]" && JSON.stringify(getGuardFrameCell(6)) === "[0,1]" && JSON.stringify(getGuardFrameCell(23)) === "[5,3]", "left→right, top→bottom order");
}

function checkFinalLayout() {
  const layout = createFinalMapLayout();
  const sprites = [...FINAL_MAP_PARTY_ORDER.map((id) => layout.party[id]), layout.bossStanding, layout.bossCharging];
  assert(sprites.every((sprite) => Math.abs(sprite.footY - FINAL_MAP_GROUND_Y) < 1e-9), "every alpha foot row sits on the ground line");
  const centers = FINAL_MAP_PARTY_ORDER.map((id) => (layout.party[id].visibleLeft + layout.party[id].visibleRight) / 2);
  assert(centers.every((value, index) => index === 0 || value > centers[index - 1]!), "Theo, Luna, Karp, Aron, Deneb from left to right");
  assert(layout.bossStanding.visibleLeft > layout.party.deneb.visibleRight, "the devourer stands on the right");
  assert(layout.bossCharging.unitsPerPixel === layout.bossStanding.unitsPerPixel && Math.abs(layout.bossCharging.centerX - layout.bossStanding.centerX) < 1e-9 && layout.bossCharging.planeWidth === layout.bossStanding.planeWidth, "charging keeps position, size and aspect");
  const transform = computeGuardOverlayTransform(layout);
  const beam = guardFramePointToWorld(transform, DENEB_GUARD_SHEET.beamStartPx);
  const barrier = guardFramePointToWorld(transform, DENEB_GUARD_SHEET.barrierPx);
  assert(Math.hypot(beam.x - layout.mouth.x, beam.y - layout.mouth.y) < 1e-6, "beam starts at the charging mouth");
  assert(Math.hypot(barrier.x - layout.barrier.x, barrier.y - layout.barrier.y) < 1e-6 && layout.barrier.x > layout.party.deneb.visibleRight, "barrier stands in front of Deneb");
  assert(transform.scale > 0 && Math.abs(transform.rotation) < Math.PI / 4, "uniform scale overlay, no distortion");
  for (const aspect of [16 / 9, 4 / 3, 1, 9 / 19.5]) {
    const view = computeFinalMapView(layout, aspect);
    assert(view.left <= layout.contentLeft && view.right >= layout.contentRight && view.top >= layout.contentTop && Math.abs(view.viewWidth / view.viewHeight - aspect) < 1e-9, `whole cast visible at aspect ${aspect.toFixed(2)}`);
  }
}

function checkCredits() {
  const lines = DUNGEON10_CREDIT_SECTIONS.flatMap((section) => section.lines.filter((line) => line.role !== "spacer").map((line) => line.text));
  assert(JSON.stringify(lines) === JSON.stringify(EXPECTED_CREDITS), "credit text verbatim");
  assert(DUNGEON10_CREDIT_SECTIONS.at(-1)!.key === "hero" && resolveCreditText("「(플레이어 이름)」", "홍길동") === "「홍길동」", "player name is the final credit");
  assert(JSON.stringify(DUNGEON10_CREDIT_IMAGES) === JSON.stringify([
    DUNGEON10_ASSET_URLS.creditReturn, DUNGEON10_ASSET_URLS.creditTheoLuna, DUNGEON10_ASSET_URLS.creditAron, DUNGEON10_ASSET_URLS.creditKarp, DUNGEON10_ASSET_URLS.creditDeneb,
  ]), "right-side image order");
  const timeline = computeCreditTimeline({ viewportHeight: 720, finalSectionTop: 6000, finalSectionHeight: 300, imageStartTop: 400, imageEndAt: 6000 });
  assert(Math.abs(timeline.imageSliceMs * 5 - (timeline.imageEndMs - timeline.imageStartMs)) < 1e-6, "five equal image slots");
  for (let t = timeline.imageStartMs + DUNGEON10_CREDIT_IMAGE_FADE_MS; t < timeline.imageEndMs - DUNGEON10_CREDIT_IMAGE_FADE_MS; t += 50) {
    const total = DUNGEON10_CREDIT_IMAGES.reduce((sum, _url, index) => sum + creditImageOpacity(timeline, index, t), 0);
    assert(total > 0.45, `no empty gap between credit images at ${Math.round(t)}ms`);
  }
  assert(DUNGEON10_CREDIT_IMAGES.every((_url, index) => creditImageOpacity(timeline, index, timeline.imageEndMs + 1) === 0), "images gone for the hero credit");
  assert(timeline.scrollMs > timeline.imageEndMs, "the hero credit arrives after the images");
}

function checkCheckpoint() {
  const base = createDebugFloorJumpState("floor-10", "체크");
  const withCheckpoint = createDungeon10Checkpoint(base);
  assert(Boolean(withCheckpoint.checkpointByStoryId[DUNGEON10_CHECKPOINT_KEY]), "checkpoint created before the offer story");
  const stored = readDungeon10Checkpoint(withCheckpoint);
  assert(stored && stored.version === CURRENT_SAVE_VERSION && !stored.story.checkpointByStoryId[DUNGEON10_CHECKPOINT_KEY], "checkpoint is a valid v7 save without nesting");
  const active = { ...withCheckpoint, questState: { ...withCheckpoint.questState, [QUEST_ID]: "active" as const } };
  // Progress made during Dungeon10 must never reach the restored save.
  const spent = {
    ...active,
    currentFloorId: "floor-10",
    playerState: { ...active.playerState, currentHp: 1, gold: active.playerState.gold + 500 },
    inventoryState: changeItemQuantity(active.inventoryState, "potion-small", -1),
  };
  assert(createDungeon10Checkpoint(spent) === spent, "active quest never overwrites the checkpoint");
  const restoredA = resolveDungeon10RestoreSave(spent);
  const restoredB = resolveDungeon10RestoreSave(spent);
  assert(validateCurrentSave(restoredA) !== null && restoredA.version === CURRENT_SAVE_VERSION, "restored save passes the unchanged schema");
  assert(restoredA.quests.statuses[QUEST_ID] === "available" && restoredA.quests.activeQuestId === null, "quest available, not accepted");
  assert(restoredA.dungeon.currentFloorId === null && restoredA.dungeon.currentFloorRun === null, "player returns to BaseCamp");
  assert(restoredA.player.currentHp === stored.player.currentHp && restoredA.player.gold === stored.player.gold, "HP/Gold come from the checkpoint");
  assert(JSON.stringify(restoredA.inventory) === JSON.stringify(stored.inventory), "potions/inventory come from the checkpoint");
  assert(restoredA.dungeon.clearedFloorIds.length === 9 && restoredA.quests.statuses["quest-floor-9-goryeo-society-culture"] === "completed", "Dungeon1~9 progress kept");
  assert(JSON.stringify({ ...restoredA, savedAt: "" }) === JSON.stringify({ ...restoredB, savedAt: "" }), "restoring twice yields the same save");
  const game = applySaveDataToGameState(restoredA);
  assert(game.questState[QUEST_ID] === "available" && !game.checkpointByStoryId[DUNGEON10_CHECKPOINT_KEY], "continue resumes before the quest, without the ending");
  const corrupted = { ...spent, checkpointByStoryId: { ...spent.checkpointByStoryId, [DUNGEON10_CHECKPOINT_KEY]: "{broken" } };
  const fallback = resolveDungeon10RestoreSave(corrupted);
  assert(validateCurrentSave(fallback) && fallback.quests.statuses[QUEST_ID] === "available" && fallback.dungeon.clearedFloorIds.length === 9, "corrupted checkpoint falls back safely");
}

function checkProceduralSfx() {
  // Without an AudioContext (node) the synthesized SFX are safe no-ops.
  const handle = playDungeon10Sfx("charging");
  handle.stop(10);
  stopAllDungeon10Sfx();
}

export async function runDungeon10ContentChecks(): Promise<void> {
  checkQuestAndStories();
  await checkEntrance();
  checkCollapse();
  checkBossCombatAndHelp();
  checkFinalTimeline();
  checkFinalLayout();
  checkCredits();
  checkCheckpoint();
  checkProceduralSfx();
}
