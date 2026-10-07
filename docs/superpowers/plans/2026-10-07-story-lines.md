# 숫자를 이야기로 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 인연 결과 아래에 그때·지금·오늘·지나간 비율을 미리 써 둔 문장 은행에서 골라 보여 주고, 공유 카드와 「만났어요」에도 싣는다.

**Architecture:** 순수 로직은 `lib/story.ts`(상황 판별·비율·날수·고르기·빈칸 채우기), 문장은 `lib/storyBank.ts`(데이터만). 화면은 `components/StoryLines.tsx` 하나가 ResultPanel 안에 들어간다. 카드는 `ShareSpec.story`를 받아 줄바꿈해 그린다.

**Tech Stack:** Next.js(정적 내보내기) · TypeScript · node:test(`npm test`, .ts 직접 import) · Playwright E2E.

**Spec:** `docs/superpowers/specs/2026-10-07-story-lines-design.md`

## Global Constraints

- AI 호출 없음. 문장은 전부 storyBank.ts에 미리 쓴다.
- 첫 화면·입력 칸은 바꾸지 않는다. 새 입력 칸 금지(feedback-lean-first).
- 문구는 5개 언어(ko·en·ja·es·zh). 없는 칸은 물러서기로 채우고, 끝내 없으면 그 줄을 띄우지 않는다(빈 문장·`{name}` 노출 금지).
- 남은 횟수는 「만났어요」로 줄지 않는다 — met 문장에 "이제 N번 남았다"류 금지.
- 부모님 독립 가정 나이 20세(`since` 없을 때), 가정 문구를 반드시 함께 띄운다.
- 문서·주석·커밋은 한국어, 커밋 끝에 `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`.

## Review Focus

1. 관계가 비었거나 "엄마❤️", "우리 엄마", "Mom " 같은 변형 → parent로 잡혀야 한다(includes 매칭·trim).
2. 남은 횟수 0 또는 1 미만(수명 지남·목표 시점 지남) → 이야기 전체를 띄우지 않는다.
3. `since`가 미래 날짜이거나 내 나이보다 오래전 → 비율이 0~100 밖으로 나가지 않는다(clamp, null).
4. 영어 이름("Tom")·이모지 이름에 조사 → `josa()`가 처리, `{name:와/과}`가 그대로 노출되지 않는다.
5. 언어를 바꾼 직후·다크 테마 카드 → 이야기 줄이 카드 여백 밖으로 넘치지 않는다(share-fit).

각 항목의 테스트는 Task 1(1·2·3·4)과 Task 5(5)에 들어 있다.

---

### Task 1: 이야기 로직 (`lib/story.ts`)

**Files:**
- Create: `lib/story.ts`
- Create: `lib/storyBank.ts` (이 태스크에선 테스트에 필요한 최소 문장만)
- Test: `tests/story.test.mjs`

**Interfaces:**
- Produces:
  ```ts
  export type Rel = "parent" | "grandparent" | "partner" | "child" | "sibling" | "friend" | "other";
  export type CountBand = "week" | "month" | "c100" | "c200" | "c300" | "year" | "twoYears" | "c1000" | "more";
  export type FreqBand = "often" | "sometimes" | "rarely";
  export type PastBand = "start" | "early" | "middle" | "late" | "last";
  export type Slot = "then" | "now" | "today" | "past" | "met";
  export function relationKind(relation: string | undefined): Rel;
  export function countBand(count: number): CountBand;
  export function freqBand(frequency: Frequency): FreqBand;
  export function pastBand(pct: number): PastBand;
  export function pastShare(i: { rel: Rel; frequency: Frequency; since?: string; myAge: number | null; theirAge: number | null; remaining: number; now?: Date }): { pct: number; assumed: boolean } | null;
  export function spanText(count: number): string;          // 지금 언어. "4달", "a month"
  export function fill(template: string, vars: Record<string, string>): string | null; // 못 채우면 null
  export function hash(text: string): number;               // FNV-1a 32bit, 0 이상
  export interface Story { then?: string; now?: string; today?: string; past?: string; assumed: boolean }
  export function buildStory(i: { person: Person; remaining: number; myAge: number | null; theirAge?: number | null; tone: Tone; today: string; now?: Date }): Story | null;
  export function metLine(i: { person: Person; tone: Tone; thisYear: number }): string | null;
  ```
  storyBank.ts:
  ```ts
  export type SlotBank = Partial<Record<Slot, Record<string, string[]>>>;
  export const BANK: Record<Tone, Partial<Record<Lang, SlotBank>>>;
  ```

**규칙(테스트가 지키는 것):**
- `relationKind`: trim·소문자 후 `includes`. 순서 grandparent → parent → partner → child → sibling → friend(조부모의 "할머니"가 "머니"로 parent에 잡히지 않게 grandparent 먼저).
  - grandparent: 할머니 할아버지 조부모 외할 grand 祖父 祖母 おじいちゃん おばあちゃん abuel 爷爷 奶奶 外公 外婆 祖父母
  - parent: 엄마 어머니 아빠 아버지 mom mother dad father お母さん お父さん 母 父 mamá papá madre padre 妈 爸 母亲 父亲
  - partner: 연인 애인 배우자 남편 아내 여자친구 남자친구 partner wife husband girlfriend boyfriend 恋人 妻 夫 パートナー pareja esposa esposo novia novio 伴侣 老公 老婆 男朋友 女朋友
  - child: 자녀 아들 딸 아이 child son daughter kid 子ども 息子 娘 hijo hija 孩子 儿子 女儿
  - sibling: 형제 자매 형 누나 오빠 언니 동생 sibling brother sister きょうだい 兄 姉 弟 妹 herman 兄弟 姐妹 哥哥 姐姐 弟弟 妹妹
  - friend: 친구 friend 友 amig 朋友 好友
- `countBand`: ≤7 week, ≤30 month, ≤100 c100, ≤200 c200, ≤300 c300, ≤365 year, ≤730 twoYears, ≤1000 c1000, 그 위 more.
- `freqBand`: `toPerYear` ≥52 often, ≥12 sometimes, 그 밖 rarely.
- `pastBand`: <10 start, <40 early, <70 middle, <90 late, 그 위 last.
- `pastShare`:
  - parent: `myAge` 없으면 null. `since` 있으면 `away = (now - since)년`, 없으면 `myAge < 20 → null`, `away = myAge - 20`, `assumed = true`. `lived = max(0, myAge - away)`. `past = lived × 365.2425 + toPerYear(frequency) × away`.
  - 그 밖: `since` 없으면 null. `past = computePast(frequency, since, now, pastLimit(theirAge, myAge))?.count`, null이면 null.
  - `since`가 미래면 null. `past + remaining <= 0`이면 null. `pct = clamp(floor(past / (past + remaining) × 100), 0, 100)`.
