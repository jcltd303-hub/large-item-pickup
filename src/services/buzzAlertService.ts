/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Generates an unmistakable, authentic alert buzz sound using Web Audio API synthesis.
 * Works on all desktop and mobile browsers without requiring external audio files.
 */
export function playBuzzSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Pattern: 3 rapid aggressive buzz pulses
    [0, 0.22, 0.44].forEach((startTimeOffset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sawtooth/square combination creates the "buzz" texture
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now + startTimeOffset);
      osc.frequency.linearRampToValueAtTime(110, now + startTimeOffset + 0.16);

      // Volume envelope
      gain.gain.setValueAtTime(0, now + startTimeOffset);
      gain.gain.linearRampToValueAtTime(0.45, now + startTimeOffset + 0.02);
      gain.gain.setValueAtTime(0.45, now + startTimeOffset + 0.12);
      gain.gain.linearRampToValueAtTime(0, now + startTimeOffset + 0.16);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + startTimeOffset);
      osc.stop(now + startTimeOffset + 0.18);
    });
  } catch (err) {
    console.warn('Audio buzz playback error:', err);
  }
}

/**
 * Triggers hardware haptic vibration if supported by mobile device
 */
export function triggerHapticBuzz() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      // 3 assertive vibration pulses: buzz-buzz-buuuzzz
      navigator.vibrate([200, 80, 200, 80, 400]);
    } catch (e) {
      // Ignore vibration errors
    }
  }
}

/**
 * Triggers the full alert: haptic buzz + audio buzz
 */
export function triggerBuzzAlert() {
  playBuzzSound();
  triggerHapticBuzz();
}
