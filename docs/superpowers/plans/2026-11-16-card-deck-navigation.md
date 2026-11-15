# 카드 줄 이동(탭 없애기) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 아래 탭과 위 메뉴를 없애고, 첫 화면을 「인연」「순간」 두 카드 줄로 바꾼다. 카드를 누르면 사진이 커지며 그 화면으로 펼쳐진다.

**Architecture:**
- 주소는 그대로 둔다. `/`만 `Deck`(세로 scroll-snap 두 칸)과 그 안의 `CardRow` 두 개(가로 scroll-snap, 고리)로 바꾼다. `CardRow`는 `PhotoStack`을 넓힌 것이고, `PhotoStack`은 지운다.
- 펼치기는 `lib/flip.ts` 하나가 맡는다. 떠나는 화면이 사진 위치를 남기고, 다음 화면이 그 위치에서 제자리로 날린다(Web Animations). 상세→홈으로 돌아올 때도 같은 함수를 쓴다.
- 「나」 화면은 지금의 `/settings`다. 맨 위에 홈에서 옮겨 온 `MeSummary`를 얹는다.

**Tech Stack:** Next.js 16 static export, React 18, TypeScript, Tailwind, node:test(`tests/*.test.mjs`, TS 직접 import), Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-11-16-card-deck-navigation-design.md`

## Global Constraints

- 새 라이브러리 금지. 넘기기는 scroll-snap, 효과는 Web Animations(`element.animate`). View Transitions 금지(iOS 16.4 지원).
- 계산·저장 형식·상세 화면 내용은 바꾸지 않는다. 주소도 모두 그대로다.
- 효과: 약 420ms, `cubic-bezier(.2,.8,.2,1)`. 남긴 위치가 없으면 효과 없이 바로 보인다. `prefers-reduced-motion: reduce`면 JS에서 `animate`를 부르지 않고, CSS의 움직임(화살표 흔들림)도 멈춘다.
- 터치 영역은 44px 이상(`min-h-11 min-w-11`). 화살표·점(모아 보기)·뒤로는 진짜 `button`/`a`다.
- 줄에는 카드를 **모두** 넣는다(10장 제한 없음). 점은 12장까지, 넘으면 「3 / 24」.
- 인연 줄: 「나」 → 사람들(「내 순서」가 있으면 그 순서, 없으면 남은 만남 적은 순) → 「＋ 새 인연」. 순간 줄: 순간들(남은 횟수 적은 순) → 「＋ 새 순간」.
- 시작 카드: 저장된 위치(sessionStorage)가 있으면 그 위치. 없으면 14일 안 생일 중 가장 가까운 사람 → 첫 사람 → 사람이 없으면 「나」. 이 규칙은 `startIndex` 하나에만 둔다.
- 바닥글은 `/settings`와 문서 화면(`/about`, `/reads…`, `/privacy`, `/terms`)에만 보인다. 아래 여백(`pb-[calc(6rem+env(safe-area-inset-bottom))]`)은 layout의 `main`으로 옮긴다.
- 「←」(aria-label 「뒤로」): 앱 안에서 옮겨 온 기록이 있으면 `router.back()`, 없으면 `/`(문서 화면은 `/settings`). 누르기 전에 `confirmLeave()`.
- 문구: 사람 말투, AI 말투 금지, 부모님 높임(생신), 5개 언어(ko/en/ja/es/zh). ko 문구는 각 Task에 정한 그대로.
- e2e는 3177 포트 임시 설정: `sed 's/3123/3177/g' e2e/playwright.config.ts > e2e/_tmp.config.ts`, 끝나면 지운다.
- 푸시하지 않는다(main 푸시 = 웹 배포). 작업은 브랜치/워크트리에서.

## Review Focus

1. 카드가 1장(사람 0명이면 인연 줄 「나」+「＋」 = 2장, 순간 0개면 「＋」 1장)일 때 고리용 복제 장이 꼬이지 않고 넘기기 단추·점이 맞게 나온다. Task 2 테스트.
2. 저장된 위치가 지금 카드 수보다 크다(다른 창에서 지움, 저장소가 깨짐) → 범위 안으로 줄여 연다. 이상한 값(`"x"`, 음수)은 무시하고 시작 규칙을 쓴다. Task 1 테스트.
3. 주소로 상세에 바로 들어오거나 새로고침 → 효과 없이 바로 보이고, 「←」는 `/`로 간다. Task 4·6 테스트.
4. 효과 도중에 다시 누르거나 뒤로 가기 → 애니메이션이 남아 사진이 엉뚱한 자리에 멈추지 않는다(`fill` 없이, 끝나면 원래 스타일). Task 6 테스트.
5. 편집 중 저장 안 한 화면에서 「←」 → 지금처럼 묻는다. Task 4 테스트.

---

### Task 1: 줄 규칙(순수 함수) — `lib/deck.ts`

**Files:**
- Create: `lib/deck.ts`, `tests/deck.test.mjs`
- Modify: `lib/birthdays.ts`(`birthdayRibbon` 추가)

**Interfaces:**
- Produces:
  - `type RowKey = "people" | "moments"`
  - `type DeckPos = { row: RowKey; people: number; moments: number }`
  - `startIndex(personIds: string[], upcoming: { id: string; days: number }[]): number` — 인연 줄 안의 번호(0 = 「나」, 사람 k = k+1). `upcoming`은 가까운 순.
  - `cleanPos(value: unknown, sizes: { people: number; moments: number }): DeckPos | null` — 모양이 틀리면 null, 번호는 `0…size-1`로 줄인다.
  - `readPos(sizes): DeckPos | null`, `writePos(pos: DeckPos): void` — sessionStorage 키 `"deck.pos.v1"`, 둘 다 try/catch(못 읽으면 null, 못 쓰면 조용히).
  - `growthNote(growth: GrowthResult): string | null` — 자란 뒤거나 `yearsLeft === null`이면 null. 아니면 `items` 중 count가 가장 작은 것 하나: ko `만 ${adultAge}세까지 ${label} ${count}번`(count는 `formatCount`).
  - `lib/birthdays.ts`: `birthdayRibbon(person: Pick<Person,"name"|"relation"|"bonds">, days: number): string` — ko: days 0 `오늘 생일`/`오늘 생신`, 그 밖 `생일 ${days}일 전`/`생신 ${days}일 전`(`isElder`면 생신).

- [ ] **Step 1: 실패하는 테스트** `tests/deck.test.mjs`

```js
test("시작: 생일 가까운 사람 → 첫 사람 → 나", () => {
  assert.equal(startIndex(["a", "b", "c"], [{ id: "c", days: 3 }, { id: "a", days: 9 }]), 3);
  assert.equal(startIndex(["a", "b"], []), 1);
  assert.equal(startIndex([], []), 0);
  assert.equal(startIndex(["a"], [{ id: "gone", days: 1 }]), 1); // 목록에 없는 id
});
test("cleanPos: 범위로 줄이고 이상한 값은 버린다", () => {
  const sizes = { people: 3, moments: 1 };
  assert.deepEqual(cleanPos({ row: "people", people: 9, moments: 0 }, sizes), { row: "people", people: 2, moments: 0 });
  assert.equal(cleanPos({ row: "x", people: 0, moments: 0 }, sizes), null);
  assert.equal(cleanPos({ row: "people", people: -1, moments: 0 }, sizes), null);
  assert.equal(cleanPos("people", sizes), null);
});
test("growthNote: 가장 적게 남은 것 하나", () => {
  const g = { yearsLeft: 12, adultAge: 19, grownUp: false, items: [
    { key: "summer", label: "여름", emoji: "", count: 12 },
    { key: "dinner", label: "함께하는 저녁 식사", emoji: "", count: 3000 } ] };
  assert.equal(growthNote(g), "만 19세까지 여름 12번");
  assert.equal(growthNote({ ...g, grownUp: true }), null);
  assert.equal(growthNote({ ...g, yearsLeft: null }), null);
});
test("birthdayRibbon", () => {
  assert.equal(birthdayRibbon({ name: "지훈", relation: "친구" }, 6), "생일 6일 전");
  assert.equal(birthdayRibbon({ name: "엄마", relation: "어머니" }, 0), "오늘 생신");
});
```

- [ ] **Step 2:** `node --test tests/deck.test.mjs` → FAIL(모듈 없음)
- [ ] **Step 3:** 위 Interfaces대로 구현. 5개 언어 문구는 `defineCopy`.
- [ ] **Step 4:** `npm test` → 전부 PASS, `npm run typecheck` 통과
- [ ] **Step 5:** 커밋 `줄 규칙: 시작 카드·위치 기억·성장 한 줄·생일 리본`

### Task 2: `CardRow` — `PhotoStack`을 넓힌 가로 줄

**Files:**
- Create: `components/CardRow.tsx`
- Delete: `components/PhotoStack.tsx`(이 Task 끝에서 `app/page.tsx`의 두 사용처를 `CardRow`로 바꾸고 지운다. 홈 모양은 Task 5가 바꾼다.)
- Test: `e2e/deck.spec.ts`(새 파일, 이 Task 몫의 테스트)

**Interfaces:**
- Produces:
  ```ts
  export type DeckCard =
    | { kind: "photo"; id: string; href: string; photo: string; title: string; sentence: string;
        count: string; unit: string; note?: string | null; ribbon?: string | null }
    | { kind: "me"; id: "me"; href: "/settings"; label: string; value: string; nudge?: string | null }
    | { kind: "add"; id: string; href: string; label: string };
  export type CardRowHandle = { go(step: number): void; open(): void };
  // forwardRef
  CardRow(props: { label: string; cards: DeckCard[]; index: number;
    onIndex(i: number): void; listHref: string; overviewLabel: (i: number, n: number) => string })
  ```
  - `index`는 처음 열 번호(진짜 장 기준 0…n-1). 이후 번호는 `onIndex`로 알린다.
  - `open()`: 지금 장을 누른 것과 같다(Task 6에서 효과 연결).
- 지금 `PhotoStack`의 동작을 그대로 가져온다: 양 끝 복제 장(고리), 140ms 조용하면 진짜 장으로 몰래 옮기기, ResizeObserver로 같은 장 유지, `heading` 이중 누름, 움직임 줄이기면 `behavior: "auto"`, 복제 장 `aria-hidden` + `tabIndex=-1`, `TILTS`.
- 바뀌는 것:
  - 이웃 비침: 가운데가 아닌 장은 `opacity-60 scale-[.92]`(움직임 줄이기면 scale 없음). 지금 장 판단은 이미 있는 `index`로.
  - 카드 얼굴 세 가지. `photo`는 지금 내용 + `ribbon`이 있으면 사진 위 모서리 리본. `me`는 `.hero` 색 종이 카드(폴라로이드 아님): 작은 「나」, `label`, 큰 `value`, `nudge` 한 줄. `add`는 점선 테두리 빈 폴라로이드 + 「＋ {label}」.
  - 아래: ‹ › 단추는 `sr-only focus-visible:not-sr-only sm:not-sr-only`. 가운데는 `Link href={listHref}` 하나(`aria-label={overviewLabel(i+1,n)}`, min-h-11). 안에 n ≤ 12면 점 n개(지금 장은 진한 점), 넘으면 `{i+1} / {n}`.
- 카드 1장이면 지금처럼 복제·단추 없음. 점 링크는 남긴다.

- [ ] **Step 1: 실패하는 e2e** `e2e/deck.spec.ts`(이 Task 몫). 시드는 `fit.spec.ts`처럼 저장소에 직접 넣는다.
  - `"사람 3명이면 인연 줄은 5장, 점이 5개"`: region 「인연」 안 점 링크의 aria-label이 `/5장/`를 포함.
  - `"14명이면 점 대신 숫자, 누르면 인연 목록"`: region 「인연」에 `"/ 16"` 텍스트, 그 링크를 누르면 URL `/people`.
  - `"끝에서 다음을 누르면 처음(나)으로"`: 「다음」을 n번 누르면 다시 처음 번호.
  - `"사람이 없으면 나와 새 인연 두 장"`: region 안에 「새 인연」 링크가 `/people/new`.
- [ ] **Step 2:** 임시 설정으로 `npx playwright test e2e/deck.spec.ts --config e2e/_tmp.config.ts` → FAIL
- [ ] **Step 3:** `CardRow` 구현, `app/page.tsx`의 `PhotoStack` 두 곳을 `CardRow`로 바꾸고 `slice(0,10)` 제거(인연 줄 앞뒤에 `me`/`add`, 순간 줄 뒤에 `add`). 모아 보기 문구(ko `(i, n) => \`모아 보기, ${n}장 중 ${i}번째\``)와 「새 인연」「새 순간」은 이 Task에서 `app/page.tsx` COPY에 넣는다. `PhotoStack.tsx` 삭제.
- [ ] **Step 4:** `deck.spec.ts`와 `album.spec.ts`, `misuse.spec.ts` 실행. `album`/`misuse`의 「1 / 10」「전체 보기」처럼 옛 더미 모양에 기대는 줄은 **같은 의도**로 고친다(예: 「열두 명이면 더미에는 열 장」 → 「열두 명이면 줄에 14장 모두, 점 대신 숫자」). 지우지 말고 고친다. → PASS
- [ ] **Step 5:** 커밋 `PhotoStack을 CardRow로: 나·새 카드, 이웃 비침, 점으로 모아 보기`

