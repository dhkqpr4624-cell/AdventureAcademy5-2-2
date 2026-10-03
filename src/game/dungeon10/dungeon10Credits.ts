import { DUNGEON10_ASSET_URLS } from "./dungeon10Assets";

/**
 * Ending credits text. Each "---" block of the specification is one section;
 * lines are kept verbatim. "(플레이어 이름)" is replaced with the saved name.
 */
export type CreditLine = { text: string; role: "title" | "heading" | "line" | "name" | "spacer" };
export type CreditSection = { key: string; lines: readonly CreditLine[] };

const t = (text: string): CreditLine => ({ text, role: "title" });
const h = (text: string): CreditLine => ({ text, role: "heading" });
const l = (text: string): CreditLine => ({ text, role: "line" });
const n = (text: string): CreditLine => ({ text, role: "name" });
const gap: CreditLine = { text: "", role: "spacer" };

export const DUNGEON10_CREDIT_SECTIONS: readonly CreditSection[] = [
  { key: "opening", lines: [t("ADVENTURE ACADEMY"), gap, h("어드벤처 아카데미")] },
  { key: "production", lines: [h("기획 · 제작"), gap, n("[고구마맛탕탕]")] },
  { key: "game-design", lines: [h("GAME DESIGN"), gap, l("게임 기획"), l("학습 콘텐츠 설계"), l("스토리 및 퀘스트 구성"), l("전투 및 던전 시스템 설계"), gap, n("[고구마맛탕탕]")] },
  { key: "development", lines: [h("DEVELOPMENT"), gap, l("게임 프로그래밍"), l("UI / UX 구현"), l("게임 시스템 개발"), gap, n("[고구마맛탕탕]")] },
  { key: "art", lines: [h("ART & DESIGN"), gap, l("캐릭터 디자인"), l("몬스터 디자인"), l("배경 및 던전 디자인"), l("UI 디자인"), l("아이템 및 이펙트 디자인"), gap, n("[고구마맛탕탕]")] },
  { key: "story", lines: [h("STORY"), gap, l("세계관 설정"), l("시나리오"), l("캐릭터 및 대사"), gap, n("[고구마맛탕탕, 해장국밥]")] },
  { key: "education", lines: [h("EDUCATIONAL CONTENT"), gap, l("학습 콘텐츠 기획"), l("문제 및 해설 제작"), l("교육과정 연계"), gap, n("[고구마맛탕탕, 해장국밥]")] },
  { key: "sound", lines: [h("MUSIC & SOUND"), gap, l("Background Music"), l("Sound Effects"), gap, n("[Eleven labs]")] },
  { key: "thanks", lines: [h("SPECIAL THANKS"), gap, l("이 모험을 함께해 준"), l("모든 학생들에게"), gap, l("그리고"), gap, l("끝까지 이 이야기를 플레이해 준"), l("당신에게.")] },
  { key: "academy", lines: [t("ADVENTURE ACADEMY")] },
  { key: "luna", lines: [h("정찰 담당"), gap, n("「루나」")] },
  { key: "theo", lines: [h("보급 담당"), gap, n("「테오」")] },
  { key: "karp", lines: [h("전투 및 부지휘관"), gap, n("「카프」")] },
  { key: "aron", lines: [h("지휘관"), gap, n("「아론」")] },
  { key: "deneb", lines: [h("되돌아온 영웅"), gap, n("「데네브」")] },
  { key: "hero", lines: [h("주인공"), gap, n("「(플레이어 이름)」")] },
];

/** Right-side images, in fixed order, each shown for an equal share of the window. */
export const DUNGEON10_CREDIT_IMAGES: readonly string[] = [
  DUNGEON10_ASSET_URLS.creditReturn,
  DUNGEON10_ASSET_URLS.creditTheoLuna,
  DUNGEON10_ASSET_URLS.creditAron,
  DUNGEON10_ASSET_URLS.creditKarp,
  DUNGEON10_ASSET_URLS.creditDeneb,
];

/** Image window: from the "기획 · 제작" section entering to the end of "되돌아온 영웅 「데네브」". */
export const DUNGEON10_CREDIT_IMAGE_START_KEY = "production";
export const DUNGEON10_CREDIT_IMAGE_END_KEY = "deneb";
export const DUNGEON10_CREDIT_FINAL_KEY = "hero";

/** Seconds the text needs to cross one viewport height (keeps speed readable on any screen). */
export const DUNGEON10_CREDIT_VIEWPORTS_PER_SECOND = 1 / 7.5;
export const DUNGEON10_CREDIT_FINAL_HOLD_MS = 2500;
export const DUNGEON10_CREDIT_FADE_OUT_MS = 1400;
export const DUNGEON10_CREDIT_IMAGE_FADE_MS = 900;

export function resolveCreditText(text: string, playerName: string): string {
  const name = playerName.trim() || "플레이어";
  return text.replaceAll("(플레이어 이름)", name);
}

export type CreditTimeline = {
  scrollMs: number;
  imageStartMs: number;
  imageEndMs: number;
  imageSliceMs: number;
};

/**
 * Pure timing: the track moves at a constant speed from just below the
 * viewport until the final section is centred.
 */
export function computeCreditTimeline(input: {
  viewportHeight: number;
  finalSectionTop: number;
  finalSectionHeight: number;
  /** Track Y of the top of the "기획 · 제작" section. */
  imageStartTop: number;
  /** Track Y where the Deneb portion ends (top of the final "주인공" section). */
  imageEndAt: number;
}): CreditTimeline {
  const speed = Math.max(1, input.viewportHeight) * DUNGEON10_CREDIT_VIEWPORTS_PER_SECOND; // px per second
  // offset(t) = viewportHeight - speed·t ; a section at `top` enters when offset + top = viewportHeight.
  const finalCentredOffset = input.viewportHeight / 2 - (input.finalSectionTop + input.finalSectionHeight / 2);
  const scrollMs = ((input.viewportHeight - finalCentredOffset) / speed) * 1000;
  const imageStartMs = (input.imageStartTop / speed) * 1000;
  // The Deneb portion ends when the final "주인공" section starts entering the viewport.
  const imageEndMs = (input.imageEndAt / speed) * 1000;
  const imageSliceMs = Math.max(1, (imageEndMs - imageStartMs) / DUNGEON10_CREDIT_IMAGES.length);
  return { scrollMs, imageStartMs, imageEndMs, imageSliceMs };
}

/**
 * Opacity of image `index` at `elapsedMs`: fade in → hold → fade out. Adjacent
 * images cross-fade around their shared boundary on the black credits
 * background, so no white frame can appear between them.
 */
export function creditImageOpacity(timeline: CreditTimeline, index: number, elapsedMs: number): number {
  const count = DUNGEON10_CREDIT_IMAGES.length;
  const start = timeline.imageStartMs + index * timeline.imageSliceMs;
  const end = start + timeline.imageSliceMs;
  const fade = Math.min(DUNGEON10_CREDIT_IMAGE_FADE_MS, timeline.imageSliceMs / 3);
  const fadeInStart = index === 0 ? start : start - fade / 2;
  const fadeOutEnd = index === count - 1 ? end : end + fade / 2;
  if (elapsedMs <= fadeInStart || elapsedMs >= fadeOutEnd) return 0;
  const fadeIn = Math.min(1, (elapsedMs - fadeInStart) / fade);
  const fadeOut = Math.min(1, (fadeOutEnd - elapsedMs) / fade);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}
