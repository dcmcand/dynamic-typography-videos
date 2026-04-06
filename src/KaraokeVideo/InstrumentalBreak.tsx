import React from "react";
import type { StylePreset } from "../types";

interface InstrumentalBreakProps {
  style: StylePreset;
  progress: number; // 0 to 1
  textShadow?: string;
}

export const InstrumentalBreak: React.FC<InstrumentalBreakProps> = ({
  style,
  progress,
  textShadow,
}) => {
  const barWidth = 400;
  const barHeight = 8;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
      }}
    >
      <span
        style={{
          color: style.inactiveColor,
          fontFamily: style.fontFamily,
          fontWeight: style.fontWeight,
          fontSize: style.fontSize * 0.5,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          textShadow: textShadow || "none",
        }}
      >
        Instrumental
      </span>
      <div
        style={{
          width: barWidth,
          height: barHeight,
          borderRadius: barHeight / 2,
          backgroundColor: style.inactiveColor,
          overflow: "hidden",
          opacity: 0.5,
        }}
      >
        <div
          style={{
            width: `${progress * 100}%`,
            height: "100%",
            borderRadius: barHeight / 2,
            backgroundColor: style.highlightColor,
            opacity: 1,
          }}
        />
      </div>
    </div>
  );
};
