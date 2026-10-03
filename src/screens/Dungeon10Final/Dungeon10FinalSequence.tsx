import { useEffect, useRef, useState, type CSSProperties } from "react";
import { StoryPlayer } from "../../game/story/StoryPlayer";
import { DUNGEON10_FINAL_SEGMENTS, type Dungeon10FinalSegmentId } from "../../data/stories/dungeon10Stories";
import {
  DUNGEON10_FINAL_PRELOAD_URLS,
  DUNGEON10_FINAL_TIMELINE,
  DUNGEON10_ILLUST_FADE_MS,
  type Dungeon10FinalStep,
} from "../../game/dungeon10/dungeon10FinalTimeline";
import { FinalMapRenderer } from "../../three/finalMap/FinalMapRenderer";
import { playDungeon10Sfx, stopAllDungeon10Sfx } from "../../game/audio/dungeon10ProceduralSfx";
import { playRandomizedOneShot } from "../../game/audioOneShot";
import { playBgm, stopBgm } from "../../game/audioBgm";
import { Dungeon10EndingCredits } from "./Dungeon10EndingCredits";
import "./Dungeon10FinalSequence.css";

const HIT_SFX_URL = `${import.meta.env.BASE_URL}assets/audio/hit-sfx.mp3`;

type Props = {
  playerName: string;
  /** Called exactly once, after the credits have faded out. */
  onComplete: () => void;
};

type ViewState = {
  coverVisible: boolean;
  mapMounted: boolean;
  mapVisible: boolean;
  mapFadeMs: number;
  segment: Dungeon10FinalSegmentId | null;
  segmentRevision: number;
  attackButton: boolean;
  backdropVisible: boolean;
  backdropFadeMs: number;
  illustUrl: string | null;
  illustVisible: boolean;
  credits: boolean;
};

const INITIAL_VIEW: ViewState = {
  coverVisible: false,
  mapMounted: true,
  mapVisible: false,
  mapFadeMs: 1000,
  segment: null,
  segmentRevision: 0,
  attackButton: false,
  backdropVisible: false,
  backdropFadeMs: 900,
  illustUrl: null,
  illustVisible: false,
  credits: false,
};

function preloadImage(url: string): Promise<void> {
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  return image.decode().catch(() => undefined);
}

/**
 * Non-skippable Final Story: Final map battle beats → dungeon exit →
 * farewells → narration → credits. Every beat runs once per mount; React
 * Strict Mode's extra mount is aborted before any side effect happens.
 */
