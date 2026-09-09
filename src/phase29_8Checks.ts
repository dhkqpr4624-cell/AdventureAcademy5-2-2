import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { DUNGEON3_FLASHBACK } from "./data/stories/dungeon3Chapter2Stories";
import { DUNGEON4_ENTRY_STORY, DUNGEON4_FINAL_STORY } from "./data/stories/dungeon4Chapter2Stories";
import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { allocateDungeonRunQuestions } from "./game/dungeon/dungeonRunQuestionAllocator";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import type { FloorId } from "./game/floor/floorTypes";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { MONSTER_VISUAL_DEFINITIONS } from "./game/monster/monsterDefinitions";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { applyFloorMonsterData, prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";
import { createDungeon4SeaEnvironment } from "./three/dungeon/Dungeon4SeaEnvironment";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[phase29_8Checks] ${message}`);
}

export function runPhase29_8Checks(): void {
  const flashbackSteps = DUNGEON3_FLASHBACK.scenes.flatMap((scene) => scene.steps);
  const insertedIds = Array.from({ length: 10 }, (_, index) => `r-14${String.fromCharCode(97 + index)}`);
  const insertionStart = flashbackSteps.findIndex((step) => step.id === "r-14a");
  assert(flashbackSteps.findIndex((step) => step.id === "r-14") + 1 === insertionStart, "Dungeon 3 added dialogue insertion point mismatch");
  assert(insertedIds.every((id, index) => flashbackSteps[insertionStart + index]?.id === id), "Dungeon 3 added dialogue order mismatch");
  assert(flashbackSteps[insertionStart + 10]?.id === "r-15", "Dungeon 3 dialogue must continue to r-15");
  const r15 = flashbackSteps.find((step) => step.id === "r-15");
  assert(r15?.type === "dialogue" && r15.text === " 난 괜찮아요. ", "Dungeon 3 continuation dialogue mismatch");

  const floorIds: FloorId[] = ["floor-1", "floor-2", "floor-3", "floor-4"];
  for (const floorId of floorIds) {
    const floor = FLOOR_DEFINITIONS.find((entry) => entry.id === floorId);
    assert(floor, `${floorId} definition missing`);
    const run = createDungeonRun(floorId, `phase29-8-${floorId}`);
    assert(run.source === "generated", `${floorId} must use generated map`);
    const map = prepareFloorDungeonMap(run.map, floorId, run.seed);
    const assignments = allocateDungeonRunQuestions(map, run.seed, floorId);
    const assignedCount = Object.values(assignments).reduce((sum, questions) => sum + questions.length, 0);
    assert(assignedCount === floor.questionCount, `${floorId} question count mismatch`);
    assert(new Set(Object.values(assignments).flat().map((question) => question.id)).size === assignedCount, `${floorId} questions must not repeat`);
  }

  const floor3Title = DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === "floor-3");
  const floor4Title = DUNGEON_FLOOR_TITLES.find((entry) => entry.floorId === "floor-4");
  assert(floor3Title?.subtitle === "조선시대의 문화(학문 및 과학)", "floor 3 title mismatch");
  assert(floor4Title?.subtitle === "임진왜란과 병자호란", "floor 4 title mismatch");

  const floor3Run = createDungeonRun("floor-3", "phase29-8-floor3-monsters");
  const floor3Map = applyFloorMonsterData(prepareFloorDungeonMap(floor3Run.map, "floor-3", floor3Run.seed), floor3Run.seed, "floor-3");
  const normalMonsterIds = floor3Map.rooms.filter((room) => room.type === "combat").map((room) => room.combatConfig?.monsterId);
  const eliteMonsterIds = floor3Map.rooms.filter((room) => room.type === "elite").map((room) => room.eliteConfig?.monsterId);
  assert(normalMonsterIds.every((id) => id === "chapter2-broken-angbuilgu"), "floor 3 normal monster roster mismatch");
  assert(eliteMonsterIds.every((id) => id === "chapter2-corrupted-armillary-sphere"), "floor 3 elite monster mismatch");
  assert(Boolean(MONSTER_VISUAL_DEFINITIONS["chapter2-broken-angbuilgu"]), "Dungeon 3 normal monster missing");
  assert(Boolean(MONSTER_VISUAL_DEFINITIONS["chapter2-corrupted-armillary-sphere"]), "Dungeon 3 elite monster missing");

  const floor4Run = createDungeonRun("floor-4", "phase29-8-floor4-story");
  const floor4Map = prepareFloorDungeonMap(floor4Run.map, "floor-4", floor4Run.seed);
  assert(!floor4Map.rooms.some((room) => room.id.startsWith("room-story-")), "floor 4 must not contain story rooms");
  assert(Boolean(floor4Run.generatedDungeon?.finalQuestRoomId), "floor 4 final quest room missing");
  assert(floor4Map.connections.length === floor4Map.rooms.length - 1, "floor 4 must be a single chain");
  assert(floor4Map.connections.every((connection) => connection.directionFromSource === "forward" && connection.directionFromTarget === "back"), "floor 4 must expose only forward/back routes");
  assert(floor4Map.rooms.every((room) => floor4Map.connections.filter((connection) => connection.fromRoomId === room.id || connection.toRoomId === room.id).length <= 2), "floor 4 must not branch");

  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-4-jeon-rescue");
  assert(quest?.giverNpcId === "kaiden" && quest.turnInNpcId === "theo" && quest.targetFloorId === "floor-4", "floor 4 quest linkage mismatch");
  assert(Boolean(NPC_STORY_SEQUENCES["npc-aron-floor-4-quest-available"]), "floor 4 offer story missing");
  assert(Boolean(NPC_STORY_SEQUENCES["npc-theo-floor-4-quest-complete"]), "floor 4 completion story missing");
  assert(NPC_STORY_SEQUENCES["npc-aron-floor-4-quest-available"].scenes[0].steps.filter((step) => step.type === "dialogue").length === 4, "floor 4 offer story must have four dialogues");
  assert(NPC_STORY_SEQUENCES["npc-theo-floor-4-quest-complete"].scenes[0].steps.filter((step) => step.type === "dialogue").length === 4, "floor 4 completion story must have four dialogues");
  assert(NPC_BY_ID.jeon.dialogue.defaultStorySequenceId === "npc-jeon-default", "Jeon idle story missing");
  assert(getItemDefinition("weapon-chiljido")?.name === "충무공(이순신) 장검 모양 지팡이", "Dungeon 4 weapon reward name mismatch");
  assert(getItemDefinition("weapon-chiljido")?.attackVfxId === "water-thunderbolt", "Dungeon 4 weapon VFX mapping missing");
  const dungeon4Steps = DUNGEON4_FINAL_STORY.scenes.flatMap((scene) => scene.steps);
  const dungeon4EntrySteps = DUNGEON4_ENTRY_STORY.scenes.flatMap((scene) => scene.steps);
  assert(dungeon4EntrySteps.length === 4 && dungeon4EntrySteps.every((step) => step.type === "dialogue"), "Dungeon 4 entry story must contain four dialogues");
  assert(dungeon4Steps.filter((step) => step.type === "choice").length === 2, "Dungeon 4 final story must have two choices");
  const gwakWrong = dungeon4Steps.find((step) => step.id === "gwak-wrong");
  const yiWrong = dungeon4Steps.find((step) => step.id === "yi-wrong");
  assert(gwakWrong?.type === "dialogue" && gwakWrong.nextStepId === "gwak-choice", "Gwak wrong answer must repeat its choice");
  assert(yiWrong?.type === "dialogue" && yiWrong.nextStepId === "yi-choice", "Yi wrong answer must repeat its choice");
  assert(DUNGEON4_FINAL_STORY.dialogueSkip === true, "Dungeon 4 final story must support generic skip");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-3-guaranteed-reward" && entry.rewardItemId === "armor-angbuilgu-helmet"), "Dungeon 3 guaranteed reward achievement missing");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-4-rare-reward" && entry.rewardItemId === "weapon-chiljido"), "Dungeon 4 rare reward achievement missing");
  const seaEnvironment = createDungeon4SeaEnvironment(floor4Map);
  assert(Boolean(seaEnvironment.root.getObjectByName("Dungeon4DistantIsland-1")), "existing Dungeon 4 triangular island missing");
  assert(Boolean(seaEnvironment.root.getObjectByName("Dungeon4DistantLandGroup")), "Dungeon 4 distant land group missing");
  assert(seaEnvironment.root.children.filter((child) => child.name === "Dungeon4DistantLandGroup").length === 1, "Dungeon 4 distant land group duplicated");
  seaEnvironment.dispose();
}
