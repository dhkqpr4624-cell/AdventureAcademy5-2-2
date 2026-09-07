import { useState } from "react";
import type { PlayerState } from "../game/player/playerState";
import { StoryPlayer } from "../game/story/StoryPlayer";
import { DUNGEON3_COMPLETION_PRELUDE, DUNGEON3_CURRENT_STORY, DUNGEON3_FLASHBACK } from "../data/stories/dungeon3Chapter2Stories";
import { Dungeon3FlashbackStage } from "./Dungeon3FlashbackStage";

export function Dungeon3CompletionStory({ player, onComplete, onReminiscenceStart }: { player: PlayerState; onComplete: () => void; onReminiscenceStart: () => void }) {
  const [phase, setPhase] = useState<"prelude" | "flashback" | "current">("prelude");
  const [flashbackStage, setFlashbackStage] = useState<"black" | "hq" | "ruins" | "ruinsAlert">("black");
  const sequence = phase === "prelude" ? DUNGEON3_COMPLETION_PRELUDE : phase === "flashback" ? DUNGEON3_FLASHBACK : DUNGEON3_CURRENT_STORY;
  return <div className={`base-camp-story-overlay dungeon3-completion-stage ${phase === "flashback" ? "is-flashback" : ""}`}>
    {phase === "flashback" && <Dungeon3FlashbackStage stage={flashbackStage} />}
    <StoryPlayer key={phase} sequence={sequence} playerName={player.name || "플레이어"} playerStatus={player}
      presentationMode="baseCampOverlay" onNavigate={() => undefined}
      onCheckpointReached={(_, checkpointId) => { if (checkpointId === "hq" || checkpointId === "ruins" || checkpointId === "ruinsAlert" || checkpointId === "black") setFlashbackStage(checkpointId); }}
      onComplete={() => {
        if (phase === "prelude") {
          onReminiscenceStart();
          setPhase("flashback");
        } else if (phase === "flashback") setPhase("current");
        else onComplete();
      }} />
  </div>;
}
