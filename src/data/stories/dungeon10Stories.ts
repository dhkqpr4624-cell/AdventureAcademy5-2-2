import type { StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

/**
 * Dungeon10 dialogue data. Every quoted line of the specification is exactly
 * one click step; lines are never merged or auto-advanced.
 */
const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  deneb: createChapter2Actor("deneb", "데네브", "잊혀진 지휘관", "#bfe7ff"),
};
type ActorId = keyof typeof actors;
type Line = readonly [ActorId | "narration", string, string];

const toSteps = (prefix: string, lines: readonly Line[]): StoryStep[] =>
  lines.map(([actorId, expression, text], index): StoryStep => actorId === "narration"
    ? { id: `${prefix}-${index + 1}`, type: "narration", text, advanceMode: "click" }
    : {
        id: `${prefix}-${index + 1}`,
        type: "dialogue",
        speakerId: actorId,
        speakerName: actors[actorId].name,
        activeActorId: actorId,
        expression,
        text,
        advanceMode: "click",
      });

const sequence = (
  id: string,
  title: string,
  lines: readonly Line[],
  options: { dialogueSkip: boolean; onCompleteScreen: StorySequence["onCompleteScreen"] },
): StorySequence => ({
  id,
  title,
  replayable: false,
  skippable: false,
  dialogueSkip: options.dialogueSkip,
  onCompleteScreen: options.onCompleteScreen,
  backgrounds: {},
  actors,
  scenes: [{ id: `${id}-scene`, steps: toSteps(id, lines) }],
});

export const DUNGEON10_QUEST_OFFER_STORY_ID = "npc-deneb-floor-10-quest-available";
export const DUNGEON10_QUEST_ACTIVE_STORY_ID = "npc-deneb-floor-10-quest-active";

export const DUNGEON10_QUEST_OFFER_LINES: readonly Line[] = [
  ["deneb", "angry", "(플레이어 이름), 이제 최종결전이군요. 준비는 되셨나요?"],
  ["deneb", "sad", "사실··· 저는 조금 두려워요."],
  ["deneb", "sad", "여러분과 함께하겠다는 저의 선택 때문에 여러분이 잘못된다면···"],
  ["deneb", "sad", "계속 악몽을 꿔요···. 그 꿈 속에서는, 저의 통제를 벗어난 괴물이 여러분을···."],
  ["deneb", "sad", "어쩌면 여러분의 제안을 거절하고, 계속 던전 안에서 그 괴물을 붙잡고 있었어야 했던 것이 아닐까 계속 생각하게 돼요."],
  ["theo", "sad", "··· 그런 말씀 마십시오."],
  ["theo", "sad", "데네브님의 희생을 발판으로 한 승리는 진정한 승리라고 볼 수 없지요."],
  ["luna", "sad", "데네브 대장, 줄곧 그런 슬픈 생각을 해 왔던 거야...?"],
  ["luna", "sad", "그런 건 싫어! 세상을 구하기 위해 소중한 동료가 희생하는 것을 지켜만 보라니···."],
  ["luna", "sad", "그리고 만약 우리가 잘못되더라도, 그게 데네브 대장 탓일 리 없잖아!"],
  ["aron", "sad", "···."],
  ["aron", "smile", "그리고 전, 저희가 할 수 있을 것이라 믿습니다."],
  ["aron", "smile", "데네브님을 잃고 난 후 7년 동안, 저희는 데네브님 구출만을 생각하며 단련해 왔습니다."],
  ["aron", "smile", "더는 데네브님께 짐이 되지 않을 것입니다."],
  ["kapp", "sad", "···들었죠, 데네브."],
  ["kapp", "sad", "다시는 그런 생각 하지 말아요. 또 그런 말을 하면 걷어 차 주겠어요."],
  ["deneb", "sad", "여러분···."],
  ["kapp", "smile", "고맙다는 인사는 넣어둬요. 못다 한 말은 이곳을 나가고 하죠."],
  ["deneb", "smile", "···후후, 알겠어요."],
  ["deneb", "angry", "여러분 덕분에, 저도 이제 준비가 되었어요."],
  ["deneb", "angry", "고맙다는 말은, 괴물을 무찌른 후에 하겠습니다."],
  ["deneb", "angry", "갑시다! 던전의 심장으로!"],
];

