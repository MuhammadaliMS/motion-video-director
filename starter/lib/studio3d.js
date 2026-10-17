// studio3d.js: a premium 3D prop and studio kit for seekable three.js scenes.
// Built and tested on a 99 s product reel (three r186). Everything is a pure function of its inputs: no clocks, no Math.random.
// Scale: props are modelled at 1 unit = 10 cm. Use one scale per set (desk 1u=10cm, room 1u=20cm) and scale props to it.
// Fonts: canvas textures are queued in DRAW; call DRAW.forEach(d => d.draw()) after document.fonts are loaded.
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
export const HOT = 0xe84393, VIOLET = 0x6c5ce7, YEL = 0xffeaa7, SKY = 0x74b9ff, PINK = 0xf7d6e0, LILAC = 0xc8a8e9, LILAC2 = 0xd8b4f8, CORAL = 0xff5252, INK = 0x1e1e24;
export const hash = (n) => { let x = Math.imul((n | 0) ^ 0x9e3779b9, 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, k) => a + (b - a) * k;
const EASE = { exit: (k) => 1 - Math.pow(1 - k, 3) };
export const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
export const ENV = { map: null }; // set ENV.map = scene.environment so metals that need reflections get them
export const DRAW = [];
export const RB = (w, h, d, r = 0.1, seg = 6) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2, h / 2, d / 2));
export const clay = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color(0xffe6f6), clearcoat: 0.25, clearcoatRoughness: 0.4, ...o });
export const glass = (c, o = {}) => new THREE.MeshPhysicalMaterial({ color: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.45), transmission: 1, thickness: 0.6, roughness: 0.16, ior: 1.45, attenuationColor: new THREE.Color(c).lerp(new THREE.Color(0xffffff), 0.25), attenuationDistance: 1.6, clearcoat: 1, clearcoatRoughness: 0.08, iridescence: 0.25, iridescenceIOR: 1.3, specularIntensity: 1, ...o });
export const gloss = (c, r = 0.22) => new THREE.MeshPhysicalMaterial({ color: c, roughness: r, clearcoat: 1, clearcoatRoughness: 0.08 });
export const metal = (c = 0xe4e6ee, r = 0.25) => new THREE.MeshPhysicalMaterial({ color: c, metalness: 1, roughness: r });
export function mesh(geo, m, parent) { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; parent.add(o); return o; }
export function ctex(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8; return { c, g, tx, draw: (...a) => { g.clearRect(0, 0, w, h); draw(g, ...a); tx.needsUpdate = true; } }; }
export const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };
export const hex = (c) => "#" + c.toString(16).padStart(6, "0");
/* ---------- prop library: recognizable objects at real proportions (1 unit = 10 cm) ---------- */
export const V2 = (x, y) => new THREE.Vector2(x, y);
export function puck(r, h, b, seg = 64) { const p = [V2(0.0001, -h / 2)]; for (let i = 0; i <= 8; i++) { const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2); p.push(V2(r - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b)); } for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); p.push(V2(r - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b)); } p.push(V2(0.0001, h / 2)); return new THREE.LatheGeometry(p, seg); }
export function curlGeo(W, H, dir, c0, Rr, seg = 40) { const geo = new THREE.PlaneGeometry(W, H, seg, seg); const p = geo.attributes.position; const d = new THREE.Vector2(dir[0], dir[1]).normalize();
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const k = x * d.x + y * d.y - c0; if (k > 0) { const ang = Math.min(k / Rr, Math.PI * 0.95); const back = Rr * Math.sin(ang) - k; p.setX(i, x + d.x * back); p.setY(i, y + d.y * back); p.setZ(i, Rr * (1 - Math.cos(ang))); } }
  geo.computeVertexNormals(); return geo; }
export function meshAlpha(rx, ry) { const t = ctex(256, 256, (g) => { g.fillStyle = "#fff"; for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) { g.fillRect(x, y, 16, 3); g.fillRect(x, y, 3, 16); } }); t.draw(); t.tx.wrapS = t.tx.wrapT = THREE.RepeatWrapping; t.tx.repeat.set(rx, ry); return t.tx; }
export function stripeTex(a, b, n = 7) { const t = ctex(512, 96, (g) => { g.fillStyle = a; g.fillRect(0, 0, 512, 96); g.fillStyle = b; const w = 512 / n; for (let i = -1; i <= n; i++) { const x = i * w; g.beginPath(); g.moveTo(x, 96); g.lineTo(x + 36, 0); g.lineTo(x + 36 + w / 2, 0); g.lineTo(x + w / 2, 96); g.fill(); } }); t.draw(); return t.tx; }
export const kb = ctex(1024, 640, (g) => { g.fillStyle = "#d9cde3"; g.fillRect(0, 0, 1024, 640); for (let r = 0; r < 5; r++) for (let c = 0; c < 14; c++) { g.fillStyle = (r + c) % 9 === 0 ? "#E84393" : "#f7f2fa"; rr(g, 30 + c * 69, 40 + r * 82, 60, 70, 10); g.fill(); } g.fillStyle = "#c9bcd6"; rr(g, 330, 470, 360, 140, 16); g.fill(); }); DRAW.push(kb);
export const PROP = {};
PROP.pencil = (c) => { const g = new THREE.Group(), r = 0.036, L = 1.6; // painted hex body, sharpened wood cone, graphite, ferrule rings, eraser
  mesh(new THREE.CylinderGeometry(r, r, L, 6), gloss(c, 0.28), g).position.y = L / 2;
  mesh(new THREE.CylinderGeometry(0.011, r * 0.92, 0.2, 18), clay(0xf2d2a6, { roughness: 0.75, sheen: 0.2 }), g).position.y = L + 0.1;
  mesh(new THREE.CylinderGeometry(0.002, 0.011, 0.04, 12), gloss(0x2a2833, 0.35), g).position.y = L + 0.22;
  mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.05, 0.13, 24), metal(0xe9e3ee, 0.22), g).position.y = -0.065;
  [-0.025, -0.105].forEach((y) => { const ring = mesh(new THREE.TorusGeometry(r * 1.05, 0.006, 6, 24), metal(0xd8d0e0, 0.2), g); ring.rotation.x = Math.PI / 2; ring.position.y = y; });
  mesh(puck(r * 0.98, 0.12, 0.03, 24), clay(0xff9ab8, { roughness: 0.6 }), g).position.y = -0.17; return g; };
