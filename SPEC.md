# Remotion Lyric Video Generator — Claude Code Spec

## Overview

Build a fully automated CLI tool that takes an audio file (MP3 or WAV) and generates
a dynamic, animated lyric music video (MP4) in the style of modern YouTube lyric videos.

**Stack:**
- **Whisper (Python)** — word-level transcription with timestamps
- **Remotion (React/TypeScript)** — animated video composition
- **FFmpeg** — final audio mux (handled by Remotion internally)
- **Pixi** — Python dependency management for the transcription step
- **Node.js / npm** — Remotion and its dependencies

---

## Repository Structure

```
lyric-video-remotion/
├── pixi.toml                  # Python env for Whisper transcription
├── package.json               # Node deps for Remotion
├── tsconfig.json
├── remotion.config.ts
├── README.md
├── SPEC.md
│
├── scripts/
│   ├── transcribe.py          # Whisper transcription → transcript.json
│   └── generate.mjs           # End-to-end pipeline convenience wrapper
│
└── src/
    ├── index.ts               # Remotion registerRoot
    ├── Root.tsx               # Registers all compositions
    ├── types.ts               # Shared TypeScript types
    │
    ├── LyricVideo/
    │   ├── LyricVideo.tsx     # Main composition
    │   ├── LyricLine.tsx      # Animated line component
    │   ├── LyricWord.tsx      # Animated word component
    │   ├── Background.tsx     # Background layer (gradient / particles)
    │   └── AudioWaveform.tsx  # Optional audio visualizer bars
    │
    └── styles/
        └── presets.ts         # Style preset definitions
```

---

## Pixi Setup (Whisper / Python)

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
1.  pixi run transcribe -- --input song.mp3 --output src/transcript.json
2.  npm run generate -- --input song.mp3 --style neon --output out/video.mp4
        ↓  (generate.mjs runs transcription then Remotion render)
    out/video.mp4  ✅
```

---

## Step 1 — Transcription (`scripts/transcribe.py`)

- Accept CLI args: `--input`, `--output`, `--model` (default: `base`)
- Load Whisper model, transcribe with `word_timestamps=True`
- Extract word-level data from `segment["words"]`
- If word timestamps missing for a segment, distribute duration evenly across its words
- Group words into **lines** (see grouping rules below)
- Output a single JSON file:

```json
{
  "duration": 214.5,
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

**Line grouping rules:**
- Max 6 words per line
- Start a new line if silence gap between words > 1.2 seconds
- Start a new line if word ends with `.`, `?`, or `!`

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

Define and export a `STYLES` record:

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
- Use `useCurrentFrame()` for frame-accurate timing
- `const t = frame / fps` — current time in seconds
- Render `<Audio src={audioSrc} />` for audio playback
- Render `<Background style={preset} frame={frame} fps={fps} />`
- Determine `activeLine`, `prevLine`, `nextLine` from `t` and transcript lines
- Render up to 3 `<LyricLine>` components: prev (above center), active (center), next (below center)
- Wrap each in a `<Sequence>` timed to the line's start/end
- Layout: vertically centered stack, active line at center, prev/next offset by ~120px

**Composition config (`src/Root.tsx`):**
- Width: 1920, Height: 1080, FPS: 30
- Duration frames: `Math.ceil(transcript.duration * 30)`
- Pass transcript from a loaded JSON prop

---

## LyricLine Component (`src/LyricVideo/LyricLine.tsx`)

Props:
```ts
interface LyricLineProps {
  line: Line;
  isActive: boolean;
  style: StylePreset;
  fps: number;
  globalFrame: number;
}
```

- When `isActive`: render each word as `<LyricWord />`
- When not active: render whole line as single element in `inactiveColor` at 60% font size
- Apply `lineAnimation` on entrance when becoming active:
  - `fade`: `interpolate(localFrame, [0, 8], [0, 1])` for opacity
  - `slide-up`: `spring({ frame: localFrame, fps, config: { damping: 14 } })` for translateY
  - `zoom`: `spring()` for scale from 0.85 → 1.0

---

## LyricWord Component (`src/LyricVideo/LyricWord.tsx`)

Props:
```ts
interface LyricWordProps {
  word: Word;
  isHighlighted: boolean;
  style: StylePreset;
  fps: number;
  globalFrame: number;
}
```

When `isHighlighted`, apply `wordAnimation`:
- `pop`: `spring()` scale 1.0 → 1.15, color → `highlightColor`
- `slide-up`: `spring()` translateY +10px → 0, color → `highlightColor`
- `fade`: `interpolate()` opacity transition, color → `highlightColor`
- `slam`: fast `spring({ stiffness: 400, damping: 10 })` scale 1.3 → 1.0 with slight rotation snap, color → `highlightColor`

Use `interpolateColors()` from Remotion for color transitions.

Apply glow via CSS `text-shadow` when `style.glow`:
```
text-shadow: 0 0 8px {glowColor}, 0 0 20px {glowColor}, 0 0 40px {glowColor}
```

---

## Background Component (`src/LyricVideo/Background.tsx`)

Props: `style: StylePreset, frame: number, fps: number`

- If `style.bgGradient`: animated gradient that slowly shifts using `Math.sin(frame / fps / 8)`
- If `style.particles`: render 40 absolutely-positioned particle `<div>`s, each with a
  unique sine-wave x/y motion derived from `frame` and a per-particle seed. Use
  `useMemo()` to generate stable seeds.
- Otherwise: solid `bgColor` fill

---

## AudioWaveform Component (`src/LyricVideo/AudioWaveform.tsx`) *(nice-to-have)*

- Use `@remotion/media-utils` `visualizeAudio()` hook
- Render a row of frequency bars at the bottom of the frame
- Color bars with `style.highlightColor` at 40% opacity
- Bar heights driven by frequency data, capped and normalized

---

## Convenience Wrapper (`scripts/generate.mjs`)

Single command that runs the full pipeline:

```
node scripts/generate.mjs --input song.mp3 --style neon --output out/video.mp4
```

Steps:
1. Validate `--input` file exists
2. Run `pixi run transcribe -- --input {input} --output src/transcript.json`
3. Copy audio to `public/audio.mp3`
4. Run `npx remotion render LyricVideo {output} --props='{...}'`
   with props: `{ transcriptPath: "src/transcript.json", style, audioSrc: "/audio.mp3" }`
5. Print: ✅ Done → output path + file size

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

- `pixi` not found → print `https://pixi.sh` install link, exit 1
- `node` not found → print install instructions, exit 1
- Audio file missing → clear message, exit 1
- Whisper no word timestamps → warn, fall back to segment-level timing
- Remotion render fails → surface full stderr

---

## README.md

Include:
- One paragraph description
- ASCII architecture diagram
- Prerequisites: Pixi, Node.js 18+
- Setup: `pixi install && npm install`
- Usage examples for all 5 style presets
- "How it works" section
- Render time expectations (~5–15 min for a 3-min song on a modern laptop)
- Link to Remotion docs: https://www.remotion.dev

---

## Nice-to-Have

- `--preview` flag: render only first 15 seconds
- `--open` flag: open Remotion Studio before rendering
- Fade-to-black 2s at start and end of video
- Beat detection via `getAudioData()` — subtle camera scale pulse on detected beats
- `--bg-video` flag: loop a user-provided `.mp4` as background instead of particles
