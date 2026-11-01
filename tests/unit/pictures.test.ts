import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { toPicture } from "../../server/pictures/convert";

const image = (format: "jpeg" | "png" | "webp" | "gif", width = 40, height = 30) =>
  sharp({ create: { width, height, channels: 3, background: "#2f7a4f" } })
    .toFormat(format)
    .toBuffer();

describe("toPicture", () => {
  it.each(["jpeg", "png", "webp"] as const)("turns a %s into WebP", async (format) => {
    const picture = await toPicture(await image(format));
    if (picture === "unsupported") throw new Error("refused");
    expect(await sharp(picture).metadata()).toMatchObject({
      format: "webp",
      width: 40,
      height: 30,
    });
  });

  it("shrinks a large photo to 1600 px and never enlarges a small one", async () => {
    const large = await toPicture(await image("jpeg", 4000, 3000));
    if (large === "unsupported") throw new Error("refused");
    expect(await sharp(large).metadata()).toMatchObject({ width: 1600, height: 1200 });
  });

  it("drops camera data such as EXIF", async () => {
    const tagged = await sharp(await image("jpeg"))
      .withExif({ IFD0: { Copyright: "Flo", ImageDescription: "secret place" } })
      .toBuffer();
    expect((await sharp(tagged).metadata()).exif).toBeDefined();
    const picture = await toPicture(tagged);
    if (picture === "unsupported") throw new Error("refused");
    expect((await sharp(picture).metadata()).exif).toBeUndefined();
  });

  it("judges by content, not by name: other formats and other files are refused", async () => {
    expect(await toPicture(await image("gif"))).toBe("unsupported");
    expect(await toPicture(new TextEncoder().encode("MZ this is no picture"))).toBe("unsupported");
    expect(await toPicture(new Uint8Array())).toBe("unsupported");
  });

  it("refuses more than 100 megapixels before decoding them", async () => {
    // 10001 x 10000 PNG of one colour: small file, too many pixels.
    const bomb = await sharp({
      create: { width: 10_001, height: 10_000, channels: 3, background: "#fff" },
    })
      .png()
      .toBuffer();
    expect(await toPicture(bomb)).toBe("tooManyPixels");
    const edge = await sharp({
      create: { width: 10_000, height: 10_000, channels: 3, background: "#fff" },
    })
      .png()
      .toBuffer();
    expect(await toPicture(edge)).toBeInstanceOf(Buffer);
  });
});
