// Persist the question attempt in the existing seed string without changing the map seed.
const QUESTION_ATTEMPT_MARKER = "::question-attempt:";
let attemptSerial = 0;

export function getQuestionMapSeed(seed: string): string {
  const marker = seed.indexOf(QUESTION_ATTEMPT_MARKER);
  return marker < 0 ? seed : seed.slice(0, marker);
}

export function createQuestionAttemptSeed(
  mapSeed: string,
  random: () => number = Math.random,
  now: () => number = Date.now,
): string {
  attemptSerial += 1;
  return `${getQuestionMapSeed(mapSeed)}${QUESTION_ATTEMPT_MARKER}${now()}-${attemptSerial}-${random()}`;
}
