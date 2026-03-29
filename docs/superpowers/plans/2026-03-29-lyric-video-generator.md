# Lyric Video Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fully automated CLI tool that takes an audio file and generates a dynamic, animated lyric music video (MP4) with word-level synchronization.

**Architecture:** Two-stage pipeline - Python (Whisper/stable-ts) produces a word-timestamped transcript JSON, then Remotion (React/TypeScript) renders animated video at 1920x1080@30fps. Supports two modes: forced alignment from a lyrics file (stable-ts) or auto-transcription (Whisper).

**Tech Stack:** Python 3.11+ (Whisper, stable-ts, Pixi), TypeScript/React (Remotion v4), Node.js 18+

**Spec:** `docs/SPEC_remotion.md`

---

## File Structure

```
dynamic-typography-videos/
  .gitignore
  pixi.toml                          # Python env: whisper + stable-ts
  package.json                       # Node deps: remotion v4
  tsconfig.json                      # TypeScript config
  remotion.config.ts                 # Remotion render settings
  README.md                          # Documentation
  public/                            # Static assets for Remotion (audio copied here)
  out/                               # Rendered output directory
  scripts/
    transcribe.py                    # Whisper/stable-ts transcription
    generate.mjs                     # End-to-end pipeline wrapper
  src/
    index.ts                         # Remotion registerRoot entry point
    Root.tsx                          # Composition registry
    types.ts                          # Shared TypeScript interfaces
    timing.ts                         # Pure timing logic (active line/word detection)
    LyricVideo/
      LyricVideo.tsx                 # Main composition
      LyricLine.tsx                  # Animated line component
      LyricWord.tsx                  # Animated word component
      Background.tsx                 # Background layer (gradient/particles/solid)
      AudioWaveform.tsx              # Optional frequency visualizer
    styles/
      presets.ts                     # 5 style preset definitions
  tests/
    test_transcribe.py               # Python transcription unit tests
    timing.test.ts                   # TypeScript timing logic tests
```

**Design note:** `src/timing.ts` extracts the pure logic for finding active/prev/next lines and highlighted words from the components. This makes the timing logic independently testable without Remotion's rendering context.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `.gitignore`
- Create: `pixi.toml`
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `remotion.config.ts`
- Create: `public/.gitkeep`
- Create: `out/.gitkeep`

- [ ] **Step 1: Initialize git repo**

```bash
cd /home/chuck/devel/dynamic-typography-videos
git init
```

- [ ] **Step 2: Create .gitignore**

```gitignore
node_modules/
.pixi/
out/*.mp4
public/audio.*
src/transcript.json
*.pyc
__pycache__/
.env
dist/
CLAUDE.md
```

- [ ] **Step 3: Create pixi.toml**

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

- [ ] **Step 4: Create package.json**

Remotion v4 requires all `@remotion/*` packages pinned to the same version. React and react-dom are required peer dependencies.

```json
{
  "name": "lyric-video-remotion",
  "private": true,
  "scripts": {
    "start": "npx remotion studio",
    "render": "npx remotion render LyricVideo out/video.mp4",
    "generate": "node scripts/generate.mjs",
    "test": "npx vitest run"
  },
  "dependencies": {
    "@remotion/cli": "4.0.441",
    "@remotion/media-utils": "4.0.441",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "remotion": "4.0.441"
  },
  "devDependencies": {
    "@remotion/bundler": "4.0.441",
    "@remotion/renderer": "4.0.441",
    "@types/react": "^18.2.0",
    "typescript": "^5.0.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 5: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 6: Create remotion.config.ts**

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(4);
```

- [ ] **Step 7: Create placeholder directories**

```bash
mkdir -p public out scripts src/LyricVideo src/styles tests
touch public/.gitkeep out/.gitkeep
```

- [ ] **Step 8: Install dependencies**

```bash
npm install
pixi install
```

- [ ] **Step 9: Commit**

```bash
git add .gitignore pixi.toml package.json tsconfig.json remotion.config.ts public/.gitkeep out/.gitkeep
git commit -m "scaffold: project config for Remotion + Whisper pipeline"
```

---

### Task 2: TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create types.ts**

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

- [ ] **Step 2: Verify types compile**

```bash
npx tsc --noEmit src/types.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript interfaces for transcript and style presets"
```

---

### Task 3: Style Presets

**Files:**
- Create: `src/styles/presets.ts`

- [ ] **Step 1: Create presets.ts**

