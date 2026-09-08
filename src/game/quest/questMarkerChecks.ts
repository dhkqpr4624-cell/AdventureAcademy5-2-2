import { NPC_BY_ID } from "../npc/npcDefinitions";
import { resolveNpcQuestMarker } from "./questMarkerResolver";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[quest marker checks] ${message}`);
}

export function runQuestMarkerChecks() {
  const kaiden = NPC_BY_ID.kaiden;
  const questId = kaiden.offeredQuestIds.find((id) => id === "quest-floor-6-balhae")!;

  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "available" }) === "available",
    "available quest must resolve to !",
  );

  const floor4QuestId = "quest-floor-4-jeon-rescue";
  assert(resolveNpcQuestMarker(kaiden, { [floor4QuestId]: "available" }) === "available", "Dungeon 4 offer marker must resolve to Aron");
  assert(resolveNpcQuestMarker(NPC_BY_ID.theo, { [floor4QuestId]: "readyToComplete" }) === "readyToComplete", "Dungeon 4 completion marker must resolve to Theo");
  assert(resolveNpcQuestMarker(kaiden, { [floor4QuestId]: "readyToComplete" }) === "none", "Dungeon 4 completion marker must leave Aron");
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "readyToComplete" }) ===
      "readyToComplete",
    "ready-to-complete quest must resolve to ?",
  );
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "active" }) === "none",
    "active quest must not show a marker",
  );
  assert(
    resolveNpcQuestMarker(kaiden, { [questId]: "completed" }) === "none",
    "completed quest must not show a marker",
  );
  assert(
    resolveNpcQuestMarker(
      { id: "kaiden", offeredQuestIds: ["available-quest", "ready-quest"] },
      {
        "available-quest": "available",
        "ready-quest": "readyToComplete",
      },
    ) === "readyToComplete",
    "ready-to-complete must take priority over available",
  );
  assert(
    resolveNpcQuestMarker(NPC_BY_ID.luna, { [questId]: "available" }) ===
      "none" &&
      resolveNpcQuestMarker(NPC_BY_ID.theo, { [questId]: "available" }) ===
        "none",
    "quest-less NPCs must not inherit a marker from a slot or another NPC",
  );

  const floor1QuestId = "quest-floor-1-prehistory";
  assert(
    resolveNpcQuestMarker(NPC_BY_ID.kaiden, { [floor1QuestId]: "readyToComplete" }) === "readyToComplete",
    "Dungeon 1 completion marker must resolve to Aron",
  );
  assert(
    resolveNpcQuestMarker(NPC_BY_ID.theo, { [floor1QuestId]: "readyToComplete" }) === "none",
    "Dungeon 1 completion marker must not remain on Theo",
  );
}