- `spanText(count)`: 하루 1번으로 바꾼 날수 d = ceil(count). d≤7 "일주일", d≤31 "한 달", d<365 → `ceil(d/30.44)`달(12면 "1년"), 그 위 `ceil(d/365.2425)`년. 언어별: en "a week"/"a month"/"N months"/"a year"/"N years", ja "1週間"/"1か月"/"Nか月"/"1年"/"N年", es "una semana"/"un mes"/"N meses"/"un año"/"N años", zh "一周"/"一个月"/"N个月"/"一年"/"N年".
- `fill`: `{key}` → vars[key], `{key:와/과}` → `josa(vars[key], "와/과")`(JOSA 4쌍만). 모르는 key가 남으면 null.
- 키 고르기(구체 → 일반): then `[rel.freq, rel]`, now `[rel.count, count, "*"]`, today `[rel.freq, freq, "*"]`, past `[rel.past, past]`, met `[rel, "*"]`.
- 물러서기 순서: (tone, lang) → (aware, lang) → lang≠ko이면 (tone, en) → (aware, en). 각 단계에서 위 키 순서로 찾는다.
- 고르기: then·now·past `hash(id + slot)`, today `hash(id + slot + today)`, met `hash(id + "met" + thisYear)`; `list[seed % list.length]`.
- `buildStory`: `remaining < 1`이면 null. then은 rel=parent이고 pastShare가 있을 때만. past는 pastShare가 있을 때만. vars: `name`, `count`=formatCount(remaining), `span`=spanText(remaining), `pct`=String(pct). 네 줄이 다 없으면 null.
- `metLine`: vars `name`, `n`=String(thisYear).

- [ ] **Step 1: 실패하는 테스트 쓰기** — `tests/story.test.mjs`

```js
import assert from "node:assert/strict";
import { test } from "node:test";

import { setLang } from "../lib/i18n.ts";
import { BANK } from "../lib/storyBank.ts";
import {
  buildStory, countBand, fill, freqBand, hash, metLine, pastBand, pastShare, relationKind, spanText,
} from "../lib/story.ts";

const NOW = new Date("2026-10-07T12:00:00");
const person = (over = {}) => ({
  id: "p1", name: "엄마", relation: "어머니", frequency: { count: 1, unit: "month" }, filters: [],
  createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", ...over,
});

test("관계 판별: 프리셋·흔한 말·변형·5개 언어", () => {
  for (const r of ["어머니", "엄마❤️", "우리 아빠", " Mom ", "お母さん", "Papá", "妈妈"]) assert.equal(relationKind(r), "parent", r);
  for (const r of ["할머니", "외할아버지", "Grandparents", "祖父母"]) assert.equal(relationKind(r), "grandparent", r);
  assert.equal(relationKind("배우자·연인"), "partner");
  assert.equal(relationKind("가까운 친구"), "friend");
  assert.equal(relationKind("직장 동료"), "other");
  assert.equal(relationKind(undefined), "other");
});

test("횟수 구간은 일주일·한 달·1년을 경계로, 그 사이는 100 단위", () => {
  const cases = [[7, "week"], [8, "month"], [30, "month"], [31, "c100"], [100, "c100"], [101, "c200"], [300, "c300"],
    [301, "year"], [365, "year"], [366, "twoYears"], [730, "twoYears"], [1000, "c1000"], [1001, "more"]];
  for (const [n, band] of cases) assert.equal(countBand(n), band, String(n));
});

test("빈도 구간", () => {
  assert.equal(freqBand({ count: 1, unit: "week" }), "often");
  assert.equal(freqBand({ count: 1, unit: "month" }), "sometimes");
  assert.equal(freqBand({ count: 2, unit: "year" }), "rarely");
});

test("지나간 비율 구간 5단계", () => {
  assert.deepEqual([0, 9, 10, 39, 40, 69, 70, 89, 90, 100].map(pastBand),
    ["start", "start", "early", "early", "middle", "middle", "late", "late", "last", "last"]);
});

test("부모님: since가 없으면 스무 살 독립을 가정하고 그렇다고 알린다", () => {
  const s = pastShare({ rel: "parent", frequency: { count: 1, unit: "month" }, myAge: 35, theirAge: 63, remaining: 100, now: NOW });
  // 20년 × 365.2425 + 12 × 15 = 7484.85, 7484.85 / 7584.85 = 98.68% → 98
  assert.deepEqual(s, { pct: 98, assumed: true });
});

test("부모님: since가 있으면 그 날 독립한 것으로 본다", () => {
  const s = pastShare({ rel: "parent", frequency: { count: 1, unit: "month" }, since: "2016-10-07", myAge: 35, theirAge: 63, remaining: 100, now: NOW });
  assert.equal(s.assumed, false);
  // 25년 함께 + 10년 × 12
  assert.equal(s.pct, Math.floor(((25 * 365.2425 + 120) / (25 * 365.2425 + 120 + 100)) * 100));
});

test("부모님: 스무 살 전이고 since가 없으면(같이 사는 중) 비율이 없다", () => {
  assert.equal(pastShare({ rel: "parent", frequency: { count: 7, unit: "week" }, myAge: 17, theirAge: 45, remaining: 9000, now: NOW }), null);
});

test("연인: since가 없으면 비율이 없고, 갓 만났으면 start", () => {
  const f = { count: 2, unit: "week" };
  assert.equal(pastShare({ rel: "partner", frequency: f, myAge: 28, theirAge: 28, remaining: 5000, now: NOW }), null);
  const s = pastShare({ rel: "partner", frequency: f, since: "2026-09-07", myAge: 28, theirAge: 28, remaining: 5000, now: NOW });
  assert.equal(pastBand(s.pct), "start");
});

test("since가 미래면 비율이 없고, 비율은 0~100을 벗어나지 않는다", () => {
  const f = { count: 1, unit: "week" };
  assert.equal(pastShare({ rel: "friend", frequency: f, since: "2030-01-01", myAge: 30, theirAge: 30, remaining: 10, now: NOW }), null);
  const s = pastShare({ rel: "parent", frequency: f, since: "1900-01-01", myAge: 35, theirAge: 63, remaining: 0.5, now: NOW });
  assert.ok(s === null || (s.pct >= 0 && s.pct <= 100));
});

test("날수 표현은 '채 안 되는' 가장 작은 덩어리", () => {
  setLang("ko");
  assert.equal(spanText(5), "일주일");
  assert.equal(spanText(30), "한 달");
  assert.equal(spanText(100), "4달");
  assert.equal(spanText(365), "1년");
  assert.equal(spanText(800), "3년");
  setLang("en");
  assert.equal(spanText(100), "4 months");
  setLang("ko");
});

test("빈칸 채우기: 조사를 붙이고, 못 채우면 null", () => {
  assert.equal(fill("{name:와/과} {count}번", { name: "엄마", count: "100" }), "엄마와 100번");
  assert.equal(fill("{name:와/과}", { name: "Tom" }), "Tom과");
  assert.equal(fill("{nope}", { name: "엄마" }), null);
});

test("같은 사람은 같은 문장, today만 날마다 바뀔 수 있다", () => {
  setLang("ko");
  const a = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  const b = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  assert.deepEqual(a, b);
  const days = new Set(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11"].map(
    (today) => buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today, now: NOW }).today));
  assert.ok(days.size > 1, "today가 날마다 하나도 안 바뀜");
  const c = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-08", now: NOW });
  assert.equal(c.now, a.now);
  assert.equal(c.then, a.then);
});

test("부모님은 그때·비율·가정이 나오고, 친구는 그때·비율이 없다", () => {
  setLang("ko");
  const mom = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  assert.ok(mom.then && mom.now && mom.today && mom.past);
  assert.equal(mom.assumed, true);
  const pal = buildStory({ person: person({ name: "민수", relation: "친구" }), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  assert.equal(pal.then, undefined);
  assert.equal(pal.past, undefined);
  assert.ok(pal.now && pal.today);
});

test("남은 횟수가 1 미만이면 이야기가 없다", () => {
  assert.equal(buildStory({ person: person(), remaining: 0, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW }), null);
  assert.equal(buildStory({ person: person(), remaining: 0.4, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW }), null);
});

test("모든 언어·톤에서 now·today가 나오고 빈칸이 남지 않는다", () => {
  for (const lang of ["ko", "en", "ja", "es", "zh"]) {
    setLang(lang);
    for (const tone of ["calm", "warm", "aware"]) {
      for (const remaining of [5, 30, 100, 250, 365, 700, 1000, 5000]) {
        const s = buildStory({ person: person({ name: "Tom" }), remaining, myAge: 35, tone, today: "2026-10-07", now: NOW });
        for (const line of [s.then, s.now, s.today, s.past].filter(Boolean)) assert.ok(!/[{}]/.test(line), `${lang}/${tone}: ${line}`);
        assert.ok(s.now && s.today, `${lang}/${tone}/${remaining}`);
      }
    }
  }
  setLang("ko");
});

test("은행의 모든 문장은 아는 빈칸만 쓴다", () => {
  const vars = { name: "엄마", count: "100", span: "4달", pct: "92", n: "3" };
  for (const [tone, langs] of Object.entries(BANK))
    for (const [lang, slots] of Object.entries(langs))
      for (const [slot, keys] of Object.entries(slots))
        for (const [key, list] of Object.entries(keys))
          for (const tpl of list) assert.notEqual(fill(tpl, vars), null, `${tone}/${lang}/${slot}/${key}: ${tpl}`);
});

test("만났어요 한 마디는 남은 횟수가 줄었다고 말하지 않는다", () => {
  setLang("ko");
  const line = metLine({ person: person(), tone: "aware", thisYear: 3 });
  assert.ok(line && !/남았|남은/.test(line), line);
});

test("hash는 같은 입력에 같은 값, 음수가 아니다", () => {
  assert.equal(hash("p1now"), hash("p1now"));
  assert.ok(hash("x") >= 0);
});
```