```ts
import type { StylePreset } from "../types";

export const STYLES: Record<string, StylePreset> = {
  neon: {
    bgColor: "#000000",
    bgGradient: ["#000000", "#0a0a2e"],
    activeColor: "#00ffff",
    inactiveColor: "#336666",
    highlightColor: "#ff00ff",
    fontSize: 72,
    fontFamily: "Arial, sans-serif",
    fontWeight: 700,
    glow: true,
    glowColor: "#00ffff",
    glowRadius: 20,
    wordAnimation: "pop",
    lineAnimation: "fade",
    particles: true,
  },
  minimal: {
    bgColor: "#ffffff",
    activeColor: "#111111",
    inactiveColor: "#aaaaaa",
    highlightColor: "#111111",
    fontSize: 64,
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    glow: false,
    wordAnimation: "fade",
    lineAnimation: "slide-up",
    particles: false,
  },
  retro: {
    bgColor: "#1a0a00",
    bgGradient: ["#1a0a00", "#2a1500"],
    activeColor: "#ffcc00",
    inactiveColor: "#664400",
    highlightColor: "#ff6600",
    fontSize: 72,
    fontFamily: "Impact, sans-serif",
    fontWeight: 700,
    glow: true,
    glowColor: "#ffcc00",
    glowRadius: 15,
    wordAnimation: "slam",
    lineAnimation: "zoom",
    particles: true,
  },
  dreamy: {
    bgColor: "#0a0018",
    bgGradient: ["#0a0018", "#1a0030"],
    activeColor: "#cc99ff",
    inactiveColor: "#553377",
    highlightColor: "#ff99cc",
    fontSize: 68,
    fontFamily: "Georgia, serif",
    fontWeight: 400,
    glow: true,
    glowColor: "#cc99ff",
    glowRadius: 25,
    wordAnimation: "slide-up",
    lineAnimation: "fade",
    particles: true,
  },
  bold: {
    bgColor: "#000000",
    activeColor: "#ffffff",
    inactiveColor: "#555555",
    highlightColor: "#ffff00",
    fontSize: 80,
    fontFamily: "Arial Black, sans-serif",
    fontWeight: 900,
    glow: false,
    wordAnimation: "slam",
    lineAnimation: "slide-up",
    particles: false,
  },
};
```

- [ ] **Step 2: Verify presets compile**

```bash
npx tsc --noEmit src/styles/presets.ts
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/presets.ts
git commit -m "feat: add 5 style presets (neon, minimal, retro, dreamy, bold)"
```

---

### Task 4: Timing Logic (Pure Functions)

**Files:**
- Create: `src/timing.ts`
- Create: `tests/timing.test.ts`

- [ ] **Step 1: Write failing tests for timing logic**

Create `tests/timing.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { findActiveLine, isWordHighlighted } from "../src/timing";
import type { Line, Word } from "../src/types";

const lines: Line[] = [
  {
    text: "Never gonna give you up",
    start: 0.5,
    end: 2.1,
    words: [
      { word: "Never", start: 0.5, end: 0.8 },
      { word: "gonna", start: 0.8, end: 1.05 },
      { word: "give", start: 1.05, end: 1.3 },
      { word: "you", start: 1.3, end: 1.55 },
      { word: "up", start: 1.55, end: 2.1 },
    ],
  },
  {
    text: "Never gonna let you down",
    start: 2.5,
    end: 4.0,
    words: [
      { word: "Never", start: 2.5, end: 2.8 },
      { word: "gonna", start: 2.8, end: 3.0 },
      { word: "let", start: 3.0, end: 3.2 },
      { word: "you", start: 3.2, end: 3.5 },
      { word: "down", start: 3.5, end: 4.0 },
    ],
  },
  {
    text: "Never gonna run around",
    start: 4.5,
    end: 6.0,
    words: [
      { word: "Never", start: 4.5, end: 4.8 },
      { word: "gonna", start: 4.8, end: 5.0 },
      { word: "run", start: 5.0, end: 5.3 },
      { word: "around", start: 5.3, end: 6.0 },
    ],
  },
];

describe("findActiveLine", () => {
  it("returns null indices before any line starts", () => {
    const result = findActiveLine(lines, 0.0);
    expect(result.activeIndex).toBe(null);
    expect(result.prevIndex).toBe(null);
    expect(result.nextIndex).toBe(0);
  });

  it("returns the first line when time is within its range", () => {
    const result = findActiveLine(lines, 1.0);
    expect(result.activeIndex).toBe(0);
    expect(result.prevIndex).toBe(null);
    expect(result.nextIndex).toBe(1);
  });

  it("returns the second line when time is within its range", () => {
    const result = findActiveLine(lines, 3.0);
    expect(result.activeIndex).toBe(1);
    expect(result.prevIndex).toBe(0);
    expect(result.nextIndex).toBe(2);
  });

  it("returns the last line with no next", () => {
    const result = findActiveLine(lines, 5.5);
    expect(result.activeIndex).toBe(2);
    expect(result.prevIndex).toBe(1);
    expect(result.nextIndex).toBe(null);
  });

  it("returns null active in gap between lines, shows prev and next", () => {
    const result = findActiveLine(lines, 2.3);
    expect(result.activeIndex).toBe(null);
    expect(result.prevIndex).toBe(0);
    expect(result.nextIndex).toBe(1);
  });
});

describe("isWordHighlighted", () => {
  it("returns true when current time falls within word range", () => {
    const word: Word = { word: "gonna", start: 0.8, end: 1.05 };
    expect(isWordHighlighted(word, 0.9)).toBe(true);
  });

  it("returns true at word start boundary", () => {
    const word: Word = { word: "gonna", start: 0.8, end: 1.05 };
    expect(isWordHighlighted(word, 0.8)).toBe(true);
  });

  it("returns false before word starts", () => {
    const word: Word = { word: "gonna", start: 0.8, end: 1.05 };
    expect(isWordHighlighted(word, 0.7)).toBe(false);
  });

  it("returns false after word ends", () => {
    const word: Word = { word: "gonna", start: 0.8, end: 1.05 };
    expect(isWordHighlighted(word, 1.1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/timing.test.ts
```

