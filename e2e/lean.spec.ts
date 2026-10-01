import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

import { setUpProfile } from "./helpers";

/*
 * 덜 귀찮게. 첫 화면을 막지 않고, 적는 칸을 줄이고, 알아서 할 수 있는 건 알아서 한다.
 */

test("처음 오면 소개·동의 화면 없이 바로 내 정보를 적는다", async ({ page }) => {
  await page.goto("/");
  await page.waitForURL(/\/setup\/?$/);
  await expect(page.getByLabel("내 나이")).toBeVisible();
  await expect(page.getByRole("button", { name: "시작하기" })).toHaveCount(0);
});

test.describe("처음 저장하는 사람", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("저장 단추 아래 한 줄 동의 체크 — 체크해야 저장되고, 보기는 개인정보처리방침으로", async ({ page }) => {
    await page.goto("/setup");
    await page.getByLabel("내 나이").fill("30");
    const save = page.getByRole("button", { name: "저장하기" });
    await expect(save).toBeDisabled();
    await page.getByLabel(/개인정보 수집·이용에 동의합니다/).check();
    await expect(save).toBeEnabled();
    await page.getByRole("link", { name: "보기" }).click();
    await page.waitForURL(/\/privacy/);
    await expect(page.getByRole("heading", { name: "개인정보처리방침" })).toBeVisible();
  });

  test("한 번 동의하면 인연을 추가할 때 다시 묻지 않는다", async ({ page }) => {
    await page.goto("/setup");
    await page.getByLabel("내 나이").fill("30");
    await page.getByLabel(/개인정보 수집·이용에 동의합니다/).check();
    await page.getByRole("button", { name: "저장하기" }).click();
    await page.waitForURL(/\/people\/new/);
    await expect(page.getByLabel(/개인정보 수집·이용에 동의합니다/)).toHaveCount(0);
    await page.getByLabel("이름").fill("엄마");
    await page.getByLabel("나이", { exact: true }).fill("60");
    await expect(page.getByRole("button", { name: "추가하기" })).toBeEnabled();
  });
});

test("아래쪽 링크로 서비스 소개·읽을거리·약관을 연다", async ({ page }) => {
  await page.goto("/reads");
  await page.getByRole("link", { name: /65세가 넘으면/ }).click();
  await expect(page.getByText("59.7%", { exact: false })).toBeVisible();
  await expect(page.getByText("노인실태조사", { exact: false }).first()).toBeVisible();
  for (const [link, heading] of [["서비스 소개", "몇 번 더"], ["이용약관", "이용약관"], ["개인정보처리방침", "개인정보처리방침"]]) {
    await page.getByRole("contentinfo").getByRole("link", { name: link }).click();
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }
});

test("인연 입력 화면에 사진 고르기·메모·성장 캘린더 켜기가 없다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  await expect(page.getByLabel("이름")).toBeVisible();
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  await expect(page.getByText("메모", { exact: false })).toHaveCount(0);
  await expect(page.getByText("성장 캘린더 켜기")).toHaveCount(0);
  await page.goto("/moments/new");
  await expect(page.locator('input[type="radio"]')).toHaveCount(0);
  await expect(page.locator("textarea")).toHaveCount(0);
});

test("미성년자를 넣으면 켜지 않아도 성인이 될 때까지를 센다 — 어른은 안 센다", async ({ page }) => {
  await setUpProfile(page, 35);
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("지우");
  await page.getByLabel("나이", { exact: true }).fill("7");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);
  await expect(page.getByText("성장 캘린더")).toBeVisible();
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "아이와 남은 것들" })).toBeVisible();
  await expect(page.getByRole("link").filter({ hasText: "만 20세까지" }).first()).toContainText("지우");

  await page.goto("/people/new");
  await page.getByLabel("이름").fill("엄마");
  await page.getByLabel("나이", { exact: true }).fill("60");
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people/);
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.waitForURL(/detail/);
  await expect(page.getByText("성장 캘린더")).toHaveCount(0);
});

test("폰에서 입력 칸을 눌러도 확대되지 않고(16px), 칩은 손가락으로 누를 만하다", async ({ page }) => {
  await setUpProfile(page, 30);
  for (const path of ["/setup", "/people/new", "/moments/new"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const small = await page.evaluate(() =>
      [...document.querySelectorAll("input:not([type=checkbox]):not([type=radio]), select, textarea")]
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => el.outerHTML.slice(0, 60)),
    );
    expect(small, path).toEqual([]);
    const tiny = await page.evaluate(() =>
      [...document.querySelectorAll(".chip")].filter((el) => el.getBoundingClientRect().height < 36).length,
    );
    expect(tiny, path).toBe(0);
  }
});

test("아직 셀 수 없을 때 결과 자리는 한 줄로 작게, 입력 칸이 첫 화면에 보인다", async ({ page }) => {
  await setUpProfile(page, 30);
  await page.goto("/people/new");
  const name = page.getByLabel("이름");
  const box = await name.boundingBox();
  expect(box!.y + box!.height).toBeLessThan(page.viewportSize()!.height);
});

test("새 문서 페이지들도 밝게·어둡게 접근성 위반이 없다", async ({ page }) => {
  for (const theme of ["light", "dark"]) {
    // 앱이 하듯 설정으로 테마를 정하고 새로 연다(그리기 전에 테마가 정해진다).
    await page.goto("/");
    await page.evaluate((theme) => {
      localStorage.setItem("relationship-countdown.v1", JSON.stringify({
        version: 1, profile: null, people: [], moments: [], marriage: null,
        settings: { tone: "calm", theme, showPast: true },
      }));
    }, theme);
    for (const path of ["/about", "/reads", "/reads/after-65", "/privacy", "/terms"]) {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(" ")}`), `${theme} ${path}`).toEqual([]);
    }
  }
});
