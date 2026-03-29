import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { Transcript, Verse } from "../types";
import { STYLES } from "../styles/presets";
import { getActiveVerse } from "../timing";
import { Background } from "../LyricVideo/Background";
import { KaraokeVerse } from "./KaraokeVerse";
import { InstrumentalBreak } from "./InstrumentalBreak";
import { Countdown } from "./Countdown";

export interface KaraokeVideoProps {
  transcript: Transcript;
  style: string;
  audioSrc: string;
  countdownDuration: number;
}

const INSTRUMENTAL_THRESHOLD = 3; // seconds

export const KaraokeVideo: React.FC<KaraokeVideoProps> = ({
  transcript,
  style: styleName,
  audioSrc,
  countdownDuration,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const preset = STYLES[styleName] ?? STYLES.neon;
  const verses = transcript.verses ?? [];
  const { lines } = transcript;

  // Adjust current time for countdown offset
  const currentTime = frame / fps - countdownDuration;

  // During countdown (before audio starts)
  if (currentTime < 0) {
    const firstVerseLines =
      verses.length > 0 ? verses[0].lines.map((idx) => lines[idx]) : [];
    return (
      <AbsoluteFill>
        <Background style={preset} frame={frame} fps={fps} />
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Countdown
            style={preset}
            secondsRemaining={-currentTime}
            fps={fps}
            frame={frame}
            firstVerseLines={firstVerseLines}
          />
        </AbsoluteFill>
      </AbsoluteFill>
    );
  }

  const activeVerseIdx = getActiveVerse(verses, currentTime);

  // Determine if we're in an instrumental break
  let instrumentalProgress: number | null = null;
  if (activeVerseIdx === null && verses.length > 0) {
    // Find which gap we're in
    let gapStart = 0;
    let gapEnd = verses[0].start;

    // Check before first verse
    if (currentTime < verses[0].start) {
      gapStart = 0;
      gapEnd = verses[0].start;
    } else {
      // Check gaps between verses and after last verse
      for (let i = 0; i < verses.length; i++) {
        const nextStart =
          i + 1 < verses.length
            ? verses[i + 1].start
            : transcript.duration;
        if (currentTime > verses[i].end && currentTime < nextStart) {
          gapStart = verses[i].end;
          gapEnd = nextStart;
          break;
        }
      }
    }

    const gapDuration = gapEnd - gapStart;
    if (gapDuration > INSTRUMENTAL_THRESHOLD) {
      instrumentalProgress = (currentTime - gapStart) / gapDuration;
    }
  }

  return (
    <AbsoluteFill>
      <Background style={preset} frame={frame} fps={fps} />

      {audioSrc && (
        <Sequence from={Math.round(countdownDuration * fps)}>
          <Audio src={staticFile(audioSrc.replace(/^\//, ""))} />
        </Sequence>
      )}

      <AbsoluteFill
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {activeVerseIdx !== null && (
          <KaraokeVerse
            verse={verses[activeVerseIdx]}
            lines={lines}
            style={preset}
            currentTime={currentTime}
          />
        )}

        {instrumentalProgress !== null && (
          <InstrumentalBreak
            style={preset}
            progress={instrumentalProgress}
          />
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
