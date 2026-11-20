import { useEffect, useRef, useState } from 'react';
import { DriveLibrary } from './DriveLibrary';
import { AttentionStudy } from './AttentionStudy';
import { Architecture } from './PaperFigures';
import { RoadAtlas } from './RoadAtlas';
import { ResearchResults } from './ResearchResults';
import { asset, useReducedMotion, useVisible } from './demo-utils';
import { authors, paperTitle, resources } from './publication';

function Hero() {
  const ref = useRef<HTMLVideoElement>(null);
  const visible = useVisible(ref);
  const reducedMotion = useReducedMotion();
  const paused = reducedMotion;
  const [portrait, setPortrait] = useState(() => window.matchMedia('(orientation: portrait)').matches);
  const film = asset(`demo/hero/${portrait ? 'wall-portrait' : 'wall'}`);

  useEffect(() => {
    const query = window.matchMedia('(orientation: portrait)');
    const update = () => setPortrait(query.matches);
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const update = () => {
      if (visible && !paused && !document.hidden) {
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [visible, paused, film]);

  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="publication">
      <div className="publication-title">
        <img className="publication-mark" src={asset('eponax-paper-mark.png')} alt="EponaX" width="1456" height="289" />
        <h1 id="hero-title">{paperTitle}</h1>
      </div>
      <div className="publication-byline">
        <ul className="publication-authors" aria-label="Authors">
          {authors.map(({ name, homepage }, index) => {
            const leader = index === authors.length - 1 && name === 'Wei Yin';
            const role = leader ? 'Project leader' : index < 8 ? 'Core contributor' : undefined;
            return <li key={name}>
              {homepage ? <a href={homepage} target="_blank" rel="noreferrer">{name}</a> : name}
              {role && <sup aria-label={role}>{leader ? '†' : '*'}</sup>}
              {index < 6 && <sup className="co-first-mark" aria-label="Co-first author">‡</sup>}
            </li>;
          })}
        </ul>
        <p className="publication-roles">
          {authors.length > 1 && <span>* Core contributor</span>}
          <span><b className="co-first-mark">‡</b> Co-first author</span>
          <span>† Project leader</span>
        </p>
        <p className="publication-team">
          <img src={asset('eponax-logo.png?v=2')} width="30" height="30" alt=""/>Horizon Team
        </p>
        <div className="publication-resources" aria-label="Publication resources">
          {resources.map(({ label, href }) => href
            ? <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
            : <span key={label} role="link" aria-disabled="true">{label}</span>)}
        </div>
      </div>
    </div>
    <video className="hero-wall" ref={ref} src={film + '.mp4'} poster={film + '.jpg'}
      muted loop playsInline preload="none" aria-hidden="true" />
  </section>;
}

const chapters = [
  ['drive', 'Drives'], ['attention', 'Attention'], ['method', 'Architecture'],
  ['roads', 'Road tests'], ['results', 'Benchmarks'],
];

export default function Home() {
  const [active, setActive] = useState('drive');
  useEffect(() => {
    const legacy: Record<string,string> = { gallery: 'drive', overview: 'drive' };
    const followHash = () => {
      const id = window.location.hash.slice(1);
      if (id) document.getElementById(legacy[id] || id)?.scrollIntoView({ behavior: 'instant' });
    };
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
    const header = document.querySelector<HTMLElement>('.story-nav');
    let pendingFrame = 0;
    const updateChapter = () => {
      pendingFrame = 0;
      const readingLine = (header?.offsetHeight ?? 0) + Math.min(96, window.innerHeight * .1);
      let current = 'drive';
      for (const section of sections) {
        if (section.getBoundingClientRect().top > readingLine) break;
        current = section.id;
      }
      setActive(current);
    };
    const scheduleUpdate = () => {
      if (!pendingFrame) pendingFrame = requestAnimationFrame(updateChapter);
    };
    const frame = requestAnimationFrame(() => { followHash(); scheduleUpdate(); });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('has-entered');
        reveal.unobserve(entry.target);
      }
    }, { threshold: .12 });
    document.querySelectorAll('[data-reveal]').forEach(node => reveal.observe(node));
    const syncLegacy = () => { if (legacy[location.hash.slice(1)]) followHash(); };
    window.addEventListener('hashchange', syncLegacy);
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pendingFrame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      reveal.disconnect();
      window.removeEventListener('hashchange', syncLegacy);
    };
  }, []);
  return <>
    <a className="skip-link" href="#drive">Skip to driving recordings</a>
    <Hero/>
    <header className="site-header story-nav"><div className="nav-inner">
      <a href="#top" className="brand" aria-label="EponaX home"><img src={asset('eponax-paper-mark.png')} alt="EponaX" width="1456" height="289"/></a>
      <nav aria-label="Main navigation">{chapters.map(([id,name]) =>
        <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined}>{name}</a>)}</nav>
    </div></header>
    <main><DriveLibrary/><AttentionStudy/><Architecture/><RoadAtlas/><ResearchResults/></main>
    <footer className="story-footer"><div className="story-wrap"><a href="#top" aria-label="Back to EponaX"><img src={asset('eponax-paper-mark.png')} alt="EponaX" width="1456" height="289"/></a>
      <span>Horizon Team</span><a href="#top">Back to top</a></div></footer>
  </>;
}
