import { useEffect, useId, useRef, useState } from 'react';
import { asset, useReducedMotion } from './demo-utils';
import { feedbackDuration, flowRegions, paperWidth, paperHeight, PipelineFlow, type FlowRegion } from './PipelineFlow';
import art from './pipeline-art.json';
import { useNearby } from './web-media';
import './pipeline.css';

export function InferenceExplainer() {
  const board = useRef<HTMLDivElement>(null);
  const nearby = useNearby(board);
  const atlasId = useId();
  const reduced = useReducedMotion();
  const [finished, setFinished] = useState(reduced);
  const [playing, setPlaying] = useState(false);
  const [atlasReady, setAtlasReady] = useState(false);
  const [originalReady, setOriginalReady] = useState(false);
  const [feedback, setFeedback] = useState<{ region: FlowRegion; key: number } | null>(null);
  const interactionKey = useRef(0);
  const hoverRegion = useRef<FlowRegion | null>(null);

  function trace(region: FlowRegion) {
    setFeedback({ region, key: ++interactionKey.current });
  }

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), (reduced ? .7 : feedbackDuration(feedback.region) + .08) * 1000);
    return () => clearTimeout(timer);
  }, [feedback, reduced]);

  useEffect(() => {
    if (reduced) setFinished(true);
    if (finished || reduced || !board.current) return;

    let entered = false;
    let visibleFraction = 0;
    const sync = () => {
      if (document.hidden) { setPlaying(false); return; }
      if (visibleFraction >= .1) entered = true;
      if (entered && visibleFraction === 0) setFinished(true);
      setPlaying(entered && visibleFraction > 0);
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        visibleFraction = entry.intersectionRatio;
        sync();
      }
    }, { threshold: [0, .1] });
    observer.observe(board.current);
    document.addEventListener('visibilitychange', sync);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', sync);
    };
  }, [finished, reduced]);

  const still = finished || reduced;
  return <figure className="pipeline-figure">
    <div ref={board} className="pipeline-board" data-complete={still}>
      <a className="pipeline-original-link" href={asset('research/framework.webp')} target="_blank" rel="noreferrer" aria-label="Open the full-size pipeline figure">
        <img className="pipeline-original" src={nearby ? asset('research/framework.webp') : undefined} width={art.width} height={art.height}
          alt="EponaX architecture from the paper. Camera history and navigation enter the shared backbone from below. Future RGB, depth and semantic supervision are above. On the right, TrajLoop refines the trajectory latents and the frozen TrajAE decoder produces the future trajectory."
          loading="lazy" onLoad={() => setOriginalReady(true)} />
      </a>
      {nearby && !reduced && (!finished || !originalReady) && <svg className="pipeline-reveal" viewBox={'0 0 ' + art.width + ' ' + art.height}
        aria-hidden="true" data-playing={!finished && playing && atlasReady}>
        <defs>
          <image id={atlasId} href={asset('research/framework-reveal.webp?v=' + art.atlasVersion)} width={art.atlasWidth} height={art.atlasHeight}
            onLoad={() => setAtlasReady(true)} onError={() => setFinished(true)} />
        </defs>
        {art.modules.map(({ name, start, x, y, w, h, sx, sy }) =>
          <g key={name} data-module={name} className="paper-module" style={{ animationDelay: start + 's' }}
            onAnimationEnd={name === 'trajectory' ? () => setFinished(true) : undefined}>
            <svg x={x} y={y} width={w} height={h} viewBox={[sx, sy, w, h].join(' ')} overflow="hidden">
              <use href={'#' + atlasId} />
            </svg>
          </g>)}
        <PipelineFlow/>
      </svg>}
      {still && <>
        {feedback && <div key={feedback.key} className="pipeline-feedback"><PipelineFlow region={feedback.region}/></div>}
        {flowRegions.map(({ id, label, x, y, w, h }) => <button key={id} type="button" className="pipeline-hotspot"
          aria-label={label} style={{ left: x / paperWidth * 100 + '%', top: y / paperHeight * 100 + '%',
            width: w / paperWidth * 100 + '%', height: h / paperHeight * 100 + '%' }}
          onPointerMove={e => {
            if (e.pointerType === 'mouse' && hoverRegion.current !== id) {
              hoverRegion.current = id;
              trace(id);
            }
          }}
          onPointerLeave={() => { hoverRegion.current = null; }}
          onClick={() => trace(id)} />)}
      </>}
    </div>
  </figure>;
}
