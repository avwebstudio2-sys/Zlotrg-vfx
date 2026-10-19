/* ==========================================================
   ZlotrgVFX — site config
   Edit these values with your real contact info.
   ========================================================== */
const CONFIG = {
  whatsappNumber: "38700000000", // international format, digits only (no +, no spaces)
  whatsappMessage: "Hi! I found your website and I'd like to talk about a video project.",
  instagram: "zlotrgvfx", // handle without @
  email: "hello@zlotrgvfx.com",
};

(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Contact links ---------- */
  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(CONFIG.whatsappMessage)}`;
  $$(".js-whatsapp").forEach((a) => (a.href = waUrl));
  $$(".js-instagram").forEach((a) => (a.href = `https://instagram.com/${CONFIG.instagram}`));
  $$(".js-instagram-label").forEach((s) => (s.textContent = `@${CONFIG.instagram}`));
  $$(".js-email").forEach((a) => (a.href = `mailto:${CONFIG.email}`));
  $$(".js-email-label").forEach((s) => (s.textContent = CONFIG.email));
  $("#year").textContent = new Date().getFullYear();

  /* ---------- Preloader ---------- */
  const loader = $(".loader");
  const countEl = $("#loaderCount");
  const bar = $(".loader__bar span");
  let progress = 0;
  let loaded = false;
  window.addEventListener("load", () => (loaded = true));

  const tick = () => {
    const target = loaded ? 100 : 90;
    progress += Math.max(1, (target - progress) * 0.08);
    progress = Math.min(progress, target);
    countEl.textContent = Math.floor(progress);
    bar.style.width = `${progress}%`;
    if (progress >= 100) return finishLoading();
    requestAnimationFrame(tick);
  };
  const finishLoading = () => {
    setTimeout(() => {
      loader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      setTimeout(() => $(".hero").classList.add("is-in"), 350);
      setTimeout(() => $(".hero").querySelectorAll(".reveal").forEach((el) => el.classList.add("is-in")), 500);
    }, 250);
  };
  reducedMotion ? (progress = 99, loaded = true, tick()) : requestAnimationFrame(tick);

  /* ---------- Custom cursor ---------- */
  if (finePointer) {
    const cursor = $(".cursor");
    const dot = $(".cursor__dot");
    const ring = $(".cursor__ring");
    const label = $(".cursor__label");
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener("mousemove", (e) => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    });
    const loop = () => {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();

    document.addEventListener("mousedown", () => cursor.classList.add("is-down"));
    document.addEventListener("mouseup", () => cursor.classList.remove("is-down"));
    document.addEventListener("mouseleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => cursor.classList.remove("is-hidden"));

    document.addEventListener("mouseover", (e) => {
      const play = e.target.closest('[data-cursor="play"]');
      const hover = e.target.closest('[data-cursor="hover"], a, button');
      cursor.classList.toggle("is-play", !!play);
      cursor.classList.toggle("is-hover", !play && !!hover);
      label.textContent = play ? "Play" : "";
    });

    /* Magnetic buttons */
    $$(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        el.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
      });
      el.addEventListener("mouseleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- Navigation ---------- */
  const nav = $(".nav");
  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-scrolled", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 500 && !$(".mobile-menu").classList.contains("is-open"));
    lastY = y;
    $(".wa-float").classList.toggle("is-visible", y > window.innerHeight * 0.6);
    scaleShowreel();
  };
  window.addEventListener("scroll", onScroll, { passive: true });

  const burger = $(".nav__burger");
  const menu = $(".mobile-menu");
  const toggleMenu = (open) => {
    burger.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open);
    menu.setAttribute("aria-hidden", !open);
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => toggleMenu(!menu.classList.contains("is-open")));

  /* Active link highlight */
  const navLinks = $$(".nav__links a");
  const sectionObs = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${en.target.id}`));
    }),
    { rootMargin: "-45% 0px -50% 0px" }
  );
  $$("section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------- Clean anchor transitions (curtain wipe) ---------- */
  const curtain = $(".curtain");
  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id === "#top" ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      const wasMenu = menu.classList.contains("is-open");
      if (reducedMotion) {
        if (wasMenu) toggleMenu(false);
        return target.scrollIntoView();
      }
      curtain.className = "curtain is-in";
      setTimeout(() => {
        if (wasMenu) toggleMenu(false);
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, id === "#top" ? 0 : target.getBoundingClientRect().top + window.scrollY - 70);
        document.documentElement.style.scrollBehavior = "";
        curtain.className = "curtain is-out";
        setTimeout(() => (curtain.className = "curtain"), 600);
      }, 560);
    });
  });

  /* ---------- Scroll reveals ---------- */
  const revealObs = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (en.isIntersecting) {
        en.target.classList.add("is-in");
        revealObs.unobserve(en.target);
      }
    }),
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );
  $$(".reveal, .contact").forEach((el) => {
    if (!el.closest(".hero")) revealObs.observe(el);
  });

  /* Stagger work cards */
  $$(".work-card").forEach((c, i) => c.style.setProperty("--d", `${(i % 3) * 0.1}s`));

  /* ---------- Showreel scale on scroll ---------- */
  const reel = $(".showreel__frame");
  function scaleShowreel() {
    const r = reel.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = Math.min(Math.max((vh - r.top) / (vh * 0.9), 0), 1);
    reel.style.setProperty("--s", (0.86 + p * 0.14).toFixed(3));
  }
  scaleShowreel();

  /* ---------- Counters ---------- */
  const countObs = new IntersectionObserver(
    (entries) => entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const to = +el.dataset.to;
      const start = performance.now();
      const dur = 1800;
      const step = (t) => {
        const p = Math.min((t - start) / dur, 1);
        el.textContent = Math.round(to * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObs.unobserve(el);
    }),
    { threshold: 0.6 }
  );
  $$(".count").forEach((c) => countObs.observe(c));

  /* ---------- Work filters ---------- */
  $$(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".filter").forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      const cards = $$(".work-card");
      cards.forEach((c) => (c.style.opacity = "0"));
      setTimeout(() => {
        cards.forEach((c) => {
          c.classList.toggle("is-filtered", f !== "all" && c.dataset.type !== f);
          c.classList.add("is-in");
        });
        requestAnimationFrame(() => cards.forEach((c) => (c.style.opacity = "")));
      }, 300);
    });
  });

  /* Duplicate testimonials for a seamless loop */
  const tTrack = $(".testimonials__track");
  tTrack.innerHTML += tTrack.innerHTML;

  /* ---------- Video lightbox ---------- */
  const lightbox = $(".lightbox");
  const frame = $(".lightbox__frame");
  const toEmbed = (url) => {
    const yt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/))([\w-]{11})/);
    if (yt) return `<iframe src="https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    const vm = url.match(/vimeo\.com\/(\d+)/);
    if (vm) return `<iframe src="https://player.vimeo.com/video/${vm[1]}?autoplay=1" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return `<video src="${url}" controls autoplay playsinline></video>`;
    return null;
  };
  const openVideo = (el) => {
    const url = el.dataset.video || "";
    frame.classList.toggle("is-vertical", el.dataset.type === "short");
    frame.innerHTML = toEmbed(url) || "<p>Video coming soon.</p>";
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
  };
  const closeVideo = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    setTimeout(() => (frame.innerHTML = ""), 500);
  };
  $$("[data-video]").forEach((el) => el.addEventListener("click", () => openVideo(el)));
  $(".lightbox__close").addEventListener("click", closeVideo);
  lightbox.addEventListener("click", (e) => e.target === lightbox && closeVideo());
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeVideo();
    toggleMenu(false);
  });

  /* WhatsApp tooltip nudge */
  setTimeout(() => {
    const f = $(".wa-float");
    if (!f.classList.contains("is-visible")) return;
    f.classList.add("show-tip");
    setTimeout(() => f.classList.remove("show-tip"), 4000);
  }, 12000);
})();
