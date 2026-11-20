import { RecordedStreetMap, mapFixAtFrame, useStreetMap } from './RecordedStreetMap';
import { useId } from 'react';
import type { Frame, Guidance } from './demo-utils';

type Arrow = 'straight' | 'left' | 'right' | 'uturn' | 'waypoint' | 'slightRight' | 'mergeLeft';
const strokes: Record<Arrow, string> = {
  straight: 'M16 28V5 M9 12l7-7 7 7',
  left: 'M16 28V17q0-6-6-6H4 M10 5l-6 6 6 6',
  right: 'M16 28V17q0-6 6-6h6 M22 5l6 6-6 6',
  uturn: 'M19 28V12a6 6 0 0 0-12 0v6 M3 14l4 4 4-4',
  slightRight: 'M12 28V19q0-4 3-7l8-8 M15 4h8v8',
  mergeLeft: 'M24 28v-5q0-3-3-6l-7-7V4 M8 10l6-6 6 6',
  waypoint: 'M9 28V5 M10 6h15l-4 5 4 5H10',
};
const maneuvers: Record<number, [Arrow, string]> = {
  2: ['left', 'Turn left'], 3: ['right', 'Turn right'],
  5: ['slightRight', 'Bear right'], 9: ['straight', 'Continue straight'],
  10: ['waypoint', 'Next waypoint'], 65: ['mergeLeft', 'Merge left'],
};
// SD road-link actions and the HMI maneuver icons above use different codes.
const linkActions: Record<number, string> = {
  1: 'Turn left', 2: 'Turn right', 4: 'Bear right', 8: 'Continue straight', 9: 'Merge left',
};
// AMap LaneAction codes in the recorded backward (allowed) and foreground
// (recommended) lane arrays. Special lanes have no invented direction.
const laneDirections: Record<number, Arrow[]> = {
  0: ['straight'], 1: ['left'], 2: ['straight', 'left'], 3: ['right'],
  4: ['straight', 'right'], 5: ['uturn'], 6: ['left', 'right'],
  7: ['straight', 'left', 'right'], 9: ['straight', 'uturn'],
};

// English translations of the multi-lane maneuvers in the recording manifest.
const clipManeuvers: Record<string, string> = {
  city_02: 'Two lane changes to the left.',
  city_11: 'Two lane changes to the right to enter the right-turn lane.',
  city_15: 'Two lane changes to the right.',
  highway_03: 'Three successive lane changes.',
};

function LaneStrip({ lanes }: { lanes: [number, number][] }) {
  return <div className="nav-lanes">
    <p>Lane guidance</p>
    <ol>{lanes.map(([allowed, preferred], i) => {
      const directions = laneDirections[allowed] ?? [];
      const selected = preferred !== 255;
      const label = directions.length ? directions.join(' or ') : allowed === 23 ? 'variable lane' : 'unspecified';
      const recommendation = selected ? ', recommended ' + (laneDirections[preferred]?.join(' or ') ?? 'lane') : '';
      return <li key={i} className={selected ? 'recommended' : ''} aria-label={`Lane ${i + 1}: ${label}${recommendation}`}>
        <svg viewBox="0 0 32 32" aria-hidden="true">
          {directions.map(turn => <path key={turn} d={strokes[turn]}/>)}
          {selected && laneDirections[preferred]?.map(turn => <path className="preferred-arrow" key={turn} d={strokes[turn]}/>)}
          {!directions.length && <text x="16" y="21" textAnchor="middle">{allowed === 23 ? 'VAR' : '–'}</text>}
        </svg>
      </li>;
    })}</ol>
  </div>;
}

