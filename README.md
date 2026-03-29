# Lyric Video Generator

Generate dynamic, animated lyric music videos from audio files. Supports two modes:
automatic transcription via Whisper, or forced alignment with a lyrics file via stable-ts
for perfect word accuracy.

## Architecture

```
                       +--lyrics.txt (optional)
                       |
song.mp3 ---> [transcribe.py] ---> transcript.json ---> [Remotion] ---> video.mp4
                  |                                          |
           Whisper (auto)                             React components
           stable-ts (aligned)                        word-by-word animation
```

## Prerequisites

- [Pixi](https://pixi.sh) - Python environment manager
- [Node.js 18+](https://nodejs.org)

## Setup

```bash
pixi install && npm install
```

## Usage

### With a lyrics file (recommended - best accuracy)

```bash
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --style neon --output out/video.mp4
```

### Without a lyrics file (auto-transcription)

```bash
node scripts/generate.mjs --input song.mp3 --style neon --output out/video.mp4
```

### Style presets

| Style     | Look                                      |
|-----------|-------------------------------------------|
| `neon`    | Black bg, cyan/magenta, glowing           |
| `minimal` | White bg, clean black text                |
| `retro`   | Dark brown, gold/orange, warm             |
| `dreamy`  | Deep purple, lavender/pink, soft glow     |
| `bold`    | Black bg, white/yellow, high contrast     |

```bash
node scripts/generate.mjs --input song.mp3 --style minimal --output out/video.mp4
node scripts/generate.mjs --input song.mp3 --style retro --output out/video.mp4
node scripts/generate.mjs --input song.mp3 --style dreamy --output out/video.mp4
node scripts/generate.mjs --input song.mp3 --style bold --output out/video.mp4
```

### Preview mode (first 15 seconds)

```bash
node scripts/generate.mjs --input song.mp3 --style neon --output out/preview.mp4 --preview
```

### Live preview in browser

```bash
npm start
```

Opens Remotion Studio at http://localhost:3000 for interactive scrubbing and preview.

## How it works

1. **Transcription** - Either Whisper auto-transcribes the audio, or stable-ts aligns a
   provided lyrics file against the audio waveform. Both produce word-level timestamps.

2. **Rendering** - Remotion composes a React-based video at 1920x1080 / 30fps. Each word
   animates in sync with the audio using spring physics and interpolation. The active line
   is centered with previous/next lines visible above and below.

### When to use forced alignment vs auto-transcription

- **Forced alignment** (`--lyrics`): Use when you have accurate lyrics. Gives perfect word
  accuracy and better timestamp precision, especially on noisy recordings.
- **Auto-transcription**: Use when lyrics aren't available. Works well on clean vocals but
  may have word errors, especially with uncommon words or heavy accents.

## CLI options

| Flag         | Default  | Description                              |
|--------------|----------|------------------------------------------|
| `--input`    | required | Path to audio file (.mp3 or .wav)        |
| `--lyrics`   | none     | Path to lyrics .txt for forced alignment |
| `--style`    | `neon`   | Style preset name                        |
| `--output`   | `out/video.mp4` | Output video path                 |
| `--model`    | `base`   | Whisper model size (tiny/base/small/medium/large) |
| `--language`  | auto     | Language code (en, es, etc.)             |
| `--preview`  | false    | Render only first 15 seconds             |
| `--open`     | false    | Open Remotion Studio before rendering    |

## Render time estimates

| Song length | Approximate render time |
|-------------|------------------------|
| 1 minute    | 2-4 min                |
| 3 minutes   | 8-15 min               |
| 5 minutes   | 15-25 min              |

Adjust concurrency in `remotion.config.ts` for machines with more cores.

## Links

- [Remotion docs](https://www.remotion.dev)
- [Whisper](https://github.com/openai/whisper)
- [stable-ts](https://github.com/jianfch/stable-ts)
