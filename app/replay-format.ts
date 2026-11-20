import type { Frame, Guidance } from './demo-utils';

export const replayFps = 10;
export const chunkFrames = 4 * replayFps;
export const smoothingRadius = 2;

export type ReplayChunk = {
  firstFrame: number;
  frames: Frame[];
  guidance: Guidance[];
};
