export const BASE_CAMP_NPC_DISPLAY_SCALE = 0.3;

export const BASE_CAMP_NPC_SLOT_IDS = {
  lunaOriginal: "lunaNpc",
  theoOriginal: "theoNpc",
  kaidenOriginal: "kaidenNpc",
  jeon: "jeonNpc",
  denebCommander: "denebCommanderNpc",
} as const;

export type BaseCampNpcSlotId =
  (typeof BASE_CAMP_NPC_SLOT_IDS)[keyof typeof BASE_CAMP_NPC_SLOT_IDS];

export type BaseCampNpcSlot = {
  id: BaseCampNpcSlotId;
  anchorX: number;
  groundY: number;
  baseWidth: number;
  baseHeight: number;
  focusPointId: BaseCampNpcSlotId;
};

export const BASE_CAMP_NPC_SLOTS: Record<
  BaseCampNpcSlotId,
  BaseCampNpcSlot
> = {
  lunaNpc: {
    id: "lunaNpc",
    anchorX: 330,
    groundY: 782,
    baseWidth: 380,
    baseHeight: 600,
    focusPointId: "lunaNpc",
  },
  theoNpc: {
    id: "theoNpc",
    anchorX: 555,
    groundY: 782,
    baseWidth: 380,
    baseHeight: 600,
    focusPointId: "theoNpc",
  },
  kaidenNpc: {
    id: "kaidenNpc",
    anchorX: 1170,
    groundY: 782,
    baseWidth: 400,
    baseHeight: 700,
    focusPointId: "kaidenNpc",
  },
  jeonNpc: {
    id: "jeonNpc",
    anchorX: 1435,
    groundY: 782,
    baseWidth: 400,
    baseHeight: 700,
    focusPointId: "jeonNpc",
  },
  denebCommanderNpc: {
    id: "denebCommanderNpc",
    anchorX: 1030,
    groundY: 782,
    baseWidth: 400,
    baseHeight: 700,
    focusPointId: "denebCommanderNpc",
  },
};

export const BASE_CAMP_NPC_SLOT_ASSIGNMENTS = {
  luna: BASE_CAMP_NPC_SLOT_IDS.lunaOriginal,
  theo: BASE_CAMP_NPC_SLOT_IDS.theoOriginal,
  kaiden: BASE_CAMP_NPC_SLOT_IDS.kaidenOriginal,
  jeon: BASE_CAMP_NPC_SLOT_IDS.jeon,
  denebCommander: BASE_CAMP_NPC_SLOT_IDS.denebCommander,
} as const;

export function getBaseCampNpcPlacement(slotId: BaseCampNpcSlotId) {
  const slot = BASE_CAMP_NPC_SLOTS[slotId];
  const width = slot.baseWidth * BASE_CAMP_NPC_DISPLAY_SCALE;
  const height = slot.baseHeight * BASE_CAMP_NPC_DISPLAY_SCALE;
  const anchorY = slot.groundY;

  return {
    x: slot.anchorX - width / 2,
    y: anchorY - height,
    width,
    height,
  };
}

export function getBaseCampNpcFocusTarget(slotId: BaseCampNpcSlotId) {
  const slot = BASE_CAMP_NPC_SLOTS[slotId];
  const placement = getBaseCampNpcPlacement(slotId);

  return {
    x: slot.anchorX,
    y: placement.y + placement.height / 2,
  };
}