PROP.headphones = (cb = 0xf7c3d6, cc = 0xff8fb1, flat = false) => { const g = new THREE.Group();
  const arc = (r, a0, a1) => { const pts = []; for (let i = 0; i <= 48; i++) { const a = a0 + (a1 - a0) * (i / 48); pts.push(V3(Math.cos(a) * r, Math.sin(a) * r * 1.1, 0)); } return new THREE.CatmullRomCurve3(pts); };
  mesh(new THREE.TubeGeometry(arc(0.86, Math.PI * 0.08, Math.PI * 0.92), 96, 0.055, 20), clay(cb, { roughness: 0.35, clearcoat: 0.7 }), g).scale.z = 2.4;
  mesh(new THREE.TubeGeometry(arc(0.8, Math.PI * 0.3, Math.PI * 0.7), 48, 0.05, 16), clay(0xfbe7ef, { roughness: 0.8, sheen: 1 }), g).scale.z = 2.0;
  [-1, 1].forEach((s) => { mesh(RB(0.07, 0.34, 0.14, 0.03), metal(0xeee6f4, 0.22), g).position.set(s * 0.84, 0.16, 0);
    const side = new THREE.Group(); g.add(side); side.position.set(s * 0.86, -0.12, 0); if (flat) side.rotation.y = s * Math.PI / 2;
    const cup = mesh(puck(0.36, 0.26, 0.1), clay(cc, { roughness: 0.3, clearcoat: 0.8 }), side); cup.rotation.z = Math.PI / 2;
    const cush = mesh(new THREE.TorusGeometry(0.25, 0.09, 20, 48), clay(0xfbe3ec, { roughness: 0.85, sheen: 1 }), side); cush.rotation.y = Math.PI / 2; cush.position.x = -s * 0.15; cush.scale.z = 1;
    const logo = mesh(puck(0.15, 0.03, 0.012, 48), metal(0xffffff, 0.15), side); logo.rotation.z = Math.PI / 2; logo.position.x = s * 0.135; });
  return g; };
PROP.mug = (c = 0xffffff) => { const g = new THREE.Group(); const m = gloss(c, 0.18); m.side = THREE.DoubleSide;
  mesh(new THREE.LatheGeometry([V2(0.001, 0), V2(0.33, 0), V2(0.38, 0.03), V2(0.4, 0.1), V2(0.42, 0.88), V2(0.415, 0.925), V2(0.39, 0.925), V2(0.375, 0.88), V2(0.355, 0.12), V2(0.001, 0.1)], 72), m, g);
  const h = mesh(new THREE.TorusGeometry(0.21, 0.055, 16, 48, Math.PI * 1.1), m, g); h.rotation.z = -Math.PI * 0.55; h.position.set(0.41, 0.5, 0); h.scale.set(0.85, 1.15, 1);
  const cof = mesh(new THREE.CircleGeometry(0.37, 48), gloss(0x6b3a26, 0.08), g); cof.rotation.x = -Math.PI / 2; cof.position.y = 0.78; return g; };
PROP.clip = (c = 0xff8fb1) => { const P = []; const line = (x0, x1, y) => { const n = Math.ceil(Math.abs(x1 - x0) / 0.01); for (let i = 0; i <= n; i++) P.push(V3(lerp(x0, x1, i / n), 0, y)); };
  const arc = (cx, cy, r, a0, a1) => { for (let i = 1; i < 16; i++) { const a = lerp(a0, a1, i / 16); P.push(V3(cx + Math.cos(a) * r, 0, cy + Math.sin(a) * r)); } };
  line(0.15, -0.07, -0.015); arc(-0.07, 0.0025, 0.0175, -Math.PI / 2, -Math.PI * 1.5); line(-0.07, 0.22, 0.02); arc(0.22, -0.01, 0.03, Math.PI / 2, -Math.PI / 2); line(0.22, -0.11, -0.04); arc(-0.11, 0.0025, 0.0425, -Math.PI / 2, -Math.PI * 1.5); line(-0.11, 0.17, 0.045);
  const g = new THREE.Group(); mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(P), 500, 0.0075, 8), gloss(c, 0.2), g).position.y = 0.0075; return g; };
PROP.scissors = (c = HOT) => { const g = new THREE.Group();
  [-1, 1].forEach((s) => { const arm = new THREE.Group(); g.add(arm); arm.rotation.y = s * 0.2; arm.position.y = 0.02 + s * 0.012;
    const sh = new THREE.Shape(); sh.moveTo(0, -0.05 * s); sh.lineTo(0.95, -0.006 * s); sh.quadraticCurveTo(1.02, 0, 0.95, 0.02 * s); sh.lineTo(0, 0.05 * s); sh.closePath();
    const bl = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2 }), metal(0xeef0f6, 0.18), arm); bl.rotation.x = -Math.PI / 2;
    const hd = mesh(new THREE.TorusGeometry(0.12, 0.035, 14, 40), gloss(c, 0.25), arm); hd.rotation.x = Math.PI / 2; hd.scale.set(1.35, 1, 1); hd.position.set(-0.36, 0, s * 0.06);
    mesh(RB(0.22, 0.035, 0.06, 0.015), gloss(c, 0.25), arm).position.set(-0.14, 0, s * 0.02); });
  mesh(puck(0.035, 0.05, 0.012, 24), metal(0xd9d9e2, 0.2), g).position.y = 0.025; return g; };