### Task 3: 「나」 화면 — `MeSummary`를 설정 맨 위로, 바닥글 자리

**Files:**
- Create: `components/MeSummary.tsx`
- Modify: `app/settings/page.tsx`(맨 위에 `<MeSummary />`, 제목 「나」 — 5개 언어 `title`), `app/page.tsx`(옮긴 블록 제거), `components/Footer.tsx`(경로 검사, 아래 여백 제거), `app/layout.tsx`(`main`에 아래 여백)

**Interfaces:**
- Produces: `MeSummary()` — props 없음, `useAppState`로 읽는다. 순서: ① 지금 홈의 `.hero` 블록 그대로(BigNumber·진행 막대·여름/주말/보름달·「내 정보 수정」), ② `backupDue`면 백업 알림(링크는 `#backup`), ③ 결혼 블록(지금 홈의 두 갈래 그대로). 문구는 `app/page.tsx` COPY에서 옮겨 온다. `hero` 블록 바깥 요소에 `data-flip="me"`(Task 6이 쓴다).
- `Footer`: `usePathname()`이 `/settings`, `/about`, `/privacy`, `/terms`로 시작하거나 `/reads`로 시작할 때만 그린다.
- `/settings`에 「나」 화면이 생기므로 a11y 목록의 라벨 「설정」은 「나」로 바꾼다.

