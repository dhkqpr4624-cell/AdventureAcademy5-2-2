import unit2Source from "./data/unit2QuestionsSource.txt?raw";
import { DUNGEON_1_TO_9_QUESTION_POOL, FLOOR_QUESTION_POOLS } from "./data/floorQuestionPools";
import { FLOOR1_PREHISTORY_QUESTIONS, FLOOR2_GOJOSEON_QUESTIONS } from "./data/testQuestions";
import {
  FLOOR3_GOGURYEO_BAEKJE_QUESTIONS,
  FLOOR4_SILLA_GAYA_QUESTIONS,
  FLOOR5_UNIFIED_SILLA_QUESTIONS,
  FLOOR6_BALHAE_QUESTIONS,
  FLOOR7_GORYEO_FOUNDING_QUESTIONS,
  FLOOR8_GORYEO_RELATIONS_QUESTIONS,
  FLOOR9_GORYEO_CULTURE_QUESTIONS,
} from "./data/historyQuestions";
import { BOSS_QUIZ_QUESTION_COUNT, createBossQuizQuestions } from "./game/bossCombat/BossQuizFlow";
import { gradeQuestion } from "./game/question/questionGrading";
import { QUEST_RARE_REWARD_CONDITIONS } from "./game/quest/questRareRewardConditions";
import type { FloorId } from "./game/floor/floorTypes";
import type { Question } from "./types/question";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[unit2QuestionContentChecks] ${message}`);
}

type Floor = Exclude<FloorId, "floor-10">;
const FLOORS: Floor[] = ["floor-1", "floor-2", "floor-3", "floor-4", "floor-5", "floor-6", "floor-7", "floor-8", "floor-9"];
const CIRCLED = ["①", "②", "③", "④"];

type Expected = { no: number; prompt: string; type: Question["type"]; options?: string[]; answers: string[]; explanation: string };

/**
 * Independent parser of the user-provided source text (src/data/unit2QuestionsSource.txt).
 * The game data in unit2Questions.ts was generated separately; both must agree exactly.
 */
function parseSource(source: string): Record<number, Expected[]> {
  const result: Record<number, Expected[]> = {};
  const sections = source.replace(/\r\n/g, "\n").split(/^<던전 (\d)층[^>\n]*>[ \t]*$/m);
  for (let index = 1; index < sections.length; index += 2) {
    const floor = Number(sections[index]);
    const blocks = sections[index + 1].split(/^(?:\*\*(\d+)\.\*\*[ \t]*\n|(\d+)\.[ \t]+(?=문제:))/m);
    const questions: Expected[] = [];
    for (let blockIndex = 1; blockIndex < blocks.length; blockIndex += 3) {
      const no = Number(blocks[blockIndex] ?? blocks[blockIndex + 1]);
      const body = blocks[blockIndex + 2];
      const match = /^문제: ?([\s\S]*?)\n정답: ?(.*)\n해설: ?([\s\S]*)$/.exec(body.trimEnd());
      assert(match, `source floor ${floor} #${no} is not 문제/정답/해설`);
      const [, rawPrompt, rawAnswer, explanation] = match;
      const answer = rawAnswer.trim();
      if (answer === "O" || answer === "X") {
        questions.push({ no, prompt: rawPrompt.trimEnd(), type: "trueFalse", answers: [answer], explanation: explanation.trim() });
        continue;
      }
      const optionStart = rawPrompt.indexOf("①");
      if (optionStart < 0) {
        questions.push({ no, prompt: rawPrompt.trimEnd(), type: "shortAnswer", answers: [answer], explanation: explanation.trim() });
        continue;
      }
      const optionText = rawPrompt.slice(optionStart);
      const options = optionText.split(/[①②③④]/).slice(1).map((option) => option.trim());
      const picks = answer.split(",").map((part) => CIRCLED.indexOf(part.trim()));
      assert(picks.every((pick) => pick >= 0 && pick < options.length), `source floor ${floor} #${no} answer is outside the options`);
      questions.push({
        no,
        prompt: rawPrompt.slice(0, optionStart).trimEnd(),
        type: picks.length > 1 ? "multipleSelect" : "multipleChoice",
        options,
        answers: picks.map((pick) => options[pick]),
        explanation: explanation.trim(),
      });
    }
    result[floor] = questions;
  }
  return result;
}

