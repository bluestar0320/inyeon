import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState, readState } from "./helpers";

/*
 * 사진첩과 입력 화면을 사람이 할 법한 이상한 방식으로 두드려 본다.
 * 기록을 손으로 고친 백업, 다른 창에서의 삭제, 화면 돌리기, 연타, 개발자 도구로
 * 망가뜨린 동의 기록, 스크립트가 든 이름 같은 것들.
 */

const now = new Date().toISOString();

function person(id: string, name: string, extra: Record<string, unknown> = {}) {
  return {
    id, name, ageYears: 60, lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "female",
    frequency: { count: 1, unit: "month" }, filters: [], createdAt: now, updatedAt: now, ...extra,
  };
}

function moment(id: string, title: string, extra: Record<string, unknown> = {}) {
  return {
    id, title, frequency: { count: 1, unit: "year" }, horizon: { kind: "life" }, filters: [],
    createdAt: now, updatedAt: now, ...extra,
  };
}

/** 줄 아래 모아 보기 링크. 이름에 몇째 장인지 적혀 있다. */
const at = (stack: Locator) => stack.getByRole("link", { name: /모아 보기/ });

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

/** 화면의 사진이 전부 실제로 그려졌는지. 게으르게 받는 사진도 억지로 받게 한 뒤 본다. */
async function brokenImages(page: Page): Promise<string[]> {
  await page.evaluate(() => document.querySelectorAll("img").forEach((img) => img.setAttribute("loading", "eager")));
  await page.waitForFunction(() => [...document.images].every((img) => img.complete), null, { timeout: 10_000 });
  return page.evaluate(() => [...document.images].filter((img) => img.naturalWidth === 0).map((img) => img.src));
}

async function noSideScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}




test("손으로 고친 백업의 이상한 사진 값에도 깨진 사진이 없다", async ({ page }) => {
  const weird = ["zzz", 123, "__proto__", "constructor", "../../etc/passwd", null, "", { a: 1 }, "RAILWAY"];
  await seed(page, {
    people: weird.map((photo, i) => person(`p${i}`, `사람${i}`, { photo })),
    moments: weird.map((photo, i) => moment(`m${i}`, `순간${i}`, { photo })),
  });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const path of ["/", "/people/", "/moments/", "/people/detail?id=p2", "/moments/detail?id=m4"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    expect(await brokenImages(page), path).toEqual([]);
  }
  expect(errors).toEqual([]);
});