PROP.clapper = () => { const g = new THREE.Group(); const W = 1.6, H = 1.15;
  mesh(RB(W, H, 0.07, 0.03), gloss(0x24212b, 0.3), g).position.y = H / 2;
  const face = ctex(640, 460, (q) => { q.strokeStyle = "rgba(255,255,255,.8)"; q.lineWidth = 4; [[0, 150, 640, 150], [0, 285, 640, 285], [0, 395, 640, 395], [320, 150, 320, 285], [213, 285, 213, 395], [426, 285, 426, 395]].forEach(([a, b, c2, d]) => { q.beginPath(); q.moveTo(a, b); q.lineTo(c2, d); q.stroke(); });
    q.fillStyle = "rgba(255,255,255,.9)"; q.font = "700 26px 'JetBrains Mono'"; q.fillText("PROD.", 20, 44); q.fillStyle = "#FF6FAF"; q.font = "800 66px 'Plus Jakarta Sans'"; q.fillText("SKILL REEL", 20, 122); q.fillStyle = "rgba(255,255,255,.9)"; q.font = "700 22px 'JetBrains Mono'"; q.fillText("SCENE", 20, 180); q.fillText("TAKE", 340, 180); q.font = "800 64px 'Plus Jakarta Sans'"; q.fillText("01", 20, 262); q.fillText("03", 340, 262);
    q.font = "700 20px 'JetBrains Mono'"; q.fillText("ROLL", 16, 312); q.fillText("DATE", 229, 312); q.fillText("FPS", 442, 312); q.font = "800 40px 'Plus Jakarta Sans'"; q.fillText("A", 16, 372); q.fillText("10.17", 229, 372); q.fillText("30", 442, 372); q.font = "700 24px 'JetBrains Mono'"; q.fillText("DIR.  MUHAMMAD", 16, 438); }); DRAW.push(face);
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.94, H * 0.9), new THREE.MeshBasicMaterial({ map: face.tx, transparent: true })); fm.position.set(0, H / 2, 0.037); g.add(fm);
  const st = stripeTex("#ffffff", "#24212b"); const sm = () => { const w = gloss(0xffffff, 0.3); return [w, w, w, w, new THREE.MeshPhysicalMaterial({ map: st, roughness: 0.3, clearcoat: 1 }), w]; };
  mesh(new THREE.BoxGeometry(W, 0.2, 0.09), sm(), g).position.y = H + 0.1;
  const hinge = new THREE.Group(); g.add(hinge); hinge.position.set(-W / 2, H + 0.2, 0); mesh(new THREE.BoxGeometry(W, 0.2, 0.09), sm(), hinge).position.set(W / 2, 0.1, 0);
  const pin = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.13, 24), metal(0xdcdce4, 0.2), hinge); pin.rotation.x = Math.PI / 2; pin.position.set(0.06, 0, 0);
  g.userData.arm = hinge; return g; };
PROP.reel = (c = 0xdcd4ec) => { const g = new THREE.Group(); const sh = new THREE.Shape(); sh.absarc(0, 0, 0.62, 0, Math.PI * 2, false);
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3, h = new THREE.Path(); h.absarc(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0.145, 0, Math.PI * 2, true); sh.holes.push(h); }
  const hc = new THREE.Path(); hc.absarc(0, 0, 0.05, 0, Math.PI * 2, true); sh.holes.push(hc);
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 48 }); geo.translate(0, 0, -0.015);
  [-0.12, 0.12].forEach((z) => (mesh(geo, metal(c, 0.26), g).position.z = z));
  const film = mesh(new THREE.CylinderGeometry(0.47, 0.47, 0.2, 72), gloss(0x2a2230, 0.16), g); film.rotation.x = Math.PI / 2;
  const hub = mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.3, 32), metal(0xf1edf6, 0.2), g); hub.rotation.x = Math.PI / 2; return g; };
PROP.camera = (c = 0xb9a6ff) => { const g = new THREE.Group(); mesh(RB(1.2, 0.85, 0.8, 0.12), clay(c, { roughness: 0.32, clearcoat: 0.7 }), g);
  const lens = new THREE.Group(); g.add(lens); lens.position.set(0.08, -0.02, 0.4); lens.rotation.x = Math.PI / 2;
  [[0.3, 0.12, 0.06, metal(0xeee8f3, 0.25)], [0.27, 0.26, 0.25, gloss(0x2a2833, 0.45)], [0.31, 0.1, 0.43, metal(0xeee8f3, 0.25)], [0.33, 0.14, 0.55, gloss(0x2a2833, 0.4)]].forEach(([r, h, y, m]) => (mesh(new THREE.CylinderGeometry(r, r, h, 48), m, lens).position.y = y));
  mesh(new THREE.SphereGeometry(0.27, 48, 16, 0, Math.PI * 2, 0, 0.45), new THREE.MeshPhysicalMaterial({ color: 0x1a1030, roughness: 0.04, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.6, metalness: 0.3 }), lens).position.y = 0.38;
  mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.35, 0.4, 0), V3(-0.35, 0.62, 0), V3(0.35, 0.62, 0), V3(0.35, 0.4, 0)], false, "catmullrom", 0.1), 40, 0.045, 12), gloss(0x2a2833, 0.4), g);
  const vf = mesh(new THREE.CylinderGeometry(0.09, 0.11, 0.35, 32), gloss(0x2a2833, 0.4), g); vf.rotation.x = Math.PI / 2; vf.position.set(-0.4, 0.28, -0.52);
  mesh(new THREE.SphereGeometry(0.04, 16, 8), new THREE.MeshBasicMaterial({ color: 0xff3b6b }), g).position.set(-0.45, 0.3, 0.41); return g; };
PROP.mic = (c = HOT) => { const g = new THREE.Group();
  mesh(new THREE.CapsuleGeometry(0.27, 0.42, 16, 48), new THREE.MeshPhysicalMaterial({ color: 0xeeeaf4, metalness: 0.9, roughness: 0.3, alphaMap: meshAlpha(12, 8), alphaTest: 0.5, side: THREE.DoubleSide }), g).position.y = 0.55;
  mesh(new THREE.CapsuleGeometry(0.235, 0.4, 12, 32), clay(0x3a3346, { roughness: 0.9 }), g).position.y = 0.55;
  const band = mesh(new THREE.TorusGeometry(0.275, 0.03, 12, 64), metal(0xffffff, 0.15), g); band.rotation.x = Math.PI / 2; band.position.y = 0.55;
  mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.85, 48), gloss(c, 0.22), g).position.y = -0.2;
  const col = mesh(new THREE.TorusGeometry(0.2, 0.03, 12, 48), metal(0xffffff, 0.15), g); col.rotation.x = Math.PI / 2; col.position.y = 0.22; return g; };
