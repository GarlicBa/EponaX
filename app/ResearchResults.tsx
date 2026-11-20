import { useState, type CSSProperties, type ReactNode } from 'react';
import { family, navhard, transfer, v1, v2 } from './benchmark-data';
import './benchmarks.css';

const v1Metrics = ['NC', 'DAC', 'EP', 'TTC', 'C.', 'PDMS'];
const v2Components = ['NC', 'DAC', 'DDC', 'TLC', 'EP', 'TTC', 'LK', 'HC', 'EC'];
const v2Metrics = [...v2Components, 'EPDMS'];
const metricNames: Record<string, string> = {
  NC: 'No at-fault collisions', DAC: 'Drivable area compliance', EP: 'Ego progress',
  TTC: 'Time to collision', 'C.': 'Comfort', DDC: 'Driving direction compliance',
  TLC: 'Traffic light compliance', LK: 'Lane keeping', HC: 'History comfort', EC: 'Extended comfort',
  PDMS: 'PDM score', EPDMS: 'Extended PDM score',
};
const benchmarks = [
  { id: 'navtest-v1', title: 'NAVSIM v1 · navtest', metrics: v1Metrics, rows: v1,
    note: 'C counts camera views and L denotes LiDAR.' },
  { id: 'navtest-v2', title: 'NAVSIM v2 · navtest', metrics: v2Metrics, rows: v2,
    note: 'Single-stage evaluation with the human penalty enabled.' },
  { id: 'navhard-v2', title: 'NAVSIM v2 · navhard', metrics: v2Metrics, rows: null,
    note: 'Two-stage evaluation with reactive traffic and the human penalty enabled. EPDMS combines both stages.' },
];

function TableFrame({ title, children }: { title: string; children: ReactNode }) {
  return <div className="bench-scroll" tabIndex={0} role="region" aria-label={title}>
    <table className="bench-table"><caption className="sr-only">{title}</caption>{children}</table>
  </div>;
}

type Benchmark = typeof benchmarks[number];

function bestTotal(benchmark: Benchmark, model: string) {
  const values = benchmark.rows
    ? benchmark.rows.filter(row => row.name === model).map(row => row.scores[benchmark.metrics.length - 1])
    : navhard.filter(row => row.name === model).map(row => row.combined);
  return Math.max(...values);
}

function FamilyComparison() {
  return <article className="bench-summary family-comparison" data-reveal>
    <h3>Epona family</h3>
    <table className="family-sizes" aria-label="Epona model sizes">
      <thead><tr><th scope="col">Model</th>{family.map(model =>
        <th key={model.name} scope="col" data-model={model.name}>{model.name}</th>
      )}</tr></thead>
      <tbody><tr><th scope="row">Parameters</th>{family.map(model =>
        <td key={model.name} data-model={model.name}>{model.parameters}B</td>
      )}</tr></tbody>
    </table>
    <div className="family-charts">
      {benchmarks.map(benchmark => {
        const gain = bestTotal(benchmark, 'EponaX') - bestTotal(benchmark, 'EponaV2');
        return <figure className="family-chart" key={benchmark.id}>
          <div className="family-bars">
            {family.map(model => {
              const score = bestTotal(benchmark, model.name);
              return <div className="family-bar" data-model={model.name} key={model.name}
                style={{ height: score + '%' }}>
                <i aria-hidden="true"/><span><span className="sr-only">{model.name} </span>{score.toFixed(1)}</span>
              </div>;
            })}
          </div>
          <figcaption>
            <b>{benchmark.title.replace('NAVSIM ', '')}</b>
            <small>{benchmark.metrics[benchmark.metrics.length - 1]}</small>
            <strong>+{gain.toFixed(1)}<small> points</small></strong>
          </figcaption>
        </figure>;
      })}
    </div>
    <p className="family-caption">Gains show EponaX over EponaV2 on each split.</p>
  </article>;
}

function ZeroShotComparison() {
  return <article className="bench-summary transfer-comparison">
    <h3>Zero-shot transfer</h3>
    <p>NAVSIM-trained models evaluated without target-domain fine-tuning.</p>
    {(['nuScenes', 'Bench2Drive'] as const).map(dataset => <div className="transfer-dataset" key={dataset} data-reveal>
      <h4>{dataset === 'Bench2Drive' ? 'Bench2Drive (CARLA)' : dataset}</h4>
      <TableFrame title={dataset + ' zero-shot L2 error and collision rate'}>
        <thead>
          <tr><th scope="col" rowSpan={2}>Method</th><th scope="colgroup" colSpan={4} data-metric="L2">L2 error (m) ↓</th><th scope="colgroup" colSpan={4} data-metric="collision">Collision rate (%) ↓</th></tr>
          <tr>{(['L2', 'collision'] as const).map(metric => ['1 s','2 s','3 s','Avg.'].map(t =>
            <th scope="col" key={metric + t} data-metric={metric}>{t}</th>))}</tr>
        </thead>
        <tbody>{transfer.map(m => <tr key={m.name} className={m.name === 'EponaX' ? 'bench-ours' : ''}>
          <th scope="row">{m.name}</th>{(['L2','collision'] as const).map(metric =>
            m[dataset][metric].map((value, i) => <td key={metric+i} data-metric={metric} className={i===3 ? 'transfer-mean' : ''}>
              {value === Math.min(...transfer.map(x => x[dataset][metric][i])) ? <strong>{value.toFixed(2)}</strong> : value.toFixed(2)}
            </td>))}
        </tr>)}</tbody>
      </TableFrame>
    </div>)}
  </article>;
}

