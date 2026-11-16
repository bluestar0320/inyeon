import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 홈의 카드 줄. 인연 줄은 「나」 → 사람들 → 「＋ 새 인연」, 순간 줄은 순간들 → 「＋ 새 순간」.
 * 줄에는 카드를 모두 넣고, 아래 점 줄 하나가 모아 보기 링크다(12장을 넘으면 「3 / 24」).
 */

const now = new Date().toISOString();
const person = (i: number) => ({
  id: `p${i}`, name: `사람${i + 1}`, ageYears: 40 + i, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
  countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" }, filters: [], createdAt: now, updatedAt: now,
});

const moment = (i: number) => ({
  id: `m${i}`, title: `순간${i + 1}`, frequency: { count: i + 1, unit: "year" }, filters: [], createdAt: now, updatedAt: now,
});

async function seed(
  page: Page,
  people: number,
  extra: { moments?: number; people?: Record<string, unknown>[]; textSize?: string } = {},
) {
  await clearState(page);
  await page.evaluate(
    ({ key, v }) => localStorage.setItem(key, JSON.stringify(v)),
    {
      key: STORAGE_KEY,
      v: {
        version: 1,
        profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
        people: [...Array.from({ length: people }, (_, i) => person(i)), ...(extra.people ?? [])],
        moments: Array.from({ length: extra.moments ?? 0 }, (_, i) => moment(i)),
        marriage: null,
        settings: { tone: "aware", theme: "light", showPast: true, textSize: extra.textSize },
      },
    },
  );
  await page.goto("/");
  return page.getByRole("region", { name: "인연" });
}

/** 줄 가운데에 가장 가까운 장의 글자. 화면에 지금 보이는 카드다(옆 장은 작게 줄어 사이가 비므로 가장 가까운 것). */
async function current(page: Page, name: string): Promise<string> {
  return page.getByRole("region", { name }).evaluate((el) => {
    const track = el.firstElementChild as HTMLElement;
    const box = track.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    const off = (s: Element) => {
      const r = s.getBoundingClientRect();
      return Math.abs(r.left + r.width / 2 - mid);
    };
    const hit = [...track.children].reduce((a, b) => (off(b) < off(a) ? b : a)) as HTMLElement;
    return hit.innerText.trim();
  });
}

/** 「나」 카드: 첫 줄이 「나」 한 글자. */
const ME = /^나\s/;

const title = (page: Page) => page.locator("header").getByText(/^(인연|순간)$/);

test("사람 3명이면 인연 줄은 5장, 점이 5개", async ({ page }) => {
  const row = await seed(page, 3);
  await expect(row.getByRole("link", { name: /모아 보기/ })).toHaveAttribute("aria-label", /5장/);
});

test("14명이면 점 대신 숫자, 누르면 인연 목록", async ({ page }) => {
  const row = await seed(page, 14);
  await expect(row.getByText("/ 16")).toBeVisible();
  await row.getByRole("link", { name: /모아 보기/ }).click();
  await expect(page).toHaveURL(/\/people\/?$/);
});

test("끝에서 다음을 누르면 고리를 돌아 나에게 닿는다", async ({ page }) => {
  const row = await seed(page, 3);
  // 폰에서는 ‹ › 단추가 화면 낭독기·키보드용으로 숨어 있다. 키보드로 누른다.
  const next = row.getByRole("button", { name: "다음" });
  // 첫 사람(2번째)에서 네 번: 사람 둘, 새 인연, 그리고 고리를 넘어 「나」. 기다리지 않고 바로 눌러도 하나도 빠지지 않는다.
  for (let i = 0; i < 4; i++) await next.press("Enter");
  await expect.poll(() => current(page, "인연")).toMatch(ME);
});

test("사람이 없으면 나와 새 인연 두 장", async ({ page }) => {
  const row = await seed(page, 0);
  await expect(row.getByRole("link", { name: /새 인연/ })).toHaveAttribute("href", /^\/people\/new\/?$/);
  await expect(row.getByRole("link", { name: /모아 보기/ })).toHaveAttribute("aria-label", /2장/);
});

