import { playRandomizedOneShot } from "../audioOneShot";

/**
 * Dungeon10-only environment SFX, synthesized with the Web Audio API so no
 * external or extra audio file is needed. Dungeon1~9 audio is untouched.
 *
 * - One shared AudioContext, created lazily and resumed from the existing
 *   user-input flow (pointerdown / keydown), like the BGM gesture retry.
 * - master gain → compressor → destination keeps peaks below clipping.
 * - Every voice tracks its nodes and disconnects them when it ends or is stopped.
 */
export type Dungeon10SfxKind = "crack1" | "crack2" | "shatter" | "charging" | "roar";

export type Dungeon10SfxHandle = { stop: (fadeMs?: number) => void };

type Voice = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  output: GainNode;
  endAt: number;
  timer: number | null;
  stopped: boolean;
};

const GLASS_SHATTER_URL = `${import.meta.env.BASE_URL}assets/audio/glass-shatter-sfx.wav`;
const MASTER_LEVEL = 0.78;

let context: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuffer: AudioBuffer | null = null;
let gestureInstalled = false;
const voices = new Set<Voice>();

function seeded(seed: number) {
  let value = seed >>> 0;
  return () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function installGestureResume() {
  if (gestureInstalled || typeof document === "undefined") return;
  gestureInstalled = true;
  const resume = () => {
    if (context && context.state === "suspended") void context.resume().catch(() => undefined);
  };
  document.addEventListener("pointerdown", resume, { passive: true });
  document.addEventListener("keydown", resume);
}

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!context) {
    try {
      context = new Ctor();
    } catch {
      return null;
    }
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 8;
    compressor.ratio.value = 12;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.18;
    master = context.createGain();
    master.gain.value = MASTER_LEVEL;
    master.connect(compressor);
    compressor.connect(context.destination);
    installGestureResume();
  }
  if (context.state === "suspended") void context.resume().catch(() => undefined);
  return context;
}

function getNoise(ctx: AudioContext): AudioBuffer {
  if (noiseBuffer && noiseBuffer.sampleRate === ctx.sampleRate) return noiseBuffer;
  const length = Math.floor(ctx.sampleRate * 2);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  const random = seeded(0xd10);
  for (let index = 0; index < length; index += 1) data[index] = random() * 2 - 1;
  noiseBuffer = buffer;
  return buffer;
}

function cleanupVoice(voice: Voice) {
  if (voice.timer !== null) window.clearTimeout(voice.timer);
  voice.timer = null;
  voice.sources.forEach((source) => {
    source.onended = null;
    try { source.stop(); } catch { /* already stopped */ }
  });
  [...voice.nodes, voice.output].forEach((node) => {
    try { node.disconnect(); } catch { /* already disconnected */ }
  });
  voices.delete(voice);
}

function createVoice(ctx: AudioContext, level: number): Voice {
  const output = ctx.createGain();
  output.gain.value = level;
  output.connect(master!);
  const voice: Voice = { sources: [], nodes: [], output, endAt: ctx.currentTime, timer: null, stopped: false };
  voices.add(voice);
  return voice;
}

function finalizeVoice(ctx: AudioContext, voice: Voice) {
  const remainingMs = Math.max(0, (voice.endAt - ctx.currentTime) * 1000) + 120;
  voice.timer = window.setTimeout(() => cleanupVoice(voice), remainingMs);
}

function stopVoice(ctx: AudioContext, voice: Voice, fadeMs = 120) {
  if (voice.stopped) return;
  voice.stopped = true;
  const now = ctx.currentTime;
  const fade = Math.max(0.01, fadeMs / 1000);
  voice.output.gain.cancelScheduledValues(now);
  voice.output.gain.setValueAtTime(voice.output.gain.value, now);
  voice.output.gain.linearRampToValueAtTime(0, now + fade);
  if (voice.timer !== null) window.clearTimeout(voice.timer);
  voice.timer = window.setTimeout(() => cleanupVoice(voice), fade * 1000 + 60);
}

