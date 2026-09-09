import type { StoryActor, StorySequence, StoryStep, StoryVisualAsset } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon4/${name}`;
const portraitActor = (id: string, name: string, imageUrl: string): StoryActor => ({
  id, name, defaultExpression: "default", portraits: {
    default: { imageUrl, placeholder: { label: name, gradient: "linear-gradient(135deg,#26384a,#111)" } } satisfies StoryVisualAsset,
  },
});
const actors = {
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d6b56f"),
  yiSunSin: portraitActor("yiSunSin", "이순신", asset("yi-sun-sin-portrait.png")),
  gwakJaeU: portraitActor("gwakJaeU", "곽재우", asset("gwak-jae-u-portrait.png")),
  deneb: createChapter2Actor("deneb", "???", "", "#b9c6da"),
};
type ActorId = keyof typeof actors;
const d = (id: string, actor: ActorId, text: string, expression = "default", nextStepId?: string): StoryStep => ({
  id, type: "dialogue", speakerId: actor, speakerName: actors[actor].name, activeActorId: actor,
  expression, text, advanceMode: "click", ...(nextStepId ? { nextStepId } : {}),
});
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });
const show: StoryStep = { id: "d4-illust-in", type: "illustOverlay", imageUrl: asset("yi-gwak-illustration.png"), visible: true, fadeMs: 700, hideDialogue: true, waitForFade: true, advanceMode: "auto" };
const hide: StoryStep = { id: "d4-illust-out", type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue: true, waitForFade: true, advanceMode: "auto" };

export const DUNGEON4_ENTRY_STORY: StorySequence = {
  id: "dungeon4-chapter2-entry", title: "임진왜란과 병자호란", replayable: false, skippable: false,
  dialogueSkip: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "dungeon4-chapter2-entry-scene", steps: [
    d("d4-entry-1", "aron", " 이곳은.. "),
    d("d4-entry-2", "aron", " 바다 위... 인 것 같군요. "),
    d("d4-entry-3", "aron", " 물 위를 걸어다닐 수 있는 것으로 보니 진짜 바다는 아니고, 이 또한 던전이 만든 허상의 일부가 틀림없습니다. "),
    d("d4-entry-4", "aron", " 조심해서 앞으로 나아가죠, (플레이어 이름). "),
  ] }],
};

export const DUNGEON4_FINAL_STORY: StorySequence = {
  id: "dungeon4-chapter2-final", title: "임진왜란과 병자호란", replayable: false, skippable: false,
  dialogueSkip: true, persistentIllustBackdrop: true, onCompleteScreen: "dungeon", backgrounds: {}, actors,
  scenes: [{ id: "dungeon4-chapter2-final-scene", steps: [
    show,
    d("d4-1","yiSunSin"," 자네는 누구인가?! "),
    d("d4-2","gwakJaeU"," 이런, 적이냐! 전군 전투 태세를 갖추어라! "),
    d("d4-3","aron"," 이런, 진정하십시오! 저희는 적이 아닙니다. "),
    d("d4-4","aron"," 저희는 그저 앞으로 나아가고 싶은 나그네들입니다! "),
    d("d4-5","gwakJaeU"," 앞으로 나아가고 싶다? 이 전쟁통에? "),
    d("d4-6","gwakJaeU"," 잠깐, 자네들이 온 방향은 분명 일본군들이 진을 치고 있었을텐데, 일본군들을 전부 뚫고 온 겐가?! "),
    d("d4-7","yiSunSin"," 하하하! 마음에 드는 자들이로구나! "),
    d("d4-8","yiSunSin"," 하지만 이 앞은 위험하네. 자네들이 나아갈 수 있다는 것을 어떻게 증명해 보이겠나? "),
    d("d4-9","yiSunSin"," 좋다. 그러면 우리의 고민을 들어주지 않겠는가? "),
    d("d4-10","aron"," 노력해보겠습니다. 어떤 고민이십니까? "),
    d("d4-11","gwakJaeU"," 나부터 하지. 일본군이 우리 조선의 땅으로 계속 침략해오고 있는 마당에, 우리는 무엇을 해야 우리 땅을 지킬 수 있겠소? "),
    { id:"gwak-choice", type:"choice", advanceMode:"click", options:[
      { id:"righteous-army", label:"양반부터 노비까지 여러 사람들을 불러 모아, 우리 고향의 땅을 이용해서 무찌릅시다.", nextStepId:"gwak-right" },
      { id:"retreat", label:"우선 후퇴하여 상황을 지켜봐야 합니다.", nextStepId:"gwak-wrong" },
    ]},
    d("gwak-right","gwakJaeU"," 허, 내가 생각한 바와 똑같구나. ","default","yi-problem"),
    d("gwak-wrong","gwakJaeU"," 흠...? ","default","gwak-choice"),
    d("yi-problem","yiSunSin","이번엔 나의 고민도 들어주겠나? 일본이 배를 통해 침략을 해 오니, 이를 어찌하면 막을 수 있겠는가? "),
    { id:"yi-choice", type:"choice", advanceMode:"click", options:[
      { id:"ambush", label:"일본군이 바다에 상륙하는 그 순간 기습해야 합니다.", nextStepId:"yi-wrong" },
      { id:"turtle-ship", label:"배 위에 지붕과 갑판을 얹은 거북선으로 바다에서 건너오는 일본군을 무찔러야 합니다.", nextStepId:"yi-right" },
    ]},
    d("yi-wrong","yiSunSin"," 그것도 나쁘지는 않은 생각이다만... ","default","yi-choice"),
    d("yi-right","yiSunSin"," 허허, 거북선! 내가 생각했던 그대로군! ","default","common-1"),
    d("common-1","yiSunSin"," 우리의 고민을 해결해주어 아주 고맙네. 자네들은 앞으로 나아갈 자격이 있는 자들이로군. "),
    d("common-2","yiSunSin"," 우리가 힘 내어 과거를 지킬테니, 자네들은 어서 나아가 현재와 미래를 지키게 "),
    d("common-3","gwakJaeU"," 그럼, 부탁하겠네."),
    hide,
    n("d4-narration"," 이순신과 곽재우는 그렇게 말하고는 흔적도 없이 사라졌다. "),
    d("d4-aron-1","aron"," 이순신 장군님과 곽재우 장군님은, 저희의 정체를 이미 눈치채고 있으셨던 듯 하군요. "),
    d("d4-aron-2","aron"," 과연 대단하신 위인들입니다. "),
    d("d4-aron-3","aron"," 자, 앞으로 가는 길이 열렸으니 어서 돌아가서 모두에게 알립시다. "),
    d("d4-voice-1","deneb"," .....! "), d("d4-aron-4","aron"," ...! "), d("d4-voice-2","deneb"," ...여.......위험..... "),
    d("d4-aron-5","aron"," 이 목소리는..! ","angry"),
    d("d4-aron-6","aron"," 틀림없이, 데네브님의 목소리입니다. ","angry"),
    d("d4-aron-7","aron"," 목소리가 선명하게 들리기 시작했다는 것은.. 데네브님과 점점 가까워지고 있다는 것이겠죠. ","angry"),
    d("d4-aron-8","aron"," 돌아갑시다, (플레이어 이름). "),
    d("d4-aron-9","aron"," 모두에게 알리고, 다음 층으로 나아가기 위한 계획을 세워야겠습니다. "),
  ] }],
};
