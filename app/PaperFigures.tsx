import { useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useNearby } from './web-media';
import { chapterAsset } from './chapter-assets';
import { asset } from './demo-utils';
import { InferenceExplainer } from './InferenceExplainer';

const moduleFigures = [
  { file: 'nav-encoder', title: 'Navigation encoder', width: 2600, height: 790,
    text: 'Three branches encode waypoints, road links with maneuver and lane attributes, and speed limits. Together they produce nine route tokens per frame.' },
  { file: 'nav-alignment', title: 'Navigation alignment', width: 2600, height: 949,
    text: 'During pretraining, a frozen language model predicts navigation instructions from the route tokens. A separate reconstruction objective preserves the original route fields. The encoder and projector are then frozen.' },
  { file: 'mvtok', title: 'Multi-view tokenizer', width: 2600, height: 694,
    text: 'The front camera retains a detailed view of the road ahead. For the five surround cameras, separate branches preserve semantic features and fine visual detail, then combine them into 640 tokens.' },
];

function ModuleDetails() {
  const [active, setActive] = useState(0);
  const section = useRef<HTMLElement>(null);
  const nearby = useNearby(section);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = moduleFigures.length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % count; break;
      case 'ArrowLeft': next = (index + count - 1) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    setActive(next);
    section.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return <section ref={section} className="architecture-modules" aria-label="Architecture modules">
    <div className="module-choices" role="tablist" aria-label="Select an architecture module"
      style={{ '--tab-offset': active * 100 + '%' } as CSSProperties}>
      {moduleFigures.map((module, index) => <button type="button" key={module.file} role="tab"
        id={'tab-' + module.file} aria-controls={'detail-' + module.file} aria-selected={active === index}
        tabIndex={active === index ? 0 : -1} onClick={() => setActive(index)} onKeyDown={e => navigate(e, index)}>
        {module.title}
      </button>)}
    </div>
    <div className="module-panels">
      {moduleFigures.map((module, index) => <div key={module.file} role="tabpanel"
        id={'detail-' + module.file} aria-labelledby={'tab-' + module.file}
        aria-hidden={active !== index} inert={active !== index} className="module-panel">
        <figure className="module-detail">
          <a className="module-image" href={asset('research/' + module.file + '.webp')} target="_blank" rel="noreferrer"
            aria-label={'Open the full-size ' + module.title + ' figure'}>
            <img src={nearby ? chapterAsset('research/' + module.file + '.webp') : undefined}
              width={module.width} height={module.height} alt={module.title + ' diagram from the EponaX paper'}/>
          </a>
          <figcaption>{module.text}</figcaption>
        </figure>
      </div>)}
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
