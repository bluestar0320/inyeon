/**
 * 링크 미리보기 그림(public/og.jpg, 1200×630)을 만든다. 문구나 사진을 바꿀 때만 다시 돌린다.
 *   node scripts/og-image.mjs
 * 앱 안의 저녁상 사진과 명조 글꼴을 그대로 써서, 미리보기와 앱이 같은 모습이 되게 한다.
 */
import { chromium } from "@playwright/test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const pub = (p) => pathToFileURL(join(process.cwd(), "public", p)).href;

const html = `<!doctype html><meta charset="utf-8">
<link rel="stylesheet" href="${pub("fonts/nanum-myeongjo/font.css")}">
<style>
  body { margin: 0; width: 1200px; height: 630px; display: flex; background: rgb(240 232 219) url(${pub("paper/paper-1.webp")}) center/cover; }
  img { width: 630px; height: 630px; object-fit: cover; }
  div { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 0 64px; font-family: 'Nanum Myeongjo', serif; color: rgb(42 34 28); }
  p { margin: 0; font-size: 50px; line-height: 1.45; letter-spacing: -0.5px; }
  small { margin-top: 48px; font-size: 26px; color: rgb(112 96 83); }
</style>
<img src="${pub("photos/mother.webp")}">
<div><p>어머니와 남은<br>저녁 식사,<br>몇 번일까요?</p><small>몇 번 더</small></div>`;

const dir = mkdtempSync(join(tmpdir(), "og-"));
const file = join(dir, "og.html");
writeFileSync(file, html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(file).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "public/og.jpg", type: "jpeg", quality: 85 });
await browser.close();
console.log("public/og.jpg");