test("이름에 스크립트를 넣어도 글자로만 보인다", async ({ page }) => {
  const evil = '<img src=x onerror="window.__pwned=1">';
  await seed(page, { people: [person("a", evil)], moments: [moment("m", "<script>window.__pwned=2</script>")] });
  let dialog = false;
  page.on("dialog", async (d) => {
    dialog = true;
    await d.dismiss();
  });
  for (const path of ["/", "/people/", "/people/detail?id=a", "/moments/detail?id=m"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
  }
  expect(dialog).toBe(false);
  expect(await page.evaluate(() => (window as unknown as { __pwned?: number }).__pwned)).toBeUndefined();
  await page.goto("/");
  await expect(page.getByText(evil, { exact: false }).first()).toBeVisible();
});

test("아랍어·이모지만·보이지 않는 글자 이름도 화면을 밀지 않는다", async ({ page }) => {
  const names = ["مرحبا بالعالم يا أمي العزيزة", "👩‍👩‍👧‍👦👩‍👩‍👧‍👦👩‍👩‍👧‍👦👩‍👩‍👧‍👦👩‍👩‍👧‍👦", "​​​엄마​", "a".repeat(200)];
  await seed(page, {
    people: names.map((n, i) => person(`p${i}`, n, { relation: "관계".repeat(40) })),
    moments: [moment("m", "벚".repeat(300))],
  });
  for (const path of ["/", "/people/", "/people/detail?id=p3", "/moments/detail?id=m"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noSideScroll(page);
  }
});

test("다른 창에서 사람을 지워도 끝 장 번호가 '4 / 3'이 되지 않는다", async ({ page, context }) => {
  await seed(page, { people: [person("a", "하나", { ageYears: 80 }), person("b", "둘", { ageYears: 70 }), person("c", "셋", { ageYears: 60 })] });
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  // 폰에서는 ‹ › 단추가 화면 낭독기·키보드용으로 숨어 있다. 키보드로 누른다.
  const next = stack.getByRole("button", { name: "다음" });
  // 하나 · 둘 · 셋. 첫 사람에서 시작해 끝 장까지.
  for (const k of [2, 3]) {
    await next.press("Enter");
    await expect(at(stack)).toHaveAttribute("aria-label", `모아 보기, 3장 중 ${k}번째`);
  }

  const other = await context.newPage();
  await other.goto("/");
  await other.evaluate((key) => {
    const state = JSON.parse(localStorage.getItem(key)!);
    state.people = state.people.filter((p: { id: string }) => p.id !== "c");
    localStorage.setItem(key, JSON.stringify(state));
  }, STORAGE_KEY);
  await other.close();

  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 2장 중 2번째");
});

test("열두 명이면 줄에 열두 장 모두, 점 대신 숫자, 모아 보기에는 열두 명", async ({ page }) => {
  await seed(page, { people: Array.from({ length: 12 }, (_, i) => person(`p${i}`, `사람${i + 1}`, { ageYears: 40 + i })) });
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  // 열두 장까지는 점이다. 숫자는 열세 장부터.
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 12장 중 1번째");
  await at(stack).click();
  await expect(page.locator("a.card")).toHaveCount(12);
});

test("열세 명이면 점 대신 「1 / 13」", async ({ page }) => {
  await seed(page, { people: Array.from({ length: 13 }, (_, i) => person(`p${i}`, `사람${i + 1}`, { ageYears: 40 + i })) });
  await page.goto("/");
  await expect(page.getByRole("region", { name: "인연" }).getByText("1 / 13")).toBeVisible();
});

test("셋째 사람을 보다가 화면을 돌려도 같은 장에 머문다", async ({ page }) => {
  await seed(page, { people: [person("a", "하나", { ageYears: 80 }), person("b", "둘", { ageYears: 70 }), person("c", "셋", { ageYears: 60 })] });
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await stack.getByRole("button", { name: "다음" }).press("Enter");
  await stack.getByRole("button", { name: "다음" }).press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  const name = await stack.locator("[data-top]").innerText();
  const size = page.viewportSize()!;
  await page.setViewportSize({ width: size.height, height: size.width });
  await page.waitForTimeout(400);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  await expect(stack.locator("[data-top]")).toHaveText(name);
  await page.setViewportSize(size);
});

test("끝에서 다음을 누르면 첫 장으로, 첫 장에서 이전을 누르면 끝 장으로 이어진다", async ({ page }) => {
  await seed(page, { people: [person("a", "하나", { ageYears: 80 }), person("b", "둘", { ageYears: 70 }), person("c", "셋", { ageYears: 60 })] });
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  const next = stack.getByRole("button", { name: "다음" });
  const prev = stack.getByRole("button", { name: "이전" });
  await prev.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  await page.waitForTimeout(800);
  await next.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 1번째");
  await page.waitForTimeout(800);
  await next.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 2번째");
});

test("다음을 열 번 연타해도 번호가 깨지지 않고, 열 장을 넘긴 자리에 선다", async ({ page }) => {
  await seed(page, { people: [person("a", "하나", { ageYears: 80 }), person("b", "둘", { ageYears: 70 }), person("c", "셋", { ageYears: 60 })] });
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  const next = stack.getByRole("button", { name: "다음" });
  for (let i = 0; i < 10; i++) await next.press("Enter");
  await page.waitForTimeout(800);
  // 1에서 열 장: 10 % 3 = 1 → 2번째.
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 2번째");
  // 날아간 장이 화면 밖에 남지 않는다: 더미의 장은 모두 더미 안에 있다.
  const pile = (await stack.locator("[data-pile]").boundingBox())!;
  for (const card of await stack.locator(".pile-card").all()) {
    const b = (await card.boundingBox())!;
    expect(Math.abs(b.x + b.width / 2 - (pile.x + pile.width / 2))).toBeLessThan(pile.width * 0.2);
  }
});

test("더미의 사진을 연타해도 한 번만 넘어가고 오류가 없다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마")] });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("region", { name: "인연" }).getByRole("link", { name: /엄마/ }).dblclick();
  await page.waitForURL(/detail/);
  await page.goBack();
  await expect(page.getByRole("region", { name: "인연" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("남은 만남이 0번인 사람도 더미에 제대로 걸린다", async ({ page }) => {
  // 예상 수명을 넘긴 분은 이제 생명표로 세어 0이 되지 않는다. 0번은 정해 둔 목표 나이를 지났을 때 생긴다.
  await seed(page, { people: [person("a", "연인", { horizon: { kind: "untilMyAge", age: 1 } })] });
  await page.goto("/");
  const region = page.getByRole("region", { name: "인연" });
  await expect(region.getByRole("link", { name: /연인/ })).toBeVisible();
  await expect(region.locator(".deck-line")).toContainText("0");
});

test("사진을 고른 사람을 지웠다 되돌리면 사진도 돌아온다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마", { photo: "railway" })] });
  await page.goto("/people/detail?id=a");
  await page.getByRole("button", { name: /삭제/ }).first().click();
  const confirm = page.getByRole("button", { name: /삭제/ }).last();
  if (await confirm.isVisible()) await confirm.click();
  await page.getByRole("button", { name: "되돌리기" }).click();
  await expect.poll(async () => ((await readState(page))!.people as { photo?: string }[])[0]?.photo).toBe("railway");
});


