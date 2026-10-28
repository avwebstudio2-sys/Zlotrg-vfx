/* ==========================================================
   zlotrgvfx — site interactions
   Edit CONFIG below with your real contact details.
   ========================================================== */
const CONFIG = {
  whatsapp: "387603041784",         // +387 60 304 1784 — international format, digits only
  instagram: "zlotrg.vfx",          // handle without @
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

gsap.registerPlugin(ScrollTrigger);
// Phones: the address bar showing/hiding resizes the viewport; don't re-measure every trigger for that.
ScrollTrigger.config({ ignoreMobileResize: true });
const isPhone = window.matchMedia("(max-width: 640px)").matches;

/* ---------- Contact links ---------- */
function setupContact() {
  document.querySelectorAll(".js-wa").forEach((a) => {
    const text = encodeURIComponent(a.dataset.waText || "Hi!");
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${text}`;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-ig").forEach((a) => (a.href = `https://www.instagram.com/${CONFIG.instagram}/`));
  document.querySelectorAll(".js-ig-handle").forEach((el) => (el.textContent = `@${CONFIG.instagram}`));
  document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------- Tab title ----------
   The full title stays in the HTML for search results; once the visitor scrolls, the tab shows just the brand. */
function setupTabTitle() {
  const onScroll = () => {
    if (window.scrollY < 10) return;
    document.title = "Zlotrgvfx";
    window.removeEventListener("scroll", onScroll);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Smooth scroll ---------- */
let lenis = null;
function setupLenis() {
  if (reduceMotion || typeof Lenis === "undefined") return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* ---------- Hero sky + stage ----------
   Static sky: stars and the planet-rim fallback are painted once per resize.
   Nothing in the sky is animated in code; only the glow video moves it. */
const STAGE = { w: 1672, h: 941, skyH: 717 };
// Planet geometry in design px, matched to the glow video (rim bottom at y≈212, centre x≈850)
const PLANET = { cx: 850, cy: -584, r: 796 };
const stackedMQ = window.matchMedia("(max-width: 899px), (orientation: portrait)");

const hero = {
  el: document.querySelector(".hero"),
  stars: document.querySelector(".sky__stars"),
  rim: document.querySelector(".sky__rim"),
  video: document.querySelector(".sky__video"),
};

// Small polar colour table: angle from the rim's lowest point → colour (magenta centre, violet sides)
const RIM_TABLE = (() => {
  const stops = [[240, 171, 252], [217, 70, 239], [168, 85, 247], [124, 58, 237], [91, 33, 182]];
  const n = 16, out = [];
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * (stops.length - 1), k = Math.floor(t), f = t - k;
    const a = stops[k], b = stops[Math.min(k + 1, stops.length - 1)];
    out.push(a.map((v, j) => v + (b[j] - v) * f));
  }
  return out;
})();

function paintRim(canvas, cssW, cssH, k, offX) {
  const q = 0.5; // paint at half resolution; the browser smooths it up
  const w = Math.max(1, Math.round(cssW * q)), h = Math.max(1, Math.round(cssH * q));
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const img = ctx.createImageData(w, h);
  const d = img.data;
  const unit = 1 / (k * q); // design px per canvas px
  for (let y = 0; y < h; y++) {
    const dy = y * unit - PLANET.cy;
    for (let x = 0; x < w; x++) {
      const dx = (x / q - offX) / k - PLANET.cx;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const off = dist - PLANET.r; // <0 inside the planet, >0 in space
      const ang = Math.abs(Math.atan2(dx, dy)); // 0 at the lowest point of the rim
      if (ang > 1.5) continue;
      const fade = Math.max(0, Math.cos(ang * 1.05)) ** 1.4;
      let I;
      if (off >= 0) I = 1.0 * Math.exp(-off / 9) + 0.35 * Math.exp(-off / 60);
      else {
        const streak = 0.55 + 0.45 * Math.sin(ang * 140 + dist * 0.045) * Math.sin(ang * 37 - dist * 0.02);
        I = 1.1 * Math.exp(off / 7) + 0.32 * Math.exp(off / 140) * streak;
      }
      I *= fade;
      const hot = Math.exp(-(off * off) / 40) * Math.exp(-ang * ang * 90); // white-hot point
      const c = RIM_TABLE[Math.min(15, Math.floor((ang / 1.5) * 16))];
      const i = (y * w + x) * 4;
      d[i] = Math.min(255, c[0] * I + 255 * hot);
      d[i + 1] = Math.min(255, c[1] * I + 245 * hot);
      d[i + 2] = Math.min(255, c[2] * I + 255 * hot);
      d[i + 3] = 255;
    }
  }
  // black stays transparent under mix-blend-mode: screen
  for (let i = 3; i < d.length; i += 4) if (!d[i]) { d[i - 3] = d[i - 2] = d[i - 1] = 0; d[i] = 255; }
  ctx.putImageData(img, 0, 0);
}

function paintStars(canvas, cssW, cssH) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = Math.round((cssW * cssH) / 2600);
  for (let i = 0; i < count; i++) {
    const x = rnd() * cssW, y = rnd() * cssH, big = rnd() > 0.96;
    const r = big ? 0.9 + rnd() * 0.7 : 0.35 + rnd() * 0.6;
    ctx.globalAlpha = big ? 0.75 + rnd() * 0.25 : 0.15 + rnd() * 0.55;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    if (big) {
      ctx.globalAlpha = 0.12;
      ctx.beginPath(); ctx.arc(x, y, r * 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function layoutHero() {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const stacked = stackedMQ.matches;
  const el = hero.el;
  if (stacked) {
    el.style.removeProperty("--s"); el.style.removeProperty("--sl"); el.style.removeProperty("--st");
    const rimH = hero.rim.clientHeight || 300;
    const k = rimH / 420; // show ~420 design px of sky height, cropped to the screen width
    paintRim(hero.rim, vw, rimH, k, vw / 2 - PLANET.cx * k);
  } else {
    const s = Math.min(vw / STAGE.w, vh / STAGE.h);
    const sl = (vw - STAGE.w * s) / 2, st = (vh - STAGE.h * s) / 2;
    el.style.setProperty("--s", s.toFixed(5));
    el.style.setProperty("--sl", `${sl.toFixed(2)}px`);
    el.style.setProperty("--st", `${st.toFixed(2)}px`);
    paintRim(hero.rim, STAGE.w * s, STAGE.skyH * s, s, 0);
  }
  paintStars(hero.stars, el.clientWidth, el.clientHeight);
}

// Re-layout on size changes, including the scrollbar appearing once the loader unlocks scrolling
let layoutT, layoutW = 0, layoutH = 0;
function relayoutHero() {
  const w = document.documentElement.clientWidth, h = window.innerHeight;
  // stacked layout doesn't depend on viewport height, so ignore the mobile address bar resizing it
  if (w === layoutW && (h === layoutH || stackedMQ.matches)) return;
  clearTimeout(layoutT);
  layoutT = setTimeout(() => { layoutW = w; layoutH = h; layoutHero(); }, 120);
}

// Desktop only: load the glow video and fade it in when it can play
function setupGlowVideo() {
  const v = hero.video;
  if (reduceMotion) return;
  const sync = () => {
    if (stackedMQ.matches) { v.pause(); return; }
    if (!v.src) { v.src = v.dataset.src; v.preload = "auto"; }
    v.play().catch(() => {});
  };
  v.addEventListener("playing", () => v.classList.add("is-ready"), { once: true });
  stackedMQ.addEventListener("change", sync);
  // pause while the hero is off screen
  new IntersectionObserver(([e]) => {
    if (!v.src || stackedMQ.matches) return;
    e.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }).observe(hero.el);
  sync();
}

/* ---------- Intro (after loader) ---------- */
function introAnimation() {
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  if (reduceMotion) {
    gsap.set(".loader", { autoAlpha: 0 });
    return tl;
  }
  tl.to(".loader__logo", { scale: 0.8, autoAlpha: 0, duration: 0.6, ease: "power2.in" })
    .to(".loader__bar, .loader__pct", { autoAlpha: 0, duration: 0.3 }, "<")
    .to(".loader", { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
    .from(".hero__copy > *", { y: 40, autoAlpha: 0, stagger: 0.09, duration: 1.2 }, "-=0.6")
    .from(".dash", { y: 120, autoAlpha: 0, duration: 1.4 }, "-=1.0")
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1, clearProps: "transform" }, "-=1.2");
  return tl;
}

/* ---------- Text splitting ---------- */
function splitWords(el, { mask = true } = {}) {
  const out = [];
  const walk = (node, gradClass) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) { out.push(document.createTextNode(" ")); return; }
          const w = document.createElement("span");
          if (mask) {
            w.className = "line";
            w.style.display = "inline-block";
            const inner = document.createElement("span");
            if (gradClass) inner.className = gradClass;
            inner.textContent = tok;
            w.appendChild(inner);
          } else {
            w.className = `w ${gradClass || ""}`.trim();
            w.textContent = tok;
          }
          out.push(w);
        });
      } else if (n.nodeType === 1) {
        // carry gradient/muted classes down to each word
        const cls = [gradClass, n.className].filter(Boolean).join(" ");
        walk(n, cls);
      }
    });
  };
  walk(el, "");
  el.textContent = "";
  out.forEach((n) => el.appendChild(n));
  return el;
}

function setupSplitHeadings() {
  document.querySelectorAll(".split").forEach((h) => {
    splitWords(h);
    if (reduceMotion) return;
    gsap.from(h.querySelectorAll(".line > span"), {
      yPercent: 110, rotate: isPhone ? 0 : 4, duration: isPhone ? 0.9 : 1.2, ease: "expo.out", stagger: 0.05,
      scrollTrigger: { trigger: h, start: "top 85%" },
    });
  });

  document.querySelectorAll(".reveal-words").forEach((p) => {
    splitWords(p, { mask: false });
    if (reduceMotion) return;
    gsap.to(p.querySelectorAll(".w"), {
      opacity: 1, stagger: 0.1, ease: "none",
      scrollTrigger: { trigger: p, start: "top 80%", end: "bottom 45%", scrub: true },
    });
  });
}

/* ---------- Reveals ---------- */
function setupReveals() {
  if (reduceMotion) return;
  gsap.set(".reveal", { y: isPhone ? 24 : 50, autoAlpha: 0 });
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: isPhone ? 0.8 : 1.1, ease: "expo.out", stagger: isPhone ? 0.06 : 0.1, overwrite: true }),
  });

  // Stagger the clip strips and phone in the transform section
  gsap.from(".clips span", { y: 40, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".transform", start: "top 70%" } });
  gsap.from(".phone", { y: 60, rotate: 8, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".transform", start: "top 65%" } });
  gsap.from(".transform__arrow path", { strokeDasharray: 120, strokeDashoffset: 120, duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: ".transform", start: "top 60%" } });

  // Subtle parallax on card media (desktop only: scrubbed transforms on every card cost too much on phones)
  if (isPhone) return;
  gsap.utils.toArray(".card__ph").forEach((ph) => {
    gsap.fromTo(ph, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
  });
}

