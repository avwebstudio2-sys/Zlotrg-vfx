# zlotrgvfx

Portfolio website for freelance video editor **zlotrgvfx**. Static HTML/CSS/JS, no build step.

## Run locally

```
python -m http.server 5500
```

## Edit

- Contact details (WhatsApp, Instagram): `CONFIG` at the top of `js/main.js`
- Portfolio videos: `assets/work/` (720p MP4 with faststart + a JPG poster); each `.card` in `index.html` points at them via `data-video` and `data-poster`
- Hero: planet-rim glow video (desktop) over static canvas stars and a canvas rim fallback; layout is a 1672x941 design stage scaled to the viewport

Website by [A&V Web Studio](https://avstudio.site)
