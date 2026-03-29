# Remotion Lyric Video Generator — Claude Code Spec

## Overview

Build a fully automated CLI tool that takes an audio file (MP3 or WAV) and generates
a dynamic, animated lyric music video (MP4) in the style of modern YouTube lyric videos.

**Stack:**
- **Whisper / stable-ts (Python)** — word-level transcription or forced alignment
- **Remotion (React/TypeScript)** — animated video composition
- **Pixi** — Python dependency management for the transcription step
- **Node.js / npm** — Remotion and its dependencies

---

## Repository Structure

```
lyric-video-remotion/
├── pixi.toml
├── package.json
├── tsconfig.json
├── remotion.config.ts
├── README.md
├── SPEC.md
│
├── scripts/
│   ├── transcribe.py          # Transcription or forced alignment → transcript.json
│   └── generate.mjs           # End-to-end pipeline convenience wrapper
│
└── src/
    ├── index.ts
    ├── Root.tsx
    ├── types.ts
    │
    ├── LyricVideo/
    │   ├── LyricVideo.tsx
    │   ├── LyricLine.tsx
    │   ├── LyricWord.tsx
    │   ├── Background.tsx
    │   └── AudioWaveform.tsx
    │
    └── styles/
        └── presets.ts
```

---

## Pixi Setup

### `pixi.toml`

```toml
[project]
name = "lyric-video-remotion"
version = "0.1.0"
channels = ["conda-forge"]
platforms = ["osx-arm64", "osx-64", "linux-64", "win-64"]

[dependencies]
python = ">=3.11"
ffmpeg = "*"

[pypi-dependencies]
openai-whisper = "*"
stable-ts = "*"

[tasks]
transcribe = "python scripts/transcribe.py"
```

---

## Node / Remotion Setup

### `package.json`

```json
{
  "name": "lyric-video-remotion",
  "scripts": {
    "start": "npx remotion studio",
    "render": "npx remotion render LyricVideo out/video.mp4",
    "generate": "node scripts/generate.mjs"
  },
  "dependencies": {
    "@remotion/cli": "^4.0.0",
    "@remotion/media-utils": "^4.0.0",
    "remotion": "^4.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0"
  }
}
```

---

## Full Pipeline

```
# With lyrics file (best accuracy — forced alignment):
node scripts/generate.mjs --input song.mp3 --lyrics lyrics.txt --style neon --output out/video.mp4

# Without lyrics file (Whisper auto-transcription):
node scripts/generate.mjs --input song.mp3 --style neon --output out/video.mp4
```

---

## Step 1 — Transcription (`scripts/transcribe.py`)

### CLI Arguments

| Argument    | Required | Default | Description                                      |
|-------------|----------|---------|--------------------------------------------------|
| `--input`   | Yes      | —       | Path to audio file (.mp3 or .wav)                |
| `--output`  | Yes      | —       | Path to write transcript.json                    |
| `--lyrics`  | No       | None    | Path to a plain .txt file with known lyrics      |
| `--model`   | No       | `base`  | Whisper model size                               |
| `--language`| No       | None    | Language code e.g. `en`, `es` (auto-detect if omitted) |

### Mode A — Forced Alignment (when `--lyrics` is provided)

Use `stable-ts` to align the known lyrics to the audio:

```python
import stable_whisper

model = stable_whisper.load_model(model_size)
result = model.align(audio_path, lyrics_text, language=language)
```

- Read the lyrics file, strip blank lines, normalize whitespace
- Pass the full lyrics string to `model.align()`
- Extract word-level timestamps from the result
- Print: `✅ Forced alignment complete — {n} words aligned`

**Advantages of this mode:**
- 100% correct words (no guessing)
- Better timestamp accuracy because the model focuses only on timing
- Works well even on noisy recordings

### Mode B — Auto Transcription (when `--lyrics` is NOT provided)

Use standard Whisper transcription:

