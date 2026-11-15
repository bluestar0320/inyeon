# 앞으로 남은 만남 보정 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 남은 만남 계산에 나이 감소(기본)와 「앞으로」 칩(결혼·아이·건강)을 해마다 곱해 넣는다.

**Architecture:** 칩 상태는 `Person.ahead`에 저장한다. `lib/future.ts`가 관계·나이·칩으로 해마다 곱할 함수를 만들고, `computeRelationship`이 그것을 `countOccurrences`의 새 선택 인자 `yearFactor`로 넘긴다. 사용자 조건(`filters`)은 그대로 그 위에 곱해진다. 결과에는 어떤 원인이 걸렸는지(`causes`)만 붙여 `ResultPanel`이 이유 줄을 쓴다.

**Tech Stack:** Next.js 16 static export, TypeScript, Tailwind, node:test(`tests/*.test.mjs`, TS 직접 import), Playwright.

**Spec:** `docs/superpowers/specs/2026-11-15-future-modifiers-design.md`

## Global Constraints

- 연령대 값(분/일): `<20: 28, 20–29: 20, 30–39: 18, 40–49: 19, 50–59: 23, 60+: 29` — KOSIS DT_1TS202004 S711, 2024. 감소만 쓴다.
- 배수: marry ×0.5, child ×0.5, health = 친구·그 밖·형제자매 ×0.5, 자녀·연인·부모님·조부모님 ×2. 앱이 정한 값.
- 관계별 칩: friend/other/sibling = marry·child·health, child = marry·health, partner/parent/grandparent = health.
- 나이 감소는 rel이 friend 또는 other일 때만. 기준 나이는 내 나이, 없으면 상대 나이, 둘 다 없으면 적용 안 함.
- 칩은 i ≥ 1 조각(내년부터)에만. i = 0은 1.
- `MAX_FACTOR`(10) 상한은 지금 그대로 마지막에 걸린다.
- 문구: 사람 말투, AI 말투 금지, 부모님 높임, 끝맺음 다양, 5개 언어(ko/en/ja/es/zh).
- 칩: `chip min-h-11` + `chip-active`, `aria-pressed`(BondFields와 같은 모양).
- e2e는 3177 포트 임시 설정으로: `sed 's/3123/3177/g' e2e/playwright.config.ts > e2e/_tmp.config.ts`, 끝나면 지운다.
- 푸시하지 않는다(main 푸시 = 웹 배포).

## Review Focus

1. 나이·상대 나이가 둘 다 없거나 NaN인 사람 → 나이 감소 없이 지금처럼 센다(NaN 없음). Task 2 테스트.
2. 저장 파일에 `ahead: ["marry", "x", "marry"]`나 문자열이 들어옴 → 알려진 값만, 중복 없이. 부모님에게 저장된 marry는 무시. Task 1·2 테스트.
3. 남은 기간이 1년 미만 → 칩은 효과 없고 causes.ahead도 비어 있다. Task 2 테스트.
4. 부모님 건강 칩 ×2 + 사용자 배수 조건 ×8 → 한 해 10배 상한. Task 2 테스트.
5. 칩도 조건도 없는 35세 이상 사용자의 친구 → 숫자가 지금과 정확히 같다(기존 사용자 회귀). Task 2 테스트.

---

### Task 1: 관계 판별 분리 + 보정 규칙(lib/rel.ts, lib/futureRules.ts, lib/future.ts)

`lib/story.ts`는 `lib/calc.ts`를 import한다. `calc.ts`가 `relOf`를 쓰면 순환이 생기므로 `relOf`와 그 의존(`Rel`, `relationKind`, `REL_WORDS`, `NOT_KIN`, `NOISE`, `matches`)을 `lib/rel.ts`로 옮기고 `story.ts`는 그대로 re-export한다(기존 import 경로 유지).

**Files:**
- Create: `lib/rel.ts`, `lib/futureRules.ts`, `lib/future.ts`
- Modify: `lib/story.ts` (옮긴 것 제거 + `export { relOf, relationKind, type Rel } from "./rel.ts"`), `lib/types.ts` (`export type Ahead = "marry" | "child" | "health"`; `Person`에 `ahead?: Ahead[]` — 주석: 「앞으로」 칩, lib/future.ts)
- Test: `tests/future.test.mjs`

