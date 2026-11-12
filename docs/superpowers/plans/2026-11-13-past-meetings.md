# 지나온 만남 어림 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 관계 종류 칩 하나만 골라도 「지금까지 적어도 N번」을 한국 평균으로 보수적으로 어림하고, 근거를 줄마다 보여 준다.

**Architecture:**
- 숫자와 출처는 `lib/pastRules.ts` 한 곳에 둔다.
- 계산과 저장값 다듬기는 `lib/bonds.ts`가 맡는다. React가 없는 순수 함수라서 `node --test`로 바로 돌린다.
- `PersonView`의 기존 어림 자리에 끼운다. 칩이 있으면 `estimatePast`를 쓰고, 없으면 지금처럼 `computePast`를 쓴다. 이야기 비율(`pastShare`)의 부모님 계산도 같은 규칙으로 합친다.

**Tech Stack:** Next.js 16 (static export), TypeScript, Capacitor 8, `node --test`(tests/*.test.mjs), Playwright(e2e).

**Spec:** `docs/superpowers/specs/2026-11-12-past-meetings-design.md` (화면 그림 https://claude.ai/artifact/GNAv7FP1PTELXKnD8jGV3J)

## Global Constraints

- 모르는 값은 언제나 **적은 쪽**으로 채운다. 예외는 군 복무 하나다. 비워 두면 미필로 치고 빼지 않는다.
- 첫 화면을 막지 않는다. 칩 말고 **필수 입력 칸을 늘리지 않는다**. 세부 값은 모두 「더 자세히」(`MoreDetails`) 안에 둔다.
- 화면 문구는 늘 「적어도」다. 근거 줄을 함께 보여 준다.
- 「더 자세히」 학교 칸의 문구는 「같이 안 다님」이다. 「안 다님」으로 쓰지 않는다.
- 어림은 **인연을 추가한 날(createdAt)까지만** 한다. 그 뒤는 「만났어요」 기록(`ledger`)이 센다.
- 5개 언어(ko/en/ja/es/zh) 문구를 넣는다. 한국어는 사람 말투로 쓰고, 부모님께는 높인다.
- 저장값은 모두 `repair` 계열을 거친다. 모르는 문자열과 범위 밖 숫자는 버린다.
- AI 호출을 하지 않는다. 외부 전송을 하지 않는다.
- push와 배포는 운영자가 따로 허락할 때만 한다. 커밋은 로컬에만 한다.
- e2e는 포트 3177로 돌린다(3123은 다른 앱이 쓴다).
  - `sed 's/3123/3177/g' e2e/playwright.config.ts > e2e/_tmp.config.ts` → `npx playwright test --config e2e/_tmp.config.ts …` → 임시 설정 삭제.

## Review Focus

1. **프로필 나이가 없을 때.** 칩을 골라도 학교 해를 맞출 수 없다. `estimatePast`는 `null`을 돌려주고, 화면은 기존 `computePast`로 돌아가며 근거 줄에 「내 나이를 넣으면 학교 시절까지 셉니다」를 보인다. (Task 3, 4)
2. **아직 끝나지 않은 구간과 미래 날짜.** 내가 지금 중학생인 경우, 입대한 해가 미래인 경우, createdAt이 미래인 경우가 있다. 이때 구간은 기준일에서 자르고, 숫자가 음수나 NaN이 되지 않는다. (Task 3)
3. **같은 시기를 두 번 세는 것.** 형제자매이면서 같은 초등학교, 고교 친구이면서 직장 동료인 경우다. 그 달에 해당하는 비율 중 큰 쪽 하나만 센다. 학원만 따로 더한다. (Task 3)
4. **백업 파일에서 들어온 망가진 값.** 모르는 칩 이름, 1800년 입대, 학원 999년, 음수 나이가 들어올 수 있다. 다듬기에서 버리거나 범위에 묶는다. fuzz로 던져도 예외가 나지 않는다. (Task 2)
5. **기존 기록의 숫자가 바뀌는 것.** 칩이 없는 옛 인연은 `computePast` 숫자가 그대로다. 부모님의 이야기 비율만 새 규칙(329번, 고교 졸업 해)으로 바뀐다. 출시 전이라 허용한다. (Task 4)

---

## File Structure

- Create `lib/pastRules.ts`
  - 표와 상수, 출처 주석을 둔다.
  - `schoolDaysFor`, `armyServiceDays`, 학교 해 계산을 둔다.
- Create `lib/bonds.ts`
  - `cleanBonds`, `cleanBondDetail`, `estimatePast`를 둔다.
  - `livedTogetherCount`도 여기 둔다. `pastShare`가 쓴다.
- Modify `lib/types.ts`: `Bond`, `BondDetail`, `Person.bonds`, `Person.bondDetail`.
- Modify `lib/store.ts:188-217` (`repairPerson`): 두 필드를 다듬어 넣는다.
- Modify `lib/story.ts:84-127`
  - `ASSUMED_MOVE_OUT_AGE`와 부모님 분기를 `livedTogetherCount`로 바꾼다.
  - 「스무 살」 가정 문구는 `components/StoryLines.tsx:15-19`에 있다.
- Modify `components/PersonView.tsx:236-265`
  - 칩이 있으면 `estimatePast`를 쓴다.
  - `together.lines`를 넘긴다.
- Modify `components/ResultPanel.tsx`: `together.lines`가 있으면 근거 줄 목록을 그린다.
- Modify `components/PersonEditor.tsx`
  - 칩 묶음을 넣는다.
  - 「더 자세히」 안에 세부 칸을 넣는다.
  - 저장 단추 위에 미리보기 한 줄을 띄운다.
- Tests:
  - `tests/pastRules.test.mjs`
  - `tests/bonds.test.mjs`
  - `tests/story.test.mjs`(수정)
  - `tests/fuzz.test.mjs`(추가)
  - `e2e/past.spec.ts`(새로)

---

### Task 1: 숫자 표와 출처 (`lib/pastRules.ts`)

**Files:**
- Create: `lib/pastRules.ts`
- Test: `tests/pastRules.test.mjs`

**Interfaces:**
- Produces:
  - `ATTENDANCE = 150 / 190`
  - `LIVE_TOGETHER = 0.9`
  - `DAYS_TOGETHER_PER_YEAR = 365 * 0.9`
  - `UNIVERSITY_DAYS_PER_WEEK = [4, 3, 2, 2]`
  - `UNIVERSITY_WEEKS = 30`
  - `WORK_DAYS_PER_YEAR = 230`
  - `GRANDPARENT_APART_PER_YEAR = 2`
  - `ACADEMY_DEFAULT = { years: 1, perWeek: 2 }`
  - `schoolDaysFor(year: number): number`: 법정 일수(220/205/190).
  - `schoolMeetingsFor(year: number): number`: 법정 일수 × ATTENDANCE.
  - `entryYear(birthYear: number): number`: `birthYear + 7`. 3월 학년도에 만 6세가 된 해의 다음 해라서 1993년생은 2000년에 입학한다.
  - `stageYears: { elementary: [0, 6], middle: [6, 9], high: [9, 12] }`: 입학한 해부터 몇 해째인지.
  - `highSchoolEndYear(birthYear) = birthYear + 19`: 그해 2월에 졸업한다.
  - `armyServiceDays(enlistYear: number): number`

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/pastRules.test.mjs`)

```js
test("법정 수업일수: 2005까지 220, 2006~2011 205, 2012부터 190", () => {
  assert.equal(schoolDaysFor(1999), 220); assert.equal(schoolDaysFor(2005), 220);
  assert.equal(schoolDaysFor(2006), 205); assert.equal(schoolDaysFor(2011), 205);
  assert.equal(schoolDaysFor(2012), 190); assert.equal(schoolDaysFor(2030), 190);
});
test("결석·다른 반을 뺀 1년: 174 / 162 / 150", () => {
  assert.equal(Math.round(schoolMeetingsFor(2003)), 174);
  assert.equal(Math.round(schoolMeetingsFor(2008)), 162);
  assert.equal(Math.round(schoolMeetingsFor(2015)), 150);
});
test("1993년생은 2000년 입학, 2012년 고교 졸업", () => {
  assert.equal(entryYear(1993), 2000); assert.equal(highSchoolEndYear(1993), 2012);
});
test("육군 복무: 식을 모르는 해는 단축 전의 긴 기간", () => {
  const months = (y) => Math.round(armyServiceDays(y) / 30.44);
  assert.equal(months(1990), 30);  // 1993 이전
  assert.equal(months(1995), 26);  // 1993.1~
  assert.equal(months(2003), 26);  // 2003 단축 식 미확인 → 단축 전
  assert.equal(months(2005), 24);
  assert.equal(months(2009), 24);  // 2008~2010 단축 식 미확인 → 단축 전
  assert.equal(months(2013), 21);
  assert.equal(months(2021), 18);
});
test("2017~2020 입대자는 2주에 하루씩 줄어든 실제 기간(그해 1월 1일 입대로 쳐서 가장 길게)", () => {
  const d21 = armyServiceDays(2016);
  assert.equal(armyServiceDays(2017), d21 - 1);
  assert.ok(armyServiceDays(2019) < armyServiceDays(2018));
  assert.equal(Math.round(armyServiceDays(2020) / 30.44), 18 + 0); // 하한 18개월에 닿는다
});
```

- [ ] **Step 2: 실패 확인.** Run `node --test tests/pastRules.test.mjs`. 기대 결과: FAIL, 모듈이 없다.
- [ ] **Step 3: `lib/pastRules.ts` 구현**
  - 각 값 위에 설계 문서 「숫자와 출처」 표의 링크와 확인/미확인/앱이 정한 값 상태를 주석으로 단다.
  - `armyServiceDays`의 규칙:
    - `< 1993`: 30개월
    - `1993–2003`: 26개월
    - `2004–2010`: 24개월
    - `2011–2016`: 21개월
    - `2017–2020`: 21개월에서 `floor((Jan 1 − 2017-01-03) / 14일) + 1`일을 뺀다. 2017년 이전 날짜면 1일이다. 18개월보다 짧아지지 않는다.
    - `≥ 2021`: 18개월
  - 달을 일수로 바꿀 때는 30.44를 쓴다.
- [ ] **Step 4: 통과 확인.** Run `node --test tests/pastRules.test.mjs`. 기대 결과: PASS.
- [ ] **Step 5: 커밋.** `git add lib/pastRules.ts tests/pastRules.test.mjs && git commit -m "지나온 만남: 수업일수·복무 기간 표와 출처"`

---

### Task 2: 저장 형식과 다듬기

**Files:**
- Modify: `lib/types.ts`(Person 근처)
- Modify: `lib/store.ts:188-217`
- Create: `lib/bonds.ts`(다듬기 부분)
- Test: `tests/bonds.test.mjs`, `tests/fuzz.test.mjs`

**Interfaces:**
- Produces (`lib/types.ts`):

```ts
export type Bond = "elementary" | "middle" | "high" | "university" | "academy" | "coworker" | "parent" | "grandparent" | "sibling";
export type SchoolStage = "elementary" | "middle" | "high";
export interface BondDetail {
  /** 같이 다닌 햇수. 없으면 그 학교 전부(6/3/3), 0이면 「같이 안 다님」. 앞에서부터 센다. */
  schoolYears?: Partial<Record<SchoolStage, number>>;
  /** 없으면 ACADEMY_DEFAULT. */
  academy?: { years: number; perWeek: number };
  /** 없으면 미필(빼지 않음). */
  military?: { me?: number; them?: number }; // 입대한 해
  /** 같이 산 마지막 나이(내 나이). 부모님·형제자매·조부모님. */
  livedUntilAge?: number;
  livesTogether?: boolean;
  /** 직장 동료를 그만둔 해. 없으면 지금도 같이 일한다. */
  workEndYear?: number;
  /** 빠른 년생 등: 학교 해를 몇 해 당길지(-1, 0, 1). */
  schoolShift?: -1 | 0 | 1;
}
// Person 에 추가
bonds?: Bond[];
bondDetail?: BondDetail;
```

- Produces (`lib/bonds.ts`): `cleanBonds(value: unknown): Bond[] | undefined`, `cleanBondDetail(value: unknown): BondDetail | undefined`

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/bonds.test.mjs`)

