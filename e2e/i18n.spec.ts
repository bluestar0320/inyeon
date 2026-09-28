import { expect, test } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 다른 언어로 두면 화면 어디에도 한글이 남지 않아야 한다. 이름처럼 사용자가 넣은 값은
 * 영문으로 심어 두므로, 여기서 한글이 보이면 번역이 빠진 문구다.
 */
const PAGES = [
  "/",
  "/people/",
  "/people/new/",
  "/people/detail/?id=p1",
  "/people/edit/?id=p1",
  "/moments/",
  "/moments/new/",
  "/moments/detail/?id=m1",
  "/moments/edit/?id=m1",
  "/marriage/",
  "/setup/",
  "/settings/",
];

const now = new Date().toISOString();
const seed = (language: string) => ({
  version: 1,
  profile: { ageYears: 35, lifeExpectancy: 84, lifeExpectancyManual: false, countryCode: "KR", sex: "all",
    health: { smoking: "bad" } },
  people: [
    { id: "p1", name: "Mom", ageYears: 64, lifeExpectancy: 88, lifeExpectancyManual: false, countryCode: "KR",
      sex: "female", frequency: { count: 1, unit: "month" }, hoursPerMeeting: 3, since: "2015-03-01",
      filters: [{ id: "f", label: "Busy", enabled: true, kind: "decay", ratePerYear: 0.02 }],
      scenarios: [{ id: "s", label: "Twice", frequency: { count: 2, unit: "month" }, filters: [] }],
      createdAt: now, updatedAt: now },
    { id: "p2", name: "Kid", ageYears: 6, lifeExpectancy: 85, lifeExpectancyManual: false, countryCode: "KR",
      sex: "all", frequency: { count: 5, unit: "week" }, filters: [],
      growth: { adultAge: 20, dinners: { count: 5, unit: "week" } }, createdAt: now, updatedAt: now },
  ],
  moments: [
    { id: "m1", title: "Surf", frequency: { count: 4, unit: "year" }, horizon: { kind: "untilAge", age: 70 },
      filters: [{ id: "w", label: "Abroad", enabled: true, kind: "window", fromYear: 1, toYear: 3, mode: "except" }],
      createdAt: now, updatedAt: now },
  ],
  marriage: { targetAge: 40, frequency: { count: 1, unit: "month" }, filters: [], updatedAt: now },
  settings: { tone: "warm", theme: "system", showPast: true, language },
});

for (const language of ["en", "ja", "es", "zh"]) {
  test(`${language}: 화면에 한글이 남지 않는다`, async ({ page }) => {
    await clearState(page);
    await page.evaluate(
      ({ key, value }) => localStorage.setItem(key, JSON.stringify(value)),
      { key: STORAGE_KEY, value: seed(language) },
    );
    const leftovers: string[] = [];
    for (const path of PAGES) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("lang", language);
      await page.waitForTimeout(150);
      const text = await page.locator("body").innerText();
      const attrs = await page.evaluate(() =>
        [...document.querySelectorAll("[aria-label],[placeholder],[title]")]
          .map((el) => ["aria-label", "placeholder", "title"].map((a) => el.getAttribute(a) ?? "").join(" "))
          .join("\n"),
      );
      for (const line of `${text}\n${attrs}`.split("\n")) {
        // 언어 고르기 칩의 "한국어"는 그 언어 이름이라 그대로 둔다.
        if (/[가-힣]/.test(line) && line.trim() !== "한국어") leftovers.push(`${path}: ${line.trim()}`);
      }
    }
    expect(leftovers).toEqual([]);
  });
}
