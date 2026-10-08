import {
  DUNGEON3_COMPLETION_HIDDEN_BASECAMP_NPC_IDS,
  DUNGEON3_COMPLETION_PRELUDE,
  DUNGEON3_CURRENT_STORY,
  DUNGEON3_ENTRY_STORY,
  DUNGEON3_FINAL_STORY,
  DUNGEON3_FLASHBACK,
  DUNGEON3_OFFER_STORY,
} from "./data/stories/dungeon3Chapter2Stories";
import { CHAPTER2_PORTRAITS } from "./data/stories/chapter2Portraits";
import { DUNGEON8_FINAL_STORY } from "./data/stories/dungeon8Stories";
import { NPC_STORY_SEQUENCES } from "./data/stories/npcStories";
import denebUnknownSilhouette from "./assets/portraits/chapter2/deneb/default.png";
import { resolveStoryVisibleNpcIds } from "./game/story/BaseCampStoryAdapter";
import { NPC_DEFINITIONS } from "./game/npc/npcDefinitions";
import type { StorySequence, StoryStep } from "./types/story";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[dungeon3FollowupChecks] ${message}`);
}

const steps = (sequence: StorySequence): StoryStep[] => sequence.scenes.flatMap((scene) => scene.steps);
const fnv = (text: string) => {
  let hash = 0x811c9dc5;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
};
const R16_BEFORE = " 언젠가 이 준비가 되었을 때, 다시 한 번 이 던전을 공략하러 와 주세요. ";
const R16_AFTER = " 언젠가 준비가 되었을 때, 다시 한 번 이 던전을 공략하러 와 주세요. ";

/**
 * Fingerprint of a sequence's steps and settings, independent of the deploy base path.
 * Actors (portraits) are excluded, and r-16 is compared separately, so every other
 * Dungeon3 dialogue, step id, order, speaker, expression and option stays pinned.
 */
export function fingerprintDungeon3Sequence(sequence: StorySequence): { steps: string; meta: string; count: number } {
  const base = import.meta.env.BASE_URL;
  const replacer = (_key: string, value: unknown) => typeof value === "string" && value.startsWith(base) ? `<base>${value.slice(base.length)}` : value;
  const list = steps(sequence).map((step) => step.id === "r-16" && step.type === "dialogue" ? { ...step, text: "<r-16>" } : step);
  const { actors: _actors, scenes: _scenes, ...meta } = sequence;
  return { steps: fnv(JSON.stringify(list, replacer)), meta: fnv(JSON.stringify(meta, replacer)), count: list.length };
}

/** Values measured on the unmodified HEAD sources before this follow-up. */
const EXPECTED_FINGERPRINTS: Record<string, { steps: string; meta: string; count: number }> = {
  offer: { steps: "d83f8736", meta: "8c5fa685", count: 18 },
  entry: { steps: "bc404f28", meta: "2dbd66e7", count: 8 },
  final: { steps: "02bbaf60", meta: "3bd43f9a", count: 54 },
  prelude: { steps: "7c9c85e8", meta: "50a2ef7f", count: 13 },
  flashback: { steps: "8a57fb09", meta: "bc1934f7", count: 63 },
  current: { steps: "decb0a67", meta: "719501bb", count: 25 },
};

const FINAL_UNKNOWN_IDS = ["voice-1", "voice-2"];
const FLASHBACK_UNKNOWN_IDS = ["hq-2", "hq-5", "hq-6", "hq-7", "r-5", "r-6", "r-7", "r-9", "r-10", "r-11", "r-12", "r-14b", "r-14c", "r-14e", "r-14f", "r-14g", "r-14h", "r-14i", "r-15", "r-16", "r-17"];
const NORMAL_DENEB_PORTRAIT = "assets/npcs/chapter2/deneb/portrait-default.png";

export function runDungeon3FollowupChecks(): void {
  const sequences = {
    offer: DUNGEON3_OFFER_STORY, entry: DUNGEON3_ENTRY_STORY, final: DUNGEON3_FINAL_STORY,
    prelude: DUNGEON3_COMPLETION_PRELUDE, flashback: DUNGEON3_FLASHBACK, current: DUNGEON3_CURRENT_STORY,
  };

  // 1. "???" portraits: the existing black silhouette, never the normal Deneb face.
  for (const [sequence, expectedIds] of [[DUNGEON3_FINAL_STORY, FINAL_UNKNOWN_IDS], [DUNGEON3_FLASHBACK, FLASHBACK_UNKNOWN_IDS]] as const) {
    const unknown = steps(sequence).filter((step) => step.type === "dialogue" && step.speakerName === "???");
    assert(JSON.stringify(unknown.map((step) => step.id)) === JSON.stringify(expectedIds), `${sequence.id} ??? step ids changed`);
    for (const step of unknown) {
      assert(step.type === "dialogue" && step.speakerId === "deneb" && step.activeActorId === "deneb", `${step.id} must stay on the Dungeon3 unknown actor`);
      const actor = sequence.actors[step.speakerId];
      const portrait = actor.portraits[step.expression ?? actor.defaultExpression ?? "default"];
      assert(actor.name === "???", `${step.id} actor name must stay ???`);
      assert(portrait?.imageUrl === denebUnknownSilhouette, `${step.id} must use the black silhouette portrait`);
      assert(!portrait.imageUrl.includes("portrait-default.png") && !portrait.imageUrl.includes("assets/npcs/chapter2/deneb/"), `${step.id} must not use a normal Deneb portrait`);
    }
  }
  for (const sequence of Object.values(sequences)) {
    for (const step of steps(sequence)) {
      if (step.type === "dialogue" && step.speakerName === "???") assert(sequence.actors[step.speakerId ?? ""]?.portraits.default?.imageUrl === denebUnknownSilhouette, `${sequence.id}/${step.id} ??? portrait`);
    }
  }
  assert(String(CHAPTER2_PORTRAITS.deneb.expressions.default).endsWith(NORMAL_DENEB_PORTRAIT), "shared Deneb registry must keep the normal portrait");
  assert(Object.keys(CHAPTER2_PORTRAITS.deneb.expressions).join() === "default,smile,angry,sad,hurt", "shared Deneb expressions changed");
  const dungeon8Deneb = DUNGEON8_FINAL_STORY.actors.deneb;
  assert(dungeon8Deneb?.name === "데네브" && String(dungeon8Deneb.portraits.default?.imageUrl).endsWith(NORMAL_DENEB_PORTRAIT), "Dungeon8 Deneb portrait changed");
  const namedDenebStories = Object.values(NPC_STORY_SEQUENCES).filter((sequence) => sequence.actors.deneb?.name === "데네브");
  assert(namedDenebStories.length > 0 && namedDenebStories.every((sequence) => String(sequence.actors.deneb.portraits.default?.imageUrl).endsWith(NORMAL_DENEB_PORTRAIT)), "named Deneb stories must keep the normal portrait");

  // 2. Dialogue: only r-16 lost one "이".
  const allText = Object.values(sequences).flatMap((sequence) => steps(sequence)).map((step) => (step.type === "dialogue" || step.type === "narration" ? step.text : ""));
  assert(!allText.includes(R16_BEFORE), "old r-16 sentence must be gone");
  assert(allText.filter((text) => text === R16_AFTER).length === 1, "new r-16 sentence must appear exactly once");
  const flashback = steps(DUNGEON3_FLASHBACK);
  const r16Index = flashback.findIndex((step) => step.id === "r-16");
  const r16 = flashback[r16Index];
  assert(r16?.type === "dialogue" && r16.text === R16_AFTER && r16.speakerId === "deneb" && r16.speakerName === "???" && r16.expression === "default" && r16.advanceMode === "click", "r-16 step fields changed");
  assert(flashback[r16Index - 1]?.id === "r-15" && flashback[r16Index + 1]?.id === "r-17", "r-16 order changed");
  for (const [name, sequence] of Object.entries(sequences)) {
    const actual = fingerprintDungeon3Sequence(sequence);
    const expected = EXPECTED_FINGERPRINTS[name];
    assert(actual.count === expected.count && actual.steps === expected.steps && actual.meta === expected.meta, `${name} Dungeon3 sequence changed beyond the allowed edit (${JSON.stringify(actual)})`);
  }

  // 3. World NPC: Deneb is left off the story map only for the Dungeon3 completion story.
  assert(JSON.stringify(DUNGEON3_COMPLETION_HIDDEN_BASECAMP_NPC_IDS) === JSON.stringify(["denebCommander"]), "Dungeon3 hidden NPC list mismatch");
  const storyVisible = resolveStoryVisibleNpcIds(DUNGEON3_COMPLETION_HIDDEN_BASECAMP_NPC_IDS);
  assert(storyVisible && !storyVisible.includes("denebCommander"), "Dungeon3 completion map must not render Deneb");
  assert(JSON.stringify(storyVisible) === JSON.stringify(NPC_DEFINITIONS.map((npc) => npc.id).filter((id) => id !== "denebCommander")), "other NPCs must stay on the Dungeon3 completion map");
  assert(["luna", "theo", "kaiden", "jeon"].every((id) => storyVisible.includes(id)), "existing NPCs missing from the Dungeon3 completion map");
  assert(resolveStoryVisibleNpcIds(undefined) === undefined && resolveStoryVisibleNpcIds([]) === undefined, "stories without hidden NPCs must keep the original full NPC list");
}
