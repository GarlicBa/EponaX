import { useEffect, useState } from 'react';
import { DriveLibrary } from './DriveLibrary';
import { AttentionStudy } from './AttentionStudy';
import { Architecture } from './PaperFigures';
import { RoadAtlas } from './RoadAtlas';
import { ResearchResults } from './ResearchResults';
import { asset } from './demo-utils';
import { affiliations } from './publication';

const chapters = [
  ['drive', 'Drives'], ['attention', 'Attention'], ['method', 'Architecture'],
  ['roads', 'Road tests'], ['results', 'Benchmarks'],
];

export default function Home() {
  const [active, setActive] = useState('drive');
  useEffect(() => {
    const legacy: Record<string,string> = { gallery: 'drive', overview: 'drive' };
    let anchor: HTMLElement | null = null;
    const releaseAnchor = () => { anchor = null; };
    const followHash = () => {
      const id = window.location.hash.slice(1);
      anchor = id ? document.getElementById(legacy[id] || id) : null;
      if (anchor instanceof HTMLDetailsElement) anchor.open = true;
      anchor?.scrollIntoView({ behavior: 'instant' });
    };
    const sections = Array.from(document.querySelectorAll<HTMLElement>('main > section[id]'));
    const header = document.querySelector<HTMLElement>('.story-nav');
    // Lazy-loaded route data can change the height of a replay above the chapter.
    // Keep the requested chapter in place until the reader interacts again.
    const layout = new ResizeObserver(() => {
      anchor?.scrollIntoView({ behavior: 'instant' });
      scheduleUpdate();
    });
    for (const node of [document.getElementById('top'), header, ...sections]) {
      if (node) layout.observe(node);
    }
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
    const frame = requestAnimationFrame(() => {
      followHash();
      document.dispatchEvent(new Event('eponax:initial-scroll'));
      scheduleUpdate();
    });
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);
    const reveal = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('has-entered');
        reveal.unobserve(entry.target);
      }
    }, { threshold: .12 });
    document.querySelectorAll('[data-reveal]').forEach(node => reveal.observe(node));
    window.addEventListener('hashchange', followHash);
    for (const event of ['pointerdown', 'wheel', 'touchstart', 'keydown']) {
      window.addEventListener(event, releaseAnchor, { passive: true, capture: true });
    }
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(pendingFrame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      reveal.disconnect();
      layout.disconnect();
      window.removeEventListener('hashchange', followHash);
      for (const event of ['pointerdown', 'wheel', 'touchstart', 'keydown']) {
        window.removeEventListener(event, releaseAnchor, true);
      }
    };
  }, []);
  return <>
    <header className="site-header story-nav"><div className="nav-inner">
      <a href="#top" className="brand" aria-label="EponaX home"><img src={asset('eponax-paper-mark.png')} alt="EponaX" width="1456" height="289"/></a>
      <nav aria-label="Main navigation">{chapters.map(([id,name]) =>
        <a key={id} href={'#' + id} aria-current={active === id ? 'location' : undefined}><span>{name}</span></a>)}</nav>
    </div></header>
    <main><DriveLibrary/><AttentionStudy/><Architecture/><RoadAtlas/><ResearchResults/></main>
    <footer className="story-footer"><div className="story-wrap">
      <img className="footer-company" src={asset('horizon-robotics.png')} alt={affiliations[1]} width="1232" height="402" loading="lazy"/>
      <a href="#top" aria-label="Back to EponaX"><img className="footer-project" src={asset('eponax-paper-mark.png')} alt="EponaX" width="1456" height="289"/></a>
      <a className="footer-return" href="#top">Back to top<img src={asset('horizon-mascot.png')} alt="" width="320" height="230" loading="lazy"/></a>
    </div></footer>
  </>;
}
