import { ACHIEVEMENT_DEFINITIONS } from "./data/achievementDefinitions";
import { DUNGEON_FLOOR_TITLES } from "./data/DungeonFloorTitles";
import { DUNGEON9_BLESSING_STORY, DUNGEON9_CLUE_STORIES, DUNGEON9_FINAL_STORY, DUNGEON9_POST_COMBAT_STORY } from "./data/stories/dungeon9Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { selectRequiredStoryRoomIds } from "./game/dungeon/generation/DungeonGenerator";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { FLOOR_DEFINITIONS } from "./game/floor/floorDefinitions";
import { getItemDefinition } from "./game/inventory/itemDefinitions";
import { getMonsterVisualDefinition } from "./game/monster/monsterDefinitions";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { getQuestRareRewardCondition } from "./game/quest/questRareRewardConditions";
import { completeQuestStateAfterRewardClaim } from "./game/quest/questRewardCompletionResolver";
import { getDungeon9ScriptedCommands, resolveDungeon9BlessingHeal, resolveDungeon9ScriptedKnockout, DUNGEON9_MONSTER_APPEAR_DELAY_MS, DUNGEON9_SCRIPTED_ATTACK_DAMAGE, DUNGEON9_SCRIPTED_SHAKE_MS } from "./components/Dungeon9ScriptedEncounter";
import { prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";
import type { StorySequence, StoryStep } from "./types/story";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon9 content checks] ${message}`);
}
const dialogueSteps = (sequence: StorySequence) => sequence.scenes.flatMap((scene) => scene.steps).filter((step): step is Extract<StoryStep, { type: "dialogue" }> => step.type === "dialogue");
const shownIllustrations = (sequence: StorySequence) => sequence.scenes.flatMap((scene) => scene.steps).filter((step): step is Extract<StoryStep, { type: "illustOverlay" }> => step.type === "illustOverlay" && step.visible);

export function runDungeon9ContentChecks(): void {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-9-goryeo-society-culture");
  assert(quest?.giverNpcId === "denebCommander" && quest.turnInNpcId === "denebCommander" && quest.targetFloorId === "floor-9", "floor 9 quest registration");
  assert(quest.rewards.description === "30 Gold · 대한제국 국기 뱃지(희귀)", "floor 9 reward description");
  assert(FLOOR_DEFINITIONS.some((entry) => entry.id === "floor-9" && entry.title === "9층"), "floor 9 entrance label");
  assert(DUNGEON_FLOOR_TITLES.some((entry) => entry.floorId === "floor-9" && entry.subtitle === "근대국가 수립을 위한 노력"), "floor 9 internal title");
  assert(NPC_BY_ID.denebCommander.offeredQuestIds.includes(quest.id) && !NPC_BY_ID.luna.offeredQuestIds.includes(quest.id), "Deneb is sole quest giver");

  const offer = NPC_STORY_SEQUENCES[quest.offerStorySequenceId];
  const completion = NPC_STORY_SEQUENCES[quest.completeStorySequenceId!];
  assert(dialogueSteps(offer).length === 6 && offer.dialogueSkip === true, "six-step skippable offer story");
  assert(dialogueSteps(completion).length === 22 && completion.dialogueSkip === false, "22-step non-skippable BaseCamp story");
  assert(dialogueSteps(completion)[15]?.speakerName === "아론" && dialogueSteps(completion)[15]?.expression === "shouting", "Aron shouting expression");

  assert(DUNGEON9_CLUE_STORIES.length === 2, "exactly two event stories");
  assert(dialogueSteps(DUNGEON9_CLUE_STORIES[0]).length === 14, "event 1 dialogue count");
  assert(dialogueSteps(DUNGEON9_CLUE_STORIES[1]).length === 15, "event 2 dialogue count");
  assert(DUNGEON9_CLUE_STORIES.every((story) => story.dialogueSkip === true), "event stories remain skippable");
  assert(shownIllustrations(DUNGEON9_CLUE_STORIES[0]).map((step) => step.imageUrl?.split("/").at(-1)).join(",") === "eulmi-incident-illustration.png,royal-refuge-illustration.png", "event 1 illustration order");
  assert(shownIllustrations(DUNGEON9_CLUE_STORIES[1]).map((step) => step.imageUrl?.split("/").at(-1)).join(",") === "modernizing-joseon-illustration.png,independent-newspaper-illustration.png", "event 2 illustration order");
  assert(dialogueSteps(DUNGEON9_CLUE_STORIES[1]).some((step) => step.text.includes("<blue><b>독립신문</b></blue>")), "safe blue emphasis parser data");

  assert(DUNGEON9_FINAL_STORY.dialogueSkip === false && DUNGEON9_FINAL_STORY.skippable === false, "final story skip disabled");
  assert(DUNGEON9_BLESSING_STORY.dialogueSkip === false && DUNGEON9_POST_COMBAT_STORY.dialogueSkip === false, "encounter story skip disabled");
  assert(dialogueSteps(DUNGEON9_FINAL_STORY).length === 13, "final pre-encounter dialogue count");
  assert(dialogueSteps(DUNGEON9_POST_COMBAT_STORY).length === 7, "post combat dialogue count");
  assert(DUNGEON9_SCRIPTED_ATTACK_DAMAGE === 100 && DUNGEON9_SCRIPTED_SHAKE_MS === 2000 && DUNGEON9_MONSTER_APPEAR_DELAY_MS === 1000, "scripted damage and transition timing");
  const samplePlayer = { name: "검사", currentHp: 37, maxHp: 143, gold: 0 };
  assert(resolveDungeon9ScriptedKnockout(samplePlayer).currentHp === 0, "scripted attack forces exact zero HP");
  assert(resolveDungeon9BlessingHeal({ ...samplePlayer, currentHp: 0 }).currentHp === samplePlayer.maxHp, "blessing restores max HP");
  assert(getDungeon9ScriptedCommands("command").join(",") === "공격한다" && getDungeon9ScriptedCommands("enemyTurn").length === 0, "attack-only command state");
  const blessingSteps = DUNGEON9_BLESSING_STORY.scenes.flatMap((scene) => scene.steps);
  assert(blessingSteps[0]?.type === "wait" && blessingSteps[0].durationMs === 1500, "blackout waits before blessing illustration");
  assert(dialogueSteps(DUNGEON9_BLESSING_STORY).map((step) => `${step.speakerName}:${step.expression}:${step.text}`).join("|") === "데네브:angry:(플레이어 이름)!! 정신 차리세요!|데네브:angry:이 곳에서 당신을 잃을 수 없습니다!", "blessing dialogue order and expression");

  assert(getMonsterVisualDefinition("goryeo-spirit").name === "균열 침식 대한 제국군", "normal monster one");
  assert(getMonsterVisualDefinition("dungeon9-seo-jae-pil").name === "균열 침식 독립 협회 서재필", "normal monster two");
  assert(getMonsterVisualDefinition("vengeful-goryeo-spirit").name === "한 맺힌 명성황후", "elite monster");
  assert(getMonsterVisualDefinition("dungeon9-corrupted-citizen").name === "균열 침식 대한제국 시민", "scripted monster");
  const item = getItemDefinition("armor-tripitaka-koreana");
  assert(item?.name === "대한제국 국기 뱃지" && item.type === "armor" && (item.equipmentStats?.maxHpBonus ?? 0) > 0, "rare armor reward");
  assert(ACHIEVEMENT_DEFINITIONS.some((entry) => entry.id === "achievement-floor-9-rare-reward" && entry.rewardItemId === item.id), "floor 9 achievement mapping");
  assert(getQuestRareRewardCondition(quest.id).floorId === "floor-9", "floor 9 rare condition retained");

  const dungeonRun = createDungeonRun("floor-9", "dungeon9-check");
  const floorMap = prepareFloorDungeonMap(dungeonRun.map, "floor-9", dungeonRun.seed);
  const storyRoomIds = selectRequiredStoryRoomIds(floorMap, 2, true);
  const adjacency = new Map(floorMap.rooms.map((room) => [room.id, 0]));
  floorMap.connections.forEach((connection) => {
    adjacency.set(connection.fromRoomId, (adjacency.get(connection.fromRoomId) ?? 0) + 1);
    adjacency.set(connection.toRoomId, (adjacency.get(connection.toRoomId) ?? 0) + 1);
  });
  assert(storyRoomIds.length === 2 && new Set(storyRoomIds).size === 2, "two distinct story rooms");
  assert(storyRoomIds.every((roomId) => adjacency.get(roomId) === 1), "story rooms are dead ends");
  assert(storyRoomIds.every((roomId) => floorMap.rooms.find((room) => room.id === roomId)?.type === "empty"), "story rooms preserve non-combat event type");

  const unlocked = completeQuestStateAfterRewardClaim({ [quest.id]: "active", "quest-floor-10-final-source": "locked" }, quest.id);
  assert(unlocked[quest.id] === "completed" && unlocked["quest-floor-10-final-source"] === "available", "Dungeon10 unlock after claim");
  const debug = createDebugFloorJumpState("floor-10");
  assert(debug.questState[quest.id] === "completed" && debug.questState["quest-floor-10-final-source"] === "available", "Dungeon10 debug quest state");
  assert(debug.rewardClaimed[quest.id] && debug.achievementReceived["achievement-floor-9-rare-reward"], "Dungeon10 debug reward and achievement");
  assert((debug.inventoryState.items["armor-tripitaka-koreana"] ?? 0) === 1 && debug.inventoryState.equippedItemIds.armor !== "armor-tripitaka-koreana", "Dungeon10 debug badge exactly once and unequipped");
}