- [ ] **Step 2: 실패 확인** — `npm test` → story.test.mjs가 모듈 없음으로 실패.

- [ ] **Step 3: `lib/storyBank.ts` 최소 문장** — 테스트가 요구하는 바닥(각 언어 aware의 now `*`, today `*`, met `*`, ko aware의 then `parent`, past `start`~`last`). Task 2에서 채운다.

```ts
import type { Lang } from "./i18n";
import type { Slot } from "./story";
import type { Tone } from "./types";

/*
 * 이야기 문장 은행. 코드는 없다 — 줄을 더하면 끝난다.
 *
 * 키(구체 → 일반, lib/story.ts가 이 순서로 찾는다):
 *   then  "parent.often" → "parent"
 *   now   "parent.c100"  → "c100" → "*"
 *   today "parent.often" → "often" → "*"
 *   past  "partner.start" → "start"
 *   met   "parent" → "*"
 * 빈칸: {name} {count} {span} {pct} {n}. 조사는 {name:와/과} {name:을/를} {name:은/는} {name:이/가}.
 * 없는 칸은 aware → 영어 순으로 물러선다. 「만났어요」 문장에 "N번 남았다"는 쓰지 않는다(남은 횟수는 시간에서 나온다).
 */
export type SlotBank = Partial<Record<Slot, Record<string, string[]>>>;

export const BANK: Record<Tone, Partial<Record<Lang, SlotBank>>> = {
  aware: {
    ko: {
      then: { parent: ["어릴 적엔 매일 아침 {name:와/과} 마주 앉는 게 당연했어요."] },
      now: { "*": ["이제 남은 건 {count}번. 매일 만난다 해도 {span:이/가} 채 안 돼요."] },
      today: { "*": ["오늘 {name}에게 먼저 연락해 보는 건 어때요?"] },
      past: {
        start: ["{name:와/과}의 이야기는 이제 막 첫 장이에요."],
        early: ["{name:와/과} 함께할 시간의 {pct}%가 지났어요. 아직 많이 남았어요."],
        middle: ["{name:와/과} 함께할 시간의 {pct}%가 지나갔어요."],
        late: ["{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요."],
        last: ["{name:와/과} 함께할 시간의 {pct}%는 이미 지나갔어요."],
      },
      met: { "*": ["이번 한 번, 잘 쓰셨어요. 올해 {n}번째예요."] },
    },
    en: {
      now: { "*": ["{count} times left. Even if you met every day, that's less than {span}."] },
      today: { "*": ["How about reaching out to {name} today?"] },
      met: { "*": ["That one counted. Your {n} this year."] },
    },
    ja: {
      now: { "*": ["残りは{count}回。毎日会っても{span}に満たないんです。"] },
      today: { "*": ["今日、{name}に連絡してみませんか。"] },
      met: { "*": ["この一回、大切に使えましたね。今年{n}回目です。"] },
    },
    es: {
      now: { "*": ["Quedan {count} veces. Aunque os vierais cada día, no llegaría a {span}."] },
      today: { "*": ["¿Y si hoy le escribes a {name}?"] },
      met: { "*": ["Esta vez contó. Ya van {n} este año."] },
    },
    zh: {
      now: { "*": ["只剩{count}次了。就算每天见面，也不到{span}。"] },
      today: { "*": ["今天给{name}打个电话吧？"] },
      met: { "*": ["这一次，用得很好。今年第{n}次了。"] },
    },
  },
  calm: {},
  warm: {},
};
```

`{span:이/가}`: `fill`은 josa 접미가 있으면 `josa(vars[key], pair)`. "일주일이", "한 달이", "4달이", "1년이" 모두 josa가 처리한다(숫자로 끝나는 건 한국어로 읽는 소리, format.ts에 이미 있음).

