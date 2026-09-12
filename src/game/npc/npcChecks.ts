import { NPC_BY_ID, NPC_DEFINITIONS } from "./npcDefinitions";
import { resolveNextBlinkDelay } from "./npcIdleResolver";
import { NPC_STORY_SEQUENCES } from "../../data/stories/npcStories";
import { QUEST_DEFINITIONS } from "../quest/questDefinitions";
import { BASE_CAMP_LAYER } from "../baseCamp/baseCampLayers";
import { NPC_PORTRAIT_REGISTRY } from "./npcPortraitRegistry";
import { resolveNpcPresentation } from "./npcPresentationResolver";
import { resolveNpcStorySequence } from "./npcStoryResolver";
import type { NpcId } from "./npcTypes";
import {
  BASE_CAMP_NPC_DISPLAY_SCALE,
  BASE_CAMP_REDUCED_NPC_DISPLAY_SCALE,
  BASE_CAMP_NPC_SLOT_ASSIGNMENTS,
  BASE_CAMP_NPC_SLOTS,
  getBaseCampNpcFocusTarget,
  getBaseCampNpcPlacement,
  type BaseCampNpcSlotId,
} from "./baseCampNpcSlots";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[npc checks] ${message}`);
}

export function runNpcChecks() {
  const ids = new Set<string>();
  const occupiedSlots = new Set<string>();
  for (const npc of NPC_DEFINITIONS) {
    assert(!ids.has(npc.id), `duplicate NPC id: ${npc.id}`);
    ids.add(npc.id);
    assert(
      npc.baseCampSpawnId in BASE_CAMP_NPC_SLOTS,
      `${npc.id} references invalid BaseCamp slot: ${npc.baseCampSpawnId}`,
    );
    assert(
      !occupiedSlots.has(npc.baseCampSpawnId),
      `duplicate BaseCamp slot: ${npc.baseCampSpawnId}`,
    );
    occupiedSlots.add(npc.baseCampSpawnId);
    assert(Boolean(npc.idle.standingImage), `${npc.id} has no standing image`);
    assert(npc.idle.blinkFrameCount > 0, `${npc.id} has no blink frames`);
    assert(
      npc.idle.minBlinkIntervalMs < npc.idle.maxBlinkIntervalMs,
      `${npc.id} has invalid blink interval`,
    );
    assert(Boolean(npc.portraits.default), `${npc.id} has no default portrait`);
    const expectedPlacement = getBaseCampNpcPlacement(
      npc.baseCampSpawnId as BaseCampNpcSlotId,
    );
    assert(
      npc.placement.width === expectedPlacement.width &&
        npc.placement.height === expectedPlacement.height,
      `${npc.id} standing and blink must share the common display scale`,
    );
    assert(
      npc.placement.x === expectedPlacement.x &&
        npc.placement.y === expectedPlacement.y,
      `${npc.id} placement must preserve its slot foot anchor`,
    );
    const slot = BASE_CAMP_NPC_SLOTS[npc.baseCampSpawnId as BaseCampNpcSlotId];
    const expectedSize = npc.id === "luna" || npc.id === "theo"
      ? { width: 114, height: 180 }
      : { width: 84, height: 147 };
    assert(
      npc.placement.width === expectedSize.width &&
        npc.placement.height === expectedSize.height,
      `${npc.id} final display size must preserve its source aspect ratio`,
    );
    assert(
      npc.placement.x + npc.placement.width / 2 === slot.anchorX,
      `${npc.id} horizontal foot anchor must not move`,
    );
    assert(
      npc.placement.y + npc.placement.height === slot.groundY,
      `${npc.id} bottom-center foot anchor must match its map ground point`,
    );
    const focusTarget = getBaseCampNpcFocusTarget(
      npc.baseCampSpawnId as BaseCampNpcSlotId,
    );
    assert(
      focusTarget.x === slot.anchorX &&
        focusTarget.y === npc.placement.y + npc.placement.height / 2,
      `${npc.id} focus target must match the rendered center`,
    );
    for (const sequenceId of Object.values(npc.dialogue)) {
      assert(
        !sequenceId || Boolean(NPC_STORY_SEQUENCES[sequenceId]),
        `${npc.id} references missing story ${sequenceId}`,
      );
    }
    for (const questId of npc.offeredQuestIds) {
      assert(
        QUEST_DEFINITIONS.some((quest) => quest.id === questId),
        `${npc.id} references missing quest ${questId}`,
      );
    }
  }
  assert(occupiedSlots.size === 5, "all five NPCs must use different slots");
  const identityExpectations = {
    luna: {
      displayName: "루나",
      role: "지형 분석가",
      baseCampDisplayRole: "지형 분석가",
      defaultStorySequenceId: "npc-luna-default",
    },
    theo: {
      displayName: "테오",
      role: "보급 담당",
      baseCampDisplayRole: "상점",
      defaultStorySequenceId: "npc-theo-default",
    },
    kaiden: {
      displayName: "아론",
      role: "지휘관",
      baseCampDisplayRole: "지휘관",
      defaultStorySequenceId: "npc-kaiden-default",
    },
    jeon: {
      displayName: "카프",
      role: "부지휘관",
      baseCampDisplayRole: "부지휘관",
      defaultStorySequenceId: "npc-jeon-default",
    },
    denebCommander: {
      displayName: "데네브",
      role: "잊혀진 지휘관",
      baseCampDisplayRole: "잊혀진 지휘관",
      defaultStorySequenceId: "npc-deneb-default",
    },
  } as const satisfies Record<
    NpcId,
    {
      displayName: string;
      role: string;
      baseCampDisplayRole: string;
      defaultStorySequenceId: string;
    }
  >;
  for (const npcId of Object.keys(identityExpectations) as NpcId[]) {
    const expected = identityExpectations[npcId];
    const presentation = resolveNpcPresentation(npcId);
    assert(presentation.id === npcId, `${npcId} presentation id mismatch`);
    assert(
      presentation.displayName === expected.displayName,
      `${npcId} display name mismatch`,
    );
    assert(presentation.role === expected.role, `${npcId} role mismatch`);
    assert(
      presentation.baseCampDisplayRole === expected.baseCampDisplayRole,
      `${npcId} BaseCamp display role mismatch`,
    );
    assert(
      presentation.dialogue.defaultStorySequenceId ===
        expected.defaultStorySequenceId,
      `${npcId} default story mismatch`,
    );
    assert(
      NPC_PORTRAIT_REGISTRY[`${npcId}.default`] ===
        NPC_BY_ID[npcId].portraits.default,
      `${npcId} portrait registry must resolve by NPC id`,
    );
    assert(
      resolveNpcStorySequence(npcId, {}) ===
        expected.defaultStorySequenceId,
      `${npcId} story resolver must resolve by NPC id`,
    );
    const story =
      NPC_STORY_SEQUENCES[expected.defaultStorySequenceId];
    assert(
      story.actors[npcId]?.name === expected.displayName &&
        story.actors[npcId]?.role === expected.role,
      `${npcId} story actor metadata must come from its NPC definition`,
    );
  }
  assert(
    resolveNpcStorySequence("theo", {
      "quest-floor-1-prehistory": "available",
    }) === "npc-theo-floor-1-quest-available",
    "Theo must offer the chapter 2 floor 1 quest",
  );
  assert(
    resolveNpcStorySequence("kaiden", {
      "quest-floor-1-prehistory": "completed",
      "quest-floor-2-memory-fragment": "completed",
      "quest-floor-3-torn-cloth": "active",
    }) === "npc-kaiden-default",
    "completed Kaiden quests must resolve to daily dialogue",
  );
  assert(
    resolveNpcStorySequence("luna", {
      "quest-floor-3-torn-cloth": "completed",
    }) === "npc-luna-default",
    "completed Luna quest must resolve to daily dialogue",
  );
  const lunaDailyDialogue = NPC_STORY_SEQUENCES["npc-luna-default"].scenes[0]?.steps.find(
    (step) => step.type === "dialogue",
  );
  assert(
    lunaDailyDialogue?.type === "dialogue" &&
      lunaDailyDialogue.text.startsWith("{{playerName}}!"),
    "Luna daily dialogue must address the player by name",
  );
  assert(
    resolveNpcStorySequence("luna", {
      "quest-floor-1-prehistory": "available",
    }) === "npc-luna-default" &&
      resolveNpcStorySequence("kaiden", {
        "quest-floor-1-prehistory": "available",
      }) === "npc-kaiden-default",
    "Theo's quest status must not leak into Luna or Aron stories",
  );
  for (const quest of QUEST_DEFINITIONS) {
    const giver = NPC_BY_ID[quest.giverNpcId];
    assert(Boolean(giver), `${quest.id} has an invalid giverNpcId`);
    assert(
      giver.offeredQuestIds.includes(quest.id),
      `${quest.id} must be offered by its giverNpcId`,
    );
  }
  assert(
    BASE_CAMP_NPC_SLOTS.lunaNpc.anchorX === 330 &&
      BASE_CAMP_NPC_SLOTS.lunaNpc.groundY === 782 &&
      BASE_CAMP_NPC_SLOTS.theoNpc.anchorX === 555 &&
      BASE_CAMP_NPC_SLOTS.theoNpc.groundY === 782 &&
      BASE_CAMP_NPC_SLOTS.kaidenNpc.anchorX === 1170 &&
      BASE_CAMP_NPC_SLOTS.kaidenNpc.groundY === 782 &&
      BASE_CAMP_NPC_SLOTS.jeonNpc.anchorX === 1435 &&
      BASE_CAMP_NPC_SLOTS.jeonNpc.groundY === 782,
    "chapter 2 BaseCamp foot-anchor coordinates changed",
  );
  assert(
    getBaseCampNpcPlacement("lunaNpc").x === 273 &&
      getBaseCampNpcPlacement("lunaNpc").y === 602 &&
      getBaseCampNpcPlacement("theoNpc").x === 498 &&
      getBaseCampNpcPlacement("theoNpc").y === 602 &&
      getBaseCampNpcPlacement("kaidenNpc").x === 1128 &&
      getBaseCampNpcPlacement("kaidenNpc").y === 635 &&
      getBaseCampNpcPlacement("jeonNpc").x === 1393 &&
      getBaseCampNpcPlacement("jeonNpc").y === 635 &&
      getBaseCampNpcPlacement("denebCommanderNpc").x === 988 &&
      getBaseCampNpcPlacement("denebCommanderNpc").y === 635,
    "chapter 2 BaseCamp placement coordinates changed",
  );
  assert(
    BASE_CAMP_NPC_DISPLAY_SCALE === 0.3,
    "common NPC source-image display scale must be 0.3",
  );
  assert(
    BASE_CAMP_REDUCED_NPC_DISPLAY_SCALE === 0.21,
    "Aron, Kapp, and Deneb must render at 70 percent of their previous BaseCamp size",
  );
  assert(
    NPC_BY_ID.luna.placement.width === 114 &&
      NPC_BY_ID.theo.placement.width === 114 &&
      NPC_BY_ID.kaiden.placement.width === 84 &&
      NPC_BY_ID.jeon.placement.width === 84 &&
      NPC_BY_ID.denebCommander.placement.width === 84,
    "only Aron, Kapp, and Deneb must use the reduced BaseCamp scale",
  );
  assert(
    NPC_BY_ID.denebCommander.idle.blinkFrameCount === 7 &&
      NPC_BY_ID.denebCommander.idle.blinkFrameWidth === 400 &&
      NPC_BY_ID.denebCommander.idle.blinkFrameHeight === 700 &&
      NPC_BY_ID.denebCommander.idle.sourceSheetWidth === 2048 &&
      NPC_BY_ID.denebCommander.idle.sourceSheetHeight === 512,
    "Deneb blink must use all seven verified frames on the 2048 by 512 sheet",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna === "lunaNpc",
    "Luna must use the leftmost chapter 2 slot",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo === "theoNpc",
    "Theo must use the inner-left chapter 2 slot",
  );
  assert(
    BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden === "kaidenNpc" &&
      BASE_CAMP_NPC_SLOT_ASSIGNMENTS.jeon === "jeonNpc",
    "Aaron and Kapp must use the right-side chapter 2 slots",
  );
  assert(
    BASE_CAMP_LAYER.sky < BASE_CAMP_LAYER.background &&
      BASE_CAMP_LAYER.background < BASE_CAMP_LAYER.foreground,
    "sky, background, and foreground order must be preserved",
  );
  assert(
    BASE_CAMP_LAYER.foreground < BASE_CAMP_LAYER.structures,
    "dungeon entrance must be above foreground",
  );
  assert(
    BASE_CAMP_LAYER.structures < BASE_CAMP_LAYER.npcSprite,
    "NPC layer must be at or above the dungeon-entrance plane",
  );
  assert(
    BASE_CAMP_LAYER.npcSprite < BASE_CAMP_LAYER.ground,
    "ground must cover the NPC feet",
  );
  assert(
    BASE_CAMP_LAYER.npcSprite < BASE_CAMP_LAYER.interactionOverlay,
    "interaction overlay must be above NPC sprites",
  );
  assert(
    BASE_CAMP_LAYER.interactionOverlay < BASE_CAMP_LAYER.highlight,
    "highlight must be above interaction overlay",
  );
  assert(resolveNextBlinkDelay(0, 5000, 10000) === 5000, "random 0");
  assert(resolveNextBlinkDelay(1, 5000, 10000) === 10000, "random 1");
  assert(
    resolveNextBlinkDelay(0.5, 5000, 10000) === 7500,
    "random midpoint",
  );
}
