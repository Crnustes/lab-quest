/* =========================================================
   QUEST[LAB] — Interacciones (versión simplificada)
   ========================================================= */
(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  /* ---------- Barra de progreso de scroll (la página no tiene menú ni footer) ---------- */
  function progress() {
    const bar = $(".scroll-progress span");
    addEventListener("scroll", () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    }, { passive: true });
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

  /* ---------- 02 · Colección: visor de una prenda + menú de íconos ---------- */
  function productViewer() {
    const section = $("#coleccion");
    const items = $$(".pv", section);
    const tabs = $$(".pv-menu button", section);
    let inView = false;

    // Solo se reproduce el video de la prenda visible
    const playActive = () => {
      items.forEach((it) => {
        const v = $("video", it);
        if (!v) return;
        if (it.classList.contains("is-active") && inView && !reduceMotion && !v.dataset.userPaused) {
          // Safari/iOS solo permiten reproducir solos los videos silenciados y en línea
          v.muted = true; v.defaultMuted = true; v.playsInline = true; v.preload = "auto";
          // Videos compartidos (camisetas): al abrir la prenda, arranca en el momento en que aparece
          if (v.dataset.start && !it.dataset.started) { it.dataset.started = 1; const go = () => { v.currentTime = parseFloat(v.dataset.start) || 0; }; v.readyState >= 1 ? go() : v.addEventListener("loadedmetadata", go, { once: true }); }
          const p = v.play();
          if (p) p.catch(() => { v.load(); v.play().catch(() => {}); });
        }
        else { v.pause(); delete it.dataset.started; }
      });
    };
    const show = (id) => {
      items.forEach((it) => it.classList.toggle("is-active", it.dataset.pv === id));
      tabs.forEach((t) => { const on = t.dataset.go === id; t.classList.toggle("is-active", on); t.setAttribute("aria-selected", on); });
      playActive();
    };
    tabs.forEach((t, i) => {
      t.addEventListener("click", () => show(t.dataset.go));
      // Flechas del teclado para pasar de una prenda a otra
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = tabs[(i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length];
        n.focus(); show(n.dataset.go);
      });
    });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; playActive(); }, { threshold: 0.25 }).observe($(".pv-stage", section));

    /* Recorrido automático: la línea lima de la prenda activa se llena con su porcentaje
       (como la lectura del escáner) y al llegar a 100% pasa a la siguiente prenda.
       Se detiene mientras el cursor está sobre la prenda o el menú. */
    const DURATION = 7000;
    let progress = 0, paused = false, last = 0;
    tabs.forEach((t) => t.insertAdjacentHTML("beforeend", '<i class="pv-prog" aria-hidden="true"></i><em class="pv-pct" aria-hidden="true">000%</em>'));
    const paint = () => {
      const t = tabs.find((b) => b.classList.contains("is-active"));
      if (!t) return;
      t.style.setProperty("--p", progress.toFixed(4));
      $(".pv-pct", t).textContent = String(Math.round(progress * 100)).padStart(3, "0") + "%";
    };
    const reset = () => { tabs.forEach((b) => b.style.setProperty("--p", 0)); progress = 0; paint(); };
    tabs.forEach((t) => t.addEventListener("click", reset));
    // Carrusel de íconos (responsive): la prenda elegida se centra en la franja
    tabs.forEach((t) => t.addEventListener("click", () => {
      const m = t.parentElement;
      if (m.scrollWidth > m.clientWidth) m.scrollTo({ left: t.offsetLeft - (m.clientWidth - t.offsetWidth) / 2, behavior: "smooth" });
    }));
    [$(".pv-stage", section), $(".pv-menu", section)].forEach((el) => {
      el.addEventListener("pointerenter", () => (paused = true));
      el.addEventListener("pointerleave", () => (paused = false));
      // Teclado: el recorrido automático se detiene mientras el foco está en la prenda o el menú
      el.addEventListener("focusin", () => (paused = true));
      el.addEventListener("focusout", () => (paused = false));
    });
    if (reduceMotion) { progress = 1; paint(); return; }
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = last ? Math.min(now - last, 100) : 0;
      last = now;
      if (!inView || paused || document.hidden) return;
      progress += dt / DURATION;
      if (progress >= 1) {
        const i = tabs.findIndex((b) => b.classList.contains("is-active"));
        const next = tabs[(i + 1) % tabs.length];
        show(next.dataset.go);
        reset();
        // En celular el menú se desliza: centrar la prenda nueva sin mover la página
        const menu = next.parentElement;
        if (menu.scrollWidth > menu.clientWidth) menu.scrollTo({ left: next.offsetLeft - (menu.clientWidth - next.offsetWidth) / 2, behavior: "smooth" });
        return;
      }
      paint();
    })(0);
  }

  /* ---------- Videos: se reproducen solo cuando están en pantalla ---------- */
  function videos() {
    if (reduceMotion) return;
    const io = new IntersectionObserver((entries) => entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting) { if (!v.dataset.userPaused) { v.preload = "auto"; v.play().catch(() => {}); } } else v.pause();
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
    // En pantallas táctiles no hay cursor: se ajusta la indicación
    if (!canHover) { const tag = $(".scanner-tag", el); if (tag) tag.textContent = "DESLIZA PARA ESCANEAR"; }
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
    const home = mobile ? { x: 0.5, y: 0.42 } : { x: 0.48, y: 0.435 };
    let cx = home.x, cy = home.y, tx = home.x, ty = home.y, visible = false;

    if (canHover && !reduceMotion) {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        tx = clamp((e.clientX - r.left) / r.width, W / 2, 1 - W / 2);
        ty = clamp((e.clientY - r.top) / r.height, H / 2 + 0.05, 1 - H / 2 - 0.05);
      });
      el.addEventListener("pointerleave", () => { tx = home.x; ty = home.y; });
    } else if (!reduceMotion) {
      // Pantallas táctiles (sin cursor): la ventana nítida recorre la foto con el scroll,
      // desde la mirada hacia el pecho, como un escaneo
      const follow = () => {
        const r = el.getBoundingClientRect();
        const k = clamp(-r.top / (r.height * 0.55), 0, 1);
        ty = clamp(home.y + k * 0.32, H / 2 + 0.05, 1 - H / 2 - 0.05);
        tx = home.x;
      };
      addEventListener("scroll", follow, { passive: true });
      follow();
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

  /* ---------- Lifestyle: parallax suave de las fotos con el scroll ---------- */
  function lifestyleParallax() {
    if (reduceMotion) return;
    const items = $$(".ls-grid-5 .ls-item");
    if (!items.length) return;
    let ticking = false;
    const update = () => {
      ticking = false;
      items.forEach((it, i) => {
        const r = it.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1 … 1
        const amp = i % 2 ? 26 : 40; // ritmos distintos por foto
        it.style.setProperty("--py", (p * -amp).toFixed(1) + "px");
      });
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  }

  /* ---------- James · Looks: franjas + estela en la foto principal, ligadas al scroll ---------- */
  function looks() {
    const el = $("[data-look-stripes]");
    if (!el) return;
    if (reduceMotion) { el.style.setProperty("--stripe", "24px"); el.style.setProperty("--ghost-op", "0"); return; }
    let ticking = false;
    const update = () => {
      ticking = false;
      const r = el.getBoundingClientRect();
      const p = clamp((innerHeight - r.top) / (innerHeight + r.height), 0, 1);
      const reveal = clamp((p - 0.04) / 0.3, 0, 1); // termina de revelarse cuando la foto ya está en pantalla
      el.style.setProperty("--stripe", (reveal * 24).toFixed(2) + "px");
      el.style.setProperty("--ghost-x", ((1 - reveal) * 22 + 3).toFixed(2) + "%");
      el.style.setProperty("--ghost-op", (1 - reveal * 0.65).toFixed(2));
    };
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener("resize", update);
    update();
  }


  /* ---------- Quanta Trail: galería X-Ray (carrusel con fundido) ---------- */
  function xrayGallery() {
    const el = $("[data-xgallery]");
    if (!el) return;
    const slides = $$(".xg-slide", el);
    const count = $("[data-xg-count]", el);
    let current = 0, timer = null, visible = false, hover = false;
    const go = (n) => {
      current = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
      count.textContent = `${String(current + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
    };
    const restart = () => {
      clearInterval(timer);
      if (reduceMotion) return;
      timer = setInterval(() => { if (visible && !hover && !document.hidden) go(current + 1); }, 4500);
    };
    $("[data-xg-prev]", el).addEventListener("click", () => { go(current - 1); restart(); });
    $("[data-xg-next]", el).addEventListener("click", () => { go(current + 1); restart(); });
    el.addEventListener("pointerenter", () => (hover = true));
    el.addEventListener("pointerleave", () => (hover = false));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.3 }).observe(el);
    restart();
  }

  /* ---------- Cinta de movimiento: líneas paralelas que se ondulan y giran (scroll + tiempo) ---------- */
  function ribbon() {
    const canvas = $("[data-ribbon]");
    if (!canvas) return;
    const section = canvas.closest(".motion");
    const readout = $("[data-ribbon-readout]");
    const ctx = canvas.getContext("2d");
    const N = 26;                                   // líneas de la cinta
    const C = {                                     // colores del manual
      grey: [104, 103, 103], white: [255, 255, 255], blue: [80, 104, 128], blueSoft: [142, 163, 187], lime: [228, 245, 73],
    };
    let w, h, dpr, visible = false, t = 0, p = 0, target = 0;
    const mix = (a, b, k) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
    const size = () => {
      dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const progress = () => {
      const r = section.getBoundingClientRect();
      const total = r.height - innerHeight;
      target = total > 0 ? clamp(-r.top / total, 0, 1) : 1;
    };
    size(); progress();
    addEventListener("resize", () => { size(); progress(); });
    addEventListener("scroll", progress, { passive: true });
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(section);

    const colorFor = (k, face) => {
      // k: posición de la línea en la cinta (0–1); el color avanza con el scroll
      let c;
      if (p < 0.35) c = mix(C.grey, C.white, p / 0.35);
      else if (p < 0.7) c = mix(C.white, mix(C.blueSoft, C.blue, k), (p - 0.35) / 0.35);
      else c = mix(mix(C.blueSoft, C.blue, k), mix(C.blue, C.lime, k), (p - 0.7) / 0.3);
      const a = 0.25 + 0.65 * face;
      return `rgba(${c[0]},${c[1]},${c[2]},${a.toFixed(3)})`;
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const e = p * p * (3 - 2 * p);                 // suavizado
      const cy = h * 0.52;
      const amp = h * (0.03 + 0.17 * e);             // altura de la onda
      const width = h * (0.004 + 0.13 * e);          // ancho de la cinta
      const twist = 0.4 + 2.2 * e;                   // cuánto gira la cinta
      const step = Math.max(6, w / 160);
      for (let i = 0; i < N; i++) {
        const k = i / (N - 1), off = k - 0.5;
        ctx.beginPath();
        let faceSum = 0, n = 0;
        for (let x = -20; x <= w + 20; x += step) {
          const u = x / w;
          const theta = u * Math.PI * twist + t * 0.6;
          const y = cy + Math.sin(u * Math.PI * 2.2 + t) * amp + Math.sin(u * Math.PI * 5.3 - t * 0.7) * amp * 0.18
                  + off * width * Math.cos(theta) * 2;
          faceSum += Math.abs(Math.cos(theta)); n++;
          x === -20 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colorFor(k, faceSum / n);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      if (readout) readout.textContent = `MOTION ${String(Math.round(p * 100)).padStart(3, "0")}%`;
    };

    if (reduceMotion) { p = 1; draw(); addEventListener("resize", draw); return; }
    (function loop() {
      requestAnimationFrame(loop);
      if (!visible) return;
      p = lerp(p, target, 0.08);
      t += 0.012;
      draw();
    })();
  }

  /* ---------- Índice de prendas: el ícono de cada prenda se dibuja trazo a trazo;
     cuando termina (y una breve pausa), pasa a la siguiente prenda. La barra lima marca ese mismo tiempo. ---------- */
  function press() {
    const stage = $("[data-press]");
    if (!stage) return;
    const slides = $$(".px-slide", stage);
    const next = $("[data-px-next]", stage);
    const cur = $(".px-tile.is-current", stage);
    const bar = $(".px-bar", cur);
    const DURATION = 3200, DRAW = 0.65;          // cada prenda ~3,2 s: dibujo ~2 s y ~1,1 s con el ícono completo
    let i = 0, prog = 0, last = 0, visible = false, hover = false, strokes = [], nodes = [], total = 0;
    const fill = (tile, s, label) => {
      $("use", tile).setAttribute("href", "#" + s.dataset.icon);
      $("b", tile).textContent = s.dataset.name;
      $("small", tile).textContent = label;
    };
    // Copia el símbolo del ícono dentro del lienzo para poder medir y animar cada trazo
    const build = (s) => {
      const svg = $(".px-draw", s);
      const sym = document.getElementById(s.dataset.icon);
      svg.innerHTML = sym ? sym.innerHTML : "";
      strokes = []; nodes = []; total = 0;
      $$("*", svg).forEach((el) => {
        const filled = el.classList.contains("node") || (el.tagName === "circle" && !el.classList.contains("ring"));
        if (filled) { el.classList.add("node"); nodes.push(el); return; }
        if (!el.getTotalLength) return;
        const len = el.getTotalLength();
        if (el.classList.contains("dash")) { el.style.opacity = 0; strokes.push({ el, len, dash: true, from: total }); total += len; return; }
        el.style.strokeDasharray = len; el.style.strokeDashoffset = len;
        strokes.push({ el, len, from: total }); total += len;
      });
    };
    const paint = (d) => {                         // d: fracción dibujada (0–1)
      const drawn = d * total;
      strokes.forEach((st) => {
        const k = d;                               // todos los trazos avanzan a la vez: movimiento parejo y tranquilo
        if (st.dash) st.el.style.opacity = k;
        else st.el.style.strokeDashoffset = st.len * (1 - k);
      });
      nodes.forEach((n) => n.classList.toggle("is-on", d > 0.92));
    };
    // Carrusel con todas las prendas (se ve en responsive; en escritorio quedan los dos recuadros)
    const strip = document.createElement("div");
    strip.className = "px-strip"; strip.setAttribute("role", "tablist"); strip.setAttribute("aria-label", "Prendas del índice");
    const stripBtns = slides.map((s, k) => {
      const bt = document.createElement("button");
      bt.type = "button"; bt.className = "px-strip-btn"; bt.setAttribute("role", "tab");
      bt.innerHTML = `<span class="px-strip-bar" aria-hidden="true"><i></i></span><svg aria-hidden="true"><use href="#${s.dataset.icon}"/></svg><b>${s.dataset.name}</b><small>${s.dataset.type}</small>`;
      bt.addEventListener("click", () => go(k));
      strip.appendChild(bt);
      return bt;
    });
    stage.appendChild(strip);
    const go = (n) => {
      i = (n + slides.length) % slides.length;
      slides.forEach((s, k) => s.classList.toggle("is-active", k === i));
      fill(cur, slides[i], `${String(i + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`);
      fill(next, slides[(i + 1) % slides.length], "Siguiente");
      build(slides[i]);
      prog = 0; bar.style.setProperty("--p", 0); paint(reduceMotion ? 1 : 0);
      // Carrusel (responsive): marca la prenda activa y la centra en la franja
      stripBtns.forEach((bt, k) => { bt.classList.toggle("is-active", k === i); bt.setAttribute("aria-selected", k === i); bt.style.setProperty("--p", 0); });
      const a = stripBtns[i];
      if (a && strip.scrollWidth > strip.clientWidth) strip.scrollTo({ left: a.offsetLeft - (strip.clientWidth - a.offsetWidth) / 2, behavior: "smooth" });
    };
    next.addEventListener("click", () => go(i + 1));
    // Sin pausa con el cursor: la sección avanza sola siempre que esté en pantalla
    let focused = false;
    stage.addEventListener("focusin", () => (focused = true));
    stage.addEventListener("focusout", () => (focused = false));
    $$("[data-px-go]", stage).forEach((a) => a.addEventListener("click", () => {
      $(`.pv-menu button[data-go="${a.dataset.pxGo}"]`)?.click();
    }));
    new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0.15 }).observe(stage);
    go(0);
    if (reduceMotion) { bar.style.setProperty("--p", 1); return; }
    (function loop(now) {
      requestAnimationFrame(loop);
      const dt = last ? Math.min(now - last, 100) : 0; last = now;
      if (!visible || focused || document.hidden) return;
      prog += dt / DURATION;
      if (prog >= 1) { go(i + 1); return; }
      const t = Math.min(1, prog / DRAW);
      paint(0.5 - Math.cos(Math.PI * t) / 2);      // curva suave (seno): sin aceleraciones bruscas
      bar.style.setProperty("--p", prog.toFixed(4));
      stripBtns[i]?.style.setProperty("--p", prog.toFixed(4));
    })(0);
  }

  /* ---------- Accesibilidad: botón de pausa en cada video que se repite solo (WCAG 2.2.2) ---------- */
  function videoToggles() {
    $$(".pv-cell video, .xray-mosaic video").forEach((v) => {
      const cell = v.parentElement;
      const bt = document.createElement("button");
      bt.type = "button"; bt.className = "vid-toggle";
      const set = () => { const off = v.paused; bt.textContent = off ? "▶" : "❚❚"; bt.setAttribute("aria-label", off ? "Reproducir video" : "Pausar video"); };
      bt.addEventListener("click", () => {
        if (v.paused) { delete v.dataset.userPaused; v.play().catch(() => {}); }
        else { v.dataset.userPaused = 1; v.pause(); }
      });
      v.addEventListener("play", set); v.addEventListener("pause", set);
      cell.appendChild(bt); set();
    });
  }

  progress();
  lifestyleParallax();
  looks();
  reveals();
  $$(".topo").forEach(topo);
  scanner();
  ribbon();
  press();
  xrayGallery();
  frost();
  productViewer();
  videoToggles();
  videos();
})();