Expected: FAIL - module `../src/timing` not found.

- [ ] **Step 3: Implement timing logic**

Create `src/timing.ts`:

```ts
import type { Line, Word } from "./types";

export interface ActiveLineResult {
  activeIndex: number | null;
  prevIndex: number | null;
  nextIndex: number | null;
}

export function findActiveLine(
  lines: Line[],
  currentTime: number,
): ActiveLineResult {
  let activeIndex: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].start && currentTime <= lines[i].end) {
      activeIndex = i;
      break;
    }
  }

  if (activeIndex !== null) {
    return {
      activeIndex,
      prevIndex: activeIndex > 0 ? activeIndex - 1 : null,
      nextIndex: activeIndex < lines.length - 1 ? activeIndex + 1 : null,
    };
  }

  // No active line - find surrounding lines based on current time
  let prevIndex: number | null = null;
  let nextIndex: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].end <= currentTime) {
      prevIndex = i;
    }
    if (lines[i].start > currentTime && nextIndex === null) {
      nextIndex = i;
    }
  }

  return { activeIndex: null, prevIndex, nextIndex };
}

export function isWordHighlighted(word: Word, currentTime: number): boolean {
  return currentTime >= word.start && currentTime < word.end;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run tests/timing.test.ts
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/timing.ts tests/timing.test.ts
git commit -m "feat: add timing logic for active line and word highlighting"
```

---

### Task 5: Python Transcription Script

**Files:**
- Create: `scripts/transcribe.py`
- Create: `tests/test_transcribe.py`

- [ ] **Step 1: Write tests for line grouping logic**

Create `tests/test_transcribe.py`:

```python
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
from transcribe import group_words_auto, group_words_from_lyrics


class TestGroupWordsAuto:
    """Tests for auto-transcription line grouping."""

    def test_groups_by_max_six_words(self):
        words = [
            {"word": f"word{i}", "start": float(i), "end": float(i) + 0.5}
            for i in range(8)
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert len(lines[0]["words"]) == 6
        assert len(lines[1]["words"]) == 2

    def test_splits_on_silence_gap(self):
        words = [
            {"word": "hello", "start": 0.0, "end": 0.5},
            {"word": "world", "start": 0.5, "end": 1.0},
            {"word": "foo", "start": 3.0, "end": 3.5},  # 2.0s gap > 1.2s threshold
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello world"
        assert lines[1]["text"] == "foo"

    def test_splits_on_sentence_ending_punctuation(self):
        words = [
            {"word": "hello.", "start": 0.0, "end": 0.5},
            {"word": "world", "start": 0.6, "end": 1.0},
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello."
        assert lines[1]["text"] == "world"

    def test_line_start_end_matches_words(self):
        words = [
            {"word": "hello", "start": 1.0, "end": 1.5},
            {"word": "world", "start": 1.5, "end": 2.0},
        ]
        lines = group_words_auto(words)
        assert lines[0]["start"] == 1.0
        assert lines[0]["end"] == 2.0

    def test_empty_words_returns_empty(self):
        assert group_words_auto([]) == []


class TestGroupWordsFromLyrics:
    """Tests for lyrics-file line grouping."""

    def test_maps_words_to_lyrics_lines(self):
        lyrics_lines = ["hello world", "foo bar"]
        words = [
            {"word": "hello", "start": 0.0, "end": 0.3},
            {"word": "world", "start": 0.3, "end": 0.6},
            {"word": "foo", "start": 1.0, "end": 1.3},
            {"word": "bar", "start": 1.3, "end": 1.6},
        ]
        lines = group_words_from_lyrics(words, lyrics_lines)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello world"
        assert lines[1]["text"] == "foo bar"

    def test_splits_long_lines_at_eight_words(self):
        lyrics_lines = ["one two three four five six seven eight nine ten"]
        words = [
            {"word": w, "start": float(i), "end": float(i) + 0.5}
            for i, w in enumerate(
                ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"]
            )
        ]
        lines = group_words_from_lyrics(words, lyrics_lines)
        assert len(lines) == 2
        assert len(lines[0]["words"]) == 8
        assert len(lines[1]["words"]) == 2

    def test_empty_inputs(self):
        assert group_words_from_lyrics([], []) == []

    def test_line_timestamps_from_words(self):
        lyrics_lines = ["hello world"]
        words = [
            {"word": "hello", "start": 2.5, "end": 3.0},
            {"word": "world", "start": 3.0, "end": 3.5},
        ]
        lines = group_words_from_lyrics(words, lyrics_lines)
        assert lines[0]["start"] == 2.5
        assert lines[0]["end"] == 3.5
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pixi run python -m pytest tests/test_transcribe.py -v
```