```js
test("모르는 칩과 중복은 버리고, 비면 undefined", () => {
  assert.deepEqual(cleanBonds(["high", "x", "high", 3]), ["high"]);
  assert.equal(cleanBonds([]), undefined);
  assert.equal(cleanBonds("high"), undefined);
});
test("세부 값은 범위에 묶고 망가진 건 버린다", () => {
  const d = cleanBondDetail({ schoolYears: { elementary: 9, middle: -1, high: 2 }, academy: { years: 999, perWeek: 2 }, military: { me: 1800, them: 2014 }, livedUntilAge: -3, schoolShift: 5 });
  assert.deepEqual(d.schoolYears, { elementary: 6, high: 2 }); // 6을 넘으면 6, 음수는 버림
  assert.equal(d.academy.years, 20);                           // 학원은 20년까지
  assert.deepEqual(d.military, { them: 2014 });                // 1950년 이전·미래 해는 버림
  assert.equal(d.livedUntilAge, undefined);
  assert.equal(d.schoolShift, undefined);
  assert.equal(cleanBondDetail(null), undefined);
});
```

  `tests/fuzz.test.mjs`에도 하나 넣는다. `cleanBonds`와 `cleanBondDetail`에 기존 무작위 값 생성기로 만든 값을 던져, 예외가 나지 않는지 확인한다.
