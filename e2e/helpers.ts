import type { Page } from "@playwright/test";

export const STORAGE_KEY = "relationship-countdown.v1";

/** 내 정보를 채워 계산이 돌아가는 상태로 만든다. 거의 모든 시나리오의 출발점. */
export async function setUpProfile(page: Page, age: number): Promise<void> {
  await page.goto("/setup");
  await page.getByLabel("내 나이").fill(String(age));
  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL("/");
}

/** 화면에서 가장 큰 숫자(결과 패널의 주인공). */
export async function headline(page: Page): Promise<string> {
  return (await page.locator("p.numeral").first().innerText()).trim();
}

/** 저장된 앱 상태를 그대로 읽는다. 저장이 실제로 됐는지 볼 때 쓴다. */
export async function readState(page: Page): Promise<Record<string, unknown> | null> {
  return page.evaluate((key) => {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  }, STORAGE_KEY);
}

export async function clearState(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate((key) => localStorage.removeItem(key), STORAGE_KEY);
}
