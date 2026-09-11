import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON6_CLUE_STORIES, DUNGEON6_ENTRY_STORY, DUNGEON6_FINAL_STORY } from "./data/stories/dungeon6Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { CHAPTER2_PORTRAITS } from "./data/stories/chapter2Portraits";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { selectRequiredStoryRoomIds } from "./game/dungeon/generation/DungeonGenerator";
import { getItemQuantity } from "./game/inventory/inventoryState";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { applyFloorMonsterData, prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon6 chapter2 checks] ${message}`);
}

export function runDungeon6Chapter2Checks(): void {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.targetFloorId === "floor-6");
  assert(quest?.id === "quest-floor-6-balhae", "legacy quest id changed");
  assert(quest.title === "조선후기의 서민문화", "title mismatch");
  assert(quest.giverNpcId === "kaiden" && quest.turnInNpcId === "jeon", "giver/turn-in mismatch");
  assert(quest.rewards.description === "10 Gold · 김홍도의 붓(희귀)", "reward description mismatch");

  const offer = NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-available"];
  const completion = NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-complete"];
  assert(offer.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue").length === 20, "offer must have 20 dialogue steps");
  assert(DUNGEON6_ENTRY_STORY.scenes[0].steps.filter((step) => step.type === "dialogue").length === 5, "entry must have 5 dialogue steps");
  assert(DUNGEON6_CLUE_STORIES.length === 3, "exactly three event stories required");
  assert(DUNGEON6_CLUE_STORIES[1].scenes[0].steps.some((step) => step.type === "dialogue" && step.activeActorId === "singer" && step.text.startsWith("이리 보아도")), "pansori continuation speaker mismatch");
  assert(completion.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue").length === 3, "completion must have 3 dialogue steps");
  assert(CHAPTER2_PORTRAITS.luna.expressions.shout, "Luna shout portrait missing");

  const sourceMap = createDungeonRun("floor-6", "dungeon6-chapter2-check").map;
  const map = prepareFloorDungeonMap(sourceMap, "floor-6", "dungeon6-chapter2-check");
  const storyRoomIds = selectRequiredStoryRoomIds(sourceMap, 3, false);
  const storyRooms = storyRoomIds.map((id) => map.rooms.find((room) => room.id === id)!);
  assert(storyRooms.length === 3, "three story rooms must be selected");
  assert(storyRooms.every((room) => map.connections.filter((edge) => edge.fromRoomId === room.id || edge.toRoomId === room.id).length === 1), "story rooms must be dead ends");
  assert(map.connections.length > map.rooms.length - 1, "floor 6 must retain a branched graph");
  const monsters = applyFloorMonsterData(map, "dungeon6-chapter2-check", "floor-6").rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  assert(monsters.includes("corrupted-double-buddha"), "elite monster missing");
  assert(monsters.some((id) => id === "balhae-refugee-spirit" || id === "balhae-guardian-stone-lion"), "normal monster pool missing");

  const finalSteps = DUNGEON6_FINAL_STORY.scenes[0].steps;
  assert(finalSteps.some((step) => step.type === "illustOverlay" && step.id === "d6-party-out" && step.hideDialogue), "final illustration hide transition missing");
  assert(finalSteps.some((step) => step.type === "dialogue" && step.id === "d6-final-14" && step.text.includes("<blue><b>데네브의 기운이 느껴져요.</b></blue>")), "safe blue emphasis missing");

  const item = getItemDefinition("weapon-silla-ring-pommel-sword");
  assert(item?.name === "김홍도의 붓" && item.type === "weaponSkin", "legacy reward item id was not reused");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-6-rare-reward" && entry.rewardItemId === "weapon-silla-ring-pommel-sword"), "rare achievement mismatch");
  const debugFloor7 = createDebugFloorJumpState("floor-7");
  assert(getItemQuantity(debugFloor7.inventoryState, "weapon-silla-ring-pommel-sword") === 1, "Dungeon7 debug state must contain one brush");
  assert(debugFloor7.inventoryState.equippedItemIds.weaponSkin !== "weapon-silla-ring-pommel-sword", "debug reward must not auto-equip");
}