- [ ] **Step 2: 실패 확인.** Run `node --test tests/bonds.test.mjs`. 기대 결과: FAIL.
- [ ] **Step 3: 구현**
  - `cleanBonds`와 `cleanBondDetail`의 범위:
    - 해(year): 1950부터 올해까지
    - `perWeek`: 1~7
    - `livedUntilAge`: 0~120
  - `repairPerson`에 `bonds: cleanBonds(item.bonds)`, `bondDetail: cleanBondDetail(item.bondDetail)`을 넣는다. `cleanMeetings`와 같은 방식이다.
- [ ] **Step 4: 통과 확인.** Run `npm test` and `npx tsc --noEmit`. 기대 결과: 모두 PASS, 타입 오류 0.
- [ ] **Step 5: 커밋**

---

### Task 3: 어림 계산 (`estimatePast`)

**Files:**
- Modify: `lib/bonds.ts`
- Test: `tests/bonds.test.mjs`

**Interfaces:**
- Consumes: Task 1의 모든 값, Task 2의 타입, `toPerYear`(lib/calc.ts)
- Produces:

```ts
export type PastLineKind = "elementary" | "middle" | "high" | "university" | "academy" | "coworker" | "together" | "apart" | "after" | "military";
export interface PastLine { kind: PastLineKind; from: number; to: number; count: number } // from/to = 해(year), military는 count가 음수(뺀 양)
export interface PastEstimate { count: number; lines: PastLine[] }
export function estimatePast(i: {
  bonds: Bond[]; detail?: BondDetail; frequency: Frequency; since?: string;
  myBirthYear: number | null; theirBirthYear: number | null; until: Date;
}): PastEstimate | null;
/** 같이 산 동안 329번/년 + 떠난 뒤 지금 빈도. pastShare가 쓴다. */
export function livedTogetherCount(i: { myBirthYear: number; leftYear: number; frequency: Frequency; until: Date }): number;
```

