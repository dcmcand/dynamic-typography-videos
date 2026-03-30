import type { Line, Word, Verse } from "./types";

export function getLineStart(line: Line, words: Word[]): number {
  return words[line.wordIndices[0]].start;
}

export function getLineEnd(line: Line, words: Word[]): number {
  return words[line.wordIndices[line.wordIndices.length - 1]].end;
}

export function getLineWords(line: Line, words: Word[]): Word[] {
  return line.wordIndices.map((i) => words[i]);
}

export function getVerseStart(verse: Verse, lines: Line[], words: Word[]): number {
  return getLineStart(lines[verse.lineIndices[0]], words);
}

export function getVerseEnd(verse: Verse, lines: Line[], words: Word[]): number {
  return getLineEnd(lines[verse.lineIndices[verse.lineIndices.length - 1]], words);
}

export interface ActiveLineResult {
  activeIndex: number | null;
  prevIndex: number | null;
  nextIndex: number | null;
}

export function findActiveLine(
  lines: Line[],
  words: Word[],
  currentTime: number,
): ActiveLineResult {
  let activeIndex: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const start = getLineStart(lines[i], words);
    const end = getLineEnd(lines[i], words);
    if (currentTime >= start && currentTime <= end) {
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

  let prevIndex: number | null = null;
  let nextIndex: number | null = null;

  for (let i = 0; i < lines.length; i++) {
    const end = getLineEnd(lines[i], words);
    const start = getLineStart(lines[i], words);
    if (end <= currentTime) {
      prevIndex = i;
    }
    if (start > currentTime && nextIndex === null) {
      nextIndex = i;
    }
  }

  return { activeIndex: null, prevIndex, nextIndex };
}

export function isWordHighlighted(word: Word, currentTime: number): boolean {
  return currentTime >= word.start && currentTime < word.end;
}

export function getActiveVerse(
  verses: Verse[],
  lines: Line[],
  words: Word[],
  currentTime: number,
): number | null {
  for (let i = 0; i < verses.length; i++) {
    const start = getVerseStart(verses[i], lines, words);
    const end = getVerseEnd(verses[i], lines, words);
    if (currentTime >= start && currentTime <= end) {
      return i;
    }
  }
  return null;
}

export function getWordProgress(word: Word, currentTime: number): number {
  if (currentTime <= word.start) return 0;
  if (currentTime >= word.end) return 1;
  return (currentTime - word.start) / (word.end - word.start);
}