영어 met의 `{n}`은 서수가 아니다 — Task 2에서 영어 문장을 "That's {n} this year."처럼 기수로 쓴다(위 바닥 문장도 그렇게 고친다: `"That one counted. That's {n} this year."`).

- [ ] **Step 4: `lib/story.ts` 구현**

```ts
import { DAYS_PER_YEAR, computePast, pastLimit, toPerYear } from "./calc";
import { formatCount, josa } from "./format";
import { defineCopy, getLang, tr, type Lang } from "./i18n";
import { BANK } from "./storyBank";
import type { Frequency, Person, Tone } from "./types";

/*
 * 숫자를 짧은 이야기로 읽어 준다. AI를 부르지 않는다 — 상황을 판별해 storyBank.ts에 미리 써 둔
 * 문장 중 하나를 고른다. 같은 사람에게는 늘 같은 문장(내 얘기 같아야 한다), 「오늘」만 날마다 바뀐다.
 */

export type Rel = "parent" | "grandparent" | "partner" | "child" | "sibling" | "friend" | "other";
export type CountBand = "week" | "month" | "c100" | "c200" | "c300" | "year" | "twoYears" | "c1000" | "more";
export type FreqBand = "often" | "sometimes" | "rarely";
export type PastBand = "start" | "early" | "middle" | "late" | "last";
export type Slot = "then" | "now" | "today" | "past" | "met";

/** 조부모를 먼저 본다 — "할머니"의 "머니", "grandmother"의 "mother"가 부모님으로 잡히지 않게. */
const REL_WORDS: [Rel, string[]][] = [
  ["grandparent", ["할머니", "할아버지", "조부모", "외할", "grand", "祖父", "祖母", "おじいちゃん", "おばあちゃん", "abuel", "爷爷", "奶奶", "外公", "外婆"]],
  ["parent", ["엄마", "어머니", "아빠", "아버지", "mom", "mother", "dad", "father", "お母さん", "お父さん", "母", "父", "mamá", "papá", "madre", "padre", "妈", "爸"]],
  ["partner", ["연인", "애인", "배우자", "남편", "아내", "여자친구", "남자친구", "partner", "wife", "husband", "girlfriend", "boyfriend", "恋人", "妻", "夫", "パートナー", "pareja", "esposa", "esposo", "novia", "novio", "伴侣", "老公", "老婆", "男朋友", "女朋友"]],
  ["child", ["자녀", "아들", "딸", "아이", "child", "son", "daughter", "kid", "子ども", "息子", "娘", "hijo", "hija", "孩子", "儿子", "女儿"]],
  ["sibling", ["형제", "자매", "누나", "오빠", "언니", "동생", "sibling", "brother", "sister", "きょうだい", "兄", "姉", "弟", "妹", "herman", "兄弟", "姐妹", "哥", "姐"]],
  ["friend", ["친구", "friend", "友", "amig", "朋友"]],
];

export function relationKind(relation: string | undefined): Rel {
  const text = (relation ?? "").trim().toLowerCase();
  if (!text) return "other";
  for (const [rel, words] of REL_WORDS) if (words.some((w) => text.includes(w))) return rel;
  return "other";
}

const COUNT_BANDS: [number, CountBand][] = [
  [7, "week"], [30, "month"], [100, "c100"], [200, "c200"], [300, "c300"], [365, "year"], [730, "twoYears"], [1000, "c1000"],
];

export function countBand(count: number): CountBand {
  return COUNT_BANDS.find(([max]) => count <= max)?.[1] ?? "more";
}

export function freqBand(frequency: Frequency): FreqBand {
  const perYear = toPerYear(frequency);
  return perYear >= 52 ? "often" : perYear >= 12 ? "sometimes" : "rarely";
}

export function pastBand(pct: number): PastBand {
  return pct < 10 ? "start" : pct < 40 ? "early" : pct < 70 ? "middle" : pct < 90 ? "late" : "last";
}

/** 부모님 곁을 떠난 나이. since가 없을 때만 쓰고, 쓴다고 화면에 밝힌다. */
export const ASSUMED_MOVE_OUT_AGE = 20;

export function pastShare(i: {
  rel: Rel; frequency: Frequency; since?: string; myAge: number | null; theirAge: number | null; remaining: number; now?: Date;
}): { pct: number; assumed: boolean } | null {
  const now = i.now ?? new Date();
  let away: number | null = null;
  if (i.since) {
    const start = new Date(`${i.since}T00:00:00`);
    if (Number.isNaN(start.getTime()) || start > now) return null;
    away = (now.getTime() - start.getTime()) / 86_400_000 / DAYS_PER_YEAR;
  }
  let past: number;
  let assumed = false;
  if (i.rel === "parent") {
    if (i.myAge === null) return null;
    if (away === null) {
      if (i.myAge < ASSUMED_MOVE_OUT_AGE) return null; // 아직 같이 사는 중
      away = i.myAge - ASSUMED_MOVE_OUT_AGE;
      assumed = true;
    }
    away = Math.min(away, i.myAge);
    past = (i.myAge - away) * DAYS_PER_YEAR + toPerYear(i.frequency) * away;
  } else {
    if (!i.since) return null;
    const result = computePast(i.frequency, i.since, now, pastLimit(i.theirAge, i.myAge));
    if (!result) return null;
    past = result.count;
  }
  const total = past + Math.max(0, i.remaining);
  if (!(total > 0)) return null;
  const pct = Math.min(100, Math.max(0, Math.floor((past / total) * 100)));
  return { pct, assumed };
}

const SPAN = defineCopy({
  ko: { week: "일주일", month: "한 달", months: (n: number) => `${n}달`, year: "1년", years: (n: number) => `${n}년` },
  en: { week: "a week", month: "a month", months: (n) => `${n} months`, year: "a year", years: (n) => `${n} years` },
  ja: { week: "1週間", month: "1か月", months: (n) => `${n}か月`, year: "1年", years: (n) => `${n}年` },
  es: { week: "una semana", month: "un mes", months: (n) => `${n} meses`, year: "un año", years: (n) => `${n} años` },
  zh: { week: "一周", month: "一个月", months: (n) => `${n}个月`, year: "一年", years: (n) => `${n}年` },
});

/** 남은 횟수를 하루 1번으로 바꿨을 때 "채 안 되는" 가장 작은 덩어리. */
export function spanText(count: number): string {
  const t = tr(SPAN);
  const days = Math.ceil(count);
  if (days <= 7) return t.week;
  if (days <= 31) return t.month;
  if (days < 365) {
    const months = Math.ceil(days / 30.44);
    return months >= 12 ? t.year : t.months(months);
  }
  const years = Math.ceil(days / DAYS_PER_YEAR);
  return years === 1 ? t.year : t.years(years);
}

const JOSA_PAIRS = new Set(["와/과", "을/를", "은/는", "이/가"]);

export function fill(template: string, vars: Record<string, string>): string | null {
  let broken = false;
  const out = template.replace(/\{(\w+)(?::([^}]+))?\}/g, (_, key: string, pair?: string) => {
    const value = vars[key];
    if (value === undefined || (pair && !JOSA_PAIRS.has(pair))) {
      broken = true;
      return "";
    }
    return pair ? josa(value, pair as Parameters<typeof josa>[1]) : value;
  });
  return broken ? null : out;
}

export function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function sources(tone: Tone, lang: Lang): [Tone, Lang][] {
  const chain: [Tone, Lang][] = [[tone, lang], ["aware", lang]];
  if (lang !== "ko") chain.push([tone, "en"], ["aware", "en"]);
  return chain;
}

function pick(slot: Slot, keys: string[], tone: Tone, seed: string, vars: Record<string, string>): string | undefined {
  for (const [t, l] of sources(tone, getLang())) {
    const bank = BANK[t][l]?.[slot];
    if (!bank) continue;
    for (const key of keys) {
      const list = bank[key];
      if (!list?.length) continue;
      return fill(list[hash(seed) % list.length], vars) ?? undefined;
    }
  }
  return undefined;
}

export interface Story {
  then?: string;
  now?: string;
  today?: string;
  past?: string;
  /** 부모님 독립 나이를 가정했다. 화면에 그렇다고 밝힌다. */
  assumed: boolean;
}

export function buildStory(i: {
  person: Person; remaining: number; myAge: number | null; tone: Tone; today: string; now?: Date;
}): Story | null {
  if (!(i.remaining >= 1)) return null;
  const { person } = i;
  const rel = relationKind(person.relation);
  const freq = freqBand(person.frequency);
  const share = pastShare({
    rel, frequency: person.frequency, since: person.since, myAge: i.myAge,
    theirAge: null, remaining: i.remaining, now: i.now,
  });
  const vars: Record<string, string> = {
    name: person.name,
    count: formatCount(i.remaining),
    span: spanText(i.remaining),
    pct: share ? String(share.pct) : "",
  };
  const count = countBand(i.remaining);
  const story: Story = {
    then: rel === "parent" && share ? pick("then", [`${rel}.${freq}`, rel], i.tone, `${person.id}then`, vars) : undefined,
    now: pick("now", [`${rel}.${count}`, count, "*"], i.tone, `${person.id}now`, vars),
    today: pick("today", [`${rel}.${freq}`, freq, "*"], i.tone, `${person.id}today${i.today}`, vars),
    past: share ? pick("past", [`${rel}.${pastBand(share.pct)}`, pastBand(share.pct)], i.tone, `${person.id}past`, vars) : undefined,
    assumed: Boolean(share?.assumed),
  };
  return story.then || story.now || story.today || story.past ? story : null;
}

export function metLine(i: { person: Person; tone: Tone; thisYear: number }): string | null {
  const rel = relationKind(i.person.relation);
  return pick("met", [rel, "*"], i.tone, `${i.person.id}met${i.thisYear}`, { name: i.person.name, n: String(i.thisYear) }) ?? null;
}
```

