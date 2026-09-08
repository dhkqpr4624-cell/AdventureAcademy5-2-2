import { applyFloorMonsterData } from "./screens/DungeonScreen/DungeonScreen";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export function runPhase29_11Checks() {
  const floor3 = applyFloorMonsterData(createDungeonRun("floor-3", "phase29-11-floor3").map, "phase29-11-floor3", "floor-3");
  const floor4 = applyFloorMonsterData(createDungeonRun("floor-4", "phase29-11-floor4").map, "phase29-11-floor4", "floor-4");
  const floor3Ids = floor3.rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  const floor4Ids = floor4.rooms.flatMap((room) => room.type === "combat" ? [room.combatConfig!.monsterId] : room.type === "elite" ? [room.eliteConfig!.monsterId] : []);
  assert(floor3Ids.every((id) => ["chapter2-broken-angbuilgu", "chapter2-corrupted-armillary-sphere"].includes(id)), "Dungeon 3 monster assignment changed");
  assert(floor4Ids.every((id) => ["chapter2-imjin-japanese-soldier", "chapter2-qing-soldier"].includes(id)), "Dungeon 4 has an old monster assignment");

  const questIds = [
    "quest-floor-1-prehistory", "quest-floor-2-memory-fragment", "quest-floor-3-torn-cloth",
    "quest-floor-4-jeon-rescue", "quest-floor-5-unified-silla", "quest-floor-6-balhae",
    "quest-floor-7-goryeo-founding", "quest-floor-8-goryeo-relations",
    "quest-floor-9-goryeo-society-culture", "quest-floor-10-final-source",
  ];
  const floorIds = ["floor-1", "floor-2", "floor-3", "floor-4", "floor-5", "floor-6", "floor-7", "floor-8", "floor-9", "floor-10"] as const;
  for (const [index, floor] of floorIds.entries()) {
    const state = createDebugFloorJumpState(floor);
    assert(state.questState[questIds[index]] === "available", `${floor} target quest must be available`);
    assert(state.clearedFloorIds.length === index, `${floor} cleared floor count mismatch`);
    assert(state.playerState.gold === index * 5, `${floor} gold mismatch`);
    assert(Object.keys(state.rewardClaimed).length === index, `${floor} claimed reward count mismatch`);
    const expectedAchievementCount = questIds.slice(0, index).filter((questId) =>
      ["quest-floor-2-memory-fragment", "quest-floor-5-unified-silla", "quest-floor-6-balhae", "quest-floor-7-goryeo-founding", "quest-floor-8-goryeo-relations", "quest-floor-9-goryeo-society-culture"].includes(questId)
    ).length;
    assert(Object.keys(state.achievementReceived).length === expectedAchievementCount, `${floor} achievement count mismatch`);
    assert(state.floorUnlockState.unlockedFloorIds.includes(floor), `${floor} target floor must be unlocked`);
    assert(state.questState[questIds[index]] !== "active", `${floor} target quest must remain unaccepted`);
    assert(!Object.keys(state.inventoryState.items).some((id) => id.startsWith("quest-")), `${floor} must not retain quest items`);
    for (let previous = 0; previous < index; previous += 1) assert(state.questState[questIds[previous]] === "completed", `${floor} previous quest incomplete`);
  }
}
