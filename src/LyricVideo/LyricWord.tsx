import React from "react";
import { interpolate, interpolateColors, spring } from "remotion";
import type { StylePreset, Word } from "../types";
import { isWordHighlighted } from "../timing";

interface LyricWordProps {
  word: Word;
  style: StylePreset;
  fps: number;
  currentTime: number;
  frame: number;
}

export const LyricWord: React.FC<LyricWordProps> = ({
  word,
  style,
  fps,
  currentTime,
  frame,
}) => {
  const highlighted = isWordHighlighted(word, currentTime);

  const wordStartFrame = Math.floor(word.start * fps);
  const localFrame = Math.max(0, frame - wordStartFrame);

  const color = highlighted
    ? interpolateColors(
        Math.min(localFrame, 6),
        [0, 6],
        [style.activeColor, style.highlightColor],
      )
    : style.activeColor;

  let transform = "";
  let opacity = 1;

  if (highlighted) {
    switch (style.wordAnimation) {
      case "pop": {
        const scale = spring({
          frame: localFrame,
          fps,
          config: { damping: 12, stiffness: 200 },
          from: 1,
          to: 1.15,
        });
        transform = `scale(${scale})`;
        break;
      }
      case "slide-up": {
        const y = spring({
          frame: localFrame,
          fps,
          config: { damping: 14 },
          from: 10,
          to: 0,
        });
        transform = `translateY(${y}px)`;
        break;
      }
      case "fade": {
        opacity = interpolate(localFrame, [0, 8], [0.5, 1], {
          extrapolateRight: "clamp",
        });
        break;
      }
      case "slam": {
        const scale = spring({
          frame: localFrame,
          fps,
          config: { stiffness: 400, damping: 10 },
          from: 1.3,
          to: 1,
        });
        const rotation = spring({
          frame: localFrame,
          fps,
          config: { stiffness: 400, damping: 10 },
          from: -3,
          to: 0,
        });
        transform = `scale(${scale}) rotate(${rotation}deg)`;
        break;
      }
    }
  }

  const glowShadow =
    style.glow && highlighted
      ? `0 0 8px ${style.glowColor}, 0 0 20px ${style.glowColor}, 0 0 40px ${style.glowColor}`
      : "none";

  return (
    <span
      style={{
        display: "inline-block",
        color,
        opacity,
        transform,
        textShadow: glowShadow,
        marginRight: "0.3em",
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
      }}
    >
      {word.word}
    </span>
  );
};