`theirAge`는 buildStory 호출부(Task 3)에서 넘길 수 있게 인자에 `theirAge?: number | null`을 더하고 `pastShare`에 그대로 전달한다(위 코드의 `theirAge: null` 자리를 `i.theirAge ?? null`로).

`assumed`가 true여도 past·then이 둘 다 비면 화면에서 가정 문구를 띄우지 않는다(Task 3이 `story.past`가 있을 때만 띄운다).

- [ ] **Step 5: 통과 확인** — `npm test` → 전부 PASS. `npm run typecheck` → 오류 없음.

- [ ] **Step 6: 커밋**

```bash
git add lib/story.ts lib/storyBank.ts tests/story.test.mjs
git commit -m "이야기 로직: 관계·횟수·빈도·지나간 비율로 상황을 나누고 미리 쓴 문장을 고른다"
```

---

### Task 2: 문장 은행 채우기 (`lib/storyBank.ts`)

**Files:**
- Modify: `lib/storyBank.ts`
- Test: `tests/story.test.mjs` (분량 테스트 추가)

**Interfaces:**
- Consumes: Task 1의 `BANK` 타입, 키 규칙.

**채울 분량(테스트가 센다):**

| 톤·언어 | then | now | today | past | met |
|---|---|---|---|---|---|
| aware·ko | `parent.often`·`parent.sometimes`·`parent.rarely` 각 5, `parent` 10 | 9개 구간 각 10, `parent.` 9개 구간 각 5, `partner.month`~`partner.more` 각 3, `*` 5 | `often`·`sometimes`·`rarely` 각 10, `parent.*` 3빈도 각 5, `partner.*` 각 3, `*` 5 | 5단계 각 10, `parent.late`·`parent.last` 각 5, `partner.start`·`partner.early` 각 5 | `*` 10, `parent` 5, `partner` 5 |
| calm·ko, warm·ko | `parent` 3 | 9개 구간 각 3 | 3빈도 각 3 | 5단계 각 3 | `*` 3 |
| aware·en, aware·ja | `parent` 5 | 9개 구간 각 5 | 3빈도 각 5 | 5단계 각 5 | `*` 5 |
| calm·en/ja, warm·en/ja | — | `*` 3 | `*` 3 | — | — |
| aware·es, aware·zh | `parent` 3 | 9개 구간 각 3 | 3빈도 각 3 | 5단계 각 3 | `*` 3 |

**문장 지침:**
- aware(기본, 「찡하게」): 유한함을 또렷하게, 그다음 바로 행동. "밖에"·"채 안 돼요" 허용. 죄책감 주기·죽음 직접 언급 금지.
- warm: "아직 이만큼", 선물·기회. "밖에" 금지(기존 WARM 방향 유지).
- calm: 담담한 사실 + 계획.
- now 구간별 결: week·month "손에 꼽혀요", c100~c300 "몇 달", year "1년이 안 돼요", twoYears·c1000 "몇 년 같지만 매일로 치면", more "넉넉해 보여도".
- today 빈도별 결: often "오늘 저녁 한 끼·산책·같이 장보기", sometimes "이번 주말 찾아가기·사진 보내기", rarely "오늘 전화 한 통·다음 만남 날짜 잡기".
- past start(연인): 설렘 — "이제 막 첫 장", "앞으로 쌓일 날들". last(부모님): "남은 한 번 한 번이 전부".
- 한 문장 40자(영어 90자) 안쪽 — 카드에 두 줄 안에 들어가야 한다.
- 예시(aware·ko now c100): "이제 남은 건 {count}번. 매일 만난다 해도 {span:이/가} 채 안 돼요." / "{count}번이면 매일 만나도 {span}. 생각보다 짧아요." / "남은 {count}번을 달력에 이어 붙이면 {span:이/가} 안 돼요."

