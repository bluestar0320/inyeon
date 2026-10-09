import { expect, test } from "@playwright/test";

import { STORAGE_KEY, headline, readState, setUpProfile } from "./helpers";

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

test("이번 기간에 만나면 함께한 만남 +1·앞으로 −1, 계획보다 더 만난 건 함께한 쪽에만 더한다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "어머니", exact: true }).click(); // 한 달에 1번
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  const number = async () => Number((await headline(page)).replace(/[^0-9]/g, ""));
  await expect.poll(number).toBeGreaterThan(100);
  const before = await number();
  const together = page.getByTestId("together");
  // 아직 한 번도 안 눌렀으면 놓친 만남은 보이지 않는다.
  await expect(together).toHaveText(/^함께한 만남 0번 · 앞으로 \d+번$/);

  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(together).toHaveText(/^함께한 만남 1번 · 놓친 만남 0번/);
  // 넣은 날이 달 한가운데여도 이번 달의 칸을 썼으니 꼭 하나 준다.
  await expect.poll(number).toBe(before - 1);
  const after = await number();

  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(together).toHaveText(/^함께한 만남 2번/);
  await expect.poll(number).toBe(after);
});

test("「만났어요」를 쓰는 사람에게는 끝난 기간에 기록이 없으면 놓친 만남으로 센다", async ({ page }) => {
  await setUpProfile(page, 30);
  // 서울 시간으로 두 달 전 1일에 넣은 월 1회 인연. 그달엔 만났고 지난달은 놓쳤다.
  const seoul = new Date(Date.now() + 9 * 3_600_000);
  const added = new Date(Date.UTC(seoul.getUTCFullYear(), seoul.getUTCMonth() - 2, 1)).toISOString().slice(0, 10);
  await page.evaluate(({ key, added }) => {
    const v = JSON.parse(localStorage.getItem(key)!);
    v.people = [{ id: "p1", name: "엄마", relation: "부모님", ageYears: 60, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
      frequency: { count: 1, unit: "month" }, filters: [], meetings: [added], createdAt: `${added}T00:00:00+09:00`, updatedAt: `${added}T00:00:00+09:00` }];
    localStorage.setItem(key, JSON.stringify(v));
  }, { key: STORAGE_KEY, added });
  await page.goto("/people/detail/?id=p1");
  await expect(page.getByTestId("together")).toHaveText(/^함께한 만남 1번 · 놓친 만남 1번/);
});
