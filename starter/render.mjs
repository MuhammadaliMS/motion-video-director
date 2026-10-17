#!/usr/bin/env node
// Render any time-driven HTML page to MP4.
//
//   node render.mjs examples/d3-chart.html                 -> out/d3-chart.mp4
//   node render.mjs page.html --out reel.mp4 --fps 60 --duration 15 --size 1080x1920
//   node render.mjs page.html --stills 1.5,4,8.5,14         -> PNG checkpoints for review
//   node render.mjs page.html --check                       -> determinism test, no video
//   node render.mjs page.html --frames 83,85                -> stills by FRAME number (+ side-by-side pair of two)
//   node render.mjs page.html --contact                     -> one 12-frame contact sheet of the whole clip
//   node render.mjs page.html --audio sfx.wav --gif         -> mux audio (-14 LUFS), also export a looping GIF
//   node render.mjs page.html --sheet                       -> contact sheet, 2 frames per second, 6 across
//   node render.mjs page.html --strip 240                   -> 12 consecutive frames from frame 240 (the fastest move)
//   node render.mjs page.html --stills 1,2 --phone          -> also write 360 px wide copies (phone test)
//   node render.mjs page.html --loopcheck                   -> also write the clip played twice back to back
//
// The page must call Motion.stage({...}) from lib/motion.js, or define
// window.render(t), and optionally window.ready (Promise) and window.VIDEO {fps, duration, width, height}.
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import path from "node:path";

const args = process.argv.slice(2);
const FLAGS = ["--check", "--contact", "--gif", "--sheet", "--phone", "--loopcheck"];
const page = args.find((a) => !a.startsWith("--") && !isValueOf(a));
function isValueOf(a) {
  const i = args.indexOf(a);
  return i > 0 && args[i - 1].startsWith("--") && !FLAGS.includes(args[i - 1]);
}
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : undefined;
};
if (!page) {
  console.error("usage: node render.mjs <page.html> [--out f.mp4] [--fps n] [--duration s] [--size WxH] [--stills t1,t2] [--frames f1,f2] [--contact] [--sheet] [--strip frame] [--phone] [--loopcheck] [--check] [--audio f.wav] [--gif] [--crf 16]");
  process.exit(1);
}

