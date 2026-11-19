/* =========================================================
   QUEST[LAB] — Interacciones (versión simplificada)
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Header: fondo al bajar, indicador del menú, menú móvil, progreso ---------- */
  function header() {
    const head = $(".site-header");
    const ind = $(".pill-indicator");
    const links = $$(".pill-nav a");
    const toggle = $(".menu-toggle");
    const bar = $(".scroll-progress span");

    addEventListener("scroll", () => {
      head.classList.toggle("is-scrolled", scrollY > 40);
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }, { passive: true });

    const moveTo = (a) => {
      if (!a) { ind.style.opacity = 0; return; }
      ind.style.opacity = 1;
      ind.style.width = a.offsetWidth + "px";
      ind.style.transform = `translateX(${a.offsetLeft}px)`;
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
        moveTo(links.find((l) => l.classList.contains("is-active")));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach((s) => io.observe(s));
    addEventListener("resize", () => moveTo(links.find((l) => l.classList.contains("is-active"))));

    toggle.addEventListener("click", () => {
      const open = head.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", open);
    });
    links.forEach((l) => l.addEventListener("click", () => {
      head.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");
    }));
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  function reveals() {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const sib = $$(".reveal", el.parentElement);
        el.style.transitionDelay = Math.min(sib.indexOf(el), 5) * 0.07 + "s";
        el.classList.add("is-in");
        io.unobserve(el);
      });
    }, { threshold: 0.12 });
    $$(".reveal").forEach((el) => io.observe(el));
  }

  /* ---------- 02 · Colección: navegación fija que marca la prenda en pantalla ---------- */
  function collectionNav() {
    const links = $$(".collection-nav a");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$(".chapter").forEach((c) => io.observe(c));
  }

  /* ---------- Videos: se reproducen solo cuando están en pantalla ---------- */
  function videos() {
    if (reduceMotion) return;
    const io = new IntersectionObserver((entries) => entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { v.preload = "auto"; v.play().catch(() => {}); } else v.pause();
    }), { threshold: 0.35 });
    $$("video[data-autoplay]").forEach((v) => { v.muted = true; io.observe(v); });
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---------- Fondo topográfico: curvas de nivel animadas (marching squares) ---------- */
  function topo(canvas) {
    const ctx = canvas.getContext("2d");
    const CELL = 14, LEVELS = [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05];
    let w, h, cols, rows, dpr, visible = false, t = Math.random() * 100, dots = [];
    const field = (x, y, t) =>
      Math.sin(x * 1.1 + t * 0.12) * Math.cos(y * 1.3 - t * 0.09) +
      0.6 * Math.sin((x + y) * 0.7 - t * 0.07) +
      0.35 * Math.cos(x * 2.1 - y * 0.9 + t * 0.05);

    const resize = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / CELL) + 1; rows = Math.ceil(h / CELL) + 1;
      dots = Array.from({ length: 5 }, () => [Math.random() * w, Math.random() * h]);
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // retícula de fondo
      ctx.strokeStyle = "rgba(255,255,255,0.07)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x < w; x += 120) { ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, h); }
      for (let y = 0; y < h; y += 120) { ctx.moveTo(0, y + 0.5); ctx.lineTo(w, y + 0.5); }
      ctx.stroke();

      // muestreo del campo
      const s = 3.2 / Math.max(w, h), v = new Float32Array(cols * rows);
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) v[j * cols + i] = field(i * CELL * s * 3, j * CELL * s * 3, t);

      ctx.strokeStyle = "rgba(255,255,255,0.32)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const L of LEVELS) {
        for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
          const a = v[j * cols + i], b = v[j * cols + i + 1], c = v[(j + 1) * cols + i + 1], d = v[(j + 1) * cols + i];
          const idx = (a > L) | ((b > L) << 1) | ((c > L) << 2) | ((d > L) << 3);
          if (idx === 0 || idx === 15) continue;
          const x = i * CELL, y = j * CELL, k = (p, q) => (L - p) / (q - p);
          const T = [x + k(a, b) * CELL, y], R = [x + CELL, y + k(b, c) * CELL];
          const B = [x + k(d, c) * CELL, y + CELL], Lf = [x, y + k(a, d) * CELL];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (idx) {
            case 1: case 14: seg(Lf, T); break;
            case 2: case 13: seg(T, R); break;
            case 3: case 12: seg(Lf, R); break;
            case 4: case 11: seg(R, B); break;
            case 6: case 9: seg(T, B); break;
            case 7: case 8: seg(Lf, B); break;
            case 5: seg(Lf, T); seg(R, B); break;
            case 10: seg(T, R); seg(Lf, B); break;
          }
        }
      }
      ctx.stroke();
      // puntos de medición
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      dots.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill(); });
    };

    resize(); draw();
    addEventListener("resize", () => { resize(); draw(); });
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);
    if (reduceMotion) return;
    let last = 0;
    (function loop(now) {
      requestAnimationFrame(loop);
      if (!visible || now - last < 40) return; // ~25 fps, suficiente para un movimiento lento
      last = now; t += 0.04; draw();
    })(0);
  }

  /* ---------- X-Ray: franja de escaneo (automática o con el cursor) ---------- */
  function scanner() {
    const el = $("[data-scanner]");
    const readout = $("[data-scan-readout]");
    const items = $$("[data-xray-list] li");
    let y = 0.5, target = 0.5, manual = false, visible = false, t = 0;

    const setY = (px) => {
      const r = el.getBoundingClientRect();
      target = clamp((px - r.top) / r.height, 0.06, 0.94);
    };
    el.addEventListener("pointermove", (e) => { manual = true; setY(e.clientY); });
    el.addEventListener("pointerleave", () => (manual = false));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);

    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      if (!manual && !reduceMotion) { t += 0.008; target = 0.5 + Math.sin(t) * 0.38; }
      y = lerp(y, target, 0.12);
      const half = el.clientHeight * 0.09;
      el.style.setProperty("--y", (y * 100).toFixed(2) + "%");
      el.style.setProperty("--hpx", (-half).toFixed(1) + "px");
      readout.textContent = `SCAN ${String(Math.round(y * 100)).padStart(3, "0")}%`;
      const k = Math.min(items.length - 1, Math.floor(y * items.length));
      items.forEach((li, i) => li.classList.toggle("is-on", i === k));
    })();
  }

  /* ---------- Campaña: ventana nítida sobre vidrio esmerilado ---------- */
  function frost() {
    const el = $("[data-frost]");
    // Posición por defecto: la mirada (en % del marco). Ancho y alto de la ventana:
    const mobile = innerWidth <= 760;
    const W = mobile ? 0.7 : 0.32, H = mobile ? 0.1 : 0.13;
    const home = mobile ? { x: 0.38, y: 0.42 } : { x: 0.48, y: 0.435 };
    let cx = home.x, cy = home.y, tx = home.x, ty = home.y, visible = false;

    if (canHover && !reduceMotion) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        tx = clamp((e.clientX - r.left) / r.width, W / 2, 1 - W / 2);
        ty = clamp((e.clientY - r.top) / r.height, H / 2 + 0.05, 1 - H / 2 - 0.05);
      });
      el.addEventListener("pointerleave", () => { tx = home.x; ty = home.y; });
    }
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(el);

    const apply = () => {
      el.style.setProperty("--l", ((cx - W / 2) * 100).toFixed(2) + "%");
      el.style.setProperty("--r", ((1 - cx - W / 2) * 100).toFixed(2) + "%");
      el.style.setProperty("--t", ((cy - H / 2) * 100).toFixed(2) + "%");
      el.style.setProperty("--b", ((1 - cy - H / 2) * 100).toFixed(2) + "%");
    };
    apply();
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      cx = lerp(cx, tx, 0.1); cy = lerp(cy, ty, 0.1);
      apply();
    })();
  }

  header();
  reveals();
  $$(".topo").forEach(topo);
  scanner();
  frost();
  collectionNav();
  videos();
})();
