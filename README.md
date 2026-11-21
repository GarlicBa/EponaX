# EponaX

Project page for *Recipes for Training and Deploying World-Action Models in the Real World*.

[Open the project page](https://garlicba.github.io/EponaX/)

## Local build

Use Node.js 22 or newer. Run `npm ci`, then `npm run build`. Run `npm run preview` to serve the static files in `dist/`. For editing with live reload, run `npm run dev`.

All videos, maps, figures and replay data are included in this repository. Playback works on a local HTTP server without an internet connection. Author and map attribution links open their respective websites when clicked.

The video wall loops the first five seconds of the landscape or portrait MP4 at original quality. The full-resolution poster stays visible while slower or unmeasured connections download the loop. Faster connections can start streaming immediately. Opening a chapter directly defers the wall until it comes into view. Drives and attention comparisons use their original videos and posters at every connection speed. Once the cover loop is buffered and playing (or the cover poster is ready in reduced-motion mode), the three default Drives recordings begin preloading in display order. Each player prepares its original video, initial telemetry and street map together. Only the foreground player autoplays. The first group can start as soon as its video and frame data are ready. A user selection or a jump directly into Drives takes priority over background loading. Telemetry uses losslessly compressed four-second chunks, with plain JSON for browsers without gzip decompression support. Once the three Drives have prepared for startup, spare bandwidth loads the six default Attention recordings one at a time in display order. Background downloads yield to foreground media and replay data, resuming from completed byte ranges. Visible Attention players use the original MP4 from memory when ready or stream it immediately on selection. Other Attention recordings load on demand. Attention players release their video source when scrolled offscreen.

## Publish

Commit your changes, then run `npm run deploy` with Git write access to the repository. This builds the site, pushes the source to `main`, and publishes the contents of `dist/` to the root of `gh-pages`. GitHub Pages serves the latter branch.