/* ---------- Counters ---------- */
function setupCounters() {
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    if (reduceMotion) { el.textContent = end; return; }
    const o = { v: 0 };
    gsap.to(o, {
      v: end, duration: 1.8, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
      onUpdate: () => (el.textContent = Math.round(o.v)),
    });
  });
}

/* ---------- Cursor ---------- */
function setupCursor() {
  if (!finePointer || reduceMotion) return;
  document.documentElement.classList.add("has-cursor");
  const root = document.querySelector(".cursor");
  const ring = root.querySelector(".cursor__ring");
  const dot = root.querySelector(".cursor__dot");
  const label = root.querySelector(".cursor__label");
  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  const setDot = { x: gsap.quickSetter(dot, "x", "px"), y: gsap.quickSetter(dot, "y", "px") };
  const setRing = { x: gsap.quickSetter(ring, "x", "px"), y: gsap.quickSetter(ring, "y", "px") };

  window.addEventListener("mousemove", (e) => {
    pos.x = e.clientX; pos.y = e.clientY;
    setDot.x(pos.x); setDot.y(pos.y);
    root.classList.remove("is-hidden");
  }, { passive: true });
  document.addEventListener("mouseleave", () => root.classList.add("is-hidden"));
  window.addEventListener("mousedown", () => root.classList.add("is-down"));
  window.addEventListener("mouseup", () => root.classList.remove("is-down"));

  gsap.ticker.add(() => {
    const k = 1 - Math.pow(0.82, gsap.ticker.deltaRatio());
    ringPos.x += (pos.x - ringPos.x) * k;
    ringPos.y += (pos.y - ringPos.y) * k;
    setRing.x(ringPos.x); setRing.y(ringPos.y);
  });

  document.addEventListener("mouseover", (e) => {
    const t = e.target.closest("[data-cursor], a, button");
    root.classList.remove("is-hover", "is-play");
    if (!t) return;
    if (t.dataset.cursor === "play") {
      root.classList.add("is-play");
      label.textContent = t.dataset.video ? "Play" : "Soon";
    } else root.classList.add("is-hover");
  });
}

