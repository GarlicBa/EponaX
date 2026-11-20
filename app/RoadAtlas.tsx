import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { asset } from './demo-utils';
import { useNearby } from './web-media';
import { Icon } from './Icons';

type Point = [number, number];
type Route = {
  id: string; name: string; distance: number; laps: number;
  trafficLights: number; interventions: number; points: Point[];
};
type MapRoute = Route & { path: string; start: Point };
const routeColors = ['var(--blue)', 'var(--violet)', '#277790', '#3d438b'];

// pudong-streets.webp uses this north-up Web Mercator viewport (logical pixels).
const viewport = { width: 1000, height: 380, lon: 121.644, lat: 31.2224, pixelsPerDegree: 2340 };
const mercatorLatitude = (lat: number) => Math.asinh(Math.tan(lat * Math.PI / 180)) * 180 / Math.PI;
const northing = mercatorLatitude(viewport.lat);
function project([lon, lat]: Point): Point {
  return [
    viewport.width / 2 + (lon - viewport.lon) * viewport.pixelsPerDegree,
    viewport.height / 2 - (mercatorLatitude(lat) - northing) * viewport.pixelsPerDegree,
  ];
}
function prepareRoute(route: Route): MapRoute {
  const projected = route.points.map(project);
  const path = projected.map(([x, y], i) => (i ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2)).join(' ');
  return { ...route, path, start: projected[0] };
}

function RouteMap({ routes, active, select }: { routes: MapRoute[]; active: number; select: (index: number) => void }) {
  return <div className="road-map-frame">
    <svg className="route-map" viewBox={`0 0 ${viewport.width} ${viewport.height}`} preserveAspectRatio="xMidYMid slice"
      role="img" aria-label={`Street map of Pudong, Shanghai, with four test routes. ${routes[active]?.id ?? 'R1'} is highlighted.`}>
      <image href={asset('research/pudong-streets.webp')} width={viewport.width} height={viewport.height}/>
      {routes.map((route, i) => {
        const selected = i === active;
        const [x, y] = route.start;
        return <g key={route.id} className="map-route" onClick={() => select(i)}>
          <title>{route.id} · {route.name}</title>
          <path d={route.path} fill="none" stroke="#fff" strokeWidth={selected ? 6 : 4} strokeLinejoin="round" opacity=".88"/>
          <path d={route.path} fill="none" stroke={routeColors[i]} strokeWidth={selected ? 3.8 : 2.35}
            strokeOpacity={selected ? 1 : .8} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={route.path} fill="none" stroke="transparent" strokeWidth="15" pointerEvents="stroke"/>
          <g transform={`translate(${x},${y})`}>
            <circle r="4" stroke="white" strokeWidth="1.5" fill={routeColors[i]}/>
            <g className="road-route-label">
              <rect x="-16" y="-29" width="32" height="20" rx="4" fill={selected ? routeColors[i] : '#fff'} stroke={routeColors[i]} strokeWidth="1.25"/>
              <text y="-14" textAnchor="middle" fontSize="14" fontWeight="700" fill={selected ? '#fff' : routeColors[i]}>{route.id}</text>
            </g>
          </g>
        </g>;
      })}
    </svg>
    <span className="road-map-location">Shanghai / Pudong</span>
    <a className="road-map-expand" href={asset('research/road-overview.webp')} target="_blank" rel="noreferrer"
      aria-label="Open the four-route overview from the appendix" title="Open appendix map"><Icon name="expand" size={16}/></a>
    <small className="road-map-credit">
      <a href="https://openfreemap.org/" target="_blank" rel="noreferrer">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>
    </small>
  </div>;
}

export function RoadAtlas() {
  const section = useRef<HTMLElement>(null);
  const nearby = useNearby(section);
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (!nearby) return;
    const controller = new AbortController();
    fetch(asset('demo/routes.json'), { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then((data: Route[]) => setRoutes(data.map(prepareRoute)))
      .catch(() => { if (!controller.signal.aborted) setFailed(true); });
    return () => controller.abort();
  }, [nearby]);
  const route = routes[active];

  return <section ref={section} className="road-study story-section" id="roads" aria-labelledby="road-title">
    <div className="story-wrap">
      <header className="story-heading road-intro" data-reveal>
        <div><h2 id="road-title">Testing on Shanghai’s roads</h2>
          <p>Day and night, rain and glare. Three laps on each route, with a safety driver recording interventions.</p></div>
        <div className="distance-stat"><strong>240<span> km</span></strong><span>Approximate total test distance</span></div>
      </header>
      <div className="road-evaluation">
        <div className="route-visual">
          {nearby ? <RouteMap routes={routes} active={active} select={setActive}/> : <div className="road-map-frame"/>}
          <div className="route-tabs" role="group" aria-label="Select evaluation route">
            {routes.map((r, i) => <button key={r.id} type="button" aria-pressed={active === i} onClick={() => setActive(i)}
              style={{ '--route-color': routeColors[i] } as CSSProperties}>
              <span>{r.id}</span>{r.name.split(' and ')[0]}
            </button>)}
          </div>
        </div>
        <div className="route-detail" aria-live="polite" style={{ '--route-color': routeColors[active] } as CSSProperties}>
          {route ? <>
            <span className="route-id">{route.id}</span>
            <h3>{route.name}</h3>
            <dl>
              <div><dt>One loop</dt><dd>{route.distance.toFixed(2)}<span> km</span></dd></div>
              <div><dt>Evaluation laps</dt><dd>{route.laps}</dd></div>
              <div><dt>Traffic-light encounters</dt><dd>{route.trafficLights}</dd></div>
              <div><dt>Total driver interventions</dt><dd>{route.interventions}</dd></div>
            </dl>
            <p>Counts cover all three laps. Route lengths are approximate.</p>
            <a className="road-detail-link" href={asset('research/road-' + route.id + '.webp')} target="_blank" rel="noreferrer">
              <Icon name="expand" size={14}/> View {route.id} street map
            </a>
          </> : <p role="status">{failed ? 'Route details could not load.' : 'Loading route details…'}</p>}
        </div>
      </div>
      <div className="road-findings">
        <div><strong>64</strong><span>Total interventions<br/>over all four routes</span></div>
        <div><strong>3<span> / 60 km</span></strong><span>Safety-related interventions<br/>on average</span></div>
        <div><strong>570</strong><span>Traffic-light encounters<br/>24 required intervention</span></div>
        <div><strong>98<span>%</span></strong><span>Approximate navigation<br/>compliance</span></div>
      </div>
      <p className="results-footnote">Safety-related interventions include wide turns and other safety-related causes. About 80% of all interventions were rule-related.</p>
    </div>
  </section>;
}