/** A filtered noise burst with an exponential decay. */
function noiseBurst(
  ctx: AudioContext,
  voice: Voice,
  start: number,
  options: { type: BiquadFilterType; frequency: number; q: number; peak: number; attack: number; decay: number },
) {
  const source = ctx.createBufferSource();
  source.buffer = getNoise(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = options.type;
  filter.frequency.value = options.frequency;
  filter.Q.value = options.q;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.peak, start + options.attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + options.attack + options.decay);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(voice.output);
  const offset = (start * 7.13) % 1.5;
  source.start(start, offset, options.attack + options.decay + 0.05);
  voice.sources.push(source);
  voice.nodes.push(filter, gain);
  voice.endAt = Math.max(voice.endAt, start + options.attack + options.decay + 0.05);
}

/** A pitched oscillator with a frequency glide and an attack/decay envelope. */
function tone(
  ctx: AudioContext,
  voice: Voice,
  start: number,
  options: { type: OscillatorType; from: number; to: number; peak: number; attack: number; hold?: number; decay: number; lowpass?: number },
) {
  const oscillator = ctx.createOscillator();
  oscillator.type = options.type;
  const hold = options.hold ?? 0;
  const end = start + options.attack + hold + options.decay;
  oscillator.frequency.setValueAtTime(options.from, start);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.to), end);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(options.peak, start + options.attack);
  gain.gain.setValueAtTime(options.peak, start + options.attack + hold);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);
  let last: AudioNode = oscillator;
  if (options.lowpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = options.lowpass;
    oscillator.connect(filter);
    voice.nodes.push(filter);
    last = filter;
  }
  last.connect(gain);
  gain.connect(voice.output);
  oscillator.start(start);
  oscillator.stop(end + 0.05);
  voice.sources.push(oscillator);
  voice.nodes.push(gain);
  voice.endAt = Math.max(voice.endAt, end + 0.05);
  return oscillator;
}

function buildCrack1(ctx: AudioContext, voice: Voice, t: number) {
  noiseBurst(ctx, voice, t, { type: "bandpass", frequency: 2600, q: 1.1, peak: 0.85, attack: 0.002, decay: 0.12 });
  noiseBurst(ctx, voice, t + 0.035, { type: "highpass", frequency: 3800, q: 0.7, peak: 0.45, attack: 0.002, decay: 0.07 });
  tone(ctx, voice, t, { type: "square", from: 1900, to: 700, peak: 0.12, attack: 0.002, decay: 0.03 });
}

function buildCrack2(ctx: AudioContext, voice: Voice, t: number) {
  // Lower and heavier than the first crack, with a longer tail.
  noiseBurst(ctx, voice, t, { type: "bandpass", frequency: 950, q: 0.9, peak: 0.95, attack: 0.003, decay: 0.42 });
  noiseBurst(ctx, voice, t + 0.05, { type: "bandpass", frequency: 1500, q: 1.3, peak: 0.55, attack: 0.002, decay: 0.22 });
  noiseBurst(ctx, voice, t + 0.11, { type: "bandpass", frequency: 700, q: 1.0, peak: 0.5, attack: 0.002, decay: 0.3 });
  tone(ctx, voice, t, { type: "sine", from: 78, to: 38, peak: 0.7, attack: 0.004, decay: 0.48 });
}

function buildShatter(ctx: AudioContext, voice: Voice, t: number) {
  const random = seeded(0x5ba7);
  for (let index = 0; index < 8; index += 1) {
    const at = t + index * 0.045 + random() * 0.03;
    noiseBurst(ctx, voice, at, {
      type: "bandpass",
      frequency: 3200 + random() * 4200,
      q: 2 + random() * 3,
      peak: 0.35 + random() * 0.25,
      attack: 0.001,
      decay: 0.08 + random() * 0.14,
    });
  }
  tone(ctx, voice, t, { type: "sine", from: 66, to: 28, peak: 0.85, attack: 0.004, decay: 0.75 });
  noiseBurst(ctx, voice, t, { type: "lowpass", frequency: 320, q: 0.6, peak: 0.6, attack: 0.01, decay: 0.95 });
}