/* ---------- Magnetic buttons ---------- */
function setupMagnetic() {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll(".btn, .wa-float").forEach((el) => {
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.25);
      yTo((e.clientY - r.top - r.height / 2) * 0.35);
    });
    el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
  });
}

/* ---------- Focus trap for overlays ---------- */
function trapFocus(getItems) {
  const onKey = (e) => {
    if (e.key !== "Tab") return;
    const items = getItems().filter((el) => !el.disabled && el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (document.activeElement === last || !items.includes(document.activeElement))) { e.preventDefault(); first.focus(); }
  };
  document.addEventListener("keydown", onKey);
  return () => document.removeEventListener("keydown", onKey);
}

/* ---------- Nav ---------- */
function setupNav() {
  const nav = document.getElementById("nav");
  let lastY = 0;
  const onScroll = (y) => {
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 400 && !document.body.classList.contains("menu-open"));
    lastY = y;
  };
  if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
  else window.addEventListener("scroll", () => onScroll(scrollY), { passive: true });

  // Active section
  document.querySelectorAll(".nav__links a").forEach((a) => {
    const sec = document.querySelector(a.getAttribute("href"));
    if (!sec) return;
    ScrollTrigger.create({
      trigger: sec, start: "top 50%", end: "bottom 50%",
      onToggle: (st) => a.classList.toggle("is-active", st.isActive),
    });
  });

  // Mobile menu
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("mobile-menu");
  let releaseFocus = null;
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      lenis && lenis.stop();
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
      gsap.fromTo(menu.querySelectorAll("a"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.7, ease: "expo.out" });
      releaseFocus = trapFocus(() => [toggle, ...menu.querySelectorAll("a")]);
      menu.querySelector("a").focus({ preventScroll: true });
    } else {
      releaseFocus && releaseFocus();
      releaseFocus = null;
      lenis && lenis.start();
      gsap.to(menu, { autoAlpha: 0, duration: 0.3, onComplete: () => (menu.hidden = true) });
    }
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  menu.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setOpen(false); });
}

