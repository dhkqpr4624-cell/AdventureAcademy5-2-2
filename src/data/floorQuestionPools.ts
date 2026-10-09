import type { FloorId } from "../game/floor/floorTypes";
import type { Question } from "../types/question";
import {
  DUNGEON1_UNIT2_QUESTIONS,
  DUNGEON2_UNIT2_QUESTIONS,
  DUNGEON3_UNIT2_QUESTIONS,
  DUNGEON4_UNIT2_QUESTIONS,
  DUNGEON5_UNIT2_QUESTIONS,
  DUNGEON6_UNIT2_QUESTIONS,
  DUNGEON7_UNIT2_QUESTIONS,
  DUNGEON8_UNIT2_QUESTIONS,
  DUNGEON9_UNIT2_QUESTIONS,
} from "./unit2Questions";

// 활성 문제 pool은 2단원 문제만 사용한다. 이전 1단원 문항(testQuestions.ts, historyQuestions.ts)은 연결하지 않는다.
export const FLOOR_QUESTION_POOLS: Readonly<Record<Exclude<FloorId, "floor-10">, readonly Question[]>> = {
  "floor-1": DUNGEON1_UNIT2_QUESTIONS,
  "floor-2": DUNGEON2_UNIT2_QUESTIONS,
  "floor-3": DUNGEON3_UNIT2_QUESTIONS,
  "floor-4": DUNGEON4_UNIT2_QUESTIONS,
  "floor-5": DUNGEON5_UNIT2_QUESTIONS,
  "floor-6": DUNGEON6_UNIT2_QUESTIONS,
  "floor-7": DUNGEON7_UNIT2_QUESTIONS,
  "floor-8": DUNGEON8_UNIT2_QUESTIONS,
  "floor-9": DUNGEON9_UNIT2_QUESTIONS,
};

export const DUNGEON_1_TO_9_QUESTION_POOL: readonly Question[] =
  Object.values(FLOOR_QUESTION_POOLS).flat();
