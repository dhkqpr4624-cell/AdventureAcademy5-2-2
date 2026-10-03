import { validateCurrentSave } from "./saveSchema";
import { createSaveDataFromGameState, type GameSaveState } from "./saveStateAdapter";
import type { CurrentSaveData } from "./saveTypes";

/**
 * Dungeon10 "before the final quest" checkpoint.
 *
 * The save schema/version is unchanged: the checkpoint is a serialized
 * CurrentSaveData stored as one string entry of the existing
 * `story.checkpointByStoryId` map, so it survives reloads inside the single
 * save slot without introducing another persistent slot.
 */
export const DUNGEON10_CHECKPOINT_KEY = "dungeon10:pre-quest-checkpoint";
export const DUNGEON10_QUEST_ID = "quest-floor-10-final-source";

function withoutCheckpoint(map: Record<string, string>): Record<string, string> {
  const next = { ...map };
  delete next[DUNGEON10_CHECKPOINT_KEY];
  return next;
}

function normalizePreQuestState(state: GameSaveState): GameSaveState {
  return {
    ...state,
    currentFloorId: null,
    currentFloorRun: null,
    questState: { ...state.questState, [DUNGEON10_QUEST_ID]: "available" },
    checkpointByStoryId: withoutCheckpoint(state.checkpointByStoryId),
  };
}

/**
 * Stores the checkpoint right before Deneb's offer story starts. It is never
 * created or overwritten once the quest is active or completed, so nothing
 * that happens during Dungeon10 or the ending can change it.
 */
export function createDungeon10Checkpoint(state: GameSaveState): GameSaveState {
  const status = state.questState[DUNGEON10_QUEST_ID];
  if (status === "active" || status === "completed") return state;
  const serialized = JSON.stringify(createSaveDataFromGameState(normalizePreQuestState(state)));
  if (state.checkpointByStoryId[DUNGEON10_CHECKPOINT_KEY] === serialized) return state;
  return {
    ...state,
    checkpointByStoryId: { ...state.checkpointByStoryId, [DUNGEON10_CHECKPOINT_KEY]: serialized },
  };
}

export function readDungeon10Checkpoint(state: GameSaveState): CurrentSaveData | null {
  const raw = state.checkpointByStoryId[DUNGEON10_CHECKPOINT_KEY];
  if (!raw) return null;
  try {
    return validateCurrentSave(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * Builds the save that the ending restores. The stored checkpoint wins; when it
 * is missing or corrupted the current progress is normalized instead (Dungeon10
 * available, no floor run, full HP) so Dungeon1~9 progress is never lost.
 * Play time keeps counting from the current session.
 */
export function resolveDungeon10RestoreSave(state: GameSaveState): CurrentSaveData {
  const checkpoint = readDungeon10Checkpoint(state);
  const savedAt = new Date().toISOString();
  if (checkpoint) {
    return {
      ...checkpoint,
      savedAt,
      playTimeSeconds: Math.max(checkpoint.playTimeSeconds, state.playTimeSeconds),
      quests: {
        statuses: { ...checkpoint.quests.statuses, [DUNGEON10_QUEST_ID]: "available" },
        activeQuestId: null,
      },
      story: { ...checkpoint.story, checkpointByStoryId: withoutCheckpoint(checkpoint.story.checkpointByStoryId) },
      dungeon: { ...checkpoint.dungeon, currentFloorId: null, currentFloorRun: null },
    };
  }
  const fallback = normalizePreQuestState({
    ...state,
    playerState: { ...state.playerState, currentHp: state.playerState.maxHp },
  });
  return { ...createSaveDataFromGameState(fallback), savedAt };
}
