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
import { findActiveLine, getLineStart } from "../timing";
import { Background } from "./Background";
import { LyricLine } from "./LyricLine";

export interface LyricVideoProps {
  transcript: Transcript;
  style: string;
  audioSrc: string;
  backgroundImage?: string;
  autoFontColor?: string;
  autoShadowColor?: string;
}

export const LyricVideo: React.FC<LyricVideoProps> = ({
  transcript,
  style: styleName,
  audioSrc,
  backgroundImage,
  autoFontColor,
  autoShadowColor,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const currentTime = frame / fps;

  const basePreset = STYLES[styleName] ?? STYLES.neon;
  const preset = autoFontColor
    ? {
        ...basePreset,
        activeColor: autoFontColor,
        inactiveColor: autoFontColor,
        highlightColor: autoFontColor,
        particles: false,
      }
    : basePreset;

  const textShadow = autoShadowColor
    ? `0 0 20px ${autoShadowColor}`
    : undefined;

  const { lines, words } = transcript;
  const { activeIndex, prevIndex, nextIndex } = findActiveLine(
    lines,
    words,
    currentTime,
  );

  const lineOffset = 120;
  const centerY = height / 2;

  return (
    <AbsoluteFill>
      <Background style={preset} frame={frame} fps={fps} backgroundImage={backgroundImage} />

      {audioSrc && <Audio src={staticFile(audioSrc.replace(/^\//, ""))} />}

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
              words={words}
              isActive={false}
              style={preset}
              fps={fps}
              lineStartFrame={Math.floor(getLineStart(lines[prevIndex], words) * fps)}
              textShadow={textShadow}
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
              words={words}
              isActive={true}
              style={preset}
              fps={fps}
              lineStartFrame={Math.floor(getLineStart(lines[activeIndex], words) * fps)}
              textShadow={textShadow}
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
              words={words}
              isActive={false}
              style={preset}
              fps={fps}
              lineStartFrame={Math.floor(getLineStart(lines[nextIndex], words) * fps)}
              textShadow={textShadow}
            />
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
