import type { StoryActor, StorySequence, StoryStep } from "../../types/story";
import { NPC_PORTRAIT_REGISTRY } from "../../game/npc/npcPortraitRegistry";
import { resolveNpcPresentation } from "../../game/npc/npcPresentationResolver";
import type { NpcId } from "../../game/npc/npcTypes";
import { createChapter2Actor } from "./chapter2Portraits";
import { DUNGEON3_OFFER_STORY } from "./dungeon3Chapter2Stories";

const chapter2Actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"),
  theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"),
  aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"),
  kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"),
};

function chapter2DialogueSequence(id: string, entries: Array<{ actor: keyof typeof chapter2Actors; text: string; expression?: string; emphasis?: "danger" | "info" }>): StorySequence {
  return { id, title: "2단원 대화", replayable: true, skippable: false, dialogueSkip: true, onCompleteScreen: "baseCamp", backgrounds: {}, actors: chapter2Actors,
    scenes: [{ id: `${id}-scene`, steps: entries.map((entry, index): StoryStep => ({ id: `${id}-${index + 1}`, type: "dialogue", speakerId: entry.actor, speakerName: chapter2Actors[entry.actor].name, activeActorId: entry.actor, expression: entry.expression ?? "default", text: entry.text, ...(entry.emphasis ? { emphasis: entry.emphasis } : {}), advanceMode: "click" })) }] };
}

function sequence(
  id: string,
  npcId: NpcId,
  portraitId: string,
  lines: Array<string | { text: string; emphasis: "danger" | "info" }>,
): StorySequence {
  const npc = resolveNpcPresentation(npcId);
  const steps: StoryStep[] = [
    {
      id: `${id}-portrait`,
      type: "showPortrait",
      actorId: npcId,
      portraitId,
      position: "left",
      transition: "fade",
    },
    ...lines.map((entry, index): StoryStep => ({
      id: `${id}-line-${index + 1}`,
      type: "dialogue",
      speakerId: npcId,
      speakerName: npc.displayName,
      activeActorId: npcId,
      text: typeof entry === "string" ? entry : entry.text,
      ...(typeof entry === "string" ? {} : { emphasis: entry.emphasis }),
      advanceMode: "click",
    })),
  ];
  return {
    id,
    title: `${npc.displayName} 대화`,
    replayable: true,
    skippable: false,
    dialogueSkip: true,
    onCompleteScreen: "baseCamp",
    backgrounds: {},
    actors: {
      [npcId]: {
        id: npcId,
        name: npc.displayName,
        role: npc.role,
        portraits: {
          [portraitId]: {
            imageUrl:
              NPC_PORTRAIT_REGISTRY[`${npcId}.${portraitId}`] ??
              NPC_PORTRAIT_REGISTRY[`${npcId}.default`],
            placeholder: {
              label: npc.displayName,
              subtitle: npc.role,
              gradient: "linear-gradient(135deg, #30291f, #111)",
            },
          },
        },
      },
    },
    scenes: [{ id: `${id}-scene`, steps }],
  };
}

function actor(npcId: NpcId, portraitId: string): StoryActor {
  const npc = resolveNpcPresentation(npcId);
  return {
    id: npcId,
    name: npc.displayName,
    role: npc.role,
    portraits: {
      [portraitId]: {
        imageUrl: NPC_PORTRAIT_REGISTRY[`${npcId}.${portraitId}`] ?? NPC_PORTRAIT_REGISTRY[`${npcId}.default`],
        placeholder: { label: npc.displayName, subtitle: npc.role, gradient: "linear-gradient(135deg, #30291f, #111)" },
      },
    },
  };
}

const COMPLETION_ACTOR_IDS: NpcId[] = ["luna", "theo", "kaiden", "jeon"];

function singleSpeakerDialogue(
  id: string,
  npcId: NpcId,
  portraitId: string,
  text: string,
): StoryStep[] {
  const npc = resolveNpcPresentation(npcId);
  return [
    ...COMPLETION_ACTOR_IDS.map((actorId): StoryStep => ({
      id: `${id}-hide-${actorId}`,
      type: "hidePortrait",
      actorId,
    })),
    {
      id: `${id}-show`,
      type: "showPortrait",
      actorId: npcId,
      portraitId,
      position: "left",
      transition: "fade",
    },
    {
      id: `${id}-dialogue`,
      type: "dialogue",
      speakerId: npcId,
      speakerName: npc.displayName,
      activeActorId: npcId,
      text,
      advanceMode: "click",
    },
  ];
}

function floor5QuestDialogue(id: string, npcId: NpcId, portraitId: string, text: string): StoryStep[] {
  return singleSpeakerDialogue(id, npcId, portraitId, text).map((step) =>
    step.type === "hidePortrait" || step.type === "showPortrait"
      ? { ...step, durationMs: 0 }
      : step
  );
}