- [ ] **Step 1: 분량 테스트 추가** (tests/story.test.mjs 끝)

```js
const NEED = {
  "aware/ko/then/parent": 10, "aware/ko/now/week": 10, "aware/ko/now/month": 10, "aware/ko/now/c100": 10,
  "aware/ko/now/c200": 10, "aware/ko/now/c300": 10, "aware/ko/now/year": 10, "aware/ko/now/twoYears": 10,
  "aware/ko/now/c1000": 10, "aware/ko/now/more": 10, "aware/ko/today/often": 10, "aware/ko/today/sometimes": 10,
  "aware/ko/today/rarely": 10, "aware/ko/past/start": 10, "aware/ko/past/early": 10, "aware/ko/past/middle": 10,
  "aware/ko/past/late": 10, "aware/ko/past/last": 10, "aware/ko/met/*": 10, "aware/ko/past/partner.start": 5,
  "aware/en/now/c100": 5, "aware/ja/now/c100": 5, "aware/en/past/last": 5, "aware/ja/today/often": 5,
  "warm/ko/now/c100": 3, "calm/ko/now/c100": 3, "aware/es/now/c100": 3, "aware/zh/today/rarely": 3,
};

test("문장 은행 분량", () => {
  for (const [path, min] of Object.entries(NEED)) {
    const [tone, lang, slot, key] = path.split("/");
    const n = BANK[tone]?.[lang]?.[slot]?.[key]?.length ?? 0;
    assert.ok(n >= min, `${path}: ${n} < ${min}`);
  }
});

test("한 문장은 카드 두 줄에 들어갈 만큼 짧다", () => {
  const vars = { name: "엄마", count: "1,234", span: "12달", pct: "92", n: "12" };
  for (const [tone, langs] of Object.entries(BANK))
    for (const [lang, slots] of Object.entries(langs))
      for (const keys of Object.values(slots))
        for (const list of Object.values(keys))
          for (const tpl of list) {
            const line = fill(tpl, vars);
            const limit = ["en", "es"].includes(lang) ? 90 : 44;
            assert.ok(line.length <= limit, `${tone}/${lang} ${line.length}자: ${line}`);
          }
});
```

- [ ] **Step 2: 실패 확인** — `npm test` → 분량 테스트 FAIL.
- [ ] **Step 3: 위 표와 지침대로 문장을 쓴다.** 표의 칸을 하나씩 채운다. ko aware부터.
- [ ] **Step 4: 통과 확인** — `npm test` 전부 PASS.
- [ ] **Step 5: 커밋** — `git commit -m "이야기 문장 은행을 채운다(한국어 찡하게 칸마다 10개, 다른 톤·언어는 3~5개)"`

---

### Task 3: 결과 화면에 이야기 (`components/StoryLines.tsx`)

**Files:**
- Create: `components/StoryLines.tsx`
- Modify: `components/ResultPanel.tsx` (prop `story?: React.ReactNode`, BigNumber 바로 아래에 렌더; story가 있으면 BigNumber의 `sub`(sentence)는 넘기지 않는다)
- Modify: `components/PersonView.tsx` (buildStory 호출, StoryLines 전달, share.story 전달)
- Test: `e2e/story.spec.ts`

**Interfaces:**
- Consumes: `buildStory`, `Story`(Task 1). `useAppState().state.settings.tone`, `useActions().saveSettings`, `TONE_ORDER`, `copyFor(tone).label`, `todayISO()`, `resolveAge`.
- Produces: `ShareSpec.story?: string[]`를 PersonView가 채운다(Task 5가 그린다). 이 태스크에서 `lib/shareCard.ts`의 `ShareSpec`에 필드만 추가한다:
  ```ts
  /** 숫자 아래 이야기 줄(지금·오늘·비율). 있으면 caption 대신 그린다. */
  story?: string[];
  ```

- [ ] **Step 1: E2E 실패 테스트** — `e2e/story.spec.ts`

```ts
import { expect, test, type Page } from "@playwright/test";

import { STORAGE_KEY, clearState } from "./helpers";

const created = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000).toISOString();

async function seed(page: Page, relation: string, name: string, daysAgo = 0, since?: string) {
  await clearState(page);
  const value = {
    version: 1,
    profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
    people: [{ id: "p1", name, relation, ageYears: 63, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true,
      countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" }, filters: [], since,
      createdAt: created(daysAgo), updatedAt: created(daysAgo) }],
    moments: [], marriage: null,
    settings: { tone: "aware", theme: "light", showPast: true },
  };
  await page.evaluate(({ key, v }) => localStorage.setItem(key, JSON.stringify(v)), { key: STORAGE_KEY, v: value });
  await page.goto("/people/detail/?id=p1");
}

test("부모님은 그때·지금·오늘·비율과 가정 문구가 보인다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  const story = page.getByTestId("story");
  await expect(story.getByTestId("story-then")).toBeVisible();
  await expect(story.getByTestId("story-now")).toContainText("번");
  await expect(story.getByTestId("story-today")).toBeVisible();
  await expect(story.getByTestId("story-past")).toContainText("%");
  await expect(story.getByText(/스무 살/)).toBeVisible();
  await expect(story.getByRole("link", { name: "바꾸기" })).toHaveAttribute("href", /\/people\/edit\?id=p1/);
});

test("since가 있으면 가정 문구가 없다", async ({ page }) => {
  await seed(page, "어머니", "엄마", 0, "2012-03-01");
  await expect(page.getByTestId("story-past")).toBeVisible();
  await expect(page.getByText(/스무 살/)).toHaveCount(0);
});

test("친구는 그때·비율 없이 지금·오늘만", async ({ page }) => {
  await seed(page, "친구", "민수");
  await expect(page.getByTestId("story-now")).toBeVisible();
  await expect(page.getByTestId("story-then")).toHaveCount(0);
  await expect(page.getByTestId("story-past")).toHaveCount(0);
});

test("처음 만든 날엔 말투 바꾸기가 없고, 다시 오면 있다", async ({ page }) => {
  await seed(page, "어머니", "엄마", 0);
  await expect(page.getByTestId("story-tone")).toHaveCount(0);
  await seed(page, "어머니", "엄마", 3);
  const tone = page.getByTestId("story-tone");
  await expect(tone).toBeVisible();
  await tone.getByRole("button", { name: "따뜻하게" }).click();
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).settings.tone, STORAGE_KEY);
  expect(saved).toBe("warm");
});
```

- [ ] **Step 2: 실패 확인** — `npx playwright test --config e2e/playwright.config.ts e2e/story.spec.ts` → FAIL(testid 없음).

- [ ] **Step 3: `components/StoryLines.tsx`**

