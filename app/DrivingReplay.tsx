import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import { displayProjection } from './display-projection';
import { DriveNavigation } from './DriveNavigation';
import { Icon } from './Icons';
import { asset, categories, clock, type Recording, type Scene, useReducedMotion, useVisible } from './demo-utils';

export function DrivingReplay({ scene }: { scene: Scene }) {
  const container = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = useVisible(container);
  const reduced = useReducedMotion();
  const [activated, setActivated] = useState(false);
  useEffect(() => { if (visible) setActivated(true); }, [visible]);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wantsPlay, setWantsPlay] = useState(!reduced);
  const drag = useRef<{ pointer: number; x: number; time: number; width: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [rate, setRate] = useState(1);
  const frameIndex = Math.min(index, (recording?.frames.length ?? 0) - 1);
  const frame = recording?.frames[frameIndex];
  const guide = recording?.guidance?.findLast(update => update.frame <= frameIndex);
  const projection = useMemo(() => recording && frameIndex >= 0
    ? displayProjection(recording.frames, frameIndex) : [], [recording, frameIndex]);
  const projectedPoints = projection.join(' ');
  const duration = recording?.duration ?? scene.duration;
  const fps = recording?.fps ?? 10;
  const time = index / fps;
  useEffect(() => {
    if (!activated) return;
    const abort = new AbortController();
    setError('');
    fetch(asset(scene.data), { signal: abort.signal }).then(response => { if (!response.ok) throw new Error('Recording unavailable'); return response.json(); }).then(setRecording).catch(e => { if (e.name !== 'AbortError') setError('This recording could not load. Try again.'); });
    return () => abort.abort();
  }, [activated, scene.data, retry]);
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (!video?.hasAttribute('src')) return;
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, []);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && !video.getAttribute('src')) { video.src = asset(scene.video); video.load(); }
    const sync = () => {
      if (visible && wantsPlay && !scrubbing && !document.hidden) video.play().catch(() => { setPlaying(false); });
      else video.pause();
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => document.removeEventListener('visibilitychange', sync);
  }, [visible, wantsPlay, scrubbing, scene.video, retry]);
  useEffect(() => {
    let raf = 0;
    const tick = () => { if (videoRef.current) setIndex(Math.floor(videoRef.current.currentTime * fps + 0.0001)); raf = requestAnimationFrame(tick); };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps]);
  useEffect(() => { if (videoRef.current) videoRef.current.playbackRate = rate; }, [rate]);
  function seek(seconds: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration - 1 / fps, seconds));
    setIndex(Math.floor(videoRef.current.currentTime * fps + 0.0001));
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!ready || error || !video || !event.isPrimary || event.button !== 0) return;
    drag.current = {
      pointer: event.pointerId, x: event.clientX, time: video.currentTime,
      width: event.currentTarget.getBoundingClientRect().width,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current;
    if (!start || start.pointer !== event.pointerId) return;
    const delta = event.clientX - start.x;
    if (!scrubbing && Math.abs(delta) < 4) return;
    setScrubbing(true);
    seek(start.time + delta / start.width * duration);
  }
  function finishDrag(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.pointer !== event.pointerId) return;
    drag.current = null;
    setScrubbing(false);
  }
  function step(direction: number) { setWantsPlay(false); videoRef.current?.pause(); seek(time + direction / fps); }
  function playPause() {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) { setWantsPlay(false); video.pause(); }
    else { setWantsPlay(true); video.play().catch(() => setError('Playback could not start. Try reloading this recording.')); }
  }
  return <div className="replay" ref={container}>
    <div className="replay-heading"><h3>{scene.title}</h3></div>
    <div className="replay-body"><div className="replay-visual"><div className="camera-atlas"
      title="Drag left or right to scrub"
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
      onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
      {!ready && <img loading="lazy" className="replay-poster" src={asset(scene.poster)} alt="" />}
      <video ref={videoRef} muted loop playsInline preload="none" aria-label={`${scene.title}, six synchronized cameras`} onLoadedData={() => setReady(true)} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onTimeUpdate={e => setIndex(Math.floor(e.currentTarget.currentTime * fps + 0.0001))} onSeeked={e => setIndex(Math.floor(e.currentTarget.currentTime * fps + 0.0001))} onError={() => setError('This video could not load. Try again.')} />
      <div className="front-overlay">
        <span className="camera-label"><Icon name="camera" size={14} /> Front wide</span>
        <span className="replay-location">Shanghai · {categories[scene.category]}</span>
        {projection.length > 0 && <>
          <svg className="trajectory-projection" viewBox="0 0 960 540" aria-label="Projected model trajectory">
            <g fill="none" strokeLinejoin="round">
              <polyline points={projectedPoints} stroke="#4adfea" strokeOpacity=".25" strokeWidth="20" />
              <polyline points={projectedPoints} stroke="#86f8ff" strokeWidth="3" />
            </g>
            {projection.map(([x, y], i) => i % 5 === 0 && <circle key={i} cx={x} cy={y} r="3" fill="white" />)}
          </svg>
          <span className="projection-legend">Model trajectory<i className="cyan-line" /></span>
        </>}
      </div>
      <div className="surround-labels">{['Front left','Front right','Rear left','Rear','Rear right'].map(label => <span key={label}>{label}</span>)}</div>
      {error && <div className="media-error"><p>{error}</p><button className="button button-white" onClick={() => { setReady(false); videoRef.current?.removeAttribute('src'); setRetry(retry+1); }}>Reload recording</button></div>}
    </div></div>
    <DriveNavigation frame={frame} guide={guide} fps={fps} scene={scene.id} index={frameIndex}/></div>
    <div className="playback-controls"><button className="icon-button primary-play" onClick={playPause} aria-label={playing ? 'Pause driving replay' : 'Play driving replay'}><Icon name={playing?'pause':'play'} /></button><button className="icon-button" onClick={()=>seek(0)} aria-label="Restart recording"><Icon name="replay" /></button><span className="playback-time">{clock(time)}<span> / {clock(duration)}</span></span><input className="timeline" type="range" aria-label="Driving replay position" aria-valuetext={`${time.toFixed(1)} of ${duration} seconds`} min="0" max={duration - 1/fps} step={1/fps} value={Math.min(time,duration-1/fps)} onChange={e=>seek(Number(e.target.value))} style={{backgroundImage:`linear-gradient(to right, #536168 ${time/duration*100}%, #d5d8d8 ${time/duration*100}%)`}} /><div className="frame-step"><button className="icon-button" aria-label="Previous frame" onClick={()=>step(-1)}><Icon name="back" size={16} /></button><button className="icon-button" aria-label="Next frame" onClick={()=>step(1)}><Icon name="next" size={16} /></button></div><label className="speed-control"><span className="sr-only">Playback speed</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><Icon name="chevron" size={14} /></label><button className="icon-button fullscreen-button" aria-label="Expand driving replay" onClick={()=> { if (document.fullscreenElement) document.exitFullscreen(); else container.current?.requestFullscreen().catch(()=>{}); }}><Icon name="expand" /></button></div>
  </div>;
}
