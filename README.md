# Dynamic Typography Videos

Generate animated lyric videos and karaoke videos from audio files. Two-stage pipeline: Python (Whisper/stable-ts) for word-level transcription, then Remotion (React/TypeScript) for animated video rendering.

## Features

- **Lyric videos** with word-by-word highlight animations synced to audio
- **Karaoke videos** with left-to-right color wipe, full-verse display, instrumental breaks, and countdown timer
- **Forced alignment** from a lyrics file for perfect word accuracy
- **Auto-transcription** via Whisper when no lyrics are available
- **5 style presets** (neon, minimal, retro, dreamy, bold)
- **Optional background image** with Ken Burns pan/zoom; font and shadow colors are auto-picked for contrast from the image's average luminance (WCAG 2.1)
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

### Folder-based (recommended)

Organize each song in its own folder under `contents/`:

```
contents/my_song/
  song.mp3               # audio file
  lyrics.txt             # lyrics (one line per line, blank lines between verses)
  instrumental.mp3       # instrumental track (for karaoke)
  song.yaml              # optional config overrides
```

Then generate with a single command:

```bash
node scripts/generate.mjs contents/my_song/
```

Output goes to the song folder: `contents/my_song/My Song.mp4` (and `My Song karaoke.mp4` if karaoke is enabled).

### Flag-based

```bash
# Lyric video
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --style neon

# Karaoke video
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --instrumental instrumental.mp3 --style neon
```

Output defaults to `~/Videos/<song name>.mp4`. Use `--output` to override.

## Folder-Based Workflow

### Convention Defaults

If you follow the naming conventions, no config file is needed. The title is derived from the folder name (underscores and dashes become spaces, title-cased).

### song.yaml

Override any defaults with an optional `song.yaml`:

```yaml
title: "My Song Title"
song_path: song.mp3
lyrics_path: lyrics.txt
instrumental_path: instrumental.mp3
aligned_lyrics: lyrics.json
background: background.jpg
generate_karaoke: true
style: neon
language: es
model: base
```

All fields are optional. When `generate_karaoke: true`, both a lyric video and a karaoke video are generated. Lyrics and instrumental files are required for karaoke mode.

### Config Priority

CLI flags > song.yaml > convention defaults

```bash
# Override style from command line
node scripts/generate.mjs contents/my_song/ --style bold

# Write output to a different folder
node scripts/generate.mjs contents/my_song/ --output-folder ~/Videos
```

### Transcript Caching

Aligned transcripts are saved as `lyrics.json` in the song folder. On subsequent runs, transcription is skipped and the cached file is reused. You can manually edit `lyrics.json` to fix word timing or text errors. Use `--retranscribe` to force re-transcription.

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

| Flag                | Default                    | Description                              |
|---------------------|----------------------------|------------------------------------------|
| `--input`           | `song.mp3` (folder mode)   | Path to audio file (.mp3 or .wav)        |
| `--lyrics`          | `lyrics.txt` (folder mode) | Path to lyrics .txt for forced alignment |
| `--instrumental`    | none                       | Path to instrumental track (enables karaoke mode) |
| `--background`      | none                       | Path to background image (auto-picks accessible font and shadow colors via WCAG luminance) |
| `--style`           | `minimal` folder / `neon` flag (or `minimal` when `--background` is set) | Style preset name |
| `--output`          | song folder or `~/Videos/` | Output video path                        |
| `--output-folder`   | song folder                | Write output videos to this directory    |
| `--model`           | `base`                     | Whisper model size (tiny/base/small/medium/large) |
| `--language`        | auto                       | Language code (en, es, etc.)             |
| `--title`           | derived from folder name   | Override the video title                 |
| `--preview`         | false                      | Render only first 15 seconds             |
| `--retranscribe`    | false                      | Force re-transcription (ignore cache)    |
| `--only-transcribe` | false                      | Transcribe only, skip rendering          |
| `--only-lyric`      | false                      | Render only the lyric video (skip karaoke) |
| `--only-karaoke`    | false                      | Render only the karaoke video (skip lyric) |
| `--open`            | false                      | Open Remotion Studio before rendering    |

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

# Render directly via Remotion (requires src/transcript.json to already exist
# and the default props in Root.tsx; mostly useful when iterating on components)
npm run render

# Transcribe only, skip rendering
node scripts/generate.mjs contents/my_song/ --only-transcribe

# Run tests
npx vitest run
pixi run python -m pytest tests/ -v
```

## Fixing Transcription Errors

In folder mode, the transcript is cached to `<song folder>/lyrics.json` after the first run. Edit that file, then re-run `generate.mjs` - the cached transcript is reused automatically unless `--retranscribe` is passed. In flag-based mode, the transcript is written to `src/transcript.json`; edit it in place.

- **Wrong word**: Find it in the top-level `words[]` array and change the `"word"` field. Then update the matching `lines[].text` entry so the display line matches (lines store rendered text separately from `wordIndices` into `words[]`).
- **Bad line break**: Split or merge entries in `lines[]`, adjusting their `wordIndices` and `text`. `verses[].lineIndices` point into `lines[]`, so update them if you add or remove lines.
- **Inaccurate timestamps**: Try `--model small` or `--model medium` for better accuracy.

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
