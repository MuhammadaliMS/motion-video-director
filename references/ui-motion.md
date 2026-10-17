# UI and product motion: personality, micro-story, choreography

Condensed from **LottieFiles/motion-design-skill** (github.com/LottieFiles/motion-design-skill, MIT, 2.2k stars, last
pushed 2026-05-18; read 2026-10-16). It is a knowledge base of heuristics for **interactive UI animation**
(buttons, cards, modals, page transitions), implementation-agnostic. It has no sources or measurements for its
numbers: treat them as a working starting point like everything else in `motion-numbers.md`. Where it disagrees with
this skill the note says so. Durations below are real-time UI; a video scales them (hero reveals 600 to 900 ms, text
holds from `motion-numbers.md`).

## 1. Pick ONE personality per film

| Archetype | Duration | Easing | Overshoot | Keywords |
|---|---|---|---|---|
| Playful | 150 to 300 ms | ease-out-back | 10 to 20% | fun, whimsical, bouncy |
| Premium | 350 to 600 ms | cubic-bezier(0.4, 0, 0.2, 1) | 0% | elegant, minimal, luxury |
| Corporate | 200 to 400 ms | cubic-bezier(0.2, 0, 0, 1) | 0 to 3% | clean, business, dashboard |
| Energetic | 100 to 250 ms | ease-out-expo | 15 to 30% | dynamic, bold, exciting |

Defaults: Corporate for UI, Playful for illustrations. Define the brand's **motion identity** as three constants:
one **signature easing** for about 80% of moves, a **duration palette** of three (quick, standard, slow; Premium
350/500/800 ms, Corporate 200/300/450, Playful 150/250/400, Energetic 100/180/300), and one **entrance pattern**.
Write them into `style_guide.md` and the house rules. Personality mistakes: Playful with overshoot over 25% looks
broken and not everything should bounce; Premium too subtle is invisible, too slow is waiting; Corporate with playful
easing breaks trust; Energetic at max everywhere makes nothing stand out. Mixed archetypes: keep one for 90% or more.

## 2. Durations by element, distance, enter vs exit

Tooltip or micro-feedback 80 to 120 ms; button or toggle 120 to 180; icon 150 to 250; card enter or exit 200 to 350;
modal 300 to 400; page transition 400 to 600; dramatic reveal 600 to 1200; ambient 2 to 20 s. **Distance scales
duration:** 50 px = 0.8x, 100 px = 1.0x, 200 px = 1.3x, 400 px = 1.6x, full screen 1.8 to 2.0x. Feedback latency:
hover under 100 ms, press under 150 ms, release or settle 200 to 300 ms, error shake 300 to 400 ms (2 to 3
oscillations, 10 to 15 px, no overshoot).
**Enter vs exit (sources disagree):** this skill's first sources say exits are 40 to 50% shorter; Lottie says exit =
65 to 75% of the entrance (entrances 30 to 50% longer). Use exit = 50 to 75% of the entrance, shorter for dismissals.

## 3. Spring parameters, translated to a damping ratio

Their stiffness/damping table, as `zeta = d / (2 * sqrt(k))` (`Motion.dampingRatio`):

| Feel | Stiffness | Damping | zeta |
|---|---|---|---|
| Very stiff | 400+ | 25 to 30 | about 0.69 |
| Standard | 250 to 350 | 18 to 24 | about 0.61 |
| Bouncy | 150 to 250 | 10 to 15 | about 0.44 |
| Very bouncy | 100 to 200 | 5 to 10 | about 0.31 |
| Gentle | 100 to 150 | 20 to 25 | about 1.0 |

Overshoot budget by context: success 5 to 10%, error 0%, feedback 2 to 5%, celebration 15 to 25%, premium 0%.

## 4. Material-based easing

| Material | Duration scale | Overshoot |
|---|---|---|
| Rigid (metal, stone) | 1.2x | 0% |
| Elastic (rubber, gel) | 0.8x | 15 to 25% |
| Fluid (water, paint) | 1.5x | 5% |
| Paper (cards, sheets) | 1.0x | 3 to 5% |
| Gas (smoke, fog) | 2.0x | 0% |
| Glass (brittle) | 0.9x | 0% |

Weight classes: heavy (modals, overlays) 300 to 500 ms, 0% overshoot; medium (cards, panels) 200 to 350 ms, 3 to 5%;
light (tooltips, badges, icons) 80 to 200 ms, 5 to 15%.

