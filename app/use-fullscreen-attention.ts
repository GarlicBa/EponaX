import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import { asset } from './demo-utils';

function covers(video: HTMLVideoElement, time: number, seconds: number) {
  const end = Math.min(time + seconds, video.duration - .05);
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= time && video.buffered.end(i) >= end) return true;
  }
  return false;
}

// Keep the card's native player on screen until HD has a decoded frame at
// the same playhead and a useful buffer. The two sources share a timeline.
export function useFullscreenAttention(standardRef: RefObject<HTMLVideoElement | null>,
  hdRef: RefObject<HTMLVideoElement | null>, id: string, enabled: boolean, playing: boolean) {
  const [active, setActive] = useState(false);
  const fallback = useRef<(() => void) | undefined>(undefined);
  useLayoutEffect(() => {
    const standard = standardRef.current;
    const hd = hdRef.current;
    if (!enabled || !standard || !hd) return;
    let showingHD = false;
    let started = false;
    let stopped = false;
    let deadline = 0;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearTimeout(deadline);
      if (showingHD) {
        standard.currentTime = hd.currentTime;
        setActive(false);
      }
      hd.pause();
      hd.removeAttribute('src');
      if (started) hd.load();
    };
    fallback.current = stop;
    const update = () => {
      if (stopped) return;
      if (showingHD) {
        if (!hd.paused && !hd.seeking && !covers(hd, hd.currentTime, 0.6)) stop();
        return;
      }
      const time = standard.currentTime;
      if (!started) {
        if (!standard.paused && !covers(standard, time, 4)) return;
        started = true;
        deadline = window.setTimeout(stop, 12000);
        hd.src = asset('attention/hd/' + id + '.mp4');
        return;
      }
      if (!standard.paused && !covers(standard, time, 1)) { stop(); return; }
      if (hd.seeking || hd.readyState < hd.HAVE_CURRENT_DATA || !covers(hd, time, 3)) return;
      if (Math.abs(hd.currentTime - time) > .12) { hd.currentTime = time; return; }
      window.clearTimeout(deadline);
      showingHD = true;
      standard.pause();
      setActive(true);
    };
    const seekToRecording = () => { hd.currentTime = Math.min(standard.currentTime, hd.duration - .05); };
    const stalled = () => { if (showingHD && !hd.seeking && hd.readyState < hd.HAVE_FUTURE_DATA) stop(); };
    hd.addEventListener('loadedmetadata', seekToRecording);
    hd.addEventListener('waiting', stalled);
    hd.addEventListener('error', stop);
    const events = ['progress', 'timeupdate', 'canplay', 'seeked', 'loadeddata'];
    for (const event of events) {
      standard.addEventListener(event, update);
      hd.addEventListener(event, update);
    }
    update();
    return () => {
      fallback.current = undefined;
      hd.removeEventListener('loadedmetadata', seekToRecording);
      hd.removeEventListener('waiting', stalled);
      hd.removeEventListener('error', stop);
      for (const event of events) {
        standard.removeEventListener(event, update);
        hd.removeEventListener(event, update);
      }
      stop();
    };
  }, [standardRef, hdRef, id, enabled]);
  useEffect(() => {
    const hd = hdRef.current;
    if (!active || !hd) return;
    let cancelled = false;
    if (playing) void hd.play().catch(error => {
      if (!cancelled && error.name !== 'AbortError') fallback.current?.();
    });
    else hd.pause();
    return () => { cancelled = true; };
  }, [hdRef, active, playing]);
  return active;
}
