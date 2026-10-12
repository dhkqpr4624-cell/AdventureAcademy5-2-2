import type { Question } from "../../types/question";
import { createSeededRandom } from "../dungeon/generation/seededRandom";

export function shuffleQuestionOptions(
  question: Question,
  seed: string,
  nextRandom: () => number = createSeededRandom(seed).next,
): readonly string[] {
  if (question.type !== "multipleChoice" && question.type !== "multipleSelect") return [];
  const options = [...question.options];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const other = Math.floor(nextRandom() * (index + 1));
    [options[index], options[other]] = [options[other], options[index]];
  }
  return options;
}
