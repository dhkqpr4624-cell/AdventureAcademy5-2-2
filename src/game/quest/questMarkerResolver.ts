import type { NpcDefinition } from "../npc/npcTypes";
import type { QuestMarkerStatus } from "./questTypes";
import { QUEST_DEFINITIONS } from "./questDefinitions";

export type QuestMarkerType = "available" | "readyToComplete" | "none";

export function resolveNpcQuestMarker(
  npc: Pick<NpcDefinition, "id" | "offeredQuestIds">,
  questStatuses: Readonly<Record<string, QuestMarkerStatus | undefined>>,
): QuestMarkerType {
  const hasReadyTurnIn = QUEST_DEFINITIONS.some(
    (quest) =>
      (quest.turnInNpcId ?? quest.giverNpcId) === npc.id &&
      questStatuses[quest.id] === "readyToComplete",
  );
  const offeredStatuses = npc.offeredQuestIds.map(
    (questId) => questStatuses[questId],
  );
  const hasReadyOffered = npc.offeredQuestIds.some((questId) => {
    if (questStatuses[questId] !== "readyToComplete") return false;
    const definition = QUEST_DEFINITIONS.find((quest) => quest.id === questId);
    return !definition || (definition.turnInNpcId ?? definition.giverNpcId) === npc.id;
  });

  if (hasReadyTurnIn || hasReadyOffered) {
    return "readyToComplete";
  }
  if (offeredStatuses.includes("available")) {
    return "available";
  }
  return "none";
}
