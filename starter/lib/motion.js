// Motion helpers for time-driven video. Classic script: exposes window.Motion.
// Everything here is a pure function of its inputs, so any frame can be rendered on its own.
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;

  // Closed-form damped spring, 0 -> 1. zeta < 1 overshoots slightly, then settles.
  function spring(t, { zeta = 0.75, omega = 14 } = {}) {
    if (t <= 0) return 0;
    if (zeta >= 1) return 1 - Math.exp(-omega * t) * (1 + omega * t);
    const wd = omega * Math.sqrt(1 - zeta * zeta);
    return 1 - Math.exp(-zeta * omega * t) *
      (Math.cos(wd * t) + ((zeta * omega) / wd) * Math.sin(wd * t));
  }

  const SPRINGS = {
    snappy: { zeta: 0.8, omega: 22 },
    card: { zeta: 0.75, omega: 14 },
    heavy: { zeta: 0.85, omega: 10 },
    pop: { zeta: 0.55, omega: 16 },
  };

  // Spring that starts at `at` seconds. preset: a SPRINGS name or {zeta, omega}.
  const springAt = (t, at, preset = "card") =>
    spring(t - at, typeof preset === "string" ? SPRINGS[preset] : preset);

  // Stacked springs for a value that changes target several times (cursor, container width):
  //   track(t) = v0 + sum (v_i - v_(i-1)) * spring(t - t_i)
  // keys: [[t0, v0], [t1, v1], ...]. Each retarget gets its own spring, nothing restarts, and it
  // stays a pure function of t, so frame 812 renders without simulating frames 0..811.
  function springTrack(t, keys, preset = "card") {
    let v = keys[0][1];
    for (let i = 1; i < keys.length; i++) v += (keys[i][1] - keys[i - 1][1]) * springAt(t, keys[i][0], preset);
    return v;
  }

  // Linear 0..1 progress of a window [start, start + dur].
  const progress = (t, start, dur) => clamp((t - start) / dur);

  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

  // Seeded PRNG (mulberry32). Never use Math.random() in a render.
  function rng(seed = 1) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Damping ratio from any library's numbers (stiffness k, damping d, mass m): 1 = no bounce,
  // 0.7-0.85 premium, 0.4-0.6 playful, <0.3 cartoon. Remotion default (1, 10, 100) = 0.5.
  const dampingRatio = (k, d, m = 1) => d / (2 * Math.sqrt(k * m));

  // CSS-style cubic-bezier(x1, y1, x2, y2) as a function of progress 0..1 (Newton + bisection).
  function bezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (s) => ((ax * s + bx) * s + cx) * s;
    const sy = (s) => ((ay * s + by) * s + cy) * s;
    const dx = (s) => (3 * ax * s + 2 * bx) * s + cx;
    return (p) => {
      if (p <= 0) return 0;
      if (p >= 1) return 1;
      let s = p;
      for (let i = 0; i < 8; i++) {
        const e = sx(s) - p;
        if (Math.abs(e) < 1e-6) return sy(s);
        const d = dx(s);
        if (Math.abs(d) < 1e-6) break;
        s -= e / d;
      }
      let lo = 0, hi = 1;
      s = p;
      for (let i = 0; i < 40; i++) {
        const e = sx(s) - p;
        if (Math.abs(e) < 1e-6) break;
        if (e > 0) hi = s; else lo = s;
        s = (lo + hi) / 2;
      }
      return sy(s);
    };
  }

  // Named curves from the motion-numbers cheat sheet. Use for camera, moves and exits;
  // springs are for objects with mass. Opacity and colour never bounce.
  const EASE = {
    enter: bezier(0.16, 1, 0.3, 1),      // ease-out-expo: text and logo reveals
    premium: bezier(0.22, 1, 0.36, 1),   // ease-out-quint: premium entrances
    move: bezier(0.76, 0, 0.24, 1),      // ease-in-out-quart: moves and camera pushes
    exit: bezier(0.7, 0, 0.84, 0),       // ease-in-expo: fast exits (make them 40-50% shorter)
    pop: bezier(0.34, 1.56, 0.64, 1),    // ease-out-back: playful overshoot
  };

  // Beat grid helpers: beat(n) -> seconds. frame(n, fps) rounds PER BEAT from time, so a
  // 128 BPM / 30 fps grid never drifts (adding a rounded 14 frames each time does).
  const beats = (bpm = 120) => {
    const sec = 60 / bpm;
    return { sec, at: (n) => n * sec, index: (t) => Math.floor(t / sec),
             frame: (n, fps) => Math.round(n * sec * fps) };
  };

  // Loop phase 0..1 for a seamless loop: frames 0..N-1 render, frame N would equal frame 0.
  // Use whole-number cycles of it (sin(2*PI*k*phase)) so the last frame flows into the first.
  const loopPhase = (t, duration) => (((t / duration) % 1) + 1) % 1;

  // Stagger starts: item i starts at base + i * gap. Starting points: letters 0.03s, words 0.09s, items 0.06s.
  const STAGGER = { letter: 0.03, word: 0.09, item: 0.06 };
  const stagger = (i, base = 0, gap = STAGGER.item) => base + i * gap;

  /**
   * Wire a page up for video rendering.
   *   stage({ fps, duration, width, height, render, setup })
   * - setup(): async, load fonts/data/layouts once. Optional.
   * - render(t): draw the exact frame for time t (seconds). Must not depend on previous calls.
   * Works with render.mjs (window.render / window.ready / window.VIDEO)
   * and with HyperFrames (hf-seek event, window.__hfThreeTime).
   */
  function stage({ fps = 30, duration = 6, width = 1920, height = 1080, render, setup }) {
    window.VIDEO = { fps, duration, width, height };
    window.render = render;
    window.renderAt = render; // same contract as the prompt-based workflow: renderAt(t) draws exactly t
    // Freeze by URL: open page.html?t=2.5 (seconds) or ?f=84 (frame) to see that exact frame.
    const q = new URLSearchParams(location.search);
    const freezeAt = q.has("t") ? parseFloat(q.get("t")) : q.has("f") ? parseFloat(q.get("f")) / fps : null;
    window.ready = (async () => {
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
      if (setup) await setup();
      render(freezeAt != null ? freezeAt : window.__hfThreeTime || 0);
      window.__ready = true;
    })();
    window.addEventListener("hf-seek", (e) => window.ready.then(() => render(e.detail.time)));
  }

  window.Motion = {
    clamp, lerp, spring, SPRINGS, springAt, progress,
    easeOutCubic, easeInOutCubic, rng, beats, stage,
    dampingRatio, bezier, EASE, loopPhase, STAGGER, stagger, springTrack,
  };
})();
