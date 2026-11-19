import { expect, test } from "@playwright/test";
import type { Locator, Page } from "@playwright/test";

import { setUpProfile } from "./helpers";

async function addPerson(page: Page, name: string, age: string) {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill(name);
  await page.getByLabel("나이", { exact: true }).fill(age);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people/);
}

/** 줄 아래 모아 보기 링크. 이름에 몇째 장인지 적혀 있다. */
const at = (stack: Locator) => stack.getByRole("link", { name: /모아 보기/ });

test("홈의 인연이 카드 줄로 걸리고, 넘기고, 누르면 상세로", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await addPerson(page, "할머니", "85");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  // 할머니 · 엄마. 첫 사람에서 시작한다.
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 2장 중 1번째");
  // 적게 남은 사람이 맨 위.
  await expect(stack.getByRole("link", { name: /할머니|엄마/ }).first()).toContainText("할머니");
  // 폰에서는 ‹ › 단추가 화면 낭독기·키보드용으로 숨어 있다. 키보드로 누른다.
  await stack.getByRole("button", { name: "다음" }).press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 2장 중 2번째");
  await stack.getByRole("link", { name: /엄마/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
});

test("카드가 한 장이면 넘기기 단추가 없고 모아 보기는 남는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(stack.getByRole("button", { name: "다음" })).toHaveCount(0);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 1장 중 1번째");
  await expect(stack.getByRole("link", { name: "새 인연" })).toHaveAttribute("href", /\/people\/new\/?$/);
});

test("순간이 없으면 순간 줄은 점선 「＋ 새 순간」 한 장뿐이다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/");
  const stack = page.getByRole("region", { name: "순간" });
  await expect(stack.getByRole("link", { name: /새 순간/ })).toHaveCount(1);
  await expect(stack.getByRole("button", { name: "다음" })).toHaveCount(0);
  await expect(at(stack)).toHaveCount(0);
});

test("긴 영문 이름이 화면을 옆으로 밀지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "m".repeat(30), "60");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});


async function threePeople(page: Page) {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await addPerson(page, "할머니", "85");
  await addPerson(page, "아빠", "62");
  await page.goto("/");
  return page.getByRole("region", { name: "인연" });
}

test("다음을 빠르게 두 번 누르면 두 장 넘어가고, 번호가 뒤로 깜빡이지 않는다", async ({ page }) => {
  const stack = await threePeople(page);
  const next = stack.getByRole("button", { name: "다음" });
  await next.press("Enter");
  await next.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
});

test.describe("움직임 줄이기", () => {
  test.use({ reducedMotion: "reduce" });
  test("넘길 때 날아가는 움직임 없이 바로 간다", async ({ page }) => {
    const stack = await threePeople(page);
    const first = await stack.locator("[data-top]").innerText();
    await stack.getByRole("button", { name: "다음" }).press("Enter");
    // 기다리지 않고 바로 다음 장이 맨 위에 있고, 움직이는 것이 없다.
    expect(await stack.locator("[data-top]").innerText()).not.toBe(first);
    // element.animate로 만든 날리기만 센다(CSS 움직임은 줄이기 설정이 따로 끈다).
    expect(await page.evaluate(() => document.getAnimations().filter((a) => !(a instanceof CSSAnimation) && !(a instanceof CSSTransition)).length)).toBe(0);
  });
});

test("키보드로 끝까지 넘겨도 초점이 단추에 남는다", async ({ page }) => {
  const stack = await threePeople(page);
  const next = stack.getByRole("button", { name: "다음" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 2번째");
  await page.keyboard.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  await page.keyboard.press("Enter");
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 1번째");
  await expect(next).toBeFocused();
});

test("홈 카드의 횟수를 화면 낭독기가 한 번만 읽는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/");
  const region = page.getByRole("region", { name: "인연" });
  // 숫자는 위 문장에 한 번. 사진 카드(링크)는 이름만 읽는다.
  const text = (await region.ariaSnapshot()).replace(/\s+/g, "");
  expect(text.match(/앞으로[\d,]+번/g) ?? [], text).toHaveLength(1);
  await expect(region.getByRole("link", { name: "엄마" })).toHaveCount(1);
});

test("상세 화면에서 이름을 화면 낭독기가 두 번 읽지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.waitForURL(/detail/);
  const snapshot = await page.locator("main").ariaSnapshot();
  // 제목(h1) 말고는 이름만 덩그러니 읽히는 줄이 없어야 한다.
  const bare = snapshot.split("\n").filter((line) => /^- (text: )?"?엄마"?$/.test(line.trim()));
  expect(bare, snapshot).toEqual([]);
});


/** 맨 위 사진을 손가락(포인터)으로 dx만큼 끈다. */
async function swipe(page: Page, stack: Locator, dx: number) {
  const box = (await stack.locator("[data-pile]").boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + i);
  await page.mouse.up();
}

test("손가락으로 왼쪽으로 밀면 다음 장, 끝에서 밀면 첫 장, 오른쪽으로 밀면 되돌아온다", async ({ page }) => {
  const stack = await threePeople(page);
  await swipe(page, stack, -150);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 2번째");
  await swipe(page, stack, -150);
  await swipe(page, stack, -150);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 1번째");
  await swipe(page, stack, 150);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  // 조금만 밀면 제자리로 돌아오고, 끈 뒤 손을 떼도 상세로 가지 않는다.
  await swipe(page, stack, -30);
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 3번째");
  await expect(page).toHaveURL(/\/$/);
});

test("세로로 밀면 장을 넘기지 않는다(인연 ↔ 순간은 바깥 상자의 몫)", async ({ page }) => {
  const stack = await threePeople(page);
  const box = (await stack.locator("[data-pile]").boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let i = 1; i <= 10; i++) await page.mouse.move(x - i * 2, y - i * 15);
  await page.mouse.up();
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 1번째");
});

test("인연 목록에서 내 순서를 정하면 홈 인연 줄도 그 순서로 시작한다", async ({ page }) => {
  await threePeople(page);
  await page.goto("/people");
  await page.getByRole("button", { name: "내 순서" }).click();
  // 넣은 순서(엄마·할머니·아빠)에서 아빠를 맨 위로.
  await page.getByRole("button", { name: "아빠 위로" }).click();
  await page.getByRole("button", { name: "아빠 위로" }).click();
  await expect(page.locator("a.card").first()).toContainText("아빠");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(at(stack)).toHaveAttribute("aria-label", "모아 보기, 3장 중 1번째");
  await expect(stack.getByRole("link", { name: /엄마|할머니|아빠/ })).toHaveText("아빠");
});
