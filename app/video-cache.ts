import { asset } from './demo-utils';

// Only promote files validated or downloaded during this visit. The Cache API
// holds the MP4s on disk; a player creates a blob URL only for its selected clip.
const ready = new Set<string>();
let storage: Promise<Cache> | undefined;
let writable = true;
function openCache() {
  return storage ??= window.caches.open('eponax-demo-videos-v1');
}
export const hasCachedVideo = (path: string) => ready.has(path);
export const canCacheVideos = () => writable && 'caches' in window &&
  !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;

export function fileValidator(headers: Headers) {
  const tag = headers.get('ETag');
  return tag && !tag.startsWith('W/') ? tag : headers.get('Last-Modified');
}

export async function checkVideoCache(path: string, signal: AbortSignal) {
  const url = asset(path);
  let saved: Response | undefined;
  try {
    saved = await (await openCache()).match(url);
  } catch {
    writable = false;
    return;
  }
  const validator = saved?.headers.get('X-File-Validator');
  if (!saved || !validator || signal.aborted) return;
  const head = await fetch(url, { method: 'HEAD', cache: 'no-cache', priority: 'low', signal });
  if (head.ok && fileValidator(head.headers) === validator &&
      head.headers.get('Content-Length') === saved.headers.get('Content-Length')) ready.add(path);
}

export async function storeVideo(path: string, file: Blob, validator: string | null) {
  try {
    const headers = { 'Content-Type': 'video/mp4', 'Content-Length': String(file.size), 'X-File-Validator': validator ?? '' };
    await (await openCache()).put(asset(path), new Response(file, { headers }));
    ready.add(path);
  } catch {
    // Quota or private-mode restrictions: leave the player on native streaming.
    writable = false;
  }
}

// A missing/evicted entry must never prevent foreground playback.
export async function readCachedVideo(path: string) {
  try {
    const response = await (await openCache()).match(asset(path));
    if (response) return await response.blob();
  } catch { /* Storage became unavailable after preloading. */ }
  ready.delete(path);
  return undefined;
}
