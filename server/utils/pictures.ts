import { randomBytes } from "node:crypto";
import { createError } from "nuxt/server";

/** Random and long enough not to be guessed: pictures are served to anyone with the name. */
export const pictureName = /^[A-Za-z0-9_-]{16}\.webp$/;

export function newPictureName() {
  return `${randomBytes(12).toString("base64url")}.webp`;
}

export function usePictures() {
  return useStorage("pictures");
}

/** Every new picture file counts, uploaded or copied: at most 20 per hour and user. */
export function checkPictureRate(userId: number) {
  if (!allowRate(`picture:${userId}`, 20, 60 * 60 * 1000)) {
    throw createError({ statusCode: 429, statusMessage: "Too many pictures, try again later" });
  }
}
