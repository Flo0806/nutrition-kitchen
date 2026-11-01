import { randomBytes } from "node:crypto";

/** Random and long enough not to be guessed: pictures are served to anyone with the name. */
export const pictureName = /^[A-Za-z0-9_-]{16}\.webp$/;

export function newPictureName() {
  return `${randomBytes(12).toString("base64url")}.webp`;
}

export function usePictures() {
  return useStorage("pictures");
}
