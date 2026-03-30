import { describe, it, expect } from "vitest";
import {
  findActiveLine,
  isWordHighlighted,
  getActiveVerse,
  getWordProgress,
  getLineStart,
  getLineEnd,
  getLineWords,
  getVerseStart,
  getVerseEnd,
} from "../src/timing";
import type { Word, Line, Verse } from "../src/types";

const words: Word[] = [
  { word: "Never", start: 0.5, end: 0.8 },
  { word: "gonna", start: 0.8, end: 1.05 },
  { word: "give", start: 1.05, end: 1.3 },
  { word: "you", start: 1.3, end: 1.55 },
  { word: "up", start: 1.55, end: 2.1 },
  { word: "Never", start: 2.5, end: 2.8 },
  { word: "gonna", start: 2.8, end: 3.0 },
  { word: "let", start: 3.0, end: 3.2 },
  { word: "you", start: 3.2, end: 3.5 },
  { word: "down", start: 3.5, end: 4.0 },
  { word: "Never", start: 4.5, end: 4.8 },
  { word: "gonna", start: 4.8, end: 5.0 },
  { word: "run", start: 5.0, end: 5.3 },
  { word: "around", start: 5.3, end: 6.0 },
];

const lines: Line[] = [
  { text: "Never gonna give you up", wordIndices: [0, 1, 2, 3, 4] },
  { text: "Never gonna let you down", wordIndices: [5, 6, 7, 8, 9] },
  { text: "Never gonna run around", wordIndices: [10, 11, 12, 13] },
];

const verses: Verse[] = [
  { lineIndices: [0, 1] },
  { lineIndices: [2] },
];

describe("getLineStart", () => {
  it("returns start of first word in line", () => {
    expect(getLineStart(lines[0], words)).toBe(0.5);
  });
  it("returns start of first word in second line", () => {
    expect(getLineStart(lines[1], words)).toBe(2.5);
  });
});

describe("getLineEnd", () => {
  it("returns end of last word in line", () => {
    expect(getLineEnd(lines[0], words)).toBe(2.1);
  });
  it("returns end of last word in second line", () => {
    expect(getLineEnd(lines[1], words)).toBe(4.0);
  });
});

describe("getLineWords", () => {
  it("resolves word objects from indices", () => {
    const resolved = getLineWords(lines[0], words);
    expect(resolved).toHaveLength(5);
    expect(resolved[0].word).toBe("Never");
    expect(resolved[4].word).toBe("up");
  });
});

describe("getVerseStart", () => {
  it("returns start of first word of first line in verse", () => {
    expect(getVerseStart(verses[0], lines, words)).toBe(0.5);
  });
});

describe("getVerseEnd", () => {
  it("returns end of last word of last line in verse", () => {
    expect(getVerseEnd(verses[0], lines, words)).toBe(4.0);
  });
});

describe("findActiveLine", () => {
  it("returns null indices before any line starts", () => {
    const result = findActiveLine(lines, words, 0.0);
    expect(result.activeIndex).toBe(null);
    expect(result.prevIndex).toBe(null);
    expect(result.nextIndex).toBe(0);
  });
  it("returns the first line when time is within its range", () => {
    const result = findActiveLine(lines, words, 1.0);
    expect(result.activeIndex).toBe(0);
    expect(result.prevIndex).toBe(null);
    expect(result.nextIndex).toBe(1);
  });
  it("returns the second line when time is within its range", () => {
    const result = findActiveLine(lines, words, 3.0);
    expect(result.activeIndex).toBe(1);
    expect(result.prevIndex).toBe(0);
    expect(result.nextIndex).toBe(2);
  });
  it("returns the last line with no next", () => {
    const result = findActiveLine(lines, words, 5.5);
    expect(result.activeIndex).toBe(2);
    expect(result.prevIndex).toBe(1);
    expect(result.nextIndex).toBe(null);
  });
  it("returns null active in gap between lines, shows prev and next", () => {
    const result = findActiveLine(lines, words, 2.3);
    expect(result.activeIndex).toBe(null);
    expect(result.prevIndex).toBe(0);
    expect(result.nextIndex).toBe(1);
  });
});

describe("isWordHighlighted", () => {
  it("returns true when current time falls within word range", () => {
    expect(isWordHighlighted({ word: "gonna", start: 0.8, end: 1.05 }, 0.9)).toBe(true);
  });
  it("returns true at word start boundary", () => {
    expect(isWordHighlighted({ word: "gonna", start: 0.8, end: 1.05 }, 0.8)).toBe(true);
  });
  it("returns false before word starts", () => {
    expect(isWordHighlighted({ word: "gonna", start: 0.8, end: 1.05 }, 0.7)).toBe(false);
  });
  it("returns false after word ends", () => {
    expect(isWordHighlighted({ word: "gonna", start: 0.8, end: 1.05 }, 1.1)).toBe(false);
  });
});

describe("getActiveVerse", () => {
  it("returns null before any verse starts", () => {
    expect(getActiveVerse(verses, lines, words, 0.0)).toBe(null);
  });
  it("returns first verse index when time is within it", () => {
    expect(getActiveVerse(verses, lines, words, 2.0)).toBe(0);
  });
  it("returns second verse index when time is within it", () => {
    expect(getActiveVerse(verses, lines, words, 5.5)).toBe(1);
  });
  it("returns null in gap between verses", () => {
    expect(getActiveVerse(verses, lines, words, 4.2)).toBe(null);
  });
  it("returns null after all verses end", () => {
    expect(getActiveVerse(verses, lines, words, 15.0)).toBe(null);
  });
});

describe("getWordProgress", () => {
  it("returns 0 before word starts", () => {
    expect(getWordProgress({ word: "hello", start: 1.0, end: 2.0 }, 0.5)).toBe(0);
  });
  it("returns 1 after word ends", () => {
    expect(getWordProgress({ word: "hello", start: 1.0, end: 2.0 }, 2.5)).toBe(1);
  });
  it("returns 0.5 at midpoint", () => {
    expect(getWordProgress({ word: "hello", start: 1.0, end: 2.0 }, 1.5)).toBe(0.5);
  });
  it("returns 0 at word start boundary", () => {
    expect(getWordProgress({ word: "hello", start: 1.0, end: 2.0 }, 1.0)).toBe(0);
  });
  it("returns 1 at word end boundary", () => {
    expect(getWordProgress({ word: "hello", start: 1.0, end: 2.0 }, 2.0)).toBe(1);
  });
});
