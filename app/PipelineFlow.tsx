import { useId, type CSSProperties } from 'react';
import art from './pipeline-art.json';

export const paperWidth = 1227;
export const paperHeight = 505.5;

export const plannerRegion = { id: 'planner', label: 'Trace the five TrajLoop updates', x: 860, y: 119, w: 365, h: 378 } as const;

export const flowRegions = [
  { id: 'inputs', label: 'Trace camera and navigation encoding', x: 13, y: 260, w: 838, h: 232 },
  { id: 'backbone', label: 'Trace the backbone and output tokens', x: 15, y: 213, w: 870, h: 43 },
  { id: 'supervision', label: 'Trace the three training heads', x: 13, y: 4, w: 840, h: 204 },
  plannerRegion,
  { id: 'trajectory', label: 'Trace trajectory decoding', x: 890, y: 4, w: 336, h: 114 },
] as const;

export type FlowRegion = typeof flowRegions[number]['id'];
const starts = Object.fromEntries(art.modules.map(({ name, start }) => [name, start]));
const viewBox = '0 0 ' + paperWidth + ' ' + paperHeight;

// Centerlines of the printed arrows, in the PDF's coordinate system. Gaps leave
// node labels untouched. The last two curves follow the decoder and road image.
const transfers = [
  { region: 'inputs', stage: 'encoders', offset: -.21, duration: .44, paths: [
    'M319 347V336', 'M571 387V371 M571 345V334', 'M738 378V371 M738 345V334',
  ] },
  { region: 'inputs', stage: 'input-tokens', offset: -.16, duration: .40, paths: [
    'M319 311V298', 'M571 309V298', 'M738 308V298',
  ] },
  { region: 'supervision', stage: 'supervision', offset: -.06, duration: .56, paths: [
    'M321 178V162 M321 135V127 M321 102V95',
    'M571 178V161 M571 135V128 M571 104V95',
    'M571 177V166H738V158 M738 135V128 M738 104V95',
  ] },
  { region: 'supervision', stage: 'supervision', offset: .17, duration: .36, paths: [
    'M407 99V118H391', 'M655 99V118H639', 'M824 99V117H808',
  ] },
  { region: 'planner', stage: 'step-1', offset: -.02, duration: .40, paths: [
    'M885 264H909', 'M885 357H910', 'M885 424H910', 'M959 464V439',
  ] },
  { region: 'planner', stage: 'loop', offset: .01, duration: .55, paths: [
    'M1032.5 422V411H1084.8V396', 'M1032.5 353V340H1084.8V327', 'M1032.5 261V247H1084.8V234',
  ] },
  { region: 'planner', stage: 'loop', offset: .20, duration: .38, paths: [
    'M1132 374H1166.6V362', 'M1132 307H1166.6V295', 'M1132 214H1166.6V202',
  ] },
  { region: 'trajectory', stage: 'decoder', offset: -.06, duration: .36, paths: ['M1132 118V94'] },
  { region: 'trajectory', stage: 'trajectory', offset: -.12, duration: .36, paths: ['M1052 75.5H1035'] },
  { region: 'trajectory', stage: 'trajectory', offset: .10, duration: .58, paths: [
    'M1086.8 48.5C1120.5 46 1142.5 25 1173.5 38.8', 'M959 108C954 101 945 91 941.6 80',
  ] },
] as const;

const sheens = [
  { region: 'inputs', stage: 'input-tokens', offset: .02, duration: .46, x: 210, y: 265, w: 590, h: 19 },
  { region: 'backbone', stage: 'backbone', offset: .02, duration: .62, x: 16, y: 214, w: 867, h: 40 },
  { region: 'backbone', stage: 'output-tokens', offset: .01, duration: .49, x: 210, y: 182, w: 590, h: 20 },
] as const;

const iterationMarks = [[1080, 440], [1132, 406], [1141, 395], [1150, 391], [1214, 374]];
const cues = [
  ...transfers, ...sheens,
  ...iterationMarks.map((_, index) => ({ region: 'planner', stage: 'step-' + (index + 1), offset: 0, duration: .32 })),
];

function cueWindow(region: FlowRegion) {
  const local = cues.filter(cue => cue.region === region);
  const start = Math.min(...local.map(cue => starts[cue.stage] + cue.offset));
  const end = Math.max(...local.map(cue => starts[cue.stage] + cue.offset + cue.duration));
  return { start, duration: end - start };
}

export function feedbackDuration(region: FlowRegion) {
  return cueWindow(region).duration;
}

export function PipelineFlow({ region }: { region?: FlowRegion }) {
  const id = useId();
  const origin = region ? cueWindow(region).start : 0;
  const timing = (stage: string, offset: number, duration: number) => ({
    animationDelay: (starts[stage] + offset - origin).toFixed(3) + 's',
    animationDuration: duration + 's',
  });
  return <svg x="0" y="0" width="100%" height="100%" viewBox={viewBox} preserveAspectRatio="none"
    className="pipeline-flow" aria-hidden="true">
    <defs>
      <linearGradient id={id + '-light'} x1="0" y1=".8" x2="1" y2=".2">
        <stop stopColor="#f2faff" stopOpacity="0"/><stop offset=".38" stopColor="#d4e9ff" stopOpacity=".4"/>
        <stop offset=".53" stopColor="white" stopOpacity=".88"/><stop offset="1" stopColor="#f1eaff" stopOpacity="0"/>
      </linearGradient>
    </defs>
    {sheens.filter(s => !region || s.region === region).map(s =>
      <svg key={s.stage} x={s.x} y={s.y} width={s.w} height={s.h} viewBox={'0 0 ' + s.w + ' ' + s.h} overflow="hidden">
        <rect x={-s.w * .22} y="0" width={s.w * .22} height={s.h} fill={'url(#' + id + '-light)'}
          className="flow-sheen" style={{ ...timing(s.stage, s.offset, s.duration), '--travel': s.w * 1.22 + 'px' } as CSSProperties}/>
      </svg>)}
    {transfers.filter(t => !region || t.region === region).map((t, i) =>
      <g key={t.region + '-' + i} className={'flow-pulse flow-' + t.region} style={timing(t.stage, t.offset, t.duration)}>
        {t.paths.map(d => <g key={d}>
          <path className="flow-halo" d={d} pathLength="1"/>
          <path className="flow-ink" d={d} pathLength="1"/>
        </g>)}
      </g>)}
    {(!region || region === 'planner') && iterationMarks.map(([x, y], index) => {
      const stage = 'step-' + (index + 1);
      return <g key={stage} data-refinement={index + 1}>
        <g transform={'translate(' + x + ' ' + y + ')'}>
          <circle className="flow-beat" r="8" style={timing(stage, 0, .32)}/>
        </g>
        {!region && <text className="flow-count" x="902" y="143" style={timing(stage, .015, .25)}>
          Euler step {index + 1} / 5
        </text>}
      </g>;
    })}
  </svg>;
}
