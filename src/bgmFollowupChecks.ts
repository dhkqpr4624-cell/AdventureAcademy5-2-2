import { BGM_URLS, getActiveBgmId, playBgm, stopBgm, type BgmTrackId } from "./game/audioBgm";
import { DUNGEON7_RESCUE_BGM_RESTART_DELAY_MS, startDungeon7RescueBgm } from "./components/Dungeon7RescueStory";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`[bgmFollowupChecks] ${message}`);
}

const BASECAMP_BGM = "assets/audio/bgm/basecamp-bgm.wav";
const REVIVE_ENDING_BGM = "assets/audio/bgm/revive-ending-scene.wav";
const SAVE_DENEB_BGM = "assets/audio/bgm/save-deneb-dungeon7.wav";

/** Minimal HTMLAudioElement stand-in that records what the BGM manager does with it. */
class FakeAudio {
  static instances: FakeAudio[] = [];
  src: string;
  preload = "";
  volume = 1;
  loop = false;
  paused = true;
  currentTime = 0;
  playCalls = 0;
  onended: (() => void) | null = null;
  constructor(src: string) { this.src = src; FakeAudio.instances.push(this); }
  play() { this.playCalls += 1; this.paused = false; return Promise.resolve(); }
  pause() { this.paused = true; }
  end() { this.paused = true; this.onended?.(); }
}

/** Runs `body` with fake Audio and fake window timers, restoring the real ones afterwards. */
function withFakeAudio(body: (clock: { pending: () => number; advance: (ms: number) => void }) => void): void {
  const scope = globalThis as unknown as Record<string, unknown>;
  const timerScope = window as unknown as Record<string, unknown>;
  const original = { Audio: scope.Audio, setTimeout: timerScope.setTimeout, clearTimeout: timerScope.clearTimeout };
  let now = 0;
  let nextId = 1;
  const timers = new Map<number, { at: number; callback: () => void }>();
  scope.Audio = FakeAudio;
  timerScope.setTimeout = (callback: () => void, delay = 0) => { const id = nextId++; timers.set(id, { at: now + delay, callback }); return id; };
  timerScope.clearTimeout = (id: number) => { timers.delete(id); };
  const advance = (ms: number) => {
    const target = now + ms;
    for (;;) {
      const due = [...timers.entries()].filter(([, timer]) => timer.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].callback();
    }
    now = target;
  };
  FakeAudio.instances = [];
  try {
    stopBgm();
    body({ pending: () => timers.size, advance });
  } finally {
    stopBgm();
    scope.Audio = original.Audio;
    timerScope.setTimeout = original.setTimeout;
    timerScope.clearTimeout = original.clearTimeout;
    FakeAudio.instances = [];
  }
}

const playing = () => FakeAudio.instances.filter((audio) => !audio.paused);
const playCount = (audio: FakeAudio): number => audio.playCalls;

