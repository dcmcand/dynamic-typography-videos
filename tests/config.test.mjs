import { describe, it, expect } from "vitest";
import { resolveConfig } from "../scripts/config.mjs";

describe("resolveConfig", () => {
  describe("title derivation from folder name", () => {
    it("converts underscores to spaces and title-cases", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/paper_dragons", files: ["song.mp3"] },
      );
      expect(config.title).toBe("Paper Dragons");
    });

    it("converts dashes to spaces and title-cases", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/my-cool-song", files: ["song.mp3"] },
      );
      expect(config.title).toBe("My Cool Song");
    });

    it("yaml title overrides derived title", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/ven_aca_p_aca",
          files: ["song.mp3", "song.yaml"],
          yaml: { title: "Ven Aca p'aca" },
        },
      );
      expect(config.title).toBe("Ven Aca p'aca");
    });

    it("cli flag overrides yaml title", () => {
      const config = resolveConfig(
        { title: "Override Title" },
        {
          folderPath: "/fake/contents/ven_aca_p_aca",
          files: ["song.mp3", "song.yaml"],
          yaml: { title: "Ven Aca p'aca" },
        },
      );
      expect(config.title).toBe("Override Title");
    });
  });

  describe("convention defaults", () => {
    it("uses song.mp3 as default song path", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.songPath).toBe("/fake/contents/test/song.mp3");
    });

    it("uses lyrics.txt as default lyrics path when file exists", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3", "lyrics.txt"] },
      );
      expect(config.lyricsPath).toBe("/fake/contents/test/lyrics.txt");
    });

    it("sets lyricsPath to null when lyrics.txt does not exist", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.lyricsPath).toBe(null);
    });

    it("uses minimal as default style", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.style).toBe("minimal");
    });

    it("uses base as default model", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.model).toBe("base");
    });

    it("defaults generate_karaoke to false", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.generateKaraoke).toBe(false);
    });
  });

  describe("yaml overrides conventions", () => {
    it("yaml style overrides default", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "song.yaml"],
          yaml: { style: "neon" },
        },
      );
      expect(config.style).toBe("neon");
    });

    it("yaml generate_karaoke enables karaoke", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "lyrics.txt", "instrumental.mp3", "song.yaml"],
          yaml: { generate_karaoke: true },
        },
      );
      expect(config.generateKaraoke).toBe(true);
    });

    it("yaml language is passed through", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "song.yaml"],
          yaml: { language: "es" },
        },
      );
      expect(config.language).toBe("es");
    });
  });

  describe("cli flags override yaml", () => {
    it("cli style overrides yaml style", () => {
      const config = resolveConfig(
        { style: "bold" },
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "song.yaml"],
          yaml: { style: "neon" },
        },
      );
      expect(config.style).toBe("bold");
    });

    it("cli language overrides yaml language", () => {
      const config = resolveConfig(
        { language: "en" },
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "song.yaml"],
          yaml: { language: "es" },
        },
      );
      expect(config.language).toBe("en");
    });
  });

  describe("output paths", () => {
    it("defaults output to song folder", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/paper_dragons", files: ["song.mp3"] },
      );
      expect(config.lyricOutputPath).toBe("/fake/contents/paper_dragons/Paper Dragons.mp4");
    });

    it("karaoke output has karaoke suffix", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/paper_dragons",
          files: ["song.mp3", "lyrics.txt", "instrumental.mp3", "song.yaml"],
          yaml: { generate_karaoke: true },
        },
      );
      expect(config.karaokeOutputPath).toBe("/fake/contents/paper_dragons/Paper Dragons karaoke.mp4");
    });

    it("output-folder overrides output directory", () => {
      const config = resolveConfig(
        { "output-folder": "/tmp/out" },
        { folderPath: "/fake/contents/paper_dragons", files: ["song.mp3"] },
      );
      expect(config.lyricOutputPath).toBe("/tmp/out/Paper Dragons.mp4");
    });
  });

  describe("aligned lyrics caching", () => {
    it("defaults aligned lyrics path to lyrics.json in folder", () => {
      const config = resolveConfig(
        {},
        { folderPath: "/fake/contents/test", files: ["song.mp3"] },
      );
      expect(config.alignedLyricsPath).toBe("/fake/contents/test/lyrics.json");
    });

    it("yaml aligned_lyrics overrides default", () => {
      const config = resolveConfig(
        {},
        {
          folderPath: "/fake/contents/test",
          files: ["song.mp3", "song.yaml"],
          yaml: { aligned_lyrics: "custom.json" },
        },
      );
      expect(config.alignedLyricsPath).toBe("/fake/contents/test/custom.json");
    });
  });

  describe("validation", () => {
    it("errors when generate_karaoke is true but lyrics missing", () => {
      expect(() =>
        resolveConfig(
          {},
          {
            folderPath: "/fake/contents/test",
            files: ["song.mp3", "instrumental.mp3", "song.yaml"],
            yaml: { generate_karaoke: true },
          },
        ),
      ).toThrow(/lyrics/i);
    });

    it("errors when generate_karaoke is true but instrumental missing", () => {
      expect(() =>
        resolveConfig(
          {},
          {
            folderPath: "/fake/contents/test",
            files: ["song.mp3", "lyrics.txt", "song.yaml"],
            yaml: { generate_karaoke: true },
          },
        ),
      ).toThrow(/instrumental/i);
    });
  });
});
