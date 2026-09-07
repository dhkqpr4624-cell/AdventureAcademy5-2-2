import type { StorySequence, StoryStep } from "../../types/story";
import { createChapter2Actor } from "./chapter2Portraits";

const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#78b7ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d6b56f"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
  commoner: createChapter2Actor("commoner", "상민", "", "#c8a777"),
  sejong: createChapter2Actor("sejong", "세종대왕", "", "#d6b56f"),
  chiefMinister: createChapter2Actor("chiefMinister", "영의정", "", "#c8a777"),
  deneb: createChapter2Actor("deneb", "???", "", "#b9c6da"),
  researcher: createChapter2Actor("researcher", "연구원A", "", "#b9c6da"),
};
type ActorId = keyof typeof actors;
const d = (id: string, actor: ActorId, text: string, expression = "default", extra: Partial<Extract<StoryStep, {type:"dialogue"}>> = {}): StoryStep => ({
  id, type: "dialogue", speakerId: actor, speakerName: actors[actor].name,
  activeActorId: actor, expression, text, advanceMode: "click", ...extra,
});
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });
const asset = (name: string) => `${import.meta.env.BASE_URL}assets/dungeon3/${name}`;
const show = (id: string, imageUrl: string, hideDialogue = false): StoryStep => ({ id, type: "illustOverlay", imageUrl, visible: true, fadeMs: 700, hideDialogue, waitForFade: true, advanceMode: "auto" });
const hide = (id: string, hideDialogue = false): StoryStep => ({ id, type: "illustOverlay", visible: false, fadeMs: 700, removeAfterFade: true, hideDialogue, waitForFade: true, advanceMode: "auto" });
const hold = (id: string, durationMs: number): StoryStep => ({ id, type: "wait", durationMs, advanceMode: "auto" });
const seq = (id: string, title: string, steps: StoryStep[], extra: Partial<StorySequence> = {}): StorySequence => ({
  id, title, actors, backgrounds: {}, scenes: [{ id: `${id}-scene`, steps }], replayable: false,
  skippable: Boolean(extra.skipTarget), persistentIllustBackdrop: true, onCompleteScreen: "dungeon", ...extra,
});

export const DUNGEON3_OFFER_STORY = seq("npc-kapp-floor-3-quest-available", "조선시대의 문화(학문 및 과학)", [
  d("offer-1","kapp"," 오셨군요, 여러분. 수고가 많습니다. "), d("offer-2","kapp"," 여러분들이 말한 내용부터 이번에 여러분들이 발견하신 물건까지.. "),
  d("offer-3","kapp"," 이 던전은 수상한 것이 한 둘이 아니군요. "), d("offer-4","theo"," 맞습니다, 카프님. 그렇기에 더더욱 그 부서진 오르골을 조사해야 하지 않을까요? ","worried"),
  d("offer-5","kapp"," 아뇨, 오르골은 아론의 말대로 저희가 맡겠습니다. "), d("offer-6","kapp"," 의문스러운 점이 많겠지만, 저희를 믿고 따라주시길 바랍니다. "),
  d("offer-7","theo"," ... ","worried"), d("offer-8","theo"," 알겠습니다. "), d("offer-9","luna"," (테오! 하지만..) ","angry"),
  d("offer-10","theo"," (아니오, 루나. 지휘관님과 부지휘관님을 따라야합니다.) "), d("offer-11","theo"," (여기서 서로 의심해봐야 더 위험하기만 할 뿐이니까요..) "),
  d("offer-12","luna"," ... "), d("offer-13","luna"," (알겠어.) "), d("offer-14","kapp"," 고마워요. "),
  d("offer-15","kapp"," 이제 다음으로 공략해야 될 곳이 3층인가요.. "), d("offer-16","kapp"," 아무래도 직접 들어가서 확인해보는 것이 좋을 것 같아서, 이번엔 저도 함께 들어가겠습니다. "),
  d("offer-17","luna"," ...알겠어요, 부대장! "), d("offer-18","luna"," (플레이어이름), 어서 준비를 마치고 다음 층으로 들어가자! "),
], { persistentIllustBackdrop: false, onCompleteScreen: "baseCamp" });

