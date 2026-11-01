import sharp from "sharp";

export const maxPictureBytes = 8 * 1024 * 1024;
const accepted = new Set(["jpeg", "png", "webp"]);

/**
 * A photo as the app keeps it: read by its content, never its name; turned upright, shrunk to at
 * most 1600 px, WebP. sharp writes no metadata unless asked, so camera data such as GPS is gone.
 */
export async function toPicture(data: Uint8Array): Promise<Buffer | "unsupported"> {
  try {
    const { format } = await sharp(data).metadata();
    if (!format || !accepted.has(format)) return "unsupported";
    return await sharp(data)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch {
    return "unsupported";
  }
}
