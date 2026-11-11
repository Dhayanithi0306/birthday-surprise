import { useEffect, useRef, useState, type CSSProperties } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, ArrowRight, ArrowDown, Copy, Download, Film, Heart, Music2, Pause, Play, RotateCcw, Share2, Sparkles, UserRound, Users, Volume2, VolumeX, Wind, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion, type Variants } from 'framer-motion';
import { birthdayData as data } from './birthdayData';
import { useMicrophoneBlowDetection, type MicrophoneStatus } from './useMicrophoneBlowDetection';
import { playSparklerSound } from './SparklerSound';
import { birthdayMemories, memoryAlbumLabels, type MemoryFilter } from './memoriesData';

type Stage = 'welcome' | 'hero' | 'cake' | 'memories' | 'message';
const stars = Array.from({ length: 42 }, (_, i) => ({ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 100}%`, delay: `${(i % 9) * -0.7}s`, size: i % 7 === 0 ? '3px' : '2px' }));
const statusMessage = (status: MicrophoneStatus) => ({ waiting: 'Waiting for microphone permission', requesting: 'Requesting microphone permission…', calibrating: 'Calibrating your microphone…', ready: 'Ready! Blow out your candles!', listening: 'Listening…', celebrated: 'Beautiful! You made a wish!', denied: 'Microphone permission denied', unavailable: 'Microphone unavailable', error: 'Microphone unavailable', cancelled: 'Microphone paused' })[status];
const noStagger: Variants = { hidden: {}, visible: {} };
const noReveal: Variants = { hidden: { opacity: 1, y: 0 }, visible: { opacity: 1, y: 0 } };
const welcomeStagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.18, delayChildren: 0.12 } } };
const welcomeReveal: Variants = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } } };
const heroStagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.13, delayChildren: 0.08 } } };
const heroReveal: Variants = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.85, ease: [0.22, 1, 0.36, 1] } } };
const messageStagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.14, delayChildren: 0.08 } } };
const messageReveal: Variants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } } };

function Confetti({ active }: { active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const element = canvas.current; const ctx = element?.getContext('2d'); if (!element || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2); let frame = 0;
    const resize = () => { element.width = innerWidth * dpr; element.height = innerHeight * dpr; element.style.width = `${innerWidth}px`; element.style.height = `${innerHeight}px`; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); window.addEventListener('resize', resize);
    const bits = Array.from({ length: innerWidth < 600 ? 55 : 105 }, () => ({ x: Math.random() * innerWidth, y: -Math.random() * innerHeight, vx: (Math.random() - .5) * 3, vy: Math.random() * 4 + 2, size: Math.random() * 5 + 3, hue: Math.random() * 45 + 35, spin: Math.random() * 6 }));
    const sparks: { x: number; y: number; px: number; py: number; vx: number; vy: number; life: number; size: number }[] = [];
    const burst = () => { const x = innerWidth * (.18 + Math.random() * .64); const y = innerHeight * (.14 + Math.random() * .34); for (let i = 0; i < 26; i++) { const angle = (Math.PI * 2 * i) / 26; const speed = 1.3 + Math.random() * 2.8; sparks.push({ x, y, px: x, py: y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, size: 1.2 + Math.random() * 1.8 }); } };
    const burstTimers = [160, 1050, 2050, 3020].map(delay => window.setTimeout(burst, delay));
    let alive = true;
    const draw = () => { if (!alive) return; ctx.clearRect(0, 0, innerWidth, innerHeight); bits.forEach(b => { b.x += b.vx; b.y += b.vy; b.spin += .06; ctx.fillStyle = `hsl(${b.hue} 85% 65%)`; ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.spin); ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * .6); ctx.restore(); }); sparks.forEach(s => { s.px = s.x; s.py = s.y; s.x += s.vx; s.y += s.vy; s.vy += .025; s.life -= .018; ctx.globalAlpha = Math.max(0, s.life); ctx.strokeStyle = '#ffd77a'; ctx.lineWidth = s.size; ctx.shadowColor = '#ffc54a'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.moveTo(s.px, s.py); ctx.lineTo(s.x, s.y); ctx.stroke(); ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fillStyle = '#fff0bc'; ctx.fill(); }); ctx.globalAlpha = 1; ctx.shadowBlur = 0; for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].life <= 0) sparks.splice(i, 1); frame = requestAnimationFrame(draw); };
    frame = requestAnimationFrame(draw); const timer = window.setTimeout(() => { alive = false; cancelAnimationFrame(frame); ctx.clearRect(0, 0, innerWidth, innerHeight); }, 4700);
    return () => { alive = false; cancelAnimationFrame(frame); clearTimeout(timer); burstTimers.forEach(clearTimeout); window.removeEventListener('resize', resize); };
  }, [active]);
  return <canvas ref={canvas} className="confetti" aria-hidden="true" />;
}

function App() {
  const shouldReduceMotion = useReducedMotion();
  const welcomeVariants = shouldReduceMotion ? noStagger : welcomeStagger;
  const welcomeItems = shouldReduceMotion ? noReveal : welcomeReveal;
  const heroVariants = shouldReduceMotion ? noStagger : heroStagger;
  const heroItems = shouldReduceMotion ? noReveal : heroReveal;
  const finalVariants = shouldReduceMotion ? noStagger : messageStagger;
  const finalItems = shouldReduceMotion ? noReveal : messageReveal;
  const [stage, setStage] = useState<Stage>('welcome'); const [blown, setBlown] = useState(false); const [photo, setPhoto] = useState<number | null>(null);
  const [memoryFilter, setMemoryFilter] = useState<MemoryFilter>('all'); const [memoryLimit, setMemoryLimit] = useState(24); const [videoUrl, setVideoUrl] = useState(''); const [videoAutoplayBlocked, setVideoAutoplayBlocked] = useState(false);
  const [qr, setQr] = useState(''); const [copied, setCopied] = useState(false); const [musicOn, setMusicOn] = useState(false); const [error, setError] = useState('');
  const [sparklerVolume, setSparklerVolume] = useState(.48); const [sparklerMuted, setSparklerMuted] = useState(false);
  const audio = useRef<HTMLAudioElement>(null); const videoPlayer = useRef<HTMLVideoElement>(null); const resumeMusicAfterVideo = useRef(false);
  const celebrationTimer = useRef<number>(); const musicResumeTimer = useRef<number>(); const soundCleanup = useRef<(() => void) | undefined>();
  useEffect(() => { QRCode.toDataURL(window.location.href, { width: 360, margin: 1, color: { dark: '#101626', light: '#fffdf8' } }).then(setQr).catch(() => setError('The share code could not be created. Please copy the link instead.')); }, []);
  useEffect(() => { window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' }); }, [stage]);
  useEffect(() => {
    const player = audio.current;
    if (!player || !data.musicPath) return;
    let active = true;
    let waitingForGesture = false;
    player.volume = 0.42;
    const removeGestureListeners = () => {
      document.removeEventListener('pointerdown', resumeFromGesture);
      document.removeEventListener('keydown', resumeFromGesture);
    };
    const resumeFromGesture = () => {
      if (!waitingForGesture || !active) return;
      waitingForGesture = false;
      removeGestureListeners();
      void attemptPlayback();
    };
    const attemptPlayback = async () => {
      try {
        await player.play();
        if (!active) return;
        setMusicOn(true); setError('');
      } catch {
        if (!active) return;
        setMusicOn(false);
        setError('Your browser blocked automatic music. Tap the music button or anywhere on the page to start it.');
        if (!waitingForGesture) {
          waitingForGesture = true;
          document.addEventListener('pointerdown', resumeFromGesture, { once: true });
          document.addEventListener('keydown', resumeFromGesture, { once: true });
        }
      }
    };
    void attemptPlayback();
    return () => { active = false; waitingForGesture = false; removeGestureListeners(); };
  }, []);
  const startBirthdayMusic = async () => {
    if (!audio.current || !data.musicPath) return;
    try { await audio.current.play(); setMusicOn(true); setError(''); }
    catch { setMusicOn(false); setError('Tap the music button to resume the birthday music.'); }
  };
  const openCake = () => {
    if (musicResumeTimer.current) clearTimeout(musicResumeTimer.current);
    audio.current?.pause(); setMusicOn(false); setStage('cake');
  };
  const celebrate = () => {
    if (blown) return;
    setBlown(true);
    soundCleanup.current = playSparklerSound(sparklerMuted ? 0 : sparklerVolume);
    musicResumeTimer.current = window.setTimeout(() => { void startBirthdayMusic(); }, sparklerMuted ? 0 : 2300);
    celebrationTimer.current = window.setTimeout(() => setStage('memories'), 4000);
  };
  const microphone = useMicrophoneBlowDetection({ active: stage === 'cake' && !blown, onBlow: celebrate });
  const visibleMemories = birthdayMemories.filter(item => memoryFilter === 'all' || item.album === memoryFilter);
  const selectedMemory = photo === null ? null : visibleMemories[photo] ?? null;
  useEffect(() => {
    if (!selectedMemory || selectedMemory.type !== 'video' || !selectedMemory.loadVideo) { setVideoUrl(''); return; }
    let active = true; setVideoUrl('');
    selectedMemory.loadVideo().then(url => { if (active) setVideoUrl(url); }).catch(() => { if (active) setError('This video could not be loaded. Please try another memory.'); });
    return () => { active = false; };
  }, [selectedMemory?.id]);
  const selectMemory = (index: number) => {
    const next = visibleMemories[index];
    setVideoAutoplayBlocked(false);
    if (next?.type === 'video' && musicOn) { resumeMusicAfterVideo.current = true; audio.current?.pause(); setMusicOn(false); }
    else if (next?.type === 'photo' && resumeMusicAfterVideo.current) { resumeMusicAfterVideo.current = false; void startBirthdayMusic(); }
    setPhoto(index);
  };
  const closeMemory = () => {
    videoPlayer.current?.pause(); setPhoto(null);
    if (resumeMusicAfterVideo.current) { resumeMusicAfterVideo.current = false; void startBirthdayMusic(); }
  };
  const changeMemoryFilter = (filter: MemoryFilter) => { setMemoryFilter(filter); setMemoryLimit(24); setPhoto(null); };
  const toggleMusic = async () => { if (!data.musicPath) { setError('Add a music file path in birthdayData.ts to enable background music.'); return; } if (!audio.current) return; if (selectedMemory?.type === 'video') resumeMusicAfterVideo.current = false; if (musicOn) { audio.current.pause(); setMusicOn(false); } else { try { await audio.current.play(); setMusicOn(true); setError(''); } catch { setError('Could not play the music file. Check the path in birthdayData.ts.'); } } };
  const copyLink = async () => { try { await navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { setError('Copy is unavailable in this browser. Select and copy the address bar link.'); } };
  const replay = () => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); if (musicResumeTimer.current) clearTimeout(musicResumeTimer.current); soundCleanup.current?.(); microphone.stop(); setStage('welcome'); setBlown(false); void startBirthdayMusic(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const lightboxKey = (event: KeyboardEvent) => { if (photo === null) return; if (event.key === 'Escape') closeMemory(); if (event.key === 'ArrowLeft') selectMemory((photo + visibleMemories.length - 1) % visibleMemories.length); if (event.key === 'ArrowRight') selectMemory((photo + 1) % visibleMemories.length); };
  useEffect(() => { window.addEventListener('keydown', lightboxKey); return () => window.removeEventListener('keydown', lightboxKey); }, [photo, memoryFilter, musicOn]);
  useEffect(() => () => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); if (musicResumeTimer.current) clearTimeout(musicResumeTimer.current); soundCleanup.current?.(); }, []);
  return <main className="app-shell">
    <div className="ambient" aria-hidden="true">{stars.map((s, i) => <i key={i} style={{ left: s.left, top: s.top, animationDelay: s.delay, width: s.size, height: s.size }} />)}</div>
    <header className="topbar"><a className="brand" href="#top" onClick={e => { e.preventDefault(); replay(); }}><span className="brand-mark"><Sparkles size={15}/></span> A LITTLE CELEBRATION</a><div className="top-actions"><span className="edition">MADE WITH LOVE</span><button className="icon-button" onClick={toggleMusic} aria-label={musicOn ? 'Pause birthday music' : 'Play birthday music'} title={musicOn ? 'Pause birthday music' : 'Play birthday music'}>{musicOn ? <Pause size={17}/> : <Music2 size={17}/>}</button><button className="icon-button" onClick={() => setSparklerMuted(value => !value)} aria-label={sparklerMuted ? 'Unmute celebration sound' : 'Mute celebration sound'} title="Sparkler sound volume">{sparklerMuted ? <VolumeX size={17}/> : <Volume2 size={17}/>}</button><input className="volume-slider" type="range" min="0" max="1" step="0.05" value={sparklerMuted ? 0 : sparklerVolume} aria-label="Celebration sound volume" onChange={e => { const volume = Number(e.target.value); setSparklerVolume(volume); setSparklerMuted(volume === 0); }}/></div></header>
    <audio ref={audio} src={data.musicPath || undefined} loop />
    {error && <div className="toast" role="status">{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={14}/></button></div>}
    <Confetti active={blown}/>
    <AnimatePresence mode="wait" initial={false}><motion.div key={stage} className="screen-transition" initial={{ opacity: 0, y: 20, scale: 0.985, filter: 'blur(3px)' }} animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -14, scale: 0.99, filter: 'blur(5px)' }} transition={{ duration: shouldReduceMotion ? 0.01 : 0.7, ease: [0.22, 1, 0.36, 1] }}>
    {stage === 'welcome' && <motion.section className="welcome stage" id="top" variants={welcomeVariants} initial="hidden" animate="visible"><motion.div className="eyebrow" variants={welcomeItems}><span/> A MOMENT JUST FOR YOU <span/></motion.div><motion.p className="prelude" variants={welcomeItems}>We saved a little magic for today</motion.p><motion.h1 variants={welcomeItems}>Something Special<br/><em>Is Waiting For You...</em></motion.h1><motion.p className="intro" variants={welcomeItems}>A little celebration for someone who means<br className="desktop"/> so much to all of us.</motion.p><motion.button className="button primary" variants={welcomeItems} type="button" onClick={() => setStage('hero')}>Enter <ArrowRight size={17}/></motion.button><div className="scroll-hint"><span className="hint-line"/> TAKE A MOMENT <span className="hint-line"/></div></motion.section>}
    {stage === 'hero' && <motion.section className="hero stage" onPointerMove={event => { if (shouldReduceMotion || event.pointerType !== 'mouse') return; const bounds = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--parallax-x', `${((event.clientX - bounds.left) / bounds.width - .5) * 12}px`); event.currentTarget.style.setProperty('--parallax-y', `${((event.clientY - bounds.top) / bounds.height - .5) * 12}px`); }} onPointerLeave={event => { event.currentTarget.style.setProperty('--parallax-x', '0px'); event.currentTarget.style.setProperty('--parallax-y', '0px'); }} variants={heroVariants} initial="hidden" animate="visible"><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/><motion.div className="hero-content" variants={heroVariants}><motion.div className="eyebrow" variants={heroItems}><span/> TODAY, WE CELEBRATE YOU <span/></motion.div><motion.div className="heart-stamp" variants={heroItems}><Heart size={22} fill="currentColor"/></motion.div><motion.h1 variants={heroItems}>{data.greeting.split(', ').map((part, i) => <span key={part} className={i ? 'gold' : ''}>{part}{i === 0 ? ',' : ''} </span>)}</motion.h1><motion.p variants={heroItems}>{data.subtitle}</motion.p>{data.birthdayDate && <motion.span className="date-pill" variants={heroItems}>✦ &nbsp;{data.birthdayDate}&nbsp; ✦</motion.span>}<motion.button className="button primary" variants={heroItems} type="button" onClick={openCake}>Open Your Surprise <Sparkles size={16}/></motion.button></motion.div><div className="hero-bottom"><span>WITH ALL OUR LOVE</span><span>✦</span><span>JUST FOR YOU</span></div></motion.section>}
    {stage === 'cake' && <section className="cake-section stage"><div className="eyebrow"><span/> MAKE A WISH <span/></div><h2>A wish, just for <em>you.</em></h2><p className="section-sub">Close your eyes, make a wish, and when you're ready…</p><div className={`cake-scene ${blown ? 'is-blown' : ''}`}><div className="glow-ring"/><div className="cake"><div className="candles">{[0,1,2,3,4].map(n => <div className="candle" key={n}><span className="flame"/><i/><b className="smoke"/></div>)}</div><div className="cake-top"><span className="icing-drip"/></div><div className="cake-tier tier-top"/><div className="cake-tier tier-bottom"/><div className="cake-plate"/></div><div className="cake-sparkle">✦</div>{blown && <div className="cake-burst" aria-hidden="true">{Array.from({length:18},(_,i)=><i key={i} style={{'--n':i} as React.CSSProperties}>✦</i>)}</div>}</div>
      {blown && <motion.div className="celebration-banner" role="status" initial={{ opacity: 0, x: '-50%', y: 22, scale: .96 }} animate={{ opacity: 1, x: '-50%', y: 0, scale: 1 }} transition={{ duration: shouldReduceMotion ? .01 : .7, delay: shouldReduceMotion ? 0 : .3 }}><span>✦ &nbsp; A WISH MADE JUST FOR YOU &nbsp; ✦</span><p>May Your Life Be Filled With Happiness!</p></motion.div>}
      <div className="mic-panel" aria-live="polite"><div className={`mic-state ${microphone.status}`}><span className="mic-dot"/>{statusMessage(microphone.status)}</div>{!blown && <><div className="audio-meter" role="img" aria-label="Microphone input level">{Array.from({length:18},(_,i)=><i key={i} style={{'--meter':microphone.level, '--bar':.15 + ((i * 13) % 7) / 10} as CSSProperties}/>)}</div><p className="mic-note">Your microphone is only used to detect a blowing sound. Audio is never recorded or sent anywhere.</p>{microphone.message && <p className="mic-error" role="status">{microphone.message}</p>}<div className="mic-actions">{['waiting','cancelled','denied','unavailable','error'].includes(microphone.status) && <button className="button primary" type="button" onClick={() => void microphone.start()}>Enable Microphone &amp; Start <Wind size={16}/></button>}{['calibrating','ready','listening'].includes(microphone.status) && <button className="text-button" type="button" onClick={microphone.stop}>Cancel microphone</button>}<button className="manual-button" type="button" onClick={celebrate} disabled={blown}>Tap to blow out the candles</button></div></>}</div>
      <p className="wish-copy">{blown ? 'Beautiful! You made a wish ✨' : 'Take a deep breath… and let the magic happen.'}</p>{blown && <button className="button quiet" onClick={() => setStage('memories')}>Continue to the memories <ArrowRight size={16}/></button>}<div className="step-caption"><span>01</span> &nbsp; A WISH MADE JUST FOR YOU</div></section>}
    {stage === 'memories' && <section className="memories stage"><div className="eyebrow"><span/> THE BEST MOMENTS <span/></div><h2>Our favorite <em>moments together.</em></h2><p className="section-sub">Choose an album, then tap a photo or video to relive it.</p><div className="memory-filters" role="group" aria-label="Filter memories by album">{(['all','family','fun','portraits','videos'] as MemoryFilter[]).map(filter => { const Icon = filter === 'all' ? Sparkles : filter === 'family' ? Users : filter === 'fun' ? Heart : filter === 'portraits' ? UserRound : Film; const count = filter === 'all' ? birthdayMemories.length : birthdayMemories.filter(item => item.album === filter).length; return <button key={filter} type="button" className={`memory-filter ${memoryFilter === filter ? 'active' : ''}`} aria-pressed={memoryFilter === filter} onClick={() => changeMemoryFilter(filter)}><Icon size={16}/><span>{memoryAlbumLabels[filter]}</span><small>{count}</small></button>; })}</div><div className="memory-count" role="status">Showing {Math.min(memoryLimit, visibleMemories.length)} of {visibleMemories.length} {memoryFilter === 'all' ? 'memories' : memoryAlbumLabels[memoryFilter].toLowerCase()}</div><div className="photo-grid memory-grid">{visibleMemories.slice(0, memoryLimit).map((item, i) => <button key={item.id} className={`photo-card memory-card ${item.type === 'video' ? 'video-card' : ''}`} style={{ '--card': Math.min(i, 5) } as CSSProperties} onClick={() => selectMemory(i)} aria-label={`${item.type === 'video' ? 'Watch' : 'View'} ${item.caption}`}><span className="photo-index">{item.type === 'video' ? <><Film size={12}/> VIDEO</> : `${memoryAlbumLabels[item.album].toUpperCase()} · ${item.number}`}</span>{item.type === 'photo' ? <img src={item.src} alt={item.caption} loading="lazy" decoding="async"/> : <span className="video-poster" aria-hidden="true"><Film size={37}/><span className="video-play"><Play size={19} fill="currentColor"/></span><small>RECAP VIDEO</small></span>}<span className="photo-caption">{item.caption}</span>{item.type === 'video' && <span className="video-duration">PLAY MEMORY</span>}</button>)}</div>{memoryLimit < visibleMemories.length && <button type="button" className="button outline load-memories" onClick={() => setMemoryLimit(limit => Math.min(limit + 24, visibleMemories.length))}>Load more memories <ArrowDown size={15}/></button>}<button className="button primary" onClick={() => setStage('message')}>A Few Words From The Heart <Heart size={16}/></button></section>}
    {stage === 'message' && <section className="message stage"><div className="eyebrow"><span/> A NOTE FROM THE FAMILY <span/></div><div className="quote-mark">“</div><h2>To the man who makes<br/>every gathering <em>brighter.</em></h2><div className="message-rule"><span>✦</span></div><p className="personal-message">{data.personalMessage}</p><p className="signoff">With all our love, <span>your family</span></p><div className="final-card"><span className="final-sparkle">✧</span><p>{data.finalSurprise}</p><span className="final-sparkle">✧</span></div><div className="sharing"><div className="qr-card"><div className="qr-frame">{qr ? <img src={qr} alt="QR code linking to this birthday experience"/> : <div className="qr-loading"><Sparkles size={22}/></div>}</div><div><span className="qr-label">KEEP THE MAGIC</span><p>Scan to revisit this little celebration.</p><div className="qr-actions"><button onClick={copyLink}><Copy size={14}/>{copied ? 'Copied!' : 'Copy link'}</button><a href={qr || undefined} download="birthday-surprise-qr.png" aria-disabled={!qr}><Download size={14}/>Download QR</a></div></div></div><div className="print-card" aria-label="Printable birthday card"><span className="print-kicker">A LITTLE CARD FOR YOU</span><strong>Happy Birthday,<br/><em>Dear {data.uncleName}.</em></strong>{qr && <img src={qr} alt="QR code for birthday surprise"/>}<span>SCAN FOR A SURPRISE&nbsp; ✦</span></div></div><div className="end-actions"><button className="button outline" onClick={replay}><RotateCcw size={16}/> Replay Experience</button><button className="share-button" onClick={copyLink}><Share2 size={15}/> Share the love</button></div><footer>MADE FOR {data.uncleName.toUpperCase()} <span>✦</span> WITH LOVE, ALWAYS</footer></section>}
    </motion.div></AnimatePresence>
    <AnimatePresence mode="wait" initial={false}>{selectedMemory && photo !== null && <motion.div key={selectedMemory.id} className={`lightbox memory-lightbox ${selectedMemory.type === 'video' ? 'video-open' : 'photo-open'}`} role="dialog" aria-modal="true" aria-label={selectedMemory.type === 'video' ? 'Birthday memory video' : 'Birthday memory photo'} onClick={closeMemory} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: shouldReduceMotion ? .01 : .4 }}><button className="light-close" onClick={event => { event.stopPropagation(); closeMemory(); }} aria-label="Close memory"><X/></button><button className="light-arrow left" onClick={e => { e.stopPropagation(); selectMemory((photo + visibleMemories.length - 1) % visibleMemories.length); }} aria-label="Previous memory"><span className="arrow-icon"><ArrowLeft/></span></button>{selectedMemory.type === 'video' ? videoUrl ? <><video ref={videoPlayer} className="memory-video" src={videoUrl} controls autoPlay playsInline preload="auto" onClick={e => e.stopPropagation()} onCanPlay={event => { void event.currentTarget.play().then(() => setVideoAutoplayBlocked(false)).catch(() => setVideoAutoplayBlocked(true)); }} onError={() => setError('This video could not be played in this browser.')}/>{videoAutoplayBlocked && <button className="video-autoplay-fallback" type="button" onClick={event => { event.stopPropagation(); void videoPlayer.current?.play().then(() => setVideoAutoplayBlocked(false)).catch(() => setError('Tap the video player to start playback.')); }}><Play size={19} fill="currentColor"/> Tap to play</button>}</> : <div className="video-loading" role="status"><Film size={30}/><span>Preparing your memory…</span></div> : <motion.img src={selectedMemory.src} alt={selectedMemory.caption} onClick={e => e.stopPropagation()} initial={{ opacity: 0, scale: .96, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .98, y: -5 }} transition={{ duration: shouldReduceMotion ? .01 : .4 }}/>}<button className="light-arrow right" onClick={e => { e.stopPropagation(); selectMemory((photo + 1) % visibleMemories.length); }} aria-label="Next memory"><span className="arrow-icon"><ArrowRight/></span></button><p>{selectedMemory.caption}</p></motion.div>}</AnimatePresence>
    {stage !== 'welcome' && stage !== 'message' && <button className="back-link" onClick={() => setStage(stage === 'hero' ? 'welcome' : stage === 'cake' ? 'hero' : 'cake')}><ArrowLeft size={14}/> Back</button>}
  </main>;
}

export default App;
