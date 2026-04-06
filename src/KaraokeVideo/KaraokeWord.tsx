import React from "react";
import type { StylePreset, Word } from "../types";
import { getWordProgress } from "../timing";

interface KaraokeWordProps {
  word: Word;
  style: StylePreset;
  currentTime: number;
  fontSize: number;
  textShadow?: string;
}

export const KaraokeWord: React.FC<KaraokeWordProps> = ({
  word,
  style,
  currentTime,
  fontSize,
  textShadow,
}) => {
  const progress = getWordProgress(word, currentTime);

  return (
    <span
      style={{
        display: "inline-block",
        position: "relative",
        marginRight: "0.3em",
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize,
      }}
    >
      {/* Base layer: dim / not-yet-sung */}
      <span style={{ color: style.activeColor, textShadow: textShadow || "none" }}>
        {word.word}
      </span>
      {/* Overlay layer: highlighted / already-sung, clipped to progress */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          color: style.highlightColor,
          clipPath: `inset(0 ${(1 - progress) * 100}% 0 0)`,
          textShadow:
            textShadow || (style.glow && progress > 0
              ? `0 0 8px ${style.glowColor}, 0 0 20px ${style.glowColor}`
              : "none"),
        }}
      >
        {word.word}
      </span>
    </span>
  );
};
