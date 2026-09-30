# 사진첩 디자인과 개인정보 동의 — 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 처음 쓰는 사람이 개인정보 안내에 동의해야 앱을 쓰게 하고, 화면을 폴라로이드 사진첩(겹친 더미) 분위기로 바꾼다.

**Architecture:** 동의 기록은 앱 기록과 **다른 localStorage 키**에 두고, layout의 `<main>` 안에서 `ConsentGate`가 가로챈다. 사진은 `public/photos/<key>.webp` 24장을 앱에 넣고, `lib/photos.ts`의 규칙으로 항목마다 한 장을 고른다. 겉모습은 `globals.css` 토큰 교체 + `Polaroid`·`PhotoStack`·`PhotoPicker` 세 컴포넌트로 입힌다.

**Tech Stack:** Next 16 정적 내보내기, React 18, Tailwind 3, Node 내장 테스트 러너(`node --test`, 타입 스트리핑), Playwright + axe.

**Spec:** `docs/superpowers/specs/2026-09-30-album-and-consent-design.md`

**스펙과 달라진 점 하나:** 스펙은 동의를 `Settings.consent`에 둔다고 했다. 계획에서는 별도 키 `inyeon.consent`에 둔다. 그러면 ① 불러오기(import)가 동의를 덮어쓸 길이 아예 없고(스펙의 "import로 들어온 consent는 무시"가 코드 없이 성립), ② 전체 삭제·망가진 기록 복구(`normalise`)가 동의를 건드리지 않으며, ③ E2E의 `clearState`가 앱 키만 지우므로 기존 테스트가 동의 화면에 막히지 않는다.

## Global Constraints

- 웹폰트를 쓰지 않는다. 글꼴은 시스템 글꼴 목록으로만 부른다.
- 새 npm 의존성을 넣지 않는다(이미지 변환은 로컬 Python Pillow 11.2.1로 한 번만).
- 모든 화면 문구는 `defineCopy`로 ko/en/ja/es/zh 다섯 언어를 갖춘다.
- axe 위반 0건(밝게·어둡게 모두), 키보드만으로 전부 조작 가능, `prefers-reduced-motion` 존중.
- 사용자 실제 사진은 받지 않는다. 기록은 기기 밖으로 나가지 않는다.
- 사진에 사람 얼굴을 넣지 않는다(물건·풍경·뒷모습).
- 공유 카드 디자인은 바꾸지 않는다(바탕색은 지금처럼 `--page`를 읽으므로 새 종이색을 따른다).
- 커밋 메시지는 한국어 한 줄 요약 + 아래 두 줄:
  `Co-Authored-By: Claude Opus 5.5 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_014GfBrqayu2BgndqAdoXNsV`

## Review Focus

1. **동의 기록이 망가진 값**(`"abc"`, `{"version":"1"}`, `null`) — 앱이 멈추지 않고 동의 화면을 다시 보여야 한다. → Task 1 단위 테스트.
2. **저장이 막힌 환경**(시크릿 모드, 저장 공간 가득) — 동의를 눌러도 저장이 안 되면 이번 방문 동안은 들어가게 하고, 다음 방문에 다시 묻는다. 갇히면 안 된다. → Task 2 E2E.
3. **모르는 사진 키**(백업 파일을 사람이 고쳐 `photo: "zzz"`) — 깨진 이미지 대신 공용 사진으로 떨어져야 한다. → Task 3 단위 테스트 + Task 6 store 복구.
4. **인연이 1명 / 0명일 때 더미** — 1명이면 ‹ › 단추 없이 한 장, 0명이면 기존 빈 상태. → Task 5 E2E.
5. **긴 이름**(띄어쓰기 없는 영문 30자) — 폴라로이드 밖으로 밀고 나가 화면이 옆으로 흔들리면 안 된다. → Task 5 E2E.

---

## 파일 지도

| 파일 | 책임 |
| --- | --- |
| `lib/consent.ts` (새) | 동의 키·버전·판정(순수 함수) |
| `components/ConsentGate.tsx` (새) | 동의 전이면 본문 대신 동의 화면 |
| `components/PrivacyText.tsx` (새) | 안내 문구 5개 언어(동의 화면과 `/privacy`가 같이 씀) |
| `app/privacy/page.tsx` (새) | 읽기 전용 안내 + 동의한 날짜 |
| `lib/photos.ts` (새) | 사진 24장 목록, 고르는 규칙, 경로 |
| `public/photos/*.webp` (새) | 사진 파일 |
| `components/Polaroid.tsx` (새) | 폴라로이드 한 장(sm/md/lg) |
| `components/PhotoStack.tsx` (새) | 겹친 더미 + ‹ › 넘기기 |
| `components/PhotoPicker.tsx` (새) | 편집 화면의 사진 바꾸기 |
| `lib/types.ts` | `Person.photo`, `Moment.photo` |
| `lib/store.ts` | `photo` 복구 |
| `app/layout.tsx` | `ConsentGate`로 감싸기 |
| `app/settings/page.tsx` | 「개인정보 안내」 링크 |
| `app/page.tsx` | 인연·순간을 더미로 |
| `app/people/page.tsx`, `app/moments/page.tsx` | 이모지 자리 → 작은 폴라로이드 |
| `components/PersonView.tsx`, `components/MomentView.tsx` | 큰 폴라로이드 |
| `components/PersonEditor.tsx`, `components/MomentEditor.tsx` | 사진 바꾸기 |
| `app/globals.css`, `tailwind.config.ts` | 종이·밤의 앨범 팔레트, `.polaroid`, 명조 |
| `lib/themeColor.ts`, `app/manifest.ts`, `capacitor.config.ts` | 상태바·배경 색 |
| `e2e/playwright.config.ts` | 동의된 상태로 시작 |
| `e2e/consent.spec.ts`, `e2e/album.spec.ts` (새) | 새 흐름 E2E |
| `tests/consent.test.mjs`, `tests/photos.test.mjs` (새) | 단위 테스트 |

---

### Task 1: 동의 판정 (`lib/consent.ts`)

**Files:**
- Create: `lib/consent.ts`
- Test: `tests/consent.test.mjs`

**Interfaces:**
- Produces:
  - `CONSENT_KEY = "inyeon.consent"`
  - `CONSENT_VERSION = 1`
  - `needsConsent(raw: string | null): boolean`
  - `consentRecord(now: Date): string` — `JSON.stringify({ version: CONSENT_VERSION, at: now.toISOString() })`
  - `consentDate(raw: string | null): string | null` — 유효하면 `at`, 아니면 null

- [ ] **Step 1: 실패하는 테스트**

