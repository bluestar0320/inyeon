import type { Page } from "@playwright/test";

export const STORAGE_KEY = "relationship-countdown.v1";

/**
 * 인연을 추가한 뒤 도착하는 곳.
 * 첫 인연은 큰 숫자를 보여주려고 상세로, 둘째부터는 목록으로 간다.
 */
export const AFTER_ADD_PERSON = /\/people(\/detail)?\/?(\?.*)?$/;

/**
 * 내 정보를 채워 계산이 돌아가는 상태로 만든다. 거의 모든 시나리오의 출발점.
 *
 * 처음 저장하면 홈이 아니라 첫 인연을 세우러 간다("47년"보다 "엄마 232번"이 먼저
 * 와야 하기 때문이다). 그래서 목적지를 하나로 못 박지 않고 둘 다 받아 준다.
 * 이 함수를 쓰는 시나리오들은 프로필만 있으면 되므로, 도착한 뒤 홈으로 옮겨 놓는다.
 */
export async function setUpProfile(page: Page, age: number): Promise<void> {
  await page.goto("/setup");
  await page.getByLabel("내 나이").fill(String(age));
  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForURL(/\/(people\/new)?\/?$/);
  if (!/\/people\/new/.test(page.url())) return;
  await page.goto("/");
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
