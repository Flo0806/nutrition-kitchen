import sharp from "sharp";

export const maxPictureBytes = 8 * 1024 * 1024;
// Far above any phone photo; a small file can claim billions of pixels and cost the memory.
export const maxPicturePixels = 100_000_000;
const accepted = new Set(["jpeg", "png", "webp"]);

/**
 * A photo as the app keeps it: read by its content, never its name; turned upright, shrunk to at
 * most 1600 px, WebP. sharp writes no metadata unless asked, so camera data such as GPS is gone.
 */
export async function toPicture(
  data: Uint8Array,
): Promise<Buffer | "unsupported" | "tooManyPixels"> {
  try {
    // The header only: the size is known before a single pixel is decoded.
    const { format, width, height } = await sharp(data).metadata();
    if (!format || !accepted.has(format)) return "unsupported";
    if ((width ?? 0) * (height ?? 0) > maxPicturePixels) return "tooManyPixels";
    return await sharp(data, { limitInputPixels: maxPicturePixels })
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return "unsupported";
  }
}
