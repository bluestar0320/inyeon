import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 큰 숫자 아래의 이야기(그때·지금·오늘·지나간 비율). 문장은 lib/storyBank.ts에서 고르므로
 * 문장 자체가 아니라 어느 줄이 보이고 안 보이는지를 본다.
 */

const created = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

async function seed(page: Page, relation: string, name: string, daysAgo = 0, since?: string) {
  await clearState(page);
  const value = {
    version: 1,
    profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
    people: [{ id: "p1", name, relation, ageYears: 63, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
      countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" }, filters: [], since,
      createdAt: created(daysAgo), updatedAt: created(daysAgo) }],
    moments: [], marriage: null,
    settings: { tone: "aware", theme: "light", showPast: true },
  };
  await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)), { key: STORAGE_KEY, v: value });
  await page.goto("/people/detail/?id=p1");
}

test("부모님은 그때·지금·오늘·비율과 가정 문구가 보인다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  const story = page.getByTestId("story");
  await expect(story.getByTestId("story-then")).toBeVisible();
  await expect(story.getByTestId("story-now")).toContainText("번");
  await expect(story.getByTestId("story-today")).toBeVisible();
  await expect(story.getByTestId("story-past")).toContainText("%");
  await expect(story.getByText(/스무 살/)).toBeVisible();
  await expect(story.getByRole("link", { name: "바꾸기" })).toHaveAttribute("href", /\/people\/edit\/?\?id=p1/);
});

test("since가 있으면 가정 문구가 없다", async ({ page }) => {
  await seed(page, "어머니", "엄마", 0, "2012-03-01");
  await expect(page.getByTestId("story-past")).toBeVisible();
  await expect(page.getByText(/스무 살/)).toHaveCount(0);
});

test("친구는 그때·비율 없이 지금·오늘만", async ({ page }) => {
  await seed(page, "친구", "민수");
  await expect(page.getByTestId("story-now")).toBeVisible();
  await expect(page.getByTestId("story-then")).toHaveCount(0);
  await expect(page.getByTestId("story-past")).toHaveCount(0);
});

test("처음 만든 날엔 말투 바꾸기가 없고, 다시 오면 있다", async ({ page }) => {
  await seed(page, "어머니", "엄마", 0);
  await expect(page.getByTestId("story-now")).toBeVisible();
  await expect(page.getByTestId("story-tone")).toHaveCount(0);
  await seed(page, "어머니", "엄마", 3);
  const tone = page.getByTestId("story-tone");
  await expect(tone).toBeVisible();
  await tone.getByRole("button", { name: "따뜻하게" }).click();
  await expect(tone.getByRole("button", { name: "따뜻하게" })).toHaveAttribute("aria-pressed", "true");
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).settings.tone, STORAGE_KEY);
  expect(saved).toBe("warm");
});

test("만났어요를 누르면 한 마디가 뜨고, 남은 횟수가 하나 준다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  const number = async () => Number((await page.locator("p.numeral").first().innerText()).replace(/[^0-9]/g, ""));
  await expect.poll(number).toBeGreaterThan(100);
  const before = await number();
  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByText(/올해 1번째/)).toBeVisible();
  await expect.poll(number).toBe(before - 1);
});

test("설정을 건드리지 않은 사람의 기본 말투는 「찡하게」다", async ({ page }) => {
  await clearState(page);
  await page.goto("/settings");
  await expect(page.getByRole("button", { name: /찡하게/ })).toHaveAttribute("aria-pressed", "true");
});

test("「지금까지도 함께 보기」를 끄면 지나간 비율도 빠진다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  await expect(page.getByTestId("story-past")).toBeVisible();
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    s.settings.showPast = false;
    localStorage.setItem(key, JSON.stringify(s));
  }, STORAGE_KEY);
  await page.reload();
  await expect(page.getByTestId("story-now")).toBeVisible();
  await expect(page.getByTestId("story-past")).toHaveCount(0);
  await expect(page.getByTestId("story-then")).toHaveCount(0);
});