PROP.stickyPad = (c = 0xffd6e7, line = "ideas!") => { const g = new THREE.Group();
  const edge = ctex(64, 64, (q) => { q.fillStyle = hex(c); q.fillRect(0, 0, 64, 64); q.fillStyle = "rgba(90,40,90,.12)"; for (let y = 0; y < 64; y += 4) q.fillRect(0, y, 64, 1); }); edge.draw();
  const em = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: edge.tx, roughness: 0.8 }), tm = clay(c, { roughness: 0.8, sheen: 0.3 });
  mesh(new THREE.BoxGeometry(0.76, 0.1, 0.76), [em, em, tm, tm, em, em], g).position.y = 0.05;
  const tx = ctex(256, 256, (q) => { q.fillStyle = hex(c); q.fillRect(0, 0, 256, 256); q.fillStyle = "rgba(0,0,0,.05)"; q.fillRect(0, 0, 256, 34); q.fillStyle = "#3a1d3f"; q.font = "700 58px 'Caveat'"; q.textAlign = "center"; q.fillText(line, 128, 150); }); DRAW.push(tx);
  const top = new THREE.Mesh(curlGeo(0.76, 0.76, [0.7, -0.7], 0.3, 0.1, 20), new THREE.MeshPhysicalMaterial({ map: tx.tx, roughness: 0.75, side: THREE.DoubleSide })); top.castShadow = top.receiveShadow = true; top.rotation.x = -Math.PI / 2; top.position.y = 0.102; g.add(top); return g; };
PROP.ruler = (L = 3.0) => { const g = new THREE.Group(); mesh(RB(L, 0.03, 0.34, 0.012, 2), new THREE.MeshPhysicalMaterial({ color: 0xf2e8ff, transmission: 0.85, thickness: 0.05, roughness: 0.15, clearcoat: 1 }), g).position.y = 0.015;
  const tx = ctex(1200, 136, (q) => { q.fillStyle = "rgba(70,30,100,.75)"; for (let i = 0; i <= 300; i++) { const h = i % 10 === 0 ? 46 : i % 5 === 0 ? 32 : 20; q.fillRect(i * 4 - 1, 0, 2, h); } q.font = "600 18px 'JetBrains Mono'"; for (let i = 0; i < 30; i++) q.fillText(String(i), i * 40 + 3, 72); }); DRAW.push(tx);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(L * 0.98, 0.33), new THREE.MeshBasicMaterial({ map: tx.tx, transparent: true })); f.rotation.x = -Math.PI / 2; f.position.y = 0.032; g.add(f); return g; };
PROP.plant = () => { const g = new THREE.Group(); const pm = clay(0xf6a5c0, { roughness: 0.45, clearcoat: 0.4 }); pm.side = THREE.DoubleSide;
  mesh(new THREE.LatheGeometry([V2(0.001, 0), V2(0.3, 0), V2(0.34, 0.04), V2(0.42, 0.62), V2(0.46, 0.65), V2(0.46, 0.72), V2(0.41, 0.72), V2(0.37, 0.66), V2(0.001, 0.6)], 64), pm, g);
  const lf = new THREE.Shape(); lf.moveTo(0, 0); lf.quadraticCurveTo(0.17, 0.6, 0, 1.3); lf.quadraticCurveTo(-0.17, 0.6, 0, 0);
  const lg = new THREE.ExtrudeGeometry(lf, { depth: 0.015, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 16 });
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + hash(i) * 0.5; const l = mesh(lg, clay(i % 2 ? 0x7fcfa8 : 0x5fb98f, { roughness: 0.4, clearcoat: 0.6 }), g); l.position.set(Math.cos(a) * 0.1, 0.6, Math.sin(a) * 0.1); l.rotation.set(0, -a, -(0.12 + hash(i + 4) * 0.25)); l.scale.setScalar(0.6 + hash(i + 7) * 0.5); }
  return g; };
PROP.marker = (parent, c1, c2, L = 2.0, r = 0.16) => { const g = new THREE.Group(); parent.add(g); const tx = ctex(64, 512, (gg) => { const gr = gg.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, hex(c1)); gr.addColorStop(1, hex(c2)); gg.fillStyle = gr; gg.fillRect(0, 0, 64, 512); }); tx.draw();
  mesh(new THREE.CylinderGeometry(r, r, L, 48), new THREE.MeshPhysicalMaterial({ map: tx.tx, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05 }), g).position.y = 0.25 + L / 2;
  for (let i = 0; i < 4; i++) { const rg = mesh(new THREE.TorusGeometry(r * 1.01, 0.012, 8, 48), clay(c1, { roughness: 0.6 }), g); rg.rotation.x = Math.PI / 2; rg.position.y = 0.34 + i * 0.07; }
  mesh(new THREE.LatheGeometry([V2(0.001, -0.005), V2(0.06, 0), V2(r * 0.6, 0.06), V2(r * 0.97, 0.2), V2(r, 0.26)], 48), gloss(c1, 0.25), g);
  const nib = mesh(new THREE.CylinderGeometry(0.05, 0.022, 0.18, 24), clay(c1, { roughness: 0.85 }), g); nib.position.y = -0.07; nib.scale.z = 0.6;
  mesh(puck(r * 1.04, 0.3, 0.07, 48), gloss(c2, 0.2), g).position.y = 0.25 + L + 0.1;
  mesh(RB(0.05, 0.6, 0.05, 0.02), gloss(c2, 0.2), g).position.set(r + 0.04, 0.25 + L - 0.25, 0); return g; };

