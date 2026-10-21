import { expect, test } from "@playwright/test";

import { STORAGE_KEY, setUpProfile } from "./helpers";

/** 브라우저 시간대(Asia/Seoul) 기준으로 n일 뒤 같은 달·날의 생년월일. */
async function birthDateIn(page: import("@playwright/test").Page, days: number): Promise<string> {
  return page.evaluate((n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    const p = (v: number) => String(v).padStart(2, "0");
    return `1962-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }, days);
}

async function seed(page: import("@playwright/test").Page, people: Record<string, unknown>[]): Promise<void> {
  await page.evaluate(({ key, people }) => {
    const v = JSON.parse(localStorage.getItem(key)!);
    v.people = people.map((p) => ({ lifeExpectancy: 85, lifeExpectancyManual: true, frequency: { count: 1, unit: "month" }, filters: [],
      createdAt: "2026-01-01T00:00:00+09:00", updatedAt: "2026-01-01T00:00:00+09:00", ...p }));
    localStorage.setItem(key, JSON.stringify(v));
  }, { key: STORAGE_KEY, people });
}

test("생신이 5일 남았으면 홈에 한 줄이 뜨고, 누르면 그 사람 화면으로 간다", async ({ page }) => {
  await setUpProfile(page, 35);
  // 2월 29일생이면 해에 따라 날이 하루 달라진다. 테스트 날짜가 그 근처면 6일로 비켜 간다.
  let days = 5;
  let birthDate = await birthDateIn(page, days);
  if (birthDate.endsWith("-02-29")) birthDate = await birthDateIn(page, ++days);
  await seed(page, [{ id: "p1", name: "엄마", relation: "부모님", birthDate }]);
  await page.goto("/");
  const line = page.getByRole("link", { name: `엄마 생신까지 ${days}일 남았어요` });
  await expect(line).toBeVisible();
  await line.click();
  await page.waitForURL(/\/people\/detail\/?\?id=p1/);
});

test("나이만 적은 사람은 생일 줄을 띄우지 않는다", async ({ page }) => {
  await setUpProfile(page, 35);
  await seed(page, [{ id: "p2", name: "아빠", relation: "부모님", ageYears: 66, ageAsOf: "2026-01-01" }]);
  await page.goto("/");
  await expect(page.getByRole("region", { name: "인연" })).toBeVisible();
  await expect(page.getByText(/생신|생일/)).toHaveCount(0);
});

test("웹에서는 설정에 생일 알림 칸이 없다", async ({ page }) => {
  await setUpProfile(page, 35);
  await page.goto("/settings");
  await expect(page.getByText("언어", { exact: true })).toBeVisible();
  await expect(page.getByText("알림 받기", { exact: true })).toHaveCount(0);
});

test("한 줄 기억이 두 개면 기억 편지가 되고, 생신이 가까우면 펼쳐져 있고 이미지로 저장된다", async ({ page }) => {
  await setUpProfile(page, 35);
  const ago = (n: number) => page.evaluate((n) => {
    const d = new Date();
    d.setDate(d.getDate() - n);
    const p = (v: number) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  }, n);
  const [a, b] = [await ago(40), await ago(3)];
  let days = 5;
  let birthDate = await birthDateIn(page, days);
  if (birthDate.endsWith("-02-29")) birthDate = await birthDateIn(page, ++days);
  await seed(page, [{ id: "p1", name: "엄마", relation: "부모님", birthDate, meetings: [a, b],
    memories: [{ date: a, text: "같이 시장 가서 떡볶이" }, { date: b, text: "송편 같이 빚음" }] }]);
  await page.goto("/");
  await expect(page.getByRole("link", { name: /기억 편지가 준비돼 있어요/ })).toBeVisible();
  await page.goto("/people/detail?id=p1");
  const letter = page.getByTestId("memory-letter");
  await expect(letter.getByText("엄마께")).toBeVisible();
  await expect(letter.getByText("같이 시장 가서 떡볶이")).toBeVisible();
  const download = page.waitForEvent("download");
  await letter.getByTestId("save-card").click();
  expect((await download).suggestedFilename()).toMatch(/^엄마-기억편지/);
});

test("기억이 한 줄뿐이면 편지를 띄우지 않는다", async ({ page }) => {
  await setUpProfile(page, 35);
  await seed(page, [{ id: "p1", name: "엄마", relation: "부모님", memories: [{ date: "2026-10-01", text: "한 줄" }] }]);
  await page.goto("/people/detail?id=p1");
  await expect(page.getByTestId("story")).toBeVisible();
  await expect(page.getByTestId("memory-letter")).toHaveCount(0);
});

test("자주 하시는 말을 적으면 사진 아래 따옴표로 남고, 기억 편지에도 한 줄 실린다", async ({ page }) => {
  await setUpProfile(page, 35);
  await seed(page, [{ id: "p1", name: "엄마", relation: "부모님",
    memories: [{ date: "2026-09-01", text: "송편" }, { date: "2026-10-01", text: "시장" }] }]);
  await page.goto("/people/detail?id=p1");
  await page.getByRole("button", { name: "자주 하시는 말 적기" }).click();
  await page.getByLabel("자주 하시는 말").fill(" “밥은 먹고 다니니?” ");
  await page.getByRole("button", { name: "남기기" }).click();
  await expect(page.getByTestId("saying")).toHaveText("“밥은 먹고 다니니?”");
  await page.reload();
  await expect(page.getByTestId("saying")).toHaveText("“밥은 먹고 다니니?”");
  await page.getByTestId("memory-letter").locator("summary").click();
  await expect(page.getByTestId("memory-letter").getByText("늘 하시는 그 말")).toBeVisible();
  // 여러 줄이면 그중 한 줄만 보인다(날마다 바뀐다).
  await page.getByRole("button", { name: "고치기" }).click();
  await page.getByLabel("자주 하시는 말").fill("밥은 먹고 다니니?\n차 조심해라");
  await page.getByRole("button", { name: "남기기" }).click();
  await expect(page.getByTestId("saying")).toHaveText(/^“(밥은 먹고 다니니\?|차 조심해라)”$/);
  // 비우고 남기면 지워진다.
  await page.getByRole("button", { name: "고치기" }).click();
  await page.getByLabel("자주 하시는 말").fill("");
  await page.getByRole("button", { name: "남기기" }).click();
  await expect(page.getByTestId("saying")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "자주 하시는 말 적기" })).toBeVisible();
});
