# EponaX

Project page for *Recipes for Training and Deploying World-Action Models in the Real World*.

[Open the project page](https://garlicba.github.io/EponaX/)

## Local build

Use Node.js 22 or newer. Run `npm ci`, then `npm run build`. Run `npm run preview` to serve the static files in `dist/`. For editing with live reload, run `npm run dev`.

All videos, maps, figures and replay data are included in this repository. Playback works on a local HTTP server without an internet connection. Author and map attribution links open their respective websites when clicked.

The video wall loops a five-second H.264 clip for the current orientation. A WebP poster stays visible while the player measures download progress and buffers enough video to start the loop. Opening a chapter directly defers the wall until it comes into view. Drives and Attention use H.264 recordings at their original resolution and frame rate at every connection speed. Once the cover loop is buffered and playing (or the cover poster is ready in reduced-motion mode), the three default Drives recordings begin preloading in display order. Each player prepares its video, initial telemetry and street map together. Only the foreground player autoplays. The first group can start as soon as its video and frame data are ready. A user selection or a jump directly into Drives takes priority over background loading. Telemetry uses losslessly compressed four-second chunks, with plain JSON for browsers without gzip decompression support. Once the three Drives have prepared for startup, spare bandwidth loads the six default Attention recordings one at a time in display order. Background downloads yield to foreground media and replay data, resuming from completed byte ranges. Visible Attention players use the cached MP4 from memory when ready or stream it immediately on selection. After all six are cached, the queue warms the Pipeline animation and figures, then the Road tests route data and basemap. Next it caches the other 15 first-page Drives videos, the 10 remaining Attention videos, and the 22 later-page Drives videos in display order. Optional videos use browser Cache Storage and are skipped in data-saver mode or if storage is unavailable. User interaction, foreground transfers and hidden tabs suspend speculative downloads. Benchmarks are included in the main bundle and appendix maps load on demand. Attention players release their video source when scrolled offscreen.

## Publish

Commit your changes, then run `npm run deploy` with Git write access to the repository. This builds the site, pushes the source to `main`, and publishes the contents of `dist/` to the root of `gh-pages`. GitHub Pages serves the latter branch.
