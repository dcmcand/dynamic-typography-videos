import React from "react";
import { Composition } from "remotion";
import { LyricVideo } from "./LyricVideo/LyricVideo";
import type { LyricVideoProps } from "./LyricVideo/LyricVideo";
import { KaraokeVideo } from "./KaraokeVideo/KaraokeVideo";
import type { KaraokeVideoProps } from "./KaraokeVideo/KaraokeVideo";

const LyricVideoWrapper: React.FC<Record<string, unknown>> = (props) => {
  return <LyricVideo {...(props as unknown as LyricVideoProps)} />;
};

const KaraokeVideoWrapper: React.FC<Record<string, unknown>> = (props) => {
  return <KaraokeVideo {...(props as unknown as KaraokeVideoProps)} />;
};

const defaultTranscript = {
  duration: 10,
  mode: "transcribed" as const,
  words: [
    { word: "Hello", start: 0.5, end: 1.0 },
    { word: "world", start: 1.0, end: 1.5 },
    { word: "this", start: 2.0, end: 2.3 },
    { word: "is", start: 2.3, end: 2.5 },
    { word: "a", start: 2.5, end: 2.6 },
    { word: "preview", start: 2.6, end: 3.2 },
  ],
  lines: [
    { text: "Hello world", wordIndices: [0, 1] },
    { text: "this is a preview", wordIndices: [2, 3, 4, 5] },
  ],
};

const defaultKaraokeTranscript = {
  ...defaultTranscript,
  verses: [
    { lineIndices: [0, 1] },
  ],
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LyricVideo"
        component={LyricVideoWrapper}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{
          transcript: defaultTranscript,
          style: "neon",
          audioSrc: "",
        }}
        calculateMetadata={({ props }) => {
          const p = props as unknown as LyricVideoProps;
          return {
            durationInFrames: Math.ceil(p.transcript.duration * 30),
          };
        }}
      />
      <Composition
        id="KaraokeVideo"
        component={KaraokeVideoWrapper}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{
          transcript: defaultKaraokeTranscript,
          style: "neon",
          audioSrc: "",
          countdownDuration: 0,
        }}
        calculateMetadata={({ props }) => {
          const p = props as unknown as KaraokeVideoProps;
          return {
            durationInFrames: Math.ceil(
              (p.transcript.duration + p.countdownDuration) * 30,
            ),
          };
        }}
      />
    </>
  );
};
