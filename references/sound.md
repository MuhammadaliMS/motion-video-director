# Sound for launch films: what pros do, and how an agent can hear

You cannot hear the film you make. This page keeps what is useful from **earshot**
(github.com/Leonxlnx/earshot, MIT, "ears for coding agents"; read 2026-10-16) and from its launch-film sound
playbook (`docs/launch-video-sound.md` in that repo). **[measured]** = measured by earshot on 7 professional
launch films the author picked (modern SaaS / AI launches and motion reels, 20 to 93 s, web MP4s with 128 kbps
AAC). Seven films is a small sample: read the numbers as "what pros did here", not laws. **[practice]** = common
professional practice, not measured.

## The short version

1. **Music leads.** [measured] Music is present in 89 to 100% of 5 s windows in 6 of 7 films. [practice] Pick the
   track first and cut the picture to it; put section changes, the reveal and the logo on downbeats.
2. **Loud, steady body.** [measured] Median -14.8 LUFS integrated, loudness range 1.7 to 12.2 LU (median 5.5), the
   loudest 3 s only 1.1 to 3.5 LU above integrated. No waiting for a climax.
3. **Start at once.** [measured] First sound within 0.04 to 0.48 s. No silent cold open.
4. **Land the ending.** [measured] The last 3 s sit at body level; fades 0.08 to 2.54 s (median 0.27 s); dead air
   after the sound median 0.04 s. [practice] End on a designed sting: a hit plus a 2 to 4 s tonal tail, finished
   within about 0.5 s of the last frame.
5. **Dense rhythm, a few big accents.** [measured] 2.5 to 8.2 onsets per second, but only 1.2 to 1.7 salient hits
   per second. More sounds is not better; leave room.
6. **Not a hit on every cut.** [measured] Sound on visual events is no better than chance in most references:
   dense music covers the cuts. [practice] Accents go on what matters: the reveal, the logo, the key UI action,
   section changes. A sparse soundtrack (no dense music) does need sound on every cut.
7. **Real recordings beat synthesis.** [practice] Oscillator beeps and filtered-noise whooshes read cheap next to
   these films. [measured] earshot's realness model scored one code-made film 0.94 with a real-recordings
   soundtrack and 0.33 with its synthesized one (not an independent test). Our own synthesized beds and hits are
   fine for a prototype, not for a launch.
8. **Master for the web.** About -14 LUFS integrated, true peak <= -1 dBTP on the master. [measured] 6 of 7
   references clip after AAC decoding (+0.1 to +2.0 dBTP): a common flaw, do not copy it. [practice] YouTube turns
   loud uploads down to about -14 LUFS and leaves quiet ones quiet; Apple players aim at about -16; X, LinkedIn and
   website autoplay do not normalise at all.

## Accents and foley [practice]

- **Whoosh into a transition:** it peaks on the cut (or the fastest frame of the move) and starts 0.2 to 0.6 s
  before; match its length to the move.
- **Riser, stop-down, impact** for the big reveal: a 1 to 4 s riser, cut everything for 0.1 to 0.5 s, then an
  impact (with a sub drop) exactly on the reveal frame. Once or twice per film. [measured] 4 of 7 films use
  stop-downs (the sound drops 10 dB or more for 0.15 to 1.5 s and comes back on a hit).
- **UI clicks:** one per on-screen click, on the frame the cursor presses, not when the UI reacts. **Typing:** one key
  sound per character from a multi-take recording so no two consecutive keys are the same sample, slightly
  irregular timing. **Notifications:** short, soft, tonal; no alarm beeps.
- Keep UI foley short, bright (2 to 6 kHz) and about 10 to 15 dB below the music peaks, panned toward where it
  happens on screen.
- **Frequency space:** high-pass SFX and ambience (except impacts), one element in charge of the sub at a time, dip
  the music at 2 to 5 kHz, check the mono fold-down (phones are mono). [measured] Median side level is 8.5 dB below mid.
- **Voice-over** (4 of 7 films): duck the music 3 to 6 dB under it, keep SFX out of 1 to 4 kHz while it speaks, and
  never put a big hit on a key word.
- Align every sample on its **attack**, to the frame.

## How an agent hears

**With nothing installed:** `node starter/tools/audio-check.mjs film.mp4` meters loudness, true peak, loudness range,
first sound, opening and ending level, dead air and silent holes against the ranges above (ffmpeg only). These are
meters, not ears: a film can pass every row and still sound cheap. Also: `render.mjs --check`, a decoded-audio
look at each hit's first peak vs its frame (`export-and-audio.md`).

**With earshot installed** (Python 3.10+, ffmpeg, CPU only; the first model use downloads about 1.4 GB: CLAP
`laion/larger_clap_general` and the AudioSet tagger `MIT/ast-finetuned-audioset-10-10-0.4593`; works offline
afterwards). Install it in a venv in a folder of its own, never inside a project that ships:
```bash
git clone https://github.com/Leonxlnx/earshot && cd earshot
python -m venv .venv && .venv/bin/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
.venv/bin/python -m pip install -e ".[mcp,llm,dev]" && .venv/bin/python -m earshot doctor --load
claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- /path/to/earshot/.venv/bin/python -m earshot mcp
```
Each CLI call reloads the models (about 20 to 40 s); the MCP server keeps them loaded. Commands:

