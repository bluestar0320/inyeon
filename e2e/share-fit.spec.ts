import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 공유 카드의 숫자와 단위가 카드 밖으로 나가지 않는지 픽셀로 본다.
 * 예전에는 자릿수만 보고 글자 크기를 골라, "3,614 times"처럼 단위가 긴 언어에서 넘쳤다.
 */

const now = new Date().toISOString();

function state(lang: string, name: string, count: number, unit: string, theme = "light", relation?: string) {
  return {
    version: 1,
    profile: { ageYears: 20, ageAsOf: "2026-01-01", lifeExpectancy: 90, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
    people: [{ id: "p1", name, relation, emoji: "👩‍👩‍👧‍👦", ageYears: 20, ageAsOf: "2026-01-01", lifeExpectancy: 90, lifeExpectancyManual: true,
      countryCode: "KR", sex: "female", frequency: { count, unit }, filters: [], createdAt: now, updatedAt: now }],
    moments: [], marriage: null,
    settings: { tone: "calm", theme, showPast: true, language: lang },
  };
}

async function card(page: Page, s: unknown) {
  await clearState(page);
  await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: STORAGE_KEY, value: s });
  await page.goto("/people/detail/?id=p1");
  await page.waitForTimeout(400);
  const dl = page.waitForEvent("download");
  await page.getByTestId("share-card").first().click();
  const d = await dl;
  const chunks: Buffer[] = [];
  for await (const c of await d.createReadStream()) chunks.push(c as Buffer);
  const bytes = Buffer.concat(chunks);
  // 카드 안쪽 테두리(좌우 72px 여백의 흰 카드) 밖으로 글자가 나갔는지: 브라우저에서 픽셀을 본다.
  const overflow = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    // 여백 띠(x 0..60, 1020..1080)에서 배경과 다른 픽셀 수
    const bg = ctx.getImageData(5, 5, 1, 1).data;
    let n = 0;
    for (const x0 of [0, 1012]) {
      const d = ctx.getImageData(x0, 150, 68, 1050).data;
      for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - bg[0]) + Math.abs(d[i + 1] - bg[1]) + Math.abs(d[i + 2] - bg[2]) > 60) n++;
    }
    return { w: img.width, h: img.height, strayPixels: n };
  }, bytes.toString("base64"));
  expect(overflow.w).toBe(1080);
  expect(overflow.h).toBe(1350);
  return overflow;
}

const LONG = "할머니할아버지외삼촌이모고모사촌동생조카며느리사위".repeat(3);
const cases: [string, string, number, string][] = [
  ["ko", LONG, 1, "month"],
  ["ko", "엄마 🌸💐🎂", 3, "day"],
  ["en", "Grandma Elizabeth Alexandra Mary Windsor-Mountbatten", 3, "day"],
  ["es", "Abuela María de los Ángeles Fernández", 30, "day"],
  ["ja", "おばあちゃん", 100, "day"],
  ["zh", "外婆", 10000, "day"],
  ["ko", "👩‍👩‍👧‍👦".repeat(30), 2, "month"],
  ["en", "a💐".repeat(40), 1, "week"],
  // 흔한 경우: 20대끼리 한 달에 1번(3자리), 주 1번(4자리)
  ["en", "Mom", 1, "month"],
  ["en", "Mom", 1, "week"],
  ["es", "Mamá", 1, "month"],
  ["es", "Mamá", 1, "week"],
  ["ko", "엄마", 1, "week"],
  ["ja", "母", 1, "week"],
];

for (const [lang, name, count, unit] of cases) {
  test(`카드: ${lang} ${count}/${unit} ${name.slice(0, 10)}`, async ({ page }) => {
    const r = await card(page, state(lang, name, count, unit));
    expect(r.strayPixels).toBe(0);
  });
}

// 부모님이면 이야기 줄(지금·오늘·지나간 비율)이 숫자 아래에 들어간다. 여백 밖으로 나가면 안 된다.
const storyCases: [string, string][] = [["ko", "엄마"], ["en", "Mom"], ["ja", "お母さん"], ["zh", "妈妈"], ["es", "Mamá"]];
for (const [lang, name] of storyCases) {
  test(`카드: 이야기 ${lang} ${name}`, async ({ page }) => {
    const r = await card(page, state(lang, name, 1, "month", "light", name));
    expect(r.strayPixels).toBe(0);
  });
}

test("카드: 다크 테마", async ({ page }) => {
  await card(page, state("ko", "엄마", 1, "week", "dark"));
});
