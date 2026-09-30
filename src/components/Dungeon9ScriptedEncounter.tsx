import { useEffect, useRef, useState } from "react";
import { CombatDialoguePanel } from "./combat/CombatDialoguePanel";
import { StoryPlayer } from "../game/story/StoryPlayer";
import type { PlayerState } from "../game/player/playerState";
import { PlayerStatusBar } from "./PlayerStatusBar";
import { DUNGEON9_BLESSING_STORY, DUNGEON9_FINAL_STORY, DUNGEON9_POST_COMBAT_STORY } from "../data/stories/dungeon9Stories";

export const DUNGEON9_SCRIPTED_ATTACK_DAMAGE = 100;
export const DUNGEON9_SCRIPTED_SHAKE_MS = 2000;
export const DUNGEON9_MONSTER_APPEAR_DELAY_MS = 1000;
export type Dungeon9EncounterPhase = "story" | "transition" | "appearance" | "enemyTurn" | "enemyAttacking" | "attackResult" | "darkness" | "blessing" | "healing" | "command" | "striking" | "postStory";

export function resolveDungeon9ScriptedKnockout(player: PlayerState): PlayerState { return { ...player, currentHp: 0 }; }
export function resolveDungeon9BlessingHeal(player: PlayerState): PlayerState { return { ...player, currentHp: player.maxHp }; }
export function getDungeon9ScriptedCommands(phase: Dungeon9EncounterPhase): readonly string[] { return phase === "command" ? ["공격한다"] : []; }

type Props = {
  playerName: string;
  playerState: PlayerState;
  prepareMonster: () => Promise<void>;
  revealMonster: () => Promise<void>;
  playEnemyAttack: () => Promise<void>;
  playPlayerStrike: () => Promise<void>;
  playFullHeal: () => void;
  hideMonster: () => void;
  onComplete: () => void;
};

export function Dungeon9ScriptedEncounter({ playerName, playerState, prepareMonster, revealMonster, playEnemyAttack, playPlayerStrike, playFullHeal, hideMonster, onComplete }: Props) {
  const [phase, setPhase] = useState<Dungeon9EncounterPhase>("story");
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const actionLockedRef = useRef(false);
  const mountedRef = useRef(true);
  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((entry) => entry !== timer);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.push(timer);
  };
  const clearTimers = () => { timersRef.current.forEach(window.clearTimeout); timersRef.current = []; };
  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    hideMonster();
    onComplete();
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearTimers();
      hideMonster();
    };
  }, []);

  const finishOpeningStory = async () => {
    if (actionLockedRef.current) return;
    actionLockedRef.current = true;
    setPhase("transition");
    await prepareMonster();
    if (!mountedRef.current) return;
    later(() => {
      void (async () => {
        await revealMonster();
        if (!mountedRef.current) return;
        setPhase("appearance");
        actionLockedRef.current = false;
      })();
    }, DUNGEON9_MONSTER_APPEAR_DELAY_MS);
  };

  const advanceMessage = async () => {
    if (actionLockedRef.current) return;
    if (phase === "appearance") { setPhase("enemyTurn"); return; }
    if (phase === "enemyTurn") {
      actionLockedRef.current = true;
      setPhase("enemyAttacking");
      await playEnemyAttack();
      if (!mountedRef.current) return;
      setPhase("attackResult");
      actionLockedRef.current = false;
      return;
    }
    if (phase === "attackResult") { setPhase("darkness"); return; }
    if (phase === "darkness") { hideMonster(); setPhase("blessing"); }
  };

  const completeBlessing = () => {
    if (actionLockedRef.current) return;
    actionLockedRef.current = true;
    void revealMonster();
    setPhase("healing");
    playFullHeal();
    later(() => { setPhase("command"); actionLockedRef.current = false; }, 1000);
  };

  const attack = async () => {
    if (phase !== "command" || actionLockedRef.current) return;
    actionLockedRef.current = true;
    setPhase("striking");
    await playPlayerStrike();
    if (!mountedRef.current) return;
    setPhase("postStory");
    actionLockedRef.current = false;
  };

  const statusBar = <PlayerStatusBar {...playerState} />;
  const message = phase === "appearance" ? "균열 침식 대한제국 시민이 나타났다!" : phase === "enemyTurn" ? "균열 침식 대한제국 시민의 턴!" : phase === "attackResult" ? `${DUNGEON9_SCRIPTED_ATTACK_DAMAGE}의 피해를 입었다.` : phase === "darkness" ? "눈 앞이 깜깜해진다..." : "";

  return <div className={`dungeon9-scripted-encounter phase-${phase}`}>
    {phase === "story" && <StoryPlayer sequence={DUNGEON9_FINAL_STORY} playerName={playerName} playerStatus={playerState} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={() => void finishOpeningStory()} />}
    {phase === "appearance" || phase === "enemyTurn" || phase === "attackResult" || phase === "darkness" ? <CombatDialoguePanel mode="message" busy={actionLockedRef.current} statusBar={statusBar}>
      <div className="combat-message-layout"><p className="combat-message" role="status">{message}</p><button type="button" className="combat-message-next" onClick={() => void advanceMessage()}>다음</button></div>
    </CombatDialoguePanel> : null}
    {phase === "blessing" && <div className="dungeon9-blessing-overlay"><StoryPlayer sequence={DUNGEON9_BLESSING_STORY} playerName={playerName} playerStatus={playerState} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={completeBlessing} /></div>}
    {phase === "healing" && <div className="d9-scripted-heal" aria-label="HP 완전 회복">HP FULL</div>}
    {phase === "command" && <CombatDialoguePanel mode="command" busy={false} statusBar={statusBar}><div className="combat-message-layout"><p className="combat-message" role="status">무엇을 할까?</p><div className="combat-command-buttons"><button type="button" onClick={() => void attack()}>공격한다</button></div></div></CombatDialoguePanel>}
    {phase === "postStory" && <StoryPlayer sequence={DUNGEON9_POST_COMBAT_STORY} playerName={playerName} playerStatus={playerState} presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={finish} />}
  </div>;
}
