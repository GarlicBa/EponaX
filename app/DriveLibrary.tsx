import { useRef, useState } from 'react';
import { DrivingReplay } from './DrivingReplay';
import { Icon } from './Icons';
import { asset, clock, type Scene } from './demo-utils';
import manifest from './demo-manifest.json';

const scenesById = new Map((manifest as Scene[]).map(scene => [scene.id, scene]));
const groups = [
  {
    id: 'traffic', title: 'EponaX yields to pedestrians and vehicles, avoids obstacles and obeys traffic signals.',
    pages: [
      ['night_13', 'glare_03', 'city_09', 'night_08', 'city_03', 'night_06'],
      ['glare_01', 'night_01', 'city_14', 'night_11'],
      ['city_07', 'night_04', 'city_20', 'night_09'],
      ['night_07', 'city_12', 'night_02', 'city_19', 'night_10'],
    ],
  },
  {
    id: 'route', title: 'EponaX follows navigation guidance through lane changes and turns.',
    pages: [
      ['city_16', 'highway_03', 'night_14', 'city_02', 'city_06', 'city_01'],
      ['city_15', 'night_12', 'city_08', 'city_04', 'city_18', 'city_17'],
    ],
  },
  {
    id: 'everyday', title: 'EponaX follows traffic, rounds bends and passes slower vehicles.',
    pages: [
      ['highway_02', 'glare_02', 'city_05', 'night_05', 'highway_04', 'city_11'],
      ['city_13', 'highway_01', 'night_15'],
    ],
  },
].map(({ id, title, pages }) => ({
  id, title,
  recordingCount: pages.flat().length,
  pages: pages.map(ids => ids.map(sceneId => scenesById.get(sceneId)!)),
}));

function DriveRow({ group }: { group: typeof groups[number] }) {
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(group.pages[0][0]);
  const [browse, setBrowse] = useState(false);
  const browseButton = useRef<HTMLButtonElement>(null);
  const pageCount = group.pages.length;
  const catalogueId = 'drive-list-' + group.id;

  function selectScene(scene: Scene) {
    setSelected(scene);
    if (browse) browseButton.current?.focus({ preventScroll: true });
    setBrowse(false);
  }

  return <section className="drive-workspace" aria-labelledby={'drive-' + group.id}>
    <div className="drive-picker">
      <div className="picker-heading">
        <h3 id={'drive-' + group.id}>{group.title}</h3>
        <button type="button" ref={browseButton} className="browse-toggle" aria-expanded={browse}
          aria-controls={catalogueId} onClick={() => setBrowse(!browse)}>
          {browse ? 'Close list' : 'Browse'} <Icon name="chevron" size={15}/>
        </button>
      </div>
      <div className="drive-catalogue" id={catalogueId} data-open={browse}>
        <div className="film-grid">
          {group.pages[page].map(scene =>
            <button type="button" className="film-card" key={scene.id} onClick={() => selectScene(scene)}
              aria-label={`Play ${scene.title}`} aria-pressed={scene.id === selected.id}>
              <span className="film-image">
                <img src={asset(scene.poster)} loading="lazy" width="960" height="540" alt="" />
                {scene.id === selected.id && <span className="film-check"><Icon name="check" size={14}/></span>}
                <span className="film-time">{clock(scene.duration)}</span>
              </span>
              <span className="film-title">{scene.title}</span>
            </button>)}
        </div>
        <div className="picker-tools">
          <span>{group.recordingCount} recordings</span>
          {pageCount > 1 && <div className="library-pagination">
            <button type="button" aria-label="Previous page of recordings" disabled={page === 0} onClick={() => setPage(page - 1)}>‹</button>
            <span aria-live="polite">{page + 1} / {pageCount}</span>
            <button type="button" aria-label="Next page of recordings" disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>›</button>
          </div>}
        </div>
      </div>
    </div>
    <div className="drive-screen"><DrivingReplay key={selected.id} scene={selected}/></div>
  </section>;
}

export function DriveLibrary() {
  return <section className="drive-library story-section" id="drive" aria-labelledby="drive-title">
    <div className="story-wrap">
      <header className="story-heading" data-reveal>
        <h2 id="drive-title">Driving in the wild</h2>
        <p>Watch EponaX plan at 10 Hz as it follows navigation guidance, changes lanes, yields to pedestrians and stops at red lights.</p>
      </header>
      {groups.map(group => <DriveRow key={group.id} group={group}/>)}
    </div>
  </section>;
}
