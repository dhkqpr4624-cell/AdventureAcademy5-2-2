import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon9/${name}`;
const custom = (id: string, name: string, file: string): StoryActor => ({
  id, name, defaultExpression: "default",
  portraits: { default: { imageUrl: asset(`portraits/${file}`), placeholder: { label: name, gradient: "linear-gradient(135deg,#30291f,#111)" } } },
});

const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  deneb: createChapter2Actor("deneb", "데네브", "잊혀진 지휘관", "#bfe7ff"),
  japaneseAssassin: custom("japaneseAssassin", "일본 자객", "japanese-assassin.png"),
  empressMyeongseong: custom("empressMyeongseong", "명성황후", "empress-myeongseong.png"),
  gojong: { id: "gojong", name: "고종", defaultExpression: "default", portraits: { default: { imageUrl: `${import.meta.env.BASE_URL}assets/dungeon7/portrait-gojong.png`, placeholder: { label: "고종", gradient: "linear-gradient(135deg,#30291f,#111)" } } } } satisfies StoryActor,
  minister: createChapter2Actor("chiefMinister", "신하", "", "#c7b899"),
  youth: custom("youth", "청년", "youth.png"),
  koreanEmpireCitizen: custom("koreanEmpireCitizen", "대한제국 시민", "korean-empire-citizen.png"),
};
type ActorId = keyof typeof actors;

const d = (id: string, actorId: ActorId, text: string, expression = "default", emphasis?: "danger" | "info"): StoryStep => ({
  id, type: "dialogue", speakerId: actorId, speakerName: actors[actorId].name,
  activeActorId: actorId, expression, text, ...(emphasis ? { emphasis } : {}), advanceMode: "click",
});
const imageIn = (id: string, image: string, hold = 1500): StoryStep[] => [
  { id: `${id}-in`, type: "illustOverlay", imageUrl: asset(image), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  ...(hold > 0 ? [{ id: `${id}-hold`, type: "wait", durationMs: hold, advanceMode: "auto" } satisfies StoryStep] : []),
];
const imageOut = (id: string): StoryStep => ({ id: `${id}-out`, type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" });

export const DUNGEON9_CLUE_STORIES: readonly StorySequence[] = [
  {
    id: "dungeon9-event-1", title: "을미사변과 아관파천", replayable: false, skippable: false, dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
    scenes: [{ id: "event-1", steps: [
      ...imageIn("d9-e1-assassination", "eulmi-incident-illustration.png"),
      d("d9-e1-1", "japaneseAssassin", "흥, 감히 러시아랑 손을 잡으려 하다니!"),
      d("d9-e1-2", "japaneseAssassin", "민비(<blue><b>명성황후</b></blue>)! 당신만 없다면 러시아의 영향력이 낮아질테니 우리 일본이 대한제국을 지배할 수 있겠지!"),
      d("d9-e1-3", "empressMyeongseong", "나는 이 나라의 국모다! 한 나라의 국모를 암살하고도, 과연 무사할 줄 아느냐!"),
      d("d9-e1-4", "japaneseAssassin", "그것은 모르는 일이지!"),
      d("d9-e1-5", "japaneseAssassin", "작별이다!"),
      d("d9-e1-6", "empressMyeongseong", "으윽..!"),
      imageOut("d9-e1-assassination"), { id: "d9-e1-palace-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
      ...imageIn("d9-e1-refuge", "royal-refuge-illustration.png"),
      d("d9-e1-7", "gojong", "중전..!! 안 돼!!"),
      d("d9-e1-8", "minister", "전하! 어서 피하셔야 합니다!"),
      d("d9-e1-9", "minister", "이대로면 전하께서도 위험해지시옵니다!"),
      d("d9-e1-10", "gojong", "으..! 분하구나, 매우 분해!"),
      d("d9-e1-11", "gojong", "그대들 말대로, 우선 러시아 공사관으로 피하여 상황을 지켜보겠다."),
      imageOut("d9-e1-refuge"),
      d("d9-e1-12", "deneb", "조선의 왕비인 명성황후가 시해되고, 고종께서 러시아 공사관으로 대피하는 모습이군요..", "sad"),
      d("d9-e1-13", "deneb", "마치 눈앞에서 진짜 명성황후가 시해 당한 것 같이 흔적들이 남아있어요··· 이것도 던전의 영향이겠죠···", "sad"),
      d("d9-e1-14", "deneb", "어서 가요. 어서 가지 않으면 과거의 일들이 정말 현실이 되어 버릴 거예요···.", "sad"),
    ] }],
  },
  {
    id: "dungeon9-event-2", title: "근대화와 독립협회", replayable: false, skippable: false, dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
    scenes: [{ id: "event-2", steps: [
      ...imageIn("d9-e2-modern", "modernizing-joseon-illustration.png"),
      d("d9-e2-1", "deneb", "이곳은···"), d("d9-e2-2", "deneb", "전차와 철도, 그리고 전화기까지···"),
      d("d9-e2-3", "deneb", "곳곳에 근대 문물의 모습이 보입니다. 이 시기 조선도 근대 문물을 받아들이고, 근대 국가를 수립하기 위해 노력했군요."),
      d("d9-e2-4", "youth", "신문 사시게~ 우리 나라 최초의 민간 신문을 사시게!"),
      d("d9-e2-5", "youth", "앗! 거기 당신들!\n신문 사지 않겠소?"), d("d9-e2-6", "deneb", "신문···이요?", "smile"),
      imageOut("d9-e2-modern"), { id: "d9-e2-newspaper-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
      ...imageIn("d9-e2-newspaper", "independent-newspaper-illustration.png"),
      d("d9-e2-7", "deneb", "<blue><b>독립신문</b></blue>이군요!", "smile"),
      d("d9-e2-8", "youth", "뭐야, 그 반응은? 독립신문 처음보오?"), d("d9-e2-9", "youth", "그럼 이것도 아시오?"),
      d("d9-e2-10", "youth", "독립신문을 시작으로, <blue><b>독립협회</b></blue>까지 만들어졌다는 사실 말이오!"),
      d("d9-e2-11", "youth", "다음 주에 이 독립협회에서 <blue><b>만민 공동회</b></blue>를 만든다고 하니, 당신들도 참여하시오!"),
      imageOut("d9-e2-newspaper"), { id: "d9-e2-after-delay", type: "wait", durationMs: 1500, advanceMode: "auto" },
      d("d9-e2-12", "deneb", "그러고 보니, 저 멀리에는 독립협회에서 주도해서 만든 <blue><b>독립문</b></blue>이 보이네요···.", "smile"),
      d("d9-e2-13", "deneb", "이 시기 우리나라 사람들의 근대화를 위한 노력들이 돋보입니다.", "smile"),
      d("d9-e2-14", "deneb", "그리고 그 노력은··· 절대 헛되지 않았어요.", "smile"),
      d("d9-e2-15", "deneb", "어서 가죠, (플레이어 이름). 이들의 노력이 헛되지 않게 하기 위해, 우리는 현재를 지켜야만 합니다.", "smile"),
    ] }],
  },
];

export const DUNGEON9_FINAL_STORY: StorySequence = {
  id: "dungeon9-final-story", title: "던전 9층 마지막 방", replayable: false, skippable: false, dialogueSkip: false, persistentIllustBackdrop: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "final", steps: [
    ...imageIn("d9-final-empire", "korean-empire-proclamation-illustration.png"),
    d("d9-final-1", "gojong", "백성들이여, 안심하라!"),
    d("d9-final-2", "gojong", "내가 돌아왔으니, 이제부터 우리 조선의 이름을 <red><b>대한제국</b></red>이라 칭하겠다!"),
    d("d9-final-3", "gojong", "또한, 짐은 이제부터 왕이 아닌 <red><b>황제</b></red>로서 군림하고, 서양의 문물을 적극적으로 받아들여 대한제국을 근대 국가로 만들겠다!"),
    d("d9-final-4", "koreanEmpireCitizen", "와아아!"),
    d("d9-final-5", "deneb", "조선이 대한제국이 되는 순간이네요. 이때부터 우리나라도 적극적으로 근대화가 이루어졌죠.", "smile"),
    d("d9-final-6", "deneb", "뜻깊은 장면입니다. 하지만···.", "smile"),
    imageOut("d9-final-empire"), { id: "d9-final-gaze-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
    ...imageIn("d9-final-gaze", "corrupted-citizens-gaze-illustration.png", 0),
    d("d9-final-7", "koreanEmpireCitizen", "잠깐···"), d("d9-final-8", "koreanEmpireCitizen", "당신들··· 뭐야···?"),
    d("d9-final-9", "koreanEmpireCitizen", "뭐지? 뭐지? 뭐지?"), d("d9-final-10", "koreanEmpireCitizen", "아···"),
    d("d9-final-11", "koreanEmpireCitizen", "대한제국을 방해하러 온 거지!!!", "default", "danger"),
    d("d9-final-12", "deneb", "윽··· 역시 던전 균열의 영향을 강하게 받았어요!!", "angry"),
    d("d9-final-13", "deneb", "(플레이어 이름), 조심해요!", "angry"), imageOut("d9-final-gaze"),
  ] }],
};

export const DUNGEON9_BLESSING_STORY: StorySequence = {
  id: "dungeon9-blessing-story", title: "데네브의 가호", replayable: false, skippable: false, dialogueSkip: false, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "blessing", steps: [
    ...imageIn("d9-blessing", "deneb-blessing-illustration.png"),
    d("d9-blessing-1", "deneb", "(플레이어 이름)!! 정신 차리세요!", "angry"),
    d("d9-blessing-2", "deneb", "이 곳에서 당신을 잃을 수 없습니다!", "angry"),
    imageOut("d9-blessing"), { id: "d9-blessing-after", type: "wait", durationMs: 1500, advanceMode: "auto" },
  ] }],
};

export const DUNGEON9_POST_COMBAT_STORY: StorySequence = {
  id: "dungeon9-post-combat-story", title: "던전 9층 귀환", replayable: false, skippable: false, dialogueSkip: false, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "post-combat", steps: [
    d("d9-post-3", "deneb", "(플레이어 이름)!", "angry"),
    d("d9-post-4", "deneb", "무사해서 정말··· 정말 다행이예요.", "sad"),
    d("d9-post-5", "deneb", "이번에도 당신 덕분에 다음으로 가는 길이 열렸어요.", "sad"),
    d("d9-post-6", "deneb", "하지만···.", "hurt"),
    d("d9-post-7", "deneb", "아닙니다···. 이곳에서 불안해해 봐야 의미가 없죠.", "hurt"),
    d("d9-post-8", "deneb", "어서 돌아갑시다. 던전의 균열이 매우 심각해졌으니, 한시라도 빨리 모두에게 알리고 대책을 세워야 해요.", "hurt"),
    d("d9-post-9", "deneb", "자세한 설명은 베이스캠프에서 하겠습니다.", "hurt"),
  ] }],
};

export const DUNGEON9_STORY_ACTORS = actors;