Expected: FAIL - cannot import `transcribe`.

- [ ] **Step 3: Implement transcribe.py**

Create `scripts/transcribe.py`:

```python
"""Transcribe audio to word-level timestamped JSON.

Mode A (forced alignment): when --lyrics is provided, uses stable-ts to align
known lyrics against the audio for precise word timing.

Mode B (auto-transcription): when no lyrics are provided, uses Whisper to
transcribe and extract word-level timestamps.
"""

import argparse
import json
import sys
from pathlib import Path


def group_words_auto(words: list[dict]) -> list[dict]:
    """Group words into display lines for auto-transcription mode.

    Rules:
    - Max 6 words per line
    - New line on silence gap > 1.2s between consecutive words
    - New line after sentence-ending punctuation (. ? !)
    """
    if not words:
        return []

    lines = []
    current_words = [words[0]]

    for i in range(1, len(words)):
        prev_word = words[i - 1]
        curr_word = words[i]

        silence_gap = curr_word["start"] - prev_word["end"]
        prev_ends_sentence = prev_word["word"].rstrip().endswith((".", "?", "!"))

        if len(current_words) >= 6 or silence_gap > 1.2 or prev_ends_sentence:
            lines.append(_make_line(current_words))
            current_words = [curr_word]
        else:
            current_words.append(curr_word)

    if current_words:
        lines.append(_make_line(current_words))

    return lines


def group_words_from_lyrics(
    words: list[dict], lyrics_lines: list[str]
) -> list[dict]:
    """Group words into display lines based on lyrics file line breaks.

    Each lyrics line becomes one display line. Lines with more than 8 words
    are split at the word boundary.
    """
    if not words or not lyrics_lines:
        return []

    lines = []
    word_idx = 0

    for lyric_line in lyrics_lines:
        lyric_words = lyric_line.split()
        count = len(lyric_words)

        if word_idx + count > len(words):
            count = len(words) - word_idx

        if count <= 0:
            continue

        line_words = words[word_idx : word_idx + count]
        word_idx += count

        # Split lines longer than 8 words
        if len(line_words) > 8:
            for chunk_start in range(0, len(line_words), 8):
                chunk = line_words[chunk_start : chunk_start + 8]
                lines.append(_make_line(chunk))
        else:
            lines.append(_make_line(line_words))

    return lines


def _make_line(words: list[dict]) -> dict:
    """Build a line dict from a list of word dicts."""
    return {
        "text": " ".join(w["word"].strip() for w in words),
        "start": words[0]["start"],
        "end": words[-1]["end"],
        "words": words,
    }


def extract_words_from_whisper(result: dict) -> list[dict]:
    """Extract word dicts from Whisper transcription result.

    Handles segments that lack word-level timestamps by distributing
    the segment duration evenly across words in the segment text.
    """
    all_words = []
    for segment in result["segments"]:
        seg_words = segment.get("words", [])
        if seg_words:
            for w in seg_words:
                all_words.append({
                    "word": w["word"].strip(),
                    "start": round(w["start"], 2),
                    "end": round(w["end"], 2),
                })
        else:
            # Fallback: distribute duration evenly
            text_words = segment["text"].split()
            if not text_words:
                continue
            seg_start = segment["start"]
            seg_end = segment["end"]
            duration_per_word = (seg_end - seg_start) / len(text_words)
            for j, tw in enumerate(text_words):
                all_words.append({
                    "word": tw.strip(),
                    "start": round(seg_start + j * duration_per_word, 2),
                    "end": round(seg_start + (j + 1) * duration_per_word, 2),
                })
    return all_words


def extract_words_from_stable_ts(result) -> list[dict]:
    """Extract word dicts from a stable-ts WhisperResult object."""
    all_words = []
    for word in result.all_words():
        all_words.append({
            "word": word.word.strip(),
            "start": round(word.start, 2),
            "end": round(word.end, 2),
        })
    return all_words


def transcribe_auto(audio_path: str, model_size: str, language: str | None) -> dict:
    """Mode B: Auto-transcribe with Whisper."""
    import whisper

    print(f"Loading Whisper model '{model_size}'...")
    model = whisper.load_model(model_size)

    print(f"Transcribing '{audio_path}'...")
    kwargs = {"word_timestamps": True}
    if language:
        kwargs["language"] = language
    result = model.transcribe(audio_path, **kwargs)

    words = extract_words_from_whisper(result)
    lines = group_words_auto(words)

    duration = result["segments"][-1]["end"] if result["segments"] else 0.0
    print(f"Transcription complete - {len(words)} words across {len(result['segments'])} segments")

    return {
        "duration": round(duration, 2),
        "mode": "transcribed",
        "words": words,
        "lines": lines,
    }


def transcribe_aligned(
    audio_path: str, lyrics_path: str, model_size: str, language: str | None
) -> dict:
    """Mode A: Forced alignment with stable-ts."""
    import stable_whisper

    lyrics_text = Path(lyrics_path).read_text().strip()
    lyrics_lines = [line.strip() for line in lyrics_text.splitlines() if line.strip()]

    print(f"Loading stable-ts model '{model_size}'...")
    model = stable_whisper.load_model(model_size)

    print(f"Aligning lyrics to '{audio_path}'...")
    kwargs = {}
    if language:
        kwargs["language"] = language
    result = model.align(audio_path, lyrics_text, **kwargs)

    if result is None:
        print("WARNING: Alignment failed, falling back to auto-transcription...")
        return transcribe_auto(audio_path, model_size, language)

    words = extract_words_from_stable_ts(result)
    lines = group_words_from_lyrics(words, lyrics_lines)

    duration = result.segments[-1].end if result.segments else 0.0
    print(f"Forced alignment complete - {len(words)} words aligned")

    return {
        "duration": round(duration, 2),
        "mode": "aligned",
        "words": words,
        "lines": lines,
    }


def main():
    parser = argparse.ArgumentParser(description="Transcribe audio to timestamped JSON")
    parser.add_argument("--input", required=True, help="Path to audio file (.mp3 or .wav)")
    parser.add_argument("--output", required=True, help="Path to write transcript.json")
    parser.add_argument("--lyrics", default=None, help="Path to lyrics .txt file for forced alignment")
    parser.add_argument("--model", default="base", help="Whisper model size (default: base)")
    parser.add_argument("--language", default=None, help="Language code (e.g. en, es)")
    args = parser.parse_args()

    if not Path(args.input).exists():
        print(f"ERROR: Audio file not found: {args.input}", file=sys.stderr)
        sys.exit(1)

    if args.lyrics and not Path(args.lyrics).exists():
        print(f"ERROR: Lyrics file not found: {args.lyrics}", file=sys.stderr)
        sys.exit(1)

    if args.lyrics:
        transcript = transcribe_aligned(args.input, args.lyrics, args.model, args.language)
    else:
        transcript = transcribe_auto(args.input, args.model, args.language)

    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(transcript, indent=2, ensure_ascii=False))
    print(f"Wrote {output_path} ({len(transcript['words'])} words, {len(transcript['lines'])} lines)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pixi run python -m pytest tests/test_transcribe.py -v
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/transcribe.py tests/test_transcribe.py
git commit -m "feat: add transcription script with Whisper and stable-ts alignment modes"
```