- [ ] **Step 1: 실패하는 e2e** `e2e/deck.spec.ts`에 추가:
  - `"나 화면 맨 위에 남은 시간, 그 아래 설정과 바닥글"`: `/settings`에서 heading 「나」, `copy.lifeLabel` 문구, 「서비스 소개」 링크가 보인다.
  - `"첫 화면과 상세에는 바닥글이 없다"`: `/`와 `/people/detail/?id=p1`에서 「서비스 소개」 링크 0개.
  - `"백업 알림을 누르면 같은 화면의 내보내기로"`: 백업이 밀린 상태로 시드 → 알림 클릭 → URL `#backup`, 내보내기 단추 보임.
- [ ] **Step 2:** 실행 → FAIL
- [ ] **Step 3:** 구현
- [ ] **Step 4:** `deck.spec.ts`, `a11y.spec.ts`, `fit.spec.ts` → PASS
- [ ] **Step 5:** 커밋 `나 화면: 남은 시간·백업·결혼을 설정 위로, 바닥글은 나와 문서에만`

### Task 4: 머리글 — 탭 없애고 「←」

**Files:**
- Modify: `components/Nav.tsx`, 탭에 기대던 e2e(`app.spec.ts` 75·86행 「순간」 링크, 233행 `nav.fixed`, `regressions.spec.ts` 208행 「홈」 링크)

