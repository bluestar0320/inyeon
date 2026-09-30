import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

import { readState, setUpProfile } from "./helpers";

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

test("사진을 바꾸면 저장되고 다시 열어도 그대로", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.getByRole("link", { name: "수정하기" }).click();
  await page.getByTitle("기찻길").click();
  await expect(page.getByRole("radio", { name: "기찻길" })).toBeChecked();
  await page.getByRole("button", { name: "저장하기" }).click();
  await expect
    .poll(async () => ((await readState(page))!.people as { photo?: string }[])[0].photo)
    .toBe("railway");
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.getByRole("link", { name: "수정하기" }).click();
  await expect(page.getByRole("radio", { name: "기찻길" })).toBeChecked();
});
