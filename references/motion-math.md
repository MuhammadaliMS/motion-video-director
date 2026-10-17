# Motion math reference

## Deterministic render loop

```js
// Everything is derived from t (seconds). No timers, no accumulated state.
function render(t) {
  ctx.clearRect(0, 0, W, H);
  for (const layer of layers) layer.draw(ctx, t);
}

// Capture: step t exactly, wait for paint, screenshot.
for (let f = 0; f < fps * duration; f++) {
  await page.evaluate((t) => window.render(t), f / fps);
  await page.screenshot({ path: `frames/${String(f).padStart(5, "0")}.png` });
}
// ffmpeg -framerate 60 -i frames/%05d.png -c:v libx264 -pix_fmt yuv420p -crf 16 out.mp4
```

Seeded randomness: use a tiny PRNG (mulberry32) seeded per element, never `Math.random()`.

## Closed-form damped spring (underdamped, 0 → 1)

```js
// zeta: damping ratio (<1 overshoots), omega: natural frequency (rad/s)
function spring(t, { zeta = 0.75, omega = 14 } = {}) {
  if (t <= 0) return 0;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  return 1 - Math.exp(-zeta * omega * t) *
    (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t));
}
// Animate from a to b starting at t0:
const lerp = (a, b, p) => a + (b - a) * p;
const x = lerp(a, b, spring(t - t0));
```

Starting presets (tune by eye; overshoot ≈ exp(-πζ/√(1-ζ²))):

| Preset | zeta | omega | Feel |
|---|---|---|---|
| snappy UI (buttons, toggles) | 0.8 | 22 | fast, ~1.5% overshoot |
| card settle | 0.75 | 14 | soft, ~2.8% overshoot |
| big layout move | 0.85 | 10 | heavy, minimal overshoot |
| playful pop | 0.55 | 16 | visible bounce, use sparingly |

Remotion has `spring()` built in (frame-based, also deterministic). In GSAP/HyperFrames, use
paused timelines driven by the timeline position, never by wall-clock playback.

## Beat grid

```
beatSec = 60 / BPM            // 120 BPM → 0.5s
beatFrames = beatSec * fps    // 60fps → 30 frames
```
Snap key motion start times to `n * beatSec`. Keep a shared `timeline.json`:
```json
{ "bpm": 120, "fps": 60,
  "cues": [ { "t": 0.5, "id": "cards-in", "sfx": "swoosh" },
            { "t": 3.0, "id": "cursor-click", "sfx": "click" } ] }
```

## Synthesized UI sound effects (sample-level, mono)

```js
const SR = 48000;
const click  = (t) => Math.sin(2*Math.PI*1800*t) * Math.exp(-t*90) * 0.4;   // ~20ms tick
const thump  = (t) => Math.sin(2*Math.PI*(60 + 40*Math.exp(-t*30))*t) * Math.exp(-t*8) * 0.8;
const swoosh = (t, rnd) => (rnd()*2-1) * Math.sin(Math.PI*Math.min(t/0.35,1)) * 0.25; // filtered noise ideally
// Render each cue into a Float32Array at cue.t * SR, sum, clip, write WAV, mux with ffmpeg.
```

## Checkpoint frames for critique

```bash
for t in 1.5 4 8.5 14; do ffmpeg -y -loglevel error -ss $t -i out.mp4 -frames:v 1 check_$t.png; done
ffprobe -v error -show_entries format=duration -of csv=p=0 out.mp4
```