const answersOf = (question: Question): string[] => {
  switch (question.type) {
    case "trueFalse": return [question.correctAnswer ? "O" : "X"];
    case "multipleChoice": return [question.correctAnswer];
    case "multipleSelect": return [...question.correctAnswers];
    case "shortAnswer": return [...question.acceptedAnswers];
  }
};
const byNumber = (floor: number, no: number) => FLOOR_QUESTION_POOLS[`floor-${floor}` as Floor][no - 1];
const correct = (floor: number, no: number, ...circled: string[]) => {
  const question = byNumber(floor, no);
  assert(question.type === "multipleChoice" || question.type === "multipleSelect", `D${floor}-${no} must be a choice question`);
  const expected = circled.map((mark) => question.options[CIRCLED.indexOf(mark)]);
  const actual = question.type === "multipleChoice" ? [question.correctAnswer] : question.correctAnswers;
  assert(JSON.stringify(actual) === JSON.stringify(expected), `D${floor}-${no} answer must be ${circled.join(", ")}`);
  assert(question.type === (circled.length > 1 ? "multipleSelect" : "multipleChoice"), `D${floor}-${no} type`);
};
const shortIs = (floor: number, no: number, answer: string) => {
  const question = byNumber(floor, no);
  assert(question.type === "shortAnswer" && question.acceptedAnswers[0] === answer, `D${floor}-${no} answer must be ${answer}`);
};
const oxIs = (floor: number, no: number, answer: boolean) => {
  const question = byNumber(floor, no);
  assert(question.type === "trueFalse" && question.correctAnswer === answer, `D${floor}-${no} OX answer must be ${answer ? "O" : "X"}`);
};

