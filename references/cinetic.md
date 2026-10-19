# cinetic: concept-first launch films, a technique draw, and measured craft

Source: [cinetic](https://github.com/Leonxlnx/cinetic) by Leonxlnx (MIT, release 1.0.0-beta, commit ecfa660),
an agent skill that directs short films in Remotion or HyperFrames. This file distils what it adds to this
skill. Its technique draw is vendored in `tools/cinetic/` (`pick.py`, the 273-entry `library/techniques.json`,
and its licence).

## When to hand off to cinetic

Install it next to this skill and let it own the build when the job is one of its formats and you can use its
house look:

```bash
npx skills add Leonxlnx/cinetic        # needs Node 22+, ffmpeg 6+, Python 3.11+ (numpy, scipy, soundfile,
                                       # pyloudnorm, opencv-python, librosa), headless Chromium; earshot optional
```

| Format | Length | Its deliverables |
|---|---|---|
| Launch film / teaser | 20–45 s, 60 fps | 16:9 master, 9:16 and 1:1 re-layouts, poster, brand kit if invented |
| Product / feature video | 8–30 s | master, poster |
| Feature loop | 4–15 s, whole bars | MP4, WebM, GIF at 25 fps, checked seam |
| Logo sting | 3–8 s | MP4, ProRes 4444 alpha (held and cleared), poster |
| UI walkthrough | 20–90 s | master, SRT captions |

Its pipeline: `BRIEF.md` (spec line and hard bans) → `TREATMENT.md` (three concepts, one story device, the
technique draw, a beat sheet) → brand from three personality words (`palette.py`, a mark sheet of 6–10
directions) → `timeline.ts` (one beat grid that drives picture, sound and QA; `grid-check.ts`) → acts →
`export-cues.ts` → earshot sound kit and `score.py` → `render.sh --blur` (true motion blur by float
accumulation) → `probe.py`, `check-sync.py`, `forensics.py`, `av-audit.py` → critic lenses → ship gate →
`deliver.sh`.

**Stay on this skill's route** when the film follows a supplied visual reference or a brand whose look cinetic
bans by default (purple and violet, cream, glassmorphism, serif or italic type, confetti, lens flares,
particles, bloom). The SaaSWAVE-style reel in `3d-fidelity.md` is that case. cinetic lets a supplied brand win
(`--brand-supplied`, `// cinetic:brand-supplied` markers), but its critics and lints work against you the whole
way. Also stay here for three.js films, which cinetic limits (`camera.md`, "3D limits").

## The technique draw (vendored)

An agent left to choose picks the same fade-up, push-in and end card every time. Draw the plan instead:

```bash
python3 tools/cinetic/pick.py --format launch --energy calm --seconds 25 --json out/picks.json
python3 tools/cinetic/pick.py --category transition --n 3 --format launch
python3 tools/cinetic/pick.py --show tr-velocity-handoff-cut     # one entry in full
python3 tools/cinetic/pick.py --list --category camera
```
- Formats: `launch, feature, loop, sting, walkthrough, vertical`. Energy: `calm` (default), `medium`, `high`.
  It draws about one technique per 3.5 s (calm) or 2.5 s, weighted by role (workhorse, accent, signature),
  evidence and energy fit, in the order the format needs. The seed is printed; write it in the treatment.
- Categories (273 entries): opening hook, transition, camera, typography motion, UI choreography, data and
  numbers, product demo, logo and end card, colour and light, texture and finish, layout and composition,
  pacing and structure, micro-interaction, depth and 3D.
- Build the picks the concept can carry, retold in the film's own objects. Reroll a pick that fights the concept
  at most twice (`--category <cat> --exclude <id>`) or drop it with a written reason; never add a move the draw
  did not give you. Use `--avoid previous.json` so a series doesn't repeat itself.
- Recipes cite cinetic's Remotion starter (`timeline.ts`, `E.out`, `lmix`). Translate them: `E.*` curves are the
  beziers below, `b(bar, beat)` is a beat-grid frame, `lmix` is log-space interpolation.

## Concept before code

- Write three concepts through different lenses: (a) the product's own verb or metaphor made literal, (b) the
  viewer's pain made visible, (c) a formal device (a relay object, a bookend, one unbroken camera move, a
  container that becomes the product). Throw out any concept whose props could appear in another product's film.
- **One story device:** an object, shape or colour that travels through every shot, never blinks out at a cut,
  and ideally resolves into the mark. A bare dot, line or block is the lazy default.
