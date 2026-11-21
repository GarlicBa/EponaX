import { useRef, useState, type KeyboardEvent } from 'react';
import { useNearby } from './web-media';
import { architectureModules } from './architecture-modules';
import { chapterAsset } from './chapter-assets';
import { asset } from './demo-utils';
import { InferenceExplainer } from './InferenceExplainer';

function ModuleDetails({ active, select }: { active: number; select: (index: number) => void }) {
  const section = useRef<HTMLElement>(null);
  const nearby = useNearby(section);

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const count = architectureModules.length;
    let next: number;
    switch (event.key) {
      case 'ArrowRight': next = (index + 1) % count; break;
      case 'ArrowLeft': next = (index + count - 1) % count; break;
      case 'Home': next = 0; break;
      case 'End': next = count - 1; break;
      default: return;
    }
    event.preventDefault();
    select(next);
    section.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return <section ref={section} className="architecture-modules" aria-label="Architecture modules">
    <div className="module-selector">
      <span className="module-label" id="module-label">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M3 2v8a2 2 0 0 0 2 2h7m-3-3 3 3-3 3"/>
        </svg>
        Module details
      </span>
      <div className="module-choices" role="tablist" aria-labelledby="module-label">
        {architectureModules.map((module, index) => <button type="button" key={module.id} role="tab"
          id={'tab-' + module.id} aria-controls={'detail-' + module.id} aria-selected={active === index}
          tabIndex={active === index ? 0 : -1} onClick={() => select(index)} onKeyDown={e => navigate(e, index)}>
          {module.title}
        </button>)}
      </div>
    </div>
    <div className="module-panels">
      {architectureModules.map((module, index) => <div key={module.id} role="tabpanel"
        id={'detail-' + module.id} aria-labelledby={'tab-' + module.id}
        hidden={active !== index} className="module-panel">
        {module.figures.map(figure => <figure key={figure.path} className="module-detail">
          <a className="module-image" href={asset(figure.path)} target="_blank" rel="noreferrer"
            aria-label={'Open full-size figure: ' + figure.alt}>
            <img src={nearby && active === index ? chapterAsset(figure.path) : undefined}
              width={figure.width} height={figure.height} alt={figure.alt}/>
          </a>
          <figcaption>{figure.caption}</figcaption>
        </figure>)}
      </div>)}
    </div>
  </section>;
}

export function Architecture() {
  const [selection, setSelection] = useState({ index: 0, revision: 0 });
  function select(index: number) {
    setSelection(previous => ({ index, revision: previous.revision + 1 }));
  }
  function selectFromDiagram(index: number) {
    select(index);
    const tab = document.getElementById('tab-' + architectureModules[index].id);
    tab?.focus({ preventScroll: true });
    tab?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }
  return <section className="architecture-study story-section" id="method" aria-labelledby="method-title">
    <div className="story-wrap">
      <header className="story-heading" data-reveal>
        <h2 id="method-title">Planning from vision and navigation</h2>
        <p>Trained on nearly 35,000 hours of driving, EponaX combines six camera views with route guidance. TrajLoop draws on all 28 backbone layers to refine a trajectory over five steps.</p>
      </header>
      <div className="architecture-explorer">
        <InferenceExplainer selection={selection} select={selectFromDiagram}/>
        <ModuleDetails active={selection.index} select={select}/>
      </div>
      <p className="architecture-conclusion">Predicting future appearance, depth and semantics during training teaches the backbone how a scene may change. <strong>On the vehicle, EponaX uses that representation to update a six-second trajectory at 10 Hz.</strong></p>
    </div>
  </section>;
}
