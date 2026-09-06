import type { StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#78b7ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d6b56f"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  angryYangban: createChapter2Actor("angryYangban", "화난 양반", "", "#dc8b55"),
  angryCommoner: createChapter2Actor("angryCommoner", "화난 상민", "", "#c8a777"),
};
type ActorId = keyof typeof actors;
const d = (id: string, actor: ActorId, text: string, expression = "default"): StoryStep => ({
  id, type: "dialogue", speakerId: actor, speakerName: actors[actor].name,
  activeActorId: actor, expression, text, advanceMode: "click",
});
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/story/chapter2/dungeon2/${name}`;
const sequence = (id: string, title: string, steps: StoryStep[], persistentIllustBackdrop = true): StorySequence => ({
  id, title, backgrounds: {}, actors, scenes: [{ id: `${id}-scene`, steps }],
  replayable: false, skippable: false, persistentIllustBackdrop, onCompleteScreen: "dungeon",
});
const show = (id: string, imageUrl: string): StoryStep => ({ id, type: "illustOverlay", imageUrl, visible: true, fadeMs: 700, waitForFade: true, advanceMode: "auto" });
const hide = (id: string): StoryStep => ({ id, type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, waitForFade: true, advanceMode: "auto" });
const hold = (id: string, durationMs: number): StoryStep => ({ id, type: "wait", durationMs, advanceMode: "auto" });

export const DUNGEON2_ENTRY_STORY = sequence("dungeon2-chapter2-entry", "유교 질서에 따른 조선 사회의 모습", [
  show("chaos-in", asset("chaos-society.png")), hold("chaos-hold", 1500),
  d("entry-1", "theo", " 이곳은..? "),
  d("entry-2", "theo", " 루나 말이 사실이었군요.. 정말 사람들이 살아 움직이고 있군요. 그런데... "),
  d("entry-3", "luna", " 여긴 또 뭐야..?! 아주 난장판인데?! "),
  d("entry-4", "angryYangban", " 감히 아랫사람이 윗사람을 능멸해!! "),
  d("entry-5", "angryCommoner", " 아니 이사람아!! 오랜 벗인 나에게 정말 이러긴가?! "),
  n("entry-6", " 마을에는 싸우는 사람들로 꽉 차 있다. "),
  n("entry-7", " 저마다 다른 이유로 싸우는 사람들로 인해, 마을은 혼비백산이다."),
  d("entry-8", "angryYangban", " 거기 자네들!! 자네들은 또 누구인가?! "),
  d("entry-9", "angryYangban", " 자네들이 판단해보게. 이 상황에서, 지금 누가 잘못한 겐가!? "),
  d("entry-10", "theo", " 오.. 하하. 지, 진정하시지요. ", "smile"),
  d("entry-11", "luna", " 자, 잠깐만 진정해보세요. 저희가 다 해결해드릴게요. 네?! ", "scared"),
  d("entry-12", "theo", " 이, 일단 저들을 진정시킬 무언가를 찾아야겠습니다. 루나, (플레이어 이름), 어서 이동하시죠.) "),
  hide("chaos-out"),
]);

const clueLines = [
  ["theo", " 이것은..! ", " 관혼상제에 대한 내용이군요. 관례, 혼례, 상례, 제례를 의미하는 조선시대 유교 예절이죠. ", " 혼란을 잠재우기 위해 필요한 단서가 될 듯합니다. 가져갑시다. "],
  ["theo", " 이것은..! ", " 삼강행실도의 조각입니다. 임금과 신하 사이, 남편과 아내 사이, 윗사람과 아랫사람 사이, 친구 사이의 도리를 강조하는 유교 질서를 담고 있죠. ", " 혼란을 잠재우기 위해 필요한 단서가 될 듯합니다. 가져갑시다. "],
  ["luna", " 이건.! ", " 조선시대 신분에 대한 내용이 담겨있네. 조선시대에는 양인과 천인으로 신분이 나뉘었지. 자세히는 양반, 중인, 상민, 천민으로 말야. ", " 혼란을 잠재우기 위해 필요한 단서가 될 거 같아. 가져가자. "],
] as const;
export const DUNGEON2_CLUE_STORIES = clueLines.map((line, index) => sequence(`dungeon2-clue-${index + 1}`, `던전 2층 단서 ${index + 1}`, [
  show(`paper-${index + 1}-in`, asset("paper-fragment.png")), hold(`paper-${index + 1}-hold`, 1500),
  d(`clue-${index + 1}-1`, line[0], line[1]), d(`clue-${index + 1}-2`, line[0], line[2]), d(`clue-${index + 1}-3`, line[0], line[3]),
  hide(`paper-${index + 1}-out`),
])) as readonly StorySequence[];

export const DUNGEON2_FINAL_STORY = sequence("dungeon2-chapter2-final", "유교 질서에 따른 조선 사회의 모습", [
  show("final-chaos-in", asset("chaos-society.png")),
  d("final-1", "angryYangban", " 자네 진짜 혼나보겠나!! "),
  d("final-2", "angryCommoner", " 너, 진짜 그러다 큰일난다!!! 어?! "),
  d("final-3", "theo", " 여러분! 진정하십시오! "), d("final-4", "theo", " 저희가 가져온 서적을 한 번 읽어보시겠습니까? "),
  d("final-5", "luna", " 아저씨들!! 여기 와서 저희가 가져온 것부터 읽어보세요! "), d("final-6", "luna", " 문제가 해결될지도 모르잖아요? "),
  n("final-7", " 화난 사람들은 우리가 가져온 종이조각들을 천천히 읽어보았다. "),
  d("final-8", "angryYangban", " 이 서적에는.. 윗사람과 아랫사람의 도리가 담겨있군. 이 서적을 읽고 다시 생각해보니, 나라고 잘 한 것은 없는 것 같아 부끄럽도다. "),
  d("final-9", "angryYangban", " 미안하네. 그리고 고맙네. 이제라도 질서를 유지할 수 있겠구만. "),
  d("final-10", "angryCommoner", " 친구 사이에 중요한 게 뭔지, 삼강행실도를 보니 다시 깨닫게 되었소. "),
  d("final-11", "angryCommoner", " 고맙네. 나그네들. "),
  hide("final-chaos-out"), hold("final-empty-hold", 1000),
  n("final-12", " 화를 내던 사람들은 저마다 감사의 한 마디를 남기고는 흔적도 없이 사라져 버렸다. "),
  n("final-13", " 사람들이 사라지고 남은 자리에는 무언가가 떨어져 있었다. "),
  show("music-box-in", asset("broken-music-box.png")),
  d("final-14", "luna", " 잠깐, 저건 뭐야? "),
  d("final-15", "theo", " 오르골.. 같은데요? 이 시대 사람들의 것 같지는 않습니다. "),
  d("final-16", "theo", " 수상하군요.. 아론 대장님께 가져가 보는 것이 좋겠습니다. "),
  d("final-17", "luna", " 좋아! 어서 베이스캠프로 돌아가자. "),
]);
