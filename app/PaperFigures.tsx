import { useState } from 'react';
import { asset } from './demo-utils';
import { Icon } from './Icons';
import { InferenceExplainer } from './InferenceExplainer';

const moduleFigures = [
  { file: 'mvtok', title: 'Multi-view tokenizer', width: 2600, height: 694,
    text: 'The front camera retains a detailed view of the road ahead. For the five surround cameras, separate branches preserve semantic features and fine visual detail, then combine them into 640 tokens.' },
  { file: 'nav-encoder', title: 'Navigation encoder', width: 2600, height: 790,
    text: 'Three branches encode waypoints, road links with maneuver and lane attributes, and speed limits. Together they produce nine route tokens per frame.' },
  { file: 'nav-alignment', title: 'Navigation alignment', width: 2600, height: 949,
    text: 'During pretraining, a frozen language model predicts navigation instructions from the route tokens. A separate reconstruction objective preserves the original route fields. The encoder and projector are then frozen.' },
  { file: 'world-heads', title: 'Future prediction heads', width: 2386, height: 572,
    text: 'Three training heads predict future appearance, depth and semantics at a sampled horizon of one to twenty seconds. Their supervision shapes the scene representation used by the planner.' },
  { file: 'trajloop', title: 'TrajLoop', width: 1318, height: 2000,
    text: 'Over five refinement steps, each interaction block updates its local condition as the trajectory estimate changes. The backbone features stay fixed while TrajLoop refines the latent for the trajectory decoder.' },
];

function ModuleDetails() {
  const [selected, setSelected] = useState<typeof moduleFigures[number] | null>(null);
  return <section className="architecture-modules" aria-labelledby="architecture-modules-title">
    <h3 id="architecture-modules-title">Module details</h3>
    <div className="module-choices" role="group" aria-labelledby="architecture-modules-title">
      {moduleFigures.map(module => <button type="button" key={module.file}
        aria-controls="architecture-detail" aria-expanded={selected === module}
        onClick={() => setSelected(selected === module ? null : module)}>
        {module.title}<Icon name={selected === module ? 'minus' : 'plus'} size={14}/>
      </button>)}
    </div>
    <div id="architecture-detail" hidden={!selected}>
      {selected && <figure className="module-detail" key={selected.file} data-portrait={selected.height > selected.width}>
        <figcaption>
          <h4>{selected.title}</h4><p>{selected.text}</p>
        </figcaption>
        <a className="module-image" href={asset('research/' + selected.file + '.webp')} target="_blank" rel="noreferrer"
          aria-label={'Open the full-size ' + selected.title + ' figure'}>
          <img src={asset('research/' + selected.file + '.webp')} width={selected.width} height={selected.height}
            alt={selected.title + ' diagram from the EponaX paper'}/>
          <span><Icon name="expand" size={14}/> Full-size figure</span>
        </a>
      </figure>}
    </div>
  </section>;
}

export function Architecture() {
  return <section className="architecture-study story-section" id="method" aria-labelledby="method-title">
    <div className="story-wrap">
      <header className="story-heading" data-reveal>
        <h2 id="method-title">Planning from vision and navigation</h2>
        <p>Trained on nearly 35,000 hours of driving, EponaX combines six camera views with route guidance. TrajLoop draws on all 28 backbone layers to refine a trajectory over five steps.</p>
      </header>
      <InferenceExplainer/>
      <ModuleDetails/>
      <p className="architecture-conclusion">Predicting future appearance, depth and semantics during training teaches the backbone how a scene may change. <strong>On the vehicle, EponaX uses that representation to update a six-second trajectory at 10 Hz.</strong></p>
    </div>
  </section>;
}