export function pencilCup(parent, x, z, sc = 1) { const cup = new THREE.Group(); parent.add(cup); cup.position.set(x, 0, z); cup.scale.setScalar(sc);
  const meshTx = ctex(256, 256, (g) => { g.clearRect(0, 0, 256, 256); g.fillStyle = "#fff"; for (let yy = 0; yy < 256; yy += 16) for (let xx = 0; xx < 256; xx += 16) { g.fillRect(xx, yy, 16, 3); g.fillRect(xx, yy, 3, 16); } }); meshTx.draw(); meshTx.tx.wrapS = meshTx.tx.wrapT = THREE.RepeatWrapping; meshTx.tx.repeat.set(6, 3);
  mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.95, 64, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xd9c7ef, metalness: 0.8, roughness: 0.35, alphaMap: meshTx.tx, transparent: true, side: THREE.DoubleSide, alphaTest: 0.5 }), cup).position.y = 0.48; mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.03, 64), metal(0xd9c7ef, 0.35), cup).position.y = 0.015;
  [HOT, SKY, YEL, 0x2fbf8f, VIOLET, CORAL, PINK, 0x8e5fd0, 0xffffff].forEach((c, i) => { const a = (i / 9) * Math.PI * 2; const p = PROP.pencil(c); cup.add(p); p.scale.setScalar(0.85); p.position.set(Math.cos(a) * 0.2, 0.25, Math.sin(a) * 0.2); p.rotation.set(Math.sin(a) * 0.28, a, -Math.cos(a) * 0.28); }); return cup; }
export const cursorGeo = (() => { const sh = new THREE.Shape(); sh.moveTo(0, 0.62); sh.lineTo(0.46, -0.5); sh.lineTo(0, -0.24); sh.lineTo(-0.46, -0.5); sh.closePath(); const g = new THREE.ExtrudeGeometry(sh, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 8, curveSegments: 8 }); g.center(); return g; })();
/* ================================ v7 (25 s -> 99.5 s): shared builders ================================ */
export function cyc(parent, color, o = {}) { // seamless studio cyclorama: floor curving into a back wall
  const W = o.w || 70, R0 = o.r || 5, F = o.f || 24, Hh = o.h || 30, zb = o.z ?? -6, L = F + (Math.PI * R0) / 2 + Hh;
  const geo = new THREE.PlaneGeometry(W, L, 1, 140); const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const s = p.getY(i) + L / 2; let y, z; if (s < F) { y = 0; z = zb + F - s; } else if (s < F + (Math.PI * R0) / 2) { const a = (s - F) / R0; y = R0 - R0 * Math.cos(a); z = zb - R0 * Math.sin(a); } else { y = R0 + (s - F - (Math.PI * R0) / 2); z = zb - R0; } p.setY(i, y); p.setZ(i, z); }
  geo.computeVertexNormals(); const m = mesh(geo, o.mat || clay(color, { sheen: 0.15, roughness: 0.62, clearcoat: 0.12 }), parent); m.castShadow = false; return m; }
export const coneTx = ctex(64, 512, (g) => { const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, "rgba(255,255,255,0)"); gr.addColorStop(0.12, "rgba(255,255,255,.55)"); gr.addColorStop(1, "rgba(255,255,255,.12)"); g.fillStyle = gr; g.fillRect(0, 0, 64, 512); }); coneTx.draw();
export const poolTx = ctex(256, 256, (g) => { const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, "rgba(255,240,250,.9)"); gr.addColorStop(0.6, "rgba(255,220,240,.35)"); gr.addColorStop(1, "rgba(255,220,240,0)"); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); }); poolTx.draw();
export function beam(parent, r, h, color = 0xffd6ee) { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 64, 1, true), new THREE.MeshBasicMaterial({ map: coneTx.tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, opacity: 0, color })); parent.add(m); const pl = new THREE.Mesh(new THREE.CircleGeometry(r * 0.85, 64), new THREE.MeshBasicMaterial({ map: poolTx.tx, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0, color })); pl.rotation.x = -Math.PI / 2; parent.add(pl); return { cone: m, pool: pl }; }
// SKILL.md document: the hero object of the second half
export const DOCTX = ctex(512, 420, (g) => { g.fillStyle = "#E84393"; g.beginPath(); g.arc(58, 58, 36, 0, 7); g.fill(); g.fillStyle = "#fff"; g.font = "800 46px 'Plus Jakarta Sans'"; g.textAlign = "center"; g.fillText("✳", 58, 74); g.textAlign = "left";
  g.fillStyle = "#1E1E24"; g.font = "800 58px 'Plus Jakarta Sans'"; g.fillText("SKILL.md", 112, 78); [430, 360, 400, 300, 410, 250].forEach((w, i) => { g.fillStyle = i < 2 ? "rgba(232,67,147,.32)" : "rgba(110,80,150,.2)"; rr(g, 26, 130 + i * 40, w, 16, 8); g.fill(); });
  g.fillStyle = "#6C5CE7"; rr(g, 26, 370, 130, 40, 20); g.fill(); g.fillStyle = "#fff"; g.font = "800 24px 'JetBrains Mono'"; g.fillText("25 KB", 46, 398); }); DRAW.push(DOCTX);
export function docIcon(parent, scale = 1) { const g = new THREE.Group(); parent.add(g); const W = 1.0, H = 1.3, c = 0.32;
  const sh = new THREE.Shape(); sh.moveTo(-W / 2, -H / 2); sh.lineTo(W / 2, -H / 2); sh.lineTo(W / 2, H / 2 - c); sh.lineTo(W / 2 - c, H / 2); sh.lineTo(-W / 2, H / 2); sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 6 }); geo.translate(0, 0, -0.04);
  mesh(geo, new THREE.MeshPhysicalMaterial({ color: 0xfff6fb, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.5, sheenColor: new THREE.Color(0xffd6ec) }), g);
  const fs = new THREE.Shape(); fs.moveTo(W / 2 - c, H / 2); fs.lineTo(W / 2 - c, H / 2 - c); fs.lineTo(W / 2, H / 2 - c); fs.closePath();
  mesh(new THREE.ExtrudeGeometry(fs, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.015, bevelSegments: 3 }), gloss(HOT, 0.2), g).position.z = 0.06;
  const f = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, H * 0.705), new THREE.MeshBasicMaterial({ map: DOCTX.tx, transparent: true, toneMapped: false })); f.position.set(-0.02, -0.12, 0.086); g.add(f);
  g.scale.setScalar(scale); return g; }
