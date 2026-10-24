/* ==========================================================
   zlotrgvfx — site interactions
   Edit CONFIG below with your real contact details.
   ========================================================== */
const CONFIG = {
  whatsapp: "38700000000",          // international format, digits only (no +, no spaces)
  instagram: "zlotrgvfx",           // handle without @
  email: "hello@zlotrgvfx.com",
};

const FRAMES = { count: 120, lg: "assets/frames/lg/f", sm: "assets/frames/sm/f", ext: ".webp" };

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobile = () => window.innerWidth < 768 || window.innerHeight > window.innerWidth;

gsap.registerPlugin(ScrollTrigger);

/* ---------- Contact links ---------- */
function setupContact() {
  document.querySelectorAll(".js-wa").forEach((a) => {
    const text = encodeURIComponent(a.dataset.waText || "Hi!");
    a.href = `https://wa.me/${CONFIG.whatsapp}?text=${text}`;
    a.target = "_blank";
    a.rel = "noopener";
  });
  document.querySelectorAll(".js-ig").forEach((a) => (a.href = `https://instagram.com/${CONFIG.instagram}`));
  document.querySelectorAll(".js-ig-handle").forEach((el) => (el.textContent = `@${CONFIG.instagram}`));
  document.querySelectorAll(".js-mail").forEach((a) => (a.href = `mailto:${CONFIG.email}?subject=${encodeURIComponent("Video editing enquiry")}`));
  document.querySelectorAll(".js-mail-addr").forEach((el) => (el.textContent = CONFIG.email));
  document.querySelectorAll(".js-year").forEach((el) => (el.textContent = new Date().getFullYear()));
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

/* ---------- Hero frame sequence ---------- */
const hero = {
  el: document.querySelector(".hero"),
  canvas: document.querySelector(".hero__canvas"),
  frames: [],
  current: 0,
  base: "",
};
hero.ctx = hero.canvas.getContext("2d");

function frameSrc(i) {
  return `${hero.base}${String(i + 1).padStart(3, "0")}${FRAMES.ext}`;
}

function loadFrame(i) {
  return new Promise((resolve) => {
    if (hero.frames[i]) return resolve();
    const img = new Image();
    img.decoding = "async";
    img.onload = () => { hero.frames[i] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = frameSrc(i);
  });
}

function sizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  hero.canvas.width = Math.round(window.innerWidth * dpr);
  hero.canvas.height = Math.round(window.innerHeight * dpr);
  drawFrame(hero.current, true);
}

function nearestLoaded(i) {
  for (let d = 0; d < FRAMES.count; d++) {
    if (hero.frames[i - d]) return hero.frames[i - d];
    if (hero.frames[i + d]) return hero.frames[i + d];
  }
  return null;
}

let lastDrawn = null;
function drawFrame(i, force) {
  hero.current = i;
  const img = nearestLoaded(i);
  if (!img || (img === lastDrawn && !force)) return;
  lastDrawn = img;
  const { width: cw, height: ch } = hero.canvas;
  const s = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
  const w = img.naturalWidth * s, h = img.naturalHeight * s;
  hero.ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
}

/* Load every 4th frame first (fast first paint), report progress, then fill the rest. */
async function preloadHero(onProgress) {
  hero.base = isMobile() ? FRAMES.sm : FRAMES.lg;
  const first = [];
  for (let i = 0; i < FRAMES.count; i += 4) first.push(i);
  let done = 0;
  await Promise.all(first.map((i) => loadFrame(i).then(() => onProgress(++done / first.length))));
  sizeCanvas();
  hero.el.classList.add("is-ready");
  // Background fill, a few at a time
  const rest = [];
  for (let i = 0; i < FRAMES.count; i++) if (i % 4) rest.push(i);
  const pool = async () => { while (rest.length) { await loadFrame(rest.shift()); drawFrame(hero.current, true); } };
  Promise.all([pool(), pool(), pool(), pool()]);
}

function setupHeroScroll() {
  const lines = gsap.utils.toArray(".hero__line");
  // wrap each line part's text so it can slide inside its mask
  lines.forEach((line) => line.querySelectorAll(":scope > span").forEach((s) => {
    s.innerHTML = `<span class="hl">${s.innerHTML}</span>`;
    s.querySelector(".hl").style.display = "inline-block";
  }));
  const inner = lines.map((l) => l.querySelectorAll(".hl"));
  gsap.set(inner[1], { yPercent: 130 });
  gsap.set(inner[2], { yPercent: 130 });

  const state = { f: 0 };
  const tl = gsap.timeline({
    defaults: { ease: "none" },
    scrollTrigger: {
      trigger: hero.el,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.6,
      onUpdate: (st) => gsap.set(".hero__progress span", { scaleY: st.progress }),
    },
  });
  tl.to(state, { f: FRAMES.count - 1, duration: 1, onUpdate: () => drawFrame(Math.round(state.f)) }, 0)
    .to(hero.canvas, { scale: 1.12, duration: 1 }, 0)
    .to(inner[0], { yPercent: -130, stagger: 0.03, duration: 0.1 }, 0.22)
    .to(inner[1], { yPercent: 0, stagger: 0.03, duration: 0.1 }, 0.3)
    .to(inner[1], { yPercent: -130, stagger: 0.03, duration: 0.1 }, 0.55)
    .to(inner[2], { yPercent: 0, stagger: 0.03, duration: 0.1 }, 0.63)
    .to(".hero__eyebrow", { opacity: 0, y: -20, duration: 0.1 }, 0.15)
    .to(".hero__vignette", { opacity: 0.7, duration: 0.3 }, 0.7)
    .to(".hero__content", { opacity: 0, y: -60, duration: 0.12 }, 0.88);
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
    .from(".hero__canvas", { scale: 1.25, duration: 1.8 }, "-=0.9")
    .from(".hero__line[data-phase='0'] .hl", { yPercent: 130, stagger: 0.08, duration: 1.3 }, "-=1.5")
    .from(".hero__eyebrow, .hero__sub, .hero__ctas > *, .hero__scroll", { y: 30, autoAlpha: 0, stagger: 0.08, duration: 1 }, "-=1.1")
    .from(".nav", { yPercent: -100, autoAlpha: 0, duration: 1 }, "-=1.1");
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
            w.innerHTML = `<span class="${gradClass || ""}">${tok}</span>`;
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
      yPercent: 110, rotate: 4, duration: 1.2, ease: "expo.out", stagger: 0.05,
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
  gsap.set(".reveal", { y: 50, autoAlpha: 0 });
  ScrollTrigger.batch(".reveal", {
    start: "top 88%",
    once: true,
    onEnter: (els) => gsap.to(els, { y: 0, autoAlpha: 1, duration: 1.1, ease: "expo.out", stagger: 0.1, overwrite: true }),
  });

  // Stagger the clip strips and phone in the transform section
  gsap.from(".clips span", { y: 40, autoAlpha: 0, stagger: 0.07, duration: 0.9, ease: "back.out(1.4)", scrollTrigger: { trigger: ".transform", start: "top 70%" } });
  gsap.from(".phone", { y: 60, rotate: 8, autoAlpha: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".transform", start: "top 65%" } });
  gsap.from(".transform__arrow path", { strokeDasharray: 120, strokeDashoffset: 120, duration: 1.2, ease: "power2.out", scrollTrigger: { trigger: ".transform", start: "top 60%" } });

  // Subtle parallax on card media
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

/* ---------- Process: horizontal scroll on desktop ---------- */
function setupProcess() {
  if (reduceMotion) return;
  const mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", () => {
    // Sticky stage instead of a GSAP pin: no pin-spacer reflow, no jitter with Lenis.
    const section = document.querySelector(".process");
    const track = document.querySelector(".process__track");
    const steps = document.querySelector(".steps");
    const distance = () => {
      const pad = parseFloat(getComputedStyle(track).paddingLeft) * 2;
      return Math.max(0, steps.scrollWidth - (track.clientWidth - pad));
    };
    const setHeight = () => (section.style.height = `${window.innerHeight + distance()}px`);
    setHeight();
    ScrollTrigger.addEventListener("refreshInit", setHeight);

    gsap.timeline({
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: 0.6, invalidateOnRefresh: true },
    })
      .to(steps, { x: () => -distance(), ease: "none" }, 0)
      .to(".process__bar span", { scaleX: 1, ease: "none" }, 0);

    return () => {
      ScrollTrigger.removeEventListener("refreshInit", setHeight);
      section.style.height = "";
    };
  });
  mm.add("(max-width: 860px)", () => {
    gsap.utils.toArray(".step").forEach((s) => gsap.from(s, { y: 40, autoAlpha: 0, duration: 0.9, ease: "expo.out", scrollTrigger: { trigger: s, start: "top 90%" } }));
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
  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("menu-open", open);
    if (open) {
      menu.hidden = false;
      lenis && lenis.stop();
      gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
      gsap.fromTo(menu.querySelectorAll("a"), { y: 40, autoAlpha: 0 }, { y: 0, autoAlpha: 1, stagger: 0.06, duration: 0.7, ease: "expo.out" });
    } else {
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

/* ---------- Work cards ---------- */
function setupWork() {
  const box = document.querySelector(".lightbox");
  const lbVideo = box.querySelector("video");
  let lastFocus = null;

  const open = (src) => {
    lastFocus = document.activeElement;
    lbVideo.src = src;
    box.hidden = false;
    lenis && lenis.stop();
    gsap.fromTo(box, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 });
    gsap.fromTo(lbVideo, { scale: 0.92, y: 20 }, { scale: 1, y: 0, duration: 0.7, ease: "expo.out" });
    lbVideo.play().catch(() => {});
    box.querySelector(".lightbox__close").focus();
  };
  const close = () => {
    gsap.to(box, { autoAlpha: 0, duration: 0.3, onComplete: () => { box.hidden = true; lbVideo.pause(); lbVideo.removeAttribute("src"); lbVideo.load(); } });
    lenis && lenis.start();
    lastFocus && lastFocus.focus();
  };
  box.querySelector(".lightbox__close").addEventListener("click", close);
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) close(); });

  document.querySelectorAll(".card").forEach((card) => {
    const src = card.dataset.video;
    const video = card.querySelector("video");
    if (card.dataset.poster) card.querySelector(".card__ph").style.backgroundImage = `url("${card.dataset.poster}")`;
    if (!src) return;
    video.src = src;
    card.addEventListener("mouseenter", () => { video.play().then(() => card.classList.add("is-playing")).catch(() => {}); });
    card.addEventListener("mouseleave", () => { video.pause(); card.classList.remove("is-playing"); });
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
  setupLenis();
  lenis && lenis.stop();
  window.scrollTo(0, 0);

  const bar = document.querySelector(".loader__bar span");
  const pct = document.querySelector(".loader__pct");
  const minTime = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 900));
  await Promise.all([
    preloadHero((p) => { bar.style.transform = `scaleX(${p})`; pct.textContent = `${Math.round(p * 100)}%`; }),
    document.fonts ? document.fonts.ready : null,
    minTime,
  ]);

  if (!reduceMotion) setupHeroScroll();
  setupProcess(); // first: it changes page height that later triggers depend on
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
  setTimeout(() => { document.body.classList.remove("is-loading"); lenis && lenis.start(); }, reduceMotion ? 0 : 900);

  let rT;
  window.addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(sizeCanvas, 150); });
}

boot();