**Interfaces:**
- Produces:
  - `lib/futureRules.ts`: `AGE_SOCIAL_MINUTES: readonly { from: number; minutes: number }[]` (출처 주석), `AHEAD_FACTOR` (관계별 배수 표, 출처 "앱이 정한 값" 주석)
  - `lib/future.ts`:
    - `cleanAhead(value: unknown): Ahead[] | undefined`
    - `aheadFor(rel: Rel): Ahead[]` — 그 관계에 보이고 적용되는 칩, 순서 marry, child, health
    - `ageApplies(rel: Rel): boolean` — friend, other만 true
    - `ageFactorAt(baseAge: number, t: number): number` — t년 뒤(나이 baseAge + t)의 감소 비율, ≤ 1
    - `yearFactor(rel: Rel, ahead: Ahead[] | undefined, baseAge: number | null): (i: number, span: number) => number`

- [ ] **Step 1: 실패하는 테스트 작성** `tests/future.test.mjs`

```js
import { aheadFor, ageFactorAt, cleanAhead, yearFactor } from "../lib/future.ts";
import { relOf } from "../lib/story.ts";

test("cleanAhead: 모르는 값·중복 버림, 비면 undefined", () => {
  assert.deepEqual(cleanAhead(["marry", "x", "marry", 3, "health"]), ["marry", "health"]);
  assert.equal(cleanAhead([]), undefined);
  assert.equal(cleanAhead("marry"), undefined);
});
test("관계별 칩", () => {
  assert.deepEqual(aheadFor("friend"), ["marry", "child", "health"]);
  assert.deepEqual(aheadFor("sibling"), ["marry", "child", "health"]);
  assert.deepEqual(aheadFor("child"), ["marry", "health"]);
  assert.deepEqual(aheadFor("partner"), ["health"]);
  assert.deepEqual(aheadFor("parent"), ["health"]);
  assert.deepEqual(aheadFor("grandparent"), ["health"]);
});
test("나이 감소: 감소만, 10년 계단", () => {
  assert.equal(ageFactorAt(25, 4.5), 1);          // 29.5세
  near(ageFactorAt(25, 5.5), 0.9);                // 30대 18/20
  near(ageFactorAt(25, 25.5), 0.9);               // 50대 23이어도 늘지 않음
  near(ageFactorAt(15, 6), 20 / 28);
  near(ageFactorAt(15, 16), 18 / 28);
  assert.equal(ageFactorAt(35, 30), 1);
  assert.equal(ageFactorAt(45, 10), 1);
});
test("yearFactor: 칩은 내년부터, 관계별 배수", () => {
  const f = yearFactor("friend", ["marry", "child"], 40);
  assert.equal(f(0, 1), 1);
  near(f(1, 1), 0.25);
  near(yearFactor("parent", ["health", "marry"], 40)(1, 1), 2);   // marry 무시
  near(yearFactor("partner", ["health"], 40)(2, 1), 2);
  near(yearFactor("sibling", ["health"], 40)(2, 1), 0.5);
  near(yearFactor("parent", undefined, 25)(10, 1), 1);            // 부모님은 나이 감소 없음
  near(yearFactor("friend", undefined, 25)(10, 1), 0.9);
  assert.equal(yearFactor("friend", undefined, null)(10, 1), 1);
  assert.equal(yearFactor("friend", undefined, NaN)(10, 1), 1);
});
test("relOf는 story.ts에서 그대로 쓸 수 있다", () => {
  assert.equal(relOf({ bonds: ["parent"] }), "parent");
});
```
(`near`는 허용오차 1e-9 비교 도우미, 파일 안에 정의.)

- [ ] **Step 2: 실행해 실패 확인** — `node --test tests/future.test.mjs` → 모듈 없음으로 FAIL
- [ ] **Step 3: 구현** — `ageFactorAt`: 지금 연령대 값 = `minutes(baseAge)`; 결과 = `min(minutes(a) for 구간 a in [baseAge, baseAge + t]) / minutes(baseAge)`. `yearFactor`의 나이 t는 `i + span / 2`. 유한하지 않은 baseAge는 null로 본다.
- [ ] **Step 4: 통과 확인** — `node --test tests/future.test.mjs` PASS, `npm test` 전부 PASS, `npm run typecheck` 통과
- [ ] **Step 5: 커밋** — `git commit -m "앞으로 보정 규칙: 나이 감소(감소만)와 관계별 칩 배수, relOf를 lib/rel.ts로"`

