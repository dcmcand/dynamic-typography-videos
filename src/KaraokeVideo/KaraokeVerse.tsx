import React from "react";
import type { Line, StylePreset, Verse, Word } from "../types";
import { getLineWords } from "../timing";
import { KaraokeWord } from "./KaraokeWord";

interface KaraokeVerseProps {
  verse: Verse;
  lines: Line[];
  words: Word[];
  style: StylePreset;
  currentTime: number;
}

export const KaraokeVerse: React.FC<KaraokeVerseProps> = ({
  verse,
  lines,
  words,
  style,
  currentTime,
}) => {
  const verseLines = verse.lineIndices.map((idx) => lines[idx]);
  const lineCount = verseLines.length;

  // Auto-scale: base font size fits ~6 lines comfortably in 1080p.
  // Scale down proportionally for more lines, with a floor of 50% base size.
  const maxComfortableLines = 6;
  const scaleFactor =
    lineCount <= maxComfortableLines
      ? 1
      : Math.max(0.5, maxComfortableLines / lineCount);
  const fontSize = Math.round(style.fontSize * scaleFactor);
  const lineHeight = fontSize * 1.8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: lineHeight * 0.2,
      }}
    >
      {verseLines.map((line, lineIdx) => {
        const resolvedWords = getLineWords(line, words);
        return (
          <div
            key={`${lineIdx}`}
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              lineHeight: `${lineHeight}px`,
            }}
          >
            {resolvedWords.map((word, wordIdx) => (
              <KaraokeWord
                key={`${word.start}-${wordIdx}`}
                word={word}
                style={style}
                currentTime={currentTime}
                fontSize={fontSize}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
};