function RoutePreview({ frame }: { frame?: Frame }) {
  const id = useId();
  const route = frame?.navigation ?? [];
  // Fit the whole recorded waypoint horizon when a clip has no map position.
  const xs = [0,...route.map(p => -p[1])], ys = [0,...route.map(p => -p[0])];
  const left = Math.min(...xs), top = Math.min(...ys);
  const width = Math.max(10,Math.max(...xs)-left), height = Math.max(10,Math.max(...ys)-top);
  const scale = Math.min(182/width,142/height);
  const px = (x: number) => 120 + (x-left-width/2)*scale;
  const py = (y: number) => 100 + (y-top-height/2)*scale;
  const points = route.map(([x,y]) => `${px(-y)},${py(-x)}`).join(' ');
  let length = 0;
  const marks: { x:number; y:number; meters:number }[] = [];
  for (let i=1; i<route.length; i++) {
    const [ax,ay]=route[i-1], [bx,by]=route[i];
    const step=Math.hypot(bx-ax,by-ay);
    const next=(marks.length+1)*100;
    if (length<next && next<=length+step) {
      const f=(next-length)/step;
      marks.push({x:px(-(ay+(by-ay)*f)),y:py(-(ax+(bx-ax)*f)),meters:next});
    }
    length+=step;
  }
  return <div className="nav-map">
    {points ? <svg viewBox="0 0 240 194" role="img" aria-label="Route ahead from the recorded navigation waypoints">
      <defs><pattern id={id} width="45" height="45" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#c6d4cd"/></pattern></defs>
      <rect width="240" height="194" fill={`url(#${id})`}/>
      <g fill="none" strokeLinejoin="round" strokeLinecap="round">
        <polyline points={points} stroke="#c3d4ca" strokeWidth="17"/>
        <polyline points={points} stroke="#fff" strokeWidth="14"/>
        <polyline points={points} stroke="#29926d" strokeWidth="8"/>
      </g>
      {marks.map(mark => <g key={mark.meters} transform={`translate(${mark.x} ${mark.y})`}>
        <circle r="3" fill="white" stroke="#207654" strokeWidth="1.6"/>
        <text x="7" y="4" fill="#325344" stroke="#eaf0e9" strokeWidth="3" paintOrder="stroke" fontSize="11">{mark.meters} m</text>
      </g>)}
      <g transform={`translate(${px(0)} ${py(0)})`}><path d="M0-10l7 17-7-3-7 3z" fill="#16655e" stroke="white" strokeWidth="2"/></g>
      <text x="8" y="188" fontSize="10" fill="#425b4f">Local waypoints · {Math.round(length)} m ahead</text>
    </svg> : <span className="nav-map-empty">{frame ? 'Route preview unavailable' : 'Loading navigation…'}</span>}
    {frame?.limit != null && frame.limit > 0 && <span className="nav-limit" aria-label={`Speed limit ${frame.limit} km/h`} title="Speed limit (km/h)">{Math.round(frame.limit)}</span>}
  </div>;
}

function distance(meters: number) {
  return meters >= 1000 ? (meters / 1000).toFixed(1) + ' km' : Math.round(meters) + ' m';
}

export function DriveNavigation({ frame, guide, fps, scene, index }: {
  frame?: Frame; guide?: Guidance; fps: number; scene: string; index: number;
}) {
  const map = useStreetMap(scene, !!frame);
  const fix = map && mapFixAtFrame(map, index);
  const action = guide?.maneuver != null ? maneuvers[guide.maneuver] : undefined;
  return <aside className="drive-navigation" aria-label="Driving navigation">
    <div className="nav-instructions">
      <div className="nav-maneuver">
        {action && <svg className="nav-turn" viewBox="0 0 32 32" aria-hidden="true"><path d={strokes[action[0]]}/></svg>}
        <div><span>{action?.[1] ?? 'Current road'}</span>
          {action && guide?.meters != null && <strong>{distance(guide.meters)}</strong>}
          <b lang="zh-CN">{(action && guide?.nextRoad) || frame?.road || '—'}</b>
        </div>
      </div>
      {!!guide?.lanes?.length && <LaneStrip lanes={guide.lanes}/>}
    </div>
    {map && fix?.position && fix.plan != null
      ? <RecordedStreetMap scene={scene} map={map} fix={fix} guide={guide}/>
      : <RoutePreview frame={frame}/>}
    <div className="nav-current">
      {action && frame?.road && <span>On <b lang="zh-CN">{frame.road}</b></span>}
      {frame?.limit != null && frame.limit > 0 && <span>Limit <b>{Math.round(frame.limit)} km/h</b></span>}
      {fix?.laneCount != null && <span>{fix.laneCount} lanes</span>}
    </div>
    {!!guide?.modelLanes?.length && <div className="nav-lane-source">
      <span>Model navigation input · lanes from left</span>
      <ol>{guide.modelLanes.map(target => <li key={target.link}>
        <div><strong>{linkActions[target.action] ?? 'Road ahead'}</strong>
          {target.meters != null && <small>{distance(target.meters)}</small>}
        </div>
        <p>Recommended {target.recommended.map(n => `#${n}`).join(', ')} of {target.slots}</p>
      </li>)}</ol>
    </div>}
    {clipManeuvers[scene] && <div className="nav-clip-maneuver">
      <span>Clip annotation</span>
      <p>{clipManeuvers[scene]}</p>
      {frame && !guide?.modelLanes?.length && <small>No recorded lane recommendation at this frame.</small>}
    </div>}
    <div className="nav-vehicle">
      <dl>
        <div><dt>Vehicle speed</dt><dd>{frame?.speed?.toFixed(1) ?? '—'} <small>km/h</small></dd></div>
        <div><dt>Steering wheel</dt><dd>{frame?.steering != null ? Math.abs(frame.steering).toFixed(0) : '—'} <small>°</small></dd></div>
      </dl>
      <div className="nav-status"><span>{frame?.signal ? `${frame.signal === 'left' ? 'Left' : 'Right'} indicator` : 'Recorded telemetry'}</span><span>{frame?.intervention ? 'Driver input' : `${fps} Hz`}</span></div>
    </div>
  </aside>;
}