export function runBgmFollowupChecks(): void {
  // Mapping: only the three requested scenes move to the new files.
  const urls = BGM_URLS as Readonly<Record<BgmTrackId, string>>;
  assert(urls.village.endsWith(BASECAMP_BGM), "BaseCamp (village) must use basecamp-bgm.wav");
  assert(urls.reminiscence.endsWith(REVIVE_ENDING_BGM), "Dungeon3 reminiscence must use revive-ending-scene.wav");
  assert(urls["ending-credit"].endsWith(REVIVE_ENDING_BGM), "Dungeon10 ending must use revive-ending-scene.wav");
  assert(urls["save-deneb"].endsWith(SAVE_DENEB_BGM), "Dungeon7 rescue must use save-deneb-dungeon7.wav");
  const otherTracks = (Object.keys(urls) as BgmTrackId[]).filter((id) => !["village", "reminiscence", "ending-credit", "save-deneb"].includes(id));
  assert(otherTracks.join() === "airship,intro-story,dungeon,boss-battle,sacrifice", "unexpected BGM track list");
  for (const id of otherTracks) {
    assert(![BASECAMP_BGM, REVIVE_ENDING_BGM, SAVE_DENEB_BGM].some((file) => urls[id].endsWith(file)), `${id} must keep its original file`);
  }
  assert(DUNGEON7_RESCUE_BGM_RESTART_DELAY_MS === 2_500, "Dungeon7 rescue BGM replay delay must be 2500ms");

  // Dungeon7: ended -> 2.5s silence -> replay from 0, with one timer at most.
  withFakeAudio(({ pending, advance }) => {
    playBgm("dungeon", undefined, { loop: true, volume: 0.42 });
    const dungeon = FakeAudio.instances[0];
    const stopRescue = startDungeon7RescueBgm();
    const rescue = FakeAudio.instances[1];
    assert(dungeon.paused && rescue.src.endsWith(SAVE_DENEB_BGM) && !rescue.paused, "rescue BGM must replace the dungeon BGM");
    assert(rescue.loop === false && rescue.volume === 0.42 && rescue.playCalls === 1, "rescue BGM must not use native loop");
    rescue.currentTime = 99;
    rescue.end();
    assert(pending() === 1 && rescue.paused, "ended must schedule exactly one replay timer");
    advance(DUNGEON7_RESCUE_BGM_RESTART_DELAY_MS - 1);
    assert(rescue.paused && rescue.playCalls === 1, "replay must wait the full 2500ms");
    advance(1);
    assert(!rescue.paused && playCount(rescue) === 2 && rescue.currentTime === 0 && pending() === 0, "replay must restart from the beginning after 2500ms");
    rescue.end(); rescue.end();
    assert(pending() === 1, "repeated ended events must not stack timers");
    // Normal end / skip / unmount all run the same cleanup.
    stopRescue();
    assert(pending() === 0 && rescue.paused && getActiveBgmId() === null, "cleanup must stop the rescue BGM and its replay timer");
    advance(10_000);
    assert(playCount(rescue) === 2, "no replay after cleanup");
    // Dungeon7 -> BaseCamp: the new BaseCamp BGM starts exactly once.
    playBgm("village", undefined, { loop: true, volume: 0.42 });
    playBgm("village", undefined, { loop: true, volume: 0.42 });
    const village = FakeAudio.instances.filter((audio) => audio.src.endsWith(BASECAMP_BGM));
    assert(village.length === 1 && village[0].loop && village[0].volume === 0.42 && playing().length === 1, "BaseCamp BGM must start once with its existing loop/volume");
  });

  // Strict Mode: effect, cleanup, effect -> a single live audio and a single timer.
  withFakeAudio(({ pending }) => {
    const first = startDungeon7RescueBgm();
    first();
    const stopSecond = startDungeon7RescueBgm();
    const live = playing();
    assert(live.length === 1 && live[0].src.endsWith(SAVE_DENEB_BGM), "Strict Mode must leave exactly one playing rescue BGM");
    live[0].end();
    assert(pending() === 1, "Strict Mode must leave exactly one replay timer");
    stopSecond();
    assert(pending() === 0 && playing().length === 0, "Strict Mode cleanup must stop everything");
    // Re-entry starts a fresh lifecycle.
    const stopAgain = startDungeon7RescueBgm();
    assert(playing().length === 1 && getActiveBgmId() === "save-deneb", "re-entering the rescue story must restart the BGM");
    stopAgain();
  });

  // Dungeon3 reminiscence and Dungeon10 ending share the file but never the audio element.
  withFakeAudio(() => {
    playBgm("reminiscence", undefined, { volume: 0.42, restartDelayRangeMs: [1_000, 2_000], exclusive: true });
    const reminiscence = FakeAudio.instances[0];
    assert(reminiscence.src.endsWith(REVIVE_ENDING_BGM) && reminiscence.volume === 0.42 && !reminiscence.loop, "reminiscence keeps its delayed-loop rule");
    stopBgm("reminiscence");
    assert(reminiscence.paused && getActiveBgmId() === null, "reminiscence cleanup");
    playBgm("ending-credit", undefined, { loop: true, volume: 0.42 });
    const ending = FakeAudio.instances[1];
    assert(ending !== reminiscence && ending.src.endsWith(REVIVE_ENDING_BGM) && ending.loop && ending.volume === 0.42, "Dungeon10 ending gets its own looping audio element");
    playBgm("ending-credit", undefined, { loop: true, volume: 0.42 });
    assert(FakeAudio.instances.length === 2 && ending.playCalls === 1 && !ending.paused, "ending BGM must not restart from the top when requested again");
    stopBgm();
    assert(ending.paused && getActiveBgmId() === null, "title (stopBgm) must stop the ending BGM");
  });
}