export function Dungeon10FinalSequence({ playerName, onComplete }: Props) {
  const [view, setView] = useState<ViewState>(INITIAL_VIEW);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<FinalMapRenderer | null>(null);
  const storyResolverRef = useRef<(() => void) | null>(null);
  const attackResolverRef = useRef<(() => void) | null>(null);
  const creditsResolverRef = useRef<(() => void) | null>(null);
  const completedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;
    const map = new FinalMapRenderer(container);
    mapRef.current = map;
    const timers = new Set<number>();
    let cancelled = false;
    const update = (patch: Partial<ViewState> | ((state: ViewState) => Partial<ViewState>)) => {
      if (cancelled) return;
      setView((state) => ({ ...state, ...(typeof patch === "function" ? patch(state) : patch) }));
    };
    const wait = (durationMs: number) => new Promise<void>((resolve) => {
      if (cancelled) { resolve(); return; }
      const timer = window.setTimeout(() => { timers.delete(timer); resolve(); }, durationMs);
      timers.add(timer);
    });
    const nextFrame = () => new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve()));
    });
    const showStory = (segment: Dungeon10FinalSegmentId) => new Promise<void>((resolve) => {
      storyResolverRef.current = () => {
        storyResolverRef.current = null;
        update((state) => ({ segment: null, segmentRevision: state.segmentRevision + 1 }));
        resolve();
      };
      update((state) => ({ segment, segmentRevision: state.segmentRevision + 1 }));
    });
    const waitForAttack = () => new Promise<void>((resolve) => {
      attackResolverRef.current = () => {
        attackResolverRef.current = null;
        update({ attackButton: false });
        resolve();
      };
      update({ attackButton: true });
    });
    const waitForCredits = () => new Promise<void>((resolve) => {
      creditsResolverRef.current = () => {
        creditsResolverRef.current = null;
        resolve();
      };
      update({ credits: true, illustUrl: null, illustVisible: false, segment: null });
    });

    const runStep = async (step: Dungeon10FinalStep) => {
      switch (step.kind) {
        case "coverIn":
          update({ coverVisible: true });
          await wait(step.durationMs);
          return;
        case "mapPrepare":
          await Promise.all([map.load(), ...DUNGEON10_FINAL_PRELOAD_URLS.map(preloadImage)]);
          if (cancelled) return;
          map.start();
          return;
        case "mapFadeIn":
          update({ mapVisible: true, mapFadeMs: step.durationMs });
          await wait(step.durationMs);
          return;
        case "wait":
          await wait(step.durationMs);
          return;
        case "story":
          await showStory(step.segment);
          return;
        case "chargingSfx":
          playDungeon10Sfx("charging");
          return;
        case "bossCharging":
          map.setBossState("charging");
          return;
        case "guardVfx":
          await map.playGuardVfx();
          return;
        case "attackButton":
          await waitForAttack();
          return;
        case "hitSfx":
          playRandomizedOneShot(HIT_SFX_URL);
          return;
        case "bossShakeWithRoar": {
          const shake = map.shakeBoss(step.shakeMs);
          await wait(step.roarDelayMs);
          if (!cancelled) playDungeon10Sfx("roar");
          await shake;
          return;
        }
        case "bossFadeOut":
          await map.fadeOutBoss(step.durationMs);
          return;
        case "stopBossBgm":
          stopBgm("boss-battle");
          return;
        case "cameraShake":
          await map.shakeCamera(step.durationMs);
          return;
        case "backdropIn":
          update({ backdropVisible: true, backdropFadeMs: step.durationMs });
          await wait(step.durationMs);
          return;
        case "disposeMap":
          map.dispose();
          mapRef.current = null;
          update({ mapMounted: false, coverVisible: true });
          return;
        case "endingBgm":
          playBgm("ending-credit", undefined, { loop: true, volume: 0.42 });
          return;
        case "illustIn":
          update({ illustUrl: step.imageUrl, illustVisible: false });
          await nextFrame();
          update({ illustVisible: true });
          await wait(step.durationMs);
          return;
        case "illustOut":
          update({ illustVisible: false });
          await wait(step.durationMs);
          return;
        case "credits":
          await waitForCredits();
          return;
      }
    };

    void (async () => {
      for (const step of DUNGEON10_FINAL_TIMELINE) {
        if (cancelled) return;
        await runStep(step);
      }
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      stopBgm("ending-credit");
      stopAllDungeon10Sfx(200);
      onCompleteRef.current();
    })();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
      storyResolverRef.current = null;
      attackResolverRef.current = null;
      creditsResolverRef.current = null;
      stopAllDungeon10Sfx(150);
      map.dispose();
      if (mapRef.current === map) mapRef.current = null;
    };
  }, []);

  const segment = view.segment ? DUNGEON10_FINAL_SEGMENTS[view.segment] : null;

  return (
    <div className="d10-final" role="presentation">
      <div className={`d10-final-cover${view.coverVisible ? " is-visible" : ""}`} aria-hidden="true" />
      {view.mapMounted && (
        <div
          ref={mapContainerRef}
          className={`d10-final-map${view.mapVisible ? " is-visible" : ""}`}
          style={{ "--d10-map-fade": `${view.mapFadeMs}ms` } as CSSProperties}
          aria-label="최종 결전"
        />
      )}
      <div
        className={`d10-final-backdrop${view.backdropVisible ? " is-visible" : ""}`}
        style={{ "--d10-backdrop-fade": `${view.backdropFadeMs}ms` } as CSSProperties}
        aria-hidden="true"
      />
      {view.illustUrl && (
        <div
          className={`d10-final-illust${view.illustVisible ? " is-visible" : ""}`}
          style={{ "--d10-illust-fade": `${DUNGEON10_ILLUST_FADE_MS}ms` } as CSSProperties}
          aria-hidden="true"
        >
          <img src={view.illustUrl} alt="" draggable={false} />
        </div>
      )}
      {segment && (
        <div className="d10-final-story">
          <StoryPlayer
            key={`${segment.id}-${view.segmentRevision}`}
            sequence={segment}
            playerName={playerName}
            presentationMode="baseCampOverlay"
            onNavigate={() => undefined}
            onComplete={() => storyResolverRef.current?.()}
          />
        </div>
      )}
      {view.attackButton && (
        <div className="d10-final-attack">
          <button type="button" onClick={(event) => {
            event.currentTarget.disabled = true;
            attackResolverRef.current?.();
          }}>
            적을 공격한다
          </button>
        </div>
      )}
      {view.credits && (
        <Dungeon10EndingCredits playerName={playerName} onComplete={() => creditsResolverRef.current?.()} />
      )}
    </div>
  );
}
