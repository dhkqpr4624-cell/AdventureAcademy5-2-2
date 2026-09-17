import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { DUNGEON8_CLUE_STORIES, DUNGEON8_ENTRY_STORY, DUNGEON8_FINAL_STORY } from "./data/stories/dungeon8Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { POWERFUL_IMPACT_VFX } from "./game/combat/attackVfxDefinitions";
import { TEST_DUNGEON_MAP } from "./game/dungeon/testDungeonMap";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { getItemQuantity } from "./game/inventory/inventoryState";
import { getMonsterVisualDefinition } from "./game/monster/monsterDefinitions";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { completeQuestStateAfterRewardClaim } from "./game/quest/questRewardCompletionResolver";
import { getQuestRareRewardCondition } from "./game/quest/questRareRewardConditions";
import { prepareFloorDungeonMap, selectDungeon8StoryRoomIds } from "./screens/DungeonScreen/DungeonScreen";
import { getSwordDefinitionForEquippedItem } from "./three/weapon/SwordViewModel";
import { selectCrackedTileSlot, supportsCrackedTiles } from "./three/dungeon/visuals/crackedTileResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon8 content checks] ${message}`);
}
function dialogues(sequence: { scenes: ReadonlyArray<{ steps: ReadonlyArray<{ type: string }> }> }) {
  return sequence.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue");
}
function distances(map: typeof TEST_DUNGEON_MAP, startId: string) {
  const result = new Map<string, number>([[startId, 0]]);
  const queue = [startId];
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]!;
    for (const edge of map.connections) {
      const next = edge.fromRoomId === current ? edge.toRoomId : edge.toRoomId === current ? edge.fromRoomId : null;
      if (next && !result.has(next)) { result.set(next, result.get(current)! + 1); queue.push(next); }
    }
  }
  return result;
}