```python
import whisper

model = whisper.load_model(model_size)
result = model.transcribe(audio_path, word_timestamps=True, language=language)
```

- Extract word-level data from `segment["words"]`
- If word timestamps are missing for a segment, distribute evenly across its duration
- Print: `✅ Transcription complete — {n} words across {m} segments`

### Lyrics File Format (`lyrics.txt`)

Plain text, one line per lyric line. Blank lines are ignored. Example:

```
Never gonna give you up
Never gonna let you down
Never gonna run around and desert you
```

The file does **not** need timestamps — those come from the audio alignment.

### Line Grouping (both modes)

After extracting words, group them into display lines:

- If `--lyrics` was provided: use the original line breaks from the lyrics file directly
  (each text line in the file becomes one display line). Split lines longer than 8 words
  at the nearest word boundary.
- If auto-transcribing: group by max 6 words per line or silence gap > 1.2s or
  sentence-ending punctuation.

### Output JSON

```json
{
  "duration": 214.5,
  "mode": "aligned",
  "words": [
    { "word": "Never", "start": 0.52, "end": 0.81 },
    { "word": "gonna", "start": 0.81, "end": 1.05 }
  ],
  "lines": [
    {
      "text": "Never gonna give you up",
      "start": 0.52,
      "end": 2.10,
      "words": [
        { "word": "Never", "start": 0.52, "end": 0.81 },
        { "word": "gonna", "start": 0.81, "end": 1.05 },
        { "word": "give",  "start": 1.05, "end": 1.30 },
        { "word": "you",   "start": 1.30, "end": 1.55 },
        { "word": "up",    "start": 1.55, "end": 2.10 }
      ]
    }
  ]
}
```

`"mode"` field is either `"aligned"` or `"transcribed"`.

---

## TypeScript Types (`src/types.ts`)

```ts
export interface Word {
  word: string;
  start: number;
  end: number;
}

export interface Line {
  text: string;
  start: number;
  end: number;
  words: Word[];
}

export interface Transcript {
  duration: number;
  mode: "aligned" | "transcribed";
  words: Word[];
  lines: Line[];
}

export interface StylePreset {
  bgColor: string;
  bgGradient?: [string, string];
  activeColor: string;
  inactiveColor: string;
  highlightColor: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: number;
  glow: boolean;
  glowColor?: string;
  glowRadius?: number;
  wordAnimation: "pop" | "slide-up" | "fade" | "slam";
  lineAnimation: "fade" | "slide-up" | "zoom";
  particles: boolean;
}
```

---

## Style Presets (`src/styles/presets.ts`)

### `neon`
- Black background, cyan active (`#00ffff`), magenta highlight (`#ff00ff`)
- Glow on, cyan glow
- `wordAnimation: "pop"`, `lineAnimation: "fade"`
- Particles: floating cyan dots

### `minimal`
- White background, near-black text (`#111111`), grey inactive (`#aaaaaa`)
- No glow, no particles
- `wordAnimation: "fade"`, `lineAnimation: "slide-up"`

### `retro`
- Dark brown background (`#1a0a00`), golden yellow active (`#ffcc00`), orange highlight (`#ff6600`)
- Glow on, yellow glow
- `wordAnimation: "slam"`, `lineAnimation: "zoom"`
- Particles: warm-colored floating specks

### `dreamy`
- Deep space background (`#0a0018`), lavender active (`#cc99ff`), pink highlight (`#ff99cc`)
- Strong glow on
- `wordAnimation: "slide-up"`, `lineAnimation: "fade"`
- Particles: slow drifting pastel stars

### `bold`
- Pure black, white active, yellow highlight (`#ffff00`)
- No glow, no particles
- `wordAnimation: "slam"`, `lineAnimation: "slide-up"`

---

## Main Composition (`src/LyricVideo/LyricVideo.tsx`)

Props:
```ts
interface LyricVideoProps {
  transcript: Transcript;
  style: keyof typeof STYLES;
  audioSrc: string;
}
```

