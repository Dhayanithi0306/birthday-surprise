export function playSparklerSound(volume: number): (() => void) | undefined {
  if (volume <= 0 || typeof window.AudioContext === 'undefined') return;
  let context: AudioContext;
  try {
    context = new AudioContext();
    const master = context.createGain(); master.gain.value = Math.min(0.32, volume * 0.32); master.connect(context.destination);
    const noise = context.createBufferSource(); const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const channel = buffer.getChannelData(0); for (let i = 0; i < channel.length; i++) channel[i] = (Math.random() * 2 - 1) * 0.32;
    noise.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = 'bandpass'; filter.frequency.value = 3600; filter.Q.value = 0.65;
    const envelope = context.createGain(); envelope.gain.setValueAtTime(0, context.currentTime); envelope.gain.linearRampToValueAtTime(0.19, context.currentTime + 0.12); envelope.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 1.7);
    noise.connect(filter); filter.connect(envelope); envelope.connect(master); noise.start(); noise.stop(context.currentTime + 1.8);
    for (let i = 0; i < 13; i++) {
      const oscillator = context.createOscillator(); const sparkle = context.createGain(); const start = context.currentTime + 0.08 + Math.random() * 1.2;
      oscillator.type = 'sine'; oscillator.frequency.value = 1400 + Math.random() * 2500;
      sparkle.gain.setValueAtTime(0.0001, start); sparkle.gain.exponentialRampToValueAtTime(0.045, start + 0.008); sparkle.gain.exponentialRampToValueAtTime(0.0001, start + 0.11);
      oscillator.connect(sparkle); sparkle.connect(master); oscillator.start(start); oscillator.stop(start + 0.13);
    }
    window.setTimeout(() => { void context.close().catch(() => undefined); }, 2200);
    return () => { if (context.state !== 'closed') void context.close().catch(() => undefined); };
  } catch { return; }
}
