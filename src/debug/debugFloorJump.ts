import { ACHIEVEMENT_DEFINITIONS } from "../data/achievementDefinitions";
import { getQuestFloorUnlockActionId } from "../game/floor/FloorUnlockResolver";
import type { FloorId } from "../game/floor/floorTypes";
import { changeItemQuantity } from "../game/inventory/inventoryState";
import { QUEST_DEFINITIONS } from "../game/quest/questDefinitions";
import { getQuestRareRewardCondition } from "../game/quest/questRareRewardConditions";
import { createInitialGameSaveState, type GameSaveState } from "../save/saveStateAdapter";

const FLOOR_IDS: readonly FloorId[] = ["floor-1", "floor-2", "floor-3", "floor-4", "floor-5", "floor-6", "floor-7", "floor-8", "floor-9", "floor-10"];

export function createDebugFloorJumpState(targetFloor: FloorId, playerName = "DEBUG"): GameSaveState {
  const state = createInitialGameSaveState();
  const targetIndex = FLOOR_IDS.indexOf(targetFloor);
  if (targetIndex < 0) return state;
  let inventoryState = state.inventoryState;
  const completedFloorIds = FLOOR_IDS.slice(0, targetIndex);
  const completedQuests = completedFloorIds.map((floorId) => {
    const quest = QUEST_DEFINITIONS.find((entry) => entry.targetFloorId === floorId);
    if (!quest) throw new Error(`Missing quest definition for ${floorId}`);
    return quest;
  });
  const completedQuestIds = completedQuests.map((quest) => quest.id);
  const questState = { ...state.questState };
  const rewardClaimed: Record<string, boolean> = {};
  const achievementReceived: Record<string, boolean> = {};
  const firstObjectiveEventSeen: Record<string, boolean> = {};
  const floorBestCorrect: Record<string, number> = {};
  completedQuests.forEach((quest, index) => {
    const questId = quest.id;
    const floorId = completedFloorIds[index];
    const condition = getQuestRareRewardCondition(questId);
    const achievement = ACHIEVEMENT_DEFINITIONS.find((entry) => entry.rewardStateId === questId);
    questState[questId] = "completed";
    rewardClaimed[questId] = true;
    if (achievement) {
      achievementReceived[achievement.id] = true;
      inventoryState = changeItemQuantity(inventoryState, achievement.rewardItemId, 1);
    }
    firstObjectiveEventSeen[floorId] = true;
    firstObjectiveEventSeen[`reward-revealed:${questId}`] = true;
    floorBestCorrect[floorId] = condition.totalQuestions;
  });
  const targetQuest = QUEST_DEFINITIONS.find((quest) => quest.targetFloorId === targetFloor);
  if (!targetQuest) throw new Error(`Missing quest definition for ${targetFloor}`);
  questState[targetQuest.id] = "available";
  return {
    ...state,
    playerState: { ...state.playerState, name: playerName || "DEBUG", gold: completedQuestIds.length * 5 },
    questState, inventoryState, clearedFloorIds: [...completedFloorIds],
    floorUnlockState: { unlockedFloorIds: [...completedFloorIds, targetFloor] }, floorBestCorrect,
    firstObjectiveEventSeen, rewardClaimed, achievementReceived,
    completedStoryIds: completedQuestIds.flatMap((questId) => {
      const quest = QUEST_DEFINITIONS.find((entry) => entry.id === questId)!;
      return [quest.offerStorySequenceId, quest.acceptStorySequenceId, quest.completeStorySequenceId].filter((id): id is string => Boolean(id));
    }),
    storyActionState: { executedActionIds: completedQuestIds.map((questId, index) => getQuestFloorUnlockActionId(questId, completedFloorIds[index])) },
  };
}