test("어두운 모드에서 입력 화면·더미·상세에 접근성 위반이 없다", async ({ page }) => {
  await seed(page, {
    people: [person("a", "엄마"), person("b", "아빠")],
    moments: [moment("m", "벚꽃")],
    settings: { tone: "warm", theme: "dark", showPast: true },
  });
  for (const path of ["/", "/people/edit?id=a", "/people/detail?id=a", "/privacy/"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`), path).toEqual([]);
  }
});

test("인터넷이 끊겨도 폴라로이드 사진이 보인다", async ({ page, context }) => {
  await seed(page, { people: [person("a", "엄마", { photo: "sea" }), person("b", "아빠")], moments: [moment("m", "벚꽃", { emoji: "🌸" })] });
  await page.goto("/");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 15_000 });
  await expect
    .poll(() => page.evaluate(async () => (await caches.keys()).length), { timeout: 20_000 })
    .toBeGreaterThan(0);
  await expect
    .poll(
      () => page.evaluate(async () => {
        const keys = await caches.keys();
        const cache = await caches.open(keys[0]);
        return (await cache.keys()).filter((r) => r.url.includes("/photos/")).length;
      }),
      { timeout: 20_000 },
    )
    // 기본 24장 + 변형 90장(순간 11 + 인연 7, 5장씩). 전부 미리 받아 두어야 비행기 안에서도 보인다.
    .toBe(114);
  await context.setOffline(true);
  try {
    for (const path of ["/", "/people/", "/people/edit?id=b"]) {
      await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(await brokenImages(page), path).toEqual([]);
    }
  } finally {
    await context.setOffline(false);
  }
});

test("내보냈다 전부 지우고 다시 불러와도 고른 사진이 남는다", async ({ page }) => {
  await seed(page, { people: [person("a", "엄마", { photo: "railway" })], moments: [moment("m", "벚꽃", { photo: "snow" })] });
  await page.goto("/settings/");
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "내보내기" }).click();
  const file = await (await downloading).path();
  await page.getByRole("button", { name: "전체 삭제" }).click();
  await page.getByRole("button", { name: "정말 지우기" }).click();
  await expect.poll(async () => ((await readState(page))!.people as unknown[]).length).toBe(0);
  await page.locator('input[type="file"]').setInputFiles(file!);
  await expect
    .poll(async () => {
      const s = (await readState(page))!;
      return [(s.people as { photo?: string }[])[0]?.photo, (s.moments as { photo?: string }[])[0]?.photo];
    })
    .toEqual(["railway", "snow"]);
});

test("가장 작은 폰(320px)에서도 더미·입력 화면·약관이 옆으로 밀리지 않는다", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await seed(page, { people: [person("a", "엄마"), person("b", "아빠")], moments: [moment("m", "벚꽃")] });
  for (const path of ["/", "/people/edit?id=a", "/moments/new", "/privacy/", "/people/detail?id=a"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    await noSideScroll(page);
  }
});

test("언어를 바꾸면 더미의 단추와 안내도 그 언어로", async ({ page }) => {
  await seed(page, {
    people: [person("a", "Mom"), person("b", "Dad")],
    settings: { tone: "calm", theme: "system", showPast: true, language: "ja" },
  });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "次へ" })).toBeVisible();
  await page.goto("/privacy/");
  await expect(page.getByRole("heading", { name: "プライバシーポリシー" })).toBeVisible();
});



