/**
 * 앱 아이콘을 한 그림에서 모두 만든다. 그림을 바꿀 때만 다시 돌린다.
 *   node scripts/app-icon.mjs
 *
 * 시계 테두리 끝이 점으로 흩어지며 사라진다 — 남은 시간이 줄어든다는 뜻.
 * 그냥 시계만 두면 폰의 기본 시계 앱과 헷갈린다.
 *
 * 만드는 것:
 *   app/icon.svg              브라우저 탭
 *   public/icon-192.png, -512 웹에서 설치할 때(모서리 둥근 판)
 *   public/icon-maskable.png  안드로이드가 모양을 잘라 쓰는 판. 잘려도 되게 그림을 줄여 가운데에
 *   public/icon-monochrome.png 안드로이드 13+ 「테마 아이콘」: 투명 바탕에 흰 그림만, 색은 폰이 입힌다
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";

const BG = "#24252d";
const INK = "#fbfaf8";
const ACCENT = "#d9805a";

const point = (deg, r) => {
  const a = ((deg - 90) * Math.PI) / 180;
  return [256 + r * Math.cos(a), 256 + r * Math.sin(a)];
};

/** 512 판 위의 시계. ink·accent를 바꾸면 단색판도 된다. */
function clock(ink, accent) {
  const [x1, y1] = point(120, 144);
  const [x2, y2] = point(360, 144);
  // 4시 무렵부터 12시까지 테두리가 남고, 12시에서 4시 사이는 점으로 흩어진다.
  let s = `<path d="M${x1} ${y1} A144 144 0 1 1 ${x2} ${y2}" fill="none" stroke="${ink}" stroke-width="32" stroke-linecap="round"/>`;
  for (const [deg, r, opacity] of [[100, 13, 1], [80, 11, 0.85], [62, 9, 0.7], [46, 7.5, 0.55], [32, 6, 0.4], [20, 5, 0.3]]) {
    const [x, y] = point(deg, 144);
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${ink}" opacity="${opacity}"/>`;
  }
  return s + `<path d="M256 152V256l72 45" fill="none" stroke="${accent}" stroke-width="32" stroke-linecap="round" stroke-linejoin="round"/>`;
}

const svg = (inner, bg = "") => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg}${inner}</svg>`;
// 마스커블·단색판은 안전 영역(지름 80%) 안에 들어가도록 그림을 줄인다.
const shrink = (inner) => `<g transform="translate(256 256) scale(0.72) translate(-256 -256)">${inner}</g>`;

const rounded = svg(clock(INK, ACCENT), `<rect width="512" height="512" rx="112" fill="${BG}"/>`);
const maskable = svg(shrink(clock(INK, ACCENT)), `<rect width="512" height="512" fill="${BG}"/>`);
const monochrome = svg(shrink(clock("#fff", "#fff")));

writeFileSync("app/icon.svg", rounded + "\n");
const png = (s, size, out) => sharp(Buffer.from(s)).resize(size, size).png().toFile(out);
await png(rounded, 192, "public/icon-192.png");
await png(rounded, 512, "public/icon-512.png");
await png(maskable, 512, "public/icon-maskable.png");
await png(monochrome, 432, "public/icon-monochrome.png");
