import { expect, test } from "@playwright/test";

import { readState, setUpProfile } from "./helpers";

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
