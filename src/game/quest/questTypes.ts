import type { NpcId } from "../npc/npcTypes";
import type { FloorId } from "../floor/floorTypes";

export type QuestStatus = "locked" | "available" | "active" | "completed";
export type QuestMarkerStatus = QuestStatus | "readyToComplete";

export type QuestDefinition = {
  id: string;
  title: string;
  summary: string;
  description: string;
  objectiveText: string;
  giverNpcId: NpcId;
  /** Optional NPC who receives the completed quest; defaults to giverNpcId. */
  turnInNpcId?: NpcId;
  offerStorySequenceId: string;
  acceptStorySequenceId?: string;
  activeStorySequenceId?: string;
  completeStorySequenceId?: string;
  targetFloorId?: FloorId;
  rewards: { description: string };
};

export type QuestState = Record<string, QuestStatus>;

export type AcceptQuestResult = {
  success: boolean;
  nextState: QuestState;
  reason?: "questNotFound" | "questNotAvailable" | "alreadyActive";
};