export const DUNGEON3_ENTRY_STORY = seq("dungeon3-chapter2-entry", "조선시대의 문화(학문 및 과학)", [
  d("entry-1","commoner"," 아! 벌써 해가 졌잖아! "), d("entry-2","commoner"," 아이고.. 아직 오늘치 농사를 다 못 지었는데..! "),
  d("entry-3","kapp"," ... "), d("entry-4","kapp"," 정말 여러분들 말대로군요. 정말로 던전 속에서 사람들이 살아 움직이고 있네요. "),
  d("entry-5","theo"," 여기 계시는 모두 시간을 알 수 없어서 곤란해하시는 모습이군요. "), d("entry-6","theo"," 아무래도 이번에 해결해야 할 일은 이것과 관련이 있겠죠. "),
  d("entry-7","luna"," 좋아! 뭐가 됐든 빨리 해치워 버리자고! "), d("entry-8","luna"," 앞으로!! 출발!! "),
], { persistentIllustBackdrop: false });

const choice: StoryStep = { id: "sejong-choice", type: "choice", advanceMode: "click", options: [
  { id:"farming", label:"알맞은 농사 방법을 주제로 책으로 만들어 보세요.", actionId:"d3-correct-farming", hideWhenActionCompleted:true, nextStepId:"farming-kapp" },
  { id:"clock", label:"시계를 만들어서 사람들이 많이 다니는 곳에 설치해 보세요.", actionId:"d3-correct-clock", hideWhenActionCompleted:true, nextStepId:"clock-kapp" },
  { id:"wrong", label:"농사라는 걸 없애버립시다.", nextStepId:"wrong-theo" },
]};
const afterChoice = { actionIds:["d3-correct-farming","d3-correct-clock"], stepId:"common-1" };
export const DUNGEON3_FINAL_STORY = seq("dungeon3-chapter2-final", "조선시대의 문화(학문 및 과학)", [
  show("sejong-show",asset("sejong-contemplating.png"),true), hold("sejong-hold",1500),
  d("pre-1","sejong"," 허어.. 고민스럽도다. "), d("pre-2","luna"," 전하~ 안녕하세요! 무엇이 그리 고민이신지요? "),
  d("pre-3","sejong"," 음? 뭐야? 그대들은 어디에서 온 누구인가? "), d("pre-4","sejong"," 여봐라! 이 자들은 누구란 말인가? "),
  d("pre-5","chiefMinister"," 그, 그것이! 전하, 영문을 모르겠습니다. 분명 조금 전까지 아무도 없었는데..?! "),
  d("pre-6","sejong"," 허, 어디선가 갑자기 나타나기라도 했다는 것인가. "), d("pre-7","sejong"," 좋다. 내 고민이 무엇인지 물었으니, 대답해 주어야지. "),
  d("pre-8","sejong"," 백성들이 시간을 모르고, 어느 때 어떻게 농사를 지을 줄 모르니.. 농사 효율이 참으로 나쁘도다. "),
  d("pre-9","sejong"," 농사는 백성들이 살아가는 수단일지니, 이를 어찌 해결해야 할꼬. "), choice,
  d("farming-kapp","kapp"," ( 역시 대단하군, (플레이어이름). 세종대왕께서는 농사직설이라는 책을 편찬하셔서 백성들이 알맞은 농사법을 사용할 수 있도록 하셨지. ) ","smile"),
  d("farming-sejong","sejong"," 허허, 짐이 생각하는 바와 똑같도다! ","default",{nextStepId:"more",nextStepWhenActionsComplete:afterChoice}),
  d("clock-kapp","kapp"," (대단해, (플레이어이름). 세종대왕께서는 앙부일구라는 해시계를 사람들이 많이 다니는 길목에 두어 사람들이 쉽게 시간을 확인할 수 있도록 하셨었지. ) ","smile"),
  d("clock-sejong","sejong"," 허허, 현명하구나! ","default",{nextStepId:"more",nextStepWhenActionsComplete:afterChoice}),
  d("wrong-theo","theo"," ...진심입니까, (플레이어 이름)? ","worried",{nextStepId:"sejong-choice"}),
  d("more","sejong"," 그리고 또 무엇을 하면 좋겠느냐? ","default",{nextStepId:"sejong-choice"}),
  d("common-1","sejong"," 어디서 나타났는 지도 모르는 익명의 나그네들에게 큰 도움을 얻었도다. 보답을 하고 싶은데- "),
  d("common-2","sejong"," 어디, 자네들이 원하는 것이 무엇인가? "), d("common-3","luna"," 우리가 원하는 걸 한 가지 들어주시려나봐!! 잘 생각하고 대답해야 하겠어! ","smile"),
  d("common-4","theo"," 감사합니다, 전하. 저희는 단지 앞으로 나아가고 싶을 뿐입니다. ","smile"), d("common-5","sejong"," 허허, 겸손도 겸비한 훌륭한 인물들이로군. "),
  d("common-6","sejong"," 앞으로 나아갈 것이라면, 부디 조심하게. 요 근래 <red><b>귀신</b></red>이 나온다는 소문이 있어. "),
  d("common-7","kapp"," 귀신이요..? 자세히 말씀해 주시겠습니까?"), d("common-8","sejong"," 흠.. 듣기로는 긴 머리에 이방의 옷처럼 보이는 것을 입고 있다고 했지, 아마? "),
  d("common-9","sejong"," 눈 앞에 나타났다가 순식간에 사라진다고 하더군. "), d("common-10","kapp"," ...! ","surprised"), d("common-11","kapp"," 알겠습니다. 감사해요, 전하. ","surprised"),
  d("common-12","sejong"," 나야말로 고맙네, 덕분에 고민이 해결되었으니-"), d("common-13","sejong"," 백성들이 조금이라도 더 살기 좋아지겠어. "),
  hide("sejong-hide",true), n("gone"," 세종대왕님과 신하들은 그리 말하고는 흔적도 없이 사라졌다. "),
  d("opened","luna"," 길이 열렸어! 테오, 부대장님, 베이스캠프로 돌아가서 정비하자! "), d("look","theo"," 잠시만요. 여러분, 저길 보십시오! ","worried"), d("what","theo"," 저건...? ","worried"),
  show("form-show",asset("mysterious-form.png"),true), d("voice-1","deneb"," ... "), d("voice-2","deneb"," ......■심.... □■앞■■□□ □□ "),
  d("luna-form-1","luna"," 윽?! 뭐야?! ","scared"), d("luna-form-2","luna"," 뭐라는 건지 하나도 모르겠어..! ","scared"), d("kapp-form","kapp"," 이건...! ","surprised"),
  show("vanished-show",asset("vanished-form.png"),true), hold("vanished-hold",1000), d("kapp-wait","kapp"," 잠깐..! 기다려! ","surprised"), hide("vanished-hide",true),
  d("theo-stop-1","theo"," 잠시만요, 카프님! 어딜 가시는 겁니까?! ","angry"), d("theo-stop-2","theo"," 루나! 카프님을 막으십시오! ","angry"), d("luna-stop","luna"," 알았어! ","serious"),
  show("restrained-show",asset("restrained-kapp.png"),true), d("kapp-restrained","kapp"," 으, 놓으세요! 저 형체를 조사해봐야..! ","angry"),
  d("theo-return-1","theo"," 진정하십시오, 카프님! ","angry"), d("theo-return-2","theo"," 루나, (플레이어 이름)! 이대로 베이스캠프로 돌아가겠습니다! ","angry"), d("theo-return-3","theo"," 부지휘관님을 부탁합니다! ","angry"),
]);

