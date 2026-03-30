# Dynamic Typography Videos

Generate animated lyric videos and karaoke videos from audio files. Two-stage pipeline: Python (Whisper/stable-ts) for word-level transcription, then Remotion (React/TypeScript) for animated video rendering.

## Features

- **Lyric videos** with word-by-word highlight animations synced to audio
- **Karaoke videos** with left-to-right color wipe, full-verse display, instrumental breaks, and countdown timer
- **Forced alignment** from a lyrics file for perfect word accuracy
- **Auto-transcription** via Whisper when no lyrics are available
- **5 style presets** (neon, minimal, retro, dreamy, bold)
- **1920x1080 @ 30fps** output, ready for YouTube

## Architecture

```
                       +--lyrics.txt (optional)
                       |
song.mp3 ---> [transcribe.py] ---> transcript.json ---> [Remotion] ---> video.mp4
                  |                                          |
           Whisper (auto)                      LyricVideo (word highlights)
           stable-ts (aligned)                 KaraokeVideo (color wipe + verses)
```

## Prerequisites

- [Pixi](https://pixi.sh) - Python environment manager
- [Node.js 18+](https://nodejs.org)

## Setup

```bash
pixi install && npm install
```

## Quick Start

### Lyric video

```bash
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --style neon
```

### Karaoke video

Requires an instrumental track and a lyrics file:

```bash
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --instrumental instrumental.mp3 --style neon
```

Output defaults to `~/Videos/<song name>.mp4` (or `<song name> karaoke.mp4` for karaoke mode). Use `--output` to override.

## How It Works

### Lyric Videos

1. **Transcription** - Whisper auto-transcribes the audio, or stable-ts aligns a provided lyrics file against the audio waveform. Both produce word-level timestamps.
2. **Rendering** - Remotion composes a React video at 1920x1080/30fps. The active line is centered with previous/next lines visible above and below. Each word animates as it's spoken (pop, slide-up, fade, or slam depending on style).

### Karaoke Videos

1. **Transcription** - Same as lyric mode, using the vocal track for alignment accuracy. Additionally, blank lines in the lyrics file are used to group lines into verses.
2. **Rendering** - Uses the instrumental track as audio. Displays full verses at once with a left-to-right color wipe on each word as it's sung. Shows "Instrumental" with a progress bar during gaps longer than 3 seconds between verses. Adds a 5-second countdown if the first verse starts quickly.

### Forced alignment vs auto-transcription

- **Forced alignment** (`--lyrics`): Use when you have accurate lyrics. Gives perfect word accuracy and better timestamp precision.
- **Auto-transcription**: Use when lyrics aren't available. Works well on clean vocals but may have word errors.

## Style Presets

| Style     | Look                                      | Best for              |
|-----------|-------------------------------------------|-----------------------|
| `neon`    | Black bg, cyan/magenta, glowing           | EDM, pop, hip-hop     |
| `minimal` | White bg, clean black text                | Acoustic, indie       |
| `retro`   | Dark brown, gold/orange, warm             | Classic rock, R&B     |
| `dreamy`  | Deep purple, lavender/pink, soft glow     | Lo-fi, ambient, pop   |
| `bold`    | Black bg, white/yellow, high contrast     | Rap, spoken word      |

## CLI Options

| Flag              | Default                    | Description                              |
|-------------------|----------------------------|------------------------------------------|
| `--input`         | required                   | Path to audio file (.mp3 or .wav)        |
| `--lyrics`        | none                       | Path to lyrics .txt for forced alignment |
| `--instrumental`  | none                       | Path to instrumental track (enables karaoke mode) |
| `--style`         | `neon`                     | Style preset name                        |
| `--output`        | `~/Videos/<song name>.mp4` | Output video path                        |
| `--model`         | `base`                     | Whisper model size (tiny/base/small/medium/large) |
| `--language`      | auto                       | Language code (en, es, etc.)             |
| `--preview`       | false                      | Render only first 15 seconds             |
| `--open`          | false                      | Open Remotion Studio before rendering    |

## Lyrics File Format

Plain text, one line per line of lyrics. For karaoke mode, separate verses with blank lines:

```
Found a box beneath my bed
Full of things I used to be

But tonight I'll light a candle
Tonight I'll make a wish
```

Blank lines define verse boundaries for karaoke display. Lines within a verse are shown together on screen.

## Preview and Development

```bash
# Live preview in browser (Remotion Studio)
npm start

# Preview mode - render first 15 seconds only
node scripts/generate.mjs --input song.mp3 --style neon --preview

# Run tests
npx vitest run
pixi run python -m pytest tests/ -v
```

## Fixing Transcription Errors

Edit `src/transcript.json` directly after transcription:

- **Wrong word**: Find it in `words[]` and the matching `lines[].words[]` entry, change the `"word"` field
- **Bad line break**: Split or merge entries in `lines[]`, update `start`/`end` to match first/last word
- **Inaccurate timestamps**: Try `--model small` or `--model medium` for better accuracy

## Render Time

| Song length | Approximate render time |
|-------------|------------------------|
| 1 minute    | 2-4 min                |
| 3 minutes   | 8-15 min               |
| 5 minutes   | 15-25 min              |

Adjust concurrency in `remotion.config.ts` for machines with more cores.

## Project Structure

```
scripts/
  generate.mjs          # Full pipeline orchestrator
  transcribe.py         # Whisper/stable-ts transcription
src/
  types.ts              # TypeScript interfaces
  timing.ts             # Pure timing logic (active line/word/verse detection)
  styles/presets.ts     # Style preset definitions
  LyricVideo/           # Lyric video components (3-line scroll layout)
  KaraokeVideo/         # Karaoke components (full-verse, color wipe, countdown)
  Root.tsx              # Remotion composition registry
tests/
  timing.test.ts        # Timing logic tests
  test_transcribe.py    # Transcription grouping tests
```

## License

Apache 2.0 - see [LICENSE](LICENSE).

## Links

- [Remotion](https://www.remotion.dev) - React video framework
- [Whisper](https://github.com/openai/whisper) - Speech recognition
- [stable-ts](https://github.com/jianfch/stable-ts) - Stabilized timestamps for Whisper
