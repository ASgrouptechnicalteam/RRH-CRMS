/**
 * useNotificationSound.ts
 * 
 * Generates and plays notification sounds using the Web Audio API.
 * No external audio files needed — all sounds are synthesized.
 * 
 * User preference is stored in localStorage under 'rrh_notif_sound'.
 */

export type NotificationTone = 'chime' | 'ding' | 'alert' | 'pop' | 'none';

const STORAGE_KEY = 'rrh_notif_sound';

export function getStoredTone(): NotificationTone {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['chime', 'ding', 'alert', 'pop', 'none'].includes(stored)) {
      return stored as NotificationTone;
    }
  } catch {}
  return 'chime';
}

export function setStoredTone(tone: NotificationTone) {
  try {
    localStorage.setItem(STORAGE_KEY, tone);
  } catch {}
}

/** Play a notification sound using the Web Audio API */
export function playNotificationSound(tone: NotificationTone): void {
  if (tone === 'none') return;

  try {
    const ctx = new AudioContext();

    const play = () => {
      switch (tone) {
        case 'chime':
          playChime(ctx);
          break;
        case 'ding':
          playDing(ctx);
          break;
        case 'alert':
          playAlert(ctx);
          break;
        case 'pop':
          playPop(ctx);
          break;
      }
    };

    // AudioContext may be suspended on first interaction
    if (ctx.state === 'suspended') {
      ctx.resume().then(play);
    } else {
      play();
    }
  } catch (e) {
    // Web Audio not supported — silent fallback
    console.warn('[NotifSound] Web Audio API not available');
  }
}

// ─── Sound Synthesizers ───────────────────────────────────────────────────────

function playChime(ctx: AudioContext) {
  // Two-note ascending chime (C5 → E5)
  const notes = [523.25, 659.25];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = freq;
    const startTime = ctx.currentTime + i * 0.15;
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6);
    osc.start(startTime);
    osc.stop(startTime + 0.7);
  });
}

function playDing(ctx: AudioContext) {
  // Single pure bell-like tone
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.value = 880; // A5
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.9);
}

function playAlert(ctx: AudioContext) {
  // Two quick beeps
  [0, 0.2].forEach(offset => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'square';
    osc.frequency.value = 660;
    const t = ctx.currentTime + offset;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.01);
    gain.gain.linearRampToValueAtTime(0, t + 0.12);
    osc.start(t);
    osc.stop(t + 0.15);
  });
}

function playPop(ctx: AudioContext) {
  // Soft pop with pitch sweep down
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.25);
}
