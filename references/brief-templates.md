# Brief, storyboard and critique templates

Copy these into the project (e.g. `sources/brief.md`, `storyboard.xml`) and fill them in.

## 1. Brief

```md
# Brief: <name>
Goal: <what the video must achieve, where it will be posted>
Audience: <who watches>
Core idea (one sentence): <...>
Length / fps / formats: 15s / 60fps / 16:9 master + 9:16 cut
Visual source of truth: <screenshots, URL, Figma, brand kit paths>
Tokens: bg #..., surface #..., accent #..., text #..., radius ..px, font ..., type scale ...
Tempo: 120 BPM (beat = 0.5s = 30 frames @60fps)
Audio: <music file / synthesized SFX / voiceover / silent>
Must avoid: centred giant headline with shadow, dated gradients, same fade everywhere, logo fade to black
Done when: MP4 on disk, duration checked, checkpoints score ≥ 8/10, both formats exported
```

## 2. Storyboard as a state spec (not prose)

```xml
<video fps="60" w="1920" h="1080" bpm="120" duration="15">
  <beat id="1" start="0" end="3" headline="Scattered data">
    <el id="card-ads"    from="x:-400 y:300 o:0" to="x:420 y:300 o:1" spring="card" at="0.5"/>
    <el id="card-social" from="x:-400 y:540 o:0" to="x:420 y:540 o:1" spring="card" at="1.0"/>
    <sfx type="swoosh" at="0.5"/>
  </beat>
  <beat id="2" start="3" end="7">
    <el id="cursor" path="..." at="3.0"/>
    <sfx type="click" at="4.0"/>
  </beat>
  <!-- beats 3 and 4 ... -->
</video>
```
Every cue time should sit on the beat grid (multiples of 0.5s at 120 BPM).

## 3. Shape-morph piece

```md
One element morphs through these states, one per beat or two:
1. pill button "Get started" (w 220, h 56, r 28, accent)
2. loader ring (w 56, h 56, r 28, spinning arc)
3. music player card (w 360, h 120, r 20, cover + controls)
4. search bar (w 640, h 64, r 32, placeholder text)
... 8–12 states total, ending on the CTA state
Rules: spring between neighbours, content fades out before the shape moves and fades in after it settles.
```

## 4. Frame critique prompt (for the review loop)

```
These are checkpoint frames at <times>. For each frame:
1. Contrast: is any text low-contrast (e.g. white on a light panel), clipped, or overlapping?
2. Settling: had every element finished moving before the next headline or beat appeared?
3. Brand: do colours, radii and type match the tokens in the brief?
4. Tells: any giant centred shadowed headline, dated gradient, uniform fades, logo fade to black?
Score polish 1–10. If below 8, name the two worst defects and give the smallest code change
that fixes each. Then re-render and re-check.
```

## 5. Directed motion prompt (fill every line before you send it)

Each line removes one decision the model would otherwise make for you, and the model's own
decisions are the default look. A vague 27-word prompt for earbuds came back as navy space, a glow
ring, bloom, particles, spinning buds and an invented tagline; the 448-word directed version of
the same subject, with 15 follow-ups, came back as a studio product film.

```
GOAL:   what the viewer should feel or do, in one sentence
OUTPUT: one self-contained HTML file (or Remotion / HyperFrames), W x H, library pinned to a version
TIME:   seconds x fps = total frames. Loop: yes or no. BPM and frames per beat
MODEL:  (3D only) units, dimensions, bevels, what sits flush with what
LOOK:   palette in hex, ONE accent, typeface + weight + size + tracking, materials with numbers
        (roughness, clearcoat), lights with colour + intensity + position
MOTION: easing as cubic-bezier, springs as damping ratio and Hz, durations in frames
SHOTS:  frame ranges, one hero move per shot, how each shot hands off (cut / match cut / wipe)
CAMERA: field of view, never parked, orbit degrees, push-in curve and time
BANNED: the defaults you never want to see, by name (see below)
QA:     stills at named frames, a contact sheet, fix, then the full render
```