```js
// tests/consent.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";

import { CONSENT_VERSION, consentDate, consentRecord, needsConsent } from "../lib/consent.ts";

const NOW = new Date("2026-09-30T09:00:00Z");

test("기록이 없으면 묻는다", () => {
  assert.equal(needsConsent(null), true);
});

test("지금 버전에 동의했으면 묻지 않는다", () => {
  assert.equal(needsConsent(consentRecord(NOW)), false);
});

test("옛 버전에 동의했으면 다시 묻는다", () => {
  assert.equal(needsConsent(JSON.stringify({ version: CONSENT_VERSION - 1, at: NOW.toISOString() })), true);
});

test("망가진 기록이면 멈추지 않고 다시 묻는다", () => {
  for (const raw of ["abc", "null", "[]", '{"version":"1"}', '{"version":1}', '{"version":1,"at":3}']) {
    assert.equal(needsConsent(raw), true, raw);
  }
});

test("동의한 날짜를 돌려준다", () => {
  assert.equal(consentDate(consentRecord(NOW)), "2026-09-30T09:00:00.000Z");
  assert.equal(consentDate("abc"), null);
});
```

- [ ] **Step 2: 실패 확인** — `node --test tests/consent.test.mjs` → FAIL(모듈 없음)

- [ ] **Step 3: 구현**

```ts
// lib/consent.ts
/*
 * 개인정보 안내 동의.
 *
 * 앱 기록(STORAGE_KEY)과 다른 키에 둔다. 불러오기가 앱 기록을 통째로 바꾸고,
 * 전체 삭제가 기록을 비우고, 망가진 기록은 복구 과정에서 다시 쓰인다 — 그 어느 쪽도
 * 동의를 건드리면 안 된다. 남의 백업 파일로 동의를 건너뛸 수 없게 하는 것도 이 분리다.
 *
 * "use client"를 붙이지 않는다. 단위 테스트가 Node에서 바로 읽는다.
 */

export const CONSENT_KEY = "inyeon.consent";

/** 안내 문구(components/PrivacyText.tsx)를 바꾸면 올린다. 올리면 모두에게 다시 묻는다. */
export const CONSENT_VERSION = 1;

function parse(raw: string | null): { version: number; at: string } | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (value && typeof value === "object" && typeof value.version === "number" && typeof value.at === "string") {
      return value;
    }
  } catch {
    // 아래로.
  }
  return null;
}

export function needsConsent(raw: string | null): boolean {
  return parse(raw)?.version !== CONSENT_VERSION;
}

export function consentRecord(now: Date): string {
  return JSON.stringify({ version: CONSENT_VERSION, at: now.toISOString() });
}

export function consentDate(raw: string | null): string | null {
  return parse(raw)?.at ?? null;
}
```

- [ ] **Step 4: 통과 확인** — `node --test tests/consent.test.mjs` → PASS, `npm run typecheck` → 0 errors

- [ ] **Step 5: 커밋** — `git add lib/consent.ts tests/consent.test.mjs` / 메시지 `동의 기록을 판정한다 — 앱 기록과 다른 키에 둔다`

---

### Task 2: 동의 화면, `/privacy`, 설정 링크

**Files:**
- Create: `components/PrivacyText.tsx`, `components/ConsentGate.tsx`, `app/privacy/page.tsx`, `e2e/consent.spec.ts`
- Modify: `app/layout.tsx` (`<main>` 안), `app/settings/page.tsx` (피드백 section 뒤), `e2e/playwright.config.ts` (`use`)

**Interfaces:**
- Consumes: Task 1의 `CONSENT_KEY`, `needsConsent`, `consentRecord`, `consentDate`
- Produces: `<PrivacyText />` (문구만, props 없음), `<ConsentGate>{children}</ConsentGate>`

- [ ] **Step 1: 기존 E2E가 동의된 상태로 시작하게** — `e2e/playwright.config.ts`의 `use`에 추가:

```ts
    // 동의 화면은 e2e/consent.spec.ts가 따로 본다. 나머지 시나리오는 동의한 뒤에서 시작한다.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:3123",
          localStorage: [{ name: "inyeon.consent", value: JSON.stringify({ version: 1, at: "2026-01-01T00:00:00.000Z" }) }],
        },
      ],
    },
```

- [ ] **Step 2: 실패하는 E2E**

```ts
// e2e/consent.spec.ts
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
});

test("동의 화면도 접근성 위반이 없다", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "시작하기 전에" })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
```

- [ ] **Step 3: 실패 확인** — `npx playwright test --config e2e/playwright.config.ts e2e/consent.spec.ts` → FAIL(제목 없음)

- [ ] **Step 4: 문구 컴포넌트**

```tsx
// components/PrivacyText.tsx
"use client";

import { defineCopy, tr } from "@/lib/i18n";

/*
 * 개인정보 안내. 동의 화면과 /privacy가 같이 쓴다.
 * 실제 동작과 한 글자도 어긋나면 안 된다. 이 문구를 바꾸면 lib/consent.ts의
 * CONSENT_VERSION을 올린다.
 */
const COPY = defineCopy<{ title: string; body: string }[]>({
  ko: [
    { title: "무엇을 적나요", body: "내 생년월일·성별·국가·생활 습관, 그리고 등록한 사람의 이름·관계·나이·만남 빈도입니다." },
    { title: "어디에 두나요", body: "이 기기 안에만 저장합니다. 서버도 계정도 없어서 운영자를 포함한 누구도 볼 수 없습니다." },
    { title: "어디에 쓰나요", body: "남은 횟수를 계산하는 데만 씁니다. 광고·분석·제3자 제공에는 쓰지 않습니다." },
    { title: "어떻게 지우나요", body: "설정 → 전체 삭제를 누르거나 앱을 지우면 즉시 사라집니다." },
    { title: "다른 사람의 정보", body: "인연으로 적는 정보는 본인만 보는 개인 메모로만 써 주세요." },
    { title: "예외", body: "'의견 보내기'는 내 메일 앱으로 직접 보내는 것입니다. 웹으로 쓸 때는 호스팅(GitHub Pages)이 일반적인 접속 기록(IP 주소 등)을 남깁니다." },
  ],
  en: [
    { title: "What you enter", body: "Your birth date, sex, country and lifestyle, and the name, relationship, age and meeting frequency of people you add." },
    { title: "Where it is kept", body: "Only on this device. There is no server and no account, so no one — including us — can see it." },
    { title: "What it is used for", body: "Only to calculate how many times are left. Never for ads, analytics or sharing with third parties." },
    { title: "How to delete it", body: "Settings → Delete everything, or uninstall the app. It is gone immediately." },
    { title: "Other people's information", body: "Please use what you enter about others only as a private note for yourself." },
    { title: "Exceptions", body: "'Send feedback' opens your own mail app. When used on the web, the host (GitHub Pages) keeps ordinary access logs such as IP addresses." },
  ],
  ja: [
    { title: "入力するもの", body: "あなたの生年月日・性別・国・生活習慣、そして登録した人の名前・関係・年齢・会う頻度です。" },
    { title: "保存場所", body: "この端末の中だけに保存します。サーバーもアカウントもないため、運営者を含め誰も見ることはできません。" },
    { title: "使いみち", body: "残りの回数を計算するためだけに使います。広告・分析・第三者提供には使いません。" },
    { title: "消し方", body: "設定 → すべて削除、またはアプリを削除すると、すぐに消えます。" },
    { title: "ほかの人の情報", body: "大切な人として入力する情報は、自分だけが見る個人的なメモとしてお使いください。" },
    { title: "例外", body: "「ご意見を送る」はご自身のメールアプリから直接送ります。ウェブで使う場合、ホスティング(GitHub Pages)が一般的なアクセス記録(IPアドレスなど)を残します。" },
  ],
  es: [
    { title: "Qué escribes", body: "Tu fecha de nacimiento, sexo, país y hábitos, y el nombre, la relación, la edad y la frecuencia de encuentro de las personas que añades." },
    { title: "Dónde se guarda", body: "Solo en este dispositivo. No hay servidor ni cuenta, así que nadie —ni siquiera nosotros— puede verlo." },
    { title: "Para qué se usa", body: "Solo para calcular cuántas veces quedan. Nunca para publicidad, analítica ni cesión a terceros." },
    { title: "Cómo borrarlo", body: "Ajustes → Borrar todo, o desinstala la app. Desaparece al instante." },
    { title: "Datos de otras personas", body: "Usa lo que escribas sobre otras personas solo como una nota privada para ti." },
    { title: "Excepciones", body: "'Enviar comentarios' abre tu propia app de correo. En la web, el alojamiento (GitHub Pages) guarda registros de acceso habituales, como la dirección IP." },
  ],
  zh: [
    { title: "填写的内容", body: "你的出生日期、性别、国家和生活习惯，以及你添加的人的姓名、关系、年龄和见面频率。" },
    { title: "保存在哪里", body: "只保存在这台设备上。没有服务器也没有账号，包括运营者在内任何人都看不到。" },
    { title: "用来做什么", body: "只用于计算剩下的次数。绝不用于广告、分析或提供给第三方。" },
    { title: "如何删除", body: "设置 → 全部删除，或卸载应用，数据会立即消失。" },
    { title: "他人的信息", body: "你填写的关于他人的信息，请只作为自己看的私人备忘。" },
    { title: "例外", body: "「发送意见」会直接打开你自己的邮件应用。在网页上使用时，托管方(GitHub Pages)会留下一般访问记录(如 IP 地址)。" },
  ],
});

export default function PrivacyText() {
  return (
    <dl className="space-y-4">
      {tr(COPY).map((item) => (
        <div key={item.title}>
          <dt className="text-sm font-semibold text-ink-800">{item.title}</dt>
          <dd className="mt-1 text-sm leading-relaxed text-ink-600">{item.body}</dd>
        </div>
      ))}
    </dl>
  );
}
```