**Interfaces:**
- Produces:
  - `Nav`: 아래 고정 `nav`와 위 `LINKS` 메뉴를 지운다. 머리글(sticky, `pt-[env(safe-area-inset-top)]`, 지금 클래스)은 남긴다.
    - `/`: 왼쪽 `<span>`에 줄 이름(`useDeckRow()`가 주는 값, 기본 「인연」), 오른쪽 작은 「몇번더」(링크 아님, `text-xs text-ink-400`).
    - 그 밖: 왼쪽 「←」 `button`(aria-label ko 「뒤로」, min-h-11 min-w-11). 클릭: `confirmLeave()`가 false면 멈춤 → 앱 안 기록이 있으면 `router.back()` → 없으면 문서 화면은 `/settings`, 그 밖은 `/`로 `router.push`. 오른쪽은 비운다.
  - 앱 안 기록 판단: `Nav` 안 모듈 변수 `moved = false`. `usePathname()` 효과에서 첫 값 이후 경로가 바뀌면 `true`. (새로고침하면 다시 false — 그때는 `/`로 가는 쪽이 안전하다.)
  - `lib/deckRow.ts`: `setDeckRow(row: RowKey)`, `useDeckRow(): RowKey` — `useSyncExternalStore`로 된 아주 작은 저장소. Task 5의 `Deck`이 쓴다.
