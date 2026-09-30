import { expect, test } from "@playwright/test";

import { setUpProfile } from "./helpers";

/*
 * 덜 귀찮게. 첫 화면을 막지 않고, 적는 칸을 줄이고, 알아서 할 수 있는 건 알아서 한다.
 */

test("처음 오면 소개·동의 화면 없이 바로 내 정보를 적는다", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/setup\/?$/);
  await expect(page.getByLabel("내 나이")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toHaveCount(0);
});

test("저장 단추 아래 한 줄 안내와 약관 보기가 있고, 약관은 따로 연다", async ({ page }) => {
  await page.goto("/setup");
  await expect(page.getByText("이 기기에만 보관되고", { exact: false })).toBeVisible();
  await page.getByRole("link", { name: "약관 보기" }).click();
  await page.waitForURL(/\/privacy/);
  await expect(page.getByText("이 기기 안에만 저장합니다", { exact: false })).toBeVisible();
});

test("인연을 추가할 때만 안내가 붙고, 고칠 때는 붙지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await expect(page.getByRole("link", { name: "약관 보기" })).toBeVisible();
  await page.getByLabel("이름").fill("엄마");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  await page.getByRole("link", { name: "수정하기" }).click();
  await expect(page.getByRole("link", { name: "약관 보기" })).toHaveCount(0);
});

test("인연 입력 화면에 사진 고르기·메모·성장 캘린더 켜기가 없다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await expect(page.getByLabel("이름")).toBeVisible();
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  await expect(page.getByText("메모", { exact: false })).toHaveCount(0);
  await expect(page.getByText("성장 캘린더 켜기")).toHaveCount(0);
  await page.goto("/moments/new");
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
});

test("미성년자를 넣으면 켜지 않아도 성인이 될 때까지를 센다 — 어른은 안 센다", async ({ page }) => {
  await setUpProfile(page, 35);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("지우");
  await page.getByLabel("나이", { exact: true }).fill("7");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  await expect(page.getByText("성장 캘린더")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "아이와 남은 것들" })).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: "만 20세까지" }).first()).toContainText("지우");

  await page.goto("/people/new");
  await page.getByLabel("이름").fill("엄마");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people/);
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.waitForURL(/detail/);
  await expect(page.getByText("성장 캘린더")).toHaveCount(0);
});
