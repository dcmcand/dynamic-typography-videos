import React from "react";
import { useCurrentFrame, useVideoConfig, staticFile } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import type { StylePreset } from "../types";

interface AudioWaveformProps {
  audioSrc: string;
  style: StylePreset;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  audioSrc,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audioData = useAudioData(staticFile(audioSrc.replace(/^\//, "")));

  if (!audioData) return null;

  const visualization = visualizeAudio({
    fps,
    frame,
    audioData,
    numberOfSamples: 64,
  });

  const barWidth = 16;
  const barGap = 4;
  const maxHeight = 80;
  const totalWidth = visualization.length * (barWidth + barGap);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 40,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "flex-end",
        gap: barGap,
        width: totalWidth,
        height: maxHeight,
      }}
    >
      {visualization.map((v, i) => (
        <div
          key={i}
          style={{
            width: barWidth,
            height: Math.max(2, v * maxHeight),
            backgroundColor: style.highlightColor,
            opacity: 0.4,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
};
