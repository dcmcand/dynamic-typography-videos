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
