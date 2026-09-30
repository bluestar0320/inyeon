import { expect, test } from "@playwright/test";

import { headline, setUpProfile } from "./helpers";

/*
 * "해마다 달라짐"은 %가 아니라 "N년 뒤에는 1년에 몇 번쯤"으로 적는다.
 * 헷갈리면 누를 때만 통계가 나온다(처음부터 펼쳐 두지 않는다).
 */

test("N년 뒤 몇 번으로 적으면 올해·10년 뒤·20년 뒤가 횟수로 보이고 숫자가 줄어든다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🌷 어머니" }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  const before = await headline(page);

  await page.getByRole("button", { name: "+ 해마다 달라짐" }).click();
  await expect(page.getByText("%씩", { exact: false })).toHaveCount(0);
  await page.getByLabel("몇 년 뒤").fill("20");
  await page.getByLabel("그때 1년에 몇 번").fill("4");
  await expect(page.getByText(/올해 12번 · 10년 뒤 7번 · 20년 뒤 4번/)).toBeVisible();
  await expect.poll(() => headline(page)).not.toBe(before);
});

test("「헷갈리세요?」는 누를 때만 펼쳐지고, 관계에 맞는 통계와 출처를 보여 준다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🌷 어머니" }).click();
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "+ 해마다 달라짐" }).click();

  const tip = page.getByText("22.7%", { exact: false });
  await expect(tip).toBeHidden();
  await page.getByText("헷갈리세요?").click();
  await expect(tip).toBeVisible();
  await expect(page.getByText("노인실태조사", { exact: false })).toBeVisible();
});

test("벚꽃에는 계절 통계(기상청)를 보여 준다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/moments/new");
  await page.getByRole("button", { name: "🌸 벚꽃 보기" }).click();
  await page.getByRole("button", { name: "+ 해마다 달라짐" }).click();
  await page.getByText("헷갈리세요?").click();
  await expect(page.getByText("22일", { exact: false })).toBeVisible();
  await expect(page.getByText("기상청", { exact: false })).toBeVisible();
});