- 이 Task 뒤로 `/`에서 순간 목록·설정으로 가는 길은 홈 화면 안의 링크뿐이다(Task 2·3에서 생긴 「＋」, 점, Task 5의 「나」 카드). 홈의 다른 길은 Task 5가 채운다.

- [ ] **Step 1: 실패하는 e2e** `e2e/deck.spec.ts`에 추가:
  - `"아래 탭이 없다"`: 폭 360에서 `nav.fixed` 0개, 링크 「설정」 0개.
  - `"상세에 주소로 바로 들어와 뒤로를 누르면 첫 화면"`: `goto /people/detail/?id=p1` → 「뒤로」 → URL `/`.
  - `"목록에서 상세로 갔다가 뒤로를 누르면 목록"`: `/people` → 카드 클릭 → 「뒤로」 → URL `/people`.
  - `"문서 화면에 바로 들어와 뒤로를 누르면 나 화면"`: `goto /privacy` → 「뒤로」 → `/settings`.
  - `"편집 중 뒤로를 누르면 묻고, 취소하면 남는다"`: `/people/new`에서 이름 입력 → dialog dismiss → URL 그대로.
- [ ] **Step 2:** 실행 → FAIL
- [ ] **Step 3:** 구현. `app.spec.ts`의 「순간」 링크 클릭 두 곳은 「뒤로」 단추로(같은 의도: 저장 안 한 변경을 묻는지), `nav.fixed` 폭 검사는 지운다(탭이 없다 — 위 새 테스트가 대신한다), `regressions.spec.ts`의 「홈」 링크는 「뒤로」로.
- [ ] **Step 4:** `deck`, `app`, `regressions`, `a11y`, `fit` → PASS
- [ ] **Step 5:** 커밋 `머리글: 아래 탭과 위 메뉴를 없애고 뒤로 단추`

### Task 5: 첫 화면 — `Deck` 두 줄

**Files:**
- Create: `components/Deck.tsx`
- Modify: `app/page.tsx`(전체를 `Deck`으로; setup 넘기기·로딩·h1 `sr-only` 유지), `app/layout.tsx` 또는 `app/page.tsx`(첫 화면은 `main`의 위 여백 없음), `app/globals.css`(화살표 흔들림 keyframes, `prefers-reduced-motion`이면 없음)

