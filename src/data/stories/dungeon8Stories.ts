import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon8/${name}`;
const portrait = (name: string) => asset(`portraits/${name}`);
const customActor = (id: string, name: string, file?: string): StoryActor => ({
  id, name, defaultExpression: "default",
  portraits: file ? { default: { imageUrl: portrait(file), placeholder: { label: name, gradient: "linear-gradient(135deg,#30291f,#111)" } } } : {},
});

const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  deneb: createChapter2Actor("deneb", "데네브", "잊혀진 지휘관", "#bfe7ff"),
  kimOkGyun: customActor("kimOkGyun", "김옥균", "kim-ok-gyun.png"),
  kimHongJip: customActor("kimHongJip", "김홍집", "kim-hong-jip.png"),
  radicalReformer: customActor("radicalReformer", "급진 개화파 문신", "radical-reformer.png"),
  jeonBongJun: customActor("jeonBongJun", "전봉준"),
  donghakArmy: customActor("donghakArmy", "동학농민군", "donghak-peasant-army.png"),
  joseonOfficial: customActor("joseonOfficial", "조선 문신", "joseon-official.png"),
  qingSoldier: customActor("qingSoldier", "청나라 병사", "qing-soldier.png"),
  japaneseSoldier: customActor("japaneseSoldier", "일본군", "japanese-soldier.png"),
};
type ActorId = keyof typeof actors;
const d = (id: string, actorId: ActorId, text: string, expression = "default"): StoryStep => ({
  id, type: "dialogue", speakerId: actorId, speakerName: actors[actorId].name,
  activeActorId: actorId, expression, text, advanceMode: "click",
});
const imageIn = (id: string, imageUrl: string, hold = 1500): StoryStep[] => [
  { id: `${id}-in`, type: "illustOverlay", imageUrl: asset(imageUrl), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  ...(hold > 0 ? [{ id: `${id}-hold`, type: "wait", durationMs: hold, advanceMode: "auto" } satisfies StoryStep] : []),
];
const imageOut = (id: string): StoryStep => ({ id: `${id}-out`, type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" });

export const DUNGEON8_ENTRY_STORY: StorySequence = {
  id: "dungeon8-entry-story", title: "던전 8층 시작방", replayable: false, skippable: false,
  dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "entry", steps: [
    d("d8-entry-1", "luna", "으악! 던전 곳곳에 균열이!!!", "surprised"),
    d("d8-entry-2", "kapp", "조심해요! 던전 균열을 밟으면 우리도 함께 오염될테니까요!", "shouting"),
    d("d8-entry-3", "deneb", "제가 앞장서겠습니다! 모두 조심해서 나아갑시다!", "angry"),
  ] }],
};

export const DUNGEON8_CLUE_STORIES: readonly StorySequence[] = [
  {
    id: "dungeon8-event-1", title: "갑신정변", replayable: false, skippable: false,
    dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
    scenes: [{ id: "event-1", steps: [
      ...imageIn("d8-e1", "gapsin-coup-illustration.png"),
      d("d8-e1-1", "kimOkGyun", "청이 우리 조선에 미치는 영향이 너무나도 큽니다! 서양의 문물을 적극적으로 받아들이고, 이제 자주적으로 바로 설 때입니다!"),
      d("d8-e1-2", "kimHongJip", "아닐세! 서양의 문물을 받아들이되 천천히 받아들여야 하네."),
      d("d8-e1-3", "kimHongJip", "청과의 관계는 좋게 유지하는 것이 이득이네!"),
      d("d8-e1-4", "kimOkGyun", "하··· 정말이지 마음대로 되는게 없군요."),
      d("d8-e1-5", "radicalReformer", "이제 어쩌죠? 저희의 의견이 잘 받아들여지지 않고 있는데요."),
      d("d8-e1-6", "kimOkGyun", "···아직 방법이 있습니다."),
      d("d8-e1-7", "kimOkGyun", "우정총국 개국 축하 연회··· 이 때 수 많은 사람들이 몰리겠지요."),
      d("d8-e1-8", "kimOkGyun", "이때 정변을 일으킵시다."),
      d("d8-e1-9", "radicalReformer", "하지만···!"),
      d("d8-e1-10", "kimOkGyun", "···일본군의 도움을 받기로 약속했습니다. 우리는 성공할 것입니다."),
      imageOut("d8-e1"),
      { id: "d8-e1-after-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
      d("d8-e1-11", "aron", "갑신정변이 일어나기 직전, 온건개화파와 급진개화파의 다툼이 오가는 모습이군요."),
      d("d8-e1-12", "aron", "급진 개화파가 끝내 일본군의 도움까지 받으면서 정변을 일으켰죠···."),
      d("d8-e1-13", "theo", "예, 분명 청나라의 개입과 일본군의 배신으로 실패했지요.", "serious"),
      d("d8-e1-14", "theo", "우리 민족 사이의 싸움이, 다른 나라의 군대까지 끌어들이다니··· 처참한 광경입니다.", "serious"),
    ] }],
  },
  {
    id: "dungeon8-event-2", title: "동학농민운동과 청일전쟁", replayable: false, skippable: false,
    dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
    scenes: [{ id: "event-2", steps: [
      ...imageIn("d8-e2-donghak", "donghak-peasant-movement-illustration.png"),
      d("d8-e2-1", "jeonBongJun", "맞서 싸웁시다! 우리 정치를 바로잡아야 합니다!"),
      d("d8-e2-2", "jeonBongJun", "관리들의 횡포를 멈추고, 나라를 바로 잡읍시다!"),
      d("d8-e2-3", "donghakArmy", "와아아아아!"),
      d("d8-e2-4", "joseonOfficial", "이크, 이 작자들이 글쎄!!"),
      d("d8-e2-5", "joseonOfficial", "청나라! 제발 도와주시오! 우리 나라에 농민 봉기가 일어나 나라가 매우 어지럽소!"),
      d("d8-e2-6", "qingSoldier", "하하, 기꺼이 도와주지!"),
      d("d8-e2-7", "qingSoldier", "조선의 농민들을 진압하라!"),
      imageOut("d8-e2-donghak"),
      { id: "d8-e2-war-delay", type: "wait", durationMs: 500, advanceMode: "auto" },
      ...imageIn("d8-e2-war", "sino-japanese-war-illustration.png", 0),
      d("d8-e2-8", "japaneseSoldier", "청나라가 조선의 일에 개입했다니, 그렇다면 우리도 빠질 수 없겠지!"),
      d("d8-e2-9", "japaneseSoldier", "전군, 돌격하라!"),
      d("d8-e2-10", "joseonOfficial", "자, 잠깐-! 모두 멈추시오!"),
      d("d8-e2-11", "joseonOfficial", "우리 농민봉기는 이제 거의 해결되었으니, 각자의 나라로 돌아가주시오!"),
      d("d8-e2-12", "japaneseSoldier", "청나라 병사들을 무찔러라!"),
      d("d8-e2-13", "qingSoldier", "일본군과 맞서 싸워라! 절대로 물러서지 않는다!"),
      d("d8-e2-14", "luna", "동학농민운동이 일어난 모습이네요.", "angry"),
      d("d8-e2-15", "luna", "우리나라 농민들의 봉기를 진압하려고 청나라 군대를 부르다니···", "angry"),
      d("d8-e2-16", "kapp", "그것이 발단이 되어 결국 조선의 땅에서 청일전쟁이 일어났어요.", "angry"),
      d("d8-e2-17", "kapp", "아주··· 슬픈 역사네요.", "angry"),
      imageOut("d8-e2-war"),
    ] }],
  },
];

export const DUNGEON8_FINAL_STORY: StorySequence = {
  id: "dungeon8-final-story", title: "던전 8층 마지막 방", replayable: false, skippable: false,
  dialogueSkip: true, persistentIllustBackdrop: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "final", steps: [
    ...imageIn("d8-final-jeon", "corrupted-jeon-bong-jun-illustration.png"),
    d("d8-final-1", "jeonBongJun", "···."),
    d("d8-final-2", "deneb", "···!", "sad"),
    d("d8-final-3", "deneb", "조심해요. 던전의 힘에 영향을 받았어요.", "sad"),
    d("d8-final-4", "deneb", "우리를 공격할 수도 있으니, 신중하게 대응해야 합니다.", "sad"),
    d("d8-final-5", "jeonBongJun", "당신들은···"),
    d("d8-final-6", "jeonBongJun", "알고 있소···."),
    d("d8-final-7", "jeonBongJun", "당신들은 미래에서 왔지?"),
    d("d8-final-8", "jeonBongJun", "말해주시게···. 우리는 미래에 어떻게 되지···?"),
    d("d8-final-9", "jeonBongJun", "우리의 봉기는 성공하는가···"),
    d("d8-final-10", "luna", "···윽, 어떻게 하죠, 대장?", "scared"),
    d("d8-final-11", "kapp", "···안타깝지만, 사실대로 말해줘야 해요.", "serious"),
    d("d8-final-12", "kapp", "괜한 거짓말은 더 큰 문제를 불러올겁니다. 아픈 과거더라도 용기있게 마주해야 해요.", "serious"),
    d("d8-final-13", "theo", "···일리 있는 말씀입니다.", "serious"),
    d("d8-final-14", "theo", "부탁합니다, (플레이어 이름).", "serious"),
    { id: "d8-final-choice", type: "choice", advanceMode: "click", options: [
      { id: "d8-final-choice-qing", label: "농민 봉기를 진압하기 위해서 조선은 청나라에게 도움을 요청할 거예요.", nextStepId: "d8-final-15" },
      { id: "d8-final-choice-war", label: "...그리고 조선의 땅에서 청나라와 일본이 전쟁을 벌일거예요.", nextStepId: "d8-final-15" },
    ] },
    d("d8-final-15", "jeonBongJun", "···."),
    d("d8-final-16", "jeonBongJun", "···암담하구나. 참으로 암담한 미래야···."),
    imageOut("d8-final-jeon"),
    d("d8-final-17", "aron", "앞으로 가는 길이 열렸습니다!", "angry"),
    d("d8-final-18", "deneb", "···덕분입니다, (플레이어 이름).", "smile"),
    d("d8-final-19", "deneb", "우선 다시 베이스캠프로 돌아가도록 해요. 다음층으로 향하는 것은, 정비를 마친 이후입니다.", "smile"),
  ] }],
};