- **Tests:** deletion (remove the demo beats and the value still reads; remove the value beats and if it still
  works it was a feature tour), specificity (would the film be equally true of a simpler product?), feature word
  (muted, would a stranger use the brief's word for the feature?). Logline ≤ 15 words.

## Copy as fragments (measured on eight professional films)

- A beat shows about 2 new words; fragments are 1–4 words (2–3 best, about 22 characters), cut at grammar: after
  the subject, before the object, before the payoff noun or the name. A thought over 4 words is a chain of 2–4
  fragments with 30–90 f (60 fps) of picture between them, never one block.
- Build chain: fragments append to one held line (up to 8 words), the newest in the accent relaxing to ink.
  Replace chain: each fragment leaves whole over 24 f before the next rises (up to 5 words on screen).
- The animation is the verb: 2–4 words before the demo, 1–3 after it, never describing what the picture shows.
  The cliffhanger cut ends a fragment one step short of its payoff and lets the picture deliver it within 90 f.
- Copy on at most about 65% of the frames, with at least 1.5 s of pure picture in every 10 s. Holds are alive:
  hold max(60, 42 + 8 f per word) at 60 fps while the line drifts 0.3–1 px/f or creeps 1–3%.
- Emphasis by colour, never bounce: no overshoot or per-letter trick on copy, except the one hero word.
- A narrated film already has its words in the voice: let the type show 1–4 word fragments of what is said, not
  whole sentences, and let some lines be voice only.

## Pace profiles (60 fps)

| Knob | Calm (default) | Crisp (when the brief asks for energy) |
|---|---|---|
| Word entry, stagger | 36 f ease-out-soft, 11 f | 26 f ease-out, 6 f |
| Exit | whole fragment, 24 f | per word, 16 f |
| Reading hold | max(60, 42 + 8 f/word) | 36 + 6 f/word |
| Events per 30 s | 24–36 | 45–60 |
| Shot median, max | 100–160 f, 240 f | 60–90 f, 180 f |
| Tempo | 100 BPM (36 f beat) | 120 BPM (30 f beat) |

Pick BPM so a beat is whole frames: at 60 fps 90 → 40 f, 100 → 36, 120 → 30, 144 → 25, 150 → 24.
No stretch past 72 f (calm) or 48 f (crisp) without a visible event, except one declared hold of 60–96 f on the
key claim. The biggest visual peak lands at 75–90% of the runtime; the last third keeps moving.

## Motion and speed limits

- Named curves: out .16,1,.3,1 (arrivals); outSoft .22,1,.36,1; in .7,0,.84,0; exit .55,.055,.675,.19;
  inOut .87,0,.13,1 (whips, lockup slides); smooth .65,0,.35,1; ui .4,0,.2,1; cam .48,.1,0,.9 (camera, peak
  about 27%, long settle); glide .47,.2,.15,1; rest .45,0,.1,1; contact .55,0,.9,.55 (into an impact);
  whip .6,0,.15,1; dolly .35,0,.65,1. A film uses about three easing characters; linear only for drift.
- Springs (damping/stiffness/mass): snap 18/260/0.7, pop 11/180/0.6 (landings only), soft 26/120/1,
  heavy 30/90/1.4, calm 16/64/1 (the only spring for type). Overshoot only on a true landing, at most 2 per film.
- Duration grows with distance: 0.5 s + 1.6 ms per px (calm); camera moves 0.9–3.0 s; the slowest move at least
  3x the fastest. Interpolate scale and zoom in log space. Shape settles 6 f before position. A secondary move
  starts at 55–75% of the leading move.
- **Speed in px per frame (60 fps):** text being read ≤ 3 px/f and ≥ 0.3 px/f of drift; labelled chips under
  20 px/f; ordinary moves ≤ 25 px/f; anything over 12 px/f gets true motion blur; nothing over 60–80 px/f
  (redesign as a cut, a match cut or a mask wipe); frame-filling wipes may peak at 150–300 px/f for a few frames.
- Hits: start a picture change at cue − 1; pulses peak 2 f after their sound; a spring starts so its 50% pop lands
  on the beat. Seams: both sides at rest, or the incoming shot starts at the outgoing velocity.

## Sound placement

| Picture event | Sound sits on |
|---|---|
| Landing / impact | the contact frame (the motion must arrive with velocity) |
| Pop-in | the frame at 50% of travel |
| Tween settle | the 97% frame |
| Whoosh (camera-scale moves, about 2 per film) | onset 100–450 ms ahead, apex on the visual peak |
| A text fragment | one soft sound when it comes to rest, never one per word |
| Cut, scroll, progress bar, rolling counter | nothing; the music carries it (a counter's final lock gets one tick) |
| Lockup | a stop-down 0.2–0.7 s before, then ONE clean element on the frame the wordmark reads |

Compute sync points from the motion code, never type them (typed points landed 8–11 f off). Audio leading the
picture by more than about 45 ms reads as "sound first": move the picture. Effects-only films master at −18 LUFS,
with music −14; LRA 5–8 LU, payoff 2–3 LU above the median.

## Finishing and QA

- True motion blur as a render pass: render sub-frames, average in float, quantise once (this skill's
  `?mb=` subframe blending is the in-page version).
- Banding: compute gradients in float with ±1 LSB triangular dither and load them as PNGs; CSS gradients band at
  8 bits. Check dark frames with a x12 contrast stretch.
- BT.709 on every file: `-vf scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv`
  plus `-colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv` (ffmpeg 7.1+ needs the
  `setparams` step or the tags are lost).
- Mux audio with ffmpeg, never the engine's AAC (Remotion leaves about 2.5 f of priming); A/V lag ≤ 48 samples.
- Pixel forensics worth copying: pops (1–2 unexplained frames), stalls, ghost frames, whole-pixel judder on slow
  drifts, banding, compression smear on flat fields, a soft hook (the first 2 s moving less than half the median).
- **Ship gate:** 11 dimensions scored 1–5 (idea and device, hook, copy and type, colour and brand, composition,
  motion, transitions, pacing, product truth, sound and sync, finish); every one ≥ 3, finish and sync = 5, mean ≥
  4.2, no open P0, at most 5 rounds. Critic lenses: director, forensics, sound/sync, and art/copy/UI on round 1;
  a verifier tries to refute every P0/P1 before it is fixed. When an act stays weak for two rounds, redesign it in
  competition (a design-off) instead of patching.

## Default taste (for invented brands)

One clean sans at two weights (no serif, no italic, no condensed display face), ink and paper with cool or
neutral tints, one accent from red, green, teal, blue or yellow with one stated meaning on about ≤ 8% of pixels,
no glow or bloom, shadows `0 20-40px 60-120px rgba(0,0,0,.12-.22)`. Product window at 70–92% of the frame width,
safe margins 96 px at the sides and 64 px top and bottom, UI at least 22 px on screen, tabular figures. Six to
eight transition types per film, each at most twice, plus one signature move from the mark used three times;
never a crossfade through black, never glitch, light leak, film burn or flash-through-white presets.
A supplied brand or reference overrides all of this.
