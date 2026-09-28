import { expect, test, type Page } from "@playwright/test";

import { appendFileSync } from "node:fs";

import { STORAGE_KEY } from "./helpers";

/*
 * 무작위로 두드려 보는 사전 점검. 평소 CI에서는 돌지 않는다(오래 걸린다).
 *
 *   FUZZ=1 npx playwright test --config e2e/playwright.config.ts e2e/fuzz.spec.ts
 *   FUZZ=1 FUZZ_URL=https://bluestar0320.github.io/inyeon ...   # 배포된 사이트에
 *   FUZZ_STATES=250 FUZZ_MONKEY=150                             # 횟수
 *
 * 두 가지를 한다.
 * 1) 무작위 기록: 망가진 값·빠진 필드·엉뚱한 타입이 섞인 기록을 심고 화면을 연다.
 * 2) 무작위 조작: 화면의 입력 칸·고르기·단추를 아무렇게나 채우고 누른다.
 *
 * 매번 확인하는 것: 자바스크립트 오류가 없다, 오류 화면이 뜨지 않는다,
 * 화면에 NaN·Infinity·undefined가 찍히지 않는다.
 */
const BASE = (process.env.FUZZ_URL ?? "").replace(/\/$/, "");
const STATES = Number(process.env.FUZZ_STATES ?? 250);
const MONKEY = Number(process.env.FUZZ_MONKEY ?? 150);

const PAGES = [
  "/",
  "/people/",
  "/people/new/",
  "/people/detail/?id=p0",
  "/people/edit/?id=p0",
  "/people/detail/?id=없는id",
  "/moments/",
  "/moments/new/",
  "/moments/detail/?id=m0",
  "/moments/edit/?id=m0",
  "/marriage/",
  "/setup/",
  "/settings/",
];

const ERROR_TITLES = [
  "화면을 그리지 못했습니다",
  "Something went wrong showing this page",
  "画面を表示できませんでした",
  "No se pudo mostrar esta pantalla",
  "页面无法显示",
];

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generator(seed: number) {
  const r = rng(seed);
  const pick = <T,>(list: T[]): T => list[Math.floor(r() * list.length)];
  const num = () =>
    pick<unknown>([0, -5, 1, 3.7, 38, 64, 99, 130, 131, 1e9, -1e9, null, "12", "abc", undefined, r() * 100]);
  const date = () =>
    pick<unknown>([undefined, "", "어제", "2026-02-30", "2099-01-01", "1900-01-01", "2024-02-29", "1960-05-17", 12345]);
  const text = () =>
    pick<unknown>(["엄마", "Mom", "", "   ", "<script>alert(1)</script>", "🌷".repeat(40), "가".repeat(300), null, 7]);
  const unit = () => pick<unknown>(["day", "week", "month", "quarter", "year", "decade", undefined]);
  const frequency = () => (r() > 0.05 ? { count: num(), unit: unit() } : pick<unknown>([null, "weekly", undefined]));
  const filter = () => ({
    id: String(r()),
    label: text(),
    enabled: pick<unknown>([true, false, "yes"]),
    kind: pick<unknown>(["multiplier", "decay", "window", "cap", "magic"]),
    factor: num(),
    ratePerYear: num(),
    fromYear: num(),
    toYear: num(),
    mode: pick<unknown>(["only", "except", "maybe"]),
    maxTotal: num(),
  });
  const filters = () =>
    r() > 0.1 ? Array.from({ length: Math.floor(r() * 4) }, filter) : pick<unknown>([null, "x", {}]);
  const span = () => ({
    ageYears: num(),
    ageAsOf: date(),
    birthDate: r() > 0.6 ? date() : undefined,
    lifeExpectancy: num(),
    lifeExpectancyManual: pick<unknown>([true, false, undefined]),
    countryCode: pick<unknown>(["KR", "JP", "TW", "HK", "US", "ZZ", undefined, 3]),
    sex: pick<unknown>(["male", "female", "all", "other", undefined]),
    health: r() > 0.6 ? { smoking: pick(["good", "mid", "bad", "lots"]), exercise: pick(["good", "bad"]) } : undefined,
  });
  const stamp = () => pick<unknown>([new Date().toISOString(), "2020-01-01T00:00:00Z", "", undefined, "garbage"]);
  const person = (i: number) => ({
    ...span(),
    id: `p${i}`,
    name: text(),
    relation: text(),
    emoji: pick<unknown>(["🌷", "", undefined, "abc"]),
    frequency: frequency(),
    filters: filters(),
    hoursPerMeeting: r() > 0.5 ? num() : undefined,
    horizon: pick<unknown>([
      undefined,
      { kind: "life" },
      { kind: "untilMyAge", age: num() },
      { kind: "years", years: num() },
      { kind: "forever" },
      null,
    ]),
    growth: r() > 0.7 ? { adultAge: num(), dinners: frequency() } : undefined,
    since: date(),
    note: text(),
    scenarios:
      r() > 0.7 ? [{ id: "s", label: text(), frequency: frequency(), filters: filters() }] : undefined,
    createdAt: stamp(),
    updatedAt: stamp(),
  });
  const moment = (i: number) => ({
    id: `m${i}`,
    title: text(),
    emoji: pick<unknown>(["🌸", undefined]),
    frequency: frequency(),
    filters: filters(),
    horizon: pick<unknown>([
      { kind: "life" },
      { kind: "untilAge", age: num() },
      { kind: "years", years: num() },
      undefined,
    ]),
    since: date(),
    scenarios:
      r() > 0.7 ? [{ id: "s", label: text(), frequency: frequency(), filters: filters() }] : undefined,
    createdAt: stamp(),
    updatedAt: stamp(),
  });

  return {
    r,
    pick,
    state: () => ({
      version: pick<unknown>([1, 2, undefined]),
      profile: r() > 0.1 ? span() : null,
      people: Array.from({ length: Math.floor(r() * 5) }, (_, i) => person(i)),
      moments: Array.from({ length: Math.floor(r() * 4) }, (_, i) => moment(i)),
      marriage:
        r() > 0.5 ? { targetAge: num(), frequency: frequency(), filters: filters(), updatedAt: stamp() } : null,
      settings: {
        tone: pick<unknown>(["calm", "warm", "aware", "loud", undefined]),
        theme: pick<unknown>(["system", "light", "dark", undefined]),
        showPast: pick<unknown>([true, false, undefined]),
        language: pick<unknown>(["ko", "en", "ja", "es", "zh", "fr", undefined]),
        lastBackupAt: stamp(),
      },
    }),
    /** 입력 칸에 넣어 볼 값. */
    typed: () =>
      pick(["", "0", "-5", "3.7", "38", "130", "999", "1e999", "abc", "2026-02-30", "1990-01-01", "🌷", "가".repeat(80)]),
  };
}

