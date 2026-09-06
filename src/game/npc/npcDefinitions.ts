import lunaStanding from "../../assets/npcs/chapter2/luna/standing_L.png";
import lunaBlink from "../../assets/npcs/chapter2/luna/blink_L.png";
import lunaPortrait from "../../assets/npcs/chapter2/luna/portrait.png";
import theoStanding from "../../assets/npcs/chapter2/theo/standing_L.png";
import theoBlink from "../../assets/npcs/chapter2/theo/blink_L.png";
import theoPortrait from "../../assets/npcs/chapter2/theo/portrait.png";
import aronStanding from "../../assets/npcs/chapter2/aron/standing_R.png";
import aronBlink from "../../assets/npcs/chapter2/aron/blink_R.png";
import aronPortrait from "../../assets/npcs/chapter2/aron/portrait.png";
import kappStanding from "../../assets/npcs/chapter2/kapp/standing_R.png";
import kappBlink from "../../assets/npcs/chapter2/kapp/blink_R.png";
import kappPortrait from "../../assets/npcs/chapter2/kapp/portrait.png";
import type { NpcDefinition, NpcId } from "./npcTypes";
import {
  BASE_CAMP_NPC_SLOT_ASSIGNMENTS,
  getBaseCampNpcPlacement,
} from "./baseCampNpcSlots";

const commonIdle = {
  blinkFrameWidth: 380,
  blinkFrameHeight: 600,
  blinkFrameDurationMs: 200,
  minBlinkIntervalMs: 5000,
  maxBlinkIntervalMs: 10000,
};

export const NPC_DEFINITIONS: readonly NpcDefinition[] = [
  {
    id: "luna",
    displayName: "루나",
    role: "지형 분석가",
    baseCampDisplayRole: "지형 분석가",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna,
    idle: {
      ...commonIdle,
      standingImage: lunaStanding,
      blinkSpriteSheet: lunaBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: lunaPortrait, happy: lunaPortrait },
    dialogue: {
      defaultStorySequenceId: "npc-luna-default",
      questAvailableStorySequenceId: "npc-luna-floor-3-quest-available",
      questActiveStorySequenceId: "npc-luna-floor-3-quest-active",
    },
    offeredQuestIds: ["quest-floor-2-memory-fragment", "quest-floor-3-torn-cloth", "quest-floor-4-jeon-rescue", "quest-floor-9-goryeo-society-culture"],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.luna),
  },
  {
    id: "theo",
    displayName: "테오",
    role: "보급 담당",
    baseCampDisplayRole: "상점",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo,
    idle: {
      ...commonIdle,
      standingImage: theoStanding,
      blinkSpriteSheet: theoBlink,
      blinkFrameCount: 4,
    },
    portraits: { default: theoPortrait },
    dialogue: { defaultStorySequenceId: "npc-theo-default", questAvailableStorySequenceId: "npc-theo-floor-1-quest-available", questActiveStorySequenceId: "npc-theo-floor-1-quest-active" },
    offeredQuestIds: ["quest-floor-1-prehistory", "quest-floor-5-unified-silla", "quest-floor-7-goryeo-founding"],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.theo),
  },
  {
    id: "kaiden",
    displayName: "아론",
    role: "지휘관",
    baseCampDisplayRole: "지휘관",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden,
    idle: {
      ...commonIdle,
      standingImage: aronStanding,
      blinkSpriteSheet: aronBlink,
      blinkFrameCount: 5,
      blinkFrameWidth: 400,
      blinkFrameHeight: 700,
    },
    portraits: { default: aronPortrait, serious: aronPortrait },
    dialogue: {
      defaultStorySequenceId: "npc-kaiden-default",
      questAvailableStorySequenceId: "npc-kaiden-quest-available",
      questActiveStorySequenceId: "npc-kaiden-quest-active",
    },
    offeredQuestIds: ["quest-floor-6-balhae", "quest-floor-8-goryeo-relations", "quest-floor-10-final-source"],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.kaiden),
  },
  {
    id: "jeon",
    displayName: "카프",
    role: "부지휘관",
    baseCampDisplayRole: "부지휘관",
    baseCampSpawnId: BASE_CAMP_NPC_SLOT_ASSIGNMENTS.jeon,
    idle: {
      ...commonIdle,
      standingImage: kappStanding,
      blinkSpriteSheet: kappBlink,
      blinkFrameCount: 5,
      blinkFrameWidth: 400,
      blinkFrameHeight: 700,
    },
    portraits: {
      default: kappPortrait,
    },
    dialogue: { defaultStorySequenceId: "npc-jeon-default" },
    offeredQuestIds: [],
    placement: getBaseCampNpcPlacement(BASE_CAMP_NPC_SLOT_ASSIGNMENTS.jeon),
  },
];

export const NPC_BY_ID = Object.fromEntries(
  NPC_DEFINITIONS.map((npc) => [npc.id, npc]),
) as Record<NpcId, NpcDefinition>;
