/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlaybackSession {
  source: AudioBufferSourceNode;
  ctx: AudioContext;
  gainNode: GainNode;
  stop: () => void;
}

export function playRawPCM(base64Data: string, sampleRate = 24000, onEnded?: () => void): PlaybackSession | null {
  try {
    const binary = atob(base64Data);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // Convert 16-bit Int16 samples (2 bytes each) to Float32 [-1.0, 1.0] expected by Web Audio
    const int16Buffer = new Int16Array(bytes.buffer);
    const float32Buffer = new Float32Array(int16Buffer.length);
    for (let i = 0; i < int16Buffer.length; i++) {
      float32Buffer[i] = int16Buffer[i] / 32768.0;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx({ sampleRate });
    
    // Create mono audio buffer
    const audioBuffer = ctx.createBuffer(1, float32Buffer.length, sampleRate);
    audioBuffer.copyToChannel(float32Buffer, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    source.connect(gainNode);
    gainNode.connect(ctx.destination);

    source.onended = () => {
      if (onEnded) {
        onEnded();
      }
    };

    source.start(0);

    return {
      source,
      ctx,
      gainNode,
      stop: () => {
        try {
          // Fade out to prevent popping before stopping
          gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
          gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
          setTimeout(() => {
            try { source.stop(); } catch (e) {}
            try { ctx.close(); } catch (e) {}
          }, 160);
        } catch (err) {
          console.error("Failed to stop AudioSourceNode:", err);
        }
      }
    };
  } catch (err) {
    console.error("Failed to parse and play raw PCM audio:", err);
    return null;
  }
}
