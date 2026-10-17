# 3D fidelity: making a three.js film look designed, not generated

Lessons from building a 99 s narrated reel in the style of a hand-made Blender/After Effects reference
(lilac and hot-pink world, glass and clay props, halftone edges, Foley on every move). Every point
below was a note from the user after seeing frames, followed by the fix that worked. Starter code:
`starter/lib/studio3d.js` (props, cyclorama, doc icon, chair, confetti and more) and
`starter/examples/three-studio.html` (grade, legibility, a 2D insert, arcs, motion blur).

## 1. Judge against the reference, frame by frame

- Extract the reference into contact sheets (`ffmpeg -i ref.mp4 -vf fps=2,scale=320:-1,tile=6x5 s_%02d.png`)
  and put your stills next to them. Judge each frame like a designer: colour, shape, proportion, light, type.
- Measure, don't eyeball: average luminance and shadow colour of the reference (the lilac desk was luminance
  0.63 with violet shadows near rgb 136,65,137). Match the measured values first, then the look.
- "Improve fidelity" usually means three things, in this order: **proportions**, **recognizable objects**,
  **colour variety**. Fix them before adding effects.

## 2. Real proportions

- Pick one scale per set and keep it: desk sets at 1 unit = 10 cm, rooms at 1 unit = 20 cm. Model every prop
  at real size and scale it into the set, never by eye.
- Reference sizes (cm): phone 7.1 x 14.7 x 0.8; A4 21 x 29.7; pencil 17.5 long, 0.75 across; mug 8.5 across,
  9.5 tall; pencil cup 8 across, 10 tall; paperclip 3.3; desk 140 x 60, 75 high; chair seat 46 high and 46 wide;
  laptop 31 x 21; headphones 18 wide; sticky note 7.6 square.
- A flat-lay desk reads like the reference when the camera is high (about 6 units up at 1u = 10 cm) and the
  hero phone fills about 35% of the frame height, with props cropped at the edges.
- Exploding props stay at one shared scale (0.6 to 0.8 of real size at room scale) so the camera prop never
  ends up bigger than the laptop it flew out of.

## 3. No boxes or blobs: model the object

Users notice "squares and blobs" at once. A rounded box, a capsule or a sphere cluster never stands in for a
prop. Build each object from lathes, extrusions and tubes, at real proportions (all in `studio3d.js`):

| Prop | Construction |
|---|---|
| Pencil | 6-sided painted body, sharpened wood cone, graphite tip, metal ferrule with 2 rings, pink eraser |
| Headphones | flattened tube headband (scale.z 2.4), padded inner band, yokes, puck cups, torus cushions |
| Mug | lathe with lip and inner wall, torus-arc handle, coffee disc |
| Paperclip | thin tube along three nested U-turns (the real gem-clip path) |
| Clapperboard | slate with a printed face, striped base bar, striped arm on a hinge group (animate the hinge) |
| Film reel | extruded disc with 5 holes and a hub hole, two plates, dark wound film, hub |
| Camera | rounded body, lens stack of rings, iridescent glass cap, tube handle, viewfinder, rec dot |
| Mic | capsule grille with a mesh alphaMap, dark foam core, metal bands, gloss body |
| Marker | gradient barrel, grip rings, lathe collar, chisel felt nib, cap, pocket clip |
| Sticky pad | stacked block with page-edge texture, curled top sheet with handwriting |
| Others | ruler with mm ticks, plant with extruded leaves, scissors, director's chair with X legs and a printed back, top hat, frying pan, gear (extruded with holes), coil spring (helix tube), magnifier, light bulb with an emissive filament, swatch fan, SKILL.md-style doc icon with a dog-ear |

Paper uses a page curl (`curlGeo`), not a flat plane. Sticky notes curl at the bottom edge.

## 4. Light and materials

- `RoomEnvironment` PMREM, `NeutralToneMapping`, VSM shadows. A window "gobo" (an invisible frame that only
  casts shadows) throws the window stripes the reference has on every wall and floor.
- **Haze kills fidelity.** No fog, bloom threshold 1.6 at strength 0.25, a small depth-of-field aperture.
- **Bright studio sets overexpose.** On a near-white cyclorama, use sun about 1.6 to 1.9, exposure about 0.8,
  environment intensity about 0.5 to 0.55, and a cyc colour that is not near-white. The default environment
  intensity of 1.0 washed a whole test scene out.
