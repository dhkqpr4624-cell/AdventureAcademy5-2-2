import { useEffect, useRef, useState } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import { playRandomizedOneShot } from "../game/audioOneShot";
import { createChapter2Actor } from "../data/stories/chapter2Portraits";
import type { StorySequence, StoryStep } from "../types/story";
import lunaStanding from "../assets/story/npcs/chapter2/luna/standing_R.png";
import theoStanding from "../assets/story/npcs/chapter2/theo/standing_R.png";
import kappStanding from "../assets/story/npcs/chapter2/kapp/standing_R.png";
import aronStanding from "../assets/story/npcs/chapter2/aron/standing_R.png";

const base = `${import.meta.env.BASE_URL}assets/dungeon7/`;
const hitSfx = `${import.meta.env.BASE_URL}assets/audio/hit-sfx.mp3`;
export const DUNGEON7_PRISON_PARTY_LAYOUT = {
  displayScale: 0.5,
  groundBottomPercent: 13,
  initialLeftPercent: [8, 13, 18, 23],
  relocatedLeftPercent: [39, 44, 49, 54],
} as const;
export type Dungeon7RescuePhase = "arrival" | "party" | "left" | "pan" | "center" | "hits" | "black" | "fallen";
export function getDungeon7PartyVisibility(phase: Dungeon7RescuePhase) {
  return {
    initial: phase === "arrival" || phase === "party" || phase === "left" || phase === "pan",
    relocated: phase === "center" || phase === "hits",
  };
}
const partyStanding = [lunaStanding, theoStanding, kappStanding, aronStanding] as const;
const actors = {
  luna: createChapter2Actor("luna", "루나", "정찰 담당", "#ff8b72"), theo: createChapter2Actor("theo", "테오", "보급 담당", "#7fc8ff"), aron: createChapter2Actor("aron", "아론", "지휘관", "#d9b6ff"), kapp: createChapter2Actor("kapp", "카프", "부지휘관", "#ffcf80"), deneb: createChapter2Actor("deneb", "데네브", "잊혀진 지휘관", "#bfe7ff"),
};
type ActorId = keyof typeof actors;
const d = (id: string, actor: ActorId, text: string, expression = "default"): StoryStep => ({ id, type: "dialogue", speakerId: actor, speakerName: actors[actor].name, activeActorId: actor, expression, text, advanceMode: "click" });
const n = (id: string, text: string): StoryStep => ({ id, type: "narration", text, advanceMode: "click" });
const sequence = (id: string, steps: StoryStep[]): StorySequence => ({ id, title: "데네브 구출", replayable: false, skippable: false, onCompleteScreen: "baseCamp", backgrounds: {}, actors, scenes: [{ id: `${id}-scene`, steps }] });
const LEFT = sequence("d7-rescue-left", [d("r1", "aron", "여긴..!", "angry"), d("r2", "aron", "모두, 문제 없으십니까!", "angry"), d("r3", "theo", "괜찮습니다!"), d("r4", "theo", "윽, 심한 악취로군요."), { id: "r-exclamation", type: "wait", durationMs: 1715, advanceMode: "auto" }, d("r5", "luna", "잠깐, 다들 저기 좀 봐요!", "shout")]);
const CENTER = sequence("d7-rescue-center", [
  d("r6", "kapp", "데네브..!!", "sad"), d("r7", "theo", "이 쇠사슬은...?!", "angry"), d("r8", "luna", "데네브님의 생명력이 이 던전에 묶여있다는 거지!", "angry"), d("r9", "luna", "그마저도 독기에 심하게 오염되어 있어! 어서 끊어내야 해!", "angry"), d("r10", "aron", "혹시 모르니 모두 전투 태세를 갖추도록 하십시오!", "angry"), d("r11", "aron", "다같이 쇠사슬을 끊어내겠습니다!", "angry"), d("r12", "deneb", "....", "hurt"), d("r13", "deneb", "....카프, 아론...?", "hurt"), d("r14", "deneb", "(플레이어 이름)...", "hurt"), d("r15", "theo", "데네브님?! 정신이 드십니까?!", "surprised"), d("r16", "aron", "데네브님! 조금만 더 기다리십시오, 지금 바로 사슬을..!", "angry"), d("r17", "deneb", "안 됩니다..!", "hurt"), d("r18", "deneb", "쇠사슬을 끊어내면, 간신히 억누르고 있던 던전의 침식이 폭주할 거예요.", "hurt"), d("r19", "deneb", "그러면 여러분들이...", "hurt"), d("r20", "deneb", "그리고 현실세계의 모두가 위험해집니다!", "hurt"), d("r21", "kapp", "그 정도는 우리도 알아요!", "sad"), d("r22", "kapp", "데네브, 우리는 이제 준비가 되었어요! 테오와 루나, 그리고 (플레이어 이름)까지 함께인걸요!", "sad"), d("r23", "kapp", "다 함께라면 할 수 있어요!", "sad"), d("r24", "kapp", "데네브, 더 이상 당신을 혼자 두지 않아!", "sad"), d("r25", "theo", "지금입니다, (플레이어 이름)! 쇠사슬을 끊어내세요!", "angry"),
]);
const HIT_ONE = sequence("d7-rescue-hit-one", [d("r26", "luna", "아직이야, (플레이어 이름)! 한 번 더!", "shout")]);
const HIT_TWO = sequence("d7-rescue-hit-two", [d("r27", "aron", "거의 다 되었습니다! 모두, 힘을 내십시오!", "angry")]);
const FALLEN = sequence("d7-rescue-fallen", [n("r28", "쇠사슬에서 해방된 데네브는 그 자리에서 쓰러졌다."), d("r29", "theo", "데네브님의 상태는..?!", "surprised"), d("r30", "kapp", "...!", "serious"), d("r31", "kapp", "다행이예요. 잠시 기절했을 뿐이예요.", "serious"), d("r32", "luna", "정말 다행이야..!", "sad"), { id: "fallen-shake", type: "shake", durationMs: 2000, amplitude: 15, hideDialogue: true, advanceMode: "auto" }, d("r33", "aron", "...!", "angry"), d("r34", "aron", "데네브님 말씀대로군요. 던전의 균열이 급격하게 심해지고 있습니다.", "angry"), d("r35", "aron", "어서 베이스캠프로 돌아가죠! 출구가 막히기 전에!", "angry")]);

