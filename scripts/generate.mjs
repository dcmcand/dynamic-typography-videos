#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";
import { existsSync, copyFileSync, mkdirSync, statSync, readFileSync } from "fs";
import { resolve, basename, parse as parsePath } from "path";
import { homedir } from "os";
import { parseArgs } from "util";

const { values: args } = parseArgs({
  options: {
    input: { type: "string" },
    lyrics: { type: "string" },
    instrumental: { type: "string" },
    style: { type: "string", default: "neon" },
    output: { type: "string" },
    model: { type: "string", default: "base" },
    language: { type: "string" },
    preview: { type: "boolean", default: false },
    open: { type: "boolean", default: false },
  },
});

function fatal(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function checkCommand(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

// Validate prerequisites
if (!checkCommand("pixi")) {
  fatal("pixi not found. Install from https://pixi.sh");
}
if (!checkCommand("node")) {
  fatal("node not found. Install from https://nodejs.org");
}

if (!args.input) {
  fatal("--input is required. Usage: node scripts/generate.mjs --input song.mp3 [--lyrics lyrics.txt] --style neon --output out/video.mp4");
}

const inputPath = resolve(args.input);
if (!existsSync(inputPath)) {
  fatal(`Audio file not found: ${inputPath}`);
}

if (!args.output) {
  const songName = parsePath(inputPath).name;
  const suffix = args.instrumental ? " karaoke" : "";
  args.output = resolve(homedir(), "Videos", `${songName}${suffix}.mp4`);
}

if (args.lyrics) {
  const lyricsPath = resolve(args.lyrics);
  if (!existsSync(lyricsPath)) {
    fatal(`Lyrics file not found: ${lyricsPath}`);
  }
}

if (args.instrumental) {
  const instrumentalPath = resolve(args.instrumental);
  if (!existsSync(instrumentalPath)) {
    fatal(`Instrumental file not found: ${instrumentalPath}`);
  }
  if (!args.lyrics) {
    fatal("--instrumental requires --lyrics (karaoke needs known lyrics for word timing)");
  }
}

// Step 1: Transcribe
console.log("\n--- Step 1: Transcription ---\n");

const transcriptPath = resolve("src/transcript.json");
const transcribeArgs = [
  "run", "python", "scripts/transcribe.py",
  "--input", inputPath,
  "--output", transcriptPath,
  "--model", args.model,
];
if (args.lyrics) {
  transcribeArgs.push("--lyrics", resolve(args.lyrics));
}
if (args.language) {
  transcribeArgs.push("--language", args.language);
}

const transcribeResult = spawnSync("pixi", transcribeArgs, {
  stdio: "inherit",
  cwd: resolve("."),
});
if (transcribeResult.status !== 0) {
  fatal("Transcription failed");
}

// Step 2: Copy audio to public/
console.log("\n--- Step 2: Preparing audio ---\n");

mkdirSync(resolve("public"), { recursive: true });
const audioSourcePath = args.instrumental ? resolve(args.instrumental) : inputPath;
const audioDestName = "audio" + audioSourcePath.substring(audioSourcePath.lastIndexOf("."));
const audioDest = resolve("public", audioDestName);
copyFileSync(audioSourcePath, audioDest);
console.log(`Copied ${args.instrumental ? "instrumental" : "audio"} to ${audioDest}`);

// Step 3: Open Studio if requested
if (args.open) {
  console.log("\n--- Opening Remotion Studio ---\n");
  console.log("Close Studio and press Ctrl+C when ready to render.");
  spawnSync("npx", ["remotion", "studio"], { stdio: "inherit" });
}

// Step 4: Render
console.log("\n--- Step 3: Rendering video ---\n");

const outputPath = resolve(args.output);
mkdirSync(resolve(outputPath, ".."), { recursive: true });

const transcript = JSON.parse(readFileSync(transcriptPath, "utf-8"));
const isKaraoke = !!args.instrumental;
const compositionId = isKaraoke ? "KaraokeVideo" : "LyricVideo";

const countdownDuration =
  isKaraoke && transcript.verses && transcript.verses.length > 0 && transcript.verses[0].start < 5
    ? 5
    : 0;

const props = JSON.stringify({
  transcript,
  style: args.style,
  audioSrc: audioDestName,
  ...(isKaraoke && { countdownDuration }),
});

const renderArgs = [
  "remotion", "render",
  "src/index.ts",
  compositionId,
  outputPath,
  `--props=${props}`,
];

if (args.preview) {
  renderArgs.push("--frames=0-449");
}

const renderResult = spawnSync("npx", renderArgs, {
  stdio: "inherit",
  cwd: resolve("."),
});

if (renderResult.status !== 0) {
  fatal("Render failed");
}

// Done
const fileSize = statSync(outputPath).size;
const sizeMB = (fileSize / 1024 / 1024).toFixed(1);
console.log(`\nDone -> ${outputPath} (${sizeMB} MB)`);
