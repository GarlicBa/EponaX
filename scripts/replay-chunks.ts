import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';
import type { Recording } from '../app/demo-utils';
import { chunkFrames, replayFps, smoothingRadius, type ReplayChunk } from '../app/replay-format';

function chunk(source: Recording, number: number): ReplayChunk {
  const start = number * chunkFrames;
  const end = start + chunkFrames;
  const firstFrame = Math.max(0, start - smoothingRadius);
  const guidance = source.guidance ?? [];
  const prior = guidance.findLast(update => update.frame < start);
  const updates = guidance.filter(update => update.frame >= start && update.frame < end);
  return {
    firstFrame,
    frames: source.frames.slice(firstFrame, end + smoothingRadius).map(frame => ({
      speed: frame.speed, steering: frame.steering, signal: frame.signal, road: frame.road,
      limit: frame.limit, intervention: frame.intervention, projection: frame.projection, navigation: frame.navigation,
    })),
    guidance: prior ? [prior, ...updates] : updates,
  };
}

// Publish small static files for Pages. The dev server serves the same slices.
export function replayChunks(): Plugin {
  let directory: string;
  function read(id: string): Recording {
    const recording = JSON.parse(readFileSync(join(directory, id + '.json'), 'utf8')) as Recording;
    if (recording.fps !== replayFps) throw new Error('Unexpected replay frame rate for ' + id);
    return recording;
  }
  return {
    name: 'drive-replay-chunks',
    configResolved(config) { directory = join(config.publicDir, 'demo/data'); },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = req.url?.split('?')[0].match(/\/demo\/playback\/([a-z]+_\d+)\/(\d+)\.json(\.gz)?$/);
        if (!match || !existsSync(join(directory, match[1] + '.json'))) return next();
        const source = read(match[1]);
        const number = Number(match[2]);
        if (number * chunkFrames >= source.frames.length) { res.statusCode = 404; res.end(); return; }
        const json = JSON.stringify(chunk(source, number));
        res.setHeader('Content-Type', match[3] ? 'application/gzip' : 'application/json');
        res.end(match[3] ? gzipSync(json) : json);
      });
    },
    generateBundle() {
      for (const file of readdirSync(directory).filter(name => name.endsWith('.json'))) {
        const id = file.slice(0, -5);
        const source = read(id);
        for (let i = 0; i * chunkFrames < source.frames.length; i++) {
          const fileName = `demo/playback/${id}/${i}.json`;
          const json = JSON.stringify(chunk(source, i));
          this.emitFile({ type: 'asset', fileName, source: json });
          this.emitFile({ type: 'asset', fileName: fileName + '.gz', source: gzipSync(json) });
        }
      }
    },
  };
}
