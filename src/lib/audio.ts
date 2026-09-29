import type { ThemeId } from "./themes";

type Ctx = AudioContext;

function makeNoiseBuffer(ctx: Ctx, seconds = 4): AudioBuffer {
  const length = ctx.sampleRate * seconds;
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0,
    b1 = 0,
    b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    // pink-ish noise (lebih lembut untuk telinga)
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57555 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18;
  }
  return buffer;
}

/**
 * Mesin suara sesi: ambience per tema + panduan napas + bel lembut.
 * Semua bunyi disintesis realtime (tidak ada file audio).
 */
export class AudioEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private ambient: AudioBufferSourceNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private ambientGain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private drone: OscillatorNode[] = [];
  private crackleTimer: number | null = null;
  private started = false;

  get isRunning() {
    return this.started;
  }

  async start(theme: ThemeId, volume = 0.6) {
    if (this.started) {
      this.setTheme(theme);
      return;
    }
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtor) return;

    const ctx = new AudioCtor();
    await ctx.resume();
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = volume;
    master.connect(ctx.destination);
    this.master = master;

    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 800;

    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    src.connect(filter).connect(gain).connect(master);
    src.start();

    this.ambient = src;
    this.ambientFilter = filter;
    this.ambientGain = gain;

    // LFO untuk gerakan pasang-surut (ombak/angin)
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.09;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.3;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    this.lfo = lfo;

    this.started = true;
    this.setTheme(theme);
  }

  setTheme(theme: ThemeId) {
    const ctx = this.ctx;
    if (!ctx || !this.ambientFilter || !this.ambientGain || !this.lfo) return;
    const now = ctx.currentTime;
    this.stopCrackle();
    this.stopDrone();

    const apply = (freq: number, q: number, gain: number, lfoRate: number, type: BiquadFilterType) => {
      this.ambientFilter!.type = type;
      this.ambientFilter!.Q.value = q;
      this.ambientFilter!.frequency.cancelScheduledValues(now);
      this.ambientFilter!.frequency.linearRampToValueAtTime(freq, now + 1.5);
      this.ambientGain!.gain.cancelScheduledValues(now);
      this.ambientGain!.gain.linearRampToValueAtTime(gain, now + 1.5);
      this.lfo!.frequency.setValueAtTime(lfoRate, now);
    };

    switch (theme) {
      case "hujan":
        apply(2600, 0.4, 0.42, 0.5, "highpass");
        break;
      case "ombak":
        apply(650, 0.6, 0.55, 0.08, "lowpass");
        break;
      case "hutan":
        apply(1100, 0.5, 0.32, 0.13, "lowpass");
        this.startDrone([146.83, 220]);
        break;
      case "sunset":
        apply(520, 0.5, 0.28, 0.06, "lowpass");
        this.startDrone([130.81, 196, 261.63]);
        break;
      case "salju":
        apply(420, 0.4, 0.3, 0.05, "lowpass");
        this.startDrone([174.61]);
        break;
      case "apiunggun":
        apply(900, 0.5, 0.28, 0.2, "lowpass");
        this.startCrackle();
        break;
    }
  }

  /** Cue napas: sapuan naik saat tarik napas, turun saat buang napas. */
  breathCue(phase: "inhale" | "hold" | "exhale", duration: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;

    if (phase === "hold") {
      this.blip(392, 0.05, 0.5);
      return;
    }

    const src = ctx.createBufferSource();
    src.buffer = makeNoiseBuffer(ctx, 2);
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.Q.value = 1.2;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(this.master);

    const up = phase === "inhale";
    filter.frequency.setValueAtTime(up ? 320 : 1000, now);
    filter.frequency.linearRampToValueAtTime(up ? 1000 : 300, now + duration);
    gain.gain.linearRampToValueAtTime(up ? 0.22 : 0.18, now + duration * 0.45);
    gain.gain.linearRampToValueAtTime(0.0001, now + duration);
    src.start(now);
    src.stop(now + duration + 0.1);

    this.blip(up ? 523.25 : 349.23, 0.045, 0.9);
  }

  /** Bel lembut (dipakai untuk alarm bangun / penanda tahap). */
  chime(times = 3) {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    for (let i = 0; i < times; i += 1) {
      window.setTimeout(() => this.blip(notes[i % notes.length], 0.16, 2.4), i * 700);
    }
  }

  private blip(freq: number, gainValue: number, duration: number) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(gainValue, now + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(g).connect(this.master);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  private startDrone(freqs: number[]) {
    const ctx = this.ctx;
    if (!ctx || !this.master) return;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = 0;
      g.gain.linearRampToValueAtTime(0.05 / (i + 1), ctx.currentTime + 3);
      osc.connect(g).connect(this.master!);
      osc.start();
      this.drone.push(osc);
    });
  }

  private stopDrone() {
    this.drone.forEach((o) => {
      try {
        o.stop();
      } catch {
        /* noop */
      }
    });
    this.drone = [];
  }

  private startCrackle() {
    const tick = () => {
      this.blip(120 + Math.random() * 500, 0.03 + Math.random() * 0.03, 0.12);
      this.crackleTimer = window.setTimeout(tick, 120 + Math.random() * 500);
    };
    this.crackleTimer = window.setTimeout(tick, 300);
  }

  private stopCrackle() {
    if (this.crackleTimer !== null) {
      window.clearTimeout(this.crackleTimer);
      this.crackleTimer = null;
    }
  }

  setVolume(v: number) {
    if (this.master && this.ctx) {
      this.master.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.4);
    }
  }

  async stop() {
    this.stopCrackle();
    this.stopDrone();
    try {
      this.ambient?.stop();
      this.lfo?.stop();
    } catch {
      /* noop */
    }
    this.ambient = null;
    this.lfo = null;
    this.started = false;
    if (this.ctx) {
      const ctx = this.ctx;
      this.ctx = null;
      this.master = null;
      await ctx.close().catch(() => undefined);
    }
  }
}
