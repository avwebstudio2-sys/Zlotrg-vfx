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

## SEO

- Domain: `https://zlotrgvfx.site/` is used in the canonical, Open Graph/Twitter tags, JSON-LD (`index.html`), `robots.txt` and `sitemap.xml`. Change all of them together if the domain changes.
- Social preview image: `assets/img/og-hero.jpg` (1200x630).
- Structured data: Organization, WebSite, WebPage, Service and one VideoObject per portfolio video. When you add a project, add its VideoObject and a `<video:video>` entry in `sitemap.xml`.
- `vercel.json` sets cache headers for `/assets/*` (ignored by other hosts). `404.html` is the not-found page.

## Security

- No backend, database, forms, cookies or analytics. Fonts (`assets/fonts`, OFL) and GSAP/Lenis (`assets/vendor`) are self-hosted, so the page makes no third-party requests.
- Security headers (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) live in `vercel.json` and, for Netlify/Cloudflare Pages, in `_headers`. If you add a third-party script, font or embed, extend the CSP there.

Website by [A&V Web Studio](https://avstudio.site)
