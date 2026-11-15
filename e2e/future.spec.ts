import { expect, test, type Page } from "@playwright/test";

import { AFTER_ADD_PERSON, clearState, headline, setUpProfile } from "./helpers";

/*
 * 「앞으로」 칩과 이유 줄. 남은 만남이 왜 바뀌었는지 큰 숫자 바로 아래에 한 줄로 밝힌다.
 */

const num = (s: string) => Number(s.replace(/[^\d]/g, ""));

async function friend(page: Page, age: number) {
  await clearState(page);
  await setUpProfile(page, age);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("민수");
  await page.getByLabel("나이", { exact: true }).fill(String(age));
  await page.getByLabel("빈도 단위").selectOption({ label: "한 달에" });
  await page.getByLabel("빈도 횟수").fill("1");
}

test("결혼 칩을 누르면 숫자가 줄고, 이유 줄이 결혼과 앱이 정한 어림을 밝힌다", async ({ page }) => {
  await friend(page, 40);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  if (!/detail/.test(page.url())) await page.getByText("민수").first().click();
  await page.waitForURL(/\/people\/detail/);
  const before = num(await headline(page));
  await expect(page.getByTestId("reason")).toHaveCount(0);

  await page.getByRole("link", { name: "수정하기" }).click();
  const chip = page.getByTestId("ahead-chips").getByRole("button", { name: "결혼할 것 같아요" });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => num(await headline(page))).toBeLessThan(before);
  await expect(page.getByTestId("reason")).toContainText("결혼");
  await expect(page.getByTestId("reason")).toContainText("앱이 정한 어림");
  await expect(page.getByTestId("reason")).toContainText("줄었");

  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL(/\/people\/detail/);
  expect(num(await headline(page))).toBeLessThan(before);
  await expect(page.getByTestId("reason")).toContainText("결혼");
});

test("부모님에게는 건강 칩 하나만 있고, 누르면 숫자가 는다", async ({ page }) => {
  await clearState(page);
  await setUpProfile(page, 40);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "부모님", exact: true }).click();
  await page.getByLabel("나이", { exact: true }).fill("70");
  const chips = page.getByTestId("ahead-chips").getByRole("button");
  await expect(chips).toHaveCount(1);
  await expect(chips).toHaveText("건강이 나빠지고 있어요");
  const before = num(await headline(page));
  await chips.click();
  await expect.poll(async () => num(await headline(page))).toBeGreaterThan(before);
  await expect(page.getByTestId("reason")).toContainText("건강");
  await expect(page.getByTestId("reason")).toContainText("늘었");
});

test("25세 친구는 칩이 없어도 나이 때문에 줄었다고 밝힌다", async ({ page }) => {
  await friend(page, 25);
  await expect(page.getByTestId("reason")).toContainText("나이");
  await expect(page.getByTestId("reason")).toContainText("통계청");
});

test("35세 친구, 칩·조건 없음: 이유 줄이 없다", async ({ page }) => {
  await friend(page, 35);
  await expect(page.locator("p.numeral").first()).toBeVisible();
  await expect(page.getByTestId("reason")).toHaveCount(0);
});
