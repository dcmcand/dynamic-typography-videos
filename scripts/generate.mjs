#!/usr/bin/env node

import { execSync, spawnSync } from "child_process";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync as fstatSync,
} from "fs";
import { resolve, join } from "path";
import { homedir } from "os";
import { parseArgs } from "util";
import yaml from "js-yaml";
import { resolveConfig } from "./config.mjs";
import { renderVideo } from "./render.mjs";
import { analyzeBackgroundImage } from "./analyze-image.mjs";

// --- Parse CLI ---

const { values: flags, positionals } = parseArgs({
  options: {
    input: { type: "string" },
    lyrics: { type: "string" },
    instrumental: { type: "string" },
    background: { type: "string" },
    style: { type: "string" },
    output: { type: "string" },
    "output-folder": { type: "string" },
    model: { type: "string" },
    language: { type: "string" },
    title: { type: "string" },
    preview: { type: "boolean", default: false },
    retranscribe: { type: "boolean", default: false },
    "only-lyric": { type: "boolean", default: false },
    "only-karaoke": { type: "boolean", default: false },
    "only-transcribe": { type: "boolean", default: false },
    open: { type: "boolean", default: false },
  },
  allowPositionals: true,
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

// --- Validate prerequisites ---

if (!checkCommand("pixi")) {
  fatal("pixi not found. Install from https://pixi.sh");
}

// --- Detect mode: folder vs flag-based ---

const folderArg = positionals[0];
const isFolderMode = folderArg && existsSync(folderArg) && fstatSync(resolve(folderArg)).isDirectory();

let config;

if (isFolderMode) {
  const folderPath = resolve(folderArg);
  const files = readdirSync(folderPath);

  // Load song.yaml if present
  let parsedYaml;
  const yamlPath = join(folderPath, "song.yaml");
  if (existsSync(yamlPath)) {
    parsedYaml = yaml.load(readFileSync(yamlPath, "utf-8"));
  }

  try {
    config = resolveConfig(flags, { folderPath, files, yaml: parsedYaml });
  } catch (err) {
    fatal(err.message);
  }
} else {
  // Legacy flag-based mode
  if (!flags.input) {
    fatal(
      "Usage: node scripts/generate.mjs <folder>\n" +
      "       node scripts/generate.mjs --input song.mp3 [--lyrics lyrics.txt] [--style neon]"
    );
  }

  const inputPath = resolve(flags.input);
  if (!existsSync(inputPath)) {
    fatal(`Audio file not found: ${inputPath}`);
  }

  const { parse: parsePath } = await import("path");
  const songName = parsePath(inputPath).name;
  const hasInstrumental = !!flags.instrumental;
  const previewSuffix = flags.preview ? " preview" : "";

  config = {
    title: songName,
    songPath: inputPath,
    lyricsPath: flags.lyrics ? resolve(flags.lyrics) : null,
    instrumentalPath: flags.instrumental ? resolve(flags.instrumental) : null,
    backgroundPath: flags.background ? resolve(flags.background) : null,
    alignedLyricsPath: null,
    style: flags.style || (flags.background ? "minimal" : "neon"),
    model: flags.model || "base",
    language: flags.language || null,
    generateKaraoke: hasInstrumental,
    retranscribe: flags.retranscribe || false,
    preview: flags.preview || false,
    lyricOutputPath: flags.output
      ? resolve(flags.output)
      : resolve(homedir(), "Videos", `${songName}${previewSuffix}.mp4`),
    karaokeOutputPath: resolve(homedir(), "Videos", `${songName} karaoke${previewSuffix}.mp4`),
    folderPath: null,
  };

  // Validate flag-based inputs
  if (config.lyricsPath && !existsSync(config.lyricsPath)) {
    fatal(`Lyrics file not found: ${config.lyricsPath}`);
  }
  if (config.instrumentalPath && !existsSync(config.instrumentalPath)) {
    fatal(`Instrumental file not found: ${config.instrumentalPath}`);
  }
  if (config.instrumentalPath && !config.lyricsPath) {
    fatal("--instrumental requires --lyrics (karaoke needs known lyrics for word timing)");
  }
}

// --- Step 1: Transcription (or cache hit) ---

let transcript;
const cachedPath = config.alignedLyricsPath;
const forceTranscribe = config.retranscribe || flags["only-transcribe"];
const hasCached = cachedPath && existsSync(cachedPath) && !forceTranscribe;

if (hasCached) {
  console.log(`\n--- Step 1: Using cached transcript: ${cachedPath} ---\n`);
  transcript = JSON.parse(readFileSync(cachedPath, "utf-8"));

  // Detect old format (duplicated word data on lines)
  if (transcript.lines && transcript.lines[0] && transcript.lines[0].words) {
    console.log("WARNING: Cached transcript uses old format (duplicated word data).");
    console.log("Run with --retranscribe to regenerate: make transcribe " + (config.folderPath || ""));
    fatal("Incompatible transcript format");
  }
} else {
  console.log("\n--- Step 1: Transcription ---\n");

  // Transcribe to a temp location, then save to cache
  const transcriptTmp = resolve("src/transcript.json");
  const transcribeArgs = [
    "run", "python", "scripts/transcribe.py",
    "--input", config.songPath,
    "--output", transcriptTmp,
    "--model", config.model,
  ];
  if (config.lyricsPath) {
    transcribeArgs.push("--lyrics", config.lyricsPath);
  }
  if (config.language) {
    transcribeArgs.push("--language", config.language);
  }

  const transcribeResult = spawnSync("pixi", transcribeArgs, {
    stdio: "inherit",
    cwd: resolve("."),
  });
  if (transcribeResult.status !== 0) {
    fatal("Transcription failed");
  }

  transcript = JSON.parse(readFileSync(transcriptTmp, "utf-8"));

  // Cache the transcript to the song folder
  if (cachedPath) {
    writeFileSync(cachedPath, JSON.stringify(transcript, null, 2));
    console.log(`Cached transcript to ${cachedPath}`);
  }
}

// --- Early exit if only transcribing ---

if (flags["only-transcribe"]) {
  console.log("\nDone! (transcribe only)");
  process.exit(0);
}

// --- Open Studio if requested ---

if (flags.open) {
  console.log("\n--- Opening Remotion Studio ---\n");
  console.log("Close Studio and press Ctrl+C when ready to render.");
  spawnSync("npx", ["remotion", "studio"], { stdio: "inherit" });
}

// --- Analyze background image if provided ---

let backgroundProps = {};
if (config.backgroundPath) {
  if (!existsSync(config.backgroundPath)) {
    fatal(`Background image not found: ${config.backgroundPath}`);
  }
  console.log("\n--- Analyzing background image ---\n");
  const colors = await analyzeBackgroundImage(config.backgroundPath);
  backgroundProps = {
    backgroundSourcePath: config.backgroundPath,
    ...colors,
  };
}

// --- Render lyric video ---

const renderLyric = !flags["only-karaoke"];
const renderKaraoke = config.generateKaraoke && !flags["only-lyric"];

if (renderLyric) {
  console.log("\n--- Rendering lyric video ---\n");

  renderVideo({
    transcript,
    style: config.style,
    audioSourcePath: config.songPath,
    outputPath: config.lyricOutputPath,
    compositionId: "LyricVideo",
    preview: config.preview,
    ...backgroundProps,
  });
}

// --- Render karaoke video ---

if (renderKaraoke) {
  console.log("\n--- Rendering karaoke video ---\n");

  const countdownDuration =
    transcript.verses && transcript.verses.length > 0 && transcript.verses[0].start < 5
      ? 5
      : 0;

  renderVideo({
    transcript,
    style: config.style,
    audioSourcePath: config.instrumentalPath,
    outputPath: config.karaokeOutputPath,
    compositionId: "KaraokeVideo",
    countdownDuration,
    preview: config.preview,
    ...backgroundProps,
  });
}

console.log("\nDone!");
