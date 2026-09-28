import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { StoryPlayer } from "../game/story/StoryPlayer";
import { playRandomizedOneShot } from "../game/audioOneShot";
import type { PlayerState } from "../game/player/playerState";
import { PlayerStatusBar } from "./PlayerStatusBar";
import {
  DUNGEON9_BLESSING_STORY,
  DUNGEON9_FINAL_STORY,
  DUNGEON9_POST_COMBAT_STORY,
} from "../data/stories/dungeon9Stories";

const base = `${import.meta.env.BASE_URL}assets/dungeon9/`;
const hitSfx = `${import.meta.env.BASE_URL}assets/audio/hit-sfx.mp3`;
const healSfx = `${import.meta.env.BASE_URL}assets/audio/heal-sfx.mp3`;

export const DUNGEON9_SCRIPTED_ATTACK_DAMAGE = 100;
export const DUNGEON9_SCRIPTED_SHAKE_MS = 2000;
export type Dungeon9EncounterPhase = "story" | "appearance" | "enemyAttack" | "blessing" | "healing" | "command" | "striking" | "defeated" | "postStory";

export function resolveDungeon9ScriptedKnockout(player: PlayerState): PlayerState {
  return { ...player, currentHp: 0 };
}
export function resolveDungeon9BlessingHeal(player: PlayerState): PlayerState {
  return { ...player, currentHp: player.maxHp };
}
export function getDungeon9ScriptedCommands(phase: Dungeon9EncounterPhase): readonly string[] {
  return phase === "command" ? ["공격한다"] : [];
}

type Props = {
  playerName: string;
  playerState: PlayerState;
  setPlayerState: Dispatch<SetStateAction<PlayerState>>;
  onComplete: () => void;
};

export function Dungeon9ScriptedEncounter({ playerName, playerState, setPlayerState, onComplete }: Props) {
  const [phase, setPhase] = useState<Dungeon9EncounterPhase>("story");
  const [damageVisible, setDamageVisible] = useState(false);
  const timersRef = useRef<number[]>([]);
  const completedRef = useRef(false);
  const commandLockedRef = useRef(false);
  const strikeCompletedRef = useRef(false);
  const mountedRef = useRef(true);
  const later = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((entry) => entry !== timer);
      if (mountedRef.current) callback();
    }, delay);
    timersRef.current.push(timer);
    return timer;
  };
  const clearTimers = () => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  };
  const finish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    clearTimers();
    onComplete();
  };

  useEffect(() => () => {
    mountedRef.current = false;
    clearTimers();
  }, []);

  const runEnemyAttack = () => {
    if (phase !== "appearance") return;
    setPhase("enemyAttack");
    setDamageVisible(true);
    setPlayerState((current) => resolveDungeon9ScriptedKnockout(current));
    later(() => {
      setDamageVisible(false);
      setPhase("blessing");
    }, 900);
  };

  const completeBlessing = () => {
    setPhase("healing");
    playRandomizedOneShot(healSfx);
    setPlayerState((current) => resolveDungeon9BlessingHeal(current));
    later(() => setPhase("command"), 1000);
  };

  const attack = () => {
    if (phase !== "command" || commandLockedRef.current) return;
    commandLockedRef.current = true;
    strikeCompletedRef.current = false;
    setPhase("striking");
    playRandomizedOneShot(hitSfx);
    later(completeStrike, DUNGEON9_SCRIPTED_SHAKE_MS + 180);
  };

  const completeStrike = () => {
    if (strikeCompletedRef.current) return;
    strikeCompletedRef.current = true;
    setPhase("defeated");
    later(() => setPhase("postStory"), 850);
  };

  return <div className={`dungeon9-scripted-encounter phase-${phase}`}>
    {phase === "story" && <StoryPlayer
      sequence={DUNGEON9_FINAL_STORY} playerName={playerName} playerStatus={playerState}
      presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={() => setPhase("appearance")}
    />}
    {phase !== "story" && phase !== "postStory" && <div className="d9-scripted-stage">
      <PlayerStatusBar {...playerState} />
      <img
        className={`d9-scripted-monster ${phase === "striking" ? "is-hit" : ""} ${phase === "defeated" ? "is-defeated" : ""}`}
        src={`${base}corrupted-korean-empire-citizen.png`} alt="균열 침식 대한제국 시민"
        onAnimationEnd={(event) => {
          if (event.animationName === "d9-scripted-monster-hit") completeStrike();
        }}
      />
      {damageVisible && <div className="d9-scripted-damage">-{DUNGEON9_SCRIPTED_ATTACK_DAMAGE}</div>}
      {phase === "appearance" && <div className="d9-scripted-dialogue">
        <p>균열 침식 대한제국 시민이 나타났다!</p><button onClick={runEnemyAttack}>다음</button>
      </div>}
      {phase === "blessing" && <StoryPlayer
        sequence={DUNGEON9_BLESSING_STORY} playerName={playerName} playerStatus={playerState}
        presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={completeBlessing}
      />}
      {phase === "healing" && <div className="d9-scripted-heal" aria-label="HP 완전 회복">HP FULL</div>}
      {phase === "command" && <div className="d9-scripted-command"><button onClick={attack}>공격한다</button></div>}
    </div>}
    {phase === "postStory" && <StoryPlayer
      sequence={DUNGEON9_POST_COMBAT_STORY} playerName={playerName} playerStatus={playerState}
      presentationMode="baseCampOverlay" onNavigate={() => undefined} onComplete={finish}
    />}
  </div>;
}
