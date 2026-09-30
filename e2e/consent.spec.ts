import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// 이 파일만 동의하지 않은 새 사람으로 시작한다.
test.use({ storageState: { cookies: [], origins: [] } });

test("처음 온 사람은 동의해야 들어간다", async ({ page }) => {
  await page.goto("/people/");
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toBeVisible();
  const start = page.getByRole("button", { name: "동의하고 시작하기" });
  await expect(start).toBeDisabled();
  await page.getByLabel("위 내용을 확인했고 동의합니다").check();
  await expect(start).toBeDisabled();
  await page.getByLabel("만 14세 이상입니다").check();
  await start.click();
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toHaveCount(0);
});

test("저장이 막혀도 갇히지 않는다", async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  await page.goto("/");
  await page.getByLabel("위 내용을 확인했고 동의합니다").check();
  await page.getByLabel("만 14세 이상입니다").check();
  await page.getByRole("button", { name: "동의하고 시작하기" }).click();
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toHaveCount(0);
});

test("설정에서 안내를 다시 읽는다", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("위 내용을 확인했고 동의합니다").check();
  await page.getByLabel("만 14세 이상입니다").check();
  await page.getByRole("button", { name: "동의하고 시작하기" }).click();
  await page.goto("/settings/");
  await page.getByRole("link", { name: "개인정보 안내" }).click();
  await expect(page.getByText("이 기기 안에만 저장합니다", { exact: false })).toBeVisible();
  await expect(page.getByText(/동의한 날/)).toBeVisible();
  // 안내는 실제 동작과 정확히 맞아야 한다: 메모도 적히고, 웹에서는 사이트 데이터로 지우고,
  // 공유·내보내기는 내가 고른 곳으로 나간다.
  await expect(page.getByText("메모", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("사이트 데이터", { exact: false })).toBeVisible();
  await expect(page.getByText("공유·내보내기", { exact: false })).toBeVisible();
});

test("동의 화면도 접근성 위반이 없다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