Starter BANNED list: purple or blue gradients, glow orbs, bloom, neon, lens flares, decorative
floating particles, everything fading in at once, fade-and-slide-up on every element, centred
everything, generic spinning turntables, dark backgrounds (unless chosen), text that moves while
it is being read. A general "avoid a generic AI look" mostly swaps one default for another: name
exact patterns, look at which defaults the first render used anyway, and extend the list.

Specificity that paid off: name the library version and its traps (three.js r160 `TextGeometry`
reads `height`, a `depth` parameter is overwritten with 50, so pin the version and name the right
parameter); give hex values and light positions; give exact frames for every hit.

## 6. Render contract (paste under any motion prompt)

```
Output one self-contained HTML file. Only the libraries the prompt names, pinned to a version.
No network requests except fonts and those pinned libraries.
Every frame must be a pure function of time t, in seconds.
If JavaScript drives any motion, expose window.renderAt(t) that draws exactly that frame.
With ?t=<seconds> in the URL, draw that one frame and never start requestAnimationFrame;
set window.__ready after fonts and any bake.
Animate with CSS keyframes, the Web Animations API, SVG, Canvas 2D or WebGL.
No Date.now, no setTimeout or setInterval starts, no unseeded Math.random.
Loops: render frames 0 to N-1 only, and frame N-1 must flow into frame 0.
```
The starter's `Motion.stage()` already provides `renderAt`, `?t=` / `?f=` freezing and `__ready`.
When a fix works, **add it to the contract and the project's house rules**: every line is a failure
you never have to see again.

## 7. Follow-ups that work (point at frames, not feelings; one or two per round)

```
Render stills at frames 0, 24, 48, 72 and 96. Describe each in one sentence as a viewer would.
Does that match the shot list? Fix what does not.

Make a contact sheet of every 12th frame. Mark every frame where two things move at once, then
fix the hierarchy.

Onion-skin frames 24 to 47 at 25% opacity. Spacing should tighten near the keys. Adjust the
easing until it does.

Plot the hero's x position and scale per frame as a PNG chart. Show me where the motion is linear
or stops dead, then fix it with our tokens.

Review this like a senior motion designer: 10 notes ordered by impact, each with a frame number
and the exact code change. Apply the top 5.

It is too busy. Remove 30% of the motion and keep only the moves that guide the eye.

The ending is abrupt. Add a 36-frame hold with a 2% push, then let it settle on a spring at
damping ratio 0.8.

The fix at frame 84 did not hold. Render frames 83 and 85 as PNGs, put them side by side and list
every difference you can see. Find the line of code that causes it, fix only that line, then
render both frames again.
```
Pasting all of them at once turns a fix into a rewrite. Quick frame pair:
`node render.mjs scene.html --frames 83,85` (writes both PNGs and a side-by-side `_pair.png`);
contact sheet: `node render.mjs scene.html --contact`.

## 8. Failure to fix table

| Symptom | Fix to paste |
|---|---|
| Flicker or jitter | Make every value a pure function of t. Replace Math.random with a seeded generator. Remove timers and CSS transitions. |
| Wrong or fallback font | Load the font with `display=block` and wait for `document.fonts.ready` before the first frame. |
| Hiccup at the loop seam | Render frames 0 to N-1 only. Drive the loop from phase = frame / N with whole cycles. |
| Audio drifts off the beat | Compute each beat as n x 60 / BPM and round per beat. Never add a rounded frame count. |
| Jank or dropped frames (live preview) | Animate only transform and opacity. No width, height, top or left. |
| Banding in the GIF | No gradients. Flat colours only, or dither the palette. |
| Blurry or shimmering text | Snap resting text to whole pixels. Render at 2x and scale down. |
| Text moves before you can read it | Hold every text state 0.3 s per word plus 0.5 s before it moves. |
| Everything moves at once | One hero move at a time. Others start 150 ms later at 60% of its travel. |
| Chrome / glass reads as white plastic or flat charcoal | Environment is the material: dark studio, a few softboxes, a thin horizon strip, flags. Specify the light panels in degrees and intensities. |
| A glint or flare erases detail | Make the highlight strip narrow (about 0.6 degrees) and lower its intensity, then check pixels with strip on vs off. |
| A bump or pop appears on one frame | Fade shapes in from a negative radius so smooth-min pull grows in; render the frames either side. |

