import { useEffect, useMemo, useReducer } from 'react';
import { asset, type Scene } from './demo-utils';
import { trackDriveRequest } from './web-media';
import { chunkFrames, replayFps, type ReplayChunk } from './replay-format';

type Entry = { data?: ReplayChunk; controller?: AbortController; failed?: boolean };

async function readChunk(path: string, options: RequestInit): Promise<ReplayChunk> {
  const compressed = typeof DecompressionStream === 'function';
  const response = await fetch(asset(compressed ? path + '.gz' : path), options);
  if (!response.ok) throw new Error('Recording unavailable');
  if (!compressed) return response.json();
  // Some hosts send Content-Encoding and the browser has already decoded the body.
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return JSON.parse(new TextDecoder().decode(bytes));
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return new Response(stream).json();
}

export function useReplayData(scene: Scene, frame: number, active: boolean, retry: number, foreground: boolean) {
  const entries = useMemo(() => new Map<number, Entry>(), [scene.id, retry]);
  const [, refresh] = useReducer(n => n + 1, 0);
  const current = Math.floor(frame / chunkFrames);
  const entry = entries.get(current);
  const warmNext = Boolean(entry?.data) && frame % chunkFrames >= chunkFrames / 2
    && (current + 1) * chunkFrames < Math.round(scene.duration * replayFps);

  useEffect(() => () => {
    for (const value of entries.values()) value.controller?.abort();
    entries.clear();
  }, [entries]);

  useEffect(() => {
    // Keep the adjacent windows for normal playback and short backward seeks.
    // On a cut or a long seek, cancel obsolete transfers immediately.
    for (const [i, value] of entries) {
      const needTransfer = active && (i === current || (warmNext && i === current + 1));
      if (Math.abs(i - current) > 1 || (value.controller && !needTransfer)) {
        value.controller?.abort();
        entries.delete(i);
      }
    }
    if (!active) return;
    for (const i of warmNext ? [current, current + 1] : [current]) {
      if (entries.has(i)) continue;
      const controller = new AbortController();
      const entry: Entry = { controller };
      entries.set(i, entry);
      trackDriveRequest(() => readChunk(`demo/playback/${scene.id}/${i}.json`, {
        signal: controller.signal, priority: foreground ? 'high' : 'low',
      }))
        .then(data => { entry.data = data; })
        .catch(() => { entry.failed = true; })
        .finally(() => {
          if (controller.signal.aborted) return;
          entry.controller = undefined;
          refresh();
        });
    }
  }, [active, current, warmNext, entries, scene.id, foreground]);
  return entry;
}
