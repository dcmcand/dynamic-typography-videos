import React from "react";
import type { StylePreset, Word } from "../types";

interface LyricWordProps {
  word: Word;
  style: StylePreset;
  textShadow?: string;
}

export const LyricWord: React.FC<LyricWordProps> = ({
  word,
  style,
  textShadow,
}) => {
  return (
    <span
      style={{
        display: "inline-block",
        color: style.activeColor,
        marginRight: "0.3em",
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        textShadow: textShadow || "none",
      }}
    >
      {word.word}
    </span>
  );
};
