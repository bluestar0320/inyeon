import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { setUpProfile } from "./helpers";

async function addPerson(page: Page, name: string, age: string) {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill(name);
  await page.getByLabel("나이", { exact: true }).fill(age);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people/);
}

test("홈의 인연이 사진 더미로 걸리고, 넘기고, 누르면 상세로", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await addPerson(page, "할머니", "85");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(stack.getByText("1 / 2")).toBeVisible();
  // 적게 남은 사람이 맨 위.
  await expect(stack.getByRole("link").first()).toContainText("할머니");
  await stack.getByRole("button", { name: "다음" }).click();
  await expect(stack.getByText("2 / 2")).toBeVisible();
  await stack.getByRole("link", { name: /엄마/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
});

test("한 명이면 넘기기 단추가 없다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(stack.getByRole("link", { name: /엄마/ })).toBeVisible();
  await expect(stack.getByRole("button", { name: "다음" })).toHaveCount(0);
});

test("긴 영문 이름이 화면을 옆으로 밀지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "m".repeat(30), "60");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});


async function threePeople(page: Page) {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await addPerson(page, "할머니", "85");
  await addPerson(page, "아빠", "62");
  await page.goto("/");
  return page.getByRole("region", { name: "인연" });
}

test("다음을 빠르게 두 번 누르면 두 장 넘어가고, 번호가 뒤로 깜빡이지 않는다", async ({ page }) => {
  const stack = await threePeople(page);
  const next = stack.getByRole("button", { name: "다음" });
  await next.click();
  await next.click();
  await expect(stack.getByText("3 / 3")).toBeVisible();
});

test.describe("움직임 줄이기", () => {
  test.use({ reducedMotion: "reduce" });
  test("넘길 때 부드러운 스크롤 없이 바로 간다", async ({ page }) => {
    const stack = await threePeople(page);
    await stack.getByRole("button", { name: "다음" }).click();
    const at = await stack.locator("div.snap-x").evaluate((el) => el.scrollLeft / el.clientWidth);
    expect(at).toBe(1);
  });
});

test("키보드로 끝까지 넘겨도 초점이 단추에 남는다", async ({ page }) => {
  const stack = await threePeople(page);
  const next = stack.getByRole("button", { name: "다음" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(stack.getByText("2 / 3")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(stack.getByText("3 / 3")).toBeVisible();
  await expect(next).toBeFocused();
});

test("홈 카드의 횟수를 화면 낭독기가 한 번만 읽는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/");
  const link = page.getByRole("region", { name: "인연" }).getByRole("link").first();
  const name = (await link.ariaSnapshot()).split("\n")[0];
  const count = name.match(/\d+번/g) ?? [];
  expect(count.length, name).toBe(1);
});

test("상세 화면에서 이름을 화면 낭독기가 두 번 읽지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.waitForURL(/detail/);
  const snapshot = await page.locator("main").ariaSnapshot();
  // 제목(h1) 말고는 이름만 덩그러니 읽히는 줄이 없어야 한다.
  const bare = snapshot.split("\n").filter((line) => /^- (text: )?"?엄마"?$/.test(line.trim()));
  expect(bare, snapshot).toEqual([]);
});