export const DUNGEON3_COMPLETION_PRELUDE = seq("dungeon3-completion-prelude", "던전 3층 보고", [
  d("p-1","aron"," 이게 무슨.. 대체 무슨 일이 있었던 겁니까? "), n("p-2"," 당신은 아론에게 던전 3층에서 있었던 일을 모두 설명했다. "),
  d("p-3","aron"," 그런 일이.. ","sad"), d("p-4","aron"," 카프... ","sad"), d("p-5","kapp"," ..미안해요, 아론. 추태를 보였네요. "),
  d("p-6","theo"," ... ","worried"), d("p-7","theo"," 아론 님, 카프 님. 두 분은 무언가를 알고 계신 거죠? ","worried"),
  d("p-8","luna"," 테오? 그게 무슨 말이야? ","serious"), d("p-9","theo"," 이 던전에 진입한지 벌써 꽤 시간이 되었는데, 이전부터 계속 무언가를 숨기신다는 느낌이 듭니다. ","worried"),
  d("p-10","theo"," 무슨 일인지는 모르겠지만, 이제 더 숨기지 말고 말씀해주십시오. ","worried"), d("p-11","aron"," 그건.... ","serious"), d("p-12","aron"," ... ","serious"), d("p-13","aron"," 알겠습니다.. ","serious"),
], { persistentIllustBackdrop:false, onCompleteScreen:"baseCamp" });

