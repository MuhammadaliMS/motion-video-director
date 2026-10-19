# motion-video-director

A Claude Code skill that directs motion videos made as code: product reels, UI demos, launch films,
narrated explainers, kinetic type, animated charts, and premium three.js films. It plans the brief, picks the
tool, enforces deterministic `render(t)` frames, spring motion and beat-synced sound, and runs a frame-by-frame
critique loop until the piece passes.

## Install

```bash
git clone https://github.com/MuhammadaliMS/motion-video-director ~/.claude/skills/motion-video-director
```
Then ask Claude Code for a video, or type `/motion-video-director`.

## What's inside

- `SKILL.md`: the director's steps and the house rules.
- `references/`: motion numbers, sound, export, narrated ads, UI motion, and `3d-fidelity.md` (how to make a
  three.js film look designed: real proportions, modelled props, light, per-set colour grade, 2D inserts,
  readable type).
- `tools/cinetic/`: the technique draw from [cinetic](https://github.com/Leonxlnx/cinetic) (MIT): `python3 tools/cinetic/pick.py --format launch --seconds 25` draws a film's moves from 273 measured techniques.
- `starter/`: a tested kit that renders any time-driven web page to MP4 with Playwright and ffmpeg, with
  examples for d3, Chart.js, ECharts, Cytoscape, 3d-force-graph, GSAP, and a three.js studio
  (`lib/studio3d.js`, about 30 real props).

```bash
cp -R ~/.claude/skills/motion-video-director/starter ./motion && cd motion && npm install
node render.mjs examples/_template.html --check
GPU=1 node render.mjs examples/three-studio.html --stills 1.5,4.1,5.6
```
