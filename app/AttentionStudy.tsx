import { createContext, useContext, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent, RefObject } from 'react';
import recordings from './demo-manifest.json';
import { asset, useReducedMotion, useVisible } from './demo-utils';
import { attachVideoSource, useNearby } from './web-media';
import { useDemoPreload, type DriveBandwidth } from './use-demo-preload';
import { attentionHeadUrl } from './attention-prefix';
import { useFullscreenAttention } from './use-fullscreen-attention';
import { queueAttentionStart } from './attention-starts';
import { Icon } from './Icons';

type Pair = { label: string; ids: [string, string]; initialSplit?: number };
type ScenarioGroup = { id: string; title: string; pairs: Pair[] };

const groups: ScenarioGroup[] = [
  { id: 'traffic', title: 'Pedestrians & hazards', pairs: [
    { label: 'Pedestrians', ids: ['city_19', 'night_11'], initialSplit: 3 },
    { label: 'Busy streets', ids: ['city_07', 'night_06'] },
    { label: 'Unexpected hazards', ids: ['city_10', 'city_12'] },
  ] },
  { id: 'junctions', title: 'Turns & traffic signals', pairs: [
    { label: 'Left turns', ids: ['city_06', 'night_01'] },
    { label: 'Complex intersections', ids: ['city_18', 'night_10'] },
    { label: 'Stopping and yielding', ids: ['city_03', 'city_09'] },
  ] },
  { id: 'routes', title: 'Routes & road layout', pairs: [
    { label: 'Route guidance', ids: ['city_01', 'night_14'] },
    { label: 'Open and narrow streets', ids: ['city_13', 'night_15'] },
  ] },
];
const defaultVideos = groups.flatMap(group => group.pairs[0].ids.map(id => `attention/${id}.mp4`));
export const otherAttentionVideos = groups.flatMap(group =>
  group.pairs.slice(1).flatMap(pair => pair.ids.map(id => `attention/${id}.mp4`)));
const PreloadedClips = createContext<ReturnType<typeof useDemoPreload>>({ urls: new Map(), partials: new Map() });
const byId = new Map(recordings.map(scene => [scene.id, scene]));
const cameras = ['Front left', 'Front', 'Front right', 'Rear left', 'Rear', 'Rear right'];

