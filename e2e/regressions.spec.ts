import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState, headline, readState, setUpProfile, openMore } from "./helpers";

/*
 * 사전 점검(사람이 할 법한 오용·헤비 유저 시나리오)에서 찾은 문제들이 돌아오지 않게 묶어 둔다.
 * 하나하나가 실제로 재현됐던 것이다.
 */

const now = new Date().toISOString();

function person(id: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id, name, ageYears: 60, lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "female",
    frequency: { count: 1, unit: "month" }, filters: [], createdAt: now, updatedAt: now, ...extra,
  };
}

async function seed(page: Page, value: Record<string, unknown>) {
  await clearState(page);
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
    {
      key: STORAGE_KEY,
      value: {
        version: 1,
        profile: { ageYears: 30, lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
        people: [], moments: [], marriage: null,
        settings: { tone: "calm", theme: "system", showPast: true },
        ...value,
      },
    },
  );
}

test("저장 공간이 막히면 조용히 넘어가지 않고 알린다", async ({ page }) => {
  await setUpProfile(page, 30);
  // 다음 이동부터 저장이 막힌다(저장 공간이 가득 찬 것과 같다).
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("엄마");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await expect(page.getByText("저장하지 못했습니다")).toBeVisible();
});

test("같은 이름(엄마 둘)도 따로 저장되고, 목록에서 관계·나이로 구분된다", async ({ page }) => {
  await seed(page, {
    people: [
      person("a", "엄마", { relation: "친정", ageYears: 62 }),
      person("b", "엄마", { relation: "시댁", ageYears: 58 }),
    ],
  });
  await page.goto("/people");
  const rows = page.locator("a.card");
  await expect(rows).toHaveCount(2);
  await expect(page.getByText(/친정 · 만 62세/)).toBeVisible();
  await expect(page.getByText(/시댁 · 만 58세/)).toBeVisible();
});

test("연달아 두 명을 지워도 둘 다 되돌린다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마A"), person("b", "엄마B"), person("c", "아빠")] });
  // 되돌리기는 메모리에만 있으므로 새로고침 없이 앱 안에서 옮겨 다닌다(사람이 하듯이).
  await page.goto("/people");
  for (const name of ["엄마A", "엄마B"]) {
    await page.locator("a.card", { hasText: name }).click();
    await page.getByRole("button", { name: "삭제", exact: true }).click();
    await page.waitForURL(/\/people\/?$/);
  }
  await page.getByRole("button", { name: "되돌리기" }).click();
  await page.getByRole("button", { name: "되돌리기" }).click();
  const state = (await readState(page)) as { people: { id: string }[] };
  expect(state.people.map((p) => p.id).sort()).toEqual(["a", "b", "c"]);
});

test("저장한 뒤 뒤로 가기가 한 번에 한 화면씩 간다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마")] });
  await page.goto("/people");
  await page.goto("/people/detail?id=a");
  await page.goto("/people/edit?id=a");
  await page.getByLabel("이름").fill("어머니");
  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL(/\/people\/detail/);
  await page.goBack();
  await expect(page).toHaveURL(/\/people\/edit/);
  await page.goBack();
  // 예전에는 여기서 또 편집 화면이었다(같은 화면이 히스토리에 두 번 남았다).
  await expect(page).toHaveURL(/\/people\/detail/);
});

test("다른 창에서 고치거나 지우면 편집 화면이 알리고, 적던 내용은 남는다", async ({ page, context }) => {
  await seed(page, { people: [person("a", "엄마")] });
  await page.goto("/people/edit?id=a");
  await page.getByLabel("이름").fill("엄마 (고치는 중)");

  const other = await context.newPage();
  await other.goto("/people/edit?id=a");
  await other.getByLabel("나이", { exact: true }).fill("61");
  await other.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("다른 창에서 이 기록이 바뀌었습니다")).toBeVisible();

  await other.goto("/people/detail?id=a");
  await other.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByText("지워졌습니다")).toBeVisible();
  await expect(page.getByLabel("이름")).toHaveValue("엄마 (고치는 중)");
});

test("긴 영문 이름이 화면을 옆으로 밀지 않는다", async ({ page }) => {
  await seed(page, { people: [person("a", "m".repeat(80), { relation: "r".repeat(200) })] });
  for (const path of ["/", "/people", "/people/detail?id=a", "/people/edit?id=a"]) {
    await page.goto(path);
    await page.waitForTimeout(150);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(0);
  }
});