/* ---------- Anchor transitions (curtain wipe) ---------- */
function setupAnchors() {
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id === "#" || a.classList.contains("js-wa")) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const go = () => (lenis ? lenis.scrollTo(target, { immediate: true, force: true }) : target.scrollIntoView());
    if (reduceMotion) { go(); target.focus?.({ preventScroll: true }); return; }

    const distance = Math.abs(target.getBoundingClientRect().top);
    if (distance < window.innerHeight * 1.5) {
      lenis ? lenis.scrollTo(target, { duration: 1.2 }) : target.scrollIntoView({ behavior: "smooth" });
      return;
    }
    gsap.timeline()
      .set(".curtain", { transformOrigin: "bottom" })
      .to(".curtain", { scaleY: 1, duration: 0.55, ease: "expo.in" })
      .add(() => { go(); ScrollTrigger.update(); })
      .set(".curtain", { transformOrigin: "top" })
      .to(".curtain", { scaleY: 0, duration: 0.75, ease: "expo.out", delay: 0.05 });
    history.replaceState(null, "", id);
  });
}

/* ---------- Custom video player (lightbox) ---------- */
function createPlayer(root) {
  const v = root.querySelector(".player__video");
  const track = root.querySelector(".player__track");
  const fill = root.querySelector(".player__fill");
  const buffer = root.querySelector(".player__buffer");
  const knob = root.querySelector(".player__knob");
  const cur = root.querySelector(".js-cur");
  const dur = root.querySelector(".js-dur");
  const playBtn = root.querySelector(".js-play");
  const muteBtn = root.querySelector(".js-mute");
  const fmt = (t) => {
    t = Math.max(0, Math.floor(t || 0));
    return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  };

  let raf = 0, seeking = false, idleT = 0;

  // progress drawn with transforms on every frame while playing, so the bar glides instead of ticking
  const draw = () => {
    const d = v.duration || 0, p = d ? v.currentTime / d : 0;
    fill.style.transform = `scaleX(${p})`;
    knob.style.transform = `translateX(${p * track.clientWidth}px)`;
    cur.textContent = fmt(v.currentTime);
    track.setAttribute("aria-valuenow", Math.round(p * 100));
    track.setAttribute("aria-valuetext", `${fmt(v.currentTime)} of ${fmt(d)}`);
    if (v.buffered.length && d) buffer.style.transform = `scaleX(${v.buffered.end(v.buffered.length - 1) / d})`;
  };
  const loop = () => { draw(); raf = requestAnimationFrame(loop); };

  const setState = () => {
    const playing = !v.paused && !v.ended;
    root.dataset.state = playing ? "playing" : "paused";
    playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
    cancelAnimationFrame(raf);
    if (playing) raf = requestAnimationFrame(loop); else draw();
    wake();
  };
  const toggle = () => (v.paused || v.ended ? v.play().catch(() => {}) : v.pause());

  // auto-hide the controls while playing and the pointer is still
  const wake = () => {
    root.classList.remove("is-idle");
    clearTimeout(idleT);
    if (!v.paused && !seeking) idleT = setTimeout(() => root.classList.add("is-idle"), 2200);
  };

  const seekTo = (clientX) => {
    const r = track.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    if (v.duration) v.currentTime = p * v.duration;
    draw();
  };

  v.addEventListener("play", setState);
  v.addEventListener("pause", setState);
  v.addEventListener("ended", setState);
  v.addEventListener("loadedmetadata", () => { dur.textContent = fmt(v.duration); draw(); });
  v.addEventListener("progress", draw);
  v.addEventListener("volumechange", () => {
    root.classList.toggle("is-muted", v.muted);
    muteBtn.setAttribute("aria-label", v.muted ? "Unmute" : "Mute");
  });
  v.addEventListener("click", toggle);
  root.querySelector(".player__big").addEventListener("click", toggle);
  playBtn.addEventListener("click", toggle);
  muteBtn.addEventListener("click", () => { v.muted = !v.muted; });
  root.querySelector(".js-fs").addEventListener("click", () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (root.requestFullscreen) root.requestFullscreen().catch(() => {});
    else if (v.webkitEnterFullscreen) v.webkitEnterFullscreen(); // iOS Safari
  });

  root.addEventListener("pointermove", wake);
  root.addEventListener("pointerdown", wake);

  track.addEventListener("pointerdown", (e) => {
    seeking = true;
    root.classList.add("is-seeking");
    track.setPointerCapture(e.pointerId);
    seekTo(e.clientX);
  });
  track.addEventListener("pointermove", (e) => { if (seeking) seekTo(e.clientX); });
  const endSeek = () => { seeking = false; root.classList.remove("is-seeking"); wake(); };
  track.addEventListener("pointerup", endSeek);
  track.addEventListener("pointercancel", endSeek);
  track.addEventListener("keydown", (e) => {
    const step = { ArrowRight: 5, ArrowLeft: -5, ArrowUp: 5, ArrowDown: -5 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + step));
    draw();
  });

  return {
    video: v,
    load(src) {
      v.src = src;
      v.muted = false;
      root.classList.remove("is-muted", "is-idle");
      cur.textContent = "0:00"; dur.textContent = "0:00";
      fill.style.transform = buffer.style.transform = "scaleX(0)";
      knob.style.transform = "translateX(0px)";
      v.play().catch(() => setState());
    },
    unload() {
      cancelAnimationFrame(raf);
      clearTimeout(idleT);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      v.pause();
      v.removeAttribute("src");
      v.load();
    },
    // space toggles play while the lightbox is open (unless a control has focus)
    key(e) {
      if (e.key === " " && !e.target.closest("button, [role=slider]")) { e.preventDefault(); toggle(); }
    },
  };
}

