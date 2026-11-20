import { defineConfig } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeroCover } from './app/HeroCover';
import { replayChunks } from './scripts/replay-chunks';
export default defineConfig({
  base: './',
  plugins: [
    replayChunks(),
    { name: 'paper-cover', transformIndexHtml: html =>
      html.replace('<!-- paper cover -->', renderToStaticMarkup(createElement(HeroCover))) },
  ],
  esbuild: { jsx: 'automatic' },
  server: { host: '127.0.0.1', port: 5173 },
  preview: { host: '127.0.0.1', port: 5173, strictPort: true },
});