```tsx
"use client";

import Link from "next/link";

import { defineCopy, tr } from "@/lib/i18n";
import { useActions, useAppState } from "@/lib/store";
import type { Story } from "@/lib/story";
import { TONE_ORDER, copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: { assumed: "스무 살까지 함께 살았다고 치면", change: "바꾸기", tone: "말투" },
  en: { assumed: "Assuming you lived together until 20", change: "Change", tone: "Tone" },
  ja: { assumed: "20歳まで一緒に暮らしたとすると", change: "変える", tone: "言い方" },
  es: { assumed: "Suponiendo que vivisteis juntos hasta los 20", change: "Cambiar", tone: "Tono" },
  zh: { assumed: "假设你20岁前和对方住在一起", change: "修改", tone: "语气" },
});

/**
 * 큰 숫자 아래의 짧은 이야기. 그때 → 지금 → 오늘, 그리고 지나간 비율.
 * 말투 바꾸기는 다시 들어온 사람에게만 — 처음 결과를 보는 사람의 눈을 흩뜨리지 않는다.
 */
export default function StoryLines({ story, personId, returning }: { story: Story; personId: string; returning: boolean }) {
  const t = tr(COPY);
  const { state } = useAppState();
  const { saveSettings } = useActions();

  return (
    <div data-testid="story" className="space-y-1.5 text-[15px] leading-relaxed text-ink-800">
      {story.then && <p data-testid="story-then" className="text-ink-600">{story.then}</p>}
      {story.now && <p data-testid="story-now">{story.now}</p>}
      {story.today && <p data-testid="story-today" className="font-medium">{story.today}</p>}
      {story.past && (
        <div className="pt-2">
          <p data-testid="story-past">{story.past}</p>
          {story.assumed && (
            <p className="mt-0.5 text-[11px] text-ink-400">
              {t.assumed} ·{" "}
              <Link href={`/people/edit?id=${personId}`} prefetch={false} className="underline">
                {t.change}
              </Link>
            </p>
          )}
        </div>
      )}
      {returning && (
        <div data-testid="story-tone" className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] text-ink-400">
          <span>{t.tone}</span>
          {TONE_ORDER.map((tone) => (
            <button
              key={tone}
              type="button"
              aria-pressed={state.settings.tone === tone}
              className={state.settings.tone === tone ? "font-semibold text-ink-800" : "underline"}
              onClick={() => saveSettings({ tone })}
            >
              {copyFor(tone).label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: ResultPanel에 자리** — props에 `story?: React.ReactNode` 추가, `import type { ReactNode } from "react"`. BigNumber 줄을 다음으로:

```tsx
      <BigNumber label={label} value={formatCount(result.total)} unit={t.unit} sub={story ? undefined : sentence} />
      {story}
```

- [ ] **Step 5: PersonView 연결** — import `StoryLines`, `buildStory`, `todayISO`(lib/format). result 아래에:

```tsx
  const myAge = state.profile ? resolveAge(state.profile) : null;
  const story = useMemo(
    () =>
      buildStory({ person: draft, remaining: result.total, myAge, theirAge: resolveAge(person), tone: state.settings.tone, today: todayISO() }),
    [draft, result.total, myAge, person, state.settings.tone],
  );
  const returning = person.createdAt.slice(0, 10) !== todayISO();
