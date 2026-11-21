import { useEffect, useRef } from 'react';
import { asset } from './demo-utils';
import { bufferedUntil, pendingDriveRequests } from './web-media';

export type DriveBandwidth = 'busy' | 'idle' | 'outside';

type PartialClip = { parts: Blob[]; size: number; validator: string | null };
const partSize = 512 * 1024;

// Retain finished ranges when a foreground player needs the connection.
// If the host ignores Range or the file changed, use its full replacement.
async function fetchPart(id: string, clip: PartialClip, signal: AbortSignal) {
  const headers = new Headers({ Range: `bytes=${clip.size}-${clip.size + partSize - 1}` });
  if (clip.size && clip.validator) headers.set('If-Range', clip.validator);
  const response = await fetch(asset(`attention/${id}.mp4`), { headers, priority: 'low', signal });
  if (!response.ok) throw new Error('Attention preload unavailable');
  if (response.status === 200) return new Blob([await response.blob()], { type: 'video/mp4' });
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('Content-Range') ?? '');
  if (!range || Number(range[1]) !== clip.size || Number(range[2]) >= Number(range[3])) {
    throw new Error('Invalid attention video range');
  }
  const part = await response.blob();
  if (part.size !== Number(range[2]) + 1 - clip.size || !part.size) throw new Error('Incomplete attention video range');
  if (signal.aborted) return;
  const etag = response.headers.get('ETag');
  clip.validator = etag && !etag.startsWith('W/') ? etag : response.headers.get('Last-Modified');
  clip.parts.push(part);
  clip.size += part.size;
  if (clip.size === Number(range[3])) return new Blob(clip.parts, { type: 'video/mp4' });
}

// Chrome can keep a paused metadata request in NETWORK_LOADING indefinitely
// after buffering its startup window. Watch actual progress on these players.
function retainedDrive(video: HTMLVideoElement) {
  if (!video.paused || video.preload !== 'metadata' || !video.closest('.replay')) return false;
  return bufferedUntil(video) >= Math.min(video.currentTime + 4, video.duration - .05);
}

function foregroundNeedsNetwork() {
  if (document.hidden || pendingDriveRequests) return true;
  return Array.from(document.querySelectorAll<HTMLVideoElement>('video')).some(video => {
    if (video.hasAttribute('data-downloading')) return true;
    if (video.error) return false;
    if (!video.hasAttribute('src')) return video.classList.contains('attention-film');
    if (video.src.startsWith('blob:')) return false;
    if (video.seeking) return true;
    if (video.networkState === video.NETWORK_LOADING && !retainedDrive(video)) return true;
    if (video.paused) return false;
    const target = Math.min(video.duration - .05, video.currentTime + 6 * video.playbackRate);
    return !(bufferedUntil(video) >= target);
  });
}

export function useAttentionPreload(ids: readonly string[], budget: DriveBandwidth, inView: boolean) {
  const urls = useRef(new Map<string, string>());
  const partials = useRef(new Map<string, PartialClip>());
  const unlocked = useRef(false);
  useEffect(() => {
    const cache = urls.current;
    return () => { for (const url of cache.values()) URL.revokeObjectURL(url); cache.clear(); };
  }, []);
  useEffect(() => {
    if (budget === 'idle') unlocked.current = true;
    if (!(budget === 'idle' || (budget === 'outside' && unlocked.current && inView))) return;

    const failed = new Set<string>();
    let disposed = false;
    let request: AbortController | null = null;
    let timer = 0;
    let quietAfter = performance.now() + 1000;
    function queue(delay: number) {
      if (disposed || urls.current.size === ids.length) return;
      if (foregroundNeedsNetwork()) {
        window.clearTimeout(timer);
        timer = 0;
        request?.abort();
      } else if (!request && !timer) {
        timer = window.setTimeout(load, Math.max(delay, quietAfter - performance.now()));
      }
    }
    async function load() {
      timer = 0;
      if (disposed || foregroundNeedsNetwork()) return;
      // A visible native player already owns its recording. Leave it in place.
      const streaming = new Set(Array.from(document.querySelectorAll<HTMLVideoElement>('.attention-film[src]'),
        video => video.closest<HTMLElement>('[data-recording]')?.dataset.recording));
      const id = ids.find(id => !urls.current.has(id) && !failed.has(id) && !streaming.has(id));
      if (!id) return;
      const controller = new AbortController();
      request = controller;
      const clip = partials.current.get(id) ?? { parts: [], size: 0, validator: null };
      partials.current.set(id, clip);
      try {
        const file = await fetchPart(id, clip, controller.signal);
        if (file && !controller.signal.aborted) {
          urls.current.set(id, URL.createObjectURL(file));
          partials.current.delete(id);
        }
      } catch {
        if (!controller.signal.aborted) { failed.add(id); partials.current.delete(id); }
      } finally {
        request = null;
        queue(controller.signal.aborted ? 200 : 0);
      }
    }
    function schedule(event?: Event) {
      if (event?.type === 'progress' && event.target instanceof HTMLVideoElement && retainedDrive(event.target)) {
        quietAfter = performance.now() + 1000;
        window.clearTimeout(timer);
        timer = 0;
        request?.abort();
      }
      queue(200);
    }
    const events = ['loadstart', 'waiting', 'seeking', 'progress', 'suspend', 'canplay', 'playing', 'pause',
      'emptied', 'visibilitychange', 'eponax:drive-traffic', 'eponax:cover-traffic'];
    for (const event of events) document.addEventListener(event, schedule, true);
    schedule();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      request?.abort();
      for (const event of events) document.removeEventListener(event, schedule, true);
    };
  }, [ids, budget, inView]);
  return urls.current;
}