export const DUNGEON10_QUEST_OFFER_STORY = sequence(
  DUNGEON10_QUEST_OFFER_STORY_ID,
  "최종결전",
  DUNGEON10_QUEST_OFFER_LINES,
  { dialogueSkip: true, onCompleteScreen: "baseCamp" },
);

/** Shown when Deneb is clicked while the quest is already active (reuses a spec line). */
export const DUNGEON10_QUEST_ACTIVE_STORY = sequence(
  DUNGEON10_QUEST_ACTIVE_STORY_ID,
  "최종결전",
  [["deneb", "angry", "갑시다! 던전의 심장으로!"]],
  { dialogueSkip: true, onCompleteScreen: "baseCamp" },
);

export const DUNGEON10_ENTRY_LINES: readonly Line[] = [
  ["deneb", "angry", "이 안쪽에 있는 괴물은··· 무엇이든 먹어치우려는 본능에 사로잡혀 있어요. 그 본능 때문에 현실 세계의 시간조차 먹어 치우려 했던 거죠."],
  ["deneb", "angry", "제가 막고 있던 7년이라는 시간 동안 제대로 된 식사를 못한 그 괴물은, 아마 매우 흉폭해져 있겠죠."],
  ["deneb", "angry", "준비를 단단히 하고 나아가요, (플레이어 이름)."],
];

export const DUNGEON10_ENTRY_STORY = sequence(
  "dungeon10-entry-story",
  "던전 10층",
  DUNGEON10_ENTRY_LINES,
  { dialogueSkip: true, onCompleteScreen: "dungeon" },
);