// Static server rooted at the current directory, so pages can load ./node_modules and ./lib.
const root = process.cwd();
const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".woff2": "font/woff2", ".wav": "audio/wav", ".mp3": "audio/mpeg" };
const server = createServer(async (req, res) => {
  try {
    if (req.url === "/favicon.ico") return res.writeHead(204).end();
    const p = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
    if (!p.startsWith(root)) throw new Error("outside root");
    const body = await readFile(p);
    res.writeHead(200, { "content-type": types[path.extname(p)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const url = `http://127.0.0.1:${server.address().port}/${page}`;

// Use Playwright's bundled browser if it's downloaded, otherwise the installed Google Chrome.
// GPU=1 renders WebGL on the real GPU (Metal ANGLE on macOS): about 3x faster for three.js scenes and still deterministic
// in testing. Default is SwiftShader (slow, always available). Use GPU=1 for 3D, then confirm with --check.
const launchArgs = process.env.GPU === "1" ? ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist", "--enable-webgl", "--font-render-hinting=none"] : ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--font-render-hinting=none"];
const browser = await chromium.launch({ args: launchArgs }).catch(() =>
  chromium.launch({ channel: "chrome", headless: true, args: launchArgs }).catch(() => {
    console.error("No browser found. Run `npx playwright install chromium` or install Google Chrome.");
    process.exit(1);
  }));
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const tab = await ctx.newPage();
const errors = [];
tab.on("pageerror", (e) => errors.push(e.message));
tab.on("console", (m) => m.type() === "error" && errors.push(m.text()));
await tab.goto(url, { waitUntil: "networkidle" });
await tab.waitForFunction(() => typeof window.render === "function", null, { timeout: 15000 });
await tab.evaluate(() => window.ready);
if (errors.length) console.warn("page errors:\n  " + errors.join("\n  "));

const v = await tab.evaluate(() => window.VIDEO || {});
const [sw, sh] = (opt("size") || "").split("x").map(Number);
const width = sw || v.width || 1920, height = sh || v.height || 1080;
const fps = Number(opt("fps") || v.fps || 30);
const duration = Number(opt("duration") || v.duration || 5);
await tab.setViewportSize({ width, height });
await tab.evaluate(() => window.dispatchEvent(new Event("resize")));

const settle = () => tab.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
async function frameAt(t) {
  await tab.evaluate((t) => { window.render(t); }, t); // never return library objects (GSAP timelines hang serialization)
  await settle();
  return tab.screenshot({ type: "png", clip: { x: 0, y: 0, width, height } });
}
const name = path.basename(page, path.extname(page));
const hash = (b) => createHash("sha1").update(b).digest("hex").slice(0, 10);
const run = (cmd, a) => new Promise((res, rej) => spawn(cmd, a, { stdio: ["ignore", "inherit", "inherit"] })
  .on("close", (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}`)))));
const fsp = await import("node:fs/promises");
// Phone test: the same frame at 360 px wide, to check type is still readable on a feed.
const phoneCopy = async (file) => { const ph = file.replace(/\.png$/, "_360.png"); await run("ffmpeg", ["-y", "-loglevel", "error", "-i", file, "-vf", "scale=360:-1", ph]); console.log(ph); };


if (args.includes("--check")) {
  // Same t must give the same pixels, whatever was rendered before it.
  const ts = [0.25, 0.5, 0.75].map((p) => +(p * duration).toFixed(3));
  const first = {};
  for (const t of ts) first[t] = hash(await frameAt(t));
  for (const t of [...ts].reverse()) { await frameAt(duration * 0.9); await frameAt(0); }
  let ok = true;
  for (const t of [...ts].reverse()) {
    const again = hash(await frameAt(t));
    const same = again === first[t];
    ok &&= same;
    console.log(`t=${t}s  ${first[t]} vs ${again}  ${same ? "same" : "DIFFERENT"}`);
  }
  const blank = new Set(Object.values(first)).size === 1;
  if (blank) console.log("warning: all checkpoints are identical - is anything animating?");
  console.log(ok ? "PASS: deterministic" : "FAIL: frames depend on render order or wall-clock time");
  await browser.close(); server.close();
  process.exit(ok ? 0 : 1);
}

if (opt("stills")) {
  const dir = opt("out") || `out/${name}-stills`;
  await mkdir(dir, { recursive: true });
  for (const t of opt("stills").split(",").map(Number)) {
    const file = `${dir}/${name}_${t}s.png`;
    await fsp.writeFile(file, await frameAt(t));
    console.log(file);
    if (args.includes("--phone")) await phoneCopy(file);
  }
  await browser.close(); server.close();
  process.exit(0);
}


if (opt("frames")) {
  // Frame numbers, not seconds: "the punch at frame 84 peaks late" -> --frames 83,85 and compare.
  const dir = opt("out") || `out/${name}-stills`;
  await mkdir(dir, { recursive: true });
  const files = [];
  for (const f of opt("frames").split(",").map(Number)) {
    const file = `${dir}/${name}_f${f}.png`;
    await fsp.writeFile(file, await frameAt(f / fps));
    files.push(file); console.log(file);
    if (args.includes("--phone")) await phoneCopy(file);
  }
  if (files.length === 2) {
    const pair = `${dir}/${name}_pair.png`;
    await run("ffmpeg", ["-y", "-loglevel", "error", "-i", files[0], "-i", files[1], "-filter_complex", "hstack", pair]);
    console.log(pair);
  }
  await browser.close(); server.close();
  process.exit(0);
}

if (args.includes("--sheet")) {
  // Contact sheet at 2 frames per second, 6 across: read the whole film like a storyboard.
  const dir = opt("out") || `out/${name}-stills`;
  await mkdir(dir, { recursive: true });
  const n = Math.max(1, Math.floor(duration * 2));
  for (let i = 0; i < n; i++) await fsp.writeFile(`${dir}/s_${String(i).padStart(3, "0")}.png`, await frameAt(i / 2));
  const sheet = `${dir}/${name}_sheet.png`;
  await run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", `${dir}/s_%03d.png`, "-vf", `scale=240:-1,tile=6x${Math.ceil(n / 6)}`, "-frames:v", "1", sheet]);
  console.log(sheet);
  await browser.close(); server.close();
  process.exit(0);
}

if (opt("strip")) {
  // 12 consecutive frames from a frame number: spacing shows easing, overshoot and dead frames.
  const dir = opt("out") || `out/${name}-stills`;
  await mkdir(dir, { recursive: true });
  const f0 = Number(opt("strip"));
  for (let i = 0; i < 12; i++) await fsp.writeFile(`${dir}/t_${String(i).padStart(2, "0")}.png`, await frameAt((f0 + i) / fps));
  const strip = `${dir}/${name}_strip${f0}.png`;
  await run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", `${dir}/t_%02d.png`, "-vf", "scale=300:-1,tile=6x2", "-frames:v", "1", strip]);
  console.log(strip);
  await browser.close(); server.close();
  process.exit(0);
}

if (args.includes("--contact")) {
  // Twelve evenly spaced frames on one image, read like a storyboard.
  const dir = opt("out") || `out/${name}-stills`;
  await mkdir(dir, { recursive: true });
  const n = 12, total0 = Math.round(fps * duration);
  for (let i = 0; i < n; i++) await fsp.writeFile(`${dir}/c_${String(i).padStart(2, "0")}.png`, await frameAt(Math.floor((i * total0) / n) / fps));
  const sheet = `${dir}/${name}_contact.png`;
  await run("ffmpeg", ["-y", "-loglevel", "error", "-framerate", "1", "-i", `${dir}/c_%02d.png`, "-vf", "scale=480:-1,tile=4x3", "-frames:v", "1", sheet]);
  console.log(sheet);
  await browser.close(); server.close();
  process.exit(0);
}

const out = opt("out") || `out/${name}.mp4`;
await mkdir(path.dirname(out), { recursive: true });
const ff = spawn("ffmpeg", ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(fps), "-i", "-",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", opt("crf") || "16", "-preset", "medium", "-movflags", "+faststart", out],
  { stdio: ["pipe", "inherit", "inherit"] });
const total = Math.round(fps * duration);
const t0 = Date.now();
for (let f = 0; f < total; f++) {
  const buf = await frameAt(f / fps);
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
  if (f % fps === 0) process.stdout.write(`\r${name}: ${f}/${total} frames`);
}
ff.stdin.end();
await new Promise((r) => ff.on("close", r));
console.log(`\r${name}: ${total} frames, ${width}x${height}@${fps} -> ${out} (${((Date.now() - t0) / 1000).toFixed(1)}s)`);
await browser.close(); server.close();

if (args.includes("--loopcheck")) {
  // The clip played twice back to back: watch the seam, or compare the last and first frames.
  const lc = out.replace(/\.mp4$/, "") + "-loopcheck.mp4";
  await run("ffmpeg", ["-y", "-loglevel", "error", "-stream_loop", "1", "-i", out, "-c", "copy", lc]);
  console.log(`loop check -> ${lc}`);
}
let video = out;
if (opt("audio")) {
  // Normalize to -14 LUFS. True peak -2.2 dB so the AAC encode stays under -1 dBTP.
  // The AAC encoder adds ~16 ms of padding: for a seamless loop, fade the first and last
  // 96 samples of the WAV (2 ms raised cosine) before muxing. See references/export-and-audio.md.
  video = out.replace(/\.mp4$/, "") + "-audio.mp4";
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", out, "-i", opt("audio"),
    "-filter_complex", "[1:a]loudnorm=I=-14:TP=-2.2:LRA=11[a]", "-map", "0:v", "-map", "[a]",
    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", video]);
  console.log(`audio muxed -> ${video}`);
}
if (args.includes("--gif")) {
  // One palette for the whole clip so colours do not flicker. X caps GIFs at 350 frames, 15 MB.
  const gif = out.replace(/\.mp4$/, ".gif");
  const gfps = Math.min(fps, 24);
  if (gfps * duration > 350) console.warn(`warning: ${Math.round(gfps * duration)} frames exceeds X's 350-frame GIF cap`);
  await run("ffmpeg", ["-y", "-loglevel", "error", "-i", out, "-vf",
    `fps=${gfps},scale=${Math.min(width, 1200)}:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle`,
    "-loop", "0", gif]);
  console.log(`gif -> ${gif}`);
}