export function dirChair(parent, label = "DIRECTOR", col = HOT) { const g = new THREE.Group(); parent.add(g); const wood = clay(0xf1dccb, { roughness: 0.42, clearcoat: 0.7 }); const S0 = 1.5, D = 1.15, SH0 = 1.5, BH = 2.85;
  [-1, 1].forEach((s) => { const x = s * S0 / 2; [1, -1].forEach((k) => { const L = Math.hypot(D, SH0); const bar = mesh(RB(0.09, L, 0.09, 0.03), wood, g); bar.position.set(x, SH0 / 2, 0); bar.rotation.x = k * Math.atan2(D, SH0); });
    mesh(RB(0.09, 0.09, D + 0.1, 0.03), wood, g).position.set(x, SH0, 0); mesh(RB(0.09, 0.09, D + 0.1, 0.03), wood, g).position.set(x, 0.05, 0);
    mesh(RB(0.09, 0.66, 0.09, 0.03), wood, g).position.set(x, SH0 + 0.33, D / 2); mesh(RB(0.09, BH - SH0 + 0.1, 0.09, 0.03), wood, g).position.set(x, (SH0 + BH) / 2, -D / 2); mesh(RB(0.17, 0.08, D + 0.28, 0.04), wood, g).position.set(x, SH0 + 0.68, 0.06); });
  const sg = RB(S0, 0.06, D, 0.03, 4); { const pa = sg.attributes.position; for (let i = 0; i < pa.count; i++) pa.setY(i, pa.getY(i) - 0.07 * (1 - (pa.getX(i) / (S0 / 2)) ** 2)); sg.computeVertexNormals(); } mesh(sg, clay(col, { roughness: 0.7, sheen: 0.6 }), g).position.y = SH0 + 0.05;
  const back = mesh(RB(S0 + 0.12, 0.6, 0.05, 0.02), clay(col, { roughness: 0.7, sheen: 0.6 }), g); back.position.set(0, BH - 0.38, -D / 2 - 0.02);
  const tx = ctex(640, 200, (q) => { q.fillStyle = "#fff"; q.font = "800 92px 'Plus Jakarta Sans'"; q.textAlign = "center"; q.letterSpacing = "10px"; q.fillText(label, 320, 132); }); DRAW.push(tx);
  [1, -1].forEach((d) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(S0, 0.47), new THREE.MeshBasicMaterial({ map: tx.tx, transparent: true })); p.position.set(0, BH - 0.38, -D / 2 - 0.02 + d * 0.03); if (d < 0) p.rotation.y = Math.PI; g.add(p); });
  return g; }
export function megaphone(parent) { const mega = new THREE.Group(); parent.add(mega); const prof = []; for (let i = 0; i <= 40; i++) { const u = i / 40; prof.push(V2(0.15 + 0.5 * Math.pow(u, 2.2), u * 1.25)); } for (let i = 40; i >= 0; i--) { const u = i / 40; prof.push(V2(0.13 + 0.48 * Math.pow(u, 2.2), u * 1.22 + 0.02)); }
  const bell = mesh(new THREE.LatheGeometry(prof, 96), glass(HOT, { side: THREE.DoubleSide, roughness: 0.12 }), mega); bell.rotation.z = Math.PI / 2; bell.position.x = 0.62;
  const lip = mesh(new THREE.TorusGeometry(0.645, 0.035, 16, 96), metal(0xffffff, 0.15), mega); lip.rotation.y = Math.PI / 2; lip.position.x = -0.63;
  const body = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.42, 48), clay(0xffffff), mega); body.rotation.z = Math.PI / 2; body.position.x = 0.8; mesh(new THREE.SphereGeometry(0.16, 48, 24), clay(0xffffff), mega).position.x = 1.01;
  const grip = mesh(RB(0.15, 0.55, 0.15, 0.06), clay(VIOLET), mega); grip.position.set(0.78, -0.36, 0); grip.rotation.z = -0.12; return mega; }
export function chip(parent) { const g = new THREE.Group(); parent.add(g); const body = mesh(RB(1.3, 1.3, 0.3, 0.24, 8), glass(LILAC, { roughness: 0.18, thickness: 0.6 }), g);
  const st = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.11 : 0.4; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); } st.closePath();
  const star = mesh(new THREE.ExtrudeGeometry(st, { depth: 0.08, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 4 }), gloss(0xffffff, 0.15), g); star.position.set(0, 0.1, 0.12);
  const tx = ctex(256, 128, (q) => { q.fillStyle = "#fff"; q.font = "800 92px 'Plus Jakarta Sans'"; q.textAlign = "center"; q.fillText("AI", 128, 100); }); DRAW.push(tx);
  const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.23), new THREE.MeshBasicMaterial({ map: tx.tx, transparent: true })); lb.position.set(0, -0.4, 0.17); g.add(lb); g.userData = { body, star }; return g; }
export function topHat(parent) { const g = new THREE.Group(); parent.add(g); const m = new THREE.MeshPhysicalMaterial({ color: 0x2b2140, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.2, sheen: 1, sheenColor: new THREE.Color(0x9a7cf0), side: THREE.DoubleSide });
  mesh(new THREE.LatheGeometry([V2(0.001, 1.32), V2(0.6, 1.32), V2(0.645, 1.29), V2(0.64, 1.2), V2(0.585, 0.12), V2(0.58, 0.04)], 72), m, g);
  mesh(new THREE.LatheGeometry([V2(0.58, 0.07), V2(0.95, 0.04), V2(1.08, 0.1), V2(1.1, 0.15), V2(1.06, 0.13), V2(0.95, 0.0), V2(0.58, 0.0), V2(0.58, 0.07)], 72), m, g);
  const band = new THREE.MeshPhysicalMaterial({ color: HOT, roughness: 0.3, clearcoat: 1, side: THREE.DoubleSide }); mesh(new THREE.CylinderGeometry(0.597, 0.59, 0.22, 72, 1, true), band, g).position.y = 0.2; return g; }