- [ ] **Step 5: 게이트**

```tsx
// components/ConsentGate.tsx
"use client";

import { useEffect, useState } from "react";

import PrivacyText from "@/components/PrivacyText";
import { CONSENT_KEY, consentRecord, needsConsent } from "@/lib/consent";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "시작하기 전에", lead: "기록은 이 기기 밖으로 나가지 않습니다. 아래를 읽고 동의해 주세요.", agree: "위 내용을 확인했고 동의합니다", age: "만 14세 이상입니다", start: "동의하고 시작하기", required: "(필수)" },
  en: { title: "Before you start", lead: "Nothing you enter leaves this device. Please read and agree below.", agree: "I have read the above and agree", age: "I am 14 or older", start: "Agree and start", required: "(required)" },
  ja: { title: "はじめる前に", lead: "記録はこの端末の外に出ません。以下を読んで同意してください。", agree: "上記の内容を確認し、同意します", age: "14歳以上です", start: "同意してはじめる", required: "(必須)" },
  es: { title: "Antes de empezar", lead: "Nada de lo que escribas sale de este dispositivo. Lee y acepta lo siguiente.", agree: "He leído lo anterior y acepto", age: "Tengo 14 años o más", start: "Aceptar y empezar", required: "(obligatorio)" },
  zh: { title: "开始之前", lead: "你的记录不会离开这台设备。请阅读并同意以下内容。", agree: "我已阅读并同意以上内容", age: "我已年满14岁", start: "同意并开始", required: "(必填)" },
});

/*
 * 동의 전이면 본문 대신 동의 화면을 그린다.
 *
 * 저장소를 읽기 전(서버 HTML, 하이드레이션 직후)에는 본문을 그대로 둔다. 각 화면이
 * 어차피 "불러오는 중"을 먼저 보이므로, 여기서 빈 화면을 한 번 더 끼우지 않는다.
 * 저장이 막힌 환경(시크릿 모드, 저장 공간 가득)에서는 이번 방문 동안만 들여보낸다 —
 * 동의를 저장하지 못했다고 앱에 갇히게 하면 안 된다. 다음 방문에 다시 묻는다.
 */
export default function ConsentGate({ children }: { children: React.ReactNode }) {
  const [needed, setNeeded] = useState<boolean | null>(null);
  const [agree, setAgree] = useState(false);
  const [age, setAge] = useState(false);

  useEffect(() => {
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(CONSENT_KEY);
    } catch {
      // 못 읽으면 없는 것으로 본다.
    }
    setNeeded(needsConsent(raw));
  }, []);

  if (needed !== true) return <>{children}</>;

  const t = tr(COPY);
  const accept = () => {
    try {
      window.localStorage.setItem(CONSENT_KEY, consentRecord(new Date()));
    } catch {
      // 위 주석 참고.
    }
    setNeeded(false);
  };

  return (
    <section className="space-y-5 py-4" aria-labelledby="consent-title">
      <div>
        <h1 id="consent-title" className="font-album text-2xl text-ink-900">{t.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{t.lead}</p>
      </div>
      <div className="card">
        <PrivacyText />
      </div>
      <div className="space-y-3">
        <label className="flex items-start gap-3 text-sm text-ink-800">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>{t.agree} <span className="text-ink-600">{t.required}</span></span>
        </label>
        <label className="flex items-start gap-3 text-sm text-ink-800">
          <input type="checkbox" className="mt-0.5 h-5 w-5 shrink-0" checked={age} onChange={(e) => setAge(e.target.checked)} />
          <span>{t.age} <span className="text-ink-600">{t.required}</span></span>
        </label>
      </div>
      <button type="button" className="btn-primary w-full py-3" disabled={!agree || !age} onClick={accept}>
        {t.start}
      </button>
    </section>
  );
}
```

주의: 체크박스 라벨 텍스트에 `(필수)`가 붙으므로 E2E의 `getByLabel("위 내용을 확인했고 동의합니다")`는 부분 일치(기본값)로 찾는다. `font-album` 클래스는 Task 7에서 생긴다 — 그 전에는 효과만 없고 빌드는 된다(Tailwind는 모르는 클래스를 무시).

- [ ] **Step 6: layout에 끼우기** — `app/layout.tsx`에 `import ConsentGate from "@/components/ConsentGate";`를 더하고 `<main ...>{children}</main>`의 `{children}`을 `<ConsentGate>{children}</ConsentGate>`로 바꾼다.

- [ ] **Step 7: `/privacy` 화면**

