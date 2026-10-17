#!/usr/bin/env node
// Meter the soundtrack of a film (or a WAV) against the measured range of professional launch films.
//   node tools/audio-check.mjs film.mp4
// Node + ffmpeg only. These are meters, not ears: it cannot say whether a sound is good, only whether the
// loudness, true peak, start, end and silences are where pro launch films put them. For listening, see
// references/sound.md (earshot). Ranges: docs/launch-video-sound.md of github.com/Leonxlnx/earshot (7 films).
import { spawnSync } from "node:child_process";

const file = process.argv[2];
if (!file) { console.error("usage: node tools/audio-check.mjs <film.mp4|audio>"); process.exit(1); }
const ff = (args) => spawnSync("ffmpeg", ["-hide_banner", "-nostats", ...args], { encoding: "utf8", maxBuffer: 1 << 28 }).stderr;

const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type", "-of", "json", file], { encoding: "utf8" });
const info = JSON.parse(probe.stdout || "{}");
if (!(info.streams || []).some((s) => s.codec_type === "audio")) { console.log("FAIL  no audio track"); process.exit(1); }
const dur = Number(info.format.duration);

const e = ff(["-i", file, "-vn", "-af", "ebur128=peak=true", "-f", "null", "-"]);
const last = (re) => { const m = [...e.matchAll(re)]; return m.length ? Number(m[m.length - 1][1]) : NaN; };
const I = last(/I:\s+(-?[\d.]+) LUFS/g), LRA = last(/LRA:\s+(-?[\d.]+) LU/g), TP = last(/Peak:\s+(-?[\d.]+) dBFS/g);

const s = ff(["-i", file, "-vn", "-af", "silencedetect=noise=-45dB:d=0.1", "-f", "null", "-"]);
const starts = [...s.matchAll(/silence_start: (-?[\d.]+)/g)].map((m) => Math.max(0, Number(m[1])));
const ends = [...s.matchAll(/silence_end: ([\d.]+) \| silence_duration: ([\d.]+)/g)].map((m) => ({ end: Number(m[1]), d: Number(m[2]) }));
const gaps = starts.map((st, i) => ({ st, d: ends[i] ? ends[i].d : dur - st, open: !ends[i] }));
const firstSound = gaps.length && gaps[0].st < 0.01 ? gaps[0].d : 0;
const endGap = gaps.length && gaps[gaps.length - 1].open ? gaps[gaps.length - 1].d : 0;
const inner = gaps.filter((g) => g.st > 0.01 && !g.open);
const maxGap = inner.reduce((m, g) => Math.max(m, g.d), 0);

// loudness of the first 10% and the last 3 s versus the integrated level
const lufsOf = (a) => { const t = ff(["-i", file, "-vn", ...a, "-af", "ebur128", "-f", "null", "-"]); const m = [...t.matchAll(/I:\s+(-?[\d.]+) LUFS/g)]; return m.length ? Number(m[m.length - 1][1]) : NaN; };
const intro = lufsOf(["-t", String(Math.max(1, dur * 0.1))]);
const outro = dur > 4 ? lufsOf(["-ss", String(dur - 3.5), "-t", "3"]) : NaN;

const rows = [
  ["integrated loudness", `${I.toFixed(1)} LUFS`, I >= -16 && I <= -9, "pros: median -14.8, web window -16..-9"],
  ["true peak", `${TP.toFixed(1)} dBTP`, TP <= -1, "master <= -1 dBTP; decoded MP4 <= 0 (6 of 7 pro films clip, do not copy)"],
  ["loudness range", `${LRA.toFixed(1)} LU`, LRA <= 12.5, "pros: 1.7 to 12.2, median 5.5"],
  ["first sound at", `${firstSound.toFixed(2)} s`, firstSound <= 0.5, "pros: 0.04 to 0.48 s, no silent cold open"],
  ["opening level vs integrated", `${(intro - I).toFixed(1)} LU`, Math.abs(intro - I) <= 3 + 1e-9, "pros: -1.8 to +2.2 LU (one builds from -17.5)"],
  ["ending level vs integrated", Number.isFinite(outro) ? `${(outro - I).toFixed(1)} LU` : "n/a", !Number.isFinite(outro) || outro - I >= -6, "pros: last 3 s at body level (-2.2 to +5.6 LU)"],
  ["dead air after the sound", `${endGap.toFixed(2)} s`, endGap <= 0.5, "pros: median 0.04 s; end on a sting, no long fade"],
  ["longest silent hole inside", `${maxGap.toFixed(2)} s`, maxGap <= 0.5, "pros: none over 0.04 s except one deliberate 1.66 s"],
];
console.log(`${file}  (${dur.toFixed(1)} s)`);
for (const [n, v, ok, note] of rows) console.log(`${ok ? "ok  " : "FIX "} ${n.padEnd(30)} ${v.padStart(11)}   ${note}`);
const bad = rows.filter((r) => !r[2]).length;
console.log(bad ? `\n${bad} metric(s) outside the pro range: fix those, then re-run.` : "\nall metrics inside the pro range (meters only: this does not say it sounds good).");
console.log(JSON.stringify({ lufs_i: I, true_peak: TP, lra: LRA, first_sound_s: firstSound, intro_lu: +(intro - I).toFixed(2), end_lu: Number.isFinite(outro) ? +(outro - I).toFixed(2) : null, end_silence_s: endGap, max_gap_s: maxGap }));