---

### Task 6: Background Component

**Files:**
- Create: `src/LyricVideo/Background.tsx`

- [ ] **Step 1: Create Background.tsx**

```tsx
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import type { StylePreset } from "../types";

interface BackgroundProps {
  style: StylePreset;
  frame: number;
  fps: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  offset: number;
}

export const Background: React.FC<BackgroundProps> = ({ style, frame, fps }) => {
  const particles = useMemo(() => {
    if (!style.particles) return [];
    const seeds: Particle[] = [];
    for (let i = 0; i < 40; i++) {
      seeds.push({
        id: i,
        x: (i * 137.508) % 100,
        y: (i * 53.147) % 100,
        size: 2 + (i % 4),
        speed: 0.3 + (i % 5) * 0.15,
        offset: i * 1.7,
      });
    }
    return seeds;
  }, [style.particles]);

  const t = frame / fps;

  let background: string;
  if (style.bgGradient) {
    const angle = 135 + Math.sin(t / 8) * 20;
    background = `linear-gradient(${angle}deg, ${style.bgGradient[0]}, ${style.bgGradient[1]})`;
  } else {
    background = style.bgColor;
  }

  return (
    <AbsoluteFill style={{ background }}>
      {particles.map((p) => {
        const px = p.x + Math.sin(t * p.speed + p.offset) * 5;
        const py = p.y + Math.cos(t * p.speed * 0.7 + p.offset) * 4;
        const opacity = interpolate(
          Math.sin(t * 0.5 + p.offset),
          [-1, 1],
          [0.2, 0.7],
        );

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: `${px}%`,
              top: `${py}%`,
              width: p.size,
              height: p.size,
              borderRadius: "50%",
              backgroundColor: style.highlightColor,
              opacity,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/LyricVideo/Background.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/LyricVideo/Background.tsx
git commit -m "feat: add Background component with gradient and particle effects"
```

---

### Task 7: LyricWord Component

**Files:**
- Create: `src/LyricVideo/LyricWord.tsx`

- [ ] **Step 1: Create LyricWord.tsx**