```tsx
// app/privacy/page.tsx
"use client";

import { useEffect, useState } from "react";

import PrivacyText from "@/components/PrivacyText";
import { CONSENT_KEY, consentDate } from "@/lib/consent";
import { defineCopy, locale, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: { title: "개인정보 안내", agreedOn: (d: string) => `동의한 날: ${d}` },
  en: { title: "Privacy", agreedOn: (d: string) => `Agreed on ${d}` },
  ja: { title: "個人情報について", agreedOn: (d: string) => `同意した日: ${d}` },
  es: { title: "Privacidad", agreedOn: (d: string) => `Aceptado el ${d}` },
  zh: { title: "隐私说明", agreedOn: (d: string) => `同意日期：${d}` },
});

export default function PrivacyPage() {
  const t = tr(COPY);
  const [at, setAt] = useState<string | null>(null);
  useEffect(() => {
    try {
      setAt(consentDate(window.localStorage.getItem(CONSENT_KEY)));
    } catch {
      setAt(null);
    }
  }, []);
  return (
    <div className="space-y-5">
      <h1 className="font-album text-2xl text-ink-900">{t.title}</h1>
      <div className="card">
        <PrivacyText />
      </div>
      {at && <p className="text-xs text-ink-600">{t.agreedOn(new Date(at).toLocaleDateString(locale()))}</p>}
    </div>
  );
}
```

- [ ] **Step 8: 설정 링크** — `app/settings/page.tsx`의 `COPY` 다섯 언어에 `privacyLink`를 더한다: ko `"개인정보 안내"`, en `"Privacy"`, ja `"個人情報について"`, es `"Privacidad"`, zh `"隐私说明"`. 의견 보내기 `<section>`(약 561행) 바로 뒤에:

```tsx
      <Link href="/privacy" className="btn-secondary w-full">
        {t.privacyLink}
      </Link>
```

파일 위에 `import Link from "next/link";`가 없으면 더한다.

- [ ] **Step 9: 통과 확인** — `npm run typecheck`, `npm test`, `npm run test:e2e` → 전부 PASS. 기존 E2E 중 `app.spec.ts:255`의 낯선 사람 컨텍스트는 동의 화면을 보게 되지만, 검사 내용(이름이 안 보임·저장소 비어 있음)은 그대로 성립한다.

- [ ] **Step 10: 커밋** — 위 파일 전부 / `개인정보 안내에 동의해야 시작하게 한다`

---

### Task 3: 사진 규칙 (`lib/photos.ts`)

**Files:**
- Create: `lib/photos.ts`, `tests/photos.test.mjs`

**Interfaces:**
- Produces:
  - `type PhotoKey = (typeof PHOTOS)[number]["key"]`
  - `PHOTOS: readonly { key: string; emoji?: string }[]` (24개, 아래 순서)
  - `SHARED_PHOTOS: string[]` — emoji 없는 6개 키
  - `photoFor(item: { id: string; emoji?: string; photo?: string }): string` — 키
  - `photoSrc(key: string): string` — `${NEXT_PUBLIC_BASE_PATH}/photos/${key}.webp`

- [ ] **Step 1: 실패하는 테스트**

```js
// tests/photos.test.mjs
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { PHOTOS, SHARED_PHOTOS, photoFor, photoSrc } from "../lib/photos.ts";

test("24장이고 키가 겹치지 않는다", () => {
  assert.equal(PHOTOS.length, 24);
  assert.equal(new Set(PHOTOS.map((p) => p.key)).size, 24);
  assert.equal(SHARED_PHOTOS.length, 6);
});

test("고른 사진이 있으면 그것", () => {
  assert.equal(photoFor({ id: "a", emoji: "🌷", photo: "sea" }), "sea");
});

test("고른 사진이 없으면 프리셋 이모지의 사진", () => {
  assert.equal(photoFor({ id: "a", emoji: "🌷" }), "mother");
  assert.equal(photoFor({ id: "a", emoji: "🌸" }), "blossom");
});

test("모르는 키·모르는 이모지·이모지 없음은 공용 사진으로, 늘 같은 것", () => {
  for (const item of [{ id: "x1", photo: "zzz" }, { id: "x1", emoji: "🦄" }, { id: "x1" }]) {
    const key = photoFor(item);
    assert.ok(SHARED_PHOTOS.includes(key), key);
    assert.equal(photoFor(item), key);
  }
});

test("모든 사진 파일이 있다", () => {
  for (const { key } of PHOTOS) {
    assert.ok(existsSync(`public/photos/${key}.webp`), key);
  }
});

test("경로", () => {
  assert.equal(photoSrc("sea"), "/photos/sea.webp");
});
```

- [ ] **Step 2: 실패 확인** — `node --test tests/photos.test.mjs` → FAIL(모듈 없음)

- [ ] **Step 3: 구현**

