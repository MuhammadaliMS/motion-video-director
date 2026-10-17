# Motion numbers cheat sheet

Give the model curves and frames, not adjectives. Every adjective you replace with a number is a
decision you take back from the model. Source: the "Opus 5.5 Motion Lab" write-up by @flxrnc
(see the end of this file), with easing values from the Easings reference by Andrey Sitnik.
All starting points, not laws: tune by eye, then write the final number into the brief.

## Easing

| Name | cubic-bezier | Use for | `Motion.EASE` |
|---|---|---|---|
| ease-out-expo | 0.16, 1, 0.3, 1 | text and logo reveals | `enter` |
| ease-out-quint | 0.22, 1, 0.36, 1 | premium entrances | `premium` |
| ease-in-out-quart | 0.76, 0, 0.24, 1 | moves and camera pushes | `move` |
| ease-in-expo | 0.7, 0, 0.84, 0 | fast exits | `exit` |
| ease-out-back | 0.34, 1.56, 0.64, 1 | playful pop with overshoot | `pop` |

- Enter with ease-out. Exit with ease-in and make exits **40 to 50% shorter** than entrances
  (Material 3 pairs a 400 ms entrance with a 200 ms exit). Move across the screen with ease-in-out.
- Linear only for rotation, progress bars and the phase of a loop. Linear on a move is the fastest
  way to make a render look like a render.
- Springs are for objects with mass (cards, buttons, mascots). **Position and size may bounce;
  opacity and colour never do.** Camera moves get the softest curves (ease-in-out-quart).

## Springs: one number that translates between libraries

Damping ratio `zeta = d / (2 * sqrt(k * m))` (`Motion.dampingRatio(k, d, m)`).

| zeta | Feel |
|---|---|
| 1.0 | never bounces |
| 0.7 to 0.85 | premium |
| 0.4 to 0.6 | playful |
| under 0.3 | cartoon |

Remotion's default spring (mass 1, damping 10, stiffness 100) is 0.5. react-spring's default
(tension 170, friction 26) is 1.0. Say "damping 0.6, about 10% overshoot, settled by 1.4 s" and the
model has nothing left to guess. `lib/motion.js` `spring(t, {zeta, omega})` is the closed form.

## Durations, stagger, holds (in frames: frame = ms * fps / 1000)

| Thing | Starting point |
|---|---|
| UI feedback | 100 to 200 ms (100 ms feels instant) |
| UI moves | 200 to 500 ms |
| Hero reveals | 600 to 900 ms |
| Stagger: letters / words / list items | 30 ms (or 1 frame) / 60 to 120 ms / 40 to 80 ms |
| Start the next element when the previous is | 30 to 50% done (fully sequential looks robotic, all at once looks cheap) |
| Text hold | at least **0.3 s per word + 0.5 s** before it moves (a two-word title needs 1.1 s) |
| Hold with life | a slow 2% push keeps the frame alive while the words stay readable |

At 24 fps one frame is about 42 ms: a 400 ms move is 10 frames, a 750 ms reveal is 18.

## Hierarchy: one hero per shot

- One hero move per shot. Everything else waits, dims to 40%, or holds still.
- Secondary moves travel **50 to 70%** as far as the hero and start **100 to 200 ms** after it.
- Ambient motion stays under **5%** of the hero's travel, runs on a slow sine and never stops.
- Handoff between shots is a decision: a hard cut on the beat (default), a match cut where one
  shape becomes the next, or a mask wipe.

## Beat grid

`frames per beat = fps * 60 / BPM`. At 120 BPM and 24 fps that is 12. At 128 BPM and 30 fps it is
14.06: compute every beat from time and round **each one** (`Motion.beats(bpm).frame(n, fps)`).
Adding a rounded 14 again and again drifts off the music: after 32 beats you are 2 frames off.
Cut on the beat and change the layout on the bar (every 4 beats). Changing everything on every
beat wears the viewer out.

## Camera and depth

- Field of view 35 to 50 degrees for a natural look, 18 to 30 for a product or studio feel.
  Never park the camera: a slow dolly or orbit (a few degrees) even in the hold.
- Parallax speeds to start from: foreground 1.0, middle 0.5, background 0.2.

## Principles of animation, written as frames

| Principle | Write it in the prompt as |
|---|---|
| Anticipation | "11-frame crouch (1.2 x 0.75)" before the move |
| Squash and stretch | "stretch 0.85 x 1.28 at takeoff, squash 1.25 x 0.7 on landing" |
| Overlapping action | "arms lag 4 frames, legs 6" |
| Follow-through | "arms settle at 2.2 Hz, damping 0.22" |
| Arcs | "a flip along a dotted arc, 3.5 high" |
| Slow in, slow out | "spring back at damping 0.55" |
| Timing | "25 frames of air per hop, 18 frames of crouch before the flip" |

Exaggerate key poses **10 to 30%** further than feels right: the feed shrinks everything.
Pin each principle to a labelled frame number in the prompt and the labels become a test: a move
that runs late shows up as a label that lights before its move. Also state what may not change
(e.g. "keep the mascot's pixel proportions exactly: 14x10 body, 3x2 arms"), or the character drifts.

## Accessibility and legibility

Keep text at 4.5:1 contrast on every frame, including over moving backgrounds. Never flash more
than 3 times per second (both from WCAG).

## Translate feelings into numbers before you send the note

| Note | Send |
|---|---|
| "Make it pop" | scale 1.0 to 1.08 to 1.0 over 6 frames, peak on the beat |
| "Make it feel premium" | ease-out-quint on entrances, springs at damping 0.8, no overshoot on text |
| "It drags" | shorten each hold by one beat (12 frames at 120 BPM / 24 fps) so cuts stay on the grid |
| "It feels busy" | one hero move at a time; everything else starts 150 ms later at 60% of its travel |
| "It looks like AI" | list the defaults it used by name, ban each one, render again |

## Source

Condensed from "Opus 5.5 Motion Lab: Make Claude Animate Like a Studio" by Florence (@flxrnc),
x.com/flxrnc/status/2105311836190978392, read via Chrome on 2026-10-15. Re-read the source for
its full prompts (liquid chrome loop, earbuds A/B test, voxel mascot) and the per-piece
follow-up logs.

## Stacked springs and rules per object class

A fixed easing curve slides from A to B. Motion with mass speeds up, overshoots a hair and settles. When a value
changes target several times (cursor position, a container's width), do not restart one spring: stack one per
change, `track(t) = v0 + sum (v_i - v_(i-1)) * spring(t - t_i)`, which is `Motion.springTrack(t, [[t0, v0], [t1, v1], ...], preset)`.
Frame 812 still renders without simulating 0 to 811.

| Object | Rule |
|---|---|
| Small UI | snaps, minimal overshoot |
| Panels | settle |
| Camera | glides, almost invisible |
| Headlines | land hard, then hold long enough to read |
| Mascots | bounce on purpose |

If everything overshoots, nothing feels precise.

Second source: "Opus 5.5 Motion Design: What the Viral One-Prompt Videos Are Hiding" by seeco (x.com/seeconvm/status/2106096193235259564).
