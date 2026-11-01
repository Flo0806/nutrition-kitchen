// Draws every icon and the link preview from app/assets/brand/mark.svg into public/.
// The preview uses the fonts of a build: run `pnpm build` first, then `pnpm brand`.
import { readFileSync, readdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import sharp from "sharp";

const root = resolve(import.meta.dirname, "..");
const mark = readFileSync(join(root, "app/assets/brand/mark.svg"));
const out = (name) => join(root, "public", name);
const png = (size, svg = mark) => sharp(svg, { density: 1200 }).resize(size, size).png().toBuffer();

// Home screens round the corners themselves: those icons get the full square.
const square = Buffer.from(mark.toString().replace('rx="14"', 'rx="0"'));

/** An .ico of PNG images, as every browser since Vista reads it. */
function ico(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + index * 16;
    header.writeUInt8(size, entry);
    header.writeUInt8(size, entry + 1);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map(({ data }) => data)]);
}

writeFileSync(out("favicon.svg"), mark);
writeFileSync(
  out("favicon.ico"),
  ico(await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(size) })))),
);
writeFileSync(out("apple-touch-icon.png"), await png(180, square));
writeFileSync(out("icon-192.png"), await png(192, square));
writeFileSync(out("icon-512.png"), await png(512, square));

// The fonts as the build serves them, rewritten to files on disk.
const build = [".output", ".output-e2e"]
  .map((dir) => join(root, dir, "public"))
  .find((dir) => {
    try {
      return readdirSync(join(dir, "_fonts")).length > 0;
    } catch {
      return false;
    }
  });
if (!build) throw new Error("No build with fonts found: run `pnpm build` first.");
const css = readdirSync(join(build, "_nuxt"))
  .filter((file) => file.endsWith(".css"))
  .map((file) => readFileSync(join(build, "_nuxt", file), "utf8"))
  .join("\n");
const fontFaces = (css.match(/@font-face\{[^}]*\}/g) ?? [])
  .filter((rule) => rule.includes("url("))
  .map((rule) =>
    rule.replace(/url\(\.\.\/_fonts\//g, `url(${pathToFileURL(join(build, "_fonts"))}/`),
  )
  .join("\n");

const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
${fontFaces}
body { margin: 0; width: 1200px; height: 630px; background: #2f7a4f; display: grid; place-items: center; }
.label { position: relative; width: 860px; background: #fff; border: 4px solid #000; padding: 36px 44px 30px;
  font-family: Archivo, sans-serif; color: #000; transform: rotate(-2deg); box-shadow: 0 18px 0 #224c35; }
h1 { margin: 0; font-size: 92px; font-weight: 700; letter-spacing: -0.02em; line-height: 1; }
.rule { height: 22px; background: #000; margin: 22px 0 6px; }
.row { display: flex; justify-content: space-between; align-items: baseline; border-top: 2px solid #000;
  padding: 12px 0; font-size: 38px; }
.row:first-of-type { border-top: 0; }
.row b { font-weight: 700; }
.row span { font-family: "Atkinson Hyperlegible Next", sans-serif; font-size: 30px; color: #1e2b24; }
img { position: absolute; top: -70px; right: -70px; width: 190px; transform: rotate(9deg); }
</style></head><body><div class="label">
<img src="data:image/svg+xml;base64,${mark.toString("base64")}" alt="">
<h1>Nutrition Kitchen</h1><div class="rule"></div>
<div class="row"><b>Rezept eingeben</b><span>aus über 7.000 Lebensmitteln</span></div>
<div class="row"><b>Nährwerte ablesen</b><span>als Etikett nach EU-Recht</span></div>
<div class="row"><b>Teilen</b><span>frei, ohne Tracking</span></div>
</div></body></html>`;

const dir = mkdtempSync(join(tmpdir(), "nutrition-kitchen-brand-"));
try {
  const file = join(dir, "og.html");
  writeFileSync(file, html);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(file).href);
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(out("og.png"), await page.screenshot({ type: "png" }));
  await browser.close();
} finally {
  rmSync(dir, { recursive: true });
}
