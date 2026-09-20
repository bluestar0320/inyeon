import { expect, test } from "@playwright/test";

import { clearState, headline, setUpProfile } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearState(page);
});

test("컨셉의 예시가 화면에 그대로 나온다: 어머니 60세·수명 80세·월 1회 = 240번", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🌷 어머니" }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByLabel("예상 수명").fill("80");

  await expect.poll(() => headline(page)).toBe("240번");
  await expect(page.getByText("어머니의 남은 시간이 기준")).toBeVisible();
});

test("자녀는 내 남은 시간이 기준이 된다", async ({ page }) => {
  await setUpProfile(page, 70);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("아이");
  await page.getByLabel("나이", { exact: true }).fill("5");

  await expect(page.getByText("내 남은 시간이 기준")).toBeVisible();
});

test("조건 필터가 결과를 줄이고 얼마나 줄었는지 알려준다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🌷 어머니" }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByLabel("예상 수명").fill("80");
  await expect.poll(() => headline(page)).toBe("240번");

  await page.getByRole("button", { name: "+ 해마다 줄어듦" }).click();

  await expect.poll(() => headline(page)).toBe("150번");
  await expect(page.getByText(/240번에서 .*% 줄었습니다/)).toBeVisible();
});

test("결혼 계획: 목표 나이를 지나면 0번 대신 다시 잡으라고 말한다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/marriage");
  await expect.poll(() => headline(page)).toBe("60번"); // 목표 35세 기본값, 월 1회

  await page.getByRole("button", { name: "연 1회", exact: true }).click();
  await expect.poll(() => headline(page)).toBe("5번");

  await page.getByLabel("목표 결혼 나이").fill("25");
  await expect(page.getByText("목표 나이를 지금보다 뒤로 잡아 보세요")).toBeVisible();
});

test("성장 캘린더는 자녀 프리셋 한 번으로 켜지고 아이 나이를 따라간다", async ({ page }) => {
  await setUpProfile(page, 38);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🧸 자녀" }).click();
  await page.getByLabel("나이", { exact: true }).fill("7");

  const calendar = page.locator(".card").filter({ hasText: "성장 캘린더" });
  await expect(calendar.getByText("🌻 여름")).toBeVisible();
  await expect(calendar).toContainText("13번");
  await expect(calendar).toContainText("함께할 시간이 13년 남았습니다");

  // 성인 나이를 당기면 전 항목이 같이 줄어든다
  await page.getByRole("button", { name: "18세", exact: true }).click();
  await expect(calendar).toContainText("함께할 시간이 11년 남았습니다");
});

test("만남 필터는 성장 캘린더를 건드리지 않는다", async ({ page }) => {
  await setUpProfile(page, 38);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🧸 자녀" }).click();
  await page.getByLabel("나이", { exact: true }).fill("7");

  const summerBreak = page.locator("div").filter({ hasText: /^🏖️ 여름방학/ }).first();
  const before = await summerBreak.locator("..").innerText();

  await page.getByRole("button", { name: "+ 빈도 조정" }).click();
  await expect.poll(async () => summerBreak.locator("..").innerText()).toBe(before);
});

test("데이트 계산: 목표 나이까지만 세고 그 사실을 밝힌다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("연인");
  await page.getByLabel("나이", { exact: true }).fill("29");

  await page.getByRole("button", { name: "내가 n세 될 때까지" }).click();
  await page.getByLabel("목표 나이").fill("35");

  await expect(page.getByText("목표 시점이 기준")).toBeVisible();
});

test("톤을 바꾸면 문구만 바뀌고 숫자는 그대로다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🌷 어머니" }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByLabel("예상 수명").fill("80");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people\/?$/);

  await expect(page.locator("a.card").first()).toContainText("240");

  await page.goto("/settings");
  await page.getByRole("button", { name: /또렷하게/ }).click();
  await page.goto("/people");
  await page.locator("a.card").first().click();

  await expect(page.getByText("남은 만남", { exact: true })).toBeVisible();
  await expect.poll(() => headline(page)).toBe("240번");
});

test("생활 습관을 고르면 남은 시간이 줄고, 해제하면 그대로 돌아온다", async ({ page }) => {
  await setUpProfile(page, 38);
  await page.goto("/setup");
  const expectancy = page.locator('input[type=number][step="0.1"]');
  const before = await expectancy.inputValue();

  await page.getByText("생활 습관 반영하기").click();
  await page.getByRole("button", { name: "피움", exact: true }).click();
  await expect.poll(() => expectancy.inputValue()).not.toBe(before);
  const smoking = Number(await expectancy.inputValue());
  expect(smoking).toBeLessThan(Number(before));

  // 10년을 통째로 빼는 게 아니라 생명표를 10세 위로 조회한다. 그래서 손실이 더 작다.
  expect(Number(before) - smoking).toBeLessThan(10);
  // 요약에도, 항목별 내역에도 몇 년이 붙었는지 드러나야 한다. 총합만으로는
  // 어느 항목이 얼마나 보탰는지 알 수 없다.
  await expect(page.getByText("+10세로 조회")).toBeVisible();
  await expect(page.getByText("+10세", { exact: true })).toBeVisible();
  await expect(page.getByText("담배 · 피움")).toBeVisible();

  // 같은 칩을 다시 누르면 해제되고 원래 값으로 돌아온다.
  await page.getByRole("button", { name: "피움", exact: true }).click();
  await expect.poll(() => expectancy.inputValue()).toBe(before);
});

test("예상 수명을 직접 고쳤으면 생활 습관이 그 값을 덮어쓰지 않는다", async ({ page }) => {
  await setUpProfile(page, 38);
  await page.goto("/setup");
  const expectancy = page.locator('input[type=number][step="0.1"]');
  await expectancy.fill("95");

  await page.getByText("생활 습관 반영하기").click();
  await page.getByRole("button", { name: "피움", exact: true }).click();
  await page.waitForTimeout(300);
  // 사용자가 직접 넣은 값이 항상 이긴다.
  expect(await expectancy.inputValue()).toBe("95");
});
