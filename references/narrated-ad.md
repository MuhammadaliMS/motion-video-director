# Narrated ad / explainer route (voice-first)

Lessons from building a 60 s narrated reel with generated art. Voice decides the timeline, so make the voice first.

## Feedback to design for
- Every capability you name must be **shown as its own animation**, with a short caption people can relate to.
  A card that only says "Springs" fails. Show the weight (a blob pops up, overshoots, settles, with the damping
  graph drawing live), the numbers (a slider moves damping 0.2 to 0.8 and the curve changes), the morph (one
  element changes width, height, radius through states, with the values tweening), the connection (tools hang
  off one trunk, pulses travel down it = one clock). Give tools their own icons that move (original SVG icons,
  not trademarked logos).
- Use **real match cuts**: the shape stays in the same place and size while the world changes (zoom into the
  laptop orb, then the orb fills the frame; orb shrinks into a lens; ring becomes lens, clock, pie, record dot;
  16:9 rect morphs to 9:16 then to a loop ring). Vary the motion types: camera zoom, kinetic type, shape morph,
  data graph, node graph, 3D wireframe, UI scan, parallax float, stamp, wipe.
- "Fast and punchy like an ad" still needs **pauses**: use `<short pause>` after every phrase and
  `<long pause>` between sections, so each visual lands before the next starts.
- Generate art with the `codex-image` skill (consistent palette in the prompt, `--transparent` for cut-outs,
  keep `*.prompt.md` beside each asset). Faceless figures avoid moderation blocks.

## Voice with Google AI Studio (Gemini TTS) through Claude in Chrome
1. Open the generate-speech page (`aistudio.google.com/.../generate-speech?model=gemini-3.8-flash-tts`), already signed in.
2. **One speech block only**: click the block text, select all, type the whole script as one paragraph.
3. Style: the style box accepts free text ("Fast, punchy, high-energy TV ad voiceover. Quick pace, confident
   and crisp, short phrases with tiny pauses between them."). Pick a commercial-voiceover voice (Koda worked).
4. Expression tags go inline as text: `<short pause> <long pause> <sigh> <gasp> <chuckle> <cheer> <laugh>`.
   The `+ Expression` chips list them all. Typing them as plain text works.
5. Run, wait for the player to show the final length (the total grows while it streams), then ask the user for
   permission before downloading (downloads need an explicit yes), and click the download icon. The WAV lands in
   `~/Downloads` (24 kHz mono, about 2 to 3 MB for 45 to 60 s).
6. Length check: about 2.6 to 3 words per second with pauses; 120 words with tags is about 60 s.

## Cue times from the take (no transcriber needed)
```bash
ffmpeg -hide_banner -nostats -i voiceover.wav -af silencedetect=noise=-38dB:d=0.16 -f null - 2>&1 | grep silence_
```
Speech segments are the gaps between silences. Match them in order to the script phrases, then write them into
one `cues.js` (`V = {phrase: seconds}`) that both the scene and the sound-effect synth import. A list read as one
segment (no detectable pause) is split evenly. Scene boundaries sit on phrase starts.

## Build gotchas
- **Decode every `<img>` in `setup()` before frame 0** (`await Promise.all([...document.images].map(i => i.decode()))`).
  Otherwise the first frame that shows an image renders blank and `--check` fails ("DIFFERENT" at the first
  time an image appears).
- Instagram Reels: keep text and key art inside x 72..1008, y 260..1440 (top and bottom UI cover the rest).
- Rendering 1080x1920 at 30 fps takes about 0.3 to 0.5 s per frame; run it in the background and do not run an
  audio mix at the same time.

## Mix
Synthesize `bed.wav` (soft pad, kick, off-beat hat, pluck arpeggio, sine bass) and `fx.wav` (hits 1 frame after
the picture) separately, then:
```bash
[0:a]aresample=48000,pan=stereo|c0=c0|c1=c0,highpass=f=70,loudnorm=I=-16:TP=-3:LRA=7,apad=whole_dur=<DUR>,asplit=2[vo1][vo2];
[1:a]volume=-7dB,lowpass=f=9000[bed];
[bed][vo1]sidechaincompress=threshold=0.012:ratio=6:attack=12:release=400[duck];
[2:a]volume=-6dB[fx];
[duck][fx][vo2]amix=inputs=3:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=9
```
The voice stays on top; only the bed ducks. You cannot hear the result, so measure stems (voice about -16 LUFS,
bed 12 to 15 dB under it while speech plays) and offer a voice-only version.

Voice-over rules from pro launch films (`sound.md`): duck the music 3 to 6 dB under the voice, keep sound effects
out of 1 to 4 kHz while it speaks, and never put a big hit on a key word. Synthesized hits are a prototype grade;
for a launch, swap them for licensed real recordings and run `audio-check.mjs` on the muxed MP4.
Pauses in the voice make a ducked bed look like dead air: earshot counted 23 stop-downs per minute (pro films: 0 to 9)
because the bed sat 15+ dB under the voice. Duck 3 to 6 dB and keep music in the gaps. Also keep the bed and hits
stereo through the mix (the sidechain chain collapsed ours to near mono): check side-to-mid on the final MP4.

Notes from a 110 s character reel (pixel-art avatar of the user, voxel sets, Gemini TTS, 2026-10-17):
- A character "based on my profile" was built from a text description of the user's own profile photo (head, beard,
  glasses, outfit, watch), not by uploading the photo to the image model. One base sprite, then every other pose with
  `--ref base.png` kept the likeness consistent across seven poses.
- The AI Studio URL without `/u/N/` opens the browser's default Google account; check which account is signed in.
- `--check` can report DIFFERENT for a 1-level anti-aliasing flicker on a few pixels; diff the two frames before
  hunting a bug (`--dumpcheck` in the reel project saves them).
- A transparent-looking image with a black background (moon) sits on a dark scene with `mix-blend-mode: screen`.
- Earshot loop on the mix: widen the bed (`extrastereo`), add sub (`bass=g=..:f=50`), duck only 2:1 so the music
  stays in the pauses; that took the reel from 21 to 22 of 23 metrics with stereo in range.

Notes from the 99 s SaaSWAVE-style reel (lilac and pink 3D, Daro voice, 2026-10-17):
- One speech block with `<short pause>` and `<long pause>` tags gave 61 phrases; `silencedetect` timings drove
  every shot boundary and every word's kinetic type.
- The user asked for no faces: the name lives as type, a signature write-on and printed props (a clapper reading
  DIR. MUHAMMAD, an empty director's chair marked YOU). Do not reuse a portrait once the user says no faces.
- The three rounds of notes were all fidelity: proportions and real props, then colour variety and 2D shots, then
  readable subtitles, the loop diagram and a white flare streak. All of it is now in `3d-fidelity.md`.
