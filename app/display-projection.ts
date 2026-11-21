import type { Frame } from './demo-utils';

import { smoothingRadius } from './replay-format';

type Point = [number, number];
const samples = 10;
const maxShift = 10; // Pixels in the 960 × 540 front view.

// The camera clips each prediction independently, so point indices can shift
// between frames. Match points by their distance along the visible path.
function samplePath(projection: number[][]): Point[] {
  const points: Point[] = projection.map(([u, v]) => [u * 960, v * 540]);
  if (points.length < 2) return points;
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(x - points[i - 1][0], y - points[i - 1][1]));
  }
  const total = lengths[lengths.length - 1];
  if (total === 0) return [points[0]];
  let end = 1;
  return Array.from({ length: samples }, (_, i) => {
    const distance = total * (i / (samples - 1));
    while (end < points.length - 1 && lengths[end] < distance) end++;
    const fraction = (distance - lengths[end - 1]) / (lengths[end] - lengths[end - 1] || 1);
    const [x, y] = points[end - 1];
    return [x + fraction * (points[end][0] - x), y + fraction * (points[end][1] - y)];
  });
}

export function displayProjection(frames: Frame[], index: number): Point[] {
  const center = samplePath(frames[index].projection);
  if (center.length < 2) return center;

  // A centered five-frame binomial filter follows steady turns without the
  // delay of a trailing average. End the window at a missing projection.
  const sum = center.map(() => [0, 0]);
  let weightSum = 6;
  for (const direction of [-1, 1]) {
    for (let step = 1; step <= smoothingRadius; step++) {
      const neighbor = frames[index + direction * step];
      if (!neighbor) break;
      const path = samplePath(neighbor.projection);
      if (path.length !== center.length) break;
      const weight = step === 1 ? 4 : 1;
      weightSum += weight;
      for (let i = 0; i < path.length; i++) {
        sum[i][0] += weight * (path[i][0] - center[i][0]);
        sum[i][1] += weight * (path[i][1] - center[i][1]);
      }
    }
  }
  return center.map(([x, y], i) => {
    const [dx, dy] = sum[i];
    const divisor = Math.max(weightSum, Math.hypot(dx, dy) / maxShift);
    return [x + dx / divisor, y + dy / divisor];
  });
}