---

### Task 2: 계산에 붙이기(calc.ts, store.ts)

**Files:**
- Modify: `lib/calc.ts` (`CountInput`, `countOccurrences`, `RelationshipResult`, `computeRelationship`), `lib/store.ts` (`repairPerson`)
- Test: `tests/calc.test.mjs`, `tests/fuzz.test.mjs`

**Interfaces:**
- Consumes: Task 1의 `yearFactor`, `aheadFor`, `ageApplies`, `ageFactorAt`, `cleanAhead`, `relOf`(lib/rel.ts에서 import)
- Produces:
  - `CountInput.yearFactor?: (i: number, span: number) => number` — 유한하지 않거나 음수면 1. 필터 factor에 곱하고 `MAX_FACTOR` 상한 전.
  - `RelationshipResult.causes: { age: boolean; ahead: Ahead[]; filters: boolean }`
    - age: 나이 감소가 남은 기간 안에서 1 미만이 되는가(`ageApplies(rel) && baseAge != null && ageFactorAt(baseAge, sharedYears) < 1`)
    - ahead: `cleanAhead(person.ahead)` ∩ `aheadFor(rel)`, 단 `sharedYears > 1`일 때만, 아니면 `[]`
    - filters: 켜진 필터가 하나라도 있는가
  - `repairPerson`이 `ahead: cleanAhead(item.ahead)`를 넣는다.

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/calc.test.mjs`에 추가, 기존 profile/person 만드는 도우미 재사용)
  - `countOccurrences({ years: 3, perYear: 12, yearFactor: (i) => i === 0 ? 1 : 0.5 }).total === 24`
  - yearFactor가 NaN·-1을 내면 1로 본다(total 36)
  - 35세 사용자, 칩·조건 없는 친구(매달 1번): `total`이 같은 입력에서 `yearFactor` 없이 센 값과 같고 `causes` = `{ age: false, ahead: [], filters: false }` (Review Focus 5)
  - 25세 사용자 친구: total < baselineTotal, `causes.age === true`
  - 나이 둘 다 없음 → total 유한, causes.age false (Review Focus 1)
  - 부모님(`bonds: ["parent"]`)에 `ahead: ["marry"]` → 칩 없는 부모님과 total 같음, causes.ahead `[]` (Review Focus 2)
  - 남은 기간 0.8년 친구 + marry → 칩 없을 때와 total 같음, causes.ahead `[]` (Review Focus 3)
  - 부모님 health + 사용자 multiplier factor 8 → 2년차 조각 adjusted ≤ baseline × 10 (Review Focus 4)
- [ ] **Step 2: 실패 확인** — `node --test tests/calc.test.mjs`
- [ ] **Step 3: 구현** — `computeRelationship`에서 `rel = relOf(person)`, `baseAge = resolveAge(profile) ?? resolveAge(person)`(profile 없으면 상대 나이), `yearFactor(rel, person.ahead, baseAge)`를 넘긴다. `repairPerson`에 `ahead` 추가.
- [ ] **Step 4: fuzz 추가** — `tests/fuzz.test.mjs`의 사람 생성기에 `ahead`(무작위 부분집합 + 쓰레기 값)를 넣고 기존 불변식(total 유한, ≥ 0)이 유지되는지. `FUZZ=1` 없이 기본 횟수로 PASS.
- [ ] **Step 5: 통과 확인** — `npm test`, `npm run typecheck`
- [ ] **Step 6: 커밋** — `git commit -m "남은 만남에 나이 감소와 앞으로 칩을 해마다 곱한다(causes 반환)"`

---

### Task 3: 화면(칩 줄, 이유 줄)

**Files:**
- Create: `components/AheadChips.tsx`
- Modify: `components/PersonEditor.tsx` (BondChips 아래, 줄 362 부근), `components/ResultPanel.tsx` (filtered 줄, COPY 5개 언어), `components/PersonEditor.tsx`·`components/PersonView.tsx` (ResultPanel에 `causes` 전달)
- Test: `e2e/future.spec.ts`, `e2e/fit.spec.ts`(케이스 추가)

**Interfaces:**
- Consumes: Task 1 `aheadFor`, Task 2 `RelationshipResult.causes`
- Produces:
  - `AheadChips({ rel, ahead, onChange }: { rel: Rel; ahead: Ahead[] | undefined; onChange: (next: Ahead[] | undefined) => void })` — `aheadFor(rel)`가 비면 null. 제목 ko 「앞으로」, 칩 ko 「결혼할 것 같아요」「아이가 생길 것 같아요」「건강이 나빠지고 있어요」. `data-testid="ahead-chips"`.
  - `ResultPanel` 새 선택 prop `causes?: RelationshipResult["causes"]`.

- [ ] **Step 1: 실패하는 e2e 작성** `e2e/future.spec.ts` (helpers.ts의 프로필/사람 만들기 재사용)
  - 40세 프로필, 친구 매달 1번 저장 → 숫자 N 기록 → 편집에서 「결혼할 것 같아요」 누름(`aria-pressed="true"`) → 숫자 < N, 이유 줄에 「결혼」이 보이고 「앱이 정한 어림」 취지 문구가 보인다
  - 부모님 칩 사람 → ahead-chips 안에 건강 칩 하나만, 누르면 숫자가 늘고 이유 줄이 보인다(「늘었」)
  - 25세 프로필 친구, 칩 없음 → 이유 줄에 「나이」
  - 35세 프로필 친구, 칩·조건 없음 → 이유 줄 없음
  - `fit.spec.ts`: 344px·글자 크게에서 ahead-chips 가로 넘침 없음
- [ ] **Step 2: 실패 확인** — 임시 설정으로 `npx playwright test --config e2e/_tmp.config.ts e2e/future.spec.ts`
- [ ] **Step 3: 구현**
  - PersonEditor: `<AheadChips rel={relOf(draft)} ahead={draft.ahead} onChange={(ahead) => setDraft({ ...draft, ahead })} />`
  - ResultPanel: `causes`가 있으면 `|total − baselineTotal| > 0.5`일 때(늘어도) 이유 줄을 보인다. `causes` 없으면(순간·결혼 화면) 지금 동작 그대로. 원인 이름만 나열(ko: 나이 / 결혼 / 아이 / 건강 / 직접 건 조건), 줄었으면 「줄었어요」, 늘었으면 「늘었어요」 쪽. causes.ahead가 있으면 "통계가 아니라 앱이 정한 어림"을, causes.age면 "통계청 생활시간조사에서 30대부터 사람을 덜 만난다"는 취지를 짧게 붙인다. `capped` 문구는 유지. 문구는 Global Constraints 말투.
- [ ] **Step 4: 통과 확인** — future.spec, fit.spec PASS; `npm run typecheck`
- [ ] **Step 5: 커밋** — `git commit -m "「앞으로」 칩 줄과 이유 줄(나이·칩·조건)"`

---

### Task 4: 전체 검증과 기존 e2e 정리

나이 감소가 기본으로 걸리면서 20대 이하 프로필로 친구 숫자를 정확히 비교하던 기존 e2e가 깨질 수 있다. 기대값을 새 계산에 맞추거나 프로필 나이를 35세 이상으로 바꿔 고친다. 기능을 끄는 식으로 고치지 않는다.

**Files:** 깨지는 `e2e/*.spec.ts`, 필요 시 `tests/*.test.mjs`; 메모리 `project-inyeon-status.md`

- [ ] **Step 1:** `npm test` + `FUZZ=1 npm test`(fuzz 20000회) PASS
- [ ] **Step 2:** 임시 설정으로 전체 e2e — 실패 목록을 원인별로 고친다, 다시 전체 PASS
- [ ] **Step 3:** `npm audit` 0, `npm run typecheck`, `npm run build` 성공
- [ ] **Step 4:** `e2e/_tmp.config.ts` 삭제, 커밋 `git commit -m "e2e: 나이 감소 기본 적용에 맞춤"`
