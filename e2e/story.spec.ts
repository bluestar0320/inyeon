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

test("만났어요를 누르면 한 마디가 뜨고, 남은 횟수는 그대로다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  const before = await page.locator("p.numeral").first().textContent();
  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByText(/올해 1번째/)).toBeVisible();
  expect(await page.locator("p.numeral").first().textContent()).toBe(before);
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