export function panPot(parent) { const g = new THREE.Group(); parent.add(g); const o = gloss(HOT, 0.2); o.side = THREE.DoubleSide; const i = gloss(0x2a2236, 0.35); i.side = THREE.DoubleSide;
  mesh(new THREE.LatheGeometry([V2(0.001, 0), V2(1.0, 0), V2(1.12, 0.05), V2(1.25, 0.32), V2(1.29, 0.37)], 72), o, g); mesh(new THREE.LatheGeometry([V2(0.001, 0.035), V2(0.98, 0.035), V2(1.09, 0.08), V2(1.22, 0.34)], 72), i, g);
  const rim = mesh(new THREE.TorusGeometry(1.27, 0.03, 12, 96), metal(0xf0e8f4, 0.2), g); rim.rotation.x = Math.PI / 2; rim.position.y = 0.36;
  const h = mesh(RB(1.8, 0.13, 0.24, 0.06), clay(0xf1dccb, { roughness: 0.4, clearcoat: 0.7 }), g); h.position.set(-2.1, 0.36, 0); h.rotation.z = 0.1; mesh(RB(0.4, 0.1, 0.16, 0.04), metal(0xf0e8f4, 0.2), g).position.set(-1.3, 0.3, 0); return g; }
export function gearGeo(T0g = 12, r = 0.6, d = 0.13) { const sh = new THREE.Shape(), st = (Math.PI * 2) / T0g; for (let k = 0; k < T0g; k++) { const a = k * st; const pts = [[a, r], [a + st * 0.2, r + d], [a + st * 0.5, r + d], [a + st * 0.7, r]]; pts.forEach(([aa, rr2], j) => (k === 0 && j === 0 ? sh.moveTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2) : sh.lineTo(Math.cos(aa) * rr2, Math.sin(aa) * rr2))); } sh.closePath();
  const h = new THREE.Path(); h.absarc(0, 0, r * 0.22, 0, Math.PI * 2, true); sh.holes.push(h); for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2, w = new THREE.Path(); w.absarc(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.16, 0, Math.PI * 2, true); sh.holes.push(w); }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.025, bevelSegments: 3, curveSegments: 12 }); g.translate(0, 0, -0.08); return g; }
export function coilGeo(turns = 7, R0 = 0.34, h = 1.3, r = 0.05) { const pts = []; const n = turns * 24; for (let i = 0; i <= n; i++) { const a = (i / 24) * Math.PI * 2; pts.push(V3(Math.cos(a) * R0, (i / n) * h, Math.sin(a) * R0)); } return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n * 2, r, 12); }
export function clipboard(parent, paperTex) { const g = new THREE.Group(); parent.add(g); mesh(RB(1.3, 1.75, 0.06, 0.08), clay(0xc9a7f0, { roughness: 0.38, clearcoat: 0.6 }), g);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(1.14, 1.38), new THREE.MeshPhysicalMaterial({ map: paperTex, roughness: 0.8 })); p.position.set(0, -0.12, 0.036); p.castShadow = p.receiveShadow = true; g.add(p);
  mesh(RB(0.56, 0.22, 0.12, 0.05), metal(0xeae6ef, 0.2), g).position.set(0, 0.8, 0.06); const rg = mesh(new THREE.TorusGeometry(0.08, 0.022, 10, 32), metal(0xeae6ef, 0.2), g); rg.position.set(0, 0.95, 0.06); return g; }
export function magnifier(parent) { const g = new THREE.Group(); parent.add(g); mesh(new THREE.TorusGeometry(0.42, 0.06, 20, 64), gloss(HOT, 0.2), g);
  const lens = mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.04, 64), glass(0xffffff, { roughness: 0.02, thickness: 0.3, iridescence: 0.5 }), g); lens.rotation.x = Math.PI / 2;
  const h = mesh(RB(0.13, 0.85, 0.13, 0.06), gloss(0x2a2833, 0.35), g); h.position.set(0.55, -0.55, 0); h.rotation.z = Math.PI / 4; return g; }
export function bulb(parent) { const g = new THREE.Group(); parent.add(g); const pts = [V2(0.2, 0.18), V2(0.22, 0.3)]; for (let i = 0; i <= 28; i++) { const a = -0.75 + (i / 28) * (Math.PI / 2 + 0.75); pts.push(V2(Math.max(0.001, 0.5 * Math.cos(a)), 0.85 + 0.5 * Math.sin(a))); }
  mesh(new THREE.LatheGeometry(pts, 64), glass(0xfff4d6, { roughness: 0.04, thickness: 0.08, side: THREE.DoubleSide }), g);
  mesh(new THREE.CylinderGeometry(0.2, 0.18, 0.3, 48), metal(0xe9e3ee, 0.22), g).position.y = 0.05; [-0.02, 0.06, 0.14].forEach((y) => { const r = mesh(new THREE.TorusGeometry(0.205, 0.022, 10, 48), metal(0xe9e3ee, 0.22), g); r.rotation.x = Math.PI / 2; r.position.y = y; }); mesh(puck(0.08, 0.08, 0.03, 24), gloss(0x2a2833, 0.4), g).position.y = -0.13;
  const fm = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.45, 0.4), toneMapped: false }); const fpts = []; for (let i = 0; i <= 40; i++) { const u = i / 40; fpts.push(V3(-0.12 + u * 0.24, 0.62 + Math.sin(u * Math.PI) * 0.18 + Math.sin(u * 40) * 0.02, Math.cos(u * 40) * 0.02)); }
  const fil = mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([V3(-0.06, 0.3, 0), V3(-0.12, 0.62, 0), ...fpts, V3(0.12, 0.62, 0), V3(0.06, 0.3, 0)]), 160, 0.012, 6), fm, g);
  const gm = new THREE.MeshBasicMaterial({ color: 0xffd9a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }); const glow = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 16), gm); glow.position.y = 0.8; g.add(glow);
  g.userData = { fm, gm }; return g; }