type Props = { playerName: string; onComplete: () => void };
export function Dungeon7RescueStory({ playerName, onComplete }: Props) {
  const [phase, setPhase] = useState<Dungeon7RescuePhase>("arrival");
  const [hitStep, setHitStep] = useState(0); const done = useRef(false); const strikeBusy = useRef(false); const timers = useRef<number[]>([]);
  const finish = () => { if (done.current) return; done.current = true; timers.current.forEach(clearTimeout); onComplete(); };
  useEffect(() => { timers.current.push(window.setTimeout(() => setPhase("party"), 2000)); timers.current.push(window.setTimeout(() => setPhase("left"), 4500)); return () => timers.current.forEach(clearTimeout); }, []);
  const completeLeft = () => { setPhase("pan"); timers.current.push(window.setTimeout(() => setPhase("center"), 3800)); };
  const strike = () => {
    if (strikeBusy.current || (hitStep !== 0 && hitStep !== 2 && hitStep !== 4)) return;
    strikeBusy.current = true;
    playRandomizedOneShot(hitSfx);
    if (hitStep < 4) setHitStep(hitStep + 1);
    else {
      setHitStep(5);
      timers.current.push(window.setTimeout(() => {
        setPhase("black");
        timers.current.push(window.setTimeout(() => setPhase("fallen"), 900));
      }, 400));
    }
  };
  const partyVisibility = getDungeon7PartyVisibility(phase);
  return <div className={`dungeon7-rescue phase-${phase} ${phase === "pan" || phase === "center" || phase === "hits" ? "is-centered" : ""}`}>
    <div className="dungeon7-prison-camera"><div className="dungeon7-prison-map">
      <img className="d7-layer d7-background" src={`${base}prison-background.png`} alt="" /><img className="d7-layer d7-foreground" src={`${base}prison-foreground.png`} alt="" /><img key={hitStep} className={`d7-layer d7-captive ${hitStep === 1 || hitStep === 3 || hitStep === 5 ? "is-hit" : ""}`} src={`${base}captive-deneb.png`} alt="붙잡힌 데네브" />
      {partyVisibility.initial && <div className="d7-party d7-party-initial">{partyStanding.map((src, i) => <div className="d7-party-member" style={{ left: `${DUNGEON7_PRISON_PARTY_LAYOUT.initialLeftPercent[i]}%` }} key={src}><img src={src} alt="" />{i === 0 && phase === "left" && <span className="d7-exclamation" style={{ backgroundImage: `url(${import.meta.env.BASE_URL}assets/story/chapter2/intro/exclamation-sheet.png)` }} />}</div>)}</div>}
      {partyVisibility.relocated && <div className="d7-party d7-party-relocated">{partyStanding.map((src, i) => <div className="d7-party-member" style={{ left: `${DUNGEON7_PRISON_PARTY_LAYOUT.relocatedLeftPercent[i]}%` }} key={src}><img src={src} alt="" /></div>)}</div>}
      <img className="d7-layer d7-ground" src={`${base}prison-ground.png`} alt="" />
    </div></div>
    <button className="story-skip-button" onClick={finish}>건너뛰기</button>
    {phase === "left" && <StoryPlayer sequence={LEFT} playerName={playerName} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={completeLeft} />}
    {phase === "center" && <StoryPlayer sequence={CENTER} playerName={playerName} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={() => setPhase("hits")} />}
    {phase === "hits" && (hitStep === 0 || hitStep === 2 || hitStep === 4) && <div className="d7-chain-choice"><button onClick={strike}>{hitStep === 0 ? "쇠사슬을 내리친다." : hitStep === 2 ? "쇠사슬을 내리친다!" : "쇠사슬을 강하게 내리친다!!"}</button></div>}
    {phase === "hits" && hitStep === 1 && <StoryPlayer sequence={HIT_ONE} playerName={playerName} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={() => { strikeBusy.current = false; setHitStep(2); }} />}
    {phase === "hits" && hitStep === 3 && <StoryPlayer sequence={HIT_TWO} playerName={playerName} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={() => { strikeBusy.current = false; setHitStep(4); }} />}
    {(phase === "black" || phase === "fallen") && <div className="d7-black"><img className={phase === "fallen" ? "is-visible" : ""} src={`${base}fallen-deneb-illustration.png`} alt="쓰러진 데네브" /></div>}
    {phase === "fallen" && <StoryPlayer sequence={FALLEN} playerName={playerName} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={finish} />}
  </div>;
}