```ts
// lib/photos.ts
/*
 * 폴라로이드에 거는 사진. 사용자 사진은 받지 않고, 앱에 넣어 둔 24장 중에서 고른다.
 * 프리셋 18개(관계 7, 순간 11)에 한 장씩, 그리고 공용 "인생의 순간" 6장.
 * 이모지는 lib/presets.ts의 RELATION_SPECS·MOMENT_SPECS와 같은 값이어야 한다.
 */
export const PHOTOS = [
  { key: "mother", emoji: "🌷" },
  { key: "father", emoji: "🌳" },
  { key: "grandparent", emoji: "🫖" },
  { key: "sibling", emoji: "🧩" },
  { key: "spouse", emoji: "🕊️" },
  { key: "child", emoji: "🧸" },
  { key: "friend", emoji: "🍻" },
  { key: "blossom", emoji: "🌸" },
  { key: "sea", emoji: "🌊" },
  { key: "travel", emoji: "✈️" },
  { key: "hometown", emoji: "🏠" },
  { key: "books", emoji: "📖" },
  { key: "surf", emoji: "🏄" },
  { key: "guitar", emoji: "🎸" },
  { key: "snow", emoji: "❄️" },
  { key: "dog", emoji: "🐕" },
  { key: "swim", emoji: "🏊" },
  { key: "woodwork", emoji: "🪚" },
  { key: "graduation" },
  { key: "sportsday" },
  { key: "firstpay" },
  { key: "bouquet" },
  { key: "moving" },
  { key: "railway" },
] as const satisfies readonly { key: string; emoji?: string }[];

export type PhotoKey = (typeof PHOTOS)[number]["key"];

export const SHARED_PHOTOS: string[] = PHOTOS.filter((p) => !("emoji" in p)).map((p) => p.key);

const KEYS = new Set<string>(PHOTOS.map((p) => p.key));
const BY_EMOJI = new Map<string, string>(
  PHOTOS.flatMap((p) => ("emoji" in p ? [[p.emoji as string, p.key] as [string, string]] : [])),
);

/** 같은 id면 늘 같은 수. 사진이 열 때마다 바뀌면 "내 사진"이 되지 못한다. */
function hash(text: string): number {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return h;
}

export function photoFor(item: { id: string; emoji?: string; photo?: string }): string {
  if (item.photo && KEYS.has(item.photo)) return item.photo;
  const byEmoji = item.emoji ? BY_EMOJI.get(item.emoji) : undefined;
  if (byEmoji) return byEmoji;
  return SHARED_PHOTOS[hash(item.id) % SHARED_PHOTOS.length];
}

export function photoSrc(key: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/photos/${key}.webp`;
}
```

- [ ] **Step 4: 확인** — `node --test tests/photos.test.mjs` → "모든 사진 파일이 있다"만 FAIL, 나머지 PASS. 이 테스트는 Task 4에서 통과한다. `npm run typecheck` → 0 errors.

- [ ] **Step 5: 커밋** — `lib/photos.ts tests/photos.test.mjs` / `항목마다 걸 사진을 고르는 규칙을 둔다`

---

### Task 4: 사진 24장 만들기 (힉스필드)

**Files:**
- Create: `public/photos/<key>.webp` ×24
- 스크래치(커밋 안 함): 원본 이미지, 변환 스크립트

**사용자 동의가 필요한 단계다. 크레딧을 쓰기 전에 반드시 멈추고 묻는다.**

- [ ] **Step 1: 모델·비용 확인** — `mcp__claude_ai_2__balance`로 잔액, `mcp__claude_ai_2__models_explore`(action: "recommend", 사실적인 필름 사진 느낌 정사각형 이미지)로 모델과 장당 비용을 확인한다.

- [ ] **Step 2: 사용자에게 보고하고 멈춘다** — "잔액 N, 24장 예상 M 크레딧. 진행할까요?" 동의 전에는 생성하지 않는다.

- [ ] **Step 3: 배치 생성** — `mcp__claude_ai_2__generate_image_batch`, 1:1. 모든 프롬프트에 공통 꼬리를 붙인다:
  `", warm analog film photograph, Kodak Portra 400, soft faded colors, gentle grain, natural light, nostalgic, no people's faces, no text, square composition"`
  장면(키: 프롬프트 앞부분):
  - mother: `a steaming home-cooked Korean meal on a small wooden table, an apron hanging in a cozy kitchen`
  - father: `an old bicycle with a rear seat parked beside a park bench under trees`
  - grandparent: `a Korean countryside house wooden porch (maru) with a teacup and afternoon sun`
  - sibling: `a childhood bunk bed with scattered jigsaw puzzle pieces on the floor`
  - spouse: `two coffee mugs on a windowsill in soft morning light`
  - child: `a child's sketchbook with crayon drawings and a pair of tiny shoes`
  - friend: `a Korean street food tent (pojangmacha) glowing at night, two glasses clinking, hands only`
  - blossom: `a cherry blossom lined path in spring with petals falling`
  - sea: `a summer beach with gentle waves and a straw hat on the sand`
  - travel: `view of an airplane wing through an airport window at golden hour`
  - hometown: `a winding country road toward a hometown village during a holiday`
  - books: `a well-worn bookshelf with an open book on a reading chair`
  - surf: `a surfboard standing on the sand with rolling waves behind`
  - guitar: `an acoustic guitar leaning against a wall next to a window`
  - snow: `a quiet snowy alley at dusk with warm street lamps`
  - dog: `a dog leash and a walking path in a park, seen from behind`
  - swim: `swimming pool lanes with sunlight rippling on the water`
  - woodwork: `a woodworking bench with hand tools and wood shavings`
  - graduation: `a graduation cap and a bouquet resting on a chair after the ceremony`
  - sportsday: `a school field on sports day with colorful flags and a relay baton`
  - firstpay: `a first paycheck envelope on a desk next to a small gift box`
  - bouquet: `a wedding bouquet resting on a wooden chair`
  - moving: `cardboard moving boxes in an empty sunlit room`
  - railway: `railway tracks stretching toward a sunset`
  `mcp__claude_ai_2__jobs_wait`로 기다린 뒤 `mcp__claude_ai_2__show_generation_by_ids`로 한 번에 보여 준다.

- [ ] **Step 4: 검수** — 사용자에게 보여 주고, 얼굴이 보이거나 글자가 섞였거나 마음에 안 드는 장만 다시 만든다(다시 만들기 전에도 비용을 말한다).

- [ ] **Step 5: 내려받아 변환** — 결과 URL을 스크래치 폴더에 `<key>.<ext>`로 받고, 스크래치에 스크립트를 두고 실행:

```python
# <scratchpad>/to_webp.py  — 사용: python to_webp.py <원본폴더> "<repo>/public/photos"
import sys
from pathlib import Path
from PIL import Image, ImageOps

src, dst = Path(sys.argv[1]), Path(sys.argv[2])
dst.mkdir(parents=True, exist_ok=True)
for f in sorted(src.iterdir()):
    if f.suffix.lower() not in {".png", ".jpg", ".jpeg", ".webp"}:
        continue
    img = ImageOps.fit(Image.open(f).convert("RGB"), (600, 600), Image.LANCZOS)
    out = dst / f"{f.stem}.webp"
    img.save(out, "WEBP", quality=72, method=6)
    print(out.name, out.stat().st_size // 1024, "KB")
```

장당 60KB를 넘으면 `quality`를 62로 낮춰 다시 돌린다.

- [ ] **Step 6: 확인** — `node --test tests/photos.test.mjs` → 전부 PASS. `du -ch public/photos/*.webp | tail -1` → 약 1MB 안팎.

- [ ] **Step 7: 커밋** — `public/photos` / `폴라로이드에 걸 사진 24장을 넣는다`

---

### Task 5: 폴라로이드·더미·팔레트 (`Polaroid`, `PhotoStack`, `globals.css`)

**Files:**
- Create: `components/Polaroid.tsx`, `components/PhotoStack.tsx`, `e2e/album.spec.ts`
- Modify: `app/globals.css` (팔레트·`.polaroid`·`.font-album`), `tailwind.config.ts`(변경 없음 — 토큰 이름 유지), `lib/themeColor.ts`, `app/manifest.ts:34-35`, `capacitor.config.ts:29`, `e2e/app.spec.ts:337-354`
- Modify: `app/page.tsx` (인연 `<ul>` 약 330-366행, 순간 grid 약 425-441행)

**Interfaces:**
- Consumes: Task 3 `photoFor`, `photoSrc`
- Produces:
  - `<Polaroid photo={key} size="sm" | "md" | "lg" tilt?={number}>{caption?}</Polaroid>`
  - `type StackCard = { id: string; href: string; photo: string; title: string; sentence: string; count: string; unit: string }`
  - `<PhotoStack label={string} cards={StackCard[]} />`

- [ ] **Step 1: 실패하는 E2E**

```ts
// e2e/album.spec.ts
import { expect, test } from "@playwright/test";

import type { Page } from "@playwright/test";

import { setUpProfile } from "./helpers";

async function addPerson(page: Page, name: string, age: string) {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill(name);
  await page.getByLabel("나이", { exact: true }).fill(age);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people/);
}

test("홈의 인연이 사진 더미로 걸리고, 넘기고, 누르면 상세로", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await addPerson(page, "할머니", "85");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(stack.getByText("1 / 2")).toBeVisible();
  // 적게 남은 사람이 맨 위.
  await expect(stack.getByRole("link").first()).toContainText("할머니");
  await stack.getByRole("button", { name: "다음" }).click();
  await expect(stack.getByText("2 / 2")).toBeVisible();
  await stack.getByRole("link", { name: /엄마/ }).click();
  await expect(page).toHaveURL(/\/people\/detail/);
});

test("한 명이면 넘기기 단추가 없다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/");
  const stack = page.getByRole("region", { name: "인연" });
  await expect(stack.getByRole("link", { name: /엄마/ })).toBeVisible();
  await expect(stack.getByRole("button", { name: "다음" })).toHaveCount(0);
});

test("긴 영문 이름이 화면을 옆으로 밀지 않는다", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "m".repeat(30), "60");
  await page.goto("/");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
```