export function runDungeon8ContentChecks(): void {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-8-goryeo-relations");
  assert(quest?.giverNpcId === "denebCommander" && quest.turnInNpcId === "denebCommander", "giver/turn-in must both be Deneb");
  assert(quest?.targetFloorId === "floor-8" && quest.title === "개항 전후의 조선 (2)", "floor 8 quest registration");
  assert(NPC_BY_ID.denebCommander.offeredQuestIds.includes(quest.id), "Deneb must offer Dungeon8");
  assert(FLOOR_DEFINITIONS.some((entry) => entry.id === "floor-8" && entry.title === "8층"), "floor 8 entrance label");
  assert(DUNGEON_FLOOR_TITLES.some((entry) => entry.floorId === "floor-8" && entry.subtitle === "개항 전후의 조선 (2)"), "floor 8 internal title");
  const offer = NPC_STORY_SEQUENCES[quest.offerStorySequenceId];
  assert(Boolean(offer) && dialogues(offer).length === 19, "offer story must have 19 click dialogues");
  const offerSteps = offer.scenes.flatMap((scene) => scene.steps);
  const portalIn = offerSteps.findIndex((step) => step.id === "floor8-portal-in");
  const portalWait = offerSteps.findIndex((step) => step.id === "floor8-portal-hold");
  const portalOut = offerSteps.findIndex((step) => step.id === "floor8-portal-out");
  assert(portalIn >= 0 && portalIn < portalWait && portalWait < portalOut, "portal fade/wait order");
  assert(Boolean(quest.completeStorySequenceId && NPC_STORY_SEQUENCES[quest.completeStorySequenceId]), "completion story missing");
  assert(dialogues(NPC_STORY_SEQUENCES[quest.completeStorySequenceId!]).length === 4, "completion story dialogue count");
  assert(dialogues(DUNGEON8_ENTRY_STORY).length === 3, "entry story dialogue count");
  assert(DUNGEON8_CLUE_STORIES.length === 2, "exactly two event stories");
  assert(dialogues(DUNGEON8_CLUE_STORIES[0]!).length === 14 && dialogues(DUNGEON8_CLUE_STORIES[1]!).length === 17, "event dialogue counts");
  const finalSteps = DUNGEON8_FINAL_STORY.scenes.flatMap((scene) => scene.steps);
  assert(dialogues(DUNGEON8_FINAL_STORY).length === 19, "final story dialogue count");
  const choice = finalSteps.find((step) => step.type === "choice");
  assert(choice?.type === "choice" && choice.options.length === 2 && choice.options.every((option) => option.nextStepId === "d8-final-15"), "both choices must converge without scoring");

  assert(getMonsterVisualDefinition("khitan-soldier-spirit").name === "균열 침식 청나라 병사", "normal monster");
  assert(getMonsterVisualDefinition("mongol-general-armor").name === "균열 침식 일반군 병사", "elite monster");
  const item = getItemDefinition("weapon-choe-museon-cannon");
  assert(item?.name === "동학농민군 죽창" && item.type === "weaponSkin" && item.attackVfxId === "powerful-impact", "item/VFX mapping");
  assert(getSwordDefinitionForEquippedItem("weapon-choe-museon-cannon").id === "donghak-bamboo-spear", "weapon view model");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-8-rare-reward" && entry.rewardItemId === item.id), "achievement mapping");
  assert(getQuestRareRewardCondition(quest.id).requiredCorrect === 9, "existing rare threshold must remain 9/10");
  assert(POWERFUL_IMPACT_VFX.sheetWidth === 800 && POWERFUL_IMPACT_VFX.frameWidth === 100 && POWERFUL_IMPACT_VFX.frameCount === 8 && POWERFUL_IMPACT_VFX.durationMs === 1000, "powerful VFX geometry/timing");

  const generated = createDungeonRun("floor-8", "dungeon8-check");
  const floorMap = prepareFloorDungeonMap(generated.map, "floor-8", generated.seed);
  const storyIds = selectDungeon8StoryRoomIds(floorMap);
  assert(storyIds.length === 2 && new Set(storyIds).size === 2, "two different story rooms");
  const finalRoomId = floorMap.rooms.find((room) => room.isFinalQuestRoom)?.id;
  assert(Boolean(finalRoomId), "final room missing");
  const fromStart = distances(floorMap as typeof TEST_DUNGEON_MAP, floorMap.startRoomId);
  const fromFinal = distances(floorMap as typeof TEST_DUNGEON_MAP, finalRoomId!);
  const shortest = fromStart.get(finalRoomId!)!;
  for (const roomId of storyIds) {
    assert(floorMap.connections.filter((edge) => edge.fromRoomId === roomId || edge.toRoomId === roomId).length === 1, `${roomId} must be a dead end`);
    assert((fromStart.get(roomId) ?? Infinity) + (fromFinal.get(roomId) ?? Infinity) > shortest, `${roomId} must be outside shortest path`);
    assert(floorMap.rooms.find((room) => room.id === roomId)?.isRequired === false, `${roomId} must not gate final room`);
  }
  assert(supportsCrackedTiles("floor-8") && supportsCrackedTiles("floor-9"), "cracked floor scope");
  assert(!supportsCrackedTiles("floor-7") && !supportsCrackedTiles("floor-10"), "cracked tiles leaked");
  const crackA = selectCrackedTileSlot("floor-8:seed", "room-a", "floor", 4);
  assert(crackA === selectCrackedTileSlot("floor-8:seed", "room-a", "floor", 4), "cracked placement determinism");

  const completed = completeQuestStateAfterRewardClaim({ [quest.id]: "active", "quest-floor-9-goryeo-society-culture": "locked" }, quest.id);
  assert(completed[quest.id] === "completed" && completed["quest-floor-9-goryeo-society-culture"] === "available", "Dungeon9 unlock pipeline");
  const debug9 = createDebugFloorJumpState("floor-9");
  assert(debug9.questState[quest.id] === "completed" && debug9.questState["quest-floor-9-goryeo-society-culture"] === "available", "Dungeon9 debug progression");
  assert(getItemQuantity(debug9.inventoryState, item.id) === 1, "Dungeon9 debug rare reward quantity");
  assert(debug9.inventoryState.equippedItemIds.weaponSkin !== item.id, "debug must not auto-equip");
  assert(debug9.achievementReceived["achievement-floor-8-rare-reward"], "Dungeon8 debug achievement");
}