**Interfaces:**
- Consumes: `CardRow`/`CardRowHandle`/`DeckCard`(Task 2), `startIndex`/`readPos`/`writePos`/`growthNote`/`birthdayRibbon`(Task 1), `setDeckRow`(Task 4).
- Produces: `Deck({ peopleCards, momentCards, startPeople, emptyMoments }: { peopleCards: DeckCard[]; momentCards: DeckCard[]; startPeople: number; emptyMoments: string | null })`.
  - 세로 scroll-snap 상자(`overflow-y-auto snap-y snap-mandatory`, 높이 = `100svh` − 머리글). 두 칸은 `snap-start`, 높이는 상자의 약 88%라 인연 칸 아래로 순간 칸 윗부분이 비친다.
  - 인연 칸 아래 `button` 「순간 ↓」(흔들림), 순간 칸 위 `button` 「↑ 인연」. 누르면 그 칸으로 `scrollIntoView`(움직임 줄이기면 `behavior:"auto"`).
  - 지금 칸은 세로 스크롤 위치로 정하고 `setDeckRow`·`writePos`.
  - 상자는 `tabIndex=0`, `role="group"`, aria-label 「카드」. 키: ←/→ 지금 칸의 `go(∓1)`, ↑/↓ 칸 바꾸기, Enter `open()`. 상자 안 단추에 초점이 있을 때는 그 단추가 키를 먼저 쓴다(`event.target !== currentTarget`이면 ←/→/Enter를 가로채지 않는다).
  - 처음 열 때: `readPos(sizes)`가 있으면 그 칸·번호, 없으면 인연 칸의 `startPeople`.
  - 순간이 없으면 순간 칸의 「＋」 아래에 `emptyMoments` 문장.
- `app/page.tsx`가 카드를 만든다: 사람 카드 `note` = 아이면 `growthNote(computeGrowth(person))`, 아니면 `lastMetLine(person)`; `ribbon` = `upcomingBirthdays`에 있으면 `birthdayRibbon`. 「나」 카드 `label` = `copy.lifeLabel`, `value` = `formatYears(remainingYears)`, `nudge` = `backupDue`면 ko 「백업할 때가 됐어요」.
- 새 ko 문구: 「순간 ↓」 「↑ 인연」, 새 카드 「새 인연」「새 순간」, 모아 보기 `(i, n) => \`모아 보기, ${n}장 중 ${i}번째\``, 상자 「카드」.

- [ ] **Step 1: 실패하는 e2e** `e2e/deck.spec.ts`에 추가:
  - `"새로 열면 첫 사람 카드, 생일이 가까우면 그 사람"`: 셋 중 둘째가 생일 5일 전 → 지금 장의 제목이 둘째, 카드에 「생일 5일 전」.
  - `"순간 ↓를 누르면 제목이 순간, ↑ 인연으로 돌아온다"`: 머리글 왼쪽 텍스트 「순간」 → 「인연」.
  - `"키보드만으로 모든 카드에 닿는다"`: 상자에 초점 → ArrowRight를 n번 누르며 제목을 모아 모든 사람·「나」·「새 인연」이 한 번씩, ArrowDown 뒤 순간도 같게.
  - `"나 카드에서 내보내기까지"`: 「나」 카드(ArrowLeft 한 번) → Enter → `/settings` → 「내보내기」 단추 보임.
  - `"상세에 갔다 돌아오면 같은 줄의 같은 카드"`: 순간 줄 둘째 카드 → 상세 → 「뒤로」 → 제목 「순간」, 지금 장이 그 순간.
  - `"아이 카드에는 성장 한 줄"`: 7살 자녀 → 카드에 「만 20세까지」.
  - 손가락 세로 밀기: `page.mouse.wheel(0, 600)` 뒤 머리글 「순간」(가로 밀기는 기존 album 테스트가 본다).
- [ ] **Step 2:** 실행 → FAIL
- [ ] **Step 3:** 구현. 옛 홈 블록(생일 줄, 성장 캘린더 섹션, 「전체 보기」) 제거.
- [ ] **Step 4:** 전체 e2e(임시 설정) → PASS. 홈의 옛 섹션 제목(「아이와 남은 것들」 등)에 기대던 테스트는 같은 의도로 고친다. `fit.spec.ts`의 모든 폭·글씨 크기와 `a11y.spec.ts` 위반 0건.
- [ ] **Step 5:** 커밋 `첫 화면을 인연·순간 두 카드 줄로`