- [ ] **Step 2: 실패 확인** — `npx playwright test --config e2e/playwright.config.ts e2e/album.spec.ts` → FAIL(region 없음)

- [ ] **Step 3: 팔레트 교체** — `app/globals.css`의 `:root`와 `.dark` 값만 바꾼다(변수 이름은 그대로):

```css
:root {
  /* 종이. 따뜻한 크림색 위에 갈색 먹. 대비는 주석 아래 값으로 axe가 확인한다. */
  --ink-50: 240 232 219;
  --ink-200: 226 216 202;
  --ink-400: 112 96 83;   /* 페이지 바탕 위 약 5.1:1 */
  --ink-600: 88 74 62;
  --ink-800: 58 47 39;
  --ink-900: 42 34 28;

  --accent-50: 252 240 232;
  --accent-100: 247 224 208;
  --accent-400: 214 130 92;
  --accent-500: 168 82 48;
  --accent-600: 150 72 42;

  --surface: 255 253 248;
  --page: 247 241 230;
  --on-ink: 255 253 248;

  --hero-bg: 251 233 220;
  --hero-line: 238 214 196;

  --toast-bg: 42 34 28;
  --toast-fg: 255 253 248;
  --toast-accent: 240 178 148;

  --danger-border: 240 196 190;
  --danger-bg: 252 240 236;
  --danger-fg: 190 40 30;

  /* 폴라로이드 테두리. */
  --frame: 255 253 248;
}

/* 밤의 앨범. 짙은 갈색 바탕에 같은 폴라로이드. */
.dark {
  --ink-50: 46 38 32;
  --ink-200: 72 60 50;
  --ink-400: 166 152 136;
  --ink-600: 204 192 176;
  --ink-800: 234 225 212;
  --ink-900: 247 240 230;

  --accent-50: 58 38 28;
  --accent-100: 80 52 38;
  --accent-400: 226 148 112;
  --accent-500: 233 162 128;
  --accent-600: 240 183 154;

  --surface: 38 31 26;
  --page: 28 22 18;
  --on-ink: 28 22 18;

  --hero-bg: 50 36 28;
  --hero-line: 74 54 42;

  --toast-bg: 240 232 219;
  --toast-fg: 42 34 28;
  --toast-accent: 154 71 38;

  --danger-border: 96 44 44;
  --danger-bg: 44 24 24;
  --danger-fg: 248 138 138;

  --frame: 58 49 42;
}
```

`@layer components` 안에 더하고, `.card`·`.input`·버튼의 둥글기를 올린다:

```css
  /* 폴라로이드. 각진 모서리, 아래가 넓은 테두리, 종이 그림자. */
  .polaroid {
    @apply block bg-[rgb(var(--frame))] p-2 pb-3 shadow-[0_4px_12px_rgba(42,34,28,0.16)];
  }

  .polaroid img {
    @apply block aspect-square w-full object-cover;
  }

  /* 사진 아래 이름과 문장. 웹폰트 없이 기기의 명조를 부른다. */
  .font-album {
    font-family: "Nanum Myeongjo", "AppleMyungjo", "Batang", "Hiragino Mincho ProN", "Songti SC", Georgia, serif;
  }
```

`.card`의 `rounded-2xl` → `rounded-3xl`, `.btn-primary`·`.btn-secondary`·`.btn-danger`·`.input`의 `rounded-xl` → `rounded-2xl`.

- [ ] **Step 4: 상태바·배경 색** — `lib/themeColor.ts`의 `light: "#f7f1e6"`, `dark: "#1c1612"`. `app/manifest.ts:34-35`와 `capacitor.config.ts:29`의 `"#121317"` → `"#1c1612"`. `e2e/app.spec.ts:337-354`의 `"#121317"` → `"#1c1612"`, `"#fbfaf8"` → `"#f7f1e6"`. `lib/shareCard.ts:66,76`의 폴백 `"#fbfaf8"` → `"#f7f1e6"`.

- [ ] **Step 5: `Polaroid`**

```tsx
// components/Polaroid.tsx
import { photoSrc } from "@/lib/photos";

const WIDTH = { sm: "w-12", md: "w-full", lg: "w-full max-w-[16rem]" } as const;

/*
 * 사진은 꾸밈이다(alt=""). 누구의 사진인지는 옆의 이름이 말한다 — 화면 낭독기가
 * "부엌 식탁 사진"을 읽어 봐야 어머니에 대해 알려 주는 것이 없다.
 */
export default function Polaroid({
  photo,
  size,
  tilt = 0,
  children,
}: {
  photo: string;
  size: keyof typeof WIDTH;
  tilt?: number;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={`polaroid motion-safe:transition-transform ${WIDTH[size]} ${size === "sm" ? "p-1 pb-1.5" : ""}`}
      style={tilt ? { transform: `rotate(${tilt}deg)` } : undefined}
    >
      <img src={photoSrc(photo)} alt="" loading="lazy" decoding="async" />
      {children}
    </span>
  );
}
```

`prefers-reduced-motion`에서는 globals.css의 기존 규칙이 전환을 끄고, 기울기는 Step 6의 `motion-reduce:` 클래스가 없앤다.

- [ ] **Step 6: `PhotoStack`**

