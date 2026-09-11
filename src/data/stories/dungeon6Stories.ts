import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon6/${name}`;
const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  dancer: { id: "dancer", name: "춤꾼", role: "", portraits: {} } satisfies StoryActor,
  singer: { id: "singer", name: "소리꾼", role: "", portraits: {} } satisfies StoryActor,
  painter: { id: "painter", name: "화가", role: "", portraits: {} } satisfies StoryActor,
};
const d = (id: string, actorId: keyof typeof actors, text: string, expression = "default", nextStepId?: string): StoryStep => ({
  id, type: "dialogue", speakerId: actorId, speakerName: actors[actorId].name, activeActorId: actorId,
  expression, text, ...(nextStepId ? { nextStepId } : {}), advanceMode: "click",
});
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });

export const DUNGEON6_ENTRY_STORY: StorySequence = {
  id: "dungeon6-entry-story", title: "던전 6층 시작방", replayable: false, skippable: false,
  dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "entry", steps: [
    { id: "d6-entry-wait", type: "wait", durationMs: 1500, advanceMode: "auto" },
    d("d6-entry-1", "luna", "와~! 정말 축제잖아?!", "smile"),
    d("d6-entry-2", "luna", "백성들이 재미있게 뛰노는 것 같은데요?!", "smile"),
    d("d6-entry-3", "theo", "맞습니다. 서민들이 다양한 문화를 즐기고 있는 모습을 보니.. 어느새 조선시대 후기인가보군요.", "smile"),
    d("d6-entry-4", "theo", "대장님 말씀대로, 평화롭게 이 층을 지나가려면 아무래도 같은 서민인 척 하는 것이 좋겠습니다.", "smile"),
    d("d6-entry-5", "kapp", "네, 조심해서 나아가죠. 모두, 저희의 뒤로 붙으세요."),
  ] }],
};

const eventStory = (index: 1 | 2 | 3): StorySequence => {
  const definitions = {
    1: { title: "탈춤", image: "mask-dancer-illustration.png", choice: "얼쑤!", steps: [
      n("d6-event1-1", "탈춤을 추는 춤꾼의 모습이 보인다. 당신은 먼 발치에서 탈춤을 바라보았다."),
      d("d6-event1-2", "dancer", "쉬이! 양반 나오신다아! 양반이라고 하니까 노론(老論), 소론(少論), 호조(戶曹), 옥당(玉堂)을 다 지내고 삼정승(三政丞), 육판서(六판서)를 다 지낸-"),
      n("d6-event1-3", "춤꾼이 연기를 하다 멈추고 당신을 바라본다."),
      d("d6-event1-4", "dancer", "퇴로재상(退老宰相)으로 계신 양반인줄 알지 마시오~!"),
      n("d6-event1-5", "춤꾼이 당신에 대한 의심을 거두고 다시 춤을 추기 시작했다."),
      d("d6-event1-6", "theo", "잘 대처하셨습니다, (플레이어 이름)."),
    ] },
    2: { title: "판소리", image: "pansori-illustration.png", choice: "지화자!", steps: [
      n("d6-event2-1", "판소리를 하는 소리꾼과 고수의 모습이 보인다."),
      d("d6-event2-2", "singer", "사랑 사랑 사랑 내 사랑이야, 사랑이로구나 내 사랑이야-"),
      n("d6-event2-3", "소리꾼이 노래를 하다 멈추고 당신을 바라본다."),
      d("d6-event2-4", "singer", "이리 보아도 내 사랑, 저리 보아도 내 사랑. 네가 무엇을 먹으려느냐?"),
      n("d6-event2-5", "소리꾼이 당신에 대한 의심을 거두고 다시 노래를 부르기 시작했다."),
      d("d6-event2-6", "aron", "좋은 대처였습니다, (플레이어 이름)."),
    ] },
    3: { title: "풍속화", image: "genre-painter-illustration.png", choice: "씨름을 하고 있군요.", steps: [
      n("d6-event3-1", "당신은 그림을 그리고 있는 한 사람을 마주쳤다. 당신은 먼 발치에서 그것을 지켜보았다."),
      d("d6-event3-2", "painter", "거, 이 그림을 이해할 수는 있으시오?"),
      n("d6-event3-3", "화가가 의심스럽다는 듯이 당신을 바라본다."),
      d("d6-event3-4", "painter", "허허! 그쪽도 우리 풍속화를 꽤 즐기시나 보오."),
      n("d6-event3-5", "화가가 당신에 대한 의심을 거두고 다시 그림을 그리기 시작했다."),
      d("d6-event3-6", "kapp", "좋은 순발력이었어요, (플레이어 이름).", "smile"),
    ] },
  } as const;
  const definition = definitions[index];
  const [beforeChoice1, beforeChoice2, beforeChoice3, afterChoice1, afterChoice2, afterChoice3] = definition.steps;
  return { id: `dungeon6-event-${index}`, title: definition.title, replayable: false, skippable: false,
    dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
    scenes: [{ id: `event-${index}`, steps: [
      { id: `d6-event${index}-illust-in`, type: "illustOverlay", imageUrl: asset(definition.image), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
      { id: `d6-event${index}-hold`, type: "wait", durationMs: 1500, advanceMode: "auto" },
      beforeChoice1, beforeChoice2, beforeChoice3,
      { id: `d6-event${index}-choice`, type: "choice", prompt: "", advanceMode: "click", options: [{ id: `d6-event${index}-choice-only`, label: definition.choice, nextStepId: afterChoice1.id }] },
      afterChoice1, afterChoice2, afterChoice3,
      { id: `d6-event${index}-illust-out`, type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    ] }],
  };
};

export const DUNGEON6_CLUE_STORIES = [eventStory(1), eventStory(2), eventStory(3)] as const;

export const DUNGEON6_FINAL_STORY: StorySequence = {
  id: "dungeon6-final-story", title: "던전 6층 마지막 방", replayable: false, skippable: false,
  dialogueSkip: true, persistentIllustBackdrop: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "final", steps: [
    { id: "d6-closed-door-in", type: "illustOverlay", imageUrl: asset("closed-door-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d6-closed-door-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
    d("d6-final-1", "luna", "휴~ 다행히 안 들키고 잘 지나온 것 같은데?", "smile"),
    d("d6-final-2", "theo", "그렇군요. (플레이어 이름)의 좋은 대처 덕분입니다.", "smile"),
    d("d6-final-3", "luna", "좋아! 문제 없이 건너 왔으니, 이제 다음 층으로 가는 문을 열어볼까-", "smile"),
    { id: "d6-closed-door-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d6-half-door-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
    { id: "d6-half-door-in", type: "illustOverlay", imageUrl: asset("half-open-door-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    d("d6-final-4", "kapp", "자, 잠깐만요!", "angry"),
    { id: "d6-half-door-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d6-open-door-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
    { id: "d6-open-door-in", type: "illustOverlay", imageUrl: asset("open-door-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    d("d6-final-5", "aron", "이 독기는..!", "angry"),
    d("d6-final-6", "kapp", "심한 균열과 독기예요. 모두, 저희 뒤로 오세요!", "angry"),
    { id: "d6-open-door-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d6-party-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
    { id: "d6-party-in", type: "illustOverlay", imageUrl: asset("party-defending-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    d("d6-final-7", "theo", "윽! 악취가 심합니다!", "angry"),
    d("d6-final-8", "luna", "대장, 부대장! 괜찮아요?!", "shout"),
    d("d6-final-9", "aron", "문제 없습니다. 걱정 마십시오.", "smile"),
    d("d6-final-10", "kapp", "저도 괜찮아요. 모두 무사해서 다행이네요.", "smile"),
    d("d6-final-11", "theo", "다행입니다."), d("d6-final-12", "theo", "그나저나 이 독기는 혹시.."),
    { id: "d6-party-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    d("d6-final-13", "kapp", "테오의 추측이 맞아요.", "angry"),
    d("d6-final-14", "kapp", "이 앞에서.. <blue><b>데네브의 기운이 느껴져요.</b></blue>", "angry"),
    d("d6-final-15", "kapp", "아주 희미하지만, 아직 살아있어요!", "angry"),
    d("d6-final-16", "aron", "... 바로 앞에 데네브님이 계신다는 뜻이군요.", "angry"),
    d("d6-final-17", "aron", "베이스캠프로 가서 재정비하지요. 아무래도 이 뒤는 더 큰 위험이 도사리고 있을 테니까요.", "angry"),
  ] }],
};
