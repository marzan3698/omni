/**
 * Play a short notification sound (e.g. for new inbox message).
 * Uses Web Audio API so no asset file is required.
 */
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

export function playNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = 'sine';
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore errors (e.g. autoplay policy)
  }
}

/**
 * Play a longer, more noticeable notification sound (e.g. for new payment).
 */
export function playLongNotificationSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const playNote = (freq: number, start: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.connect(gain);
      gain.connect(ctx.destination);
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + start + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + start + duration);
      oscillator.start(ctx.currentTime + start);
      oscillator.stop(ctx.currentTime + start + duration);
    };

    // Play a sequence of notes
    playNote(880, 0, 0.4);
    playNote(1100, 0.5, 0.4);
    playNote(880, 1.0, 0.4);
    playNote(1100, 1.5, 0.4);
  } catch {
    // Ignore
  }
}