/* ---------- Work cards ---------- */
function setupWork() {
  const box = document.querySelector(".lightbox");
  const player = createPlayer(box.querySelector(".player"));
  let lastFocus = null, releaseFocus = null;

  const open = (src) => {
    lastFocus = document.activeElement;
    document.querySelectorAll(".card video").forEach((v) => v.pause());
    box.hidden = false;
    lenis && lenis.stop();
    gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power2.out" });
    gsap.fromTo(".player", { scale: 0.94, y: 24 }, { scale: 1, y: 0, duration: 0.7, ease: "expo.out", clearProps: "transform" });
    player.load(src);
    releaseFocus = trapFocus(() => [...box.querySelectorAll("button, [tabindex='0']")]);
    box.querySelector(".lightbox__close").focus();
  };
  const close = () => {
    releaseFocus && releaseFocus();
    releaseFocus = null;
    gsap.to(".player", { scale: 0.96, y: 12, duration: 0.3, ease: "power2.in", clearProps: "transform" });
    gsap.to(box, { autoAlpha: 0, duration: 0.3, ease: "power2.in", onComplete: () => { box.hidden = true; player.unload(); } });
    lenis && lenis.start();
    lastFocus && lastFocus.focus();
  };
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    else player.key(e);
  });

  document.querySelectorAll(".card").forEach((card) => {
    const src = card.dataset.video;
    const video = card.querySelector("video");
    if (card.dataset.poster) card.querySelector(".card__ph").style.backgroundImage = `url("${card.dataset.poster}")`;
    if (!src) return;
    video.src = src;
    // hover preview only for a real mouse; a tap goes straight to the player
    card.addEventListener("pointerenter", (e) => {
      if (e.pointerType !== "mouse") return;
      video.play().then(() => card.classList.add("is-playing")).catch(() => {});
    });
    card.addEventListener("pointerleave", () => { video.pause(); card.classList.remove("is-playing"); });
    card.addEventListener("click", () => open(src));
    card.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(src); } });
  });
}

