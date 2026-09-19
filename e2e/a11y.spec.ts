import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { clearState, setUpProfile } from "./helpers";

/**
 * 접근성은 눈으로 표본을 훑어서는 안 된다.
 * 한 번은 요소 다섯 개만 재 보고 "대비 괜찮다"고 넘어갔는데, 전수 검사를 돌리니
 * 보조 텍스트 색 하나 때문에 197곳이 걸렸다. 그래서 기준은 "위반 0건"이다.
 */
const RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"];

const SCREENS = [
  { path: "/", label: "홈" },
  { path: "/setup", label: "내 정보" },
  { path: "/people", label: "인연 목록" },
  { path: "/moments", label: "순간 목록" },
  { path: "/marriage", label: "결혼 계획" },
  { path: "/settings", label: "설정" },
];

/** 빈 화면만 보면 의미가 없다. 실제 데이터가 있는 상태를 만든다. */
async function seed(page: import("@playwright/test").Page) {
  await setUpProfile(page, 38);
  await page.goto("/people/new");
  await page.getByRole("button", { name: "🧸 자녀" }).click();
  await page.getByLabel("나이", { exact: true }).fill("7");
  await page.getByRole("button", { name: "+ 해마다 줄어듦" }).click();
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL("**/people");
  await page.goto("/moments/new");
  await page.getByRole("button", { name: "🌸 벚꽃 보기" }).click();
  // 조건을 하나 걸어야 목록의 "조건 N개 적용됨"(강조색 글자)까지 검사 대상이 된다.
  await page.getByRole("button", { name: "+ 해마다 줄어듦" }).click();
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL("**/moments");
}

for (const scheme of ["light", "dark"] as const) {
  test.describe(`접근성 (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    test.beforeEach(async ({ page }) => {
      await clearState(page);
      await seed(page);
    });

    for (const { path, label } of SCREENS) {
      test(`${label}에 위반이 없다`, async ({ page }) => {
        await page.goto(path);
        await page.waitForTimeout(200);
        const { violations } = await new AxeBuilder({ page }).withTags(RULES).analyze();
        expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
      });
    }

    test("인연 상세와 되돌리기 막대에 위반이 없다", async ({ page }) => {
      await page.goto("/people");
      await page.locator("a.card").first().click();
      await page.waitForTimeout(400);
      const detail = await new AxeBuilder({ page }).withTags(RULES).analyze();
      expect(detail.violations.map((v) => v.id)).toEqual([]);

      await page.getByRole("button", { name: "삭제", exact: true }).last().click();
      await page.waitForTimeout(400);
      await expect(page.getByRole("status")).toBeVisible();
      const undo = await new AxeBuilder({ page }).withTags(RULES).analyze();
      expect(undo.violations.map((v) => v.id)).toEqual([]);
    });
  });
}

test.describe("키보드", () => {
  test.beforeEach(async ({ page }) => {
    await clearState(page);
    await setUpProfile(page, 38);
  });

  test("첫 Tab은 본문 건너뛰기 링크이고, 눌러야 보인다", async ({ page }) => {
    await page.goto("/");
    const skip = page.getByRole("link", { name: "본문으로 건너뛰기" });

    // sr-only는 화면에서 안 보일 뿐 접근성 트리에는 남아 있어야 한다(그게 목적이다).
    // 그래서 toBeHidden이 아니라 실제 크기로 확인한다.
    const before = await skip.boundingBox();
    expect(before?.width ?? 0).toBeLessThan(4);

    await page.keyboard.press("Tab");
    await expect(skip).toBeFocused();
    const after = await skip.boundingBox();
    expect(after?.width ?? 0).toBeGreaterThan(80);

    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#main$/);
  });

  test("키보드만으로 인연을 등록할 수 있다", async ({ page }) => {
    await page.goto("/people/new");
    await page.getByLabel("이름").focus();
    await page.keyboard.type("키보드");
    await page.getByLabel("나이", { exact: true }).focus();
    await page.keyboard.type("60");
    await page.getByRole("button", { name: "추가하기" }).focus();
    await page.keyboard.press("Enter");

    await page.waitForURL("**/people");
    await expect(page.locator("a.card").first()).toContainText("키보드");
  });

  test("탭으로 이동하면 초점 테두리가 보인다", async ({ page }) => {
    await page.goto("/people/new");
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { width: s.outlineWidth, style: s.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(parseFloat(outline.width)).toBeGreaterThanOrEqual(2);
  });

  test("움직임 줄이기 설정을 존중한다", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.evaluate(() => {
      const el = document.querySelector(".card") as Element;
      return parseFloat(getComputedStyle(el).transitionDuration);
    });
    expect(duration).toBeLessThan(0.01);
  });

  test("200% 확대 상당에서도 가로 스크롤이 없다", async ({ page }) => {
    await page.setViewportSize({ width: 210, height: 470 });
    await page.goto("/");
    await page.waitForTimeout(200);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });
});
