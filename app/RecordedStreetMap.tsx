import { useEffect, useState } from 'react';
import { asset, type Guidance } from './demo-utils';

type Point = [number, number];
export type MapFix = {
  frame: number; position?: Point; heading?: number; nextPoint?: number; active?: number; plan?: number;
  roads?: string[]; seconds?: number; signals?: number; destination?: string; laneCount?: number;
};
type MapView = {
  bounds: [number, number, number, number]; scale: number; anchor: Point;
  labels: { name: string; position: Point }[];
};
type StreetMap = {
  views: { local: MapView; overview: MapView & { center: Point } };
  segments: { points: Point[] }[]; plans: { segments: number[]; lights: Point[] }[];
  states: MapFix[];
};
const maps = import.meta.glob<StreetMap>('./navigation-maps/*.json', { import: 'default' });

export function useStreetMap(scene: string, active: boolean) {
  const [map, setMap] = useState<StreetMap>();
  useEffect(() => {
    let current = true;
    if (active) maps['./navigation-maps/' + scene + '.json']?.().then(value => {
      if (current) setMap(value);
    }).catch(() => {});
    return () => { current = false; };
  }, [scene, active]);
  return map;
}

// Navigation fixes arrive roughly once a second. Use video time for the camera
// so pausing or seeking reproduces the same pose, including across true north.
export function mapFixAtFrame(map: StreetMap, frame: number) {
  const i = map.states.findLastIndex(state => state.frame <= frame);
  const fix = map.states[i];
  const next = map.states[i + 1];
  if (!fix?.position || !next?.position || frame === fix.frame) return fix;
  const t = (frame - fix.frame) / (next.frame - fix.frame);
  const [x, y] = fix.position;
  const position: Point = [x + t * (next.position[0] - x), y + t * (next.position[1] - y)];
  let heading = fix.heading;
  if (heading != null && next.heading != null) {
    heading += t * ((next.heading - heading + 540) % 360 - 180);
  }
  return { ...fix, position, heading };
}