```tsx
import React from "react";
import { interpolate, interpolateColors, spring } from "remotion";
import type { StylePreset, Word } from "../types";
import { isWordHighlighted } from "../timing";

interface LyricWordProps {
  word: Word;
  style: StylePreset;
  fps: number;
  currentTime: number;
  frame: number;
}

export const LyricWord: React.FC<LyricWordProps> = ({
  word,
  style,
  fps,
  currentTime,
  frame,
}) => {
  const highlighted = isWordHighlighted(word, currentTime);

  // Calculate a local frame offset from when this word starts being highlighted
  const wordStartFrame = Math.floor(word.start * fps);
  const localFrame = Math.max(0, frame - wordStartFrame);

  const color = highlighted
    ? interpolateColors(
        Math.min(localFrame, 6),
        [0, 6],
        [style.activeColor, style.highlightColor],
      )
    : style.activeColor;

  let transform = "";
  let opacity = 1;

  if (highlighted) {
    switch (style.wordAnimation) {
      case "pop": {
        const scale = spring({
          frame: localFrame,
          fps,
          config: { damping: 12, stiffness: 200 },
          from: 1,
          to: 1.15,
        });
        transform = `scale(${scale})`;
        break;
      }
      case "slide-up": {
        const y = spring({
          frame: localFrame,
          fps,
          config: { damping: 14 },
          from: 10,
          to: 0,
        });
        transform = `translateY(${y}px)`;
        break;
      }
      case "fade": {
        opacity = interpolate(localFrame, [0, 8], [0.5, 1], {
          extrapolateRight: "clamp",
        });
        break;
      }
      case "slam": {
        const scale = spring({
          frame: localFrame,
          fps,
          config: { stiffness: 400, damping: 10 },
          from: 1.3,
          to: 1,
        });
        const rotation = spring({
          frame: localFrame,
          fps,
          config: { stiffness: 400, damping: 10 },
          from: -3,
          to: 0,
        });
        transform = `scale(${scale}) rotate(${rotation}deg)`;
        break;
      }
    }
  }

  const glowShadow =
    style.glow && highlighted
      ? `0 0 8px ${style.glowColor}, 0 0 20px ${style.glowColor}, 0 0 40px ${style.glowColor}`
      : "none";

  return (
    <span
      style={{
        display: "inline-block",
        color,
        opacity,
        transform,
        textShadow: glowShadow,
        marginRight: "0.3em",
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
      }}
    >
      {word.word}
    </span>
  );
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/LyricVideo/LyricWord.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/LyricVideo/LyricWord.tsx
git commit -m "feat: add LyricWord component with pop, slide-up, fade, slam animations"
```

---

### Task 8: LyricLine Component

**Files:**
- Create: `src/LyricVideo/LyricLine.tsx`

- [ ] **Step 1: Create LyricLine.tsx**

```tsx
import React from "react";
import { interpolate, spring } from "remotion";
import type { Line, StylePreset } from "../types";
import { LyricWord } from "./LyricWord";

interface LyricLineProps {
  line: Line;
  isActive: boolean;
  style: StylePreset;
  fps: number;
  currentTime: number;
  frame: number;
  lineStartFrame: number;
}

export const LyricLine: React.FC<LyricLineProps> = ({
  line,
  isActive,
  style,
  fps,
  currentTime,
  frame,
  lineStartFrame,
}) => {
  const localFrame = Math.max(0, frame - lineStartFrame);

  if (!isActive) {
    return (
      <div
        style={{
          color: style.inactiveColor,
          fontSize: style.fontSize * 0.6,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          textAlign: "center",
          opacity: 0.6,
        }}
      >
        {line.text}
      </div>
    );
  }

  let containerTransform = "";
  let containerOpacity = 1;

  switch (style.lineAnimation) {
    case "fade": {
      containerOpacity = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "slide-up": {
      const y = spring({
        frame: localFrame,
        fps,
        config: { damping: 14 },
        from: 30,
        to: 0,
      });
      containerTransform = `translateY(${y}px)`;
      break;
    }
    case "zoom": {
      const scale = spring({
        frame: localFrame,
        fps,
        config: { damping: 12 },
        from: 0.85,
        to: 1,
      });
      containerTransform = `scale(${scale})`;
      break;
    }
  }

  return (
    <div
      style={{
        textAlign: "center",
        transform: containerTransform,
        opacity: containerOpacity,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {line.words.map((word, i) => (
        <LyricWord
          key={`${word.start}-${i}`}
          word={word}
          style={style}
          fps={fps}
          currentTime={currentTime}
          frame={frame}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/LyricVideo/LyricLine.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/LyricVideo/LyricLine.tsx
git commit -m "feat: add LyricLine component with fade, slide-up, zoom entrance animations"
```

---

### Task 9: LyricVideo Main Composition

**Files:**
- Create: `src/LyricVideo/LyricVideo.tsx`

- [ ] **Step 1: Create LyricVideo.tsx**

```tsx
import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { Transcript } from "../types";
import { STYLES } from "../styles/presets";
import { findActiveLine } from "../timing";
import { Background } from "./Background";
import { LyricLine } from "./LyricLine";

export interface LyricVideoProps {
  transcript: Transcript;
  style: string;
  audioSrc: string;
}

export const LyricVideo: React.FC<LyricVideoProps> = ({
  transcript,
  style: styleName,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;

  const preset = STYLES[styleName] ?? STYLES.neon;
  const { lines } = transcript;
  const { activeIndex, prevIndex, nextIndex } = findActiveLine(
    lines,
    currentTime,
  );

  const lineOffset = 120;
  const centerY = height / 2;

  return (
    <AbsoluteFill>
      <Background style={preset} frame={frame} fps={fps} />

      <Audio src={staticFile(audioSrc.replace(/^\//, ""))} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Previous line */}
        {prevIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY - lineOffset - preset.fontSize * 0.3,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[prevIndex]}
              isActive={false}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[prevIndex].start * fps)}
            />
          </div>
        )}

        {/* Active line */}
        {activeIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY - preset.fontSize * 0.5,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[activeIndex]}
              isActive={true}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[activeIndex].start * fps)}
            />
          </div>
        )}

        {/* Next line */}
        {nextIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY + lineOffset + preset.fontSize * 0.2,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[nextIndex]}
              isActive={false}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[nextIndex].start * fps)}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/LyricVideo/LyricVideo.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/LyricVideo/LyricVideo.tsx
git commit -m "feat: add LyricVideo main composition with 3-line layout and audio sync"
```