export const NPC_STORY_SEQUENCES: Record<string, StorySequence> = {
  [DUNGEON3_OFFER_STORY.id]: DUNGEON3_OFFER_STORY,
  "npc-theo-emergency-potions": chapter2DialogueSequence("npc-theo-emergency-potions", [
    { actor: "theo", text: " 이런, (플레이어 이름), 괜찮습니까? " },
    { actor: "theo", text: " 포션이 없군요.. 어쩔 수 없죠. 제가 가지고 있는 비상 포션을 드리겠습니다. 부디 조심해주세요. " },
  ]),
  "npc-theo-floor-1-quest-available": chapter2DialogueSequence("npc-theo-floor-1-quest-available", [
    { actor: "theo", text: " 어서오십시오, (플레이어 이름). " },
    { actor: "theo", text: " 이 베이스 캠프.. 참으로 이상하지 않습니까? 던전 입구 앞에 <blue><b>마치 예전에 누군가가 있기라도 했던 것처럼</b></blue> 텐트가 세워져있더군요. " },
    { actor: "theo", text: " 오래된 것처럼 보이는 텐트는 아론님과 카프님께서 살펴보고 계십니다. " },
    { actor: "theo", text: " 그나저나.. 던전 1층 이야기를 하죠. 정찰 담당인 루나가 먼저 던전을 살펴보았는데.. " },
    { actor: "luna", expression: "scared", text: " (플레이어 이름) !!!! 같이 가줘, 엉엉!!! 무서워!! " },
    { actor: "theo", expression: "smile", text: " 보시다시피 저런 상태입니다. " },
    { actor: "luna", expression: "scared", text: " 던전 1층에 들어갔는데, 갑자기 던전 안에 사는 사람이 말을 걸어왔어!! 이상하다니까! " },
    { actor: "theo", text: " 음, 확실히 이상하긴 하군요. 던전 안에 주민들이 살고 있다는 뜻입니까..? " },
    { actor: "luna", expression: "scared", text: " 모르겠어. 자세한 건 들어가봐야 알겠지. 으으.. 소름..! " },
    { actor: "theo", text: " (플레이어이름), 부탁드립니다. 루나와 함께 던전 1층으로 들어가서 진상을 파악해주시고, 이 던전의 정체를 파악해주셨으면 합니다. " },
    { actor: "theo", text: " 던전 안에서 오답을 선택하면 큰 피해를 입으니, 조심하셔야 합니다. ", emphasis: "danger" },
  ]),
  "npc-theo-floor-1-quest-accepted": chapter2DialogueSequence("npc-theo-floor-1-quest-accepted", [{ actor: "theo", text: " 부디 조심해서 다녀오십시오. " }]),
  "npc-theo-floor-1-quest-active": chapter2DialogueSequence("npc-theo-floor-1-quest-active", [{ actor: "theo", text: " 루나와 함께 던전 1층의 진상을 파악해주십시오. " }]),
  "npc-aron-floor-1-quest-complete": chapter2DialogueSequence("npc-aron-floor-1-quest-complete", [
    { actor: "aron", text: " 돌아왔군요, (플레이어이름). 테오에게 대략적인 상황은 전해들었습니다. " },
    { actor: "aron", text: " 던전 안에, 무엇이 있었습니까? " },
    { actor: "luna", text: " 이 던전은 특이해요, 대장. 던전 안에는 역사 속 인물들이 살아 움직이고 있어요. " },
    { actor: "luna", text: " 무엇이 원인인지는 차차 살펴봐야겠지만.. 그들의 고민을 해결해주면 그들이 다시 역사 속으로 사라지는 것 같았어요. " },
    { actor: "luna", text: " 아마 그들의 고민을 해결해주며 앞으로 나아가야겠어요. " },
    { actor: "kapp", expression: "surprised", text: " 던전 안에서 인물들이 살아 움직인다고요..? " },
    { actor: "theo", text: " 카프님..? 뭔가 짐작 가는 바라도 있으십니까? " },
    { actor: "kapp", expression: "surprised", text: " ... " },
    { actor: "kapp", expression: "surprised", text: " 아뇨, 아무것도 아니에요.. " },
    { actor: "theo", text: " 카프님..? " },
    { actor: "aron", expression: "serious", text: " ... " },
    { actor: "aron", expression: "serious", text: " 확실히 수상하군요. 어찌 되었든, 던전의 정체를 어느정도 파악했으니, 앞으로 나아가는 수밖에요. " },
    { actor: "aron", expression: "serious", text: " 수고했습니다. 루나, (플레이어 이름). 이제 다음 계획을 세우죠. " },
  ]),
  "npc-kaiden-floor-10-quest-available": sequence(
    "npc-kaiden-floor-10-quest-available",
    "kaiden",
    "serious",
    [
      " (플레이어 이름), 아무래도 이번 층이 마지막이겠지. ",
      " 무엇일진 모르겠지만, 10층 문 너머에 이 포탈의 원흉이 있을 것이다. ",
      " 그것이 무엇이든 우리는 그것을 쓰러뜨리고 포탈을 소멸시켜야 해.",
      " (플레이어 이름), 힘든 싸움이 될 것이다. 준비 됐나? ",
    ],
  ),
  "npc-kaiden-floor-10-quest-accepted": sequence(
    "npc-kaiden-floor-10-quest-accepted",
    "kaiden",
    "serious",
    [" 좋아. 그러면 장비와 포션을 다시 한 번 점검하고 출발하도록 하지. "],
  ),
  "npc-kaiden-floor-10-quest-active": sequence(
    "npc-kaiden-floor-10-quest-active",
    "kaiden",
    "serious",
    [" 좋아. 그러면 장비와 포션을 다시 한 번 점검하고 출발하도록 하지. "],
  ),
  "npc-luna-default": sequence("npc-luna-default", "luna", "happy", [
    "{{playerName}}! 던전은 항상 내가 먼저 정찰하고 있어. 필요한 게 있으면 언제든지 말해!",
  ]),
  "npc-luna-floor-3-quest-available": sequence(
    "npc-luna-floor-3-quest-available",
    "luna",
    "happy",
    [
      "{{playerName}}, 왔구나!",
      "던전 2층에서의 활약은 역시 멋지던걸~",
      "사실... 던전 3층을 조사해 봤는데, 던전 너머에서 뭔가의 기운이 느껴진단 말이지...",
      "나는 전투 능력이 거의 없어서 가 볼 수 없으니, 네가 나 대신 조사해주었으면 해.",
    ],
  ),
  "npc-luna-floor-3-quest-accepted": sequence(
    "npc-luna-floor-3-quest-accepted",
    "luna",
    "happy",
    ["좋아. 뭔가 있으면 알려줘!"],
  ),
  "npc-luna-floor-3-quest-active": sequence(
    "npc-luna-floor-3-quest-active",
    "luna",
    "happy",
    ["던전 3층 너머에서 느껴진 기운이 신경 쓰여. 조심해서 조사해줘!"],
  ),
  "npc-luna-floor-3-quest-complete": sequence(
    "npc-luna-floor-3-quest-complete",
    "luna",
    "happy",
    ["아, {{playerName}}! 왔구나!"],
  ),
  "npc-luna-floor-4-quest-available": sequence(
    "npc-luna-floor-4-quest-available",
    "luna",
    "happy",
    [
      "{{playerName}}! 왔구나!",
      "던전 3층에서 네가 찾아온 천조각 기억해? 아무래도 삼국 시대의 물건이 아니라서 혼란스러웠지..",
      "던전 4층을 순찰하고 왔는데, 던전 너머에서 이것과 비슷한 수상한 낌새가 느껴져.",
      "{{playerName}}, 던전 4층 너머에 있는 \"수상한 것\"을 찾아 줄래?",
    ],
  ),
  "npc-luna-floor-4-quest-accepted": sequence(
    "npc-luna-floor-4-quest-accepted",
    "luna",
    "happy",
    ["화이팅이야. 위험하면 언제든 다시 베이스 캠프로 돌아와야 해."],
  ),
  "npc-luna-floor-4-quest-active": sequence(
    "npc-luna-floor-4-quest-active",
    "luna",
    "happy",
    ["던전 4층 너머의 수상한 낌새를 찾아줘. 위험하면 바로 돌아와야 해!"],
  ),
  "npc-theo-default": sequence("npc-theo-default", "theo", "default", [
    "보급품은 차근차근 정리하고 있습니다. 출발 전에는 반드시 장비를 점검해 주십시오.",
  ]),
  "npc-kaiden-default": sequence("npc-kaiden-default", "kaiden", "default", [" ... "]),
  "npc-kaiden-quest-available": sequence(
    "npc-kaiden-quest-available",
    "kaiden",
    "serious",
    [
      "왔나, {{playerName}}.",
      "이 던전에서 빠져나가려면, 우선 이 던전이 어떤 던전인지부터 파악해야겠지.",
      "루나가 정찰하려 했지만, 몬스터가 많아 접근이 어렵다는군.",
      "{{playerName}}. 네가 던전 1층을 살펴보고, 이 던전을 파악할 수 있는 물건들을 가져와주겠나?",
    ],
  ),
  "npc-kaiden-quest-complete": sequence(
    "npc-kaiden-quest-complete",
    "kaiden",
    "serious",
    ["{{playerName}}. 돌아왔군. 그것은..?"],
  ),
  "npc-kaiden-quest-active": sequence(
    "npc-kaiden-quest-active",
    "kaiden",
    "serious",
    ["던전 1층에서 이 던전의 정체를 알려 줄 물건들을 찾아오도록."],
  ),
  "npc-kaiden-quest-accepted": sequence(
    "npc-kaiden-quest-accepted",
    "kaiden",
    "serious",
    [
      "좋다. 준비가 된다면 던전 입구를 클릭하여 던전 1층에 다녀오도록.",
      { text: "던전에서 오답을 선택하면 큰 피해를 입게 되니 조심하는 것도 명심해라.", emphasis: "danger" },
    ],
  ),
  "npc-luna-floor-2-quest-available": chapter2DialogueSequence("npc-luna-floor-2-quest-available", [
    { actor: "luna", text: " (플레이어 이름), 어서와. 다음 층으로 갈 준비는 됐어? " },
    { actor: "theo", text: " 아론님과 카프님은 여전히 이 던전에 대해서 이야기를 나누시는 것 같습니다. 뭔가 분위기로 봐서는 저희가 모르는 중요한 것이 있는 것 같은데 도통 저희에게는 알려주지를 않으시네요.." },
    { actor: "luna", text: " .... " },
    { actor: "luna", expression: "smile", text: " 아~ 모르겠다! 때가 되면 알려주시겠지, 뭐! " },
    { actor: "luna", text: " 아무튼, 대장님은 우리에게 2층으로 진입해서 수상한 물건이 있는지 살펴보고 회수해 오라고 말씀하셨어. " },
    { actor: "luna", text: " 준비가 되면 출발하자, (플레이어 이름). " },
  ]),
  "npc-luna-floor-2-quest-accepted": chapter2DialogueSequence("npc-luna-floor-2-quest-accepted", [{ actor: "luna", text: " 준비가 되면 출발하자, (플레이어 이름). " }]),
  "npc-luna-floor-2-quest-active": chapter2DialogueSequence("npc-luna-floor-2-quest-active", [{ actor: "luna", text: " 2층의 수상한 물건을 찾아보자. " }]),
  "npc-aron-floor-2-quest-complete": chapter2DialogueSequence("npc-aron-floor-2-quest-complete", [
    { actor: "aron", text: " 여러분, 오셨군요. 귀환이 늦어지셔서 걱정하던 참이었습니다. " },
    { actor: "aron", text: " 그런데.. 손에 들고 있는 그것은..? " },
    { actor: "theo", text: " 2층에서 있었던 일을 해결하고 나니 바닥에 떨어져 있었습니다. " },
    { actor: "theo", text: " 오래된 오르골 같은데.. 이 시대의 물건은 아닌 것 같아서 말입니다. " },
    { actor: "kapp", expression: "surprised", text: " ...! " },
    { actor: "kapp", expression: "surprised", text: " 그 물건, 저에게 주세요. 제가 보관하죠. " },
    { actor: "theo", expression: "worried", text: " ... " },
    { actor: "theo", expression: "worried", text: " 그 물건이 무엇인지 자세히 살펴보지 않고 말입니까..? " },
    { actor: "theo", expression: "worried", text: " 저에게 맡겨주시면, 그 물건에 대해 자세히 감정할 수 있습니다. " },
    { actor: "aron", expression: "serious", text: " 아닙니다, 테오. " },
    { actor: "aron", expression: "serious", text: " 이 물건은 오염된 물건이 틀림없습니다. " },
    { actor: "aron", expression: "serious", text: " 저희가 담당하겠습니다. 신경쓰지 말고, 지금처럼 던전 토벌에 힘써주십시오. " },
    { actor: "luna", expression: "angry", text: " 네? 잠시만요, 대장! " },
    { actor: "luna", expression: "angry", text: " 그렇게 제대로 알아보지도 않고 어떻게..! " },
    { actor: "aron", expression: "serious", text: " 미안합니다. " },
    { actor: "aron", expression: "serious", text: " 제 말에 따라주십시오. " },
    { actor: "theo", expression: "worried", text: " ... " },
    { actor: "theo", expression: "worried", text: " 알겠습니다. " },
  ]),
  "npc-jeon-default": sequence("npc-jeon-default", "jeon", "default", [" ... "]),
};