**알고리즘**(시그니처와 테스트만으로는 정해지지 않는 부분):
1. 구간을 만든다. 각 구간은 `{시작 달, 끝 달, 1년 횟수, kind}`다.
   - 학교: 해마다 `schoolMeetingsFor(그해)`를 쓴다.
   - 대학: 고교 졸업 해부터 4개 학년이다. 학년마다 `UNIVERSITY_DAYS_PER_WEEK[k] × 30`이다.
   - 같이 산 사람: `DAYS_TOGETHER_PER_YEAR`를 쓴다.
     - 부모님·형제자매의 끝: `since`가 있으면 그날, 없으면 `livedUntilAge`, 그것도 없으면 고교 졸업 해다. `livesTogether`면 `until`까지다.
     - 형제자매의 시작은 둘 중 늦게 태어난 해, 끝은 둘 중 먼저 고교를 졸업한 해다.
     - 조부모님은 `livedUntilAge`가 있을 때만 같이 산 구간을 만든다. 없으면 태어난 해부터 `until`까지 `GRANDPARENT_APART_PER_YEAR`다.
   - 직장: `since`부터 `workEndYear`까지, 없으면 `until`까지다. 1년 횟수는 `min(toPerYear(frequency), WORK_DAYS_PER_YEAR × ATTENDANCE)`다.