export const DUNGEON3_FLASHBACK = seq("dungeon3-flashback", "7년 전", [
  hold("black-hold",1500), d("fb-1","aron"," 어디서부터 말씀드려야 할지 잘 모르겠습니다만... 아마 이것부터 말씀드려야 할 것 같습니다.","serious"),
  d("fb-2","aron"," <red><b>저희는 이 던전에 들어와 본 적이 있습니다..</b></red> ","serious"),
  {id:"hq-stage",type:"checkpoint",checkpointId:"hq",advanceMode:"auto"}, hold("hq-rise",2500), d("hq-1","researcher"," 비... 비상입니다, ■■■님! "), d("hq-2","deneb"," 무슨 일이죠? "),
  d("hq-3","researcher"," 서울 상공에 거대한 포탈이 나타났습니다. 그런데 그 규모가 매우 큽니다! "), d("hq-4","researcher"," 이대로 두면 매우 위험합니다. 부탁드립니다. 이 포탈을 막아주십시오! "),
  d("hq-5","deneb"," ... "), d("hq-6","deneb"," 알겠습니다. 위험할 수 있으니, 우선 저희 셋만 진입하겠습니다. "), d("hq-7","deneb"," 다른 분들은 혹시 모르니, 바깥에서 구조 대기를 부탁드립니다. "), d("hq-8","researcher"," 알겠습니다, ■■■님! "),
  {id:"black-between",type:"checkpoint",checkpointId:"black",advanceMode:"auto"}, d("transition-1","kapp"," 저희는 서울 상공에 있는 거대한 포탈 내부로 향했어요. "), d("transition-2","kapp"," 위험할 것이라는 것은 알고 있었습니다. 그러나... "),
  d("transition-3","kapp"," 저희가 예상했던 것보다도 훨씬 더, 이 곳은 위험한 곳이었죠. "), d("transition-4","kapp"," <red><b>저희가 포탈 안에 들어갔을 때는 이미.. 포탈이 현실세계를 반절 이상 집어삼킨 뒤였으니까요.</b></red> "),
  {id:"ruins-stage",type:"checkpoint",checkpointId:"ruins",advanceMode:"auto"}, hold("ruins-rise",2500), d("r-1","aron"," ■■■님, 이대로는 위험합니다! ","shouting"), d("r-2","aron"," 현실의 시간은.. 이미 절반 이상이 이 던전에 잡아먹혔어요! ","shouting"),
  d("r-3","aron"," 현실의 시간을 잡아먹은 던전 속 인물들이 살아 움직이기 시작했단 말입니다!! ","shouting"), d("r-4","kapp"," ■■■, 어서 탈출해야 해요! ","shouting"),
  d("r-5","deneb"," ... "), d("r-6","deneb"," 아론님, 카프님. "), d("r-7","deneb"," 두 분은 먼저 빠져나가세요. 이 포탈은, 제가 막겠습니다. "),
  {id:"hide-for-alert",type:"setStagePhase",stageId:"dungeon3-flashback",phase:"alert",hideDialogue:true,advanceMode:"auto"}, {id:"ruins-alert",type:"checkpoint",checkpointId:"ruinsAlert",advanceMode:"auto"}, hold("alert-play",1715), {id:"ruins-resume",type:"checkpoint",checkpointId:"ruins",advanceMode:"auto"},
  d("r-8","kapp"," ■■■, 그게 무슨 말이에요! ","shouting"), d("r-9","deneb"," 이 포탈은 <red><b>탐욕</b></red> 그 자체입니다. "), d("r-10","deneb"," 가만히 놔두면, 현실세계의 시간을 모조리 먹어치우겠죠. "),
  d("r-11","deneb"," 누군가가 남아서 이 포탈을 막고 있어야만 해요. "), d("r-12","deneb"," 그리고 그건.. <blue><b>저만이 할 수 있는 일입니다.</b></blue> "),
  d("r-13","aron"," 그렇지만, ■■■님..! ","shouting"), d("r-14","kapp"," ■■■..! 말도 안되는 소리 하지 마요!! ","shouting"), d("r-15","deneb"," 전 괜찮습니다. "),
  d("r-16","deneb"," 언젠가 이 준비가 되었을 때, 다시 한 번 이 던전을 공략하러 와 주세요. "), d("r-17","deneb"," 이곳에서 여러분을 기다리고 있겠습니다. "),
  d("r-18","aron"," ... ","sad"), d("r-19","aron"," 최대한 빨리 돌아오겠습니다, ■■■님..! ","sad"), d("r-20","kapp"," ... ","sad"), d("r-21","kapp"," 기다리고 있어요, ■■■! 반드시 돌아올테니까.. ","sad"),
  {id:"flashback-end-black",type:"checkpoint",checkpointId:"black",advanceMode:"auto"}, d("end-1","aron"," 그리고 저희는 그 분을 두고 던전을 탈출했죠. ","serious"), d("end-2","aron"," 인원을 모아 다시 들어가려고 했지만.. 어째서인지 포탈은 이미 닫혀 있었습니다.. ","serious"), d("end-3","aron"," 그 뒤로, 이 던전을 찾아 헤맨지 벌써 7년이 지났군요.. ","serious"),
], { skipTarget:{complete:true}, persistentIllustBackdrop:false, onCompleteScreen:"baseCamp" });

