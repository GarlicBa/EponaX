import { useEffect, useMemo, useReducer } from 'react';
import { asset, type Scene } from './demo-utils';
import { chunkFrames, replayFps, type ReplayChunk } from './replay-format';

type Entry = { data?: ReplayChunk; controller?: AbortController; failed?: boolean };

export function useReplayData(scene: Scene, frame: number, active: boolean, retry: number) {
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
      fetch(asset(`demo/playback/${scene.id}/${i}.json`), { signal: controller.signal })
        .then(response => {
          if (!response.ok) throw new Error('Recording unavailable');
          return response.json();
        })
        .then(data => { entry.data = data; })
        .catch(() => { entry.failed = true; })
        .finally(() => {
          if (controller.signal.aborted) return;
          entry.controller = undefined;
          refresh();
        });
    }
  }, [active, current, warmNext, entries, scene.id]);
  return entry;
}