test("두 장이어도 고리가 돈다: 다음 두 번이면 다시 나, 이전 한 번이면 새 인연", async ({ page }) => {
  const row = await seed(page, 0);
  await expect.poll(() => current(page, "인연")).toMatch(ME);
  const next = row.getByRole("button", { name: "다음" });
  await next.press("Enter");
  await expect.poll(() => current(page, "인연")).toMatch(/^＋ 새 인연/);
  await next.press("Enter");
  await expect.poll(() => current(page, "인연")).toMatch(ME);
  await row.getByRole("button", { name: "이전" }).press("Enter");
  await expect.poll(() => current(page, "인연")).toMatch(/^＋ 새 인연/);
});

/* 첫 화면은 페이지가 아니라 카드 상자만 스크롤한다. 페이지가 넘치면 아래 칸에 손이 닿지 않는다. */
const pageOverflow = (page: Page) =>
  page.evaluate(() => document.scrollingElement!.scrollHeight - window.innerHeight);

test("아주 큰 글씨에서도 첫 화면이 화면을 넘치지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 727 });
  await seed(page, 3, { moments: 2, textSize: "xlarge" });
  await expect(page.locator("html")).toHaveAttribute("data-text", "xlarge");
  await expect(title(page)).toHaveText("인연");
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "순간 ↓" }).click();
  await expect(title(page)).toHaveText("순간");
});

test("다른 창 알림이 떠도 첫 화면이 화면을 넘치지 않는다", async ({ page, context }) => {
  await seed(page, 3, { moments: 2 });
  await expect(title(page)).toHaveText("인연");
  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    s.people[0].name = "바뀐이름";
    localStorage.setItem(key, JSON.stringify(s));
  }, STORAGE_KEY);
  await other.close();
  await expect(page.getByText("다른 창에서 고친 내용이 있어서")).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

/* 「나」 화면과 바닥글 */
test("나 화면 맨 위에 남은 시간, 그 아래 설정과 바닥글", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/settings");
  await expect(page.getByRole("heading", { name: "나", level: 1 })).toBeVisible();
  await expect(page.getByText("나에게 남은 시간")).toBeVisible();
  await expect(page.getByRole("link", { name: "서비스 소개" })).toBeVisible();
});

test("첫 화면과 상세에는 바닥글이 없다", async ({ page }) => {
  await seed(page, 1);
  await expect(page.getByRole("link", { name: "서비스 소개" })).toHaveCount(0);
  await page.goto("/people/detail/?id=p0");
  await expect(page.getByRole("link", { name: "서비스 소개" })).toHaveCount(0);
});

test("백업 알림을 누르면 같은 화면의 내보내기로", async ({ page }) => {
  await seed(page, 1); // 시드의 updatedAt은 이번 시각이라 7일을 채우도록 옛날로 돌린다
  await page.evaluate((key) => {
    const s = JSON.parse(localStorage.getItem(key)!);
    const old = "2026-01-02T00:00:00.000Z";
    s.people.forEach((p: { createdAt: string; updatedAt: string }) => { p.createdAt = old; p.updatedAt = old; });
    localStorage.setItem(key, JSON.stringify(s));
  }, STORAGE_KEY);
  await page.goto("/settings");
  await page.getByRole("link", { name: /내보내 두기/ }).click();
  await expect(page).toHaveURL(/#backup$/);
  await expect(page.getByRole("button", { name: "내보내기" })).toBeVisible();
});

/* 머리글: 아래 탭 없이 「←」 하나 */
test("아래 탭이 없다", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seed(page, 1);
  await expect(page.locator("nav.fixed")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "설정", exact: true })).toHaveCount(0);
});

test("상세에 주소로 바로 들어와 뒤로를 누르면 첫 화면", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/people/detail/?id=p0");
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("목록에서 상세로 갔다가 뒤로를 누르면 목록", async ({ page }) => {
  await seed(page, 2);
  await page.goto("/people");
  await page.locator("a.card").first().click();
  await expect(page).toHaveURL(/\/people\/detail/);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/people\/?$/);
});