// The upper half of each encoded frame contains attention, the lower half RGB.
// The video displays attention directly. Copy just the visible strip of RGB.
function RgbStrip({ video, split, playing }: { video: HTMLVideoElement; split: number; playing: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const width = Math.round(video.videoWidth * split / 100);
  const height = video.videoHeight / 2;
  const draw = useCallback(() => {
    const ctx = canvas.current?.getContext('2d', { alpha: false });
    if (!ctx || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const cut = ctx.canvas.width;
    ctx.drawImage(video, 0, height, cut, height, 0, 0, cut, height);
  }, [video, height]);

  useLayoutEffect(draw, [draw, width]);
  useEffect(() => {
    if (!playing) return;
    if (typeof video.requestVideoFrameCallback === 'function') {
      const frame = () => { draw(); handle = video.requestVideoFrameCallback(frame); };
      let handle = video.requestVideoFrameCallback(frame);
      return () => video.cancelVideoFrameCallback(handle);
    }
    let lastTime = -1;
    const frame = () => {
      if (video.currentTime !== lastTime) { draw(); lastTime = video.currentTime; }
      handle = requestAnimationFrame(frame);
    };
    let handle = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(handle);
  }, [video, draw, playing]);

  return <canvas ref={canvas} className="attention-rgb-strip" width={width} height={height} aria-hidden="true"/>;
}

type ReplayProps = {
  id: string; split: number; playing: boolean; expanded: boolean; preferred: boolean; resumeAt: RefObject<number>;
  onBlocked: () => void; onError: () => void;
};

function AttentionVideo({ id, split, playing, expanded, preferred, resumeAt, onBlocked, onError }: ReplayProps) {
  const clips = useContext(PreloadedClips);
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const hd = useRef<HTMLVideoElement>(null);
  const hdActive = useFullscreenAttention(ref, hd, id, expanded && ready, playing);
  const displayed = hdActive ? hd.current : ref.current;
  const [attached, setAttached] = useState(false);
  const [granted, setGranted] = useState(false);
  const release = useRef<(() => void) | null>(null);
  useEffect(() => {
    const leaveQueue = queueAttentionStart(() => setGranted(true), preferred);
    release.current = leaveQueue;
    return leaveQueue;
  }, [preferred]);
  useEffect(() => {
    if (!granted) return;
    const video = ref.current!;
    const path = `attention/${id}.mp4`;
    const releaseSource = attachVideoSource(video, path, clips.urls.get(path) ?? attentionHeadUrl(path, clips.partials), () => setAttached(true));
    return () => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) resumeAt.current = video.currentTime;
      video.pause();
      video.removeAttribute('src');
      video.load();
      releaseSource();
      document.dispatchEvent(new Event('eponax:media-released'));
    };
  }, [clips.urls, clips.partials, granted, id, resumeAt]);
  useEffect(() => {
    const video = ref.current!;
    if (!attached) return;
    let active = true;
    if (playing && !hdActive) {
      video.play().catch((error: DOMException) => {
        if (!active || error.name === 'AbortError') return;
        release.current?.();
        if (error.name === 'NotAllowedError') onBlocked();
        else onError();
      });
    } else video.pause();
    return () => { active = false; };
  }, [attached, id, playing, hdActive, onBlocked, onError]);

  function allowNextStart() {
    const video = ref.current;
    if (!release.current || !video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    if (playing) {
      // Buffer a short lead before other visible pairs compete for this link.
      const head = video.currentTime;
      let buffered = false;
      for (let i = 0; i < video.buffered.length; i++) {
        if (video.buffered.start(i) <= head && video.buffered.end(i) >= Math.min(head + 2, video.duration)) buffered = true;
      }
      if (!buffered) return;
    }
    release.current();
    release.current = null;
  }
  function showFrame() {
    setReady(true);
    allowNextStart();
  }
  return <>
    <video ref={ref} className="attention-film" muted loop playsInline preload="metadata" disablePictureInPicture
      aria-hidden="true" data-ready={ready} data-rgb={split === 100}
      onLoadedMetadata={e => {
        const video = e.currentTarget;
        if (resumeAt.current > 0 && resumeAt.current < video.duration) video.currentTime = resumeAt.current;
      }}
      onLoadedData={showFrame} onPlaying={showFrame} onProgress={allowNextStart}
      onError={e => { release.current?.(); if (e.currentTarget.hasAttribute('src')) onError(); }} />
    {expanded && <video ref={hd} className="attention-film" muted loop playsInline preload="auto" disablePictureInPicture
      aria-hidden="true" data-ready={hdActive} data-rgb={split === 100}/>}
    {ready && split > 0 && split < 100 && displayed &&
      <RgbStrip video={displayed} split={split} playing={playing}/>}
  </>;
}

type GalleryPlayback = { preferred: boolean; nearby: boolean; reduced: boolean; fullscreenElement: Element | null };
type CardProps = GalleryPlayback & {
  scene: typeof recordings[number]; split: number; setSplit: (percent: number) => void;
};

function AttentionCard({ scene, split, setSplit, preferred, nearby, reduced, fullscreenElement }: CardProps) {
  const card = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const inView = useVisible(stage);
  const resumeAt = useRef(0);
  const slider = useRef<HTMLInputElement>(null);
  const gesture = useRef<{ id: number; x: number; y: number; dragging: boolean } | null>(null);
  const [manualPlay, setManualPlay] = useState<boolean | null>(null);
  const [failed, setFailed] = useState(false);
  const expanded = fullscreenElement !== null && fullscreenElement === card.current;
  const visible = inView && (!fullscreenElement || expanded);
  const playing = manualPlay ?? !reduced;
  const onBlocked = useCallback(() => setManualPlay(false), []);
  const onError = useCallback(() => setFailed(true), []);
  const poster = nearby ? asset('attention/' + scene.id + '.webp') : undefined;
  const playbackLabel = failed ? 'Retry' : playing ? 'Pause' : 'Play';
  function moveDivider(event: PointerEvent<HTMLDivElement>) {
    const { left, width } = event.currentTarget.getBoundingClientRect();
    setSplit(Math.max(0, Math.min(100, Math.round(100 * (event.clientX - left) / width))));
  }

  return <figure className="attention-card" ref={card} data-recording={scene.id} data-category={scene.category}>
    <div className="attention-stage" ref={stage} style={{ '--split': split + '%' } as CSSProperties}
      onPointerDown={e => {
        if (!e.isPrimary || e.button !== 0) return;
        const dragging = e.pointerType === 'mouse';
        gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dragging };
        if (dragging) {
          e.preventDefault();
          slider.current?.focus({ preventScroll: true });
          e.currentTarget.setPointerCapture(e.pointerId);
          moveDivider(e);
        }
      }}
      onPointerMove={e => {
        const start = gesture.current;
        if (!start || start.id !== e.pointerId) return;
        if (!start.dragging) {
          const dx = Math.abs(e.clientX - start.x), dy = Math.abs(e.clientY - start.y);
          if (Math.max(dx, dy) < 8) return;
          if (dy >= dx) { gesture.current = null; return; }
          start.dragging = true;
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        moveDivider(e);
      }}
      onPointerUp={e => {
        if (gesture.current?.id !== e.pointerId) return;
        gesture.current = null;
        moveDivider(e);
      }}
      onPointerCancel={e => { if (gesture.current?.id === e.pointerId) gesture.current = null; }}>
      <img className="attention-poster" src={poster} alt="" decoding="async" />
      {split > 0 && <div className="attention-rgb-poster" aria-hidden="true"><img className="attention-poster" src={poster} alt="" decoding="async"/></div>}
      {visible && !failed && (!reduced || manualPlay !== null || expanded) &&
        <AttentionVideo id={scene.id} split={split} preferred={preferred} expanded={expanded} playing={playing} resumeAt={resumeAt} onBlocked={onBlocked} onError={onError}/>}
      <div className="attention-cameras" aria-hidden="true">
        {cameras.map(name => <span key={name}><i>{name}</i></span>)}
      </div>
      <div className="attention-divider" aria-hidden="true"/>
      <div className="attention-grip" aria-hidden="true">
        <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 3-4 4 4 4m6-8 4 4-4 4"/>
        </svg>
      </div>
      <input ref={slider} className="attention-scrubber" type="range" min="0" max="100" step="1" value={split}
        aria-label={'Compare camera footage and attention for ' + scene.title}
        aria-valuetext={split + '% camera footage, ' + (100 - split) + '% attention'}
        onChange={e => setSplit(e.currentTarget.valueAsNumber)} />
    </div>
    <figcaption className="attention-caption">
      <div className="attention-scene">
        <span className="attention-scene-id">{scene.category === 'city' ? 'Urban' : 'Night'}</span>
        <h4>{scene.title}</h4>
      </div>
      <div className="attention-actions">
        {failed && <span className="attention-unavailable" role="status">Video unavailable</span>}
        <button type="button" aria-label={playbackLabel + ' ' + scene.title} title={playbackLabel} onClick={() => {
          if (failed) { setFailed(false); setManualPlay(true); }
          else setManualPlay(!playing);
        }}><Icon name={failed ? 'replay' : playing ? 'pause' : 'play'} size={16}/></button>
        {document.fullscreenEnabled && <button type="button" aria-label={(expanded ? 'Exit fullscreen' : 'Enlarge ' + scene.title)}
          title={expanded ? 'Exit fullscreen' : 'Enlarge'} onClick={() => {
            if (expanded) void document.exitFullscreen();
            else void card.current?.requestFullscreen().catch(() => {});
          }}><Icon name="expand" size={16}/></button>}
      </div>
    </figcaption>
  </figure>;
}

function AttentionPair({ pair, ...playback }: GalleryPlayback & { pair: Pair }) {
  const [split, setSplit] = useState(pair.initialSplit ?? 0);
  return <div className="attention-pair attention-cards" role="group" aria-label={pair.label}>
    {pair.ids.map(id => <AttentionCard key={id} scene={byId.get(id)!} split={split} setSplit={setSplit} {...playback}/>)}
  </div>;
}

function warmPosters(pair: Pair) {
  for (const id of pair.ids) {
    const image = new Image();
    image.src = asset('attention/' + id + '.webp');
  }
}

function AttentionRow({ group, ...playback }: Omit<GalleryPlayback, 'nearby' | 'preferred'> & { group: ScenarioGroup }) {
  const row = useRef<HTMLElement>(null);
  const nearby = useNearby(row);
  const [selected, setSelected] = useState(group.pairs[0]);
  const [preferred, setPreferred] = useState(false);
  const headingId = 'attention-' + group.id;
  return <section ref={row} className="attention-row" aria-labelledby={headingId}>
    <div className="attention-picker">
      <h3 id={headingId}>{group.title}</h3>
      <div className="attention-choices" role="group" aria-labelledby={headingId}>
        {group.pairs.map(pair => <button type="button" key={pair.label}
          aria-pressed={selected === pair} onFocus={() => warmPosters(pair)}
          onPointerEnter={() => warmPosters(pair)} onClick={() => {
            if (selected !== pair) { setPreferred(true); setSelected(pair); }
          }}>
          <img loading="lazy" decoding="async" fetchPriority="low"
            src={nearby ? asset(`demo/thumbs/192/${pair.ids[0]}.webp`) : undefined} width="56" height="32" alt=""/>
          {pair.label}
        </button>)}
      </div>
    </div>
    <AttentionPair key={selected.ids[0]} pair={selected} preferred={preferred} nearby={nearby} {...playback}/>
  </section>;
}

export function AttentionStudy({ budget, optionalVideos }: { budget: DriveBandwidth; optionalVideos: readonly string[] }) {
  const section = useRef<HTMLElement>(null);
  const inView = useVisible(section);
  const clips = useDemoPreload(defaultVideos, optionalVideos, budget, inView);
  const [fullscreenElement, setFullscreenElement] = useState(document.fullscreenElement);
  const reduced = useReducedMotion();
  useEffect(() => {
    const fullscreen = () => setFullscreenElement(document.fullscreenElement);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => document.removeEventListener('fullscreenchange', fullscreen);
  }, []);

  return <section ref={section} className="attention-study story-section" id="attention" aria-labelledby="attention-title">
    <div className="story-wrap">
      <header className="story-heading" data-reveal>
        <h2 id="attention-title">Focusing on what matters</h2>
        <p>TrajLoop uses trajectory latent tokens as queries and visual conditioning tokens from all six cameras as keys. Each map shows the attention received by each visual token, averaged over all trajectory queries, all blocks and all five refinement steps.</p>
      </header>
      <div className="attention-legend">
        <span>Relative attention</span>
        <span className="attention-scale"><small>Low</small><i aria-hidden="true"/><small>High</small></span>
        <p>Colors are scaled within each camera frame.</p>
      </div>
      <div className="attention-wall">
        <PreloadedClips.Provider value={clips}>{groups.map(group => <AttentionRow key={group.id} group={group}
          reduced={reduced} fullscreenElement={fullscreenElement}/>)}</PreloadedClips.Provider>
      </div>
      <p className="attention-conclusion">EponaX pays close attention to key cues for trajectory planning, including obstacles, pedestrians, traffic lights and lane markings. <strong>We see this attention pattern after scaling up both the driving dataset and the training compute budget.</strong></p>
    </div>
  </section>;
}