## 5. A micro-story in four acts

Anticipation 10 to 20% (small move opposite to the main direction, a dim, a compression held about 50 ms), Action 30 to
50% (the primary move), Reaction 10 to 20% (shadow adjusts 50 to 100 ms after, siblings shift 50 to 150 ms, environment
ripples 100 to 200 ms), Resolution 20 to 30% (overshoot settle, 100 to 200 ms of breathing room). Scale by length:

| Total | Anticipation | Action | Reaction | Resolution |
|---|---|---|---|---|
| 100 to 200 ms | skip | 60 to 70% | skip | 30 to 40% |
| 200 to 400 ms | 10 to 15% | 40 to 50% | 10 to 15% | 25 to 30% |
| 400 to 800 ms | 15 to 20% | 30 to 40% | 15 to 20% | 20 to 25% |
| 800 ms+ | 20% | 30 to 35% | 15 to 20% | 25 to 30% |

Patterns: **reveal** (dim, scale 95%, then emerge to 100%, surroundings adjust), **departure** (gather to 98%, exit,
close the gap), **transformation** (destabilize with a vibration, morph, secondary appears, new state breathes),
**celebration** (compress 50 to 100 ms, burst, settle, calm). Even 50 ms of settling transforms the feel.

## 6. Layers: primary, secondary, ambient

Flat animation is missing layers. Primary is what the viewer follows. **Secondary** (shadow, icon shift, ripple)
travels 30 to 50% of the primary, starts 50 to 100 ms after it, with a different easing. **Ambient** (background life)
runs at 10 to 20% of the primary's amplitude and never competes; all ambient together stays under about 20% of the
visual energy. (This skill's earlier rule says secondary 50 to 70% travel starting 100 to 200 ms after and ambient under
5%: both are starting points; text-heavy video wants the smaller ambient.) **Counter-motion** for balance: hero slides
right, background drifts left at 20 to 30%; hero scales up, shadow spreads; hero lifts, shadow drops and softens.

## 7. Choreography numbers

- **1/3 rule (distance):** no motion travels more than a third of the screen without a keyframe change.
- **1/3 rule (density):** with 3+ elements, no more than a third in active motion at once (same idea as one hero per shot).
- **Stagger budgets:** micro cascade 20 to 40 ms (under 200 ms total), standard 50 to 100 ms (under 400), dramatic 100
  to 200 ms (under 600), wave 30 to 60 ms (under 500). UI total under 500 ms; a video can run longer if each beat
  stays readable. Directions: top to bottom for lists, center-out for heroes, reverse for exits, closer to the trigger first.
- **Timing overlap:** 0% methodical, 25% brisk (standard), 50% fluid, 75% rapid.
- Lead with the hero; all elements enter from the same direction; same easing family within a group.
- Dashboard load: 0 skeletons, 100 ms hero metric, 200 ms widgets at 60 ms stagger, 350 ms chart draws, 650 ms ambient
  starts. Modal: backdrop 0 ms, modal at 50 ms (scale 95 to 100%), title 200, body 280, buttons 350, close 400.

## 8. Emotion to motion, and path language

| Emotion | Character | Easing | Duration |
|---|---|---|---|
| Joy | bouncy, upward arcs | ease-out-back | 200 to 400 ms |
| Calm | smooth, flowing | sine ease-in-out | 500 to 1000 ms |
| Urgency | sharp, straight | ease-out | 100 to 200 ms |
| Sadness | slow, downward | cubic ease-in-out | 600 to 1200 ms |
| Surprise | sudden, radial | ease-out-expo | 150 to 300 ms |
| Elegance | slow, long arcs | (0.4, 0, 0.2, 1) | 400 to 700 ms |

Path as language: angular = tense, curved = friendly, spiral = whimsical, diagonal = purposeful, vertical =
growth or weight, horizontal = progress.

## 9. Disney principles with numbers

