import { expect, test } from "@playwright/test";

import { headline, readState, setUpProfile } from "./helpers";

test("「만났어요」를 누르면 오늘이 기록되고, 상세와 홈에 마지막 만남이 보인다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "어머니", exact: true }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);

  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByText("기록한 만남 1번", { exact: false })).toBeVisible();
  await expect.poll(async () => ((await readState(page))!.people as { meetings?: string[] }[])[0].meetings?.length).toBe(1);

  await page.goto("/");
  await expect(page.getByRole("region", { name: "인연" }).getByText("마지막 만남 오늘", { exact: false })).toBeVisible();
});

test("잘못 눌렀으면 되돌린다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "어머니", exact: true }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  await page.getByRole("button", { name: "만났어요" }).click();
  await page.getByRole("button", { name: "되돌리기" }).click();
  await expect.poll(async () => ((await readState(page))!.people as { meetings?: string[] }[])[0].meetings?.length ?? 0).toBe(0);
});

test("예측 안의 만남은 점 색으로, 예측보다 더 만나면 남은 횟수가 하나 준다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "어머니", exact: true }).click(); // 한 달에 1번
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  const number = async () => Number((await headline(page)).replace(/[^0-9]/g, ""));
  await expect.poll(number).toBeGreaterThan(100);
  const before = await number();

  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByTestId("met-dots")).toHaveText("이번 달 함께한 만남 1번");
  await expect.poll(number).toBe(before);

  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByTestId("met-dots")).toHaveText("이번 달 함께한 만남 2번");
  await expect.poll(number).toBe(before - 1);
});