function FullComparison({ benchmark }: { benchmark: Benchmark }) {
  const { id, title, metrics, rows, note } = benchmark;
  const total = metrics.length - 1;
  const [selected, setSelected] = useState(total);
  const hasInputs = id === 'navtest-v1';
  const totals = rows
    ? rows.filter(row => row.rl !== null).map(row => row.scores[total])
    : navhard.map(model => model.combined);
  const min = Math.min(...totals);
  const max = Math.max(...totals);

  function scoreCell(value: number, index: number, bold: boolean, rowSpan = 1, reference = false) {
    let scoreTint: CSSProperties | undefined;
    if (index === total && !reference) {
      // Use the appendix's per-table scale, excluding the human reference.
      const position = (value - min) / (max - min || 1);
      const tint = 5 + 31 * position ** 1.6;
      scoreTint = { '--score-tint': `${tint}%` } as CSSProperties;
    }
    return <td key={index} rowSpan={rowSpan} style={scoreTint} data-total={scoreTint ? true : undefined}
      className={selected === index ? 'bench-column' : undefined}>
      {bold ? <strong>{value.toFixed(1)}</strong> : value.toFixed(1)}
    </td>;
  }
  return <article className="bench-detail" id={id} aria-labelledby={id + '-title'}>
    <header className="bench-detail-head">
      <div><h4 id={id + '-title'} className="bench-split-title">{title}</h4>
        <p className="bench-note">{note}</p></div>
      <span className="bench-head-score"><small>EponaX · {metrics[total]}</small><strong>{bestTotal(benchmark, 'EponaX').toFixed(1)}</strong></span>
    </header>
    <div className="bench-body">
      <div className="metric-readout" aria-live="polite"><b>{metrics[selected]}</b> {metricNames[metrics[selected]]} ↑</div>
      <TableFrame title={title + ' full comparison'}>
        <thead><tr>
          <th scope="col">Model</th>{hasInputs && <th scope="col">Input</th>}<th scope="col">{rows ? <abbr title="Reinforcement learning">RL</abbr> : 'Stage'}</th>
          {metrics.map((metric,i) => <th key={metric} scope="col" className={selected === i ? 'bench-column' : undefined}>
            <button type="button" title={metricNames[metric]} aria-label={'Highlight '+metricNames[metric]} aria-pressed={selected === i} onClick={() => setSelected(i)}>{metric}</button>
          </th>)}
        </tr></thead>
        {rows ? <tbody>{rows.map((row, i) => <tr key={row.name+row.rl} className={[
          row.name === 'EponaX' ? 'bench-ours' : '', row.rl == null ? 'bench-reference' : '',
          i > 0 && rows[i-1].rl !== row.rl ? 'bench-group-start' : '',
        ].join(' ')}>
          <th scope="row">{row.name}</th>{hasInputs && <td>{row.input}</td>}<td className="rl-cell">
            <span className={row.rl ? 'rl-check' : undefined} role="img"
              aria-label={row.rl == null ? 'Not applicable' : row.rl ? 'With reinforcement learning' : 'Without reinforcement learning'}>
              {row.rl == null ? '—' : row.rl ? '✓' : '✗'}
            </span>
          </td>
          {row.scores.map((value,j) => scoreCell(value,j,row.bold.includes(j),1,row.rl === null))}
        </tr>)}</tbody> : navhard.map(model => <tbody key={model.name} className={'stage-pair '+(model.name === 'EponaX' ? 'bench-ours' : '')}>
          {model.stages.map((scores, stage) => <tr key={stage}>
            {stage === 0 && <th rowSpan={2} scope="rowgroup">{model.name}</th>}
            <td>{stage+1}</td>{scores.map((value,j) => scoreCell(value,j,model.bold[stage].includes(j)))}
            {stage === 0 && scoreCell(model.combined,total,model.combined === max,2)}
          </tr>)}
        </tbody>)}
      </TableFrame>
    </div>
  </article>;
}

export function ResearchResults() {
  return <section className="benchmark-study story-section" id="results" aria-labelledby="benchmark-title">
    <div className="story-wrap">
      <header className="story-heading" data-reveal>
        <h2 id="benchmark-title">Planning across benchmarks</h2>
        <p>With 3.1B parameters, EponaX improves on EponaV2 by 12.2 points on two-stage navhard and achieves the lowest mean collision rate on both transfer datasets among the methods compared.</p>
      </header>
      <div className="bench-summaries"><FamilyComparison/><ZeroShotComparison/></div>
      <header className="navsim-heading" id="navsim-results">
        <h3>NAVSIM results</h3>
        <p>We sample only one trajectory per scene. Darker shading indicates a higher overall score within each table. Gray marks the human reference.</p>
      </header>
      {benchmarks.map(b => <FullComparison key={b.id} benchmark={b}/>)}
    </div>
  </section>;
}
