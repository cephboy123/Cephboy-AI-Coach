/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export class EpicAmbientSynth {
  private ctx: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  start() {
    if (this.isPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      // Bring in warmth slowly to prevent popping sounds
      this.gainNode.gain.linearRampToValueAtTime(0.06, this.ctx.currentTime + 3.0);

      // Bass drone fundamental (C2 - 65.41 Hz) - deep grounding
      this.addOscillator(65.41, 'sine', 0.6);
      
      // Perfect fifth (G2 - 98.00 Hz) - spacious interval
      this.addOscillator(98.00, 'triangle', 0.3);
      
      // Deep spiritual Minor Third (Eb3 - 155.56 Hz) - emotional gravity
      this.addOscillator(155.56, 'sine', 0.25);
      
      // Warm octave higher (C3 - 130.81 Hz)
      this.addOscillator(130.81, 'triangle', 0.2);

      this.gainNode.connect(this.ctx.destination);
      this.isPlaying = true;
    } catch (e) {
      console.error("Failed to start epic ambient synthesizer:", e);
    }
  }

  private addOscillator(freq: number, type: OscillatorType, volume: number) {
    if (!this.ctx || !this.gainNode) return;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();

    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    osc.type = type;

    // Slight detune for a lush chorus sound
    osc.detune.setValueAtTime((Math.random() - 0.5) * 8, this.ctx.currentTime);

    // Filter to suppress high frequencies and keep the tone warm, dark, and organic
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2.5, this.ctx.currentTime);

    const oscGain = this.ctx.createGain();
    oscGain.gain.setValueAtTime(volume, this.ctx.currentTime);

    // Slow breath-like modulation (LFO)
    lfo.frequency.setValueAtTime(0.08 + Math.random() * 0.12, this.ctx.currentTime);
    lfoGain.gain.setValueAtTime(volume * 0.45, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(oscGain.gain);
    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.gainNode);

    osc.start();
    lfo.start();

    this.oscillators.push(osc, lfo);
  }

  stop() {
    if (!this.isPlaying) return;
    const prevGain = this.gainNode;
    const prevCtx = this.ctx;
    const prevOscs = this.oscillators;

    if (prevGain && prevCtx) {
      // Fade out slowly over 2 seconds
      prevGain.gain.setValueAtTime(prevGain.gain.value, prevCtx.currentTime);
      prevGain.gain.linearRampToValueAtTime(0, prevCtx.currentTime + 2.0);
      
      setTimeout(() => {
        prevOscs.forEach(o => {
          try { o.stop(); } catch (e) {}
        });
        try { prevCtx.close(); } catch (e) {}
      }, 2100);
    }

    this.oscillators = [];
    this.gainNode = null;
    this.ctx = null;
    this.isPlaying = false;
  }

  getIsPlaying() {
    return this.isPlaying;
  }
}
