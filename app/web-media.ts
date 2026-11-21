import { useEffect, useRef, useState, type RefObject } from 'react';
import { asset } from './demo-utils';

export function useNearby(ref: RefObject<HTMLElement | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '120px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return near;
}

// Replay data and navigation share bandwidth with the foreground camera.
export let pendingDriveRequests = 0;
export function beginDriveRequest() {
  pendingDriveRequests++;
  document.dispatchEvent(new Event('eponax:drive-traffic'));
  let pending = true;
  return () => {
    if (!pending) return;
    pending = false;
    pendingDriveRequests--;
    document.dispatchEvent(new Event('eponax:drive-traffic'));
  };
}

export async function trackDriveRequest<T>(load: () => Promise<T>) {
  const finish = beginDriveRequest();
  try { return await load(); } finally { finish(); }
}

export function bufferedUntil(video: HTMLVideoElement) {
  for (let i = 0; i < video.buffered.length; i++) {
    if (video.buffered.start(i) <= video.currentTime && video.currentTime < video.buffered.end(i)) {
      return video.buffered.end(i);
    }
  }
  return video.currentTime;
}

// Detaching the source cancels the native range request as well as decoding.
// Restore the playhead on return so scrolling away doesn't restart a scene.
export function useVideoSource(ref: RefObject<HTMLVideoElement | null>, path: string, active: boolean, retry = 0) {
  const resume = useRef(0);
  useEffect(() => {
    const video = ref.current;
    if (!video || !active) return;
    const restore = () => {
      if (resume.current > 0 && resume.current < video.duration) video.currentTime = resume.current;
    };
    video.addEventListener('loadedmetadata', restore);
    video.src = asset(path);
    return () => {
      if (video.readyState >= HTMLMediaElement.HAVE_METADATA) resume.current = video.currentTime;
      video.removeEventListener('loadedmetadata', restore);
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [ref, path, active, retry]);
}
