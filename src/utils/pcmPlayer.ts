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

export function downloadPCMAsWav(base64Data: string, filename = "cephboy-motivation.wav", sampleRate = 24000) {
  try {
    const binary = atob(base64Data);
    const len = binary.length;
    const buffer = new ArrayBuffer(44 + len);
    const view = new DataView(buffer);

    const writeString = (view: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    /* RIFF identifier */
    writeString(view, 0, 'RIFF');
    /* file length = chunk size = 36 + data size */
    view.setUint32(4, 36 + len, true);
    /* RIFF type */
    writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (1 = raw PCM) */
    view.setUint16(20, 1, true);
    /* channel count (1 = mono) */
    view.setUint16(22, 1, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate = sampleRate * channels * bytesPerSample */
    view.setUint32(28, sampleRate * 2, true);
    /* block align = channels * bytesPerSample */
    view.setUint16(32, 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, len, true);

    // Write samples
    const bytes = new Uint8Array(buffer, 44);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generating WAV file for download:", err);
    alert("Impossible de générer le fichier audio pour le téléchargement.");
  }
}
