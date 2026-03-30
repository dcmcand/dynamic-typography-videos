"""Tests for pure functions in scripts/transcribe.py."""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))

from transcribe import group_words_auto, group_words_from_lyrics, is_bracket_line, group_verses_from_lyrics


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


class TestIsBracketLine:
    def test_simple_bracket(self):
        assert is_bracket_line("[verse 1]") is True

    def test_bracket_with_description(self):
        assert is_bracket_line("[intro - driving instrumental, 8 bars]") is True

    def test_normal_lyric(self):
        assert is_bracket_line("Oye, corazon") is False

    def test_bracket_in_middle_of_text(self):
        assert is_bracket_line("hello [world] there") is False

    def test_empty_brackets(self):
        assert is_bracket_line("[]") is True

    def test_whitespace_around_brackets(self):
        assert is_bracket_line("  [chorus]  ") is True


class TestGroupVersesWithBrackets:
    def test_brackets_act_as_verse_separators(self):
        lyrics_text = "line one\nline two\n[chorus]\nline three\nline four"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 1.0, "end": 2.0, "words": []},
            {"text": "line three", "start": 4.0, "end": 5.0, "words": []},
            {"text": "line four", "start": 5.0, "end": 6.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2
        assert verses[0]["lines"] == [0, 1]
        assert verses[1]["lines"] == [2, 3]

    def test_stacked_brackets_collapse(self):
        lyrics_text = "line one\n[verse 1]\n[intro]\nline two"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 3.0, "end": 4.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2

    def test_brackets_mixed_with_blank_lines(self):
        lyrics_text = "line one\n\n[chorus]\n\nline two"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 3.0, "end": 4.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2

    def test_leading_bracket_before_first_lyrics(self):
        lyrics_text = "[intro - 8 bars]\nline one\nline two"
        lines = [
            {"text": "line one", "start": 2.0, "end": 3.0, "words": []},
            {"text": "line two", "start": 3.0, "end": 4.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 1
        assert verses[0]["lines"] == [0, 1]

    def test_long_lines_split_into_multiple_display_lines(self):
        # A 10-word lyrics line splits into 2 display lines (8 + 2)
        lyrics_text = "one two three four five six seven eight nine ten\n\nshort line"
        lines = [
            {"text": "one two three four five six seven eight", "start": 0.0, "end": 4.0, "words": []},
            {"text": "nine ten", "start": 4.0, "end": 5.0, "words": []},
            {"text": "short line", "start": 7.0, "end": 8.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2
        assert verses[0]["lines"] == [0, 1]  # both display lines from the split
        assert verses[1]["lines"] == [2]


class TestGroupVersesFromLyrics:
    def test_groups_lines_by_blank_line_separator(self):
        lyrics_text = "line one\nline two\n\nline three\nline four"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 1.0, "end": 2.0, "words": []},
            {"text": "line three", "start": 4.0, "end": 5.0, "words": []},
            {"text": "line four", "start": 5.0, "end": 6.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2
        assert verses[0]["lines"] == [0, 1]
        assert verses[0]["start"] == 0.0
        assert verses[0]["end"] == 2.0
        assert verses[1]["lines"] == [2, 3]
        assert verses[1]["start"] == 4.0
        assert verses[1]["end"] == 6.0

    def test_single_verse_no_blank_lines(self):
        lyrics_text = "line one\nline two\nline three"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 1.0, "end": 2.0, "words": []},
            {"text": "line three", "start": 2.0, "end": 3.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 1
        assert verses[0]["lines"] == [0, 1, 2]

    def test_multiple_blank_lines_treated_as_one_separator(self):
        lyrics_text = "line one\n\n\nline two"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 3.0, "end": 4.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 2

    def test_trailing_blank_lines_ignored(self):
        lyrics_text = "line one\nline two\n\n"
        lines = [
            {"text": "line one", "start": 0.0, "end": 1.0, "words": []},
            {"text": "line two", "start": 1.0, "end": 2.0, "words": []},
        ]
        verses = group_verses_from_lyrics(lyrics_text, lines)
        assert len(verses) == 1
        assert verses[0]["lines"] == [0, 1]