test("문서 화면에 바로 들어와 뒤로를 누르면 나 화면", async ({ page }) => {
  await page.goto("/privacy");
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/settings\/?$/);
});

test("문서에 바로 들어와 다른 문서로 갔다가 뒤로 두 번이면 나 화면(사이트 밖으로 나가지 않는다)", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("link", { name: "읽을거리", exact: true }).click();
  await expect(page).toHaveURL(/\/reads\/?$/);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/about\/?$/);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/settings\/?$/);
});

test("편집 중 뒤로를 누르면 묻고, 취소하면 남는다", async ({ page }) => {
  await seed(page, 0);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("테스트");
  let asked = false;
  page.once("dialog", (d) => { asked = true; void d.dismiss(); });
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect.poll(() => asked).toBe(true);
  await expect(page).toHaveURL(/\/people\/new/);
});

test("목록에서 추가로 들어가 편집 중 뒤로를 누르면 한 번만 묻고 목록으로", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/people");
  await page.getByRole("link", { name: "추가", exact: true }).click();
  await page.waitForURL(/\/people\/new\/?$/);
  await page.getByLabel("이름").fill("테스트");
  let asked = 0;
  page.on("dialog", (d) => { asked++; void d.accept(); });
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/people\/?$/);
  await page.waitForTimeout(500);
  expect(asked).toBe(1);
});

test("주소로 바로 들어온 편집 화면에서 뒤로를 누르면 한 번만 묻고 첫 화면", async ({ page }) => {
  await seed(page, 0);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("테스트");
  let asked = 0;
  page.on("dialog", (d) => { asked++; void d.accept(); });
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(500);
  expect(asked).toBe(1);
});

