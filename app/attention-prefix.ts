import { asset } from './demo-utils';

// End offsets after 42 encoded frames (10 fps, including B-frame lookahead)
// in the six fast-start MP4s. The bytes include the complete sample tables.
export const attentionHeadBytes: Record<string, number> = {
  'attention/city_19.mp4': 820231,
  'attention/night_11.mp4': 712371,
  'attention/city_06.mp4': 731962,
  'attention/night_01.mp4': 654960,
  'attention/city_01.mp4': 646590,
  'attention/night_14.mp4': 645402,
};

export type PartialClip = { parts: Blob[]; size: number; total: number; validator: string | null };
const workerUrl = () => new URL(asset('attention-worker.js'), document.baseURI).href;
let registration: Promise<unknown> | undefined;

export function enableAttentionWorker() {
  if (!navigator.serviceWorker || !window.isSecureContext) return;
  registration ??= navigator.serviceWorker.register(workerUrl()).catch(() => undefined);
}

export function listenForAttentionHeads(partials: ReadonlyMap<string, PartialClip>) {
  const workers = navigator.serviceWorker;
  if (!workers) return;
  function answer(event: MessageEvent) {
    if (event.data?.type !== 'eponax:attention-head' || event.source !== workers.controller) return;
    const path = event.data.path;
    const clip = partials.get(path);
    const head = clip?.validator && clip.size >= attentionHeadBytes[path]
      ? { file: new Blob(clip.parts, { type: 'video/mp4' }), validator: clip.validator, total: clip.total }
      : null;
    event.ports[0]?.postMessage(head);
  }
  workers.addEventListener('message', answer);
  return () => workers.removeEventListener('message', answer);
}

export function attentionHeadUrl(path: string, partials: ReadonlyMap<string, PartialClip>) {
  const clip = partials.get(path);
  if (clip?.validator && clip.size >= attentionHeadBytes[path] &&
      navigator.serviceWorker?.controller?.scriptURL === workerUrl()) {
    return asset(path) + '?eponax-start=1';
  }
}
