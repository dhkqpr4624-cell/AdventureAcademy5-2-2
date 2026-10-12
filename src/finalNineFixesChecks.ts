import { FLOOR_QUESTION_POOLS, DUNGEON_1_TO_9_QUESTION_POOL } from "./data/floorQuestionPools";
import { CHAPTER2_PORTRAITS } from "./data/stories/chapter2Portraits";
import { DUNGEON4_FINAL_STORY } from "./data/stories/dungeon4Chapter2Stories";
import { DUNGEON5_FINAL_STORY } from "./data/stories/dungeon5Stories";
import { DUNGEON7_FINAL_STORY } from "./data/stories/dungeon7Stories";
import { getMonsterVisualDefinition } from "./game/monster/monsterDefinitions";
import { gradeQuestion } from "./game/question/questionGrading";
import { shuffleQuestionOptions } from "./game/question/questionPresentation";
import { createQuestionAttemptSeed, getQuestionMapSeed } from "./game/dungeon/questionAttemptSeed";
import { allocateDungeonRunQuestions } from "./game/dungeon/dungeonRunQuestionAllocator";
import { createDungeonRun } from "./game/dungeon/generation/floor1DungeonRuntime";
import { GENERAL_TRAP_DAMAGE, getTrapDamageForFloor } from "./game/balance/floorBalance";
import { resolveDungeonRoomEvent } from "./game/dungeon/dungeonRoomEventResolver";
import { createBossQuizQuestions } from "./game/bossCombat/BossQuizFlow";
import { prepareFloorDungeonMap } from "./screens/DungeonScreen/DungeonScreen";
import type { FloorId } from "./game/floor/floorTypes";
import denebSilhouette from "./assets/portraits/chapter2/deneb/default.png";

function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`[finalNineFixesChecks] ${message}`);
}
const permutations = (words: readonly string[]): string[][] => words.length === 0 ? [[]] :
  words.flatMap((word, index) => permutations(words.filter((_, i) => i !== index)).map((rest) => [word, ...rest]));

