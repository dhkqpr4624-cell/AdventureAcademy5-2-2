import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const luna = createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72");
const nameless = (id: string, name: string): StoryActor => ({ id, name, portraits: {} });
const actors = { luna, scholar: nameless("scholar", "신진사대부"), yi: nameless("yi", "이성계") };
const d = (id: string, speakerId: keyof typeof actors, text: string, expression?: string, nextStepId?: string): StoryStep => ({ id, type: "dialogue", speakerId, speakerName: actors[speakerId].name, activeActorId: speakerId === "luna" ? "luna" : undefined, ...(expression ? { expression } : {}), text, ...(nextStepId ? { nextStepId } : {}), advanceMode: "click" });
const base = (id: string, title: string, steps: StoryStep[]): StorySequence => ({ id, title, scenes: [{ id: `${id}-scene`, steps }], backgrounds: {}, actors, replayable: false, skippable: false, onCompleteScreen: "dungeon" });

export const DUNGEON1_ENTRY_STORY = base("dungeon1-chapter2-entry", "수상한 주민", [
  d("d1-entry-1", "scholar", " 누구냐! 여기, 수상한 자가 있다! 이 자들을 잡아라! "),
  d("d1-entry-2", "luna", " 이, 이것봐!! 이 사람들, 우리를 쫓아온다니까?! ", "scared"),
  d("d1-entry-3", "luna", " 어서 앞으로 가자! 일단 잡히면 안 될 것 같아!! ", "scared"),
]);

const image = (name: string) => `${import.meta.env.BASE_URL}assets/story/chapter2/dungeon1/${name}`;
export const DUNGEON1_FINAL_STORY = base("dungeon1-chapter2-final", "조선의 건국과 발전", [
  { id: "yi-show", type: "illustOverlay", imageUrl: image("yi-seong-gye.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  { id: "yi-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
  d("yi-1", "yi", " 음? 너희들은 누구지? 옷차림이 특이하군. "),
  d("yi-2", "yi", " 너희들도 혹시, 조선의 건국을 반대하는 세력의 일부인겐가? "),
  d("yi-3", "yi", " 그렇다면...! "),
  d("luna-stop-1", "luna", " 잠깐, 잠깐!! ", "scared"),
  d("luna-stop-2", "luna", " 저희는 그저 지나가는 나그네입니다! 그저, 저 뒤에 있는 문을 열고 앞으로 나아가고 싶을 뿐이에요! ", "scared"),
  d("yi-door-1", "yi", " 문을 열고, 앞으로? "),
  d("yi-door-2", "yi", " 당최 무슨 말인지 알 수 없지만, 그럼 내 고민을 해결해 보거라. "),
  d("yi-door-3", "yi", " 대답이 마음에 든다면 그대들을 보내주지. "),
  { id: "ask-problem", type: "choice", options: [{ id: "ask", label: "당신의 고민은 무엇인가요?", nextStepId: "yi-problem-1" }], advanceMode: "click" },
  d("yi-problem-1", "yi", " 고려가 큰 혼란에 빠져, 조선이라는 새로운 나라를 만들었는데 이제 이 혼란을 잠재울 방법이 고민스럽도다. "),
  d("yi-problem-2", "yi", " 무엇을 하는게 좋겠느냐? "),
  { id: "yi-choice", type: "choice", options: [
    { id: "purge", label: "우선 당신의 뜻을 반대하는 사람을 전부 숙청하세요.", nextStepId: "luna-warning" },
    { id: "land", label: "권문세족이 이 나라 땅을 모두 차지하고 있으니, 그들에게서 땅을 뺏어야합니다.", nextStepId: "luna-answer-1" },
  ], advanceMode: "click" },
  d("luna-warning", "luna", " ( (플레이어 이름)...! 제발 다시 생각해봐..! 우리 목숨이 위험할 수 있다구..! ) ", "scared", "yi-choice"),
  d("luna-answer-1", "luna", " 왕이시여! 저도 그렇게 생각합니다! "),
  d("luna-answer-2", "luna", " 권문세족들이 나라의 땅을 모두 차지하고 있어 살기가 힘드니, 그들에게서 땅을 빼앗고 정상적인 방법으로 땅을 이용하게 해야 합니다. "),
  d("yi-answer-1", "yi", " ... "), d("yi-answer-2", "yi", " 허허허! "),
  d("yi-answer-3", "yi", " 그래, 짐의 생각과 똑같구나. 아주 현명한 나그네들일세. "),
  d("yi-answer-4", "yi", " 약속한대로 자네들을 보내주겠노라. "),
  d("scholar-2", "scholar", " 허나..! 저들은 수상한 자들이온데..! "),
  d("yi-leave-1", "yi", " 어허! "), d("yi-leave-2", "yi", " 짐은 약속을 지킨다. "), d("yi-leave-3", "yi", " 앞으로 나아가거라. "),
  { id: "yi-hide", type: "illustOverlay", visible: false, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  { id: "yi-hide-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
  { id: "narration", type: "narration", text: "이성계와 신진사대부는 그렇게 말하고 흔적도 없이 사라져버렸다.", advanceMode: "click" },
  d("luna-return-1", "luna", " 던전 2층으로 가는 문이 열렸네, (플레이어 이름)! 그리고 하나 알아낸 것도 있어. "),
  d("luna-return-2", "luna", " 이 던전 안에서는.. 역사가 살아 움직이고 있어. "),
  d("luna-return-3", "luna", " 이건 절대 흔한 일이 아니야. 무엇이 원인인지.. 그것은 앞으로 차차 알아가야겠지. "),
  d("luna-return-4", "luna", " 우선 돌아가서 모두에게 알리자. "),
  d("luna-shadow-1", "luna", " 자, 잠깐.. 근데 저게 뭐지? ", "scared"),
  { id: "shadow-show", type: "illustOverlay", imageUrl: image("mysterious-figure.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  { id: "shadow-hold", type: "wait", durationMs: 3000, advanceMode: "auto" },
  { id: "shadow-vanish", type: "illustOverlay", imageUrl: image("vanished-figure.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
  { id: "shadow-final-hold", type: "wait", durationMs: 1500, advanceMode: "auto" },
  d("luna-shadow-2", "luna", " 응..? 방금 저기에 뭔가.. 있지 않았어? ", "scared"),
  d("luna-shadow-3", "luna", " 으으.. 뭔가 느낌이 이상한걸.. (플레이어이름)! 어서 돌아가자! ", "scared"),
]);
