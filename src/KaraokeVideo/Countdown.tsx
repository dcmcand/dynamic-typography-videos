import React from "react";
import { spring } from "remotion";
import type { Line, StylePreset } from "../types";

interface CountdownProps {
  style: StylePreset;
  secondsRemaining: number; // e.g. 4.7, 2.3, 0.1
  fps: number;
  frame: number;
  firstVerseLines: Line[];
}

export const Countdown: React.FC<CountdownProps> = ({
  style,
  secondsRemaining,
  fps,
  frame,
  firstVerseLines,
}) => {
  const displayNumber = Math.min(3, Math.ceil(secondsRemaining));

  // Spring animation for each number change
  const numberFrame = Math.floor(
    (Math.ceil(secondsRemaining) - secondsRemaining) * fps,
  );
  const scale = spring({
    frame: numberFrame,
    fps,
    config: { damping: 12, stiffness: 200 },
    from: 1.3,
    to: 1,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 60,
      }}
    >
      {displayNumber > 0 && (
        <span
          style={{
            color: style.highlightColor,
            fontFamily: style.fontFamily,
            fontWeight: style.fontWeight,
            fontSize: style.fontSize * 2,
            transform: `scale(${scale})`,
            display: "inline-block",
            textShadow: style.glow
              ? `0 0 20px ${style.glowColor}, 0 0 40px ${style.glowColor}`
              : "none",
          }}
        >
          {displayNumber}
        </span>
      )}
      {/* Show first verse text dimmed for read-ahead */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          opacity: 0.3,
        }}
      >
        {firstVerseLines.map((line, i) => (
          <span
            key={i}
            style={{
              color: style.inactiveColor,
              fontFamily: style.fontFamily,
              fontWeight: style.fontWeight,
              fontSize: style.fontSize * 0.5,
            }}
          >
            {line.text}
          </span>
        ))}
      </div>
    </div>
  );
};
