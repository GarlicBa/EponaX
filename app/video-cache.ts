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

async function validatedEntry(path: string, signal: AbortSignal, priority: 'low' | 'high') {
  let saved: Response | undefined;
  try {
    saved = await (await openCache()).match(asset(path));
  } catch {
    writable = false;
    return;
  }
  const validator = saved?.headers.get('X-File-Validator');
  if (!saved || !validator || signal.aborted) return;
  const head = await fetch(asset(path), { method: 'HEAD', cache: 'no-cache', priority, signal });
  if (head.ok && !signal.aborted && fileValidator(head.headers) === validator &&
      head.headers.get('Content-Length') === saved.headers.get('Content-Length')) return saved;
}

export async function checkVideoCache(path: string, signal: AbortSignal) {
  if (await validatedEntry(path, signal, 'low')) ready.add(path);
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
export async function readCachedVideo(path: string, selection?: AbortSignal) {
  try {
    const response = selection && !ready.has(path)
      ? await validatedEntry(path, selection, 'high')
      : await (await openCache()).match(asset(path));
    if (response && !selection?.aborted) {
      const file = await response.blob();
      if (!selection?.aborted && file.size > 0 && file.size === Number(response.headers.get('Content-Length'))) {
        ready.add(path);
        return file;
      }
    }
  } catch { /* Storage became unavailable after preloading. */ }
  if (!selection?.aborted) ready.delete(path);
  return undefined;
}