NPC_STORY_SEQUENCES["npc-aron-post-dungeon3-default"] = chapter2DialogueSequence("npc-aron-post-dungeon3-default", [
  { actor: "aron", expression: "default", text: " 이 던전은 매우 위험합니다. 조심해서 앞으로 나아갑시다. " },
]);
NPC_STORY_SEQUENCES["npc-kapp-post-dungeon3-default"] = chapter2DialogueSequence("npc-kapp-post-dungeon3-default", [
  { actor: "kapp", expression: "default", text: " 위험한 것이 있다면 제가 먼저 살펴볼게요. 안심하고 앞으로 나아가세요. " },
]);
NPC_STORY_SEQUENCES["npc-aron-floor-4-quest-available"] = chapter2DialogueSequence("npc-aron-floor-4-quest-available", [
  { actor: "aron", expression: "default", text: " (플레이어 이름), 오셨군요. " },
  { actor: "aron", expression: "default", text: " 던전에서 나온 지 얼마 되지 않았는데 죄송하지만, 바로 4층으로 향하려고 합니다. " },
  { actor: "aron", expression: "default", text: " 시간이 지날 수록 던전의 흐름이 불안정해지는 것이 느껴집니다.. 하루 빨리 데네브님을 구출하고 던전 포탈을 닫아야만 해요. " },
  { actor: "aron", expression: "default", text: " 이번에는 제가 당신과 함께 가겠습니다. 잘 부탁합니다, (플레이어 이름). " },
]);
NPC_STORY_SEQUENCES["npc-theo-floor-4-quest-complete"] = chapter2DialogueSequence("npc-theo-floor-4-quest-complete", [
  { actor: "theo", expression: "default", text: "오셨군요. 별 문제는 없었습니까? " },
  { actor: "theo", expression: "default", text: " 데네브님의 목소리가 더욱 선명하게 들렸다고요? " },
  { actor: "theo", expression: "default", text: " 데네브님과 가까워지고 있다는 뜻이군요! 하루 빨리 데네브님을 구출해야겠습니다. " },
  { actor: "theo", expression: "default", text: " 카프님과 루나에게는 제가 알릴테니, 당신은 조금 휴식하고 계십시오. 얼마 안 가 다음 층으로 들어가야 할테니까요. " },
]);