test("숫자 칸을 지워도 결과가 0으로 튀지 않는다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마")] });
  await page.goto("/people/edit?id=a");
  const before = await headline(page);
  await openMore(page);
  await page.getByLabel("예상 수명").fill("");
  expect(await headline(page)).toBe(before);
  await page.getByLabel("빈도 횟수").fill("");
  expect(await headline(page)).toBe(before);
});

test("상대가 태어나기 전부터 만났다고 셀 수 없다", async ({ page }) => {
  await seed(page, { people: [person("a", "친구", { ageYears: 25, since: "1990-01-01" })] });
  await page.goto("/people/detail?id=a");
  // 25세 친구와 1990년부터 = 36년이 아니라 25년까지만 센다.
  await expect(page.getByText(/25\.0년 동안|25년 동안/)).toBeVisible();
});

test("조건을 겹겹이 걸어도 숫자가 폭주하지 않는다", async ({ page }) => {
  const grow = Array.from({ length: 30 }, (_, i) => ({
    id: `g${i}`, label: "", enabled: true, kind: "decay", ratePerYear: -0.5,
  }));
  await seed(page, { people: [person("a", "엄마", { ageYears: 30, lifeExpectancy: 90, frequency: { count: 1, unit: "day" }, filters: grow })] });
  await page.goto("/people/detail?id=a");
  const value = Number((await headline(page)).replace(/[^0-9]/g, ""));
  // 매일 × 최대 10배 × 60년 ≈ 22만 번이 상한이다. 예전에는 10^97번이 나왔다.
  expect(value).toBeLessThan(250_000);
});

test("결혼 계획은 내 예상 수명을 넘겨 세지 않는다", async ({ page }) => {
  await seed(page, { marriage: { targetAge: 200, frequency: { count: 1, unit: "month" }, filters: [], updatedAt: now } });
  await page.goto("/marriage");
  const value = Number((await headline(page)).replace(/[^0-9]/g, ""));
  // 30세·수명 85 → 55년 × 12 = 660번이 상한. 예전에는 1,800번.
  expect(value).toBeLessThanOrEqual(660);
});

test("전체 삭제는 기록만 지우고 언어·테마는 둔다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마")], settings: { tone: "warm", theme: "dark", showPast: true } });
  await page.goto("/settings");
  await page.getByRole("button", { name: "전체 삭제" }).click();
  await page.getByRole("button", { name: "정말 지우기" }).click();
  const state = (await readState(page)) as { people: unknown[]; settings: { theme: string; tone: string } };
  expect(state.people).toHaveLength(0);
  expect(state.settings).toMatchObject({ theme: "dark", tone: "warm" });
});

test("없는 주소는 고른 언어로 안내한다", async ({ page }) => {
  await seed(page, { settings: { tone: "calm", theme: "system", showPast: true, language: "en" } });
  await page.goto("/nope");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
});

test("입력 칸에서 Enter를 누르면 저장된다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("엄마");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByLabel("나이", { exact: true }).press("Enter");
  await page.waitForURL(/\/people\/detail/);
  const state = (await readState(page)) as { people: { name: string }[] };
  expect(state.people.map((p) => p.name)).toEqual(["엄마"]);
});

test("이름이 비어 있으면 Enter로도 저장되지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByLabel("나이", { exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/people\/new/);
});

test("내 정보도 다른 창에서 바뀌면 알리고, 손대지 않았으면 나갈 때 묻지 않는다", async ({ page, context }) => {
  await seed(page, {});
  await page.goto("/setup");
  const other = await context.newPage();
  await other.goto("/setup");
  await other.getByLabel("내 나이").fill("40");
  await other.getByRole("button", { name: "저장하기" }).click();
  await expect(page.getByText("다른 창에서 이 기록이 바뀌었습니다")).toBeVisible();

  let asked = false;
  page.on("dialog", (dialog) => {
    asked = true;
    void dialog.dismiss();
  });
  await page.getByRole("link", { name: "홈" }).click();
  await page.waitForURL(/\/$/);
  expect(asked).toBe(false);
});

test("영문 이름에도 조사를 맞춰 붙인다", async ({ page }) => {
  await seed(page, { people: [person("a", "Tom"), person("b", "Kate")] });
  // 상세 화면은 이 문장 대신 이야기를 보인다. 같은 문장을 쓰는 수정 화면에서 본다.
  await page.goto("/people/edit?id=a");
  await expect(page.getByText(/Tom과 앞으로/)).toBeVisible();
  await page.goto("/people/edit?id=b");
  await expect(page.getByText(/Kate와 앞으로/)).toBeVisible();
});
