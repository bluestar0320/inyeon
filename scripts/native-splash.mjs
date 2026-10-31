// 앱을 켜는 순간의 화면(스플래시). Capacitor는 흰 바탕에 자기 로고를 깔아 둔다.
// 받은 png마다 같은 크기로, 아이콘 바탕색 위에 시계 아이콘을 가운데 작게 얹어 덮어쓴다.
// 쓰임: node scripts/native-splash.mjs <splash.png>...  (apk.yml, ios.yml)
import sharp from "sharp";

const BG = "#24252d"; // public/icon-maskable.png의 바탕색. 아이콘과 이어져 보이게.
for (const file of process.argv.slice(2)) {
  const { width, height } = await sharp(file).metadata();
  const size = Math.round(Math.min(width, height) * 0.5);
  const icon = await sharp("public/icon-maskable.png").resize(size, size).toBuffer();
  await sharp({ create: { width, height, channels: 3, background: BG } })
    .composite([{ input: icon }])
    .png()
    .toFile(`${file}.tmp`);
  const { rename } = await import("node:fs/promises");
  await rename(`${file}.tmp`, file);
  console.log(file, width, height);
}
