import sharp from "sharp";

/**
 * Linearize an sRGB channel value (0-255) to linear RGB (0-1).
 */
function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Analyze a background image and return accessible font/shadow colors.
 *
 * Resizes to 16x16, computes average luminance per WCAG 2.1,
 * and picks white or near-black text accordingly.
 *
 * @param {string} imagePath - Absolute path to image file
 * @returns {Promise<{autoFontColor: string, autoShadowColor: string}>}
 */
export async function analyzeBackgroundImage(imagePath) {
  const { data, info } = await sharp(imagePath)
    .resize(16, 16, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  const pixelCount = info.width * info.height;

  for (let i = 0; i < data.length; i += 3) {
    totalR += data[i];
    totalG += data[i + 1];
    totalB += data[i + 2];
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;

  const luminance =
    0.2126 * linearize(avgR) +
    0.7152 * linearize(avgG) +
    0.0722 * linearize(avgB);

  if (luminance < 0.5) {
    return {
      autoFontColor: "#ffffff",
      autoShadowColor: "rgba(0,0,0,0.7)",
    };
  } else {
    return {
      autoFontColor: "#1a1a1a",
      autoShadowColor: "rgba(255,255,255,0.7)",
    };
  }
}
