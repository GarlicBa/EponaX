import { useEffect, useRef } from 'react';
import { chapterPaths, hasChapterAsset, warmChapterAsset } from './chapter-assets';
import { asset } from './demo-utils';
import { canCacheVideos, checkVideoCache, fileValidator, hasCachedVideo, storeVideo } from './video-cache';
import { bufferedUntil, pendingDriveRequests } from './web-media';

export type DriveBandwidth = 'busy' | 'idle' | 'outside';

type PartialClip = { parts: Blob[]; size: number; validator: string | null };
const partSize = 512 * 1024;

// Retain finished ranges when a foreground player needs the connection.
// If the host ignores Range or the file changed, use its full replacement.
async function fetchPart(path: string, clip: PartialClip, signal: AbortSignal) {
  const headers = new Headers({ Range: `bytes=${clip.size}-${clip.size + partSize - 1}` });
  if (clip.size && clip.validator) headers.set('If-Range', clip.validator);
  const response = await fetch(asset(path), { headers, priority: 'low', signal });
  if (!response.ok) throw new Error('Video preload unavailable');
  if (response.status === 200) {
    const file = await response.blob();
    if (signal.aborted) return;
    clip.validator = fileValidator(response.headers);
    return new Blob([file], { type: 'video/mp4' });
  }
  const range = /^bytes (\d+)-(\d+)\/(\d+)$/.exec(response.headers.get('Content-Range') ?? '');
  if (!range || Number(range[1]) !== clip.size || Number(range[2]) >= Number(range[3])) {
    throw new Error('Invalid video range');
  }
  const part = await response.blob();
  if (part.size !== Number(range[2]) + 1 - clip.size || !part.size) throw new Error('Incomplete video range');
  if (signal.aborted) return;
  clip.validator = fileValidator(response.headers);
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
  // Chapter images and route data keep priority at the Attention/Architecture boundary.
  const method = document.getElementById('method');
  if (method && method.getBoundingClientRect().top <= window.innerHeight + 120) return true;
  return Array.from(document.querySelectorAll<HTMLVideoElement>('video')).some(video => {
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

export function useDemoPreload(attention: readonly string[], optionalVideos: readonly string[], budget: DriveBandwidth, inView: boolean) {
  const urls = useRef(new Map<string, string>());
  const checked = useRef(new Set<string>());
  const writing = useRef(false);
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
    const nextChapter = () => chapterPaths.find(path => !hasChapterAsset(path) && !failed.has(path));
    function queue(delay: number) {
      if (disposed || (urls.current.size === attention.length && !nextChapter() &&
          (!canCacheVideos() || optionalVideos.every(hasCachedVideo)))) return;
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
      if (disposed || writing.current || foregroundNeedsNetwork()) return;
      // A visible native player already owns its recording. Leave it in place.
      const defaultsReady = urls.current.size === attention.length;
      const chapter = defaultsReady ? nextChapter() : undefined;
      const optional = defaultsReady && !chapter;
      if (optional && !canCacheVideos()) return;
      const streaming = new Set(Array.from(document.querySelectorAll<HTMLVideoElement>('video[src]'), video => video.src));
      const paths = optional ? optionalVideos : attention;
      const path = chapter ?? paths.find(path => !failed.has(path) && !urls.current.has(path) && !hasCachedVideo(path) &&
        !streaming.has(new URL(asset(path), document.baseURI).href));
      if (!path) return;
      const controller = new AbortController();
      request = controller;
      const clip = partials.current.get(path) ?? { parts: [], size: 0, validator: null };
      try {
        if (chapter) {
          await warmChapterAsset(chapter, controller.signal);
          return;
        }
        if (optional && !checked.current.has(path)) {
          await checkVideoCache(path, controller.signal);
          if (controller.signal.aborted || !canCacheVideos()) return;
          checked.current.add(path);
          if (hasCachedVideo(path)) return;
        }
        partials.current.set(path, clip);
        const file = await fetchPart(path, clip, controller.signal);
        if (file && !controller.signal.aborted) {
          partials.current.delete(path);
          if (optional) {
            writing.current = true;
            try { await storeVideo(path, file, clip.validator); }
            finally {
              writing.current = false;
              document.dispatchEvent(new Event('eponax:drive-cache'));
            }
          } else urls.current.set(path, URL.createObjectURL(file));
        }
      } catch {
        if (!controller.signal.aborted) { failed.add(path); partials.current.delete(path); }
      } finally {
        request = null;
        queue(controller.signal.aborted ? 200 : optional ? 100 : 0);
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
    function yieldToInteraction() {
      if (urls.current.size === attention.length && !nextChapter() && optionalVideos.every(hasCachedVideo)) return;
      quietAfter = performance.now() + 1000;
      window.clearTimeout(timer);
      timer = 0;
      request?.abort();
      queue(1000);
    }
    const interactions = ['pointerdown', 'keydown', 'scroll'];
    for (const event of interactions) document.addEventListener(event, yieldToInteraction, { capture: true, passive: true });
    const events = ['loadstart', 'waiting', 'seeking', 'progress', 'suspend', 'canplay', 'playing', 'pause',
      'emptied', 'visibilitychange', 'eponax:drive-traffic', 'eponax:drive-cache', 'eponax:media-released'];
    for (const event of events) document.addEventListener(event, schedule, true);
    schedule();
    return () => {
      disposed = true;
      window.clearTimeout(timer);
      request?.abort();
      for (const event of interactions) document.removeEventListener(event, yieldToInteraction, true);
      for (const event of events) document.removeEventListener(event, schedule, true);
    };
  }, [attention, optionalVideos, budget, inView]);
  return urls.current;
}