export function runUnit2QuestionContentChecks(): void {
  // 1. Exact match with the source text, question by question.
  const expected = parseSource(unit2Source);
  assert(Object.keys(expected).join() === "1,2,3,4,5,6,7,8,9", "source must contain floors 1-9");
  for (let floor = 1; floor <= 9; floor += 1) {
    const pool = FLOOR_QUESTION_POOLS[`floor-${floor}` as Floor];
    const source = expected[floor];
    assert(source.length === 20 && source.every((item, index) => item.no === index + 1), `source floor ${floor} must list 1-20`);
    assert(pool.length === 20, `floor ${floor} must have exactly 20 questions`);
    source.forEach((item, index) => {
      const question = pool[index];
      const label = `D${floor}-${item.no}`;
      assert(question.prompt === item.prompt, `${label} prompt differs from the source`);
      assert(question.type === item.type, `${label} type ${question.type} !== ${item.type}`);
      assert(question.explanation === item.explanation, `${label} explanation differs from the source`);
      assert(JSON.stringify(answersOf(question)) === JSON.stringify(item.answers), `${label} answer differs from the source`);
      const options = "options" in question ? question.options : undefined;
      assert(JSON.stringify(options) === JSON.stringify(item.options), `${label} options differ from the source`);
    });
  }

  // 2. Integrity of every active question.
  const all = FLOORS.flatMap((floor) => FLOOR_QUESTION_POOLS[floor].map((question) => ({ floor, question })));
  assert(all.length === 180, "180 questions in total");
  assert(new Set(all.map(({ question }) => question.id)).size === 180, "question ids must be unique");
  const lessonByFloor = new Map<Floor, string>();
  for (const { floor, question } of all) {
    assert(question.id && question.prompt.trim() && question.explanation.trim(), `${question.id} must have id, prompt and explanation`);
    assert(!/\*\*|\\|<\/?[a-z]/i.test(question.prompt + question.explanation), `${question.id} must not contain Markdown or HTML markup`);
    if (!lessonByFloor.has(floor)) lessonByFloor.set(floor, question.lessonId);
    assert(question.lessonId === lessonByFloor.get(floor) && question.id.startsWith(`${floor.replace("-", "")}-`), `${question.id} belongs to ${floor}`);
    if (question.type === "multipleChoice") {
      assert(question.options.length === 4 && new Set(question.options).size === 4, `${question.id} has 4 distinct options`);
      assert(question.options.filter((option) => option === question.correctAnswer).length === 1, `${question.id} answer is exactly one option`);
      assert(!question.options.some((option) => /^[①②③④]/.test(option)), `${question.id} options carry no duplicated numbers`);
    } else if (question.type === "multipleSelect") {
      assert(question.options.length === 4 && question.correctAnswers.length >= 2, `${question.id} multi-select shape`);
      assert(new Set(question.correctAnswers).size === question.correctAnswers.length, `${question.id} answers are not duplicated`);
      assert(question.correctAnswers.every((answer) => question.options.includes(answer)), `${question.id} answers are options`);
    } else if (question.type === "shortAnswer") {
      assert(question.acceptedAnswers.length >= 1 && question.acceptedAnswers.every((answer) => answer.trim()), `${question.id} short answer is not empty`);
    } else {
      assert(typeof question.correctAnswer === "boolean", `${question.id} OX answer is boolean`);
    }
  }
  const typeCounts = all.reduce<Record<string, number>>((counts, { question }) => ({ ...counts, [question.type]: (counts[question.type] ?? 0) + 1 }), {});
  assert(JSON.stringify(typeCounts) === JSON.stringify({ trueFalse: 44, multipleSelect: 9, shortAnswer: 55, multipleChoice: 72 }), `type counts ${JSON.stringify(typeCounts)}`);

  // 3. Special cases called out in the request.
  correct(1, 2, "①", "②"); oxIs(1, 4, false); correct(1, 20, "①", "②", "④");
  shortIs(2, 11, "양반, 중인, 상민, 천민"); shortIs(2, 12, "관례, 혼례, 상례, 제례"); correct(2, 18, "④"); correct(2, 20, "①", "②", "④");
  correct(3, 3, "③"); shortIs(3, 7, "해례본"); correct(3, 14, "①", "③"); correct(3, 18, "②", "③");
  shortIs(4, 11, "정유재란"); correct(4, 17, "③"); correct(4, 20, "④");
  correct(5, 9, "①", "②"); correct(5, 16, "③"); oxIs(5, 20, true);
  correct(6, 6, "③"); correct(6, 18, "①", "②"); correct(6, 20, "③");
  shortIs(7, 1, "강화도 조약"); correct(7, 14, "②"); correct(7, 19, "③"); correct(7, 20, "③");
  shortIs(8, 8, "3"); oxIs(8, 13, true); correct(8, 17, "①"); correct(8, 19, "①", "②"); correct(8, 20, "④");
  shortIs(9, 3, "아관 파천"); shortIs(9, 8, "독립 협회"); shortIs(9, 13, "대한 제국"); correct(9, 19, "①", "②", "④"); correct(9, 20, "④");
  for (const [floor, no] of [[4, 20], [7, 20], [8, 20], [9, 20]] as const) {
    assert(byNumber(floor, no).prompt.split("\n").map((line) => line.slice(0, 2)).join() === "다음,ㄱ.,ㄴ.,ㄷ.,ㄹ.", `D${floor}-${no} keeps ㄱ~ㄹ on separate lines`);
  }
  assert(byNumber(8, 17).prompt.split("\n").length === 3, "D8-17 keeps the two reform plans on separate lines");

  // 4. Grading keeps the existing rules (no new grader).
  const short = (floor: number, no: number) => byNumber(floor, no);
  for (const [floor, no, inputs] of [
    [7, 1, ["강화도 조약", "강화도조약", " 강화도  조약. "]],
    [9, 3, ["아관 파천", "아관파천"]],
    [9, 8, ["독립 협회", "독립협회"]],
    [8, 14, ["청일 전쟁", "청일전쟁"]],
    [9, 13, ["대한 제국", "대한제국", "대한제국."]],
    [5, 18, ["세도 정치", "세도정치"]],
    [6, 1, ["서민 문화", "서민문화"]],
    [8, 8, ["3", " 3 "]],
    [2, 11, ["양반, 중인, 상민, 천민", "양반 중인 상민 천민", "양반,중인,상민,천민", "양반중인상민천민"]],
    [2, 12, ["관례, 혼례, 상례, 제례", "관례혼례상례제례"]],
  ] as const) {
    for (const input of inputs) assert(gradeQuestion(short(floor, no), input), `D${floor}-${no} must accept "${input}"`);
    assert(!gradeQuestion(short(floor, no), "오답"), `D${floor}-${no} must reject a wrong answer`);
  }
  assert(gradeQuestion(byNumber(1, 4), false) && !gradeQuestion(byNumber(1, 4), true), "OX X grading");
  assert(gradeQuestion(byNumber(5, 20), true) && !gradeQuestion(byNumber(5, 20), false), "OX O grading");
  const d4 = byNumber(4, 20);
  assert(d4.type === "multipleChoice" && gradeQuestion(d4, "ㄱ-ㄹ-ㄷ-ㄴ") && !gradeQuestion(d4, "ㄱ-ㄷ-ㄹ-ㄴ"), "single choice grading");
  const d1 = byNumber(1, 20);
  assert(d1.type === "multipleSelect", "D1-20 multi-select");
  const [a, b, , d] = d1.options;
  assert(gradeQuestion(d1, [d, a, b]) && !gradeQuestion(d1, [a, b]) && !gradeQuestion(d1, d1.options), "multi-select grading is order-free and exact");

  // 5. Old unit-1 questions are no longer reachable from any gameplay pool.
  const oldPrompts = new Set([
    ...FLOOR1_PREHISTORY_QUESTIONS, ...FLOOR2_GOJOSEON_QUESTIONS, ...FLOOR3_GOGURYEO_BAEKJE_QUESTIONS, ...FLOOR4_SILLA_GAYA_QUESTIONS,
    ...FLOOR5_UNIFIED_SILLA_QUESTIONS, ...FLOOR6_BALHAE_QUESTIONS, ...FLOOR7_GORYEO_FOUNDING_QUESTIONS, ...FLOOR8_GORYEO_RELATIONS_QUESTIONS, ...FLOOR9_GORYEO_CULTURE_QUESTIONS,
  ].map((question) => question.prompt));
  assert(oldPrompts.size >= 150, "old question inventory loaded");
  assert(!all.some(({ question }) => oldPrompts.has(question.prompt)), "no old question in Dungeon1-9 pools");
  assert(!DUNGEON_1_TO_9_QUESTION_POOL.some((question) => oldPrompts.has(question.prompt)), "no old question in the Dungeon10 pool");

  // 6. Dungeon10 draws from the combined 180-question pool with the existing sampler.
  assert(DUNGEON_1_TO_9_QUESTION_POOL.length === 180, "Dungeon10 pool has 180 candidates");
  const activeIds = new Set(all.map(({ question }) => question.id));
  assert(DUNGEON_1_TO_9_QUESTION_POOL.every((question) => activeIds.has(question.id)), "Dungeon10 pool only holds Dungeon1-9 questions");
  assert(BOSS_QUIZ_QUESTION_COUNT === 20, "Dungeon10 still asks 20 questions per attempt");
  const seen = new Set<string>();
  const floorsSeen = new Set<string>();
  for (let attempt = 0; attempt < 400; attempt += 1) {
    const quiz = createBossQuizQuestions(`unit2-check-${attempt}`);
    assert(quiz.length === 20 && new Set(quiz.map((question) => question.id)).size === 20, "one boss attempt has 20 distinct questions");
    quiz.forEach((question) => { seen.add(question.id); floorsSeen.add(question.lessonId); });
    if (attempt === 0) {
      assert(JSON.stringify(quiz) === JSON.stringify(createBossQuizQuestions("unit2-check-0")), "same seed reproduces the same boss quiz");
    }
  }
  assert(seen.size === 180, `400 boss attempts must reach all 180 candidates (reached ${seen.size})`);
  assert(floorsSeen.size === 9, "boss quiz mixes questions from all nine floors");

  // 7. Gameplay counts and rare-reward conditions are untouched.
  const conditions = Object.values(QUEST_RARE_REWARD_CONDITIONS).map((condition) => `${condition.floorId}:${condition.requiredCorrect}/${condition.totalQuestions}`);
  assert(conditions.join() === "floor-1:8/10,floor-2:6/10,floor-3:6/10,floor-4:9/10,floor-5:9/10,floor-6:9/10,floor-7:9/10,floor-8:9/10,floor-9:9/10", `rare reward conditions changed: ${conditions.join()}`);
}
