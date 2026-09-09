import type { StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon5/${name}`;
const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  commoner: createChapter2Actor("commoner", "이름 모를 백성", "", "#d5b27a"),
  yeongjo: createChapter2Actor("yeongjo", "영조", "", "#efcf80"),
  chiefMinister: createChapter2Actor("chiefMinister", "신하", "", "#c7b899"),
  deneb: createChapter2Actor("deneb", "???", "", "#b9c6da"),
};
const d = (id: string, actorId: keyof typeof actors, text: string, expression = "default", nextStepId?: string): StoryStep => ({
  id, type: "dialogue", speakerId: actorId, speakerName: actors[actorId].name, activeActorId: actorId,
  expression, text, ...(nextStepId ? { nextStepId } : {}), advanceMode: "click",
});
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });

export const DUNGEON5_ENTRY_STORY: StorySequence = {
  id: "dungeon5-entry-story", title: "던전 5층 시작방", replayable: false, skippable: false,
  dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "entry", steps: [
    d("d5-entry-1", "commoner", "하아...."), d("d5-entry-2", "luna", "오... 들어오자마자 한숨 쉬는 백성 발견."),
    d("d5-entry-3", "theo", "안녕하십니까. 저희는 그저 지나가는 나그네들입니다만, 고민이 깊어보이셔서 찾아왔습니다. 혹시 무슨 일 있으십니까?", "worried"),
    d("d5-entry-4", "commoner", "어엉? 지나가는 나그네?"), d("d5-entry-5", "commoner", "보아하니, 농사 짓는 사람들은 아닌 것 같고... 양반이여?"),
    d("d5-entry-6", "commoner", "그래, 양반이면 모를 수도 있겠지."), d("d5-entry-7", "commoner", "이봐, 대답한 번 해 보소. 정치는 왜 하는 거지?"),
    d("d5-entry-8", "theo", "그건... 모두가 행복하게 어우러져 살기 위해서 아닐까요?", "serious"),
    d("d5-entry-9", "commoner", "그렇지!! 그런데 정치하는 사람들끼리 허구한 날 싸워만대니, 우리가 어디 행복하게 살아갈 수 있겠느냔 말이야."),
    d("d5-entry-10", "commoner", "바로!!! 당신들 같은 양반들이 말이야!!!! 어?!"), d("d5-entry-11", "commoner", "나라를 돌보아야지 자기들끼리 싸우고 있으면 되나?!?!!? 응?!?! 이게 정상인가?!?!"),
    d("d5-entry-12", "luna", "히, 히익!! 저 사람 엄청 화났잖아?!", "scared"), d("d5-entry-13", "luna", "테오, (플레이어이름)!! 이, 일단 도망치자!! 어서!!", "scared"),
  ] }],
};

export const DUNGEON5_FINAL_STORY: StorySequence = {
  id: "dungeon5-final-story", title: "던전 5층 마지막 방", replayable: false, skippable: false,
  dialogueSkip: true, persistentIllustBackdrop: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "final", steps: [
    { id: "d5-yeongjo-in", type: "illustOverlay", imageUrl: asset("yeongjo-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d5-yeongjo-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
    d("d5-final-1", "yeongjo", "그대들은?"), d("d5-final-2", "luna", "앗, 어쩌다보니 또 궁궐에 들어왔잖아?!", "scared"),
    d("d5-final-3", "commoner", "허억, 허억, 거기 서라~!!"), d("d5-final-4", "commoner", "어라? 여, 여긴.."), d("d5-final-5", "commoner", "여긴 궁궐 안이잖아?!!"),
    d("d5-final-6", "theo", "..그, 그렇게 되었습니다.", "smile"), d("d5-final-7", "theo", "우선 진정합시다.", "smile"),
    d("d5-final-8", "chiefMinister", "무엄하다!! 감히 함부로 궐 안에 발을 딛다니!"), d("d5-final-9", "chiefMinister", "썩 물러가지 못할까!"),
    d("d5-final-10", "yeongjo", "되었다. 마침 심심하던 차라."), d("d5-final-11", "yeongjo", "그래, 마침 한가하니 들어나 보세. 그대들은 누구이고, 어찌 여기까지 오게 되었는가?"),
    d("d5-final-12", "luna", "음.. 그게~", "smile"), d("d5-final-13", "luna", "사실 저희는 아무 것도 안했는데... 저기 저 아저씨가 우리를 '못된 양반'이라고 부르면서 쫓아왔을 뿐이에요!", "smile"),
    d("d5-final-14", "luna", "도망치다가 정신 차려보니 여기였죠!", "smile"), d("d5-final-15", "yeongjo", "못된 양반이라고?"), d("d5-final-16", "yeongjo", "보자, 자네가 말해보게. 왜 그런게지?"),
    d("d5-final-17", "commoner", "..그, 그건.."), d("d5-final-18", "commoner", "죽을 죄를 지었습니다, 전하!"),
    d("d5-final-19", "commoner", "윗 사람들이 서로 싸우느라 아랫 사람들을 돌보지 아니하니 나날이 살기가 어려워지고-"),
    d("d5-final-20", "commoner", "세금은 늘어만 가니 당장 배를 채우기도 힘든 상황인지라 그리 말하였습니다."), d("d5-final-21", "commoner", "절대로 윗분들을 능멸하고자 함이 아니었습니다!"),
    d("d5-final-22", "yeongjo", "..."), d("d5-final-23", "yeongjo", "허허, 자네가 하는 말이 나의 고민과 일치하는구나."),
    d("d5-final-24", "yeongjo", "좋다. 함부로 궁궐 안에 들어온 죄는 천벌로도 모자랄 죄이지만, 자네들이 나의 고민을 해결해 준다면 너그러이 넘어가 주도록 하지."),
    d("d5-final-25", "yeongjo", "나그네들이여, 대답해보게. 어떻게 하면 이를 해결할 수 있겠는가?"),
    { id: "d5-reform-choice", type: "choice", prompt: "어떻게 해결할까?", advanceMode: "click", options: [
      { id: "d5-wrong", label: "붕당끼리 싸움을 붙입시다.", nextStepId: "d5-final-26" },
      { id: "d5-right", label: "붕당의 인재들을 골고루 등용해야 합니다.", nextStepId: "d5-final-27" },
    ] },
    d("d5-final-26", "commoner", "(이, 이보게!! 그러면 해결되는게 없잖나!!! )", "default", "d5-reform-choice"),
    d("d5-final-27", "yeongjo", "일리 있는 말이로군. 어느 한 세력이 힘을 갖지 못하게 골고루 인재를 등용하면, 균형이 맞추어지겠지."),
    d("d5-final-28", "yeongjo", "좋다, 나그네들이여. 자네들의 무례를 이번 한 번은 눈 감아주겠네."), d("d5-final-29", "commoner", "성은이 망극하옵니다, 전하!!"),
    d("d5-final-30", "yeongjo", "이리 백성의 말을 직접 들어보는 것도 참 좋은 일이군. 가끔씩 백성들에게 직접 말할 기회를 줘도 괜찮겠어."),
    d("d5-final-31", "yeongjo", "여봐라! 폐지되었던 신문고를 다시 설치하라!"), d("d5-final-32", "yeongjo", "백성들이 하고자 하는 말이 있을 때 이 북을 울려 알리게 하라!"),
    { id: "d5-yeongjo-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d5-black-hold", type: "wait", durationMs: 1500, advanceMode: "auto" }, n("d5-final-33", "영조의 외침과 함께 과거의 인물들은 흔적도 없이 사라졌다."),
    d("d5-final-34", "theo", "...다음 층으로 가는 길이 열렸습니다."), d("d5-final-35", "luna", "하아~ 정말 다행이야! 이번에야말로 큰일 나는 줄 알았네!"),
    d("d5-final-36", "luna", "두 사람은 먼저 돌아가! 나는 다음 층 입구를 조금 정찰하고..."), d("d5-final-37", "theo", "...!", "angry"),
    d("d5-final-38", "theo", "잠시만요, 루나! 위험합니다!", "angry"),
    { id: "d5-chain-in", type: "illustOverlay", imageUrl: asset("attacking-chains.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "d5-chain-hold", type: "wait", durationMs: 2000, advanceMode: "auto" },
    d("d5-final-39", "luna", "윽, 뭐야?!", "angry"), d("d5-final-40", "deneb", "....."), d("d5-final-41", "deneb", "..........{{playerNameLastCharacter}}"),
    d("d5-final-42", "deneb", "....(플레이어 이름)."), d("d5-final-43", "deneb", "(플레이어 이름).."), d("d5-final-44", "deneb", "어서 피하도록 하세요.. 이곳으로 더 다가오면 위험합니다.."),
    d("d5-final-45", "theo", "(플레이어 이름)! 정신 차리십시오! 괜찮습니까?", "angry"), d("d5-final-46", "theo", "예? 데네브님의 목소리가 선명하게 들렸다고요?", "angry"),
    d("d5-final-47", "theo", "... 우선 이곳은 위험하니 어서 피해야겠습니다. 자세한 이야기는 베이스캠프로 돌아가서 이야기해 주십시오!", "angry"),
  ] }],
};