---

### Task 10: Root and Entry Point

**Files:**
- Create: `src/Root.tsx`
- Create: `src/index.ts`

- [ ] **Step 1: Create Root.tsx**

The composition reads transcript from a JSON file passed as a prop. `calculateMetadata` sets the duration dynamically based on transcript length.

```tsx
import React from "react";
import { Composition } from "remotion";
import { LyricVideo } from "./LyricVideo/LyricVideo";
import type { LyricVideoProps } from "./LyricVideo/LyricVideo";

// Default transcript for Remotion Studio preview
const defaultTranscript = {
  duration: 10,
  mode: "transcribed" as const,
  words: [
    { word: "Hello", start: 0.5, end: 1.0 },
    { word: "world", start: 1.0, end: 1.5 },
    { word: "this", start: 2.0, end: 2.3 },
    { word: "is", start: 2.3, end: 2.5 },
    { word: "a", start: 2.5, end: 2.6 },
    { word: "preview", start: 2.6, end: 3.2 },
  ],
  lines: [
    {
      text: "Hello world",
      start: 0.5,
      end: 1.5,
      words: [
        { word: "Hello", start: 0.5, end: 1.0 },
        { word: "world", start: 1.0, end: 1.5 },
      ],
    },
    {
      text: "this is a preview",
      start: 2.0,
      end: 3.2,
      words: [
        { word: "this", start: 2.0, end: 2.3 },
        { word: "is", start: 2.3, end: 2.5 },
        { word: "a", start: 2.5, end: 2.6 },
        { word: "preview", start: 2.6, end: 3.2 },
      ],
    },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LyricVideo"
        component={LyricVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{
          transcript: defaultTranscript,
          style: "neon",
          audioSrc: "audio.mp3",
        }}
        calculateMetadata={({ props }) => {
          return {
            durationInFrames: Math.ceil(props.transcript.duration * 30),
          };
        }}
      />
    </>
  );
};
```

- [ ] **Step 2: Create index.ts**

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

- [ ] **Step 3: Verify everything compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Test Remotion Studio launches**

```bash
npx remotion studio
```

