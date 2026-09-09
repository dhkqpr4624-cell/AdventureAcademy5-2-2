import { getQuestRareRewardCondition } from "../game/quest/questRareRewardConditions";

export type AchievementDefinition = {
  id: string;
  floorId: string;
  floorTitle: string;
  title: string;
  rewardIcon: string;
  rewardItemId: string;
  rewardStateId: string;
  requiredCorrect: number;
  totalQuestions: number;
  description: string;
};

const floor2RareRewardCondition = getQuestRareRewardCondition(
  "quest-floor-2-memory-fragment",
);
const floor4RareRewardCondition = getQuestRareRewardCondition("quest-floor-4-jeon-rescue");
const floor5RareRewardCondition = getQuestRareRewardCondition("quest-floor-5-unified-silla");
const floor6RareRewardCondition = getQuestRareRewardCondition("quest-floor-6-balhae");
const floor7RareRewardCondition = getQuestRareRewardCondition("quest-floor-7-goryeo-founding");
const floor8RareRewardCondition = getQuestRareRewardCondition("quest-floor-8-goryeo-relations");
const floor9RareRewardCondition = getQuestRareRewardCondition("quest-floor-9-goryeo-society-culture");

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  {
    id: "achievement-floor-2-rare-reward",
    floorId: "floor-2",
    floorTitle: "던전 2층",
    title: "양반의 부채",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/yangban-folding-fan.png`,
    rewardItemId: "weapon-yangban-folding-fan",
    rewardStateId: "quest-floor-2-memory-fragment",
    requiredCorrect: floor2RareRewardCondition.requiredCorrect,
    totalQuestions: floor2RareRewardCondition.totalQuestions,
    description: "던전 2층 정답",
  },
  {
    id: "achievement-floor-3-guaranteed-reward",
    floorId: "floor-3",
    floorTitle: "던전 3층",
    title: "앙부일구 투구 획득",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/angbuilgu-helmet.png`,
    rewardItemId: "armor-angbuilgu-helmet",
    rewardStateId: "quest-floor-3-torn-cloth",
    requiredCorrect: 0,
    totalQuestions: 10,
    description: "던전 3층 확정 장비 보상 획득",
  },
  {
    id: "achievement-floor-4-rare-reward",
    floorId: "floor-4",
    floorTitle: "던전 4층",
    title: "충무공(이순신) 장검 모양 지팡이 획득",
    rewardIcon: `${import.meta.env.BASE_URL}assets/items/chungmugong-long-sword.png`,
    rewardItemId: "weapon-chiljido",
    rewardStateId: "quest-floor-4-jeon-rescue",
    requiredCorrect: floor4RareRewardCondition.requiredCorrect,
    totalQuestions: floor4RareRewardCondition.totalQuestions,
    description: "던전 4층 희귀 보상 획득",
  },
  {
    id: "achievement-floor-5-rare-reward", floorId: "floor-5", floorTitle: "던전 5층",
    title: "삼국 통일의 과정", rewardIcon: `${import.meta.env.BASE_URL}assets/items/munmu-armor.png`,
    rewardItemId: "armor-munmu", rewardStateId: "quest-floor-5-unified-silla",
    requiredCorrect: floor5RareRewardCondition.requiredCorrect, totalQuestions: floor5RareRewardCondition.totalQuestions,
    description: "던전 5층 정답",
  },
  {
    id: "achievement-floor-6-rare-reward", floorId: "floor-6", floorTitle: "던전 6층",
    title: "발해 유민의 정체", rewardIcon: `${import.meta.env.BASE_URL}assets/items/silla-ring-pommel-sword.png`,
    rewardItemId: "weapon-silla-ring-pommel-sword", rewardStateId: "quest-floor-6-balhae",
    requiredCorrect: floor6RareRewardCondition.requiredCorrect, totalQuestions: floor6RareRewardCondition.totalQuestions,
    description: "던전 6층 정답",
  },
  {
    id: "achievement-floor-7-rare-reward", floorId: "floor-7", floorTitle: "던전 7층",
    title: "고려의 기둥", rewardIcon: `${import.meta.env.BASE_URL}assets/items/gungye-eyepatch.png`,
    rewardItemId: "accessory-gungye-eyepatch", rewardStateId: "quest-floor-7-goryeo-founding",
    requiredCorrect: floor7RareRewardCondition.requiredCorrect, totalQuestions: floor7RareRewardCondition.totalQuestions,
    description: "던전 7층 정답",
  },
  {
    id: "achievement-floor-8-rare-reward", floorId: "floor-8", floorTitle: "던전 8층",
    title: "고려와 주변 국가의 관계", rewardIcon: `${import.meta.env.BASE_URL}assets/items/choe-museon-cannon.png`,
    rewardItemId: "weapon-choe-museon-cannon", rewardStateId: "quest-floor-8-goryeo-relations",
    requiredCorrect: floor8RareRewardCondition.requiredCorrect, totalQuestions: floor8RareRewardCondition.totalQuestions,
    description: "던전 8층 정답",
  },
  {
    id: "achievement-floor-9-rare-reward", floorId: "floor-9", floorTitle: "던전 9층",
    title: "고려시대의 사회와 문화", rewardIcon: `${import.meta.env.BASE_URL}assets/items/tripitaka-koreana.png`,
    rewardItemId: "armor-tripitaka-koreana", rewardStateId: "quest-floor-9-goryeo-society-culture",
    requiredCorrect: floor9RareRewardCondition.requiredCorrect, totalQuestions: floor9RareRewardCondition.totalQuestions,
    description: "던전 9층 정답",
  },
];
