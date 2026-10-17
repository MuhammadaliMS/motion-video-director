# Data, chart and graph libraries for motion video

All of these are built for interactive web apps, not video. Their animations run on
wall-clock time and their layouts often use physics simulations. In a video they must be
**driven by `t`** or the render will stutter and differ between runs.

**Tested** = a working example in `starter/examples/` passes `render.mjs --check` and its stills
were reviewed. **Untested** = notes from the library's docs; prove them with `--check` before use.

General recipe:
1. Turn off the library's own animation (`animation: false`, `animate: false`, `duration: 0`).
2. Compute every value you animate (bar heights, node positions, path progress) from `t`
   with springs or easing from `lib/motion.js`.
3. Redraw synchronously on every `render(t)`, and return nothing from `render`.
4. For force or physics layouts, run the simulation **once in setup** with a fixed tick count,
   save the positions, then animate from those saved positions.
5. Compute cameras from the saved layout, never from a library's live bounding box.

| Library | Status | Best for in video | How to make it video-safe |
|---|---|---|---|
| **d3** | Tested (`d3-chart.html`) | Custom SVG data motion: bar builds, line draw-ons, axis builds, layouts | Scales and shapes as pure functions of `t`. Line draw-on with `stroke-dashoffset`. Never `d3.transition()`. `d3-force` is deterministic with a fixed tick count. |
| **Chart.js** | Tested (`chartjs-chart.html`) | Quick, clean bar, line and donut charts | `animation: false`, `events: []`, set `chart.data` from `t`, then `chart.update("none")`. |
| **ECharts** | Tested (`echarts-dashboard.html`) | Dashboard looks: gauges, donuts, area charts, maps | `animation: false`, `setOption` from `t`, then `chart.getZr().refreshImmediately()`. |
| **Cytoscape** | Tested (`cytoscape-network.html`) | Graph maths: reveal order (BFS), shortest paths, degrees | Use it **headless** for the maths and draw with SVG (d3). Its own canvas renderer failed `--check`: it caches and redraws lazily, so the same `t` gave different pixels. |
| **3d-force-graph** | Tested (`force-graph-3d.html`) | Glowing 3D networks with camera orbits | Seeded fixed positions, `pauseAnimation()`, `linkWidth(0)` so links are plain lines you can move, camera from `t`, then `G.renderer().render(G.scene(), G.camera())`. Set `preserveDrawingBuffer: true`. |
| **GSAP** | Tested (`gsap-morph.html`) | DOM/SVG sequencing, shape morphs, kinetic type | One paused timeline, `render = (t) => { tl.seek(t, false); }`. `spring()` from the kit works as a GSAP ease. |
| **anime.js** v4 | Untested | Lightweight sequencing, SVG path morphs | `createTimeline({ autoplay: false })`, then `.seek(t * 1000)` in `render`. |
| **nivo** | Untested | Polished React charts: bump, chord, sankey | Use inside Remotion with `animate={false}` and props computed from `useCurrentFrame()`. |
| **React Flow (xyflow)** | Untested | Product-flow and pipeline diagrams | Inside Remotion: static node positions, styles and edge dash offset from the frame. No CSS animations. |
| **Plotly.js** | Untested | 3D surfaces, scientific plots, waveforms | Compute the data for `t` and call `Plotly.react`. Avoid `Plotly.animate`. Slow per frame. |
| **G6 (AntV)** | Untested | Large network and topology graphs | Disable animation, precompute the layout. Expect the same lazy-render risk as Cytoscape; fall back to SVG drawing if `--check` fails. |
| **Mermaid** | n/a | Planning only: storyboard and state diagrams for approval | Rarely good-looking enough on screen without restyling. |

Picking quickly:
- A few numbers that must look designed → **d3**.
- A real dashboard look → **ECharts** (or **nivo** in Remotion).
- Product or process flow → **d3 / SVG** with a fixed layout (or React Flow in Remotion).
- Network or "everything connected" story → **Cytoscape (maths) + SVG** in 2D, **3d-force-graph** in 3D.
- Morphing UI and type → **GSAP**.
- Maths or equations → **Manim** (route B), not a chart library.