Expected: Studio opens at http://localhost:3000 showing the LyricVideo composition with the default preview transcript. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/Root.tsx src/index.ts
git commit -m "feat: add Remotion Root composition and entry point"
```

---

### Task 11: AudioWaveform Component (Nice-to-Have)

**Files:**
- Create: `src/LyricVideo/AudioWaveform.tsx`

- [ ] **Step 1: Create AudioWaveform.tsx**

```tsx
import React from "react";
import { useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import type { StylePreset } from "../types";

interface AudioWaveformProps {
  audioSrc: string;
  style: StylePreset;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioSrc,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(audioSrc.replace(/^\//, "")));

  if (!audioData) return null;

  const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64,
  });

  const barWidth = 16;
  const barGap = 4;
  const maxHeight = 80;
  const totalWidth = visualization.length * (barWidth + barGap);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "flex-end",
        gap: barGap,
        width: totalWidth,
        height: maxHeight,
      }}
    >
      {visualization.map((v, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: Math.max(2, v * maxHeight),
            backgroundColor: style.highlightColor,
            opacity: 0.4,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit src/LyricVideo/AudioWaveform.tsx
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/LyricVideo/AudioWaveform.tsx
git commit -m "feat: add AudioWaveform visualizer component"
```

---

### Task 12: Pipeline Wrapper Script

**Files:**
- Create: `scripts/generate.mjs`

- [ ] **Step 1: Create generate.mjs**

```js
#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";
import { existsSync, copyFileSync, mkdirSync, statSync } from "fs";
import { resolve, basename } from "path";
import { parseArgs } from "util";

const { values: args } = parseArgs({
  options: {
    input: { type: "string" },
    lyrics: { type: "string" },
    style: { type: "string", default: "neon" },
    output: { type: "string", default: "out/video.mp4" },
    model: { type: "string", default: "base" },
    language: { type: "string" },
    preview: { type: "boolean", default: false },
    open: { type: "boolean", default: false },
  },
});

function fatal(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Validate prerequisites
if (!checkCommand("pixi")) {
  fatal("pixi not found. Install from https://pixi.sh");
}
if (!checkCommand("node")) {
  fatal("node not found. Install from https://nodejs.org");
}

if (!args.input) {
  fatal("--input is required. Usage: node scripts/generate.mjs --input song.mp3 [--lyrics lyrics.txt] --style neon --output out/video.mp4");
}

const inputPath = resolve(args.input);
if (!existsSync(inputPath)) {
  fatal(`Audio file not found: ${inputPath}`);
}

if (args.lyrics) {
  const lyricsPath = resolve(args.lyrics);
  if (!existsSync(lyricsPath)) {
    fatal(`Lyrics file not found: ${lyricsPath}`);
  }
}

// Step 1: Transcribe
console.log("\n--- Step 1: Transcription ---\n");

const transcriptPath = resolve("src/transcript.json");
const transcribeArgs = [
  "run", "transcribe", "--",
  "--input", inputPath,
  "--output", transcriptPath,
  "--model", args.model,
];
if (args.lyrics) {
  transcribeArgs.push("--lyrics", resolve(args.lyrics));
}
if (args.language) {
  transcribeArgs.push("--language", args.language);
}

const transcribeResult = spawnSync("pixi", transcribeArgs, {
  stdio: "inherit",
  cwd: resolve("."),
});
if (transcribeResult.status !== 0) {
  fatal("Transcription failed");
}

// Step 2: Copy audio to public/
console.log("\n--- Step 2: Preparing audio ---\n");

mkdirSync(resolve("public"), { recursive: true });
const audioDestName = "audio" + inputPath.substring(inputPath.lastIndexOf("."));
const audioDest = resolve("public", audioDestName);
copyFileSync(inputPath, audioDest);
console.log(`Copied audio to ${audioDest}`);

// Step 3: Open Studio if requested
if (args.open) {
  console.log("\n--- Opening Remotion Studio ---\n");
  console.log("Close Studio and press Ctrl+C when ready to render.");
  spawnSync("npx", ["remotion", "studio"], { stdio: "inherit" });
}

// Step 4: Render
console.log("\n--- Step 3: Rendering video ---\n");

const outputPath = resolve(args.output);
mkdirSync(resolve(outputPath, ".."), { recursive: true });

const props = JSON.stringify({
  transcriptPath: "src/transcript.json",
  style: args.style,
  audioSrc: audioDestName,
});

const renderArgs = [
  "remotion", "render",
  "src/index.ts",
  "LyricVideo",
  outputPath,
  `--props=${props}`,
];

if (args.preview) {
  renderArgs.push("--frames=0-449");
}

const renderResult = spawnSync("npx", renderArgs, {
  stdio: "inherit",
  cwd: resolve("."),
});

if (renderResult.status !== 0) {
  fatal("Render failed");
}

// Done
const fileSize = statSync(outputPath).size;
const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
console.log(`\nDone -> ${outputPath} (${sizeMB} MB)`);
```

- [ ] **Step 2: Make it executable and verify syntax**

```bash
chmod +x scripts/generate.mjs
node --check scripts/generate.mjs
```

Expected: no syntax errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/generate.mjs
git commit -m "feat: add generate.mjs pipeline wrapper for end-to-end video generation"
```

---

### Task 13: README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Create README.md**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup, usage, and architecture"
```

---

### Task 14: Integration Test - End to End

- [ ] **Step 1: Verify Remotion Studio launches with default props**

```bash
timeout 10 npx remotion studio || true
```

Expected: Studio starts successfully (will timeout after 10s, that's fine).

- [ ] **Step 2: Verify TypeScript compilation of entire project**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Run all unit tests**

```bash
npx vitest run
pixi run python -m pytest tests/test_transcribe.py -v
```

Expected: all tests pass.

- [ ] **Step 4: Test render with default preview transcript (no audio)**

Create a quick test by rendering a few frames:

```bash
npx remotion render src/index.ts LyricVideo out/test.mp4 --frames=0-29
```

Expected: renders 1 second of video (will warn about missing audio file, but should still produce a video). Delete test output after verifying:

```bash
rm -f out/test.mp4
```

- [ ] **Step 5: Final commit if any fixes were needed**

Only if there were fixes in this task:

```bash
git add -A
git commit -m "fix: integration test fixes"
```

---

## Spec Coverage Checklist

| Spec Section | Task |
|---|---|
| Repository structure | Task 1 (scaffolding) |
| Pixi setup | Task 1 |
| Node/Remotion setup | Task 1 |
| TypeScript types | Task 2 |
| Style presets (5 styles) | Task 3 |
| Transcription - Mode A (stable-ts) | Task 5 |
| Transcription - Mode B (Whisper) | Task 5 |
| Lyrics file format | Task 5 |
| Line grouping (both modes) | Task 5 |
| Output JSON format | Task 5 |
| Background component | Task 6 |
| LyricWord animations (pop/slide-up/fade/slam) | Task 7 |
| LyricLine animations (fade/slide-up/zoom) | Task 8 |
| Main composition (3-line layout, audio sync) | Task 9 |
| Root/entry point (1920x1080@30fps) | Task 10 |
| AudioWaveform (nice-to-have) | Task 11 |
| Convenience wrapper | Task 12 |
| Error handling | Task 5, Task 12 |
| README | Task 13 |
| remotion.config.ts | Task 1 |
| --preview flag | Task 12 |
| --open flag | Task 12 |