export const DUNGEON3_CURRENT_STORY = seq("dungeon3-current-basecamp", "데네브", [
  {id:"current-basecamp-map",type:"showBaseCamp",mapId:"academy-base-camp",advanceMode:"auto"},
  d("current-start","theo"," 그렇다면, 아까 던전에서 봤던 그 형체는... ","surprised"), d("c-2","kapp"," 아마 그 사람일거야. ","sad"), d("c-3","kapp"," 이 던전에 생명력을 바쳤을테니.. 그 사람의 의지가 던전 이곳 저곳에 나타나는 거겠지. ","sad"),
  d("c-4","luna"," 너..너무 슬픈 이야기였어... ","sad"), d("c-5","luna"," 그나저나, 그 분의 성함은 무엇인가요? ","sad"), d("c-6","kapp"," 그 사람의 이름은.. <blue><b>데네브</b></blue>. ","serious"), d("c-7","kapp"," 우리의 지휘관이자, 나와 친했던 동생이지. ","serious"),
  d("c-8","theo"," ...! 들어본 적이 있습니다! ","surprised"), d("c-9","theo"," 던전 안에서 전사하셨다고 들었는데.. 그런 사정이 있었군요. ","surprised"), d("c-10","aron"," ... ","sad"), d("c-11","aron"," 숨겨서 미안합니다. ","sad"), d("c-12","aron"," 섣부른 생각일수도 있으니, 여러분께 알려 혼란스럽게 해드리고 싶지 않았습니다. ","sad"),
  d("c-13","kapp"," ... "), d("c-14","kapp"," 하지만.. 결과적으로는 여러분을 속인 꼴이 되었죠. 정말 미안해요. "), d("c-15","theo"," 사과하지 마십시오. 저라도 그랬을 겁니다. "), d("c-16","theo"," 지휘관님과 부지휘관님으로서, 해야만 했던 일이니까요. "), d("c-17","theo"," 알려주셔서 감사합니다. "),
  d("c-18","luna"," 고마워요. 대장, 부대장! "), d("c-19","luna"," 그럼 이제 우리가 뭘 해야 할지 잘 알겠네요! ","smile"), d("c-20","luna"," 함께 데네브님을 구출해야죠! 모두 기운을 내세요! 어서요! ","smile"), d("c-21","aron"," ... ","smile"), d("c-22","aron"," 그래야죠. 고맙습니다, 모두. ","smile"),
], { skipTarget:{complete:true}, persistentIllustBackdrop:false, onCompleteScreen:"baseCamp" });