NPC_STORY_SEQUENCES["npc-luna-floor-4-quest-complete"] = {
  id: "npc-luna-floor-4-quest-complete",
  title: "던전 4층 조사 완료",
  replayable: false,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    luna: actor("luna", "happy"),
    theo: actor("theo", "default"),
    kaiden: actor("kaiden", "serious"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{
    id: "npc-luna-floor-4-quest-complete-scene",
    steps: [
      ...singleSpeakerDialogue("luna-1", "luna", "happy", "어라, 그 사람은..?"),
      ...singleSpeakerDialogue("theo-1", "theo", "default", "던전 안에 사람이 있었습니까..?"),
      ...singleSpeakerDialogue("luna-2", "luna", "happy", "틀림 없어. 수상한 냄새. 내가 말했던 수상한 것이 바로 이 사람이구나!"),
      ...singleSpeakerDialogue("theo-2", "theo", "default", "3층에서 발견된 천조각은 이 분의 것이었나 보군요."),
      ...singleSpeakerDialogue("kaiden-1", "kaiden", "serious", "당신, 이름이 뭐지?"),
      ...singleSpeakerDialogue("jeon-1", "jeon", "default", "사실.. 기억이 온전치 않습니다. 기억하는 것은 오로지 '전'이라는 이름뿐이지요."),
      ...singleSpeakerDialogue("luna-3", "luna", "happy", "전..? 전이라고? 사람 이름이 전?"),
      ...singleSpeakerDialogue("theo-3", "theo", "default", "루나. 그만하십시오. 이름으로 놀리는 것은 굉장히 실례되는 일입니다."),
      ...singleSpeakerDialogue("luna-4", "luna", "happy", "앗... 미안해요, 아저씨."),
      ...singleSpeakerDialogue("jeon-2", "jeon", "default", "괜찮습니다. 저도 제 이름 같지 않은걸요."),
      ...singleSpeakerDialogue("kaiden-2", "kaiden", "serious", "전. 당신이 누구인지는 모르겠으나 우선 이 베이스캠프에서 지내도록. 던전은 위험하니 우리와 함께하는 것이 좋을 테지."),
      ...singleSpeakerDialogue("luna-5", "luna", "happy", "헤헤. 잘 부탁해요, 아저씨."),
      ...singleSpeakerDialogue("theo-4", "theo", "default", "잘 부탁드립니다. 이 던전을 함께 탈출합시다."),
      ...singleSpeakerDialogue("jeon-3", "jeon", "default", "예. 감사합니다. 잘 부탁드립니다."),
    ],
  }],
};

NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-available"] = {
  id: "npc-theo-floor-5-quest-available", title: "던전 5층 의뢰", replayable: true, skippable: false,
  onCompleteScreen: "baseCamp", backgrounds: {},
  actors: { theo: actor("theo", "default"), kaiden: actor("kaiden", "serious"), jeon: actor("jeon", "default") },
  scenes: [{ id: "npc-theo-floor-5-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor5-theo-1", "theo", "default", "어서오십시오, {{playerName}}."),
    ...floor5QuestDialogue("floor5-theo-2", "theo", "default", "이제 던전 5층으로 향할 차례이지요."),
    ...floor5QuestDialogue("floor5-theo-3", "theo", "default", "루나가 먼저 정찰을 다녀왔는데, 입구에서는 어떤 수상한 것도 발견하지 못했다고 합니다."),
    ...floor5QuestDialogue("floor5-theo-4", "theo", "default", "즉.. 아무런 정보가 없는 셈이지요."),
    ...floor5QuestDialogue("floor5-kaiden-1", "kaiden", "serious", "그래. 그래서 이번에는 아무래도 다 같이 들어가는 게 좋을 것 같다."),
    ...floor5QuestDialogue("floor5-kaiden-2", "kaiden", "serious", "안에 어떤 단서가 있을지 모르니 위험하더라도 같이 움직이는 것이 파악하기에 수월할테니.."),
    ...floor5QuestDialogue("floor5-jeon-1", "jeon", "default", "도움이 될지는 모르겠으나, 저 또한 힘내겠습니다."),
  ] }],
};
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-accepted"] = sequence("npc-theo-floor-5-quest-accepted", "theo", "default", ["{{playerName}}, 준비를 마치고 함께 5층으로 들어갑시다."]);
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-active"] = sequence("npc-theo-floor-5-quest-active", "theo", "default", ["준비가 되면 함께 던전 5층으로 들어갑시다."]);
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-active"].scenes[0].steps.push({
  id: "npc-theo-floor-5-quest-active-choice",
  type: "choice",
  prompt: "무엇을 하시겠습니까?",
  advanceMode: "click",
  options: [
    { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
    { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
  ],
});
NPC_STORY_SEQUENCES["npc-theo-floor-5-quest-complete"] = sequence("npc-theo-floor-5-quest-complete", "theo", "default", ["{{playerName}}, 수고하셨습니다. 이제 다음 계획을 세우지요."]);

NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-available"] = {
  id: "npc-kaiden-floor-6-quest-available", title: "던전 6층 의뢰", replayable: true, skippable: false,
  onCompleteScreen: "baseCamp", backgrounds: {},
  actors: { kaiden: actor("kaiden", "serious"), luna: actor("luna", "happy"), theo: actor("theo", "default"), jeon: actor("jeon", "default") },
  scenes: [{ id: "npc-kaiden-floor-6-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor6-kaiden-1", "kaiden", "serious", "{{playerName}}, 고생이 많군. 이제 6층을 탐색할 차례이지?"),
    ...floor5QuestDialogue("floor6-kaiden-2", "kaiden", "serious", "이번에도 먼저 루나가 다녀왔는데.. 아무래도 던전 6층에는 유령이 있는 것 같다고 하더군."),
    ...floor5QuestDialogue("floor6-luna-1", "luna", "happy", "안녕~ {{playerName}}. 대장, 말하는 중에 끼어들어서 미안해. 직접 설명하는게 좋을 것 같아서."),
    ...floor5QuestDialogue("floor6-kaiden-3", "kaiden", "serious", "상관 없다. 자세히 설명해 봐."),
    ...floor5QuestDialogue("floor6-luna-2", "luna", "happy", "그러니까.. 내가 정찰로 던전 6층 입구를 먼저 열어봤는데, 열자마자 어떤 목소리가 들려왔어."),
    ...floor5QuestDialogue("floor6-luna-3", "luna", "happy", "모습은 보이지 않아서 누구인지는 잘 모르겠는데... 어쨌든 간절한 목소리였어."),
    ...floor5QuestDialogue("floor6-luna-4", "luna", "happy", "마치.. 나에게 뭔가를 부탁하는 것처럼."),
    ...floor5QuestDialogue("floor6-theo-1", "theo", "default", "그 부탁을 들어줘야 다음 층으로 보내줄 것 같다는 뜻입니까?"),
    ...floor5QuestDialogue("floor6-luna-5", "luna", "happy", "정확해.... 그런데 아무래도 {{playerName}} 혼자서는 힘들 수도 있겠다는 생각이 들어서."),
    ...floor5QuestDialogue("floor6-kaiden-4", "kaiden", "serious", "...그럼 '전'과 함께 가는 게 좋겠군."),
    ...floor5QuestDialogue("floor6-kaiden-5", "kaiden", "serious", "5층에서 보여준 전의 능력을 보면, 이번에도 전이 큰 역할을 해 줄지도 모른다."),
    ...floor5QuestDialogue("floor6-kaiden-6", "kaiden", "serious", "어떻게 생각하지?"),
  ] }],
};
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-accepted"] = sequence("npc-kaiden-floor-6-quest-accepted", "jeon", "default", ["잘 부탁드립니다, {{playerName}}."]);
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-active"] = sequence("npc-kaiden-floor-6-quest-active", "kaiden", "serious", ["전과 함께 던전 6층의 목소리를 조사하도록."]);
NPC_STORY_SEQUENCES["npc-kaiden-floor-6-quest-complete"] = sequence("npc-kaiden-floor-6-quest-complete", "kaiden", "serious", [
  "왔는가. 다음 층의 입구가 열렸다는 것은 알고 있네.",
  "그래, 발해 유민들의 정체성을 찾아주었다고..",
  "수고했다. 둘이서 대단한 일을 해냈군.",
  "이제 다음 계획을 세우지.",
]);

NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-available"] = {
  id: "npc-theo-floor-7-quest-available",
  title: "던전 7층 의뢰",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    theo: actor("theo", "default"),
    kaiden: actor("kaiden", "serious"),
    luna: actor("luna", "happy"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{ id: "npc-theo-floor-7-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor7-theo-1", "theo", "default", "(플레이어 이름), 어서 오십시오."),
    ...floor5QuestDialogue("floor7-theo-2", "theo", "default", "전과 당신이 노력해주신 덕분에, 다음 층이 열렸지요. 정말 감사합니다."),
    ...floor5QuestDialogue("floor7-theo-3", "theo", "default", "이번에도 루나가 먼저 다녀왔습니다만.. 우선 이 사진을 함께 보시지요."),
    { id: "floor7-broken-door-in", type: "illustOverlay", imageUrl: `${import.meta.env.BASE_URL}assets/dungeon7/broken-door.png`, visible: true, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "floor7-broken-door-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
    ...floor5QuestDialogue("floor7-theo-4", "theo", "default", "이 문이 다음 층으로 가는 입구를 가로막고 있었다고 합니다."),
    ...floor5QuestDialogue("floor7-theo-5", "theo", "default", "문에는 이렇게 적혀있습니다."),
    ...floor5QuestDialogue("floor7-theo-6", "theo", "default", "...을 한데 모아 고려의 기둥을 바로 세워라.").map((step) => step.type === "dialogue" ? { ...step, emphasis: "info" as const } : step),
    ...floor5QuestDialogue("floor7-theo-7", "theo", "default", "문제는 무엇을 한데 모으라는 것인지 나와 있지 않는다는 것입니다."),
    ...floor5QuestDialogue("floor7-kaiden-1", "kaiden", "serious", "아마도 호족과 관련 있을 것이다."),
    ...floor5QuestDialogue("floor7-theo-8", "theo", "default", "...! 그렇군요."),
    ...floor5QuestDialogue("floor7-theo-9", "theo", "default", "고려 건국에서 호족이 빠질 수는 없으니까요."),
    ...floor5QuestDialogue("floor7-theo-10", "theo", "default", "고려 건국 이후에도 호족을 포섭하려 노력했었고요."),
    { id: "floor7-broken-door-out", type: "illustOverlay", visible: false, fadeMs: 350, hideDialogue: true, waitForFade: true, advanceMode: "auto" },
    { id: "floor7-broken-door-out-pause", type: "wait", durationMs: 1500, advanceMode: "auto" },
    ...floor5QuestDialogue("floor7-luna-1", "luna", "happy", "그렇다면 모으라는 것은 호족의 증표 같은 것이겠네!"),
    ...floor5QuestDialogue("floor7-theo-11", "theo", "default", "분명 그럴 것입니다."),
    ...floor5QuestDialogue("floor7-theo-12", "theo", "default", "(플레이어 이름), 이번에도 부탁드려도 괜찮겠습니까?"),
    ...floor5QuestDialogue("floor7-jeon-1", "jeon", "default", "잠깐... 이번에도 저를 데려가 주십시오!... <red><b>윽!</b></red>"),
    ...floor5QuestDialogue("floor7-theo-13", "theo", "default", "전?! 무슨 일입니까?"),
    ...floor5QuestDialogue("floor7-jeon-2", "jeon", "default", "갑작스럽게 죄송합니다..사실 아까부터 가벼운 두통이 있어서요...별일 아닙니다."),
    ...floor5QuestDialogue("floor7-luna-2", "luna", "happy", "두통이요? 전 아저씨, 아플 땐 쉬어야 해요. 무리하지 말고요!"),
    ...floor5QuestDialogue("floor7-theo-14", "theo", "default", "루나 말이 맞습니다."),
    ...floor5QuestDialogue("floor7-jeon-3", "jeon", "default", "하지만...여러분의 도움만 받기는..."),
    ...floor5QuestDialogue("floor7-kaiden-2", "kaiden", "serious", "..그렇게 하지. 전도 데려가도록 해."),
    ...floor5QuestDialogue("floor7-kaiden-3", "kaiden", "serious", "6층에서도 전이 옛 문서를 해석해준 덕분에 쉽게 문을 열 수 있지 않았나. 이번에도 도움이 될 지도 모르니."),
    ...floor5QuestDialogue("floor7-theo-15", "theo", "default", "대장..."),
    ...floor5QuestDialogue("floor7-theo-16", "theo", "default", "알겠습니다. (플레이어 이름), 부탁드려도 괜찮겠습니까?"),
  ] }],
};
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-accepted"] = sequence("npc-theo-floor-7-quest-accepted", "theo", "default", [
  "이번에도 기다리고 있겠습니다. 부디 무리는 하지 마시길.",
]);
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-active"] = sequence("npc-theo-floor-7-quest-active", "theo", "default", [
  "전과 함께 던전 7층에서 호족의 증표를 찾아주십시오.",
]);
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-active"].scenes[0].steps.push({
  id: "npc-theo-floor-7-quest-active-choice",
  type: "choice",
  prompt: "무엇을 하시겠습니까?",
  advanceMode: "click",
  options: [
    { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
    { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
  ],
});
NPC_STORY_SEQUENCES["npc-theo-floor-7-quest-complete"] = {
  id: "npc-theo-floor-7-quest-complete",
  title: "던전 7층 조사 완료",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: { theo: actor("theo", "default"), luna: actor("luna", "happy") },
  scenes: [{ id: "npc-theo-floor-7-quest-complete-scene", steps: [
    ...floor5QuestDialogue("floor7-complete-theo-1", "theo", "default", "아, (플레이어 이름), 어서 오십시오."),
    ...floor5QuestDialogue("floor7-complete-theo-2", "theo", "default", "...전?! 대체 무슨 일이 있었던 겁니까?!"),
    ...floor5QuestDialogue("floor7-complete-theo-3", "theo", "default", "그런... 문이 열리자마자 갑자기 쓰러졌다고요."),
    ...floor5QuestDialogue("floor7-complete-theo-4", "theo", "default", "루나, 응급처치를 부탁합니다."),
    ...floor5QuestDialogue("floor7-complete-luna-1", "luna", "happy", "맡겨줘!"),
    ...floor5QuestDialogue("floor7-complete-theo-5", "theo", "default", "후...루나 덕분에 한시름 덜었군요."),
    ...floor5QuestDialogue("floor7-complete-theo-6", "theo", "default", "수고하셨습니다, (플레이어 이름). 덕분에 다음 층이 열렸습니다. 이제 다음 계획을 세우도록 하지요."),
  ] }],
};

NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-available"] = {
  id: "npc-kaiden-floor-8-quest-available",
  title: "던전 8층 의뢰",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    kaiden: actor("kaiden", "serious"),
    luna: actor("luna", "happy"),
    theo: actor("theo", "default"),
    jeon: actor("jeon", "default"),
  },
  scenes: [{ id: "npc-kaiden-floor-8-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor8-kaiden-1", "kaiden", "serious", " 왔군, (플레이어 이름). "),
    ...floor5QuestDialogue("floor8-kaiden-2", "kaiden", "serious", " 다음층으로 갈 계획을 세우고자 루나가 정찰을 갔다 왔다고 한다.. 그런데. "),
    ...floor5QuestDialogue("floor8-luna-1", "luna", "happy", " 헤헤..이번에도 아무런 낌새를 발견하지 못했어. "),
    ...floor5QuestDialogue("floor8-kaiden-3", "kaiden", "serious", " 아무래도 던전 안쪽에서 직접 단서를 찾아야 할것 같다. "),
    ...floor5QuestDialogue("floor8-kaiden-4", "kaiden", "serious", " 지난번에 그랬던것처럼, 이번에도 우리 모두 함께 던전에 들어간다는 뜻이지. "),
    ...floor5QuestDialogue("floor8-theo-1", "theo", "default", " 전은 제외입니다. 전은 부상자이니, 베이스캠프에서 휴식하도록 하죠. "),
    ...floor5QuestDialogue("floor8-jeon-1", "jeon", "default", " 도움이 되지 못해 죄송합니다.. "),
    ...floor5QuestDialogue("floor8-luna-2", "luna", "happy", " 그런 말 마요. 지금까지 전 아저씨의 활약이 엄청났는걸요! 이번엔 저희도 좀 활약하게 해 주세요! "),
    ...floor5QuestDialogue("floor8-jeon-2", "jeon", "default", " 하하.. 믿고 맡기겠습니다. "),
    ...floor5QuestDialogue("floor8-kaiden-5", "kaiden", "serious", " 준비가 되었다면 바로 출발하지. "),
  ] }],
};
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-accepted"] = sequence(
  "npc-kaiden-floor-8-quest-accepted",
  "kaiden",
  "serious",
  [" 우리는 단서를 찾을테니, 늘 그렇듯 전투를 잘 부탁하겠다. (플레이어 이름). "],
);
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-active"] = sequence(
  "npc-kaiden-floor-8-quest-active",
  "kaiden",
  "serious",
  ["동료들과 함께 던전 8층 안쪽에서 단서를 찾도록."],
);
NPC_STORY_SEQUENCES["npc-kaiden-floor-8-quest-complete"] = sequence(
  "npc-kaiden-floor-8-quest-complete",
  "kaiden",
  "serious",
  [
    " (플레이어 이름), 이번에도 수고했다. ",
    " 전이 사라지니 테오도 루나도 조금 우울해보이지만, 그들도 조금 있으면 잘 이겨내겠지. ",
    " 조금 휴식한 뒤 출발하는 것이 좋겠군. ",
  ],
);

