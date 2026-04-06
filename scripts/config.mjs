import { resolve, basename } from "path";

/**
 * Derive a title from a folder name: replace _/- with spaces, title-case each word.
 */
function titleFromFolder(folderPath) {
  const name = basename(folderPath);
  return name
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Resolve config from CLI flags, song.yaml contents, and convention defaults.
 *
 * @param {object} flags - CLI flags (highest priority)
 * @param {object} folder - { folderPath, files, yaml? }
 * @returns {object} Resolved config
 */
export function resolveConfig(flags, folder) {
  const { folderPath, files, yaml } = folder;
  const y = yaml || {};
  const has = (name) => files.includes(name);

  const title = flags.title || y.title || titleFromFolder(folderPath);

  const songFile = flags.input ? basename(flags.input) : (y.song_path || "song.mp3");
  const songPath = flags.input ? resolve(flags.input) : resolve(folderPath, songFile);

  const lyricsFile = flags.lyrics ? basename(flags.lyrics) : (y.lyrics_path || "lyrics.txt");
  const lyricsFullPath = flags.lyrics ? resolve(flags.lyrics) : resolve(folderPath, lyricsFile);
  const lyricsPath = flags.lyrics ? lyricsFullPath : (has(lyricsFile) ? lyricsFullPath : null);

  const instrumentalFile = flags.instrumental
    ? basename(flags.instrumental)
    : (y.instrumental_path || "instrumental.mp3");
  const instrumentalFullPath = flags.instrumental
    ? resolve(flags.instrumental)
    : resolve(folderPath, instrumentalFile);
  const instrumentalPath = flags.instrumental
    ? instrumentalFullPath
    : (has(instrumentalFile) ? instrumentalFullPath : null);

  // Background image
  const backgroundPath = flags.background
    ? resolve(flags.background)
    : y.background
      ? resolve(folderPath, y.background)
      : null;

  const alignedFile = y.aligned_lyrics || "lyrics.json";
  const alignedLyricsPath = resolve(folderPath, alignedFile);

  const style = flags.style || y.style || "minimal";
  const model = flags.model || y.model || "base";
  const language = flags.language || y.language || null;
  const generateKaraoke = flags.instrumental
    ? true
    : (y.generate_karaoke || false);
  const retranscribe = flags.retranscribe || false;
  const preview = flags.preview || false;

  const outputDir = flags["output-folder"]
    ? resolve(flags["output-folder"])
    : folderPath;
  const previewSuffix = preview ? " preview" : "";
  const lyricOutputPath = flags.output
    ? resolve(flags.output)
    : resolve(outputDir, `${title}${previewSuffix}.mp4`);
  const karaokeOutputPath = resolve(outputDir, `${title} karaoke${previewSuffix}.mp4`);

  if (generateKaraoke) {
    if (!lyricsPath) {
      throw new Error(
        `Karaoke mode requires lyrics. Expected ${lyricsFile} in ${folderPath} or provide --lyrics`,
      );
    }
    if (!instrumentalPath) {
      throw new Error(
        `Karaoke mode requires instrumental track. Expected ${instrumentalFile} in ${folderPath} or provide --instrumental`,
      );
    }
  }

  return {
    title,
    songPath,
    lyricsPath,
    instrumentalPath,
    alignedLyricsPath,
    style,
    model,
    language,
    generateKaraoke,
    retranscribe,
    preview,
    lyricOutputPath,
    karaokeOutputPath,
    backgroundPath,
    folderPath,
  };
}