```tsx
// components/PhotoStack.tsx
"use client";

import Link from "next/link";
import { useRef, useState } from "react";

import Polaroid from "@/components/Polaroid";
import { defineCopy, tr } from "@/lib/i18n";

export type StackCard = {
  id: string;
  href: string;
  photo: string;
  title: string;
  sentence: string;
  count: string;
  unit: string;
};

const COPY = defineCopy({
  ko: { prev: "이전", next: "다음" },
  en: { prev: "Previous", next: "Next" },
  ja: { prev: "前へ", next: "次へ" },
  es: { prev: "Anterior", next: "Siguiente" },
  zh: { prev: "上一张", next: "下一张" },
});

/** 뒤에 깔린 장의 기울기. 맨 위 장은 거의 바로 선다. */
const TILTS = [-1, 4, -5, 3, -3];

/*
 * 겹친 사진 더미. 한 장씩 크게 보고 옆으로 넘긴다.
 *
 * 넘기기는 브라우저의 가로 스크롤 + scroll-snap이 한다. 손가락으로 밀면 그대로 되고,
 * 라이브러리가 필요 없다. ‹ › 단추는 키보드·화면 낭독기용이며 같은 스크롤을 움직인다.
 * 뒤로 비치는 두 장은 꾸밈(aria-hidden)이다 — "더 있다"는 느낌만 준다.
 */
export default function PhotoStack({ label, cards }: { label: string; cards: StackCard[] }) {
  const t = tr(COPY);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const many = cards.length > 1;

  const go = (next: number) => {
    const el = track.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(cards.length - 1, next));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: "smooth" });
    setIndex(clamped);
  };

  return (
    <section role="region" aria-label={label} className="relative">
      {many && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-[12%] top-2 motion-reduce:hidden">
          <span className="polaroid absolute inset-x-0 h-64 rotate-[5deg]" />
          <span className="polaroid absolute inset-x-0 h-64 -rotate-[4deg]" />
        </div>
      )}
      <div
        ref={track}
        className="relative flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onScroll={(e) => {
          const el = e.currentTarget;
          setIndex(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {cards.map((card, i) => (
          <div key={card.id} className="w-full shrink-0 snap-center px-[12%] py-3">
            <Link href={card.href} prefetch={false} className="block">
              <Polaroid photo={card.photo} size="md" tilt={TILTS[i % TILTS.length]}>
                <span className="mt-2 block px-1">
                  <span className="font-album block text-sm text-ink-800">{card.title}</span>
                  <span className="font-album mt-0.5 block text-xs leading-relaxed text-ink-600">{card.sentence}</span>
                  <span className="numeral mt-1 block text-4xl leading-none text-ink-900">
                    {card.count}
                    <span className="ml-1 text-sm font-normal text-ink-600">{card.unit}</span>
                  </span>
                </span>
              </Polaroid>
            </Link>
          </div>
        ))}
      </div>
      {many && (
        <div className="mt-2 flex items-center justify-center gap-4">
          <button type="button" className="btn-quiet text-base" aria-label={t.prev} disabled={index === 0} onClick={() => go(index - 1)}>
            ‹
          </button>
          <span className="text-xs tabular-nums text-ink-600" aria-live="polite">
            {index + 1} / {cards.length}
          </span>
          <button type="button" className="btn-quiet text-base" aria-label={t.next} disabled={index === cards.length - 1} onClick={() => go(index + 1)}>
            ›
          </button>
        </div>
      )}
    </section>
  );
}
```

`Polaroid`의 `tilt`는 `motion-reduce`에서도 남는 인라인 스타일이므로, `Polaroid`의 `<span>` 클래스에 `motion-reduce:!transform-none`를 더한다.

- [ ] **Step 7: 홈에 걸기** — `app/page.tsx`:
  - import 추가: `import PhotoStack from "@/components/PhotoStack";`, `import { photoFor } from "@/lib/photos";`
  - 인연 `<ul className="divide-y ...">…</ul>` 전체를:

```tsx
          <PhotoStack
            label={t.people}
            cards={people.slice(0, 10).map(({ person, result }) => ({
              id: person.id,
              href: `/people/detail?id=${person.id}`,
              photo: photoFor(person),
              title: person.relation ? `${person.name} · ${person.relation}` : person.name,
              sentence: copy.meetingSentence(person.name, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
            }))}
          />
```

  - 순간 `<div className="grid grid-cols-2 gap-2">…</div>` 전체를:

```tsx
          <PhotoStack
            label={t.moments}
            cards={moments.slice(0, 10).map(({ moment, result }) => ({
              id: moment.id,
              href: `/moments/detail?id=${moment.id}`,
              photo: photoFor(moment),
              title: moment.title,
              sentence: copy.momentSentence(moment.title, formatCount(result.total)),
              count: formatCount(result.total),
              unit: t.times,
            }))}
          />
```

  - 섹션 제목 `<h2>`는 그대로 둔다(region 이름과 같은 말이라 화면 낭독기가 두 번 읽지만, h2는 제목 탐색용이라 둔다). 인연 섹션 위 주석("카드 네 장을 쌓지 않는다…")은 지운다.
  - `t.relationFallback`이 이제 쓰이지 않으면 다섯 언어에서 지운다(typecheck는 안 잡으므로 `grep -n relationFallback app/page.tsx`로 확인).

- [ ] **Step 8: 확인** — `npm run typecheck`, `npm test`, `npm run test:e2e` → 전부 PASS. axe가 대비를 잡으면 해당 `--ink-*` 값을 한 단계씩 진하게(밝은 쪽) / 밝게(어두운 쪽) 조정한다. 기존 E2E가 홈의 인연 목록 구조(`li`)에 기대던 곳이 깨지면 `getByRole("region", { name: "인연" })` 기준으로 고친다.

- [ ] **Step 9: 눈으로 확인** — `npm run build && npm start 3123` 후 Playwright MCP로 `/`를 밝게·어둡게 모바일 폭(393px) 스크린숏을 찍어 사용자에게 보여 준다.

- [ ] **Step 10: 커밋** — 위 파일 전부 / `홈을 폴라로이드 더미로 바꾸고 종이 팔레트를 입힌다`

---

### Task 6: 목록·상세의 폴라로이드, 편집의 사진 바꾸기

**Files:**
- Create: `components/PhotoPicker.tsx`
- Modify: `lib/types.ts:90`(Person), `lib/types.ts:153`(Moment), `lib/store.ts` `repairCommon`(약 158행), `app/people/page.tsx:312`, `app/moments/page.tsx:180`, `components/PersonView.tsx:206`, `components/MomentView.tsx:148`, `components/PersonEditor.tsx`(`card space-y-4` 첫 칸), `components/MomentEditor.tsx:262-275`
- Test: `e2e/album.spec.ts`(추가), `tests/fuzz.test.mjs`는 그대로 통과해야 함

**Interfaces:**
- Consumes: Task 3 `PHOTOS`, `photoFor`, `photoSrc`; Task 5 `Polaroid`
- Produces: `Person.photo?: string`, `Moment.photo?: string`; `<PhotoPicker value={string} onChange={(key: string) => void} />`

- [ ] **Step 1: 실패하는 E2E** — `e2e/album.spec.ts`에 추가:

```ts
import { readState } from "./helpers";

test("사진을 바꾸면 저장되고 다시 열어도 그대로", async ({ page }) => {
  await setUpProfile(page, 30);
  await addPerson(page, "엄마", "60");
  await page.goto("/people/");
  await page.getByRole("link", { name: /엄마/ }).click();
  await page.getByRole("button", { name: "고치기" }).click();
  await page.getByRole("radio", { name: "기찻길" }).check();
  await page.getByRole("button", { name: "저장하기" }).click();
  const state = await readState(page);
  expect((state!.people as { photo?: string }[])[0].photo).toBe("railway");
});
```

(버튼 이름 "고치기"·"저장하기"는 기존 상세 화면의 이름을 따른다. 다르면 `grep -n "edit\|save" components/PersonView.tsx`로 확인해 맞춘다.)

- [ ] **Step 2: 실패 확인** — 해당 테스트 FAIL(radio 없음)

- [ ] **Step 3: 타입·복구** — `lib/types.ts`의 `Person`과 `Moment`에서 `emoji?: string;` 아래에:

```ts
  /** 폴라로이드 사진 키(lib/photos.ts). 없으면 이모지·id로 고른다. */
  photo?: string;
```

