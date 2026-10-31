import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

/*
 * 갤럭시 화면 폭·글씨 크기마다 글자가 옆으로 밀려나거나 서로 겹치지 않는지 본다.
 *
 * 폭(dp): 344 폴드 커버, 360 S24·보급형 A, 384 A 일부, 412 울트라·플러스.
 * 높이는 짧은 쪽(옛 보급형 360×640)도 하나 넣는다.
 * 글씨: 앱 설정 「아주 크게」(zoom 1.3)와, 폰 설정 글씨 크기 130%.
 * 안드로이드 웹뷰는 폰 글씨 크기만큼 글자만 키우고 상자는 그대로 둔다(textZoom).
 * 브라우저로는 못 켜니, 모든 글자의 font-size를 직접 1.3배로 바꿔 흉내 낸다.
 */

const SIZES = [
  { w: 344, h: 882 },
  { w: 360, h: 640 },
  { w: 360, h: 780 },
  { w: 384, h: 854 },
  { w: 412, h: 915 },
];
const SCALES = ["normal", "xlarge", "font130"] as const;

const now = new Date().toISOString();
const person = (id: string, name: string, relation: string, count: number, unit: string) => ({
  id, name, relation, ageYears: 63, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
  countryCode: "KR", sex: "female", frequency: { count, unit }, filters: [], createdAt: now, updatedAt: "2026-10-01T00:00:00.000Z",
});
const moment = (id: string, title: string) => ({ id, title, frequency: { count: 1, unit: "year" }, filters: [], createdAt: now, updatedAt: now });

function state(language: string, textSize?: string) {
  return {
    version: 1,
    profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all", nickname: "지훈" },
    people: [
      person("p1", "엄마", "어머니", 1, "month"),
      person("p2", "아빠", "아버지", 2, "year"),
      person("p3", "Christopher", "친구", 3, "week"),
    ],
    moments: [moment("m1", "벚꽃 보기"), moment("m2", "가족 해외여행")],
    marriage: null,
    settings: { tone: "aware", theme: "light", showPast: true, language, textSize },
  };
}

const PAGES = ["/", "/people", "/people/detail/?id=p1", "/people/new", "/people/edit/?id=p1", "/moments",
  "/moments/detail/?id=m1", "/moments/new", "/marriage", "/settings", "/setup", "/about", "/reads", "/privacy"];

/** 화면 폭을 넘는 것, 서로 다른 글자 덩어리가 겹치는 곳을 모은다. */
async function problems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const root = document.documentElement;
    if (root.scrollWidth > root.clientWidth + 1) out.push(`옆으로 밀림 ${root.scrollWidth}>${root.clientWidth}`);
    // zoom이 걸리면 사각형 단위가 달라지니 html 사각형에 견준다.
    const W = root.getBoundingClientRect().width;
    // 옆으로 넘기는 줄(가로 스크롤)이나 넘친 것을 숨기는 상자 안이면 그 상자에 견준다.
    const clipOf = (el: Element | null) => {
      for (; el && el !== document.body; el = el.parentElement)
        if (getComputedStyle(el).overflowX !== "visible") return el;
      return null;
    };
    const fixedOf = (el: Element | null) => { for (; el; el = el.parentElement) if (getComputedStyle(el).position === "fixed") return el; return null; };
    const boxes: { el: Element; r: DOMRect; fixed: Element | null; text: string }[] = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walk.nextNode(); n; n = walk.nextNode()) {
      const text = n.textContent!.trim();
      const el = n.parentElement!;
      if (!text || !el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
      if (el.closest("[aria-hidden=true], .sr-only, svg, script, style, details:not([open]) > :not(summary)")) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        const clip = clipOf(el)?.getBoundingClientRect();
        const [L, R] = clip ? [clip.left, clip.right] : [0, W];
        // 옆으로 넘기는 줄은 다음 칸이 살짝 비치게 일부러 걸쳐 둔다.
        if (clip && /auto|scroll/.test(getComputedStyle(clipOf(el)!).overflowX)) { boxes.push({ el, r, fixed: fixedOf(el), text }); continue; }
        if (clip && getComputedStyle(clipOf(el)!).textOverflow === "ellipsis") continue; // 말줄임은 일부러
        if (r.right > R + 1 || r.left < L - 1) out.push(`화면 밖 「${text.slice(0, 20)}」 ${Math.round(r.left)}~${Math.round(r.right)}`);
        // 줄 상자는 줄 간격만큼 위아래로 길다. 큰 숫자는 특히 그렇다. 글자 몸통만 남긴다.
        const body = Math.min(r.height, parseFloat(getComputedStyle(el).fontSize) * 0.8);
        const mid = r.top + r.height / 2;
        boxes.push({ el, r: new DOMRect(r.left, mid - body / 2, r.width, body), fixed: fixedOf(el), text });
      }
      // 잘린 글자: 넘친 걸 숨기는 상자에서 글자가 더 길다(말줄임 … 은 일부러 한 것).
      const cs = getComputedStyle(el);
      if (cs.overflow !== "visible" && cs.textOverflow !== "ellipsis" && el.scrollWidth > el.clientWidth + 1)
        out.push(`잘림 「${text.slice(0, 20)}」 ${el.scrollWidth}>${el.clientWidth}`);
    }
    for (let i = 0; i < boxes.length; i++)
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j];
        if (a.el === b.el || a.fixed !== b.fixed || a.el.contains(b.el) || b.el.contains(a.el)) continue;
        const x = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
        const y = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
        // 줄 간격이 좁으면 위아래 줄 상자가 한두 픽셀 겹친다. 글자가 실제로 덮이는 것만 센다.
        if (x > 2 && y > Math.min(a.r.height, b.r.height) * 0.35)
          out.push(`겹침 「${a.text.slice(0, 15)}」×「${b.text.slice(0, 15)}」`);
      }
    return [...new Set(out)];
  });
}

/** 폰 글씨 크기 130%: 모든 글자 크기를 그대로 1.3배. 상자 크기는 건드리지 않는다. */
async function systemFont(page: Page, k: number) {
  await page.evaluate((k) => {
    const all = [...document.querySelectorAll<HTMLElement>("body *")];
    const sizes = all.map((el) => parseFloat(getComputedStyle(el).fontSize));
    all.forEach((el, i) => el.style.setProperty("font-size", `${sizes[i] * k}px`, "important"));
  }, k);
  await page.waitForTimeout(100);
}

for (const lang of ["ko", "en"])
  for (const scale of SCALES)
    test(`${lang} ${scale}: 갤럭시 폭마다 글자가 넘치거나 겹치지 않는다`, async ({ page }) => {
      test.setTimeout(240_000);
      await clearState(page);
      await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)),
        { key: STORAGE_KEY, v: state(lang, scale === "xlarge" ? "xlarge" : undefined) });
      const found: string[] = [];
      for (const { w, h } of SIZES) {
        await page.setViewportSize({ width: w, height: h });
        for (const path of PAGES) {
          await page.goto(path);
          await page.waitForLoadState("networkidle");
          await page.waitForTimeout(250);
          if (scale === "font130") await systemFont(page, 1.3);
          for (const p of await problems(page)) found.push(`${w}×${h} ${path} ${p}`);
          if (process.env.FIT_SHOTS && (w === 344 || w === 360))
            await page.screenshot({ path: `e2e/_fit/${lang}-${scale}-${w}x${h}${path.replace(/[/?=]/g, "_")}.png`, fullPage: true });
        }
      }
      expect(found, found.join("\n")).toEqual([]);
    });