export function RecordedStreetMap({ scene, map, fix, guide }: {
  scene: string; map: StreetMap; fix: MapFix; guide?: Guidance
}) {
  const [mode, setMode] = useState<'local' | 'overview'>('local');
  const view = map.views[mode];
  const [x, y, w, h] = view.bounds;
  const center = mode === 'local' ? fix.position! : map.views.overview.center;
  const heading = fix.heading ?? 0;
  const angle = -heading * Math.PI / 180;
  const a = view.scale * Math.cos(angle), b = view.scale * Math.sin(angle);
  const tx = view.anchor[0] - a * center[0] + b * center[1];
  const ty = view.anchor[1] - b * center[0] - a * center[1];
  const transform = `matrix(${a} ${b} ${-b} ${a} ${tx} ${ty})`;
  const screen = ([px, py]: Point): Point => [a * px - b * py + tx, b * px + a * py + ty];
  const plan = fix.plan === undefined ? undefined : map.plans[fix.plan];
  const active = fix.active === undefined ? undefined : map.segments[fix.active].points;
  const turn = active?.at(-1);
  const ahead = active && fix.position ? [fix.position, ...active.slice(fix.nextPoint)] : [];
  const activeIndex = plan?.segments.indexOf(fix.active ?? -1) ?? -1;
  const position = fix.position && screen(fix.position);
  const junction = turn && guide?.maneuver && screen(turn);
  const showTurnLabel = junction && guide?.nextRoad && junction[0] > 10 && junction[0] < 350 && junction[1] > 20 && junction[1] < 222;
  return <div className="street-map">
    <svg viewBox="0 0 360 240" role="img" aria-label={mode === 'local' ? 'Heading-up map around the vehicle and upcoming junction' : 'Heading-up overview of the recorded route section'}>
      <image href={asset(`demo/maps/${scene}-${mode}.webp`)} x={x} y={y} width={w} height={h} transform={transform} preserveAspectRatio="none"/>
      <g transform={transform} fill="none" strokeLinecap="round" strokeLinejoin="round">
        {plan?.segments.map(s => <polyline key={s} points={map.segments[s].points.join(' ')} stroke="white" strokeWidth="6.5" vectorEffect="non-scaling-stroke"/>)}
        {plan?.segments.map((s,i) => <polyline key={s} points={map.segments[s].points.join(' ')}
          stroke={activeIndex >= 0 && i <= activeIndex ? 'var(--nav-traveled)' : 'var(--nav-route)'} strokeWidth="3.5" vectorEffect="non-scaling-stroke"/>)}
        {ahead.length > 1 && <polyline points={ahead.join(' ')} stroke="var(--nav-route)" strokeWidth="3.5" vectorEffect="non-scaling-stroke"/>}
      </g>
      <g className="geo-road-labels" textAnchor="middle" fontSize="10" fill="#536073" stroke="#faf9f3" strokeWidth="3" paintOrder="stroke">
        {view.labels.map(label => {
          if (showTurnLabel && label.name === guide?.nextRoad) return null;
          const [sx, sy] = screen(label.position);
          const halfWidth = label.name.length * 5;
          if (sx < halfWidth || sx > 360 - halfWidth || sy < 14 || sy > 234) return null;
          return <text key={label.name} x={sx} y={sy}>{label.name}</text>;
        })}
      </g>
      <g className="geo-signals">{plan?.lights.map((p,i) => {
        const [sx,sy]=screen(p);
        if (sx<3 || sx>357 || sy<3 || sy>237) return null;
        return <g key={i} transform={`translate(${sx} ${sy})`}><title>Traffic signal</title>
          <rect x="-4" y="-7" width="8" height="14" rx="3" fill="#394249" stroke="white" strokeWidth="1"/>
          <circle cy="-3" r="1.5" fill="white"/><circle cy="2" r="1.5" fill="white"/>
        </g>;
      })}</g>
      {junction && <g className="geo-junction" transform={`translate(${junction[0]} ${junction[1]})`}>
        <title>{guide?.nextRoad || 'Next junction'}</title><circle r="6" fill="#fff" stroke="var(--nav-violet)" strokeWidth="2.5"/>
      </g>}
      {showTurnLabel &&
        <text x={junction[0] + (junction[0]<230 ? 10 : -10)} y={junction[1]-8} textAnchor={junction[0]<230 ? 'start' : 'end'}
          fill="#4a3974" stroke="white" strokeWidth="3.8" paintOrder="stroke" fontSize="12" fontWeight="650">{guide.nextRoad}</text>}
      {position && <g transform={`translate(${position[0]} ${position[1]})`}>
        <circle r="13" fill="#6454aa26"/><path d="M0-11 8 8 0 5-8 8Z" fill="#514387" stroke="white" strokeWidth="2"/>
      </g>}
      <g transform="translate(341 20)" aria-label="Compass, true north">
        <circle r="15" fill="#fff" fillOpacity=".93" stroke="var(--nav-rule)"/>
        <g transform={`rotate(${-heading})`}>
          <path d="M0-12 3.6-3H-3.6Z" fill="#56678c"/>
          <path d="M0 12 2.8 5H-2.8Z" fill="#b5bfce"/>
        </g>
        <circle r="5.5" fill="white"/>
        <text y="3.2" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--nav-ink)">N</text>
      </g>
    </svg>
    <div className="map-scales" role="group" aria-label="Map extent">
      <button type="button" aria-pressed={mode==='local'} onClick={()=>setMode('local')}>Junction</button>
      <button type="button" aria-pressed={mode==='overview'} onClick={()=>setMode('overview')}>Route section</button>
    </div>
    <div className="map-credit"><a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a> · <a href="https://openfreemap.org/">OpenFreeMap</a> · <a href="https://openmaptiles.org/">OpenMapTiles</a></div>
  </div>;
}