- Metal under low environment light renders black (the phone frame did). Give that material its own
  `envMap: scene.environment` and `envMapIntensity: 1.8`.
- Glass reads premium with transmission 1, attenuation colour, low roughness, clearcoat and a touch of
  iridescence. Clay gets sheen. Keep text inside glass as a separate unlit plane so it stays readable.
- Desk sets: a warm spotlight pool on a dark textured desk (radial gradient, specks) with the sun turned down.

## 5. Colour: do not paint the whole film one hue

- A film that is all pink and lilac reads as "too pink" even when each frame is pretty. Rotate backgrounds per
  set: lilac desk, white room, cool grey, sky blue, warm cream, navy for a dark pause beat, charcoal for an
  editing app. Keep the brand accent (hot pink) for type and hero props only.
- **Grade per set, not globally.** A violet shadow tint, vignette and halftone tint on every shot was half of
  the "too pink" problem. Drive them from uniforms and pick a preset per set (`GRADE` in the template):
  violet, cool, warm, neutral, navy.
- Bookend: open and close on the same set (the lilac desk) so the palette has a home.

## 6. Mix 2D into the 3D

The reference is not all 3D, and an all-3D film reads monotonous. About one shot in four should be flat 2D:
- giant kinetic words that slide in letter by letter with a blur that clears (a word struck through with a
  marker line, then the replacement word slams in);
- a halftone scribble field (strokes rasterised to dots) behind big type;
- a flat website-style layout: sidebar with icons, thumbnail row sliding in, blue and pink pill tags, a
  hand-drawn circle;
- an end card on grey with a signature write-on and a footer.
Also add 2D accents on top of 3D: a thin arc that sweeps round a hero object as it lands, and speed lines on
impacts. Draw 2D shots straight onto the output canvas and skip WebGL. When subframes for motion blur cross
into a 2D shot, fall back to the previous 3D shot.

## 7. Effects that hurt

- **No full-width anamorphic streaks or lens ghosts.** They read as "a white line across the video". Keep
  light leaks on cuts under 0.25 alpha and additive light shafts under 0.05.
- A text scrim that is too strong reads as a white blob. Keep it soft (38 to 42% alpha, 28 px blur).

## 8. Type that stays readable on any background

Subtitles authored as white vanish on a bright set. Measure instead of guessing, every frame:
draw the output canvas into a 192 x 108 canvas, average the luminance and its spread under each text block's
bounding box, then switch the block to ink or white. Keep the authored theme unless the background is clearly
wrong for it (white text switches above luminance 0.66, ink below 0.4), and add a soft scrim only when the
background is busy (spread over 0.16) or mid-tone. Remap the big white style to ink and the big ink style to
white when the theme flips. `legible()` in the template does all of this.

## 9. Explaining a process: act on one object

A ring of labelled tiles with a dot running round it ("Render, Look, Score, Fix") was called very bad design.
Instead pull one hero object forward and let each word act on it: the frame renders in behind a scanline with a
progress bar, a magnifier sweeps across it, a score badge stamps on (6.8), a marker circles the problem and the
frame swaps to the fixed version with a check (score counts to 9.4), then it spins once to show the loop.
Put the word under the object, not in a corner.

## 10. Process notes

- **Faces:** if the user says no faces, show none. Use the name as type, a signature and printed props, and
  replace people with objects (an empty director's chair marked YOU).
- Write a long film as several page files on one clock (a `T0` offset, renders `t + T0`) and concatenate with
  ffmpeg. One spec file per page; one merged spec for the sound.
- Render stills of every shot before any full render, and tile them with
  `ffmpeg ... -filter_complex "xstack=inputs=N:grid=CxR"` (hand-written layouts overlap).
- Edit with exact-match replacements that assert a count of 1. Compute the new text fully before opening the
  file for writing: `open(p, "w").write(None)` truncated a whole scene file once (keep a backup per round).
- `GPU=1 node render.mjs` (Metal ANGLE) renders about 0.42 s per frame at `?ss=2&mb=3`, about 3x faster than
  SwiftShader, and passed `--check`.
- Phone and web viewers reject files over about 30 MB: also export 1600 px wide at 2 Mbps.
