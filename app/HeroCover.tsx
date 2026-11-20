import React from 'react';
import { affiliations, authors, paperTitle, resources } from './publication';

// Rendered into index.html so the cover can start before the interactive chapters.
export function HeroCover() {
  return <section className="hero" id="top" aria-labelledby="hero-title">
    <div className="publication">
      <div className="publication-title">
        <img className="publication-mark" src="./eponax-paper-mark.png" alt="EponaX" width="1456" height="289" />
        <h1 id="hero-title">{paperTitle}</h1>
      </div>
      <div className="publication-byline">
        <ul className="publication-authors" aria-label="Authors">
          {authors.map(({ name, homepage, affiliations: units }, index) => {
            const leader = index === authors.length - 1 && name === 'Wei Yin';
            const role = leader ? 'Project leader' : index < 8 ? 'Core contributor' : undefined;
            return <li key={name} aria-describedby={units.map(id => `affiliation-${id}`).join(' ')}>
              {homepage ? <a href={homepage} target="_blank" rel="noreferrer">{name}</a> : name}
              <sup className="affiliation-mark" aria-hidden="true">{units.join(',')}</sup>
              {role && <sup className="role-mark" aria-label={role}>{leader ? '‡' : '*'}</sup>}
              {index < 6 && <sup className="co-first-mark" aria-label="Co-first author">†</sup>}
            </li>;
          })}
        </ul>
        <ul className="publication-affiliations" aria-label="Author affiliations">
          {Object.entries(affiliations).map(([id, name]) =>
            <li key={id} id={`affiliation-${id}`}><sup aria-hidden="true">{id}</sup>{name}</li>)}
        </ul>
        <p className="publication-roles">
          {authors.length > 1 && <span><span className="role-mark">*</span> Core contributor</span>}
          <span><b className="co-first-mark">†</b> Co-first author</span>
          <span><span className="role-mark">‡</span> Project leader</span>
        </p>
        <p className="publication-team">
          <img src="./eponax-logo.png?v=2" width="32" height="32" alt=""/>{affiliations[1]}
        </p>
        <div className="publication-resources" aria-label="Publication resources">
          {resources.map(({ label, href }) => href
            ? <a key={label} href={href} target="_blank" rel="noreferrer">{label}</a>
            : <span key={label} role="link" aria-disabled="true">{label}</span>)}
        </div>
      </div>
    </div>
    <picture>
      <source media="(orientation: portrait)"/>
      <img className="hero-poster" alt="" width="1920" height="1080" fetchPriority="high"/>
    </picture>
    <video className="hero-wall" muted loop playsInline preload="none" data-ready="false" aria-hidden="true"
      data-landscape="./demo/hero/wall" data-portrait="./demo/hero/wall-portrait"/>
    <noscript><picture>
      <source media="(orientation: portrait)" srcSet="./demo/hero/wall-portrait.jpg"/>
      <img className="hero-poster" src="./demo/hero/wall.jpg" alt="" width="1920" height="1080"/>
    </picture></noscript>
  </section>;
}
