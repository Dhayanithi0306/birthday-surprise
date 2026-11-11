import { useCallback, useEffect, useRef, useState } from 'react';

export const blowDetectionConfig = {
  calibrationMs: 1800,
  minimumRms: 0.035,
  baselineMultiplier: 3.2,
  minimumDurationMs: 240,
  cooldownMs: 2200,
  minimumHighFrequencyRatio: 0.48,
  minimumSpectralFlatness: 0.34,
  maximumSpectralFlatness: 0.96,
};

export type MicrophoneStatus = 'waiting' | 'requesting' | 'calibrating' | 'ready' | 'listening' | 'celebrated' | 'denied' | 'unavailable' | 'error' | 'cancelled';
type BlowOptions = { active: boolean; onBlow: () => void };

export function useMicrophoneBlowDetection({ active, onBlow }: BlowOptions) {
  const [status, setStatus] = useState<MicrophoneStatus>('waiting');
  const [level, setLevel] = useState(0);
  const [message, setMessage] = useState('');
  const resources = useRef<{ stream?: MediaStream; context?: AudioContext; frame?: number }>({});
  const callback = useRef(onBlow);
  const locked = useRef(false);
  const requestingPermission = useRef(false);
  callback.current = onBlow;

  const stop = useCallback((next: MicrophoneStatus = 'cancelled') => {
    locked.current = true;
    const current = resources.current;
    if (current.frame !== undefined) cancelAnimationFrame(current.frame);
    current.stream?.getTracks().forEach(track => track.stop());
    if (current.context && current.context.state !== 'closed') void current.context.close().catch(() => undefined);
    resources.current = {};
    setLevel(0);
    setStatus(previous => previous === 'celebrated' ? previous : requestingPermission.current ? 'requesting' : next);
    if (requestingPermission.current) setMessage('The browser microphone prompt is still open. Choose Allow or Block there to finish this request.');
  }, []);

  const start = useCallback(async () => {
    if (requestingPermission.current || resources.current.stream) return;
    // `locked` is also set by the inactive-screen cleanup. An explicit user
    // click starts a fresh session, so unlock before checking/creating it.
    locked.current = false;
    requestingPermission.current = true;
    setMessage(''); setLevel(0); setStatus('requesting');
    if (!window.isSecureContext) {
      requestingPermission.current = false; setStatus('unavailable');
      setMessage('Microphone access requires a secure page. Open this site using HTTPS or localhost.'); return;
    }
    if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
      requestingPermission.current = false; setStatus('unavailable');
      setMessage('This browser does not provide microphone access here. Try a current browser over HTTPS, or use the manual option.'); return;
    }
    let stream: MediaStream;
    try {
      // Keep this call in the click handler's synchronous turn so the browser
      // can present its permission prompt. No stream is requested elsewhere.
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    } catch (cause) {
      requestingPermission.current = false;
      const errorName = cause instanceof DOMException ? cause.name : cause instanceof Error ? cause.name : '';
      console.error('Microphone permission request failed:', cause);
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError' || errorName === 'SecurityError') {
        setStatus('denied'); setMessage('Microphone permission denied. Allow access in your browser settings, or use the manual option.');
      } else if (errorName === 'NotFoundError' || errorName === 'DevicesNotFoundError') {
        setStatus('unavailable'); setMessage('No microphone was found. Connect one or use the manual option.');
      } else if (errorName === 'NotReadableError' || errorName === 'TrackStartError') {
        setStatus('unavailable'); setMessage('The microphone is busy or unavailable to this page. Close other apps using it and retry.');
      } else {
        setStatus('error'); setMessage(`Microphone could not start${errorName ? ` (${errorName})` : ''}. Check browser permissions and try again.`);
      }
      return;
    }
    requestingPermission.current = false;
    if (locked.current) { stream.getTracks().forEach(track => track.stop()); setStatus('cancelled'); setMessage('Microphone access was not started because the request was cancelled.'); return; }
    if (typeof window.AudioContext === 'undefined') {
      stream.getTracks().forEach(track => track.stop()); setStatus('error');
      setMessage('Microphone access was granted, but Web Audio is unavailable in this browser. Use the manual option.'); return;
    }
    let audioContext: AudioContext | undefined;
    try {
      const context = new AudioContext(); audioContext = context;
      resources.current = { stream, context };
      if (context.state === 'suspended') await context.resume();
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser(); analyser.fftSize = 2048; analyser.smoothingTimeConstant = 0.15;
      source.connect(analyser);
      const timeData = new Float32Array(analyser.fftSize);
      const frequencyData = new Uint8Array(analyser.frequencyBinCount);
      setStatus('calibrating');
      const baselineSamples: number[] = [];
      let calibrationEnd = 0; let blowStarted = 0; let cooldownEnd = 0; let lastUiUpdate = 0; let readyAnnounced = false;
      const analyse = (now: number) => {
        if (locked.current || context.state === 'closed') return;
        analyser.getFloatTimeDomainData(timeData);
        let sumSquares = 0;
        for (const sample of timeData) sumSquares += sample * sample;
        const rms = Math.sqrt(sumSquares / timeData.length);
        analyser.getByteFrequencyData(frequencyData);
        let total = 0; let high = 0; let logSum = 0; let positiveBins = 0; let amplitudeSum = 0;
        for (let i = 1; i < frequencyData.length; i++) {
          const value = frequencyData[i] / 255; const energy = value * value;
          total += energy; if (i * context.sampleRate / analyser.fftSize > 700) high += energy;
          if (value > 0.002) { logSum += Math.log(value); amplitudeSum += value; positiveBins++; }
        }
        const highRatio = total ? high / total : 0;
        const arithmetic = positiveBins ? amplitudeSum / positiveBins : 0;
        const flatness = arithmetic > 0 && positiveBins ? Math.exp(logSum / positiveBins) / arithmetic : 0;
        if (now - lastUiUpdate > 45) { setLevel(Math.min(1, rms * 8)); lastUiUpdate = now; }
        if (!calibrationEnd) calibrationEnd = now + blowDetectionConfig.calibrationMs;
        if (now < calibrationEnd) {
          if (baselineSamples.length < 48) baselineSamples.push(rms);
          resources.current.frame = requestAnimationFrame(analyse); return;
        }
        const baseline = baselineSamples.length ? baselineSamples.reduce((a, b) => a + b, 0) / baselineSamples.length : 0.008;
        if (!readyAnnounced) { setStatus('ready'); readyAnnounced = true; }
        const threshold = Math.max(blowDetectionConfig.minimumRms, baseline * blowDetectionConfig.baselineMultiplier);
        const puff = rms > threshold && highRatio >= blowDetectionConfig.minimumHighFrequencyRatio && flatness >= blowDetectionConfig.minimumSpectralFlatness && flatness <= blowDetectionConfig.maximumSpectralFlatness;
        if (puff && now >= cooldownEnd) { if (!blowStarted) { blowStarted = now; setStatus('listening'); } if (now - blowStarted >= blowDetectionConfig.minimumDurationMs) { locked.current = true; cooldownEnd = now + blowDetectionConfig.cooldownMs; setLevel(0); setStatus('celebrated'); stream.getTracks().forEach(track => track.stop()); void context.close().catch(() => undefined); resources.current = {}; callback.current(); return; } }
        else { const wasBlowing = blowStarted > 0; blowStarted = 0; if (wasBlowing) setStatus('ready'); }
        resources.current.frame = requestAnimationFrame(analyse);
      };
      resources.current.frame = requestAnimationFrame(analyse);
      for (const track of stream.getTracks()) track.addEventListener('ended', () => { if (!locked.current) { setStatus('unavailable'); setMessage('The microphone session ended. Restart it or use the manual option.'); stop('unavailable'); } }, { once: true });
    } catch (cause) {
      console.error('Microphone audio analyzer initialization failed:', cause);
      stream.getTracks().forEach(track => track.stop());
      if (audioContext && audioContext.state !== 'closed') void audioContext.close().catch(() => undefined);
      resources.current = {};
      setStatus('error'); setMessage('Could not start microphone audio. Try again or use the manual option.');
    }
  }, [stop]);

  useEffect(() => () => { locked.current = true; const current = resources.current; if (current.frame !== undefined) cancelAnimationFrame(current.frame); current.stream?.getTracks().forEach(track => track.stop()); if (current.context && current.context.state !== 'closed') void current.context.close().catch(() => undefined); resources.current = {}; }, []);
  useEffect(() => { if (!active) stop(); }, [active, stop]);
  return { status, level, message, start, stop: () => { locked.current = true; stop('cancelled'); } };
}