test("내 정보의 부르는 이름은 선택 칸이고, 넣으면 저장된다", async ({ page }) => {
  await clearState(page);
  await page.goto("/setup");
  await page.getByLabel("내 나이").fill("35");
  await page.getByLabel("부르는 이름 (선택)").fill("지훈");
  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL(/people\/new|\/$/);
  const nickname = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).profile.nickname, STORAGE_KEY);
  expect(nickname).toBe("지훈");
});

test("평균수명을 넘기신 분: 적어 둔 예상 수명을 지나도 0번이 아니고, 축하 한 줄과 '선물' 문장이 나온다", async ({ page }) => {
  await clearState(page);
  const value = {
    version: 1,
    profile: { ageYears: 50, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
    people: [{ id: "g", name: "할머니", relation: "할머니", ageYears: 93, ageAsOf: "2026-01-01", lifeExpectancy: 90, lifeExpectancyManual: true,
      countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" }, filters: [], createdAt: created(0), updatedAt: created(0) }],
    moments: [], marriage: null,
    settings: { tone: "aware", theme: "light", showPast: true },
  };
  await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)), { key: STORAGE_KEY, v: value });
  await page.goto("/people/detail/?id=g");
  await expect(page.locator("p.numeral").first()).not.toHaveText(/^0/);
  await expect(page.getByTestId("story-cheer")).toContainText("대한민국");
  await expect(page.getByTestId("story-now")).not.toContainText("날짜");
});

test("순간 목록은 폰에서 두 칸 타일이라 한 화면에 네 개쯤 보이고, 몇 년에 한 번도 고를 수 있다", async ({ page }) => {
  await clearState(page);
  const moment = (id: string, title: string) => ({ id, title, frequency: { count: 1, unit: "year2" }, filters: [],
    createdAt: created(0), updatedAt: created(0) });
  const value = {
    version: 1,
    profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
    people: [], moments: ["a", "b", "c", "d", "e"].map((id) => moment(id, `순간 ${id}`)), marriage: null,
    settings: { tone: "aware", theme: "light", showPast: true },
  };
  await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)), { key: STORAGE_KEY, v: value });
  await page.goto("/moments");
  const tiles = page.getByTestId("moment-tile");
  await expect(tiles).toHaveCount(5);
  const [a, b] = [await tiles.nth(0).boundingBox(), await tiles.nth(1).boundingBox()];
  expect(Math.abs(a!.y - b!.y)).toBeLessThan(2); // 같은 줄에 두 칸
  expect(a!.width).toBeLessThan(page.viewportSize()!.width / 2);
  await expect(tiles.first()).toContainText("2년에 1번");
  await page.goto("/moments/new");
  await expect(page.getByRole("option", { name: "10년에" })).toHaveCount(1);
});

test("화면을 켜 둔 채 자정을 넘기면 새날로 본다 — 오늘 만든 인연도 다음 날엔 말투 바꾸기가 보인다", async ({ page }) => {
  // 브라우저는 서울 시간(playwright.config)이고 CI는 UTC라, 서울 날짜로 오늘 밤을 잡는다.
  const seoulToday = new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10);
  const late = new Date(`${seoulToday}T23:59:30+09:00`);
  await page.clock.install({ time: late });
  await seed(page, "어머니", "엄마", 0);
  await expect(page.getByTestId("story-now")).toBeVisible();
  await expect(page.getByTestId("story-tone")).toHaveCount(0);
  await page.clock.runFor("02:00");
  await expect(page.getByTestId("story-tone")).toBeVisible();
});

test("남은 만남을 점으로 보이고, 시작점이 있으면 그때부터의 만남을 함께한 만남으로 어림해 앞에 깐다", async ({ page }) => {
  await seed(page, "친구", "민수");
  const dots = page.getByTestId("dots");
  await expect(dots).toBeVisible();
  await expect(page.getByTestId("together")).toHaveText(/^함께한 만남 0번 · 놓친 만남 0번/);
  await expect(dots.getByText(/「만났어요」를 누르면/)).toBeVisible();
  await seed(page, "어머니", "엄마", 0, "2012-03-01");
  await expect(page.getByTestId("together")).toHaveText(/^함께한 만남 [1-9][\d,]*번/);
  await expect(dots.getByText(/어림했어요/)).toBeVisible();
  await dots.screenshot({ path: "test-results/dots.png" });
});