export function swatchFan(parent) { const g = new THREE.Group(); parent.add(g); const cols = ["#E84393", "#FF8FB1", "#B595E8", "#6C5CE7", "#74B9FF", "#FFEAA7", "#FF5252"];
  const cards = cols.map((c, i) => { const tx = ctex(128, 420, (q) => { q.fillStyle = "#fbf8fc"; q.fillRect(0, 0, 128, 420); q.fillStyle = c; q.fillRect(8, 8, 112, 290); q.fillStyle = "#3a2a4a"; q.font = "700 18px 'JetBrains Mono'"; q.fillText(c, 10, 330); q.font = "500 14px 'JetBrains Mono'"; q.fillText("TASTE " + (i + 1), 10, 356); }); DRAW.push(tx);
    const card = new THREE.Group(); g.add(card); mesh(RB(0.42, 1.4, 0.02, 0.03, 2), clay(0xfbf8fc), card).position.y = 0.7; const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.36), new THREE.MeshPhysicalMaterial({ map: tx.tx, roughness: 0.5 })); f.position.set(0, 0.7, 0.012); card.add(f); card.position.z = i * 0.03; return card; });
  const pin = mesh(puck(0.07, 0.3, 0.02, 24), metal(0xeae6ef, 0.2), g); pin.rotation.x = Math.PI / 2; pin.position.set(0, 0.12, 0.1); g.userData.cards = cards; return g; }
export const diamondGeo = new THREE.OctahedronGeometry(0.28, 0); diamondGeo.scale(1, 1.25, 1);
export function diamond(parent, c = HOT) { return mesh(diamondGeo, gloss(c, 0.15), parent); }
export function playBtn(parent) { const g = new THREE.Group(); parent.add(g); const d = mesh(puck(0.42, 0.16, 0.07), glass(HOT, { roughness: 0.15 }), g); d.rotation.x = Math.PI / 2;
  const t = new THREE.Shape(); t.moveTo(-0.11, 0.17); t.lineTo(0.19, 0); t.lineTo(-0.11, -0.17); t.closePath(); mesh(new THREE.ExtrudeGeometry(t, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 3 }), gloss(0xffffff, 0.15), g).position.z = 0.06; return g; }
export function frameCard(parent, imgMat) { const g = new THREE.Group(); parent.add(g); const bm = clay(0xffffff, { roughness: 0.4, clearcoat: 0.6 }); mesh(RB(2.0, 1.15, 0.05, 0.04), bm, g); const p = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.07), imgMat); p.position.z = 0.03; g.add(p); g.userData.bm = bm; return g; }
export function makePhone(parent, tex) { /* set ENV.map = scene.environment first */ const outer = new THREE.Group(); parent.add(outer); const ph = new THREE.Group(); outer.add(ph); ph.rotation.x = Math.PI / 2;
  mesh(RB(0.72, 0.078, 1.47, 0.11, 8), new THREE.MeshPhysicalMaterial({ color: 0xf7a9bd, metalness: 0.7, roughness: 0.26, clearcoat: 0.8, envMap: ENV.map, envMapIntensity: 1.8 }), ph); mesh(RB(0.70, 0.01, 1.45, 0.105, 6), gloss(0x0b0b10, 0.05), ph).position.y = 0.04;
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.665, 1.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false })); s.rotation.x = -Math.PI / 2; s.position.y = 0.046; ph.add(s); return outer; }
export function noteMesh(parent, txt, c = 0xffeaa7, size = 0.9) { const tx = ctex(300, 300, (q) => { q.fillStyle = hex(c); q.fillRect(0, 0, 300, 300); q.fillStyle = "rgba(0,0,0,.05)"; q.fillRect(0, 0, 300, 44); q.fillStyle = "#3a1d3f"; q.font = "700 56px 'Caveat'"; q.textAlign = "center"; const ws = txt.split(" / "); ws.forEach((w, i) => q.fillText(w, 150, 140 + i * 62 - (ws.length - 1) * 28)); }); DRAW.push(tx);
  const m = new THREE.Mesh(curlGeo(size, size, [0.25, -1], size * 0.18, size * 0.22, 14), new THREE.MeshPhysicalMaterial({ map: tx.tx, roughness: 0.72, sheen: 0.3, side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; parent.add(m); return m; }
export function confettiSet(parent, n = 46) { const L = []; for (let i = 0; i < n; i++) { const m = mesh(new THREE.PlaneGeometry(0.12, 0.2), new THREE.MeshPhysicalMaterial({ color: [HOT, YEL, SKY, VIOLET, 0xff8fb1, 0xffffff][i % 6], side: THREE.DoubleSide, roughness: 0.5 }), parent); m.visible = false; L.push(m); } return L; }
export function confetti(L, t0, tt, o, spread = 1) { L.forEach((m, i) => { const u = tt - t0 - hash(i) * 0.08; m.visible = u > 0 && u < 3.5; if (!m.visible) return; const a = hash(i + 1) * Math.PI * 2, v = 3 + hash(i + 2) * 4; m.position.set(o.x + Math.cos(a) * v * 0.5 * u * spread, Math.max(0.02, o.y + v * u - 4.5 * u * u), o.z + Math.sin(a) * v * 0.35 * u + u * 0.8); m.rotation.set(u * 9 * hash(i + 3), u * 7, u * 5 * hash(i + 4)); }); }
export function ringsSet(parent, n = 3, c = 0xff9ad0) { return Array.from({ length: n }, () => { const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.025, 12, 96), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0, toneMapped: false })); parent.add(m); return m; }); }
export function ringPulse(L, t0, tt, pos, max = 3) { L.forEach((m, i) => { const u = tt - t0 - i * 0.15; m.visible = u > 0 && u < 1.1; if (!m.visible) return; m.position.copy(pos); m.scale.setScalar(0.3 + EASE.exit(clamp(u / 1.1)) * max); m.material.opacity = 0.85 * (1 - u / 1.1); }); }
export const camAt = (p, l, fov = 32, ap = 0.003, roll = 0) => ({ p, l, fov, focus: p.distanceTo(l), ap, roll });
