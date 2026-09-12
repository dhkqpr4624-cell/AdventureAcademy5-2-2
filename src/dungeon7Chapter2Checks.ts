import { DUNGEON7_CLUE_STORIES, DUNGEON7_ENTRY_STORY, DUNGEON7_FINAL_STORY } from "./data/stories/dungeon7Stories";
import { NPC_BY_ID } from "./game/npc/npcDefinitions";
import { QUEST_DEFINITIONS } from "./game/quest/questDefinitions";
import { MONSTER_VISUAL_DEFINITIONS } from "./game/monster/monsterDefinitions";
import { ITEM_DEFINITION_REGISTRY } from "./game/inventory/itemDefinitions";
import { createDebugFloorJumpState } from "./debug/debugFloorJump";
import { getItemQuantity } from "./game/inventory/inventoryState";

function check(condition: unknown, message: string): asserts condition { if (!condition) throw new Error(`[Dungeon7 check] ${message}`); }
const dialogue = (story: { scenes: ReadonlyArray<{ steps: ReadonlyArray<{ type: string }> }> }) => story.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue");

export function runDungeon7Chapter2Checks() {
  const quest = QUEST_DEFINITIONS.find((entry) => entry.id === "quest-floor-7-goryeo-founding");
  check(quest?.title === "개항 전후의 조선(1)", "title");
  check(quest.giverNpcId === "kaiden" && quest.turnInNpcId === "denebCommander", "giver and turn-in");
  check(NPC_BY_ID.denebCommander.baseCampDisplayRole === "잊혀진 지휘관", "Deneb NPC definition");
  check(DUNGEON7_ENTRY_STORY.dialogueSkip && dialogue(DUNGEON7_ENTRY_STORY).length === 5, "entry story");
  check(DUNGEON7_CLUE_STORIES.length === 3, "three event stories");
  check(dialogue(DUNGEON7_FINAL_STORY).length === 19 && DUNGEON7_FINAL_STORY.persistentIllustBackdrop, "final story");
  check(MONSTER_VISUAL_DEFINITIONS["later-baekje-soldier-spirit"].name === "병인양요 프랑스군", "French monster");
  check(MONSTER_VISUAL_DEFINITIONS["dungeon7-american-soldier"].name === "신미양요 미군", "American monster");
  check(MONSTER_VISUAL_DEFINITIONS["later-goguryeo-soldier-spirit"].name === "강화도 조약 일본군", "elite monster");
  check(ITEM_DEFINITION_REGISTRY["accessory-gungye-eyepatch"].name === "척화비", "legacy reward id");
  const debug8 = createDebugFloorJumpState("floor-8");
  check(getItemQuantity(debug8.inventoryState, "accessory-gungye-eyepatch") === 1, "Dungeon8 debug rare reward");
  check(Boolean(debug8.achievementReceived["achievement-floor-7-rare-reward"]), "Dungeon8 debug achievement");
}
