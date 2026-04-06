import { describe, it, expect } from "vitest";
import { analyzeBackgroundImage } from "../scripts/analyze-image.mjs";
import sharp from "sharp";
import { join } from "path";
import { mkdirSync, unlinkSync } from "fs";

const tmpDir = join(import.meta.dirname, "tmp-test-images");

async function createTestImage(filename, r, g, b) {
  mkdirSync(tmpDir, { recursive: true });
  const path = join(tmpDir, filename);
  await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r, g, b },
    },
  })
    .jpeg()
    .toFile(path);
  return path;
}

describe("analyzeBackgroundImage", () => {
  it("returns white text for a dark image", async () => {
    const path = await createTestImage("dark.jpg", 20, 20, 30);
    const result = await analyzeBackgroundImage(path);
    expect(result.autoFontColor).toBe("#ffffff");
    expect(result.autoShadowColor).toBe("rgba(0,0,0,0.7)");
    unlinkSync(path);
  });

  it("returns dark text for a light image", async () => {
    const path = await createTestImage("light.jpg", 240, 235, 220);
    const result = await analyzeBackgroundImage(path);
    expect(result.autoFontColor).toBe("#1a1a1a");
    expect(result.autoShadowColor).toBe("rgba(255,255,255,0.7)");
    unlinkSync(path);
  });

  it("returns white text for a mid-dark image", async () => {
    const path = await createTestImage("middark.jpg", 80, 60, 70);
    const result = await analyzeBackgroundImage(path);
    expect(result.autoFontColor).toBe("#ffffff");
    unlinkSync(path);
  });
});
