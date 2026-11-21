import type { DriveBandwidth } from './use-attention-preload';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

// While the reader is on the cover, prime the three default replays in order.
// A visible or explicitly selected replay always gets the playback slot.
export function useDrivePriority(section: RefObject<HTMLElement | null>, groupCount: number) {
  const [current, setCurrent] = useState(-1);
  const [direction, setDirection] = useState(1);
  const [buffered, setBuffered] = useState(-1);
  const [fullscreen, setFullscreen] = useState(false);
  const [wallReady, setWallReady] = useState(false);
  const [inIntro, setInIntro] = useState(false);
  const [prepared, setPrepared] = useState(0);
  const finishDefault = useCallback((index: number) => {
    setPrepared(count => count === index ? count + 1 : count);
  }, []);
  const preferred = useRef(-1);
  const preferredY = useRef(0);
  const prefer = useCallback((index: number) => {
    preferred.current = index;
    preferredY.current = window.scrollY;
    setCurrent(index);
    setBuffered(-1);
  }, []);
  const reportBuffer = useCallback((index: number, enough: boolean) => {
    setBuffered(previous => enough ? index : previous === index ? -1 : previous);
  }, []);

  useEffect(() => {
    const rows = Array.from(section.current!.querySelectorAll<HTMLElement>('.drive-workspace'));
    const header = document.querySelector('.story-nav');
    const wall = document.querySelector<HTMLVideoElement>('.hero-wall')!;
    const poster = document.querySelector<HTMLImageElement>('.hero-poster')!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    function checkCover() {
      // Blob URLs already contain the complete loop. For streamed MP4s, use
      // actual buffered ranges so speculative drives never delay the first loop.
      const complete = wall.buffered.length && wall.buffered.start(0) < .1
        && wall.buffered.end(0) >= wall.duration - .05;
      const playingCover = wall.dataset.ready === 'true' && (complete || wall.currentSrc.startsWith('blob:'));
      if (playingCover || (reduced.matches && poster.complete && poster.naturalWidth)) setWallReady(true);
    }
    for (const event of ['playing', 'progress', 'canplaythrough']) wall.addEventListener(event, checkCover);
    poster.addEventListener('load', checkCover);
    reduced.addEventListener('change', checkCover);
    checkCover();
    let lastY = window.scrollY;
    let frame = 0;
    function measure() {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - lastY) >= 24) {
        setDirection(y > lastY ? 1 : -1);
        lastY = y;
      }
      if (Math.abs(y - preferredY.current) > 120) preferred.current = -1;
      const fullscreenElement = document.fullscreenElement;
      setFullscreen(!!fullscreenElement);
      const top = header?.getBoundingClientRect().height ?? 0;
      // At a chapter anchor, scroll rounding can leave a fraction of a pixel
      // of Drives below the sticky header. Keep its 120px lookahead inside Drives.
      const inside = !document.hidden && section.current!.getBoundingClientRect().bottom > top + 1;
      setInIntro(inside);
      if (!inside || fullscreenElement) setPrepared(0);
      let best = -1;
      let maxCoverage = -120; // Begin preparing the closest camera just before it enters.
      if (inside) rows.forEach((row, index) => {
        if (fullscreenElement && !row.contains(fullscreenElement)) return;
        const camera = row.querySelector('.camera-atlas')!.getBoundingClientRect();
        const coverage = Math.min(innerHeight, camera.bottom) - Math.max(fullscreenElement ? 0 : top, camera.top);
        if (coverage > maxCoverage) { best = index; maxCoverage = coverage; }
        if (preferred.current === index && coverage > 0) {
          best = index;
          maxCoverage = Infinity;
        }
      });
      if (best !== preferred.current) preferred.current = -1;
      setCurrent(best);
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure); }
    function visibilityChanged() {
      if (document.hidden) { setCurrent(-1); setBuffered(-1); setInIntro(false); setPrepared(0); }
      else schedule();
    }
    const resize = new ResizeObserver(schedule);
    rows.forEach(row => resize.observe(row));
    if (header) resize.observe(header);
    schedule();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    document.addEventListener('fullscreenchange', schedule);
    document.addEventListener('visibilitychange', visibilityChanged);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      for (const event of ['playing', 'progress', 'canplaythrough']) wall.removeEventListener(event, checkCover);
      poster.removeEventListener('load', checkCover);
      reduced.removeEventListener('change', checkCover);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('fullscreenchange', schedule);
      document.removeEventListener('visibilitychange', visibilityChanged);
    };
  }, [section]);

  const ordered = wallReady && inIntro && !fullscreen;
  const turn = ordered && prepared < groupCount && (current < 0 || current === prepared || buffered === current)
    ? prepared : -1;
  const next = (!ordered || prepared >= groupCount) && current >= 0 && buffered === current && !fullscreen
    ? current + direction : -1;
  const attentionBudget: DriveBandwidth = !inIntro ? 'outside' : ordered && prepared >= groupCount &&
    (current < 0 || buffered === current) ? 'idle' : 'busy';
  return { attentionBudget, current, next, turn, inIntro, retained: ordered ? prepared : 0, prefer, reportBuffer, finishDefault };
}
