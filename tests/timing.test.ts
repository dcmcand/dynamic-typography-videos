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
