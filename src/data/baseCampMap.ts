import type { BaseCampMapDefinition } from "../types/baseCamp";
import {
  BASE_CAMP_NPC_SLOT_IDS,
  getBaseCampNpcFocusTarget,
} from "../game/npc/baseCampNpcSlots";

const baseCampAssetUrl = (fileName: string) =>
  `${import.meta.env.BASE_URL}assets/baseCamp/${fileName}`;

const lunaNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.lunaOriginal,
);
const theoNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.theoOriginal,
);
const kaidenNpcFocus = getBaseCampNpcFocusTarget(
  BASE_CAMP_NPC_SLOT_IDS.kaidenOriginal,
);
const jeonNpcFocus = getBaseCampNpcFocusTarget(BASE_CAMP_NPC_SLOT_IDS.jeon);

export const BASE_CAMP_MAP: BaseCampMapDefinition = {
  id: "academy-base-camp",
  worldWidth: 1717,
  worldHeight: 916,
  layers: {
    sky: baseCampAssetUrl("chapter2/sky.png"),
    background: baseCampAssetUrl("chapter2/background.png"),
    ground: baseCampAssetUrl("chapter2/ground.png"),
    dungeonEntrance: baseCampAssetUrl("chapter2/dungeonEntrance.png"),
    dungeonEntranceButton: baseCampAssetUrl("chapter2/dungeonEntrance.png"),
    foreground: baseCampAssetUrl("chapter2/foreground.png"),
  },
  focusPoints: {
    campCenter: {
      id: "campCenter",
      x: 858.5,
      y: 500,
      zoom: 1,
    },
    dungeonEntrance: {
      id: "dungeonEntrance",
      x: 848.5,
      y: 570,
      zoom: 1.45,
      offsetY: -20,
    },
    questNpc01: {
      id: "questNpc01",
      x: 1435,
      y: 650,
      zoom: 1.35,
      offsetY: -30,
    },
    lunaNpc: {
      id: "lunaNpc",
      ...lunaNpcFocus,
      zoom: 1.4,
    },
    theoNpc: {
      id: "theoNpc",
      ...theoNpcFocus,
      zoom: 1.4,
    },
    kaidenNpc: {
      id: "kaidenNpc",
      ...kaidenNpcFocus,
      zoom: 1.4,
    },
    jeonNpc: {
      id: "jeonNpc",
      ...jeonNpcFocus,
      zoom: 1.4,
    },
  },
  interactionRegions: [
    {
      id: "dungeonEntrance",
      label: "dungeonEntrance",
      x: 582,
      y: 374,
      width: 533,
      height: 393,
    },
    {
      id: "questNpc01",
      label: "questNpc01 (임시 영역)",
      x: 1375,
      y: 570,
      width: 210,
      height: 220,
      markerX: 1435,
      markerY: 650,
    },
  ],
};
