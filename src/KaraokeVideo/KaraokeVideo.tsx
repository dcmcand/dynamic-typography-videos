import React from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  staticFile,
} from "remotion";
import type { Transcript } from "../types";
import { STYLES } from "../styles/presets";
import { getActiveVerse, getVerseStart, getVerseEnd } from "../timing";
import { Background } from "../LyricVideo/Background";
import { KaraokeVerse } from "./KaraokeVerse";
import { InstrumentalBreak } from "./InstrumentalBreak";
import { Countdown } from "./Countdown";

export interface KaraokeVideoProps {
  transcript: Transcript;
  style: string;
  audioSrc: string;
  countdownDuration: number;
  backgroundImage?: string;
  autoFontColor?: string;
  autoShadowColor?: string;
}

const INSTRUMENTAL_THRESHOLD = 3; // seconds
const VERSE_PREVIEW_LEAD = 2; // show upcoming verse this many seconds before break ends

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
  const { lines, words } = transcript;

  // Adjust current time for countdown offset
  const currentTime = frame / fps - countdownDuration;

  // During countdown (before audio starts)
  if (currentTime < 0) {
    const firstVerseLines =
      verses.length > 0
        ? verses[0].lineIndices.map((idx) => lines[idx])
        : [];
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

  const activeVerseIdx = getActiveVerse(verses, lines, words, currentTime);

  // Determine if we're in an instrumental break
  let instrumentalProgress: number | null = null;
  let nextVerseIdx: number | null = null;
  let timeUntilNextVerse: number | null = null;
  if (activeVerseIdx === null && verses.length > 0) {
    // Find which gap we're in
    let gapStart = 0;
    let gapEnd = getVerseStart(verses[0], lines, words);

    // Check before first verse
    if (currentTime < gapEnd) {
      gapStart = 0;
      nextVerseIdx = 0;
    } else {
      // Check gaps between verses and after last verse
      for (let i = 0; i < verses.length; i++) {
        const vEnd = getVerseEnd(verses[i], lines, words);
        const nextStart =
          i + 1 < verses.length
            ? getVerseStart(verses[i + 1], lines, words)
            : transcript.duration;
        if (currentTime > vEnd && currentTime < nextStart) {
          gapStart = vEnd;
          gapEnd = nextStart;
          nextVerseIdx = i + 1 < verses.length ? i + 1 : null;
          break;
        }
      }
    }

    const gapDuration = gapEnd - gapStart;
    if (gapDuration > INSTRUMENTAL_THRESHOLD) {
      instrumentalProgress = (currentTime - gapStart) / gapDuration;
    }
    timeUntilNextVerse = gapEnd - currentTime;
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
            words={words}
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

        {nextVerseIdx !== null &&
          timeUntilNextVerse !== null &&
          timeUntilNextVerse <= VERSE_PREVIEW_LEAD && (
            <div style={{ opacity: 0.3, marginTop: 60 }}>
              <KaraokeVerse
                verse={verses[nextVerseIdx]}
                lines={lines}
                words={words}
                style={preset}
                currentTime={currentTime}
              />
            </div>
          )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
