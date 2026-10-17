#!/usr/bin/env node
// Measure a supplied track before animating to it: bpm, beats, downbeats and hits, as JSON.
//   node tools/beats.mjs song.wav > beats.json
// Needs only Node and ffmpeg (no librosa). State changes go on beats, big moments on downbeats,
// clicks and whooshes on hits. Heuristic: spectral flux + autocorrelation, fine for steady 4/4 music.
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/beats.mjs <audio> [minBpm=70] [maxBpm=180]"); process.exit(1); }
const minBpm = Number(process.argv[3] || 70), maxBpm = Number(process.argv[4] || 180);
const SR = 22050, N = 1024, HOP = 512;
const r = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", String(SR), "-f", "f32le", "-"], { maxBuffer: 1 << 30 });
if (r.status !== 0) { console.error(r.stderr.toString()); process.exit(1); }
const x = new Float32Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 4));

// radix-2 FFT (in place) on re/im arrays
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let bit = n >> 1; for (; j & bit; bit >>= 1) j ^= bit; j ^= bit; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
const win = Float32Array.from({ length: N }, (_, i) => 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
const frames = Math.max(0, Math.floor((x.length - N) / HOP));
const bins = N / 2, kMax = Math.floor((5000 / (SR / 2)) * bins);
let prev = new Float32Array(kMax);
const env = new Float32Array(frames);
const re = new Float32Array(N), im = new Float32Array(N);
for (let f = 0; f < frames; f++) {
  for (let i = 0; i < N; i++) { re[i] = x[f * HOP + i] * win[i]; im[i] = 0; }
  fft(re, im);
  let flux = 0;
  for (let k = 1; k < kMax; k++) { const m = Math.log1p(10 * Math.hypot(re[k], im[k])); flux += Math.max(0, m - prev[k]); prev[k] = m; }
  env[f] = flux;
}
// normalize and remove the slow average
const mean = env.reduce((a, b) => a + b, 0) / (env.length || 1);
const smooth = new Float32Array(frames); let acc = 0;
for (let i = 0; i < frames; i++) { acc += (env[i] - acc) * 0.02; smooth[i] = Math.max(0, env[i] - acc * 1.0); }
const fps = SR / HOP;

// tempo: autocorrelation of the onset envelope, with a soft prior around 120 bpm
let best = { bpm: 120, score: -1 };
for (let bpm = minBpm; bpm <= maxBpm; bpm += 0.25) {
  const lag = (60 / bpm) * fps; let s = 0, c = 0;
  for (let m = 1; m <= 4; m++) { const L = lag * m; for (let i = 0; i + L + 1 < frames; i++) { const j = i + L, j0 = Math.floor(j), fr = j - j0; s += smooth[i] * (smooth[j0] * (1 - fr) + smooth[j0 + 1] * fr); c++; } }
  s = (s / Math.max(1, c)) * Math.exp(-Math.pow(Math.log2(bpm / 120), 2) / 0.9);
  if (s > best.score) best = { bpm, score: s };
}
const period = (60 / best.bpm) * fps;
// phase: the offset whose comb of beats collects the most onset energy
let bestPhase = 0, bestSum = -1;
for (let ph = 0; ph < period; ph += 0.5) { let sum = 0; for (let p = ph; p < frames - 1; p += period) { const i = Math.round(p); sum += smooth[i] + 0.5 * (smooth[i - 1] || 0) + 0.5 * (smooth[i + 1] || 0); } if (sum > bestSum) { bestSum = sum; bestPhase = ph; } }
const beats = []; const strength = [];
for (let p = bestPhase; p < frames - 1; p += period) { // snap each beat to the local peak within +/- 2 frames
  let bi = Math.round(p), bv = -1; for (let d = -2; d <= 2; d++) { const i = Math.round(p) + d; if (i >= 0 && i < frames && smooth[i] > bv) { bv = smooth[i]; bi = i; } }
  beats.push(+((bi * HOP + N / 2) / SR).toFixed(3)); strength.push(bv);
}
// downbeats: the beat of each bar-of-4 phase with the most energy
const sums = [0, 0, 0, 0]; strength.forEach((v, i) => (sums[i % 4] += v)); const dbPhase = sums.indexOf(Math.max(...sums));
const downbeats = beats.filter((_, i) => i % 4 === dbPhase);
// hits: onset peaks well above the local level, at least 90 ms apart
const thr = (smooth.reduce((a, b) => a + b, 0) / (frames || 1)) * 2.2, hits = [];
for (let i = 2; i < frames - 2; i++) if (smooth[i] > thr && smooth[i] >= smooth[i - 1] && smooth[i] > smooth[i + 1]) { const t = +((i * HOP + N / 2) / SR).toFixed(3); if (!hits.length || t - hits[hits.length - 1].t > 0.09) hits.push({ t, strength: +(smooth[i] / thr).toFixed(2) }); }
console.log(JSON.stringify({ file, duration: +(x.length / SR).toFixed(2), bpm: +best.bpm.toFixed(2), beatSec: +(60 / best.bpm).toFixed(4), beats, downbeats, hits }, null, 1));
