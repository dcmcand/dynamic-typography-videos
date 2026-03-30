import { spawnSync } from "child_process";
import { copyFileSync, mkdirSync, statSync } from "fs";
import { resolve } from "path";

/**
 * Render a single video (lyric or karaoke).
 *
 * @param {object} opts
 * @param {object} opts.transcript - Parsed transcript JSON
 * @param {string} opts.style - Style preset name
 * @param {string} opts.audioSourcePath - Absolute path to audio file to embed
 * @param {string} opts.outputPath - Absolute path for output .mp4
 * @param {string} opts.compositionId - "LyricVideo" or "KaraokeVideo"
 * @param {number} opts.countdownDuration - Countdown seconds (karaoke only, 0 for lyric)
 * @param {boolean} opts.preview - Render first 15 seconds only
 */
export function renderVideo({
  transcript,
  style,
  audioSourcePath,
  outputPath,
  compositionId,
  countdownDuration = 0,
  preview = false,
}) {
  // Copy audio to public/
  mkdirSync(resolve("public"), { recursive: true });
  const audioDestName = "audio" + audioSourcePath.substring(audioSourcePath.lastIndexOf("."));
  const audioDest = resolve("public", audioDestName);
  copyFileSync(audioSourcePath, audioDest);

  // Build props
  mkdirSync(resolve(outputPath, ".."), { recursive: true });

  const props = JSON.stringify({
    transcript,
    style,
    audioSrc: audioDestName,
    ...(compositionId === "KaraokeVideo" && { countdownDuration }),
  });

  const renderArgs = [
    "remotion", "render",
    "src/index.ts",
    compositionId,
    outputPath,
    `--props=${props}`,
  ];

  if (preview) {
    renderArgs.push("--frames=0-449");
  }

  const result = spawnSync("npx", renderArgs, {
    stdio: "inherit",
    cwd: resolve("."),
  });

  if (result.status !== 0) {
    throw new Error(`Render failed for ${compositionId}`);
  }

  const fileSize = statSync(outputPath).size;
  const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
  console.log(`\n  -> ${outputPath} (${sizeMB} MB)`);
}
