/**
 * Web Audio API Engine for Music Library & Post Soundtracks
 * Provides generative ambient pads, acoustic plucks, and lo-fi tapes with no external asset dependencies.
 */

class MusicAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private activeNodes: (OscillatorNode | GainNode | BiquadFilterNode)[] = [];
  private timerId: number | null = null;
  private currentPreset: string | null = null;
  private _isPlaying: boolean = false;
  private _volume: number = 0.6;

  // Track playback time & synchronization state
  private currentTrackId: string | null = null;
  private activeDurationSeconds: number = 180;
  private startedAtContextTime: number = 0;
  private pausedOffsetSeconds: number = 0;
  private timeListeners: Set<(state: { currentTime: number; isPlaying: boolean; trackId: string | null; duration: number }) => void> = new Set();
  private tickerInterval: number | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public isPlaying(): boolean {
    return this._isPlaying;
  }

  public getCurrentPreset(): string | null {
    return this.currentPreset;
  }

  public setVolume(vol: number) {
    this._volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.ctx.currentTime, 0.05);
    }
  }

  public getVolume(): number {
    return this._volume;
  }

  public stop() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.tickerInterval !== null) {
      window.clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }

    if (this.ctx && this.masterGain) {
      // Smooth fade out
      this.masterGain.gain.setTargetAtTime(0.001, this.ctx.currentTime, 0.08);
      setTimeout(() => {
        this.activeNodes.forEach((node) => {
          try {
            if ('stop' in node && typeof node.stop === 'function') {
              node.stop();
            }
            node.disconnect();
          } catch {
            // Ignore already stopped
          }
        });
        this.activeNodes = [];
        if (this.masterGain && this.ctx) {
          this.masterGain.gain.setValueAtTime(this._volume, this.ctx.currentTime);
        }
      }, 100);
    }

    this._isPlaying = false;
    this.currentPreset = null;
    this.notifyListeners();
  }

  private startTicker() {
    if (this.tickerInterval !== null) {
      window.clearInterval(this.tickerInterval);
    }
    this.tickerInterval = window.setInterval(() => {
      if (this._isPlaying) {
        this.notifyListeners();
      }
    }, 100);
  }

  private notifyListeners() {
    const time = this.getCurrentTime();
    const state = {
      currentTime: time,
      isPlaying: this._isPlaying,
      trackId: this.currentTrackId,
      duration: this.activeDurationSeconds,
    };
    this.timeListeners.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Audio engine subscriber error:', err);
      }
    });
  }

  public subscribe(cb: (state: { currentTime: number; isPlaying: boolean; trackId: string | null; duration: number }) => void) {
    this.timeListeners.add(cb);
    // Initial emission
    cb({
      currentTime: this.getCurrentTime(),
      isPlaying: this._isPlaying,
      trackId: this.currentTrackId,
      duration: this.activeDurationSeconds,
    });
    return () => {
      this.timeListeners.delete(cb);
    };
  }

  public seek(seconds: number, trackId?: string) {
    if (trackId && trackId !== this.currentTrackId) {
      this.currentTrackId = trackId;
    }
    this.pausedOffsetSeconds = Math.max(0, Math.min(seconds, this.activeDurationSeconds));
    if (this.ctx && this._isPlaying) {
      this.startedAtContextTime = this.ctx.currentTime - this.pausedOffsetSeconds;
    }
    this.notifyListeners();
  }

  public getCurrentTime(forTrackId?: string): number {
    if (forTrackId && this.currentTrackId !== forTrackId) {
      return 0;
    }
    if (!this._isPlaying || !this.ctx) {
      return this.pausedOffsetSeconds;
    }
    const elapsed = Math.max(0, this.ctx.currentTime - this.startedAtContextTime);
    if (this.activeDurationSeconds > 0) {
      return elapsed % this.activeDurationSeconds;
    }
    return elapsed;
  }

  public getActiveTrackId(): string | null {
    return this.currentTrackId;
  }

  public getActiveDuration(): number {
    return this.activeDurationSeconds;
  }

  public isPlayingTrack(trackId: string): boolean {
    return this._isPlaying && this.currentTrackId === trackId;
  }

  public formatTime(totalSeconds: number): string {
    const sec = Math.max(0, Math.floor(totalSeconds));
    const mins = Math.floor(sec / 60);
    const remainderSec = sec % 60;
    return `${mins}:${remainderSec < 10 ? '0' : ''}${remainderSec}`;
  }

  public playPreset(preset: string = 'ambient_calm', trackId?: string, durationSeconds?: number) {
    const isSameTrack = trackId && trackId === this.currentTrackId;
    this.stop();
    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this._isPlaying = true;
    this.currentPreset = preset;

    if (!isSameTrack) {
      this.pausedOffsetSeconds = 0;
    }
    this.currentTrackId = trackId || null;
    this.activeDurationSeconds = durationSeconds || 180;

    const ctx = this.ctx;
    const now = ctx.currentTime;
    this.startedAtContextTime = now - this.pausedOffsetSeconds;

    // Reset master gain
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(0.001, now);
    this.masterGain.gain.linearRampToValueAtTime(this._volume, now + 0.5);

    this.startTicker();
    this.notifyListeners();

    switch (preset) {
      case 'lofi_tape':
        this.playLofiTape(ctx, now);
        break;
      case 'acoustic_strings':
        this.playAcousticStrings(ctx, now);
        break;
      case 'night_jazz':
        this.playNightJazz(ctx, now);
        break;
      case 'deep_drone':
        this.playDeepDrone(ctx, now);
        break;
      case 'ambient_calm':
      default:
        this.playAmbientCalm(ctx, now);
        break;
    }
  }

  private playAmbientCalm(ctx: AudioContext, now: number) {
    // Reverberant harmonic chords (C4, G4, A4, E5) + low drone
    const chordFrequencies = [130.81, 196.0, 261.63, 329.63, 440.0, 523.25];
    chordFrequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600 + idx * 80, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.08 / (idx + 1), now + 1.2 + idx * 0.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    // Repeating gentle chime sequence
    const pentatonicNotes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 659.25];
    let noteIdx = 0;
    this.timerId = window.setInterval(() => {
      if (!this._isPlaying || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const chime = this.ctx.createOscillator();
      const chimeGain = this.ctx.createGain();

      chime.type = 'sine';
      chime.frequency.setValueAtTime(pentatonicNotes[noteIdx % pentatonicNotes.length], t);
      noteIdx = (noteIdx + Math.floor(Math.random() * 3) + 1) % pentatonicNotes.length;

      chimeGain.gain.setValueAtTime(0.06, t);
      chimeGain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

      chime.connect(chimeGain);
      chimeGain.connect(this.masterGain);

      chime.start(t);
      chime.stop(t + 1.85);
    }, 1400);
  }

  private playLofiTape(ctx: AudioContext, now: number) {
    // Warm Rhodes style minor 7th chord with filter sweep
    const notes = [146.83, 220.0, 261.63, 349.23, 440.0]; // D3, A3, C4, F4, A4
    notes.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(450, now);
      filter.Q.setValueAtTime(2, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.07, now + 0.8);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    // Lo-Fi vinyl crackle simulation
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() < 0.015 ? (Math.random() * 2 - 1) * 0.08 : 0;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, now);
    noise.connect(noiseGain);
    noiseGain.connect(this.masterGain!);
    noise.start(now);
    this.activeNodes.push(noise as unknown as OscillatorNode, noiseGain);
  }

  private playAcousticStrings(ctx: AudioContext, now: number) {
    // Plucked string acoustic resonance
    const arpeggio = [164.81, 246.94, 329.63, 392.0, 493.88, 659.25]; // E, B, E, G, B, E
    let step = 0;
    this.timerId = window.setInterval(() => {
      if (!this._isPlaying || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(arpeggio[step % arpeggio.length], t);
      step = (step + 1) % arpeggio.length;

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);
      filter.frequency.exponentialRampToValueAtTime(200, t + 1.2);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.3);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 1.35);
    }, 700);

    // Warm deep bass root
    const root = ctx.createOscillator();
    const rootGain = ctx.createGain();
    root.type = 'sine';
    root.frequency.setValueAtTime(82.41, now); // E2
    rootGain.gain.setValueAtTime(0.09, now);
    root.connect(rootGain);
    rootGain.connect(this.masterGain!);
    root.start(now);
    this.activeNodes.push(root, rootGain);
  }

  private playNightJazz(ctx: AudioContext, now: number) {
    // Mellow nocturnal jazz chords (Major 9th / 11th)
    const jazzFrequencies = [116.54, 174.61, 220.0, 261.63, 329.63, 415.3]; // Bb2, F3, A3, C4, E4, Ab4
    jazzFrequencies.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400 + idx * 70, now);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.06, now + 1.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      this.activeNodes.push(osc, gain, filter);
    });

    // Walking upright bass
    const bassline = [116.54, 130.81, 146.83, 174.61];
    let bIdx = 0;
    this.timerId = window.setInterval(() => {
      if (!this._isPlaying || !this.ctx || !this.masterGain) return;
      const t = this.ctx.currentTime;
      const bass = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();

      bass.type = 'triangle';
      bass.frequency.setValueAtTime(bassline[bIdx % bassline.length], t);
      bIdx = (bIdx + 1) % bassline.length;

      bassGain.gain.setValueAtTime(0.1, t);
      bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

      bass.connect(bassGain);
      bassGain.connect(this.masterGain);

      bass.start(t);
      bass.stop(t + 0.95);
    }, 1100);
  }

  private playDeepDrone(ctx: AudioContext, now: number) {
    // 55Hz sub-bass dual-oscillator drone with slow LFO
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, now); // A1

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(55.4, now); // Slight detune for beating effect

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);
    filter.Q.setValueAtTime(4, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 1.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);

    osc1.start(now);
    osc2.start(now);
    this.activeNodes.push(osc1, osc2, filter, gain);
  }

  public getVisualizerData(): number[] {
    if (!this.analyser || !this._isPlaying) {
      return [10, 15, 8, 20, 12, 18, 14, 9];
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    const bars: number[] = [];
    const step = Math.max(1, Math.floor(data.length / 8));
    for (let i = 0; i < 8; i++) {
      const val = data[i * step] || 0;
      bars.push(Math.max(8, Math.min(100, Math.round((val / 255) * 100))));
    }
    return bars;
  }
}

export const musicAudioEngine = new MusicAudioEngine();
