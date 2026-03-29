import React from "react";
import {
  AbsoluteFill,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { Transcript } from "../types";
import { STYLES } from "../styles/presets";
import { findActiveLine } from "../timing";
import { Background } from "./Background";
import { LyricLine } from "./LyricLine";

export interface LyricVideoProps {
  transcript: Transcript;
  style: string;
  audioSrc: string;
}

export const LyricVideo: React.FC<LyricVideoProps> = ({
  transcript,
  style: styleName,
  audioSrc,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;

  const preset = STYLES[styleName] ?? STYLES.neon;
  const { lines } = transcript;
  const { activeIndex, prevIndex, nextIndex } = findActiveLine(
    lines,
    currentTime,
  );

  const lineOffset = 120;
  const centerY = height / 2;

  return (
    <AbsoluteFill>
      <Background style={preset} frame={frame} fps={fps} />

      <Audio src={staticFile(audioSrc.replace(/^\//, ""))} />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {prevIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY - lineOffset - preset.fontSize * 0.3,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[prevIndex]}
              isActive={false}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[prevIndex].start * fps)}
            />
          </div>
        )}

        {activeIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY - preset.fontSize * 0.5,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[activeIndex]}
              isActive={true}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[activeIndex].start * fps)}
            />
          </div>
        )}

        {nextIndex !== null && (
          <div
            style={{
              position: "absolute",
              top: centerY + lineOffset + preset.fontSize * 0.2,
              width: width * 0.9,
            }}
          >
            <LyricLine
              line={lines[nextIndex]}
              isActive={false}
              style={preset}
              fps={fps}
              currentTime={currentTime}
              frame={frame}
              lineStartFrame={Math.floor(lines[nextIndex].start * fps)}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
