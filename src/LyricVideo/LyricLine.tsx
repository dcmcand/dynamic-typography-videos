import React from "react";
import { interpolate, spring } from "remotion";
import type { Line, StylePreset, Word } from "../types";
import { getLineWords } from "../timing";
import { LyricWord } from "./LyricWord";

interface LyricLineProps {
  line: Line;
  words: Word[];
  isActive: boolean;
  style: StylePreset;
  fps: number;
  currentTime: number;
  frame: number;
  lineStartFrame: number;
}

export const LyricLine: React.FC<LyricLineProps> = ({
  line,
  words,
  isActive,
  style,
  fps,
  currentTime,
  frame,
  lineStartFrame,
}) => {
  const localFrame = Math.max(0, frame - lineStartFrame);
  const resolvedWords = getLineWords(line, words);

  if (!isActive) {
    return (
      <div
        style={{
          color: style.inactiveColor,
          fontSize: style.fontSize * 0.6,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          textAlign: "center",
          opacity: 0.6,
        }}
      >
        {line.text}
      </div>
    );
  }

  let containerTransform = "";
  let containerOpacity = 1;

  switch (style.lineAnimation) {
    case "fade": {
      containerOpacity = interpolate(localFrame, [0, 8], [0, 1], {
        extrapolateRight: "clamp",
      });
      break;
    }
    case "slide-up": {
      const y = spring({
        frame: localFrame,
        fps,
        config: { damping: 14 },
        from: 30,
        to: 0,
      });
      containerTransform = `translateY(${y}px)`;
      break;
    }
    case "zoom": {
      const scale = spring({
        frame: localFrame,
        fps,
        config: { damping: 12 },
        from: 0.85,
        to: 1,
      });
      containerTransform = `scale(${scale})`;
      break;
    }
  }

  return (
    <div
      style={{
        textAlign: "center",
        transform: containerTransform,
        opacity: containerOpacity,
        display: "flex",
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {resolvedWords.map((word, i) => (
        <LyricWord
          key={`${word.start}-${i}`}
          word={word}
          style={style}
          fps={fps}
          currentTime={currentTime}
          frame={frame}
        />
      ))}
    </div>
  );
};
