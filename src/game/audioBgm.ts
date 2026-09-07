export type BgmTrackId =
  | "airship"
  | "intro-story"
  | "village"
  | "dungeon"
  | "boss-battle"
  | "sacrifice"
  | "reminiscence"
  | "ending-credit";

export type BgmOptions = {
  loop?: boolean;
  volume?: number;
  restartDelayMs?: number;
  restartDelayRangeMs?: readonly [number, number];
  exclusive?: boolean;
};

export const BGM_URLS: Readonly<Record<BgmTrackId, string>> = {
  airship: `${import.meta.env.BASE_URL}assets/audio/airship-theme.wav`,
  "intro-story": `${import.meta.env.BASE_URL}assets/audio/intro-story-theme.wav`,
  village: `${import.meta.env.BASE_URL}assets/audio/village-theme.wav`,
  dungeon: `${import.meta.env.BASE_URL}assets/audio/dungeon-theme.wav`,
  "boss-battle": `${import.meta.env.BASE_URL}assets/audio/boss-battle-theme.wav`,
  sacrifice: `${import.meta.env.BASE_URL}assets/audio/sacrifice-theme.wav`,
  reminiscence: `${import.meta.env.BASE_URL}assets/audio/bgm/reminiscence-bgm.wav`,
  "ending-credit": `${import.meta.env.BASE_URL}assets/audio/ending-credit-bgm.wav`,
};

type ActiveBgm = {
  id: BgmTrackId;
  audio: HTMLAudioElement;
  restartDelayMs: number;
  restartDelayRangeMs?: readonly [number, number];
  exclusive: boolean;
  restartTimer: number | null;
};

let activeBgm: ActiveBgm | null = null;
let gestureListenersInstalled = false;

function tryPlayActive(): void {
  if (!activeBgm || !activeBgm.audio.paused) return;
  void activeBgm.audio.play().catch(() => undefined);
}

function installGestureRetry(): void {
  if (gestureListenersInstalled || typeof document === "undefined") return;
  gestureListenersInstalled = true;
  const retry = () => tryPlayActive();
  document.addEventListener("pointerdown", retry, { passive: true });
  document.addEventListener("keydown", retry);
}

function disposeActive(): void {
  if (!activeBgm) return;
  if (activeBgm.restartTimer !== null) window.clearTimeout(activeBgm.restartTimer);
  activeBgm.audio.onended = null;
  activeBgm.audio.pause();
  activeBgm.audio.currentTime = 0;
  activeBgm = null;
}

export function playBgm(
  id: BgmTrackId,
  url = BGM_URLS[id],
  options: BgmOptions = {},
): void {
  if (typeof Audio === "undefined") return;
  if (activeBgm?.exclusive && activeBgm.id !== id) return;
  if (activeBgm?.id === id) {
    tryPlayActive();
    return;
  }

  disposeActive();
  const audio = new Audio(url);
  const restartDelayMs = Math.max(0, options.restartDelayMs ?? 0);
  const restartDelayRangeMs = options.restartDelayRangeMs;
  audio.preload = "auto";
  audio.volume = Math.max(0, Math.min(1, options.volume ?? 0.42));
  audio.loop = Boolean(options.loop) && restartDelayMs === 0;
  activeBgm = { id, audio, restartDelayMs, restartDelayRangeMs, exclusive: Boolean(options.exclusive), restartTimer: null };

  if (restartDelayMs > 0 || restartDelayRangeMs) {
    audio.onended = () => {
      if (!activeBgm || activeBgm.audio !== audio) return;
      const [minimum, maximum] = restartDelayRangeMs ?? [restartDelayMs, restartDelayMs];
      const delay = Math.max(0, minimum) + Math.random() * Math.max(0, maximum - minimum);
      activeBgm.restartTimer = window.setTimeout(() => {
        if (!activeBgm || activeBgm.audio !== audio) return;
        activeBgm.restartTimer = null;
        audio.currentTime = 0;
        void audio.play().catch(() => undefined);
      }, delay);
    };
  }

  installGestureRetry();
  void audio.play().catch(() => undefined);
}

export function stopBgm(id?: BgmTrackId): void {
  if (!activeBgm || (id && activeBgm.id !== id)) return;
  disposeActive();
}

export function getActiveBgmId(): BgmTrackId | null {
  return activeBgm?.id ?? null;
}
