import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type SyntheticEvent } from 'react';
import { displayProjection } from './display-projection';
import { DriveNavigation } from './DriveNavigation';
import { Icon } from './Icons';
import { asset, categories, clock, type Scene, useReducedMotion, useVisible } from './demo-utils';
import { useVideoSource } from './web-media';
import { useReplayData } from './use-replay-data';
import { replayFps } from './replay-format';

function TrajectoryOverlay({ points }: { points: [number, number][] }) {
  const gradientId = useId();
  const ribbon = useMemo(() => {
    const left: string[] = [];
    const right: string[] = [];
    points.forEach(([x, y], i) => {
      const previous = points[Math.max(0, i - 1)];
      const next = points[Math.min(points.length - 1, i + 1)];
      const dx = next[0] - previous[0];
      const dy = next[1] - previous[1];
      const length = Math.hypot(dx, dy) || 1;
      // Narrow the ribbon toward the horizon in the 960 × 540 camera view.
      const halfWidth = 3.3 + 54 * Math.max(0, (y - 265) / 275) ** 1.2;
      const nx = -dy / length * halfWidth;
      const ny = dx / length * halfWidth;
      left.push(`${x + nx},${y + ny}`);
      right.push(`${x - nx},${y - ny}`);
    });
    return left.concat(right.reverse()).join(' ');
  }, [points]);
  const center = points.join(' ');
  const tip = points[points.length - 1];
  return <svg className="trajectory-projection" viewBox="0 0 960 540" aria-label="Projected model trajectory">
    <defs>
      <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="540" x2="0" y2="270">
        <stop offset="0" stopColor="#8255df" stopOpacity=".58"/>
        <stop offset=".55" stopColor="#515fe6" stopOpacity=".55"/>
        <stop offset="1" stopColor="#347ed6" stopOpacity=".48"/>
      </linearGradient>
    </defs>
    <polygon points={ribbon} fill={`url(#${gradientId})`}/>
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <polyline points={center} stroke="#35488f" strokeOpacity=".68" strokeWidth="3.1"/>
      <polyline points={center} stroke="#a0e9ff" strokeOpacity=".88" strokeWidth="2.5" strokeDasharray="7 7"/>
    </g>
    <circle cx={tip[0]} cy={tip[1]} r="2.3" fill="#a0e9ff" stroke="#465da7" strokeWidth=".85"/>
  </svg>;
}

