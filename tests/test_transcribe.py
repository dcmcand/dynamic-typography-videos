"""Tests for pure functions in scripts/transcribe.py."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from transcribe import group_words_auto, group_words_from_lyrics


def make_word(word: str, start: float, end: float) -> dict:
    return {"word": word, "start": start, "end": end}


class TestGroupWordsAuto:
    def test_groups_by_max_six_words(self):
        words = [
            make_word(f"word{i}", float(i), float(i) + 0.5)
            for i in range(8)
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert len(lines[0]["words"]) == 6
        assert len(lines[1]["words"]) == 2

    def test_splits_on_silence_gap(self):
        words = [
            make_word("hello", 0.0, 0.5),
            make_word("world", 0.5, 1.0),
            make_word("foo", 3.0, 3.5),
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello world"
        assert lines[1]["text"] == "foo"

    def test_splits_on_sentence_ending_punctuation(self):
        words = [
            make_word("hello.", 0.0, 0.5),
            make_word("world", 0.6, 1.0),
        ]
        lines = group_words_auto(words)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello."
        assert lines[1]["text"] == "world"

    def test_line_start_end_matches_words(self):
        words = [
            make_word("hello", 1.0, 1.5),
            make_word("world", 1.5, 2.0),
        ]
        lines = group_words_auto(words)
        assert lines[0]["start"] == 1.0
        assert lines[0]["end"] == 2.0

    def test_empty_words_returns_empty(self):
        assert group_words_auto([]) == []


class TestGroupWordsFromLyrics:
    def test_maps_words_to_lyrics_lines(self):
        lyrics_lines = ["hello world", "foo bar"]
        words = [
            make_word("hello", 0.0, 0.3),
            make_word("world", 0.3, 0.6),
            make_word("foo", 1.0, 1.3),
            make_word("bar", 1.3, 1.6),
        ]
        lines = group_words_from_lyrics(words, lyrics_lines)
        assert len(lines) == 2
        assert lines[0]["text"] == "hello world"
        assert lines[1]["text"] == "foo bar"

    def test_splits_long_lines_at_eight_words(self):
        lyrics_lines = ["one two three four five six seven eight nine ten"]
        words = [
            make_word(w, float(i), float(i) + 0.5)
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
            make_word("hello", 2.5, 3.0),
            make_word("world", 3.0, 3.5),
        ]
        lines = group_words_from_lyrics(words, lyrics_lines)
        assert lines[0]["start"] == 2.5
        assert lines[0]["end"] == 3.5
