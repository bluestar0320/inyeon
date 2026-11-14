import { expect, test } from "@playwright/test";

import { AFTER_ADD_PERSON, clearState, openMore, readState, setUpProfile } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearState(page);
  await setUpProfile(page, 33);
});

test("관계 칩 하나로 미리보기가 뜨고, 저장하면 상세에 근거가 보인다", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("민수");
  const chip = page.getByRole("button", { name: "초등학교 친구", exact: true });
  await expect(chip).toHaveAttribute("aria-pressed", "false");
  expect((await chip.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await expect(page.getByTestId("past-preview")).toHaveCount(0);

  await page.getByLabel("빈도 단위").selectOption({ label: "한 달에" });
  await page.getByLabel("빈도 횟수").fill("1");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("past-preview")).toContainText(/지금까지 적어도 1,2\d\d번 만났어요/);

  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  await expect(page.getByTestId("past-lines")).toContainText("초등학교 6년");
  const state = await readState(page);
  expect((state as { people: { bonds: string[] }[] }).people[0].bonds).toEqual(["elementary"]);
});

test("「그 밖에」는 칩을 비우고, 다른 칩은 「그 밖에」를 푼다", async ({ page }) => {
  await page.goto("/people/new");
  const school = page.getByRole("button", { name: "초등학교 친구", exact: true });
  const other = page.getByRole("button", { name: "그 밖에", exact: true });
  await school.click();
  await other.click();
  await expect(school).toHaveAttribute("aria-pressed", "false");
  await expect(other).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("past-preview")).toHaveCount(0);
  await page.getByLabel("이름").fill("민수");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  const saved = (await readState(page)) as { people: { bonds?: string[]; bondDetail?: unknown }[] };
  expect(saved.people[0].bonds).toBeUndefined();
  expect(saved.people[0].bondDetail).toBeUndefined();
  await page.goto("/people/new");
  await page.getByRole("button", { name: "초등학교 친구", exact: true }).click();
  await page.getByRole("button", { name: "그 밖에", exact: true }).click();
  await page.getByRole("button", { name: "초등학교 친구", exact: true }).click();
  await expect(other).toHaveAttribute("aria-pressed", "false");
});

test("더 자세히: 「같이 안 다님」 문구, 군 복무를 비운 채 저장하면 숫자가 그대로", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("민수");
  await page.getByRole("button", { name: "초등학교 친구", exact: true }).click();
  await page.getByRole("button", { name: "중학교 친구", exact: true }).click();
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  const before = await page.getByTestId("past-lines").innerText();

  await page.getByRole("link", { name: "수정하기" }).click();
  await page.locator("summary", { hasText: "언제부터" }).click();
  const middle = page.getByLabel("중학교, 같이 다닌 기간");
  await expect(middle).toContainText("같이 안 다님");
  await expect(middle).not.toHaveText(/(?<!같이 )안 다님/);
  await expect(page.getByRole("button", { name: "해당 없음" })).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByLabel("내가 입대한 해")).toHaveCount(0);

  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL(/\/people\/detail/);
  await expect(page.getByTestId("past-lines")).toContainText("1,042번");
  await expect(page.getByTestId("past-lines")).toContainText("486번");
  expect(await page.getByTestId("past-lines").innerText()).toBe(before);
});

test("군필을 고르면 입대한 해 칸이 열린다", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByRole("button", { name: "직장 동료", exact: true }).click();
  await openMore(page);
  await page.getByRole("button", { name: "군필" }).click();
  await expect(page.getByLabel("내가 입대한 해")).toBeVisible();
  await expect(page.getByLabel("상대가 입대한 해")).toBeVisible();
});

test("학원 친구만 골라도 미리보기가 뜨고, 기본값(1년, 주 2번)이 저장된다", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("지수");
  await page.getByRole("button", { name: "학원 친구", exact: true }).click();
  await expect(page.getByTestId("past-preview")).toContainText("지금까지 적어도 104번");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  const saved = (await readState(page)) as { people: { bondDetail?: { academy?: unknown } }[] };
  expect(saved.people[0].bondDetail?.academy).toEqual({ years: 1, perWeek: 2 });
});

test("입대한 해를 치는 도중 1950으로 잘리지 않는다", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByRole("button", { name: "직장 동료", exact: true }).click();
  await page.locator("summary", { hasText: "언제부터" }).click();
  await page.getByRole("button", { name: "군필" }).click();
  const me = page.getByLabel("내가 입대한 해");
  await me.click();
  await me.pressSequentially("2015");
  await me.blur();
  await expect(me).toHaveValue("2015");
});

test("1년이 안 된 동료는 「0년」 대신 달로 적는다", async ({ page }) => {
  const d = new Date();
  d.setDate(d.getDate() - 130);
  const since = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("하늘");
  await page.getByRole("button", { name: "직장 동료", exact: true }).click();
  await page.getByLabel("빈도 단위").selectOption("week");
  await page.getByLabel("빈도 횟수").fill("1");
  await openMore(page);
  await page.getByLabel("언제부터 (선택)").fill(since);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(AFTER_ADD_PERSON);
  await expect(page.getByTestId("past-lines")).toContainText("같이 일한 4개월");
  await expect(page.getByTestId("past-lines")).not.toContainText("0년");
});