Squash about [1.2, 0.8], stretch about [0.85, 1.15], keep volume, impact 30 to 65 ms, recovery 65 to 130 ms (skip for
premium). Anticipation 100 to 200 ms at 10 to 20% of the main move (a button dips 3%). Follow-through: children trail
50 to 150 ms. Arcs: 10 to 20 px perpendicular offset at the midpoint (5 px corporate, 20+ playful). Exaggeration:
playful 15 to 25%, energetic 20 to 30%, corporate 0 to 5%, premium 0%. **Staging:** dim non-hero elements to 40 to 60%
(for text keep 4.5:1 by switching to a muted colour token instead of lowering opacity); hero enters 100 to 200 ms after
supporting elements. Appeal killers: jerky motion, inconsistent timing, abrupt stops, uniform animation.

## 10. Ambient recipes

Breathing: scale 0.98 to 1.02, sine ease-in-out, 2 to 4 s (over plus or minus 5% becomes attention-demanding).
Floating: plus or minus 5 to 15 px, 3 to 5 s, different periods per element so they never sync (4.0 s / 5.5 s / 3.5 s).
Gradient shift 8 to 20 s, imperceptible at a glance. Shimmer: a 1.5 to 2.5 s sweep, then a 2 to 5 s pause. Parallax
speeds 1.0 / 0.5 / 0.2 / 0.1 (foreground to deep background; never parallax text). Slow spin 10 to 30 s per revolution.
Particles (snow 10 to 20, motes 5 to 10, sparkles 8 to 15 elements) exist in their kit; **this skill bans decorative
particles by default**, so use them only when the brief calls for it.

## 11. Severity tiers and motion smells (for the critique loop)

- **CRITICAL:** linear easing on spatial movement; opacity-only for an important state change; motion over a third
  of the screen with no keyframe; no primary layer; stagger over 500 ms (UI); layout properties animated in a live page.
- **HIGH:** missing secondary layer; duration mismatched to the element; wrong directional easing; inconsistent
  personality; no follow-through; no reduced-motion alternative.
- **MEDIUM:** missing ambient layer; no anticipation; overshoot mismatch; weak arcs; no counter-motion.

| Smell | Likely cause | Fix |
|---|---|---|
| Robotic | linear easing, straight paths, everything synced | easing curves, 10 to 20 px arcs, offset starts and stops 50 to 150 ms |
| Too slow | duration over budget, ease-in-out where ease-out works | check the table, use ease-out, cut anticipation to 10% or remove |
| Too fast or jarring | duration under minimum, no resolution | modals 300 ms+, pages 400 ms+, add a 50 to 100 ms settle |
| Cheap or flat | only primary motion, same easing everywhere | add secondary and ambient, follow-through, 3 to 10% overshoot |
| Too distracting | too much moving, ambient too loud, competing heroes | 1/3 rules, one hero per moment, ambient 10 to 20%, 100 to 200 ms breathing room |
| No personality | default easing everywhere | apply the archetype's signature easing and duration palette |
| Inconsistent | duration or easing varies for the same type | standardize per motion type, one entry direction |

Quick diagnostic: no linear on spatial moves, duration fits the type, primary plus secondary, one personality, correct
directional easing, both 1/3 rules, follow-through present, every motion has a purpose, still fine on the 100th viewing.

## 12. Context adaptation

Platform duration modifiers: desktop 1.0x, tablet 0.9x, mobile 0.8x (fewer properties, shorter staggers by 30%), watch
0.6x, TV or kiosk 1.3x. By content: financial and healthcare low density and calm, social and children's playful and
dense, editorial premium. Dark mode: cut motion intensity 10 to 20% and avoid pure white flashes. **Reduced motion**
(for video embedded as autoplay on the web, ship a still or fade-only alternative): remove spatial movement, keep
opacity, drop springs, halve durations, never autoplay loops. Vestibular triggers to avoid or offer an alternative for:
large-scale zoom, full-screen position transitions, spinning elements over 100 px, parallax over 2 layers, rapid
direction changes. Do not carry critical information by motion alone; pause control for anything over 5 s.

## Audit: what this source is and is not

Useful and new here: personality archetypes with a brand motion identity, the four-act timing split, material
easing, 1/3 rules, stagger budgets, counter-motion, severity tiers, smell-to-fix tables, reduced-motion and vestibular
guidance. Not covered: video or rendering, determinism (`seek(t)`), audio, assets, a critique loop, production
briefs, formats. Weaknesses: numbers are uncited, ranges are wide, the exit-duration rule conflicts with other sources,
and several easing values are labelled Material Design 3 without a check against the M3 spec (not verified here).
It is a design-sense layer to sit on top of this skill's render and review workflow, not a replacement for it.
