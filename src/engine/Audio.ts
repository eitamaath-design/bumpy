// Procedural Retro Web Audio Synthesizer for Bumpy

import { ItemType } from './Types';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMutedSound: boolean = false;
  private isMutedMusic: boolean = false;
  private musicInterval: number | null = null;
  private isMusicPlaying: boolean = false;
  private musicBeat: number = 0;

  constructor() {
    this.isMutedSound = localStorage.getItem('bumpy_sfx_muted') === 'true';
    this.isMutedMusic = localStorage.getItem('bumpy_music_muted') === 'true';
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.value = this.isMutedMusic ? 0 : 0.25;
      this.sfxGain.gain.value = this.isMutedSound ? 0 : 0.35;

      this.musicGain.connect(this.ctx.destination);
      this.sfxGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public unlockAudio() {
    this.initCtx();
  }

  public toggleSound(): boolean {
    this.isMutedSound = !this.isMutedSound;
    localStorage.setItem('bumpy_sfx_muted', String(this.isMutedSound));
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setValueAtTime(this.isMutedSound ? 0 : 0.35, this.ctx.currentTime);
    }
    return !this.isMutedSound;
  }

  public toggleMusic(): boolean {
    this.isMutedMusic = !this.isMutedMusic;
    localStorage.setItem('bumpy_music_muted', String(this.isMutedMusic));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setValueAtTime(this.isMutedMusic ? 0 : 0.25, this.ctx.currentTime);
    }
    if (!this.isMutedMusic && !this.isMusicPlaying) {
      this.startMusic();
    }
    return !this.isMutedMusic;
  }

  public isSoundOn(): boolean {
    return !this.isMutedSound;
  }

  public isMusicOn(): boolean {
    return !this.isMutedMusic;
  }

  // --- Sound Effects ---

  public playBounce(isHigh: boolean = false) {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    if (isHigh) {
      // Super bounce: higher pitch spring
      osc.frequency.setValueAtTime(260, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.15);
      osc.frequency.exponentialRampToValueAtTime(320, t + 0.28);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.3);
    } else {
      // Normal boing
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(360, t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(220, t + 0.2);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.22);
    }
  }

  public playSpring() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.35);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.38);
  }

  public playPickup(type: ItemType) {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;

    if (type === 'diamond' || type === 'extra_life') {
      // Arpeggio chime
      const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      freqs.forEach((freq, idx) => {
        if (!this.ctx || !this.sfxGain) return;
        const noteOsc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        noteOsc.type = 'sine';
        noteOsc.frequency.setValueAtTime(freq, t + idx * 0.05);
        noteGain.gain.setValueAtTime(0.25, t + idx * 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.2);
        noteOsc.connect(noteGain);
        noteGain.connect(this.sfxGain);
        noteOsc.start(t + idx * 0.05);
        noteOsc.stop(t + idx * 0.05 + 0.2);
      });
    } else if (type === 'water_drop') {
      // Splashy bubble chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.18);
    } else if (type === 'hammer') {
      // Metallic pickup clink
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(900, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } else {
      // Standard bright fruit chime
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, t); // D5
      osc.frequency.setValueAtTime(880, t + 0.08); // A5
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.2);
    }
  }

  public playBreak() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Low pop + noise crack
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.15);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playExtinguish() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    // Steam hiss simulation using white noise buffer
    const bufferSize = this.ctx.sampleRate * 0.25;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2400;
    filter.Q.value = 1.8;

    const gain = this.ctx.createGain();
    const t = this.ctx.currentTime;
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
    noise.stop(t + 0.25);
  }

  public playHammerSmash() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);
    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  public playTeleport() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.12);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.25);
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.28);
  }

  public playUnlock() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);
      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.18);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.18);
    });
  }

  public playDoorOpen() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Ascending triumph cue: G4, C5, E5, G5
    const notes = [392.0, 523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t + idx * 0.09);
      gain.gain.setValueAtTime(0.25, t + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.09 + 0.22);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + idx * 0.09);
      osc.stop(t + idx * 0.09 + 0.22);
    });
  }

  public playDeath() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.45);
    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.5);
  }

  public playLevelClear() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    // Classic victory jingle
    const fanfare = [
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 523.25, d: 0.12 }, // C5
      { f: 659.25, d: 0.25 }, // E5
      { f: 783.99, d: 0.25 }, // G5
      { f: 1046.5, d: 0.45 }  // C6
    ];

    let delay = 0;
    fanfare.forEach((n) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, t + delay);
      gain.gain.setValueAtTime(0.35, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + n.d);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + n.d);
      delay += n.d * 0.95;
    });
  }

  public playGameOver() {
    if (this.isMutedSound) return;
    this.initCtx();
    if (!this.ctx || !this.sfxGain) return;

    const t = this.ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23];
    let delay = 0;
    notes.forEach((freq) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + delay);
      gain.gain.setValueAtTime(0.3, t + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.35);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t + delay);
      osc.stop(t + delay + 0.35);
      delay += 0.28;
    });
  }

  // --- Chiptune Background Music Generator ---

  public startMusic() {
    if (this.isMusicPlaying) return;
    this.initCtx();
    this.isMusicPlaying = true;
    this.musicBeat = 0;

    // 130 BPM Chiptune Loop
    // Melody notes (pentatonic arcade riff)
    const melody = [
      261.63, 0, 329.63, 392.00, 523.25, 392.00, 329.63, 0,
      293.66, 0, 349.23, 440.00, 587.33, 440.00, 349.23, 0,
      329.63, 392.00, 523.25, 659.25, 523.25, 392.00, 329.63, 0,
      392.00, 329.63, 293.66, 261.63, 293.66, 0, 261.63, 0
    ];

    // Bassline
    const bass = [
      130.81, 130.81, 130.81, 130.81, 146.83, 146.83, 146.83, 146.83,
      164.81, 164.81, 164.81, 164.81, 130.81, 130.81, 196.00, 130.81
    ];

    const stepMs = 135; // ~111 BPM 16th notes

    this.musicInterval = window.setInterval(() => {
      if (this.isMutedMusic || !this.ctx || !this.musicGain) {
        this.musicBeat++;
        return;
      }

      const t = this.ctx.currentTime;
      const melNote = melody[this.musicBeat % melody.length];
      const bassNote = bass[Math.floor(this.musicBeat / 2) % bass.length];

      // Play Melody
      if (melNote > 0) {
        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        melOsc.type = 'square';
        melOsc.frequency.setValueAtTime(melNote, t);
        melGain.gain.setValueAtTime(0.12, t);
        melGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);
        melOsc.connect(melGain);
        melGain.connect(this.musicGain);
        melOsc.start(t);
        melOsc.stop(t + 0.11);
      }

      // Play Bass
      if (this.musicBeat % 2 === 0 && bassNote > 0) {
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = 'triangle';
        bassOsc.frequency.setValueAtTime(bassNote, t);
        bassGain.gain.setValueAtTime(0.2, t);
        bassGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        bassOsc.connect(bassGain);
        bassGain.connect(this.musicGain);
        bassOsc.start(t);
        bassOsc.stop(t + 0.22);
      }

      // Snare / Hat percussion simulation
      if (this.musicBeat % 4 === 2) {
        // High hat tick
        const tickOsc = this.ctx.createOscillator();
        const tickGain = this.ctx.createGain();
        tickOsc.type = 'sawtooth';
        tickOsc.frequency.setValueAtTime(1200, t);
        tickGain.gain.setValueAtTime(0.04, t);
        tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        tickOsc.connect(tickGain);
        tickGain.connect(this.musicGain);
        tickOsc.start(t);
        tickOsc.stop(t + 0.04);
      }

      this.musicBeat++;
    }, stepMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const audio = new AudioManager();
