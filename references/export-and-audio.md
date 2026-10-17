# Loops, sound and export (the last mile)

The part tutorials skip and viewers notice first. Source notes at the end of the file.

## Loops

- Render frames **0 to N-1, never N**. Frame N is frame 0 again, and showing it twice is the
  hiccup at the seam. The starter's `render.mjs` already renders `fps * duration` frames
  (0 to N-1), so set `duration` to exactly one loop period.
- Drive every loop from `phase = frame / N` (`Motion.loopPhase(t, duration)`) with **whole-number
  cycles**. A square that turns exactly 90 degrees per loop, or a wave that completes exactly
  2 cycles, lands back on frame 0. For organic drift, sample noise along a circle.
- A wobble or follow-through that ends the loop can run straight through frame 0 so the seam
  never shows.
- Make frame 0 a finished composition: it is what shows while a GIF loads.
- Check: `ffmpeg -stream_loop 2 -i out.mp4 -c copy loop_check.mp4`, then watch the seam.

## Sound: on the same clock as the picture

The model cannot listen, so score from frame numbers, then **measure the decoded audio**.

- The feed plays muted until someone taps: the picture must work in silence first.
- Every sound is synthesized in code (Web Audio API / sample-level WAV), no samples. Each hit
  peaks **1 frame after** its picture (light beats sound; a sound before its picture feels wrong
  sooner than one slightly late). Write the sound prompt against frame numbers, e.g. "pinch bloops
  at 112, 113, 114 and 120".
- Keep motion cues and sound cues in one shared timing file (see `motion-math.md`).
- Measurement loop (this is where the long sound follow-up chains came from):
  1. Isolate each hit stem and the bed stem, find the first waveform peak sample, compare it with
     `(frame + 1) * sampleRate / fps`. Fix late peaks: start tonal hits in **cosine phase** with a
     0.5 to 1 ms attack, no waveshaper, so the first peak sits on the frame. Harmonics of one hit
     all in cosine phase, or the biggest peak slides a few ms late.
  2. Level: K-weighted hit minus bed should be **3 to 6 dB over the bed** in the first 60 ms. Fix
     the loudest and quietest offenders one at a time (dB figures in the follow-up).
  3. Phone speakers play nothing under ~150 Hz. If most of the energy sits under 60 Hz the hits
     vanish: measure the 200 Hz to 6 kHz band, play bass roots an octave up, open the bass filter,
     lift the pad. Keep hits under 8 kHz and the mix mono-safe if asked.
  4. Remove DC (subtract each channel's loop mean). If the limiter takes more than ~1.5 dB off a
     hit, the partials and kick are cresting on the same sample: offset their phases or lower the
     kick under it.
  5. Duck the bed 3 to 4 dB under a key hit rather than raising the hit.
- Loudness: about **-14 LUFS**, peak at most -1 dBTP. AAC encoding lifts true peak by about 0.9 dB,
  so limit the WAV to **-2.2 dBTP** and check the decoded MP4.
- AAC adds about **16 ms of padding** after the video. A looping player then stops hard at the end,
  plays 16 ms of silence and restarts hard. Keep the seamless WAV as the master for any loop
  exported twice, and for a single-loop MP4 add a 2 ms raised-cosine fade to the first and last
  96 samples only (at 48 kHz).
- Mux: `render.mjs page.html --audio sfx.wav` (loudnorm -14 LUFS, TP -2.2, AAC 192k), or by hand:

```bash
ffmpeg -i out/anim.mp4 -i music.wav -i sfx.wav \
  -filter_complex "[1:a][2:a]amix=inputs=2:duration=first,loudnorm=I=-14:TP=-2.2:LRA=11[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/final.mp4
```
- Verify by decoding the finished MP4 and lining each hit up with its frame, not the WAV.

## Export (X, social)

```bash
# MP4 for a post: H.264 High, yuv420p, starts playing at once
ffmpeg -framerate 24 -i out/frames/%04d.png -c:v libx264 -profile:v high -pix_fmt yuv420p -crf 18 -movflags +faststart out/anim.mp4

# GIF: one palette for the whole clip, 1200 px wide  (render.mjs ... --gif does this)
ffmpeg -framerate 24 -i out/frames/%04d.png -vf "scale=1200:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle" -loop 0 out/anim.gif
```

| Spec | GIF | Video |
|---|---|---|
| Size limit | 15 MB | 140 s without Premium |
| Frame size | up to 1280 x 1080 | 1920 x 1080 for 16:9 |
| Frames / speed | at most 350 frames | up to 60 fps |
| Format | one palette, loop forever | H.264 High, yuv420p, AAC |
| Lab default | 1200 px wide, 24 fps | CRF 18, faststart |

- 350 frames at 24 fps caps a GIF at about 14.5 s. A 4 to 6 s loop is 96 to 144 frames.
- **GIF delay trap:** delays are stored in hundredths of a second, so a 24 fps frame (41.7 ms)
  cannot be stored exactly. Rounding every frame to 40 ms makes the loop 4% fast and off the beat
  grid. Use five frames at 40 ms then one at 50 ms to keep a 6 s loop at exactly 6.00 s. (Limits
  are from X's docs as of the source; re-check before relying on them.)
- Canvas, picked before the first frame: 1920x1080 (16:9), 1080x1080 (1:1), 1080x1350 (4:5),
  1080x1920 (9:16). X accepts video between 1:3 and 3:1.
- No gradients in a GIF (banding): flat colours or a dithered palette. Snap resting text to whole
  pixels, or render at 2x and scale down, to stop blurry or shimmering text.
- Jank in a live HTML preview: animate only `transform` and `opacity`, never width, height, top, left.

## Motion blur and anti-aliasing for 3D / GPU pieces (optional polish)

Average several sub-frames spread over half a frame (a 180-degree shutter) and blend in linear
light. Quarter-pixel camera jitter (4 offsets chosen from `frac(t * fps)`) cleans edges. Both need
a real GPU for speed; the starter's SwiftShader path works but is slow.

## Source

"Opus 5.5 Motion Lab" by @flxrnc, x.com/flxrnc/status/2105311836190978392 (read 2026-10-15).

## Supplied track: measure before you animate

```bash
node starter/tools/beats.mjs song.wav > beats.json   # bpm, beats, downbeats, hits (Node + ffmpeg only)
```
State changes go on beats, big moments on downbeats, clicks and whooshes on hits. Tested on a known 120 BPM bed:
bpm 120.25, beats within about 7 ms of the true grid. It assumes steady music; check the first few beats by
eye on a contact sheet. Blindfold test: if the audio has no shape without the picture, it is unfinished.

## Formats

Every aspect ratio comes from the same timeline, never a crop. Vertical gets bigger type and fewer elements,
square gets tighter holds, wide gets more spatial context. Overnight or long runs work in six gates; the last
one is formats, loop check, poster frame, README.