| command | answers |
|---|---|
| `earshot critique film.mp4` | scorecard against the 7 pro films, timestamped fixes (start here; the FIX FIRST lines matter more than the verdict) |
| `earshot timeline film.mp4 --cues cues.json` | listening transcript: events, sections, loudness, beats, sync of sound to cuts and cue frames |
| `earshot sheet film.mp4 -o sheet.png` | annotated picture (frames, events, spectrogram, loudness, sync): open the PNG and look |
| `earshot realness mix.wav` | real recording / pro-produced vs code-synthesized, with the 4 s windows that sound synthesized (check each stem; a finished mix is harder to judge) |
| `earshot describe/match/rank/find` | what a sound is, whether it fits a description, pick the best candidate, cut the clean moment as a trim |
| `earshot ab A B --query "..."` | which of two is closer to a description or references, and how they differ in words |
| `earshot measure FILE` | meters only: LUFS, true peak, LRA, spectrum, tempo |
| `earshot profile refs/ -o p.json` | build your own reference profile from films you admire (the bundled one describes modern SaaS / AI launch films, not every style) |

Rules from its agent skill: never say how audio sounds, or that a sound "fits", without a reading behind it, and quote
the number ("strong match z +3.9; p_real 0.96; -14.2 LUFS"). Change one thing at a time when A/B-ing.

**What it cannot judge** (docs/LIMITS.md): taste and emotion, provenance and licences, speech content, anything above
14 kHz from the models; event tags inside a busy mix are hints (right about half the time for exposed events, a
quarter under music); realness reads clean professionally synthesized UI sounds as "synthesized" and can be fooled by
a modal resonator plus room and noise. Trustworthy: loudness, timing and sync to picture, "is this the kind of sound I
asked for" on single exposed sounds, picking among candidates, obvious code-synthesized sources.

## Real recordings workflow (earshot's `skills/real-sound`)

For a premium soundtrack from real licensed audio, earshot ships a full skill: cue list from the picture, a sound
brief, sourcing per category with licence checks (allowed: CC0, public domain, CC BY 2.0 to 4.0, Mixkit free licences,
Pixabay; forbidden: NC, ND, SA, Sampling+, personal, custom, disputed; unverified is blocked), a music edit at bar
lines, a JSON sound design rendered by a deterministic mixer, measured QA (clicks, masking, harshness, sync, loudness),
a five-lens critique, one fixer, mastering, credits and the mux. Use it as is rather than re-deriving it; copy its
`skills/earshot` and `skills/real-sound` folders into `~/.claude/skills/`. Code selects, trims, places, levels and
masters; code never generates the sound.

`earshot forge` makes sounds in code and improves them by listening (recipes: click, impact, keypress, pop, whoosh).
In its own blind test (one listener, 15 trials) the author picked the made sound correctly 8 times out of 15, a coin
flip, so synthesized foley made this way can pass; but the search optimises earshot's own models (Goodhart), so judge
by model-free measurements, spectrograms next to references and a human listen.

## Worked example: earshot on our narrated reel (2026-10-16)

`earshot critique` + `sheet` on a 61.5 s voiceover reel (synthesized bed and hits, AI voice, mixed to -14.2 LUFS):
verdict **launch-grade**, 20 of 23 metrics in range, 0 critical or major. The meters were fine and the film still had
real problems, which is the point of listening:
- **Nearly mono** (side -36.8 dB vs mid, refs -15.5 to -4.0): the bed and hits were only slightly stereo (side -22 and
  -26 dB) and the voice-ducking mix collapsed it to correlation 1.00. Pan SFX with the motion, use stereo music, and
  check `side_to_mid` on the muxed file, not on the stems.
- **Thin bottom** (sub share -22.4 dB, refs floor -17.7): add a sub drop or kick under the reveals.
- **Dull** (brightness 953 Hz, refs 1183 to 3030) and **realness 0.72, "uncertain"** (needs 0.77): no window leaned
  synthesized, but the bed and hits were code-made and the voice is TTS. Swap in real recordings for a launch.
- **Stop-downs 23.4 per minute** (refs 0 to 9.1): the loudness curve fell 30 to 40 LU in every voice pause because the
  ducked bed was too quiet to carry them. With pauses in the narration (needed for clarity), keep the music audible
  inside them: duck less (3 to 6 dB, not 15+) and let the bed or a pad ring through the gaps.
- One cut (0:03.6) had no sound at all; sync elsewhere was good (59% of cuts had an onset within 1 frame, chance 43%).
- What it heard: voice-over narration, "funk music" and "inspirational corporate background music", whoosh and riser
  tags on the wipes, chat-pop tags on the UI hits, glockenspiel notes on the pings. Tags are hints; times and levels
  are reliable.

Setup notes from this install: Python 3.12 venv, `pip install torch` and `pip install -e ".[mcp]"` (the `llm` and
`dev` extras are optional), models cached under `<repo>/.cache/hf`. It used about 3.1 GB on disk (venv 1.3 GB, models
1.8 GB), so check free space first and delete the folder when done. First `critique` plus `sheet` on a 60 s film took a
few minutes including the model download; later calls reload the models (20 to 40 s each) unless you use the MCP server.
