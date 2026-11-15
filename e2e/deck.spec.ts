import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 홈의 카드 줄. 인연 줄은 「나」 → 사람들 → 「＋ 새 인연」, 순간 줄은 순간들 → 「＋ 새 순간」.
 * 줄에는 카드를 모두 넣고, 아래 점 줄 하나가 모아 보기 링크다(12장을 넘으면 「3 / 24」).
 */

const now = new Date().toISOString();
const person = (i: number) => ({
  id: `p${i}`, name: `사람${i + 1}`, ageYears: 40 + i, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
  countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" }, filters: [], createdAt: now, updatedAt: now,
});

async function seed(page: Page, people: number) {
  await clearState(page);
  await page.evaluate(
    ({ key, v }) => localStorage.setItem(key, JSON.stringify(v)),
    {
      key: STORAGE_KEY,
      v: {
        version: 1,
        profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
        people: Array.from({ length: people }, (_, i) => person(i)),
        moments: [],
        marriage: null,
        settings: { tone: "aware", theme: "light", showPast: true },
      },
    },
  );
  await page.goto("/");
  return page.getByRole("region", { name: "인연" });
}

test("사람 3명이면 인연 줄은 5장, 점이 5개", async ({ page }) => {
  const row = await seed(page, 3);
  await expect(row.getByRole("link", { name: /모아 보기/ })).toHaveAttribute("aria-label", /5장/);
});

test("14명이면 점 대신 숫자, 누르면 인연 목록", async ({ page }) => {
  const row = await seed(page, 14);
  await expect(row.getByText("/ 16")).toBeVisible();
  await row.getByRole("link", { name: /모아 보기/ }).click();
  await expect(page).toHaveURL(/\/people\/?$/);
});

test("끝에서 다음을 누르면 처음(나)으로", async ({ page }) => {
  const row = await seed(page, 3);
  const overview = row.getByRole("link", { name: /모아 보기/ });
  const start = (await overview.getAttribute("aria-label"))!;
  // 폰에서는 ‹ › 단추가 화면 낭독기·키보드용으로 숨어 있다. 키보드로 누른다.
  const next = row.getByRole("button", { name: "다음" });
  await next.press("Enter");
  await expect(overview).not.toHaveAttribute("aria-label", start);
  // 5장이니 네 번 더 누르면 한 바퀴 돌아 처음 번호다. 고리 자리에서 멈추지 않게 한 번씩 기다린다.
  for (let i = 0; i < 4; i++) {
    await page.waitForTimeout(800);
    await next.press("Enter");
  }
  await expect(overview).toHaveAttribute("aria-label", start);
});

test("사람이 없으면 나와 새 인연 두 장", async ({ page }) => {
  const row = await seed(page, 0);
  await expect(row.getByRole("link", { name: /새 인연/ })).toHaveAttribute("href", /^\/people\/new\/?$/);
  await expect(row.getByRole("link", { name: /모아 보기/ })).toHaveAttribute("aria-label", /2장/);
});

/* 「나」 화면과 바닥글 */
test("나 화면 맨 위에 남은 시간, 그 아래 설정과 바닥글", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "나", level: 1 })).toBeVisible();
  await expect(page.getByText("나에게 남은 시간")).toBeVisible();
  await expect(page.getByRole("link", { name: "서비스 소개" })).toBeVisible();
});

test("첫 화면과 상세에는 바닥글이 없다", async ({ page }) => {
  await seed(page, 1);
  await expect(page.getByRole("link", { name: "서비스 소개" })).toHaveCount(0);
  await page.goto("/people/detail/?id=p0");
  await expect(page.getByRole("link", { name: "서비스 소개" })).toHaveCount(0);
});

test("백업 알림을 누르면 같은 화면의 내보내기로", async ({ page }) => {
  await seed(page, 1); // 시드의 updatedAt은 이번 시각이라 7일을 채우도록 옛날로 돌린다
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    const old = "2026-01-02T00:00:00.000Z";
    s.people.forEach((p: { createdAt: string; updatedAt: string }) => { p.createdAt = old; p.updatedAt = old; });
    localStorage.setItem(key, JSON.stringify(s));
  }, STORAGE_KEY);
  await page.goto("/settings");
  await page.getByRole("link", { name: /내보내 두기/ }).click();
  await expect(page).toHaveURL(/#backup$/);
  await expect(page.getByRole("button", { name: "내보내기" })).toBeVisible();
});

/* 머리글: 아래 탭 없이 「←」 하나 */
test("아래 탭이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, 1);
  await expect(page.locator("nav.fixed")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "설정", exact: true })).toHaveCount(0);
});

test("상세에 주소로 바로 들어와 뒤로를 누르면 첫 화면", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/people/detail/?id=p0");
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("목록에서 상세로 갔다가 뒤로를 누르면 목록", async ({ page }) => {
  await seed(page, 2);
  await page.goto("/people");
  await page.locator("a.card").first().click();
  await expect(page).toHaveURL(/\/people\/detail/);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/people\/?$/);
});

test("문서 화면에 바로 들어와 뒤로를 누르면 나 화면", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/settings\/?$/);
});

test("편집 중 뒤로를 누르면 묻고, 취소하면 남는다", async ({ page }) => {
  await seed(page, 0);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("테스트");
  let asked = false;
  page.once("dialog", (d) => { asked = true; void d.dismiss(); });
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect.poll(() => asked).toBe(true);
  await expect(page).toHaveURL(/\/people\/new/);
});