/** Final Story segments. Each segment is separated by a scripted, non-dialogue beat. */
export const DUNGEON10_FINAL_SEGMENT_LINES = {
  afterBattle: [
    ["luna", "angry", "허억··· 허억···"],
    ["luna", "angry", "거 참 끈질기네!!!"],
    ["theo", "angry", "루나, 이성을 지키십시오!"],
    ["kapp", "angry", "윽··· 다들 부상이 심해요! 어서 마무리 짓지 않으면···!"],
  ],
  charging: [
    ["aron", "angry", "··· !!"],
    ["aron", "angry", "적이 공격할 준비를 합니다!!"],
    ["aron", "angry", "아직도 이런 힘이 남아 있다니...!"],
    ["theo", "angry", "어서 피해야 합니다!"],
    ["deneb", "angry", "당황하지 마세요!"],
    ["deneb", "angry", "방어하겠습니다! 모두, 저의 뒤로!"],
  ],
  counter: [
    ["deneb", "angry", "(플레이어 이름), 지금입니다!"],
  ],
  fled: [
    ["theo", "surprised", "적이 도망갔습니다!"],
    ["aron", "angry", "데네브님, 추적할까요?"],
  ],
  collapse: [
    ["deneb", "angry", "아니요. 아쉽지만 그럴 시간이 없군요."],
    ["deneb", "angry", "던전의 원흉이 사라지니, 자연스럽게 던전이 소멸하고 있어요."],
    ["kapp", "default", "그 말은···!"],
    ["deneb", "smile", "···."],
    ["deneb", "smile", "··· 임무, 완료입니다."],
    ["deneb", "smile", "돌아가요. 다 함께."],
  ],
  exit: [
    ["luna", "default", "저길 봐! 던전 출구가 열렸어!"],
    ["theo", "smile", "이제 돌아갈 수 있겠군요. 다 함께 말입니다."],
  ],
  farewell01: [
    ["luna", "smile", "드디어 작별이다! 이 무시무시한 던전!"],
    ["theo", "smile", "오랜만에 발 뻗고 잘 수 있겠군요."],
    ["luna", "smile", "(플레이어 이름)! 이번에도 멋진 활약이었어!"],
    ["luna", "smile", "돌아가서 우리 잊으면 안 된다?"],
    ["theo", "smile", "정말 멋진 활약이었습니다, (플레이어 이름)."],
    ["theo", "smile", "당신 덕분에 이 던전의 문제도 해결하고, 데네브님도 구출할 수 있었죠."],
    ["theo", "smile", "돌아가서 쓸 보고서가 또 산더미처럼 쌓이겠군요."],
    ["theo", "smile", "본부에서 봅시다, (플레이어 이름)."],
  ],
  farewell02: [
    ["aron", "smile", "(플레이어 이름). 되돌아보면, 저희의 첫 만남이 순탄하진 않았죠."],
    ["kapp", "smile", "여행 초반에, 당신에게 숨겼던 것들도 많았죠. 우리가 못 미더웠던 순간들도 많았을 거예요."],
    ["aron", "smile", "그래도 저희를 도와줘서, 저희를 믿고 따라줘서 고맙다는 말을 꼭 드리고 싶었습니다."],
    ["kapp", "smile", "저도 마찬가지예요. 무엇보다 당신 덕분에 데네브를"],
    ["kapp", "smile", "제 소중한 친구를 구할 수 있었어요. 정말 고마워요."],
    ["aron", "smile", "본부로 돌아가면 한 턱 쏘겠습니다."],
    ["kapp", "smile", "또 만나요, (플레이어 이름)."],
  ],
  farewell03: [
    ["deneb", "smile", "···(플레이어 이름)."],
  ],
  farewell04: [
    ["deneb", "smile", "솔직히, 저는 제가 살아서 다시 돌아갈 수 있을 거라고 생각하지 못했어요."],
    ["deneb", "smile", "이곳에서 홀로 괴물의 힘을 억누르다 결국, 그렇게 끝을 맞이할 것이라 생각했죠."],
    ["deneb", "smile", "그렇더라도 제 동료는 무사하니, 그것으로 되었다고 생각했어요."],
    ["deneb", "smile", "그런데 ··· 제 힘이 거의 다하여 의식이 흐려지던 때에 문득,"],
    ["deneb", "smile", "당신의 얼굴이 보였습니다."],
    ["deneb", "smile", "신기하죠. 만난 적도 없던 당신의 얼굴이 흐릿해져 가는 의식 속에서 유일하게 떠올랐다니···"],
    ["deneb", "smile", "당신이 저를 구하러 올 것이라는 것을 운명적으로 직감이라도 했나 봐요."],
    ["deneb", "smile", "··· 죄송해요. 말이 너무 길었죠? 어쨌든 제가 하고 싶은 말은···"],
    ["deneb", "smile", "정말 고마워요, (플레이어 이름)."],
    ["deneb", "smile", "제가 돌아갈 수 있게 해 줘서, 그리고 제게 나아갈 용기를 줘서."],
    ["deneb", "smile", "밖에서 만나면, 꼭 반갑게 인사해요."],
    ["deneb", "smile", "꼭 다시 만나요, (플레이어 이름)."],
  ],
  narration: [
    ["narration", "", "모든 사건을 해결하고, 이제 본부로 돌아갈 시간이 되었다."],
    ["narration", "", "당신은 지난 여정을 되돌아보았다."],
    ["narration", "", "힘든 일도 많았지만, 이번에도 역시 재미있는 모험이었다."],
    ["narration", "", "그렇게 생각하며, 당신은 포탈 속으로 발을 내딛는다."],
  ],
} as const satisfies Record<string, readonly Line[]>;

export type Dungeon10FinalSegmentId = keyof typeof DUNGEON10_FINAL_SEGMENT_LINES;

/** Final Story segments: never skippable (no dialogueSkip, no skipTarget). */
export const DUNGEON10_FINAL_SEGMENTS: Readonly<Record<Dungeon10FinalSegmentId, StorySequence>> =
  Object.fromEntries(
    (Object.keys(DUNGEON10_FINAL_SEGMENT_LINES) as Dungeon10FinalSegmentId[]).map((segmentId) => [
      segmentId,
      sequence(`dungeon10-final-${segmentId}`, "최종결전", DUNGEON10_FINAL_SEGMENT_LINES[segmentId], {
        dialogueSkip: false,
        onCompleteScreen: "dungeon",
      }),
    ]),
  ) as Record<Dungeon10FinalSegmentId, StorySequence>;
