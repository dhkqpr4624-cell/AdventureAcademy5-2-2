import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON5_ENTRY_STORY, DUNGEON5_FINAL_STORY } from "./data/stories/dungeon5Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { CHAPTER2_PORTRAITS } from "./data/stories/chapter2Portraits";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { getItemQuantity } from "./game/inventory/inventoryState";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { applyFloorMonsterData } from "./screens/DungeonScreen/DungeonScreen";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon5 chapter2 checks] ${message}`);
}

export function runDungeon5Chapter2Checks() {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.targetFloorId === "floor-5");
  assert(quest?.id === "quest-floor-5-unified-silla", "legacy quest id changed");
  assert(quest.title === "조선후기 개혁정치", "title mismatch");
  assert(quest.giverNpcId === "luna" && quest.turnInNpcId === "kaiden", "giver/turn-in mismatch");
  assert(quest.rewards.description === "10 Gold · 실학자의 수첩(희귀)", "reward description mismatch");

  const offer = NPC_STORY_SEQUENCES["npc-luna-floor-5-quest-available"];
  const completion = NPC_STORY_SEQUENCES["npc-aron-floor-5-quest-complete"];
  assert(offer.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue").length === 11, "offer must have 11 dialogue steps");
  assert(DUNGEON5_ENTRY_STORY.scenes[0].steps.filter((step) => step.type === "dialogue").length === 13, "entry must have 13 dialogue steps");
  assert(completion.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue" || step.type === "narration").length === 18, "completion must have 18 click steps");
  const completionSteps = completion.scenes.flatMap((scene) => scene.steps);
  const completionSeven = completionSteps.find((step) => step.id === "d5-complete-7");
  const completionTen = completionSteps.find((step) => step.id === "d5-complete-10");
  assert(completionSeven?.type === "dialogue" && completionSeven.activeActorId === "theo" && completionSeven.expression === "serious" && completionSeven.text === "저희에게는 아무것도 들리지 않았는데..", "completion step 7 speaker/expression/text mismatch");
  assert(completionTen?.type === "dialogue" && completionTen.activeActorId === "luna" && completionTen.expression === "serious" && completionTen.text === "데네브님은 우리에게 어서 피하라고 했지만, 우리는 도망가지 않을 거예요. 그렇죠, 대장?!", "completion step 10 mismatch");
  assert(!completionSteps.some((step) => "text" in step && step.text === "데네브씨는 우리에게 어서 피하라고 했지만, 우리는 피하지 않을 거예요. 그렇죠, 대장?!"), "old Luna line must be absent");
  assert(CHAPTER2_PORTRAITS.yeongjo?.defaultExpression === "default" && Boolean(CHAPTER2_PORTRAITS.yeongjo.expressions.default), "Yeongjo default portrait registry missing");
  const yeongjoSteps = DUNGEON5_FINAL_STORY.scenes[0].steps.filter((step) => step.type === "dialogue" && step.activeActorId === "yeongjo");
  assert(yeongjoSteps.length > 0 && yeongjoSteps.every((step) => step.type === "dialogue" && step.expression === "default"), "all Yeongjo dialogue steps must use the default portrait");

  const finalSteps = DUNGEON5_FINAL_STORY.scenes[0].steps;
  const wrong = finalSteps.find((step) => step.id === "d5-final-26");
  assert(wrong?.type === "dialogue" && wrong.nextStepId === "d5-reform-choice", "wrong answer must loop by nextStepId");
  assert(finalSteps.some((step) => step.type === "illustOverlay" && step.id === "d5-yeongjo-out" && step.removeAfterFade), "Yeongjo illustration fade-out missing");
  assert(finalSteps.some((step) => step.type === "illustOverlay" && step.id === "d5-chain-in" && step.hideDialogue), "chain hide-dialogue transition missing");
  assert(finalSteps.some((step) => step.type === "dialogue" && step.id === "d5-final-41" && step.text === "..........{{playerNameLastCharacter}}"), "last-character token missing");

  const map = createDungeonRun("floor-5", "dungeon5-chapter2-check").map;
  assert(map.connections.length > 0 && map.rooms.some((room) => map.connections.filter((edge) => edge.fromRoomId === room.id || edge.toRoomId === room.id).length > 2), "floor 5 must retain the branched stone-dungeon graph");
  const monsters = applyFloorMonsterData(map, "dungeon5-chapter2-check", "floor-5").rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  assert(monsters.includes("chapter2-suwon-fortress-golem"), "elite monster missing");
  assert(monsters.some((id) => id === "chapter2-sinmungo-spirit" || id === "chapter2-east-west-factions"), "normal monster pool missing");

  const item = getItemDefinition("armor-munmu");
  assert(item?.name === "실학자의 수첩" && item.type === "armor", "legacy reward item id was not reused");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-5-rare-reward" && entry.rewardItemId === "armor-munmu"), "rare reward achievement mismatch");
  const debugFloor6 = createDebugFloorJumpState("floor-6");
  assert(getItemQuantity(debugFloor6.inventoryState, "armor-munmu") === 1, "Dungeon6 debug state must contain one notebook");
  assert(debugFloor6.inventoryState.equippedItemIds.armor === null, "debug reward must not auto-equip");
}
