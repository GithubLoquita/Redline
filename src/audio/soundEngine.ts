/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GameSettings } from '../types';

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  // Master Gain
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private motorGain: GainNode | null = null;

  // Motor Synthesizer Nodes
  private motorOsc1: OscillatorNode | null = null;
  private motorOsc2: OscillatorNode | null = null;
  private motorSubOsc: OscillatorNode | null = null;
  private motorFilter: BiquadFilterNode | null = null;
  private motorRunning = false;

  // Tire Squeal Nodes
  private squealSource: AudioBufferSourceNode | null = null;
  private squealGain: GainNode | null = null;
  private squealFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  // Nitro Sound Nodes
  private nitroGain: GainNode | null = null;
  private nitroNoiseSource: AudioBufferSourceNode | null = null;
  private isNitroPlaying = false;

  // Rain Sound Nodes
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;

  // Settings
  private settings: GameSettings = {
    graphicsQuality: 'HIGH',
    speedUnit: 'KMH',
    steeringSensitivity: 1.0,
    steeringAssist: true,
    trafficDensity: 'NORMAL',
    weather: 'AUTO_DIFFICULTY',
    shadows: true,
    particles: true,
    reducedMotion: false,
    highContrastHUD: false,
    masterVolume: 0.8,
    sfxVolume: 0.8,
    motorVolume: 0.7,
    isMuted: false,
  };

  public init() {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master bus
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // SFX bus
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.connect(this.masterGain);

      // Motor bus
      this.motorGain = this.ctx.createGain();
      this.motorGain.connect(this.masterGain);

      this.createNoiseBuffer();
      this.setupMotorSynth();
      this.setupTireSqueal();
      this.setupRainSound();

      this.applySettings(this.settings);
      this.isInitialized = true;
    } catch (err) {
      console.warn('Web Audio API not supported or blocked', err);
    }
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  private setupMotorSynth() {
    if (!this.ctx || !this.motorGain) return;

    // Dual high-tech electric motor whine: Sawtooth + Sine harmonic
    this.motorOsc1 = this.ctx.createOscillator();
    this.motorOsc1.type = 'sawtooth';
    this.motorOsc1.frequency.setValueAtTime(60, this.ctx.currentTime);

    this.motorOsc2 = this.ctx.createOscillator();
    this.motorOsc2.type = 'sine';
    this.motorOsc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.motorSubOsc = this.ctx.createOscillator();
    this.motorSubOsc.type = 'triangle';
    this.motorSubOsc.frequency.setValueAtTime(30, this.ctx.currentTime);

    this.motorFilter = this.ctx.createBiquadFilter();
    this.motorFilter.type = 'lowpass';
    this.motorFilter.frequency.setValueAtTime(350, this.ctx.currentTime);
    this.motorFilter.Q.setValueAtTime(4.0, this.ctx.currentTime);

    const oscMixGain = this.ctx.createGain();
    oscMixGain.gain.setValueAtTime(0.3, this.ctx.currentTime);

    this.motorOsc1.connect(this.motorFilter);
    this.motorOsc2.connect(this.motorFilter);
    this.motorSubOsc.connect(this.motorFilter);
    this.motorFilter.connect(this.motorGain);

    try {
      this.motorOsc1.start();
      this.motorOsc2.start();
      this.motorSubOsc.start();
      this.motorRunning = true;
    } catch (e) {
      console.warn('Motor start deferral', e);
    }
  }

  private setupTireSqueal() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;

    this.squealFilter = this.ctx.createBiquadFilter();
    this.squealFilter.type = 'bandpass';
    this.squealFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
    this.squealFilter.Q.setValueAtTime(5, this.ctx.currentTime);

    this.squealGain = this.ctx.createGain();
    this.squealGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.squealFilter.connect(this.squealGain);
    this.squealGain.connect(this.sfxGain);

    this.startNoiseLoop();
  }

  private startNoiseLoop() {
    if (!this.ctx || !this.noiseBuffer || !this.squealFilter) return;
    try {
      this.squealSource = this.ctx.createBufferSource();
      this.squealSource.buffer = this.noiseBuffer;
      this.squealSource.loop = true;
      this.squealSource.connect(this.squealFilter);
      this.squealSource.start();
    } catch {
      // Audio node recycled
    }
  }

  public updateMotor(speedRatio: number, isAccelerating: boolean) {
    if (!this.ctx || !this.isInitialized || !this.motorOsc1 || !this.motorOsc2 || !this.motorSubOsc || !this.motorFilter || !this.motorGain) {
      return;
    }

    const t = this.ctx.currentTime;
    const clampedRatio = Math.max(0, Math.min(1.2, speedRatio));

    // Electric motor pitch: 70Hz idle up to 880Hz at top speed
    const baseFreq = 70 + Math.pow(clampedRatio, 1.3) * 650;
    this.motorOsc1.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.motorOsc2.frequency.setTargetAtTime(baseFreq * 2.01, t, 0.08);
    this.motorSubOsc.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.08);

    // Motor filter cutoff opens up under acceleration
    const cutoff = 300 + clampedRatio * 2800 + (isAccelerating ? 800 : 0);
    this.motorFilter.frequency.setTargetAtTime(cutoff, t, 0.06);

    // Volume dynamically scales with throttle and speed
    const vol = this.settings.isMuted
      ? 0
      : (0.15 + clampedRatio * 0.45 + (isAccelerating ? 0.2 : 0)) * this.settings.motorVolume * this.settings.masterVolume;
    this.motorGain.gain.setTargetAtTime(vol, t, 0.05);
  }

  public updateTireSqueal(slipRatio: number) {
    if (!this.ctx || !this.squealGain || !this.squealFilter) return;
    const t = this.ctx.currentTime;
    const clampedSlip = Math.max(0, Math.min(1, slipRatio));

    const squealVol = this.settings.isMuted
      ? 0
      : clampedSlip > 0.15
      ? (clampedSlip - 0.15) * 0.7 * this.settings.sfxVolume * this.settings.masterVolume
      : 0;

    this.squealGain.gain.setTargetAtTime(squealVol, t, 0.04);
    if (this.squealFilter) {
      this.squealFilter.frequency.setTargetAtTime(1000 + clampedSlip * 800, t, 0.05);
    }
  }

  public playCollisionSound(intensity: number = 1.0) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;

    try {
      const t = this.ctx.currentTime;
      const i = Math.min(1.5, Math.max(0.3, intensity));

      // 1. Deep low-frequency thud
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(25, t + 0.35);

      const impactVol = 0.8 * i * this.settings.sfxVolume * this.settings.masterVolume;
      oscGain.gain.setValueAtTime(impactVol, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.45);

      // 2. High-frequency metal crunch / noise burst
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2200, t);
        filter.frequency.exponentialRampToValueAtTime(400, t + 0.25);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.6 * i * this.settings.sfxVolume * this.settings.masterVolume, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 0.35);
      }
    } catch (e) {
      console.warn('Crash sound error', e);
    }
  }

  public playNitroSound(active: boolean) {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;

    if (active && !this.isNitroPlaying) {
      this.isNitroPlaying = true;
      if (!this.noiseBuffer) return;

      const nitroSource = this.ctx.createBufferSource();
      nitroSource.buffer = this.noiseBuffer;
      nitroSource.loop = true;

      const nitroFilter = this.ctx.createBiquadFilter();
      nitroFilter.type = 'bandpass';
      nitroFilter.frequency.setValueAtTime(1800, t);
      nitroFilter.Q.setValueAtTime(2.5, t);

      const gain = this.ctx.createGain();
      const targetVol = this.settings.isMuted
        ? 0
        : 0.5 * this.settings.sfxVolume * this.settings.masterVolume;
      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(targetVol, t + 0.15);

      nitroSource.connect(nitroFilter);
      nitroFilter.connect(gain);
      gain.connect(this.sfxGain);

      this.nitroNoiseSource = nitroSource;
      this.nitroGain = gain;
      nitroSource.start(t);

      // Add a rising energetic synth tone
      const boostOsc = this.ctx.createOscillator();
      const boostGain = this.ctx.createGain();
      boostOsc.type = 'sawtooth';
      boostOsc.frequency.setValueAtTime(220, t);
      boostOsc.frequency.exponentialRampToValueAtTime(880, t + 0.3);
      boostGain.gain.setValueAtTime(targetVol * 0.4, t);
      boostGain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);

      boostOsc.connect(boostGain);
      boostGain.connect(this.sfxGain);
      boostOsc.start(t);
      boostOsc.stop(t + 0.55);
    } else if (!active && this.isNitroPlaying) {
      this.isNitroPlaying = false;
      if (this.nitroGain && this.nitroNoiseSource) {
        this.nitroGain.gain.linearRampToValueAtTime(0.001, t + 0.15);
        try {
          this.nitroNoiseSource.stop(t + 0.18);
        } catch {}
        this.nitroNoiseSource = null;
        this.nitroGain = null;
      }
    }
  }

  public playNearMiss() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // High-tech electronic chord ping (E6 + G#6)
      const freqs = [1318.5, 1661.2];
      freqs.forEach((f) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t);

        const vol = 0.25 * this.settings.sfxVolume * this.settings.masterVolume;
        gain.gain.setValueAtTime(vol, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(t);
        osc.stop(t + 0.4);
      });
    } catch {}
  }

  public playCountdown(isFinal: boolean = false) {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = isFinal ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(isFinal ? 1760 : 880, t);

      const vol = 0.45 * this.settings.sfxVolume * this.settings.masterVolume;
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + (isFinal ? 0.6 : 0.25));

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + (isFinal ? 0.65 : 0.3));
    } catch {}
  }

  public playUIClick() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, t); // B5
      osc.frequency.exponentialRampToValueAtTime(493.88, t + 0.05);

      gain.gain.setValueAtTime(0.15 * this.settings.sfxVolume * this.settings.masterVolume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.07);
    } catch {}
  }

  public playCheckpointPass() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      const notes = [587.33, 880, 1174.66]; // D5, A5, D6 arpeggio
      notes.forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        const start = t + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3 * this.settings.sfxVolume * this.settings.masterVolume, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);

        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }

  private setupRainSound() {
    if (!this.ctx || !this.sfxGain || !this.noiseBuffer) return;
    this.rainFilter = this.ctx.createBiquadFilter();
    this.rainFilter.type = 'lowpass';
    this.rainFilter.frequency.setValueAtTime(1400, this.ctx.currentTime);
    this.rainFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rainFilter.connect(this.rainGain);
    this.rainGain.connect(this.sfxGain);

    try {
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = this.noiseBuffer;
      this.rainSource.loop = true;
      this.rainSource.connect(this.rainFilter);
      this.rainSource.start();
    } catch {}
  }

  public updateRain(intensity: number) {
    if (!this.ctx || !this.rainGain) return;
    const t = this.ctx.currentTime;
    const vol = this.settings.isMuted
      ? 0
      : Math.max(0, Math.min(1, intensity)) * 0.42 * this.settings.sfxVolume * this.settings.masterVolume;
    this.rainGain.gain.setTargetAtTime(vol, t, 0.1);
  }

  public playThunder() {
    if (!this.ctx || !this.sfxGain || this.settings.isMuted) return;
    try {
      const t = this.ctx.currentTime;
      // Deep low frequency rumble
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(55, t);
      osc.frequency.exponentialRampToValueAtTime(18, t + 1.8);

      const vol = 0.7 * this.settings.sfxVolume * this.settings.masterVolume;
      oscGain.gain.setValueAtTime(vol, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + 2.0);

      osc.connect(oscGain);
      oscGain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 2.1);

      // Lowpass rumble noise burst
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(280, t);
        filter.frequency.linearRampToValueAtTime(80, t + 2.2);

        const nGain = this.ctx.createGain();
        nGain.gain.setValueAtTime(vol * 0.6, t);
        nGain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

        noise.connect(filter);
        filter.connect(nGain);
        nGain.connect(this.sfxGain);
        noise.start(t);
        noise.stop(t + 2.3);
      }
    } catch {}
  }

  public applySettings(settings: GameSettings) {
    this.settings = { ...settings };
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const masterVal = this.settings.isMuted ? 0 : this.settings.masterVolume;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(masterVal, t, 0.05);
    }
  }

  public stopAll() {
    this.playNitroSound(false);
    if (this.squealGain) {
      this.squealGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    if (this.motorGain) {
      this.motorGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    if (this.rainGain) {
      this.rainGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
  }
}

export const soundEngine = new SoundEngine();