- Use `useVideoConfig()` for fps/width/height
- Use `useCurrentFrame()` — `const t = frame / fps`
- Render `<Audio src={audioSrc} />`
- Render `<Background style={preset} frame={frame} fps={fps} />`
- Determine `activeLine`, `prevLine`, `nextLine` from `t`
- Render up to 3 `<LyricLine>` components wrapped in `<Sequence>` timed to each line
- Layout: active line centered, prev/next offset ±120px vertically

**Composition config (`src/Root.tsx`):**
- Width: 1920, Height: 1080, FPS: 30
- Duration frames: `Math.ceil(transcript.duration * 30)`

---

## LyricLine Component (`src/LyricVideo/LyricLine.tsx`)

- When active: render each word as `<LyricWord />`
- When inactive: render whole line in `inactiveColor` at 60% font size
- Line entrance animations:
  - `fade`: `interpolate(localFrame, [0, 8], [0, 1])`
  - `slide-up`: `spring({ frame: localFrame, fps, config: { damping: 14 } })` translateY
  - `zoom`: `spring()` scale 0.85 → 1.0

---

## LyricWord Component (`src/LyricVideo/LyricWord.tsx`)

Word animations when highlighted:
- `pop`: `spring()` scale 1.0 → 1.15, color → `highlightColor`
- `slide-up`: `spring()` translateY +10px → 0, color → `highlightColor`
- `fade`: `interpolate()` opacity + color transition
- `slam`: fast `spring({ stiffness: 400, damping: 10 })` scale 1.3 → 1.0 + slight rotation

Use `interpolateColors()` for color transitions.
Apply glow via CSS `text-shadow` when `style.glow` is true.

---

## Background Component (`src/LyricVideo/Background.tsx`)

- Gradient: animated hue shift using `Math.sin(frame / fps / 8)`
- Particles: 40 absolutely-positioned divs with sine-wave motion, seeded per-particle
- Solid: plain `bgColor` fill

---

## AudioWaveform Component *(nice-to-have)*

- Use `@remotion/media-utils` `visualizeAudio()`
- Frequency bars at bottom of frame in `highlightColor` at 40% opacity

---

## Convenience Wrapper (`scripts/generate.mjs`)

```
node scripts/generate.mjs --input song.mp3 [--lyrics lyrics.txt] --style neon --output out/video.mp4
```

Steps:
1. Validate `--input` exists
2. Run `pixi run transcribe -- --input {input} [--lyrics {lyrics}] --output src/transcript.json`
3. Copy audio to `public/audio.mp3`
4. Run `npx remotion render LyricVideo {output} --props='{...}'`
5. Print ✅ with output path and file size

---

## `remotion.config.ts`

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
```

---

## Error Handling

- `pixi` not found → print https://pixi.sh, exit 1
- `node` not found → print install instructions, exit 1
- Audio file missing → clear message, exit 1
- Lyrics file specified but not found → clear message, exit 1
- `stable-ts` alignment fails → warn and fall back to auto-transcription mode automatically
- Whisper no word timestamps → warn, fall back to segment-level timing
- Remotion render fails → surface full stderr

---

## README.md

Include:
- One paragraph description
- ASCII architecture diagram showing both transcription modes
- Prerequisites: Pixi, Node.js 18+
- Setup: `pixi install && npm install`
- Usage examples: with and without lyrics file, all 5 style presets
- "How it works" section covering both modes
- When to use forced alignment vs auto-transcription
- Render time expectations
- Link to Remotion docs: https://www.remotion.dev

---

## Nice-to-Have

- `--preview` flag: render only first 15 seconds
- `--open` flag: open Remotion Studio before rendering
- Fade-to-black 2s at start and end
- Beat detection via `getAudioData()` — subtle scale pulse on beats
- `--bg-video` flag: loop a `.mp4` as background instead of particles