## 9. Production brief (a document, not a vibe)

A vibe prompt ("an insane product video") leaves every decision open, and the model fills each blank with the
safest default (the centred gradient title). The viral "one prompt" films started from briefs of 9,500+
characters. Before any render task, write this and save it as `brief.md`:

```
FILM     one sentence the viewer keeps, audience, duration, formats
ASSETS   real logo, real UI screenshots, brand type and colours, audio (and the product URL to collect them from)
VISUAL   what to keep from the reference, which cliches to avoid
HARD LINE never invent product screens or metrics; if an asset is missing, stop and ask
DELIVER  storyboard, contact sheet, final video, poster frame, source
```
The famous one-liner ("make a 15-second showreel that proves what an incredible motion designer you are") is
fine once to test the rig: "showreel" is a genre with known rules and there is no product to get wrong. Sent by
hundreds of people it produced reels that rhyme with each other ("brief contagion"). With something to sell,
three extra lines (the product URL, a demand for real screenshots, logo and assets, "must have music") let the
agent collect the assets itself. Keys live in `.env`, referred to by name.

CLAUDE.md house rules that paid off:
```
## Render contract
- window.seek(t) paints frame t, nothing else drives the picture
- no CSS transitions, setTimeout or requestAnimationFrame in render mode
- seeded noise only, never Math.random
## Look
- banned: centered title on gradient, everything fading in, corner labels, glow on UI
- one display face, one UI face, one accent
- something new on screen every 2 to 4 seconds
## Sound
- score and SFX synthesized in code unless a track is supplied, -14 LUFS
## Before you show me anything
- render one frame per beat as a contact sheet, score it, fix the worst 3
```

## 10. Reference to style guide (borrow the grammar, never the subjects)

With no visual grammar supplied the model brings its own, and unrelated reels look like siblings. A named style
works better than a described one; a frame or clip hands over pacing, type and transitions in one go. Three
kinds of reference: one frame of a video you love, a short clip the agent slices with ffmpeg, or a folder of
your own past work (a library nobody else can copy).

```
Reference: ./refs/launch.mp4
1. Extract a frame every 0.5s with ffmpeg and study them
2. Write docs/style_guide.md: palette in hex, type, shot lengths, transitions, camera, grain
3. Write docs/shotlist.md for a [DURATION]s video about [SUBJECT] in that style
4. Take the grammar, never the subjects, logos or copy
5. Show me both files and wait for my OK before any code
```
Spell out the look and the limits and let the model pick the technique and library.

## 11. State-list storyboard and the one-container morph

```
00-02s HOOK    one image that earns attention
02-05s PROBLEM the friction, shown on screen
05-09s REVEAL  the product enters through a real interaction
09-13s PROOF   one screen or number backs the claim
13-16s CLOSE   a clean final state and a readable CTA
```
Each beat needs an entry state, an exit state and a reason to be there. The most-bookmarked structure of launch
week was an XML spec in which a single container morphs size, radius and colour from state to state, a cursor
drives every change with real clicks, and the final frame matches the first so the clip loops:
`logo > CTA button > email field (typed) > loader > success check > dashboard > chart draws itself > tooltip > command palette > toast > logo`.
A fake UI works like a film set where every element has a known state (stage the whole film inside a mock
editor with a timeline, waveform and export button, for example).

## 12. Critic task with teeth

```
Judge only the rendered frames, ignore what you meant to make.
Score 1-10: hook in 2s, phone readability, motion, variety, sound sync, brand accuracy.
List the 3 worst defects with timestamp, evidence and a local fix.
Patch those seconds, re-render them, repeat until every score is 8+.
```
Evidence to hand it (all from `starter/render.mjs`): `--sheet` (2 frames per second, 6 across), `--strip <frame>`
(12 consecutive frames around the fastest move), `--stills ... --phone` (360 px wide), `--loopcheck`, `--check`
(determinism). Hunt for: overlapping text, elements sliding where they should ease, corner labels, blurry scaled
type, a dead beat, a stutter at the loop point.
