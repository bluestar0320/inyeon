/**
 * 편지지(public/paper/letter.webp, 1080×1350)를 만든다. 구김 없이, 세월에 바랜 색과 얼룩만.
 *   node scripts/stained-paper.mjs
 * 씨앗을 고정해 돌릴 때마다 같은 종이가 나온다. 모양을 바꾸려면 SEED를 바꾼다.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const SEED = 20261012;

const browser = await chromium.launch();
const page = await browser.newPage();
const dataUrl = await page.evaluate((seed) => {
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const W = 1080, H = 1350;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d");

  // 바탕: 가운데는 크림, 가장자리로 갈수록 누렇게.
  const base = ctx.createRadialGradient(W / 2, H / 2, W * 0.2, W / 2, H / 2, H * 0.75);
  base.addColorStop(0, "#f4ead6");
  base.addColorStop(0.7, "#ecdcbd");
  base.addColorStop(1, "#d9c096");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, W, H);

  // 고르지 않게 바랜 자리: 크고 흐린 얼룩을 많이.
  for (let i = 0; i < 160; i++) {
    const x = rnd() * W, y = rnd() * H, r = 60 + rnd() * 220;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.018 + rnd() * 0.03;
    g.addColorStop(0, `rgba(165, 120, 60, ${a})`);
    g.addColorStop(1, "rgba(165, 120, 60, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }

  // 찻잔 자국: 끊기고 굵기가 들쭉날쭉한 고리. 반듯한 원이면 가짜 같다.
  const cup = (x, y, r, a) => {
    const start = rnd() * Math.PI * 2;
    const span = Math.PI * (1.2 + rnd() * 0.6);
    const ph = [rnd() * 6, rnd() * 6];
    for (let t = 0; t < span; t += 0.02) {
      const ang = start + t;
      const rr = r * (1 + 0.025 * Math.sin(ang * 3 + ph[0]) + 0.015 * Math.sin(ang * 7 + ph[1]));
      const fade = Math.sin((t / span) * Math.PI);
      ctx.beginPath();
      ctx.arc(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr, 1 + fade * (1.5 + rnd() * 1.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(135, 90, 40, ${a * fade * (0.5 + rnd() * 0.5)})`;
      ctx.fill();
    }
  };
  // 물 얼룩: 모양이 고르지 않은 번짐, 마른 가장자리만 조금 진하게.
  const water = (x, y, r, a) => {
    const ph = [rnd() * 6, rnd() * 6, rnd() * 6];
    const path = new Path2D();
    for (let k = 0; k <= 120; k++) {
      const ang = (k / 120) * Math.PI * 2;
      const rr = r * (1 + 0.22 * Math.sin(ang * 2 + ph[0]) + 0.12 * Math.sin(ang * 5 + ph[1]) + 0.06 * Math.sin(ang * 11 + ph[2]));
      const px = x + Math.cos(ang) * rr, py = y + Math.sin(ang) * rr * 0.8;
      if (k === 0) path.moveTo(px, py); else path.lineTo(px, py);
    }
    ctx.filter = "blur(6px)";
    ctx.fillStyle = `rgba(175, 130, 70, ${a * 0.35})`;
    ctx.fill(path);
    ctx.filter = "blur(2.5px)";
    ctx.lineWidth = 3;
    ctx.strokeStyle = `rgba(140, 95, 45, ${a})`;
    ctx.stroke(path);
    ctx.filter = "none";
  };
  cup(W * 0.84, H * 0.11, 105, 0.22);
  water(W * 0.13, H * 0.88, 95, 0.16);
  water(W * 0.9, H * 0.62, 55, 0.1);

  // 여기저기 핀 잔점(여우 얼룩). 가장자리에 더 많이.
  for (let i = 0; i < 90; i++) {
    const edge = rnd() < 0.7;
    const x = edge ? (rnd() < 0.5 ? rnd() * W * 0.18 : W - rnd() * W * 0.18) : rnd() * W;
    const y = rnd() * H;
    const r = 1 + rnd() * 5;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(130, 85, 40, ${0.08 + rnd() * 0.2})`;
    ctx.filter = `blur(${0.5 + rnd() * 1.5}px)`;
    ctx.fill();
  }
  ctx.filter = "none";

  // 종이 결: 아주 잔 낟알.
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rnd() - 0.5) * 10;
    d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8;
  }
  ctx.putImageData(img, 0, 0);

  // 가장자리를 한 번 더 태운다.
  const burn = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, H * 0.72);
  burn.addColorStop(0, "rgba(120, 80, 35, 0)");
  burn.addColorStop(1, "rgba(120, 80, 35, 0.28)");
  ctx.fillStyle = burn;
  ctx.fillRect(0, 0, W, H);

  return c.toDataURL("image/webp", 0.82);
}, SEED);
await browser.close();

const out = join(process.cwd(), "public", "paper", "letter.webp");
writeFileSync(out, Buffer.from(dataUrl.split(",")[1], "base64"));
console.log(out);