/* 첫 화면: 인연·순간 두 줄 */
test("새로 열면 첫 사람 카드, 생일이 가까우면 그 사람", async ({ page }) => {
  await clearState(page);
  // 둘째(나이로 가운데)의 생일이 5일 뒤. 2월 29일생은 해마다 날이 달라 6일로 비켜 간다.
  const born = await page.evaluate(() => {
    const p = (v: number) => String(v).padStart(2, "0");
    for (let n = 5; ; n++) {
      const d = new Date();
      d.setDate(d.getDate() + n);
      const s = `${d.getFullYear() - 42}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      if (!s.endsWith("-02-29")) return { s, n };
    }
  });
  await seed(page, 0, { people: [person(0), { ...person(1), ageYears: undefined, ageAsOf: undefined, birthDate: born.s }, person(2)] });
  await expect.poll(() => current(page, "인연")).toMatch(/^사람2/);
  expect(await current(page, "인연")).toContain(`생일 ${born.n}일 전`);
});

test("순간 ↓를 누르면 제목이 순간, ↑ 인연으로 돌아온다", async ({ page }) => {
  await seed(page, 1, { moments: 2 });
  await expect(title(page)).toHaveText("인연");
  await page.getByRole("button", { name: "순간 ↓" }).click();
  await expect(title(page)).toHaveText("순간");
  await page.getByRole("button", { name: "↑ 인연" }).click();
  await expect(title(page)).toHaveText("인연");
});

test("키보드만으로 모든 카드에 닿는다", async ({ page }) => {
  await seed(page, 3, { moments: 2 });
  await page.getByRole("group", { name: "카드" }).focus();
  async function walk(row: string, n: number): Promise<string[]> {
    const seen = [await current(page, row)];
    for (let i = 1; i < n; i++) {
      await page.keyboard.press("ArrowRight");
      await expect.poll(() => current(page, row)).not.toBe(seen[i - 1]);
      seen.push(await current(page, row));
    }
    return seen;
  }
  const people = await walk("인연", 5);
  expect(people.filter((s) => ME.test(s))).toHaveLength(1);
  for (const name of ["사람1", "사람2", "사람3", "＋ 새 인연"]) expect(people.filter((s) => s.startsWith(name))).toHaveLength(1);
  await page.keyboard.press("ArrowDown");
  await expect(title(page)).toHaveText("순간");
  const moments = await walk("순간", 3);
  for (const name of ["순간1", "순간2", "＋ 새 순간"]) expect(moments.filter((s) => s.startsWith(name))).toHaveLength(1);
});

test("나 카드에서 내보내기까지", async ({ page }) => {
  await seed(page, 2);
  await page.getByRole("group", { name: "카드" }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect.poll(() => current(page, "인연")).toMatch(ME);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/settings\/?$/);
  await expect(page.getByRole("button", { name: "내보내기" })).toBeVisible();
});

test("상세에 갔다 돌아오면 같은 줄의 같은 카드", async ({ page }) => {
  await seed(page, 1, { moments: 3 });
  await page.getByRole("button", { name: "순간 ↓" }).click();
  await expect(title(page)).toHaveText("순간");
  const first = await current(page, "순간");
  await page.getByRole("region", { name: "순간" }).getByRole("button", { name: "다음" }).press("Enter");
  await expect.poll(() => current(page, "순간")).not.toBe(first);
  const second = await current(page, "순간");
  await page.getByRole("group", { name: "카드" }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/moments\/detail/);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(title(page)).toHaveText("순간");
  await expect.poll(() => current(page, "순간")).toBe(second);
});

test("아이 카드에는 성장 한 줄", async ({ page }) => {
  await seed(page, 0, { people: [{ ...person(0), name: "지우", ageYears: 7 }] });
  await expect(page.getByRole("region", { name: "인연" }).getByRole("link", { name: /지우/ })).toContainText("만 20세까지");
});

test("세로로 밀면 순간 줄로", async ({ page }) => {
  await seed(page, 1, { moments: 1 });
  const box = (await page.getByRole("group", { name: "카드" }).boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 600);
  await expect(title(page)).toHaveText("순간");
});

// 화살표 흔들림 같은 CSS 움직임은 빼고, element.animate로 만든 효과만 센다.
const anims = (page: Page) =>
  page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length);

test("카드를 누르면 상세 사진이 날아 온다", async ({ page }) => {
  const row = await seed(page, 1);
  await row.getByRole("link", { name: /사람1/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
  await expect.poll(() => anims(page)).toBeGreaterThan(0);
});

test("주소로 바로 들어오면 효과가 없다", async ({ page }) => {
  await seed(page, 1);
  await page.goto("/people/detail?id=p0");
  await expect(page.getByRole("heading", { name: /사람1/ }).first()).toBeVisible();
  expect(await anims(page)).toBe(0);
});

test("효과 도중 뒤로 가도 사진이 제자리", async ({ page }) => {
  const row = await seed(page, 1);
  await row.getByRole("link", { name: /사람1/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
  await page.waitForTimeout(100);
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
  const img = page.getByRole("region", { name: "인연" }).getByRole("link", { name: /사람1/ }).locator("img");
  await expect.poll(() => img.evaluate((el) => getComputedStyle(el).transform), { timeout: 3000 }).toBe("none");
  expect(await anims(page)).toBe(0);
});

test("돌아오면 카드 사진이 내려앉는다", async ({ page }) => {
  const row = await seed(page, 1);
  await row.getByRole("link", { name: /사람1/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
  await expect(page.getByRole("heading", { name: /사람1/ }).first()).toBeVisible();
  await page.getByRole("button", { name: "뒤로" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect.poll(() => anims(page)).toBeGreaterThan(0);
});

test.describe("움직임 줄이기", () => {
  test.use({ reducedMotion: "reduce" });
  test("누른 뒤에도 효과가 없다", async ({ page }) => {
    const row = await seed(page, 1);
    await row.getByRole("link", { name: /사람1/ }).click();
    await expect(page).toHaveURL(/\/people\/detail/);
    expect(await anims(page)).toBe(0);
  });
});
