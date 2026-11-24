# Project landing page

A static page (`index.html`, no build step) with screenshots of the real overlay, what it does, the download link and the FAQ. **Not published yet**: turning on GitHub Pages is Yaniv's call.

- Preview: `python3 -m http.server --directory docs/site`, then open http://localhost:8000.
- Download: links to `releases/latest`; a small script swaps in the direct installer link, version and size from the GitHub API, and the static link works without it.
- Fonts (Cinzel, Alegreya Sans, SIL OFL) are served from `fonts/`, so visitors make no third-party requests apart from that GitHub API call.
- Screenshots in `img/` come from the offscreen UI tour on Windows (1440p, a Witch with a PoB build, over the test background, not game art), cropped with ffmpeg to WebP. Retake them after visible UI changes.
- To publish: GitHub Pages can only serve `/` or `/docs` from a branch, so this folder needs either a Pages workflow (upload `docs/site` with `actions/upload-pages-artifact`) or moving the files into `docs/`.