/** 한 화면을 점검하고, 걸린 문제를 돌려준다. */
async function problems(page: Page, errors: string[], where: string): Promise<string[]> {
  const found = errors.splice(0).map((e) => `${where}: ${e}`);
  const body = await page.locator("body").innerText().catch(() => "");
  for (const title of ERROR_TITLES) if (body.includes(title)) found.push(`${where}: 오류 화면`);
  const odd = body.match(/NaN|Infinity|undefined|\[object Object\]/);
  if (odd) {
    const line = body.split("\n").find((l) => l.includes(odd[0]));
    found.push(`${where}: 화면에 "${odd[0]}" — ${line?.slice(0, 80)}`);
  }
  return found;
}

/** 찾은 문제를 파일에도 남긴다. 수백 개면 테스트 출력만으로는 읽기 어렵다. */
function report(found: string[]): void {
  if (found.length) appendFileSync("test-results/fuzz-report.txt", `${found.join("\n")}\n`);
}

function listen(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror ${error.message.slice(0, 160)}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console ${message.text().slice(0, 160)}`);
  });
  // 저장 안 한 채 나가기 같은 확인 창은 받아 준다.
  page.on("dialog", (dialog) => void dialog.accept());
  return errors;
}

async function seed(page: Page, value: unknown): Promise<void> {
  await page.goto(`${BASE}/`);
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    { key: STORAGE_KEY, value },
  );
}

test.describe("무작위 사전 점검", () => {
  test.skip(!process.env.FUZZ, "FUZZ=1 일 때만 돈다");

  test(`무작위 기록 ${STATES}벌로 화면을 연다`, async ({ page }) => {
    test.setTimeout(STATES * 12_000);
    const errors = listen(page);
    const found: string[] = [];
    for (let i = 1; i <= STATES; i += 1) {
      const g = generator(i);
      await seed(page, g.state());
      for (let k = 0; k < 4; k += 1) {
        const path = g.pick(PAGES);
        await page.goto(`${BASE}${path}`);
        await page.waitForTimeout(120);
        found.push(...(await problems(page, errors, `씨앗 ${i} ${path}`)));
      }
    }
    report(found);
    expect(found).toEqual([]);
  });

  test(`무작위 조작 ${MONKEY}번`, async ({ page }) => {
    test.setTimeout(MONKEY * 20_000);
    const errors = listen(page);
    const found: string[] = [];
    for (let i = 1; i <= MONKEY; i += 1) {
      const g = generator(100_000 + i);
      await seed(page, g.state());
      const path = g.pick(PAGES);
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(120);
      for (let step = 0; step < 8; step += 1) {
        const controls = page.locator(
          "main input:not([type=file]):not([type=hidden]):visible, main select:visible, main textarea:visible, main button:visible",
        );
        const count = await controls.count();
        if (count === 0) break;
        const target = controls.nth(Math.floor(g.r() * count));
        const tag = await target.evaluate((el) => `${el.tagName}:${(el as HTMLInputElement).type}`).catch(() => "");
        const label = (await target.getAttribute("aria-label").catch(() => null)) ?? tag;
        try {
          if (tag.startsWith("SELECT")) {
            const options = await target.locator("option").allInnerTexts();
            if (options.length) await target.selectOption({ index: Math.floor(g.r() * options.length) });
          } else if (tag.startsWith("INPUT:checkbox") || tag.startsWith("INPUT:radio")) {
            await target.click({ timeout: 1000 });
          } else if (tag.startsWith("INPUT") || tag.startsWith("TEXTAREA")) {
            await target.fill(g.typed(), { timeout: 1000 });
          } else {
            await target.click({ timeout: 1000 });
          }
        } catch {
          // 가려졌거나 막 사라진 칸. 무작위 조작에서는 흔하다 — 다음 걸로.
          continue;
        }
        await page.waitForTimeout(80);
        found.push(...(await problems(page, errors, `조작 ${i} ${path} #${step} ${label}`)));
      }
    }
    report(found);
    expect(found).toEqual([]);
  });
});
