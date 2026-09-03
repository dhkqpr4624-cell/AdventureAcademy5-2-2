import { useEffect, useState } from "react";
import type { ScreenId } from "../../app/routes";
import type { IntroSceneSequence } from "../../types/story";
import { IntroTextPlayer } from "./IntroTextPlayer";
import { StoryPlayer } from "./StoryPlayer";
import { playBgm } from "../audioBgm";
import { CHAPTER2_INTRO_ASSET_URLS } from "./Chapter2IntroStage";

export function IntroScenePlayer({
  sequence, playerName, onNavigate, onStarted, onCheckpoint, onCompleted,
}: {
  sequence: IntroSceneSequence;
  playerName: string;
  onNavigate: (screen: ScreenId) => void;
  onStarted?: (storyId: string) => void;
  onCheckpoint?: (storyId: string, checkpointId: string) => void;
  onCompleted?: (storyId: string) => void;
}) {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = sequence.scenes[sceneIndex];

  useEffect(() => {
    if (sceneIndex < 2) playBgm("airship", undefined, { loop: true, volume: 0.42 });
    else playBgm("intro-story", undefined, { loop: true, volume: 0.42 });
  }, [sceneIndex]);

  useEffect(() => {
    if (sceneIndex !== 0) return;
    const storyScenes = sequence.scenes.filter((candidate) => candidate.mode === "story");
    const urls = new Set(CHAPTER2_INTRO_ASSET_URLS);
    storyScenes.forEach((candidate) => {
      Object.values(candidate.sequence.actors).forEach((actor) => {
        Object.values(actor.portraits).forEach((portrait) => {
          if (portrait.imageUrl) urls.add(portrait.imageUrl);
        });
      });
      candidate.sequence.scenes.forEach((storyScene) => {
        storyScene.steps.forEach((step) => {
          if (step.type === "illustOverlay" && step.imageUrl) urls.add(step.imageUrl);
        });
      });
    });
    const images = [...urls].map((url) => {
      const image = new Image();
      image.src = url;
      return image;
    });
    return () => images.forEach((image) => { image.onload = null; image.onerror = null; });
  }, [sceneIndex, sequence]);
  const finishScene = () => {
    if (sceneIndex + 1 < sequence.scenes.length) setSceneIndex((current) => current + 1);
    else {
      onCompleted?.(sequence.id);
      onNavigate(sequence.onCompleteScreen);
    }
  };

  if (!scene) return null;
  if (scene.mode === "introText") {
    return <IntroTextPlayer key={scene.id} lines={scene.lines} onComplete={finishScene} />;
  }
  return (
    <StoryPlayer
      key={scene.id}
      sequence={scene.sequence}
      playerName={playerName}
      onNavigate={onNavigate}
      onComplete={finishScene}
      onStoryStarted={onStarted}
      onCheckpointReached={onCheckpoint}
    />
  );
}
