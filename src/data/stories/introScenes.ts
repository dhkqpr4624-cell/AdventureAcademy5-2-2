import type { IntroSceneSequence, StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";
import { INTRO_SCRIPT } from "./introScript";

const url = (name: string) => `${import.meta.env.BASE_URL}assets/story/chapter2/intro/${name}`;
const d = (id: string, actorId: string, speakerName: string, text: string, expression = "default", nextStepId?: string): StoryStep => ({ id, type: "dialogue", speakerId: actorId, speakerName, activeActorId: actorId, expression, text, nextStepId, advanceMode: "click" });
const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  sailor: createChapter2Actor("sailor", "선원", "비행선 선원", "#d8e4ec"),
};

const SCENE_1: StorySequence = {
  id: "intro-chapter2-deck", title: "2단원 인트로 - 비행선 갑판", backgrounds: {}, actors,
  replayable: true, skippable: true, onCompleteScreen: "story",
  scenes: [{ id: "chapter2-deck", steps: [
    { id: "deck-sky", type: "setStagePhase", stageId: "chapter2-intro", phase: "deck-sky", durationMs: 400, hideDialogue: true, advanceMode: "auto" },
    { id: "deck-rise", type: "setStagePhase", stageId: "chapter2-intro", phase: "deck-raised", durationMs: 3100, advanceMode: "auto" },
    { id: "deck-duo", type: "setStagePhase", stageId: "chapter2-intro", phase: "deck-duo", durationMs: 2200, advanceMode: "auto" },
    d("deck-luna-01", "luna", "루나", " 오늘도 날씨 맑음! "),
    d("deck-theo-01", "theo", "테오", " 그렇군요. 포탈에 들어가면 어떨지 모르겠지만 말입니다.. "),
    d("deck-luna-02", "luna", "루나", " 에이, 기운 내. 테오. 우리가 이 일 한두 번 해보는 것도 아니잖아! "),
    d("deck-luna-03", "luna", "루나", " 물론, 이번엔 카이든 대장 없이 해야 해서 나도 조금 불안하지만.. "),
    d("deck-luna-04", "luna", "루나", " 앗, (플레이어 이름)! 거기 있었구나! 오랜만이야. "),
    d("deck-theo-02", "theo", "테오", " 오랜만이군요, (플레이어 이름). 오랜만에 봐서, 저희를 까먹으신 것은 아니겠죠? "),
    { id: "deck-choice", type: "choice", options: [
      { id: "unknown", label: "누구세요?", nextStepId: "branch-unknown-luna-01" },
      { id: "remember", label: "당연히 기억해.", nextStepId: "branch-remember-luna-01" },
    ], advanceMode: "click" },
    d("branch-unknown-luna-01", "luna", "루나", " 앗, 너무해~ 지난 번에 우리랑 같이 던전 탈출했던 것 기억 안나? "),
    d("branch-unknown-theo-01", "theo", "테오", " (플레이어 이름)은 아무래도 바쁜 사람이니까요. 이해합니다. "),
    d("branch-unknown-theo-02", "theo", "테오", " 다시 한 번 소개드립니다. 저는 테오. 던전 안에서 보급을 담당합니다. "),
    d("branch-unknown-luna-02", "luna", "루나", " 나는 루나. 던전 안을 정찰하는 사람이야. "),
    d("branch-unknown-luna-03", "luna", "루나", " 원래 카이든 대장도 같이 있었는데, 카이든 대장은 다른 일이 있어서 못 왔어. ", "default", "deck-party-enter"),
    d("branch-remember-luna-01", "luna", "루나", " 그럴 줄 알았어! 우리 인연이 보통 인연인가~ ", "smile"),
    d("branch-remember-theo-01", "theo", "테오", " 궁금해하실까봐 미리 말씀드리면, 카이든 대장님께서는 오늘 다른 임무로 같이 오지 못하셨습니다. ", "smile"),
    d("branch-remember-theo-02", "theo", "테오", " 그럼 이번에도 잘 부탁드립니다, (플레이어 이름). ", "smile", "deck-party-enter"),
    { id: "deck-party-enter", type: "setStagePhase", stageId: "chapter2-intro", phase: "deck-party", durationMs: 2200, advanceMode: "auto" },
    d("deck-aron-01", "aron", "아론", " 여기 계셨군요. 테오님, 그리고 루나님. "),
    { id: "deck-surprise", type: "setStagePhase", stageId: "chapter2-intro", phase: "deck-surprise", durationMs: 3214, hideDialogue: true, advanceMode: "auto" },
    d("deck-theo-03", "theo", "테오", " 아, 이번에 저희와 함께 포탈에 들어가실 분들이죠. "),
    d("deck-theo-04", "theo", "테오", " 반갑습니다. 보급담당, 테오입니다. "),
    d("deck-luna-05", "luna", "루나", " 반가워요! 정찰 담당, 루나입니다! "),
    d("deck-aron-02", "aron", "아론", " 반갑습니다. 아론입니다. 원래는 정찰 담당인데.. 이번에는 지휘관을 맡게 되었습니다. "),
    d("deck-kapp-01", "kapp", "카프", " 반가워요. 카프라고 합니다. 정찰과 전투를 담당합니다. 이번엔 부지휘관을 맡았습니다."),
    d("deck-theo-05", "theo", "테오", " 저희보다 훨씬 경험이 많은 선배분들이시죠. 지휘관님, 부지휘관님, 잘 부탁드립니다. "),
    d("deck-aron-03", "aron", "아론", " 예, 잘 부탁합니다. "),
    d("deck-kapp-02", "kapp", "카프", " 말씀 많이 들었어요. 유능한 신입들이 있다고. "),
    d("deck-kapp-03", "kapp", "카프", " 그리고, 당신이 (플레이어이름)이죠? 전투에 능하다고 많이 들었습니다. 잘 부탁해요. "),
    d("deck-sailor-01", "sailor", "선원", " 지휘관님, 말씀 나누시는 중 죄송합니다. "),
    d("deck-sailor-02", "sailor", "선원", " 전방에 포탈이 보입니다! "),
    { id: "portal-black", type: "setStagePhase", stageId: "chapter2-intro", phase: "portal", durationMs: 0, hideDialogue: true, advanceMode: "auto" },
    { id: "portal-entrance", type: "illustOverlay", imageUrl: url("portal-entrance.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "portal-entrance-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
    d("portal-aron-01", "aron", "아론", " 뱃머리를 포탈로 향하게 하십시오. "),
    d("portal-aron-02", "aron", "아론", " 포탈에 진입하겠습니다, 모두 대비하십시오. "),
    { id: "portal-entry", type: "illustOverlay", imageUrl: url("portal-entry.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "portal-entry-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
  ] }],
};

const SCENE_2: StorySequence = {
  id: "intro-chapter2-arrival", title: "2단원 인트로 - 포탈 내부 도착", backgrounds: {}, actors,
  replayable: true, skippable: true, onCompleteScreen: "story",
  scenes: [{ id: "chapter2-arrival", steps: [
    { id: "arrival-airship", type: "setStagePhase", stageId: "chapter2-intro", phase: "arrival-airship", durationMs: 2800, hideDialogue: true, advanceMode: "auto" },
    { id: "arrival-party", type: "setStagePhase", stageId: "chapter2-intro", phase: "arrival-party", durationMs: 700, advanceMode: "auto" },
    d("arrival-aron-01", "aron", "아론", " 전원, 이상 없습니까? "),
    d("arrival-theo-01", "theo", "테오", " 예, 문제 없습니다. "),
    d("arrival-luna-01", "luna", "루나", " 저도 괜찮아요~. 마침 주변도 조용하고요. "),
    d("arrival-luna-02", "luna", "루나", " 오히려 너무 조용해서 이상하네요. 우선 베이스 캠프를 세울 장소를 찾아야 하겠어요. "),
    d("arrival-luna-03", "luna", "루나", " 잠깐, 근데 여기.. 배경이.."),
    d("arrival-theo-02", "theo", "테오", " 기와집과 초가집들을 봤을 때, 또다시 과거로 들어온 것 같군요. ", "smile"),
    d("arrival-luna-04", "luna", "루나", " 안돼!! 지난 던전의 PTSD가..!!! "),
    d("arrival-aron-02", "aron", "아론", " ... ", "serious"),
    d("arrival-kapp-01", "kapp", "카프", " ... ", "surprised"),
    d("arrival-theo-03", "theo", "테오", " 아론님, 카프님? 무슨 일이시죠? "),
    d("arrival-kapp-02", "kapp", "카프", " ...아 "),
    d("arrival-kapp-03", "kapp", "카프", " 이런, 아무것도 아닙니다. 베이스캠프에 대해 생각하고 있었어요. "),
    d("arrival-aron-03", "aron", "아론", " 미안합니다. 저도 잠시 멍을 때렸군요. "),
    d("arrival-aron-04", "aron", "아론", " 루나 대원의 말대로, 우선 베이스캠프를 세울 위치를 살펴보죠. "),
    d("arrival-aron-05", "aron", "아론", " 그럼, 출발하겠습니다. "),
    { id: "arrival-exit", type: "setStagePhase", stageId: "chapter2-intro", phase: "arrival-exit", durationMs: 1800, hideDialogue: true, advanceMode: "auto" },
  ] }],
};

export const INTRO_SCENE_SEQUENCE: IntroSceneSequence = {
  id: "intro-phase25",
  scenes: [
    { id: "Scene0", mode: "introText", lines: INTRO_SCRIPT.scene0 },
    { id: "Scene1", mode: "story", sequence: SCENE_1 },
    { id: "Scene2", mode: "story", sequence: SCENE_2 },
  ],
  onCompleteScreen: "baseCamp",
};