2. 군 복무 구간(나와 상대의 합집합)을 만든다.
   - 대학 학년이 복무와 6달 이상 겹치면 그 학년을 한 해 뒤로 민다.
3. 첫 구간의 시작부터 `until`까지 달마다 센다.
   - 군 복무 중인 달은 0이다.
   - 아니면 그 달을 덮는 구간 중 가장 큰 비율 ÷ 12를 센다.
   - 덮는 구간이 없으면(구간 사이의 빈 곳이나 그 뒤) `toPerYear(frequency) ÷ 12`를 센다.
   - 학교 구간은 그해 3월~이듬해 2월로 본다. 같이 산 구간도 태어난 해 3월부터 끝난 해 2월까지로 본다(19년 = 정확히 19학년도).
4. 학원은 `years × perWeek × 52`를 따로 더한다.
5. 근거 줄은 kind별로 묶어 `{from, to, count}`로 낸다. 빈 곳과 그 뒤는 `after`, 뺀 양은 `military`다.
6. 학교·대학·형제자매 칩이 있는데 `myBirthYear`가 null이면 `null`을 돌려준다. 칩이 학원뿐이고 다른 정보가 없을 때도 `null`이다.

- [ ] **Step 1: 실패하는 테스트 작성** (설계 문서의 예시가 그대로 나와야 한다)

```js
const UNTIL = new Date("2026-11-12T12:00:00");
const monthly = { count: 1, unit: "month" };
const near = (a, b, tol = 3) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test("1993년생 초등 친구, 매달 1번: 1,044 + 248 ≈ 1,292", () => {
  const r = estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "elementary").count, 1044);
  near(r.lines.find((l) => l.kind === "after").count, 248);
  near(r.count, 1292);
});
test("어머니: 같이 산 19년 × 329 = 6,251, 그 뒤 매달 1번", () => {
  const r = estimatePast({ bonds: ["parent"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.lines.find((l) => l.kind === "together").count, 19 * 365 * 0.9, 2); // 약 6,242(화면 예시 6,251은 329로 반올림한 값)
  near(r.count, 19 * 365 * 0.9 + 176, 4);
});
test("형제자매 + 같은 초등학교: 겹친 해는 큰 쪽(329)만", () => {
  const both = estimatePast({ bonds: ["sibling", "elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: 1993, until: UNTIL });
  const sib = estimatePast({ bonds: ["sibling"], frequency: monthly, myBirthYear: 1993, theirBirthYear: 1993, until: UNTIL });
  near(both.count, sib.count, 1);
});
test("학원은 위에 더한다(비우면 1년 주 2번 = 104)", () => {
  const a = estimatePast({ bonds: ["elementary", "academy"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  const b = estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  assert.equal(Math.round(a.count - b.count), 104);
});
test("군 복무는 비우면 빼지 않고, 둘 다 가서 겹치면 한 번만 뺀다", () => {
  const base = { bonds: ["elementary"], frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL };
  const none = estimatePast(base).count;
  const me = estimatePast({ ...base, detail: { military: { me: 2013 } } }).count;
  const both = estimatePast({ ...base, detail: { military: { me: 2013, them: 2013 } } }).count;
  near(none - me, 21, 1);   // 21개월 × 매달 1번
  near(me, both, 0.5);
});
test("프로필 나이가 없으면 null(기존 방식으로 돌아간다)", () => {
  assert.equal(estimatePast({ bonds: ["high"], frequency: monthly, myBirthYear: null, theirBirthYear: null, until: UNTIL }), null);
});
test("아직 끝나지 않은 구간·미래 입대·미래 기준일도 유한하고 음수가 아니다", () => {
  for (const r of [
    estimatePast({ bonds: ["middle"], frequency: monthly, myBirthYear: 2013, theirBirthYear: null, until: UNTIL }),
    estimatePast({ bonds: ["high"], detail: { military: { me: 2030 } }, frequency: monthly, myBirthYear: 1993, theirBirthYear: null, until: UNTIL }),
    estimatePast({ bonds: ["elementary"], frequency: monthly, myBirthYear: 2024, theirBirthYear: null, until: UNTIL }),
  ]) assert.ok(r === null || (Number.isFinite(r.count) && r.count >= 0));
});
test("지금도 같이 일하는 동료: 1년에 min(지금 빈도, 약 182)", () => {
  const r = estimatePast({ bonds: ["coworker"], since: "2024-11-12", frequency: { count: 5, unit: "week" }, myBirthYear: 1993, theirBirthYear: null, until: UNTIL });
  near(r.count, 2 * 230 * (150 / 190), 4);
});
```

