import { describe, it, expect } from "vitest";
import { findActiveLine, isWordHighlighted, getActiveVerse, getWordProgress } from "../src/timing";
import type { Line, Word, Verse } from "../src/types";

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

const verses: Verse[] = [
  { lines: [0, 1], start: 0.5, end: 4.0 },
  { lines: [2], start: 6.0, end: 8.0 },
  { lines: [3, 4], start: 10.0, end: 14.0 },
];

describe("getActiveVerse", () => {
  it("returns null before any verse starts", () => {
    expect(getActiveVerse(verses, 0.0)).toBe(null);
  });

  it("returns first verse index when time is within it", () => {
    expect(getActiveVerse(verses, 2.0)).toBe(0);
  });

  it("returns second verse index when time is within it", () => {
    expect(getActiveVerse(verses, 7.0)).toBe(1);
  });

  it("returns null in gap between verses", () => {
    expect(getActiveVerse(verses, 5.0)).toBe(null);
  });

  it("returns null after all verses end", () => {
    expect(getActiveVerse(verses, 15.0)).toBe(null);
  });
});

describe("getWordProgress", () => {
  it("returns 0 before word starts", () => {
    const word: Word = { word: "hello", start: 1.0, end: 2.0 };
    expect(getWordProgress(word, 0.5)).toBe(0);
  });

  it("returns 1 after word ends", () => {
    const word: Word = { word: "hello", start: 1.0, end: 2.0 };
    expect(getWordProgress(word, 2.5)).toBe(1);
  });

  it("returns 0.5 at midpoint", () => {
    const word: Word = { word: "hello", start: 1.0, end: 2.0 };
    expect(getWordProgress(word, 1.5)).toBe(0.5);
  });

  it("returns 0 at word start boundary", () => {
    const word: Word = { word: "hello", start: 1.0, end: 2.0 };
    expect(getWordProgress(word, 1.0)).toBe(0);
  });

  it("returns 1 at word end boundary", () => {
    const word: Word = { word: "hello", start: 1.0, end: 2.0 };
    expect(getWordProgress(word, 2.0)).toBe(1);
  });
});