export function DrivingReplay({ scene, nearby }: { scene: Scene; nearby: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const visible = useVisible(container);
  const reduced = useReducedMotion();
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [ready, setReady] = useState(false);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [wantsPlay, setWantsPlay] = useState(!reduced);
  const drag = useRef<{ pointer: number; x: number; time: number; width: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);
  const [rate, setRate] = useState(1);
  const duration = scene.duration;
  const fps = replayFps;
  const time = index / fps;
  const frameIndex = Math.min(index, Math.round(duration * fps) - 1);
  const entry = useReplayData(scene, frameIndex, visible, retry);
  const chunk = entry?.data;
  const localIndex = chunk ? frameIndex - chunk.firstFrame : -1;
  const frame = chunk?.frames[localIndex];
  const guide = chunk?.guidance.findLast(update => update.frame <= frameIndex);
  const projection = useMemo(() => chunk && frame ? displayProjection(chunk.frames, localIndex) : [],
    [chunk, frame, localIndex]);
  const message = error || (entry?.failed ? 'This recording could not load. Try again.' : '');
  useVideoSource(videoRef, scene.video, visible, retry);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (visible && wantsPlay && !scrubbing) video.play().catch(() => {});
    else video.pause();
  }, [visible, wantsPlay, scrubbing, retry]);
  useEffect(() => {
    const video = videoRef.current;
    if (playing && video && typeof video.requestVideoFrameCallback === 'function') {
      const tick = (_now: number, frame: VideoFrameCallbackMetadata) => {
        setIndex(Math.floor(frame.mediaTime * fps + 0.0001));
        handle = video.requestVideoFrameCallback(tick);
      };
      let handle = video.requestVideoFrameCallback(tick);
      return () => video.cancelVideoFrameCallback(handle);
    }
    let raf = 0;
    const tick = () => { if (videoRef.current) setIndex(Math.floor(videoRef.current.currentTime * fps + 0.0001)); raf = requestAnimationFrame(tick); };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, fps]);
  useEffect(() => {
    const video = videoRef.current;
    if (video) { video.defaultPlaybackRate = rate; video.playbackRate = rate; }
  }, [rate]);
  function syncPlayhead(event: SyntheticEvent<HTMLVideoElement>) {
    const video = event.currentTarget;
    if (video.hasAttribute('src') && video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setIndex(Math.floor(video.currentTime * fps + 0.0001));
    }
  }
  function seek(seconds: number) {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(0, Math.min(duration - 1 / fps, seconds));
    setIndex(Math.floor(videoRef.current.currentTime * fps + 0.0001));
  }
  function startDrag(event: PointerEvent<HTMLDivElement>) {
    const video = videoRef.current;
    if (!ready || message || !video || !event.isPrimary || event.button !== 0) return;
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
    else {
      setWantsPlay(true);
      video.play().catch((error: DOMException) => {
        if (error.name !== 'AbortError' && video.isConnected) setError('Playback could not start. Try reloading this recording.');
      });
    }
  }
  return <div className="replay" ref={container}>
    <div className="replay-heading"><h3>{scene.title}</h3></div>
    <div className="replay-body"><div className="replay-visual"><div className="camera-atlas"
      title="Drag left or right to scrub"
      onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag}
      onPointerCancel={finishDrag} onLostPointerCapture={finishDrag}>
      {nearby && !ready && <img decoding="async" className="replay-poster" src={asset(scene.poster)} alt="" />}
      <video ref={videoRef} muted loop playsInline preload={wantsPlay ? 'none' : 'metadata'}
        aria-label={`${scene.title}, six synchronized cameras`} onEmptied={() => setReady(false)}
        onLoadedData={() => setReady(true)} onPlaying={() => setReady(true)}
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onTimeUpdate={event => { if (event.currentTarget.paused) syncPlayhead(event); }} onSeeked={syncPlayhead}
        onError={event => { if (event.currentTarget.hasAttribute('src')) setError('This video could not load. Try again.'); }}/>
      <div className="front-overlay">
        <span className="camera-label"><Icon name="camera" size={14} /> Front wide</span>
        <span className="replay-location">Shanghai · {categories[scene.category]}</span>
        {projection.length > 0 && <>
          <TrajectoryOverlay points={projection}/>
          <span className="projection-legend">Model trajectory<i className="trajectory-swatch" aria-hidden="true"/></span>
        </>}
      </div>
      <div className="surround-labels">{['Front left','Front right','Rear left','Rear','Rear right'].map(label => <span key={label}>{label}</span>)}</div>
      {message && <div className="media-error"><p>{message}</p><button className="button button-white" onClick={() => { setReady(false); setError(''); setRetry(retry+1); }}>Reload recording</button></div>}
    </div></div>
    <DriveNavigation frame={frame} guide={guide} fps={fps} scene={scene.id} index={frameIndex}/></div>
    <div className="playback-controls"><button className="icon-button primary-play" onClick={playPause} aria-label={playing ? 'Pause driving replay' : 'Play driving replay'}><Icon name={playing?'pause':'play'} /></button><button className="icon-button" onClick={()=>seek(0)} aria-label="Restart recording"><Icon name="replay" /></button><span className="playback-time">{clock(time)}<span> / {clock(duration)}</span></span><input className="timeline" type="range" aria-label="Driving replay position" aria-valuetext={`${time.toFixed(1)} of ${duration} seconds`} min="0" max={duration - 1/fps} step={1/fps} value={Math.min(time,duration-1/fps)} onChange={e=>seek(Number(e.target.value))} style={{backgroundImage:`linear-gradient(to right, #536168 ${time/duration*100}%, #d5d8d8 ${time/duration*100}%)`}} /><div className="frame-step"><button className="icon-button" aria-label="Previous frame" onClick={()=>step(-1)}><Icon name="back" size={16} /></button><button className="icon-button" aria-label="Next frame" onClick={()=>step(1)}><Icon name="next" size={16} /></button></div><label className="speed-control"><span className="sr-only">Playback speed</span><select value={rate} onChange={e=>setRate(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select><Icon name="chevron" size={14} /></label>{document.fullscreenEnabled && <button className="icon-button fullscreen-button" aria-label="Expand driving replay" onClick={()=> { if (document.fullscreenElement) document.exitFullscreen(); else container.current?.requestFullscreen().catch(()=>{}); }}><Icon name="expand" /></button>}</div>
  </div>;
}