- [ ] **Step 2: 실패 확인.** Run `node --test tests/bonds.test.mjs`. 기대 결과: 새 테스트 FAIL.
- [ ] **Step 3: 위 알고리즘대로 `estimatePast`와 `livedTogetherCount` 구현**
- [ ] **Step 4: 통과 확인.** Run `npm test`. 기대 결과: 모두 PASS. `tests/fuzz.test.mjs`에 `estimatePast` 무작위 호출도 하나 넣는다. 확인할 것은 예외가 없고, 결과가 null이거나 유한하며 0 이상인 것이다.
- [ ] **Step 5: 커밋**

---

### Task 4: 상세 화면과 이야기 비율에 끼우기

**Files:**
- Modify: `components/PersonView.tsx:236-265`
- Modify: `components/ResultPanel.tsx:20-100,128-140,220-230`
- Modify: `lib/story.ts:84-127`
- Modify: `components/StoryLines.tsx:15-19`
- Test: `tests/story.test.mjs`

**Interfaces:**
- Consumes: `estimatePast`, `livedTogetherCount`, `PastLine` (Task 3)
- Produces: ResultPanel의 `together`에 `lines?: PastLine[]`를 더한다. `null`이면 지금 화면 그대로다.

- [ ] **Step 1: 실패하는 테스트 작성** (`tests/story.test.mjs`)

```js
test("부모님 이야기 비율은 고교 졸업까지 같이 산 것으로(329번/년) 센다", () => {
  // 1993년생(33세), 매달 1번, since 없음 → 같이 산 19년 × 329 + 그 뒤 14년쯤 × 12
  const r = pastShare({ rel: "parent", frequency: { count: 1, unit: "month" }, myAge: 33, theirAge: 63, remaining: 300 });
  const past = 19 * 365 * 0.9 + 14 * 12;
  assert.equal(r.assumed, true);
  assert.ok(Math.abs(r.pct - Math.floor(past / (past + 300) * 100)) <= 1);
});
```

  기존 `ASSUMED_MOVE_OUT_AGE`를 쓰는 테스트가 있으면 새 값에 맞춘다.
- [ ] **Step 2: 실패 확인.** Run `node --test tests/story.test.mjs`. 기대 결과: FAIL.
- [ ] **Step 3: 구현**
  - `pastShare`의 부모님 분기를 `livedTogetherCount`로 바꾼다. 떠난 해는 `since`가 있으면 그해, 없으면 `highSchoolEndYear`다. 내 출생 연도는 `now.getFullYear() - myAge`로 잡는다.
  - `ASSUMED_MOVE_OUT_AGE`를 지운다.
  - `StoryLines`의 가정 문구를 바꾼다. 5개 언어 모두 고친다.
    - ko 「고등학교 졸업할 때까지 함께 살았다고 치면」
    - en "Assuming you lived together until you finished high school"
  - `PersonView`
    - `person.bonds?.length`가 있으면 `estimatePast({ …, until: createdAt })`를 쓰고, `estimated`에 `count`, `lines`에 `lines`를 넣는다.
    - `null`이면 지금 `computePast`를 쓰고, 칩이 있다면 `ResultPanel`에 「내 나이를 넣으면 학교 시절까지 셉니다」 한 줄을 넘긴다.
    - 출생 연도는 `birthDate`가 있으면 그 연도, 없으면 `오늘 연도 − resolveAge`다.
  - `ResultPanel`: `lines`가 있으면 기존 `estimated` 안내문 자리에 근거 목록을 그린다.
    - 근거 줄 형식:
      - 「초등학교 6년 (2000~2005) · 1,044번」
      - 「졸업 뒤 20년, 지금 빈도로 · 248번」
      - 「같이 산 19년 · 6,251번」
      - 「군 복무로 못 본 기간 · −21번」
    - 아래에 한 줄을 붙인다: 「학교는 그해 법정 수업일수에서 결석·다른 반이었던 날을 빼고 셌어요. 실제는 이보다 많았을 거예요.」
    - 다른 언어에는 「한국 기준」을 붙인다.
    - 5개 언어로 넣는다.
