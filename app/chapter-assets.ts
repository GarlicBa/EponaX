import { asset } from './demo-utils';
import art from './pipeline-art.json';

export const pipelineAtlas = 'research/framework-reveal.webp?v=' + art.atlasVersion;
export const pipelineStill = 'research/framework.webp';
export const roadRoutes = 'demo/routes.json';
export const roadBasemap = 'research/pudong-streets.webp';
export const chapterPaths = [
  pipelineAtlas, pipelineStill, 'research/nav-encoder.webp', 'research/nav-alignment.webp',
  'research/mvtok.webp', roadRoutes, roadBasemap,
];

// Seven small resources live for this document's lifetime. On a direct jump the
// chapter uses its usual URL immediately, without waiting for a speculative fetch.
const warmed = new Map<string, string>();
export const chapterAsset = (path: string) => warmed.get(path) ?? asset(path);
export const hasChapterAsset = (path: string) => warmed.has(path);
export async function warmChapterAsset(path: string, signal: AbortSignal) {
  const response = await fetch(asset(path), { priority: 'low', signal });
  if (!response.ok) throw new Error('Chapter asset unavailable');
  const file = await response.blob();
  if (!signal.aborted && !warmed.has(path)) warmed.set(path, URL.createObjectURL(file));
}