function buildCharging(ctx: AudioContext, voice: Voice, t: number) {
  const rise = 1.35;
  const decay = 0.85;
  const base = tone(ctx, voice, t, { type: "sawtooth", from: 52, to: 96, peak: 0.32, attack: rise, decay, lowpass: 520 });
  tone(ctx, voice, t, { type: "triangle", from: 104, to: 190, peak: 0.22, attack: rise, decay });
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.setValueAtTime(5, t);
  lfo.frequency.linearRampToValueAtTime(11, t + rise);
  lfoGain.gain.value = 3.5;
  lfo.connect(lfoGain);
  lfoGain.connect(base.frequency);
  lfo.start(t);
  lfo.stop(t + rise + decay + 0.05);
  voice.sources.push(lfo);
  voice.nodes.push(lfoGain);
  const noise = ctx.createBufferSource();
  noise.buffer = getNoise(ctx);
  const sweep = ctx.createBiquadFilter();
  sweep.type = "bandpass";
  sweep.Q.value = 4;
  sweep.frequency.setValueAtTime(240, t);
  sweep.frequency.exponentialRampToValueAtTime(1400, t + rise);
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.0001, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.16, t + rise);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + rise + decay);
  noise.connect(sweep);
  sweep.connect(noiseGain);
  noiseGain.connect(voice.output);
  noise.start(t, 0.3, rise + decay + 0.05);
  voice.sources.push(noise);
  voice.nodes.push(sweep, noiseGain);
  voice.endAt = Math.max(voice.endAt, t + rise + decay + 0.05);
}

function buildRoar(ctx: AudioContext, voice: Voice, t: number) {
  const body = { attack: 0.16, hold: 0.85, decay: 0.85 };
  const low = tone(ctx, voice, t, { type: "sawtooth", from: 86, to: 52, peak: 0.42, ...body, lowpass: 620 });
  const mid = tone(ctx, voice, t, { type: "sawtooth", from: 131, to: 78, peak: 0.26, ...body, lowpass: 900 });
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.frequency.value = 6.2;
  vibratoGain.gain.value = 5;
  vibrato.connect(vibratoGain);
  vibratoGain.connect(low.frequency);
  vibratoGain.connect(mid.frequency);
  vibrato.start(t);
  vibrato.stop(t + body.attack + body.hold + body.decay + 0.05);
  voice.sources.push(vibrato);
  voice.nodes.push(vibratoGain);
  noiseBurst(ctx, voice, t, { type: "bandpass", frequency: 420, q: 0.8, peak: 0.5, attack: 0.18, decay: 1.6 });
  noiseBurst(ctx, voice, t + 0.05, { type: "lowpass", frequency: 180, q: 0.7, peak: 0.45, attack: 0.1, decay: 1.4 });
}

const BUILDERS: Record<Dungeon10SfxKind, { level: number; build: (ctx: AudioContext, voice: Voice, t: number) => void }> = {
  crack1: { level: 0.62, build: buildCrack1 },
  crack2: { level: 0.82, build: buildCrack2 },
  shatter: { level: 0.8, build: buildShatter },
  charging: { level: 0.7, build: buildCharging },
  roar: { level: 0.85, build: buildRoar },
};

const NOOP_HANDLE: Dungeon10SfxHandle = { stop: () => undefined };

/** Plays one synthesized SFX. Callers guarantee a single call per scripted beat. */
export function playDungeon10Sfx(kind: Dungeon10SfxKind): Dungeon10SfxHandle {
  if (kind === "shatter") {
    // Layer the project's existing glass-shatter one-shot over the synthesized impact.
    playRandomizedOneShot(GLASS_SHATTER_URL);
  }
  const ctx = getContext();
  if (!ctx || !master) return NOOP_HANDLE;
  const definition = BUILDERS[kind];
  const voice = createVoice(ctx, definition.level);
  try {
    definition.build(ctx, voice, ctx.currentTime + 0.01);
  } catch {
    cleanupVoice(voice);
    return NOOP_HANDLE;
  }
  finalizeVoice(ctx, voice);
  return { stop: (fadeMs?: number) => stopVoice(ctx, voice, fadeMs) };
}

/** Fades out and releases every Dungeon10 voice (scene end / unmount). */
export function stopAllDungeon10Sfx(fadeMs = 150): void {
  if (!context) return;
  const ctx = context;
  [...voices].forEach((voice) => stopVoice(ctx, voice, fadeMs));
}

export function getActiveDungeon10VoiceCount(): number {
  return voices.size;
}