NPC_STORY_SEQUENCES["npc-luna-floor-9-quest-available"] = {
  id: "npc-luna-floor-9-quest-available",
  title: "던전 9층 의뢰",
  replayable: true,
  skippable: false,
  onCompleteScreen: "baseCamp",
  backgrounds: {},
  actors: {
    luna: actor("luna", "happy"),
    theo: actor("theo", "default"),
    kaiden: actor("kaiden", "serious"),
  },
  scenes: [{ id: "npc-luna-floor-9-quest-available-scene", steps: [
    ...floor5QuestDialogue("floor9-luna-1", "luna", "happy", " (플레이어 이름), 왔구나.. "),
    ...floor5QuestDialogue("floor9-luna-2", "luna", "happy", " 하하.. 얼른 기운 차려야 하는데, 그렇지? 그동안 공민왕 아저씨랑 생각보다 큰 정이 들었나봐.. "),
    ...floor5QuestDialogue("floor9-luna-3", "luna", "happy", " 공민왕 아저씨가 열어준 문이니까, 어서 나아가야지! 휴, 나도 어서 힘낼게! "),
    ...floor5QuestDialogue("floor9-luna-4", "luna", "happy", " 열린 문 너머를 먼저 탐색해보고 왔어. 10층으로 통하는 문이 있었는데, 거기에서 이상한 기운이 새어 나오고 있었지. "),
    ...floor5QuestDialogue("floor9-luna-5", "luna", "happy", " 아마도.. 10층, 그곳에 이 던전이 생긴 원인이 있을 것 같아."),
    ...floor5QuestDialogue("floor9-theo-1", "theo", "default", "그리고 그 10층으로 가는 문을 열려면 무엇인가 필요한 것이겠죠? "),
    ...floor5QuestDialogue("floor9-luna-6", "luna", "happy", " 응. 정확해. "),
    ...floor5QuestDialogue("floor9-luna-7", "luna", "happy", " 9층에는 고려시대 문화를 나타내는 증거들이 곳곳에 떨어져있을 거야. "),
    ...floor5QuestDialogue("floor9-luna-8", "luna", "happy", " 그것을 모아서, 9층 앞의 제단에 올려놓아야 해."),
    ...floor5QuestDialogue("floor9-kaiden-1", "kaiden", "serious", " 들었지, (플레이어이름). 이번에도 전투는 너에게 맡기겠다. "),
  ] }],
};
NPC_STORY_SEQUENCES["npc-luna-floor-9-quest-accepted"] = sequence(
  "npc-luna-floor-9-quest-accepted",
  "luna",
  "happy",
  [" 이제 거의 마지막이네.. 부탁할게, (플레이어 이름)."],
);
NPC_STORY_SEQUENCES["npc-luna-floor-9-quest-active"] = sequence(
  "npc-luna-floor-9-quest-active",
  "luna",
  "happy",
  ["9층에서 고려시대의 사회와 문화를 나타내는 증거를 모아 제단에 올려놓자."],
);
NPC_STORY_SEQUENCES["npc-luna-floor-9-quest-complete"] = sequence(
  "npc-luna-floor-9-quest-complete",
  "luna",
  "happy",
  [
    " 윽, (플레이어 이름), 봤어? 10층 문 안에 있는 그거? ",
    " 완전 괴물의 모습이었어.. 아무래도 그게 이 포탈이 열린 이유겠지. ",
    " 그 괴물을 쓰러뜨려야만 한다니.. 무섭지만 같이 힘내자. ",
  ],
);

const theo = NPC_STORY_SEQUENCES["npc-theo-default"];
theo.scenes[0].steps.push(
  {
    id: "npc-theo-default-choice",
    type: "choice",
    prompt: "무엇을 하시겠습니까?",
    advanceMode: "click",
    options: [
      { id: "buy-items", label: "아이템 사기", actionId: "open-theo-shop", closeStory: true },
      { id: "end-dialogue", label: "대화 끝내기", closeStory: true },
    ],
  },
);