/* ---------- WhatsApp float ---------- */
function setupFloat() {
  const btn = document.querySelector(".wa-float");
  ScrollTrigger.create({
    trigger: ".intro", start: "top 80%",
    onEnter: () => btn.classList.add("is-visible"),
    onLeaveBack: () => btn.classList.remove("is-visible"),
  });
}

/* ---------- Boot ---------- */
async function boot() {
  setupContact();
  setupTabTitle();
  setupLenis();
  lenis && lenis.stop();
  window.scrollTo(0, 0);

  const bar = document.querySelector(".loader__bar span");
  const pct = document.querySelector(".loader__pct");
  const minTime = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 900));
  layoutHero();
  setupGlowVideo();
  await Promise.all([document.fonts ? document.fonts.ready : null, minTime]);
  bar.style.transform = "scaleX(1)";
  pct.textContent = "100%";

  setupSplitHeadings();
  setupReveals();
  setupCounters();
  setupCursor();
  setupMagnetic();
  setupNav();
  setupAnchors();
  setupWork();
  setupFloat();

  introAnimation().eventCallback("onComplete", () => {
    document.body.classList.remove("is-loading");
    document.querySelector(".loader").remove();
    lenis && lenis.start();
    ScrollTrigger.refresh();
  });
  // let the page scroll as soon as the loader starts lifting
  setTimeout(() => { document.body.classList.remove("is-loading"); lenis && lenis.start(); relayoutHero(); }, reduceMotion ? 0 : 900);

  new ResizeObserver(relayoutHero).observe(hero.el);
  window.addEventListener("resize", relayoutHero);
}

boot();