### Task 6: 펼치기 효과 — `lib/flip.ts`

**Files:**
- Create: `lib/flip.ts`
- Modify: `components/CardRow.tsx`(누를 때 남기기, 돌아왔을 때 받기), `components/PersonView.tsx:298`·`components/MomentView.tsx:163`(큰 폴라로이드를 `span ref`로 감싸 `useFlip`), `components/MeSummary.tsx`(`data-flip="me"` 요소에 `useFlip("me")`)

**Interfaces:**
- Produces:
  - `remember(key: string, el: Element): void` — `el.getBoundingClientRect()`를 모듈 변수 `{ key, rect }`에 남긴다.
  - `useFlip<T extends HTMLElement>(key: string): RefObject<T>` — 붙은 뒤 남은 값의 key가 같으면 한 번 쓰고 비운다. 그 rect에서 제자리로 `el.animate([{ transform: "translate(dx,dy) scale(s)", transformOrigin: "top left" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.2,.8,.2,1)" })`. `fill` 쓰지 않는다. 같은 요소의 나머지 형제 내용은 `opacity 0 → 1`(250ms, 160ms 늦게). 떠날 때(언마운트) `remember(key, el)`.
  - 움직임 줄이기면 `animate`를 부르지 않는다(남은 값만 비운다). rect가 0 크기거나 key가 다르면 아무것도 안 한다.
  - key 규칙: 사람 `person:${id}`, 순간 `moment:${id}`, 나 `me`. `add` 카드는 남기지 않는다.
- `CardRow`: 카드 `Link` onClick(과 `open()`)에서 그 카드 사진(`me`는 카드 자체)에 `remember`. 지금 장 요소에 `useFlip` 대신 같은 로직의 `playFrom(key, el)`을 마운트 때 부른다 — `lib/flip.ts`에 `playFrom(key: string, el: HTMLElement): void`로 내보내고 `useFlip`도 이것을 쓴다.

- [ ] **Step 1: 실패하는 e2e** `e2e/deck.spec.ts`에 추가:
  - `"카드를 누르면 상세 사진이 날아 온다"`: 홈 → 지금 카드 클릭 → `/people/detail` 도착 직후 `document.getAnimations().length > 0`.
  - `"주소로 바로 들어오면 효과가 없다"`: `goto` 상세 → `getAnimations().length === 0`.
  - `test.use({ reducedMotion: "reduce" })` 묶음: 같은 클릭 뒤 `getAnimations().length === 0`.
  - `"효과 도중 뒤로 가도 사진이 제자리"`: 클릭 → 100ms 안에 「뒤로」 → 홈 카드의 `getComputedStyle(img).transform`이 끝나고 나면 `none`이거나 기울기 회전만.
- [ ] **Step 2:** 실행 → FAIL
- [ ] **Step 3:** 구현
- [ ] **Step 4:** 전체 e2e → PASS
- [ ] **Step 5:** 커밋 `카드를 누르면 사진이 커지며 펼쳐지고, 돌아오면 제자리로`

### Task 7: 마무리 확인

**Files:** 없음(고칠 것이 나오면 그 파일)

- [ ] **Step 1:** `npm run typecheck`, `npm test`, `FUZZ_RUNS=20000 node --test tests/fuzz.test.mjs`, `npm audit` → 문제 없음
- [ ] **Step 2:** `npm run build` 성공, `components/PhotoStack` 참조 0개, `Nav`에 `LINKS` 없음
- [ ] **Step 3:** 전체 e2e + `FUZZ=1`로 `fuzz.spec.ts`(임시 설정) → PASS. 임시 설정 파일 삭제.
- [ ] **Step 4:** 실기기에서 볼 것을 보고서에 적는다(이 Task에서는 확인 불가): 가로·세로 스크롤이 겹칠 때 방향 잠금, 안드로이드 뒤로 단추, iOS 16.4에서 효과.
- [ ] **Step 5:** 커밋(고친 것이 있으면) `카드 줄 이동 마무리 확인`
