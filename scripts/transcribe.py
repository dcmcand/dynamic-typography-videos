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


def is_bracket_line(line: str) -> bool:
    """Check if a line is a bracket annotation like [verse 1] or [intro - 8 bars]."""
    stripped = line.strip()
    return stripped.startswith("[") and stripped.endswith("]") and stripped.count("[") == 1


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
    current_indices = [0]

    for i in range(1, len(words)):
        prev_word = words[i - 1]
        curr_word = words[i]

        silence_gap = curr_word["start"] - prev_word["end"]
        prev_ends_sentence = prev_word["word"].rstrip().endswith((".", "?", "!"))

        if len(current_indices) >= 6 or silence_gap > 1.2 or prev_ends_sentence:
            lines.append(_make_line(current_indices, words))
            current_indices = [i]
        else:
            current_indices.append(i)

    if current_indices:
        lines.append(_make_line(current_indices, words))

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

        line_indices = list(range(word_idx, word_idx + count))
        word_idx += count

        if len(line_indices) > 8:
            for chunk_start in range(0, len(line_indices), 8):
                chunk = line_indices[chunk_start : chunk_start + 8]
                lines.append(_make_line(chunk, words))
        else:
            lines.append(_make_line(line_indices, words))

    return lines


def _display_line_count(lyric_line: str) -> int:
    """How many display lines a single lyrics line produces after 8-word splitting."""
    word_count = len(lyric_line.split())
    if word_count <= 8:
        return 1
    return (word_count + 7) // 8


def group_verses_from_lyrics(lyrics_text: str, lines: list[dict]) -> list[dict]:
    """Group lines into verses based on blank-line separations in lyrics text."""
    raw_lines = lyrics_text.splitlines()
    verse_groups: list[list[int]] = []
    current_group: list[int] = []
    line_idx = 0

    for raw_line in raw_lines:
        stripped = raw_line.strip()
        if not stripped or is_bracket_line(stripped):
            if current_group:
                verse_groups.append(current_group)
                current_group = []
        else:
            display_count = _display_line_count(stripped)
            for _ in range(display_count):
                if line_idx < len(lines):
                    current_group.append(line_idx)
                    line_idx += 1

    if current_group:
        verse_groups.append(current_group)

    verses = []
    for group in verse_groups:
        verses.append({
            "lineIndices": group,
        })
    return verses


def _make_line(word_indices: list[int], words: list[dict]) -> dict:
    """Build a line dict from global word indices."""
    line_words = [words[i] for i in word_indices]
    return {
        "text": " ".join(w["word"].strip() for w in line_words),
        "wordIndices": word_indices,
    }


def extract_words_from_whisper(result: dict) -> list[dict]:
    """Extract word dicts from Whisper transcription result."""
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
    lyrics_lines = [
        line.strip() for line in lyrics_text.splitlines()
        if line.strip() and not is_bracket_line(line.strip())
    ]

    print(f"Loading stable-ts model '{model_size}'...")
    model = stable_whisper.load_model(model_size)

    print(f"Aligning lyrics to '{audio_path}'...")
    align_language = language or "en"
    clean_text = "\n".join(lyrics_lines)
    result = model.align(audio_path, clean_text, language=align_language)

    if result is None:
        print("WARNING: Alignment failed, falling back to auto-transcription...")
        return transcribe_auto(audio_path, model_size, language)

    words = extract_words_from_stable_ts(result)
    lines = group_words_from_lyrics(words, lyrics_lines)
    verses = group_verses_from_lyrics(lyrics_text, lines)

    duration = result.segments[-1].end if result.segments else 0.0
    print(f"Forced alignment complete - {len(words)} words aligned")

    return {
        "duration": round(duration, 2),
        "mode": "aligned",
        "words": words,
        "lines": lines,
        "verses": verses,
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
