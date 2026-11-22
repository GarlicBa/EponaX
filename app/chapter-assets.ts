import { asset } from './demo-utils';
import { architectureModules } from './architecture-modules';
import art from './pipeline-art.json';

export const pipelineAtlas = 'research/framework-reveal.webp?v=' + art.atlasVersion;
export const pipelineStill = 'research/framework.webp';
export const roadRoutes = 'demo/routes.json';
export const roadBasemap = 'research/pudong-streets.webp';
export const chapterPaths = [
  pipelineAtlas, pipelineStill,
  ...architectureModules.flatMap(module => module.figures.map(figure => figure.path)),
  roadRoutes, roadBasemap,
];

// Warmed chapter resources live for this document's lifetime. On a direct jump the
// chapter uses its usual URL immediately, without waiting for a speculative fetch.
const warmed = new Map<string, string>();
export const chapterAsset = (path: string) => warmed.get(path) ?? asset(path);
export const hasChapterAsset = (path: string) => warmed.has(path);
// Images already held by the mounted Pipeline can keep using their native URL.
export function noteLoadedChapterImage(path: string) {
  if (!warmed.has(path)) warmed.set(path, asset(path));
}
export async function warmChapterAsset(path: string, signal: AbortSignal) {
  const response = await fetch(asset(path), { priority: 'low', signal });
  if (!response.ok) throw new Error('Chapter asset unavailable');
  const file = await response.blob();
  if (!signal.aborted && !warmed.has(path)) warmed.set(path, URL.createObjectURL(file));
}
