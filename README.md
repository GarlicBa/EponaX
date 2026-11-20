# EponaX

Project page for *Recipes for Training and Deploying World-Action Models in the Real World*.

[Open the project page](https://garlicba.github.io/eponax/)

## Local build

Use Node.js 22 or newer. Run `npm ci`, then `npm run build`. Run `npm run preview` to serve the static files in `dist/`. For editing with live reload, run `npm run dev`.

All videos, maps, figures and replay data are included in this repository. Playback works on a local HTTP server without an internet connection. Author and map attribution links open their respective websites when clicked.

## Publish

Commit your changes, then run `npm run deploy` with Git write access to the repository. This builds the site, pushes the source to `main`, and publishes the contents of `dist/` to the root of `gh-pages`. GitHub Pages serves the latter branch.