- [ ] **Step 4: 통과 확인.** Run `npm test` and `npx tsc --noEmit`. 기대 결과: PASS.
- [ ] **Step 5: 커밋**

---

### Task 5: 인연 추가·수정 화면

**Files:**
- Modify: `components/PersonEditor.tsx`
- Test: `e2e/past.spec.ts`(새로)

**Interfaces:**
- Consumes: `Bond`, `BondDetail` (Task 2), `estimatePast` (Task 3)

- [ ] **Step 1: 실패하는 e2e 작성** (`e2e/past.spec.ts`, `e2e/helpers.ts`의 기존 준비 함수 사용)
  - 프로필 나이 33을 넣고 새 인연을 만든다. 「초등학교 친구」 칩만 누르고 빈도를 「한 달에 1번」으로 둔다.
  - 저장 단추 위 미리보기에 `/적어도 1,2\d\d번/`이 보인다.
  - 저장한 뒤 상세에 「초등학교 6년」 근거 줄이 보인다.
  - 수정 화면의 「더 자세히」를 연다. 중학교 칸 문구가 「같이 안 다님」이고 「안 다님」 단독 문구는 없다.
  - 군 복무 칸을 비운 채 저장하면 숫자가 그대로다.
  - 칩 버튼은 `aria-pressed`로 고른 상태를 알린다. 높이는 44px 이상이다.
- [ ] **Step 2: 실패 확인.** Run 3177 임시 설정으로 `npx playwright test --config e2e/_tmp.config.ts e2e/past.spec.ts`. 기대 결과: FAIL.
- [ ] **Step 3: 구현**
  - 이름·관계 칸 아래에 「어떤 사이인가요? 여러 개 골라도 됩니다」 칩 10개를 둔다. 순서는 설계 문서대로다. 「그 밖에」는 `bonds`를 비운다. 5개 언어로 넣는다.
  - 기존 프리셋 칩(`relationPresets`)은 그대로 둔다. 부모님 프리셋을 누르면 `bonds`에 `parent`도 넣는다.
  - 칩이 하나라도 있으면 기존 `MoreDetails` 안에 세부 칸을 그린다.
    - 학교마다 「전부 / n년 / 같이 안 다님」
    - 학원(기간, 주 n번)
    - 군 복무(해당 없음/미필/군필, 나·상대 입대한 해)
    - 같이 산 나이와 「지금도 같이 사나요」
    - 그만둔 해
    - 빠른 년생
  - 고른 칩과 관련 있는 칸만 보인다.
  - 저장 단추 위에 `estimatePast` 미리보기 한 줄을 둔다. `until`은 오늘이다.
- [ ] **Step 4: 통과 확인.** Run 같은 e2e와 `e2e/fit.spec.ts`, `e2e/a11y.spec.ts`. 기대 결과: 모두 PASS. 344px에 큰 글씨에서도 넘침이 0이어야 한다.
- [ ] **Step 5: 커밋**

---

### Task 6: 전체 확인

- [ ] **Step 1:** Run `npm test`, `FUZZ_RUNS=20000 node --test tests/fuzz.test.mjs`, `npx tsc --noEmit`, `npm audit`. 기대 결과: 실패 0, 취약점 0.
- [ ] **Step 2:** Run 3177 임시 설정으로 전체 e2e를 돌린다(`FUZZ=1`). 기대 결과: 모두 PASS. 끝나면 `e2e/_tmp.config.ts`를 삭제한다.
- [ ] **Step 3:** 운영자에게 결과를 보고한다. push는 하지 않는다.