`lib/store.ts`의 `repairCommon` 반환 객체에 `emoji: text(item.emoji),` 아래로 `photo: text(item.photo),`. (모르는 키는 `photoFor`가 공용 사진으로 떨어뜨리므로 여기서 걸러 내지 않는다.)

- [ ] **Step 4: `PhotoPicker`**

```tsx
// components/PhotoPicker.tsx
"use client";

import { useId } from "react";

import { defineCopy, tr } from "@/lib/i18n";
import { PHOTOS, photoSrc } from "@/lib/photos";

/* 화면 낭독기와 툴팁이 읽을 사진 이름. 키 순서는 lib/photos.ts의 PHOTOS와 같다. */
const NAMES = defineCopy<string[]>({
  ko: ["밥상", "자전거", "툇마루", "이층침대", "머그잔 둘", "스케치북", "포장마차", "벚꽃길", "여름 바다", "공항 창밖", "고향길", "책장", "서핑", "기타", "눈 온 골목", "산책", "수영장", "목공", "졸업식", "운동회", "첫 월급", "부케", "이삿짐", "기찻길"],
  en: ["Family meal", "Bicycle", "Porch", "Bunk bed", "Two mugs", "Sketchbook", "Street tent", "Cherry blossoms", "Summer sea", "Airport window", "Road home", "Bookshelf", "Surfing", "Guitar", "Snowy alley", "Walk", "Pool", "Woodwork", "Graduation", "Sports day", "First paycheck", "Bouquet", "Moving boxes", "Railway"],
  ja: ["食卓", "自転車", "縁側", "二段ベッド", "マグカップ", "スケッチブック", "屋台", "桜並木", "夏の海", "空港の窓", "帰り道", "本棚", "サーフィン", "ギター", "雪の路地", "散歩", "プール", "木工", "卒業式", "運動会", "初任給", "ブーケ", "引っ越し", "線路"],
  es: ["Comida en familia", "Bicicleta", "Porche", "Litera", "Dos tazas", "Cuaderno", "Puesto callejero", "Cerezos", "Mar de verano", "Ventana del aeropuerto", "Camino a casa", "Estantería", "Surf", "Guitarra", "Callejón nevado", "Paseo", "Piscina", "Carpintería", "Graduación", "Día deportivo", "Primer sueldo", "Ramo", "Mudanza", "Vías del tren"],
  zh: ["家常饭", "自行车", "檐廊", "双层床", "两个杯子", "素描本", "路边摊", "樱花路", "夏日海边", "机场窗外", "回乡路", "书架", "冲浪", "吉他", "雪中小巷", "散步", "泳池", "木工", "毕业典礼", "运动会", "第一份工资", "捧花", "搬家", "铁路"],
});

const COPY = defineCopy({
  ko: { legend: "사진" },
  en: { legend: "Photo" },
  ja: { legend: "写真" },
  es: { legend: "Foto" },
  zh: { legend: "照片" },
});

export default function PhotoPicker({ value, onChange }: { value: string; onChange: (key: string) => void }) {
  const names = tr(NAMES);
  const group = useId();
  return (
    <fieldset>
      <legend className="label">{tr(COPY).legend}</legend>
      <div className="grid grid-cols-6 gap-2">
        {PHOTOS.map(({ key }, i) => (
          <label key={key} title={names[i]} className="cursor-pointer">
            <input type="radio" name={group} value={key} checked={value === key} onChange={() => onChange(key)} className="peer sr-only" aria-label={names[i]} />
            <img src={photoSrc(key)} alt="" loading="lazy" className="aspect-square w-full rounded-md object-cover opacity-80 ring-offset-2 ring-offset-surface transition peer-checked:opacity-100 peer-checked:ring-2 peer-checked:ring-ink-800 peer-focus-visible:ring-2 peer-focus-visible:ring-ink-400" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 5: 편집기에 넣기**
  - `components/PersonEditor.tsx`: `import PhotoPicker from "@/components/PhotoPicker";`, `import { photoFor } from "@/lib/photos";`. 입력 `card space-y-4`의 첫 자식으로:
    ```tsx
    <PhotoPicker value={photoFor(draft)} onChange={(photo) => setDraft({ ...draft, photo })} />
    ```
  - `components/MomentEditor.tsx`: 같은 import, 이모지 칸이 있는 grid(262행 근처) 바로 위에 같은 한 줄.

- [ ] **Step 6: 목록 썸네일**
  - `app/people/page.tsx:312` `<span className="text-2xl">{person.emoji ?? "🫧"}</span>` →
    `<Polaroid photo={photoFor(person)} size="sm" />` (+ `Polaroid`, `photoFor` import)
  - `app/moments/page.tsx:180` `<span className="text-2xl">{moment.emoji ?? "◦"}</span>` →
    `<Polaroid photo={photoFor(moment)} size="sm" />` (+ import)

- [ ] **Step 7: 상세의 큰 사진**
  - `components/PersonView.tsx` 반환의 `<div className="space-y-5">` 첫 자식으로:
    ```tsx
    <div className="flex justify-center pt-2">
      <Polaroid photo={photoFor(person)} size="lg" tilt={-2}>
        <span className="font-album mt-2 block px-1 text-center text-sm text-ink-800">{person.name}</span>
      </Polaroid>
    </div>
    ```
  - `components/MomentView.tsx`도 같은 자리에 `moment`/`moment.title`로.

- [ ] **Step 8: 확인** — `npm run typecheck`, `npm test`(fuzz 포함), `npm run test:e2e` → 전부 PASS. `FUZZ=1 npx playwright test --config e2e/playwright.config.ts e2e/fuzz.spec.ts` → PASS(모르는 `photo` 값도 섞여 들어간다).

- [ ] **Step 9: 커밋** — 위 파일 전부 / `목록과 상세에 폴라로이드를 걸고, 사진을 바꿀 수 있게 한다`

---

### Task 7: 마무리 — 문서와 전체 검증

**Files:**
- Modify: `README.md`(무엇이 되나 목록), `docs/PLAN.md` §4(화면), §5(동의), §10(한계)

- [ ] **Step 1: 문서** — README "무엇이 되나"에 두 줄:
  - `- **사진첩** — 인연과 순간을 폴라로이드로 겹쳐 걸고 한 장씩 넘겨 본다. 사진은 앱에 넣어 둔 24장 중에서 고르고, 내 사진은 받지 않는다`
  - `- **개인정보 동의** — 처음 쓸 때 안내를 읽고 동의해야 시작한다. 문구가 바뀌면 다시 묻는다`
  PLAN.md §10 "알려진 한계"에: `- **동의를 저장할 수 없는 환경**(시크릿 모드 등)에서는 방문할 때마다 다시 묻는다. 갇히지 않게 이번 방문만 들여보낸다.`

- [ ] **Step 2: 전체 검증** — `npm run typecheck && npm test && npm run test:e2e` 출력 전부를 확인한다. 하나라도 실패하면 superpowers:systematic-debugging으로.

- [ ] **Step 3: 커밋** — `README.md docs/PLAN.md` / `사진첩과 동의 화면을 문서에 적는다`

- [ ] **Step 4: 푸시는 사용자에게 묻는다** — 푸시하면 GitHub Pages에 바로 배포된다.