export function runFinalNineFixesChecks(): void {
  const rites = FLOOR_QUESTION_POOLS["floor-2"].find((q) => q.prompt === "관혼상제가 의미하는 네 가지 의례를 모두 쓰세요.");
  assert(rites?.type === "shortAnswer" && rites.unorderedAnswerTokens, "rites metadata");
  const orders = permutations(rites.unorderedAnswerTokens);
  assert(orders.length === 24, "24 permutations");
  for (const words of orders) for (const separator of ["", ", ", ",", " ", "\t", "、", ";", " / "]) {
    assert(gradeQuestion(rites, words.join(separator)), "permutations and separators");
  }
  for (const answer of ["관례 혼례 상례", "관례 혼례 상례 제례 잔치", "관례 관례 상례 제례", "관 혼 상 제", "관례란 혼례란 상례란 제례란", "문장 속 관례 혼례 상례 제례입니다"]) assert(!gradeQuestion(rites, answer), "invalid tokens");
  assert(DUNGEON_1_TO_9_QUESTION_POOL.filter((q) => q.type === "shortAnswer" && q.unorderedAnswerTokens).length === 1, "one question only");
  assert(!gradeQuestion({ ...rites, unorderedAnswerTokens: undefined }, "제례 상례 혼례 관례"), "ordinary order unchanged");
  for (const q of DUNGEON_1_TO_9_QUESTION_POOL) {
    const original = JSON.stringify(q), options = shuffleQuestionOptions(q, "seed", () => 0);
    if (q.type === "multipleChoice" || q.type === "multipleSelect") {
      assert(options.join() === [...q.options.slice(1), q.options[0]].join(), "Fisher Yates");
      assert(JSON.stringify(shuffleQuestionOptions(q, "fixed")) === JSON.stringify(shuffleQuestionOptions(q, "fixed")), "stable order");
      const answers = q.type === "multipleChoice" ? [q.correctAnswer] : q.correctAnswers;
      assert(answers.every((a) => options.includes(a)), "mapping preserved");
      assert(gradeQuestion(q, q.type === "multipleChoice" ? answers[0] : answers), "grading");
    } else assert(options.length === 0, "OX/short excluded");
    assert(JSON.stringify(q) === original, "no mutation");
  }
  for (let floor = 1; floor <= 9; floor++) {
    const id = `floor-${floor}` as FloorId, run = createDungeonRun(id, `nine-fixes-${floor}`);
    const map = prepareFloorDungeonMap(run.map, id, run.seed), first = allocateDungeonRunQuestions(map, run.seed, id);
    const seed = createQuestionAttemptSeed(run.seed, () => .25, () => 123), retry = allocateDungeonRunQuestions(map, seed, id);
    assert(first !== retry && JSON.stringify(first) !== JSON.stringify(retry), "new queue");
    assert(getQuestionMapSeed(seed) === run.seed, "map seed preserved");
    assert(JSON.stringify(createDungeonRun(id, getQuestionMapSeed(seed)).map) === JSON.stringify(run.map), "map restored");
    assert(JSON.stringify(retry) === JSON.stringify(allocateDungeonRunQuestions(map, seed, id)), "queue restored");
    const ids = Object.values(retry).flat().map((q) => q.id);
    assert(ids.length === Object.values(first).flat().length && new Set(ids).size === ids.length, "count and uniqueness");
    for (const room of map.rooms.filter((r) => r.type === "trap")) {
      const result = resolveDungeonRoomEvent(room, false);
      assert(result.damage === 10 && result.message.includes("10의 피해"), "trap10");
      assert(resolveDungeonRoomEvent({ ...room, eventConfig: { damage: 999, questionSetId: "test" } }, false).damage === 10, "no scaling");
      assert(resolveDungeonRoomEvent(room, true).damage === 0, "avoidance");
    }
  }
  for (let floor = 1; floor <= 10; floor++) assert(getTrapDamageForFloor(floor) === GENERAL_TRAP_DAMAGE && GENERAL_TRAP_DAMAGE === 10, "all floors10");
  const a = createBossQuizQuestions("a"), b = createBossQuizQuestions("b");
  assert(a.length === 20 && b.length === 20 && new Set(b.map((q) => q.id)).size === 20, "boss count");
  assert(b.every((q) => DUNGEON_1_TO_9_QUESTION_POOL.includes(q)) && a.map((q) => q.id).join() !== b.map((q) => q.id).join(), "boss pool shuffle");
  assert(getMonsterVisualDefinition("chapter2-angry-yangin").name === "화난 양반", "D2 name");
  assert(getMonsterVisualDefinition("dungeon9-seo-jae-pil").name === "한 맺힌 독립협회 서재필의 영혼", "D9 name");
  assert(getMonsterVisualDefinition("vengeful-goryeo-spirit").aspectRatio === .75, "PNG aspect");
  for (const [story, count] of [[DUNGEON4_FINAL_STORY, 2], [DUNGEON5_FINAL_STORY, 5]] as const) {
    const unknown = story.scenes.flatMap((scene) => scene.steps).filter((step) => step.type === "dialogue" && step.speakerName === "???");
    assert(unknown.length === count && unknown.every((step) => step.type === "dialogue" && story.actors[step.speakerId!].portraits[step.expression!].imageUrl === denebSilhouette), "scoped silhouettes");
  }
  assert(CHAPTER2_PORTRAITS.deneb.expressions.default !== denebSilhouette, "normal registry");
  const steps = DUNGEON7_FINAL_STORY.scenes[0].steps;
  const ministers = steps.filter((step) => step.type === "dialogue" && step.speakerName === "조선의 신하");
  assert(JSON.stringify(ministers.map((step) => step.type === "dialogue" ? step.text : "")) === JSON.stringify([
    "(이 조약을 맺는게 과연 옳은 일일까..?)",
    "(하지만... 지금 당장 일본과의 일을 해결하는 것이 무엇보다 중요한데...)",
    "(다른 나라들은 어떤 조약을 맺고 있는지... 지금까지 알 방도가 없었으니, 이 조약이 과연 옳은 일일지도 판단할 수 없구나...)",
    "(그래, 지금 당장은 일본과의 일을 해결하는 것이 최선이구나...)",
    "알겠소. 당신들과 조약을 맺도록 하지.",
  ]), "five exact lines");
  assert(!steps.some((step) => step.type === "dialogue" && step.speakerId === "gojong"), "old lines removed");
  assert(DUNGEON7_FINAL_STORY.actors.chiefMinister.portraits.default.imageUrl === CHAPTER2_PORTRAITS.chiefMinister.expressions.default, "portrait reuse");
}