```

ResultPanel에 `story={story && <StoryLines story={story} personId={person.id} returning={returning} />}`, share에 `story: story ? [story.now, story.today, story.past].filter((s): s is string => Boolean(s)) : undefined`.

`createdAt`은 UTC ISO라 `slice(0,10)`은 UTC 날짜다 — 한국 오전 9시 전에 만든 인연이 "어제"가 되지 않게 `new Date(person.createdAt)`를 기기 날짜로 바꿔 비교한다:

```ts
const createdDay = (() => { const d = new Date(person.createdAt); const p = (n: number) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
const returning = createdDay !== todayISO();
```

- [ ] **Step 6: 통과 확인** — `e2e/story.spec.ts` PASS, `npm run typecheck` 통과.
- [ ] **Step 7: 커밋** — `git commit -m "인연 결과 아래에 이야기를 띄우고, 다시 온 사람에겐 말투 바꾸기를 둔다"`

---

### Task 4: 「만났어요」 한 마디 + 기본 톤 「찡하게」

**Files:**
- Modify: `components/MeetingLog.tsx` (offerUndo 문구를 metLine으로, 없으면 기존 `t.saved`)
- Modify: `lib/store.ts:24` (`tone: "aware"`)
- Modify: `lib/tone.ts` AWARE_KO (label "찡하게", description·문장 다듬기)
- Modify: `e2e/counting.spec.ts:118` (`/또렷하게/` → `/찡하게/`), 그 밖에 기본 톤 calm을 전제한 E2E 문구
- Test: `e2e/story.spec.ts`에 한 케이스

**Interfaces:**
- Consumes: `metLine`(Task 1), `metThisYear`(lib/meetings.ts, 이미 import돼 있음), `useAppState`.

- [ ] **Step 1: 실패 테스트** (e2e/story.spec.ts 끝)

```ts
test("만났어요를 누르면 한 마디가 뜨고, 남은 횟수는 그대로다", async ({ page }) => {
  await seed(page, "어머니", "엄마");
  const before = await page.locator("p.numeral").first().textContent();
  await page.getByRole("button", { name: "만났어요" }).click();
  await expect(page.getByText(/올해 1번째|이번 한 번|잘 쓰셨/)).toBeVisible();
  expect(await page.locator("p.numeral").first().textContent()).toBe(before);
});
```

(정규식은 Task 2에서 쓴 met 문장에 맞춰, 실제로 들어간 문장 중 하나가 걸리게 고친다 — `*` 10개 모두 `{n}`을 쓰므로 `/1번째/`로 잡는 것이 가장 단단하다. met 문장은 모두 "올해 {n}번째"를 담도록 Task 2에서 쓴다.)

- [ ] **Step 2: 실패 확인.**
- [ ] **Step 3: MeetingLog** — 클릭 핸들러:

```tsx
          const next = addMeeting(meetings, todayISO());
          savePerson({ ...person, meetings: next, updatedAt: new Date().toISOString() });
          offerUndo(
            metLine({ person, tone: state.settings.tone, thisYear: metThisYear(next, todayISO()) }) ?? t.saved,
            () => savePerson(person),
          );
```

`const { state } = useAppState();`와 `import { metLine } from "@/lib/story";` 추가.

- [ ] **Step 4: 기본 톤** — `lib/store.ts` `DEFAULT_SETTINGS.tone = "aware"`. `lib/tone.ts` AWARE_KO:

```ts
  label: "찡하게",
  description: "남은 횟수가 얼마나 귀한지 또렷하게 짚어 줍니다.",
  greeting: "남은 횟수는 생각보다 적어요.",
  meetingSentence: (name, count) => `${josa(name, "와/과")} 남은 만남은 ${count}번이에요.`,
```

- [ ] **Step 5: 전체 E2E로 기본 톤 변경 여파 확인** — `npx playwright test --config e2e/playwright.config.ts`. calm 문구를 전제로 실패하는 테스트는 그 테스트가 settings를 seed하지 않은 경우다 — 기대 문구를 aware 문구로 바꾸거나(기본값을 지키는 테스트) settings에 calm을 넣는다(문구가 주제가 아닌 테스트). `/또렷하게/` → `/찡하게/`.
- [ ] **Step 6: 통과 확인** — 전체 E2E PASS.
- [ ] **Step 7: 커밋** — `git commit -m "만났어요 뒤에 한 마디를 띄우고, 기본 말투를 「찡하게」로 바꾼다"`

---

### Task 5: 공유 카드에 이야기 줄

**Files:**
- Modify: `lib/shareCard.ts` (`wrapLines` 추가, drawCard가 `spec.story` 그리기)
- Test: `tests/shareCard.test.mjs`, `e2e/share-fit.spec.ts`

**Interfaces:**
- Consumes: `ShareSpec.story`(Task 3).
- Produces: `export function wrapLines(ctx: Pick<CanvasRenderingContext2D, "measureText">, text: string, maxWidth: number, maxLines: number): string[]`

- [ ] **Step 1: 단위 실패 테스트** (tests/shareCard.test.mjs, import에 `wrapLines` 추가)

```js
test("이야기 줄은 폭에 맞춰 나누고, 넘치면 마지막 줄을 줄임표로 자른다", () => {
  const ctx = fakeCtx(10);
  assert.deepEqual(wrapLines(ctx, "짧은 문장", 100, 2), ["짧은 문장"]);
  const lines = wrapLines(ctx, "이제 남은 건 100번. 매일 만난다 해도 4달이 채 안 돼요.", 120, 2);
  assert.equal(lines.length, 2);
  for (const line of lines) assert.ok(line.length * 10 <= 120, line);
  assert.ok(lines[1].endsWith("…"));
});

test("영어는 낱말 사이에서 끊는다", () => {
  const lines = wrapLines(fakeCtx(10), "Even if you met every day", 120, 3);
  assert.deepEqual(lines, ["Even if you", "met every", "day"]);
});
```

- [ ] **Step 2: 실패 확인** — `npm test`.
- [ ] **Step 3: wrapLines**

```ts
/** 이야기 줄은 자르지 않고 나눈다. 공백이 있으면 낱말 사이에서, 없으면(한·중·일) 글자 사이에서. */
export function wrapLines(
  ctx: Pick<CanvasRenderingContext2D, "measureText">,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const ch of Array.from(text.trim())) {
    if (line === "" || ctx.measureText(line + ch).width <= maxWidth) {
      line += ch;
      continue;
    }
    const cut = line.lastIndexOf(" ");
    if (ch !== " " && cut > 0) {
      lines.push(line.slice(0, cut));
      line = line.slice(cut + 1) + ch;
    } else {
      lines.push(line.trimEnd());
      line = ch === " " ? "" : ch;
    }
  }
  if (line) lines.push(line);
  if (lines.length <= maxLines) return lines;
  const kept = lines.slice(0, maxLines);
  kept[maxLines - 1] = truncateToWidth(ctx, `${lines.slice(maxLines - 1).join(" ")}`, maxWidth);
  if (!kept[maxLines - 1].endsWith("…")) kept[maxLines - 1] = truncateToWidth(ctx, `${kept[maxLines - 1]}…`, maxWidth);
  return kept;
}
```

- [ ] **Step 4: drawCard** — y 표를 이야기 유무로 나눈다:

```ts
  const story = spec.story?.filter(Boolean) ?? [];
  const y = image
    ? story.length
      ? { title: 728, subtitle: 782, baseline: 990, caption: 1044, maxSize: 200, lines: 2 }
      : { title: 728, subtitle: 782, baseline: 1012, caption: 1074, maxSize: 220, lines: 0 }
    : { title: 460, subtitle: 530, baseline: 830, caption: 930, maxSize: Infinity, lines: 4 };
```

caption 그리는 자리를:

```ts
  if (story.length) {
    ctx.fillStyle = theme.muted;
    ctx.font = `30px ${FONT_STACK}`;
    const out: string[] = [];
    for (const s of story) {
      if (out.length >= y.lines) break;
      out.push(...wrapLines(ctx, s, inner, y.lines - out.length));
    }
    out.forEach((line, i) => ctx.fillText(line, cx, y.caption + i * 42));
  } else if (spec.caption) {
    // 기존 caption 그리기 그대로
  }
```

이야기 4줄(930~1056)과 사진 2줄(1044~1086)은 1120의 구분선 위에서 끝난다.

- [ ] **Step 5: share-fit에 이야기 케이스** — `state()`의 사람에 `relation: "어머니"`를 넣은 케이스를 cases에 추가해(ko·en·ja·zh, 1/month), 이야기가 그려진 카드에서도 `strayPixels`가 0인지 본다. 기존 `cases`의 튜플에 다섯 번째 값 `relation?: string`을 더하고 state()가 받게 한다:

```ts
function state(lang: string, name: string, count: number, unit: string, theme = "light", relation?: string) {
  // people[0]에 relation 추가
}
const storyCases: [string, string][] = [["ko", "엄마"], ["en", "Mom"], ["ja", "お母さん"], ["zh", "妈妈"], ["es", "Mamá"]];
for (const [lang, name] of storyCases) {
  test(`카드: 이야기 ${lang}`, async ({ page }) => {
    const r = await card(page, state(lang, name, 1, "month", "light", name));
    expect(r.strayPixels).toBe(0);
  });
}
```

- [ ] **Step 6: 통과 확인** — `npm test`, `e2e/share-fit.spec.ts`, `e2e/share.spec.ts` PASS.
- [ ] **Step 7: 커밋** — `git commit -m "공유 카드에 이야기 줄을 싣는다(넘치면 나누고, 그래도 넘치면 줄임표)"`

---

### Task 6: 마무리 점검과 배포

- [ ] `npm test`, `npm run typecheck`, `FUZZ=1 npx playwright test --config e2e/playwright.config.ts` 전부 통과.
- [ ] 개발 서버로 엄마·연인(since 한 달 전)·친구를 넣어 화면과 카드를 직접 본다(문장이 자연스러운지, 카드가 넘치지 않는지).
- [ ] docs/PLAN.md §10에 한계 한 줄: "부모님 독립 나이는 「언제부터」가 없으면 20세로 가정하고 화면에 밝힌다."
- [ ] 사용자에게 배포 여부를 묻고, 승인되면 `git push origin main`.
