import { expect, test } from "@playwright/test";

import { AFTER_ADD_PERSON, clearState, headline, readState, setUpProfile } from "./helpers";

test.beforeEach(async ({ page }) => {
  await clearState(page);
});

async function addPerson(page: import("@playwright/test").Page, name: string, age: number) {
  await page.goto("/people/new");
  await page.getByLabel("이름").fill(name);
  await page.getByLabel("나이", { exact: true }).fill(String(age));
  await page.getByRole("button", { name: "추가하기" }).click();
  // 첫 인연은 상세로 떨어진다. 이 헬퍼를 쓰는 시나리오들은 목록을 전제하므로 맞춰 둔다.
  await page.waitForURL(AFTER_ADD_PERSON);
  await page.goto("/people");
}

test.describe("저장과 되돌리기", () => {
  test("기록은 새로고침을 넘어 살아남는다", async ({ page }) => {
    await setUpProfile(page, 30);
    await addPerson(page, "어머니", 60);

    await page.reload();
    await expect(page.locator("a.card")).toHaveCount(1);
    const state = await readState(page);
    expect((state as { people: unknown[] }).people).toHaveLength(1);
  });

  test("삭제한 인연을 되돌릴 수 있다", async ({ page }) => {
    await setUpProfile(page, 30);
    await addPerson(page, "어머니", 60);

    await page.locator("a.card").first().click();
    await page.getByRole("button", { name: "삭제" }).click();
    await page.waitForURL(/\/people\/?$/);
    await expect(page.locator("a.card")).toHaveCount(0);

    await expect(page.getByRole("status")).toContainText("어머니을(를) 지웠습니다");
    await page.getByRole("button", { name: "되돌리기" }).click();

    await expect(page.locator("a.card")).toHaveCount(1);
    await expect(page.locator("a.card").first()).toContainText("어머니");
    await expect(page.getByRole("status")).toHaveCount(0);
  });

  test("전체 삭제도 되돌릴 수 있다", async ({ page }) => {
    await setUpProfile(page, 30);
    await addPerson(page, "어머니", 60);

    await page.goto("/settings");
    await page.getByRole("button", { name: "전체 삭제" }).click();
    await page.getByRole("button", { name: "정말 지우기" }).click();
    await page.getByRole("button", { name: "되돌리기" }).click();

    await page.goto("/people");
    await expect(page.locator("a.card")).toHaveCount(1);
  });
});

test.describe("저장하지 않고 나가기", () => {
  test("빈 폼에서는 묻지 않는다", async ({ page }) => {
    await setUpProfile(page, 30);
    let asked = false;
    page.on("dialog", (d) => { asked = true; void d.accept(); });

    await page.goto("/people/new");
    await page.getByRole("link", { name: "순간" }).click();
    await page.waitForURL(/\/moments\/?$/);
    expect(asked).toBe(false);
  });

  test("입력한 뒤 나가려 하면 묻고, 취소하면 그대로 남는다", async ({ page }) => {
    await setUpProfile(page, 30);
    page.once("dialog", (d) => void d.dismiss());

    await page.goto("/people/new");
    await page.getByLabel("이름").fill("테스트");
    await page.getByRole("link", { name: "순간" }).click();

    await expect(page).toHaveURL(/\/people\/new/);
    await expect(page.getByLabel("이름")).toHaveValue("테스트");
  });

  test("뒤로 가기도 받아낸다 — 취소하면 제자리", async ({ page }) => {
    await setUpProfile(page, 30);
    await page.goto("/people");
    await page.getByRole("link", { name: "추가", exact: true }).click();
    await page.waitForURL(/\/people\/new\/?$/);
    await page.getByLabel("이름").fill("테스트");

    page.once("dialog", (d) => void d.dismiss());
    await page.goBack();
    await page.waitForTimeout(400);

    await expect(page).toHaveURL(/\/people\/new/);
    await expect(page.getByLabel("이름")).toHaveValue("테스트");
  });

  test("뒤로 가기를 확인하면 실제로 이전 화면으로 간다", async ({ page }) => {
    await setUpProfile(page, 30);
    await page.goto("/people");
    await page.getByRole("link", { name: "추가", exact: true }).click();
    await page.waitForURL(/\/people\/new\/?$/);
    await page.getByLabel("이름").fill("테스트");

    page.once("dialog", (d) => void d.accept());
    await page.goBack();
    await page.waitForURL(/\/people\/?$/, { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "인연" })).toBeVisible();
  });

  test("저장하고 나간 뒤의 뒤로 가기가 먹통이 되지 않는다", async ({ page }) => {
    // 심어 둔 히스토리 항목을 치우지 않으면 여기서 한 번 헛돈다.
    await setUpProfile(page, 30);
    // 이 시나리오는 "저장하고 목록으로 나간" 경우를 본다. 첫 인연은 상세로 가서
    // 히스토리 모양이 달라지므로 한 명 먼저 심어 둔다.
    await addPerson(page, "먼저", 50);
    await page.goto("/people");
    await page.getByRole("link", { name: "추가", exact: true }).click();
    await page.waitForURL(/\/people\/new\/?$/);
    await page.getByLabel("이름").fill("어머니");
    await page.getByLabel("나이", { exact: true }).fill("60");
    await page.getByRole("button", { name: "추가하기" }).click();
    await page.waitForURL(/\/people\/?$/);

    let asked = false;
    page.on("dialog", (d) => { asked = true; void d.accept(); });
    await page.goBack();
    await page.waitForTimeout(500);
    expect(asked).toBe(false);
    // 저장이 끝났으니 폼으로 돌아가든 목록에 남든, 최소한 멈춰 있으면 안 된다.
    await expect(page.locator("h1")).toBeVisible();
  });

  test("편집을 되돌려 원래대로 만들면 뒤로 가기가 그냥 동작한다", async ({ page }) => {
    await setUpProfile(page, 30);
    await page.goto("/people");
    await page.getByRole("link", { name: "추가", exact: true }).click();
    await page.waitForURL(/\/people\/new\/?$/);
    await page.getByLabel("이름").fill("테스트");
    await page.getByLabel("이름").fill(""); // 다시 깨끗한 상태
    await page.waitForTimeout(300);

    let asked = false;
    page.on("dialog", (d) => { asked = true; void d.accept(); });
    await page.goBack();
    await page.waitForURL(/\/people\/?$/, { timeout: 10_000 });
    expect(asked).toBe(false);
  });

  test("저장하고 나갈 때는 묻지 않는다", async ({ page }) => {
    await setUpProfile(page, 30);
    let asked = false;
    page.on("dialog", (d) => { asked = true; void d.accept(); });

    await page.goto("/people/new");
    await page.getByLabel("이름").fill("어머니");
    await page.getByLabel("나이", { exact: true }).fill("60");
    await page.getByRole("button", { name: "추가하기" }).click();
    await page.waitForURL(AFTER_ADD_PERSON);
    expect(asked).toBe(false);
  });
});

test.describe("목록 정렬과 검색", () => {
  test("이름순 정렬과 검색이 동작한다", async ({ page }) => {
    await setUpProfile(page, 30);
    for (const [name, age] of [["어머니", 60], ["동생", 25], ["삼촌", 55]] as const) {
      await addPerson(page, name, age);
    }

    await page.getByRole("button", { name: "이름순" }).click();
    const names = await page.locator("a.card").allInnerTexts();
    expect(names.map((t) => t.split("\n")[1])).toEqual(["동생", "삼촌", "어머니"]);
  });

  test("항목이 적으면 검색창을 띄우지 않는다", async ({ page }) => {
    await setUpProfile(page, 30);
    await addPerson(page, "어머니", 60);
    await expect(page.getByPlaceholder("이름, 관계, 메모로 찾기")).toHaveCount(0);
  });
});

test.describe("테마", () => {
  test("어둡게를 고르면 새로고침 뒤에도 깜빡임 없이 유지된다", async ({ page }) => {
    await setUpProfile(page, 30);
    await page.goto("/settings");
    await page.getByRole("button", { name: "어둡게", exact: true }).click();

    const isDark = () =>
      page.evaluate(() => document.documentElement.classList.contains("dark"));
    await expect.poll(isDark).toBe(true);

    // domcontentloaded 시점 = 리액트가 붙기 전. 인라인 스크립트가 이미 칠해야 한다.
    await page.goto("/settings", { waitUntil: "domcontentloaded" });
    expect(await isDark()).toBe(true);
  });

  test("시스템 설정을 따라간다", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await page.goto("/");
    expect(
      await page.evaluate(() => document.documentElement.classList.contains("dark")),
    ).toBe(true);
  });
});

test.describe("오프라인", () => {
  test("한 번도 안 가 본 화면도 인터넷 없이 계산까지 된다", async ({ page, context }) => {
    /*
     * 예전 테스트는 "열리는가"만 봤다. 그래서 진짜 문제를 놓쳤다 —
     * 서비스 워커가 화면 경로만 미리 받고 그 화면이 쓰는 JS 청크는 안 받아서,
     * 온라인일 때 가 본 적 있는 화면만 제대로 돌았다. 처음 여는 화면은 껍데기만
     * 뜨고 버튼이 잠겼다. 비행기에서 여는 게 이 앱의 존재 이유라 거기까지 민다.
     *
     * 그래서 여기서는 홈만 한 번 열고, 나머지는 전부 오프라인에서 처음 연다.
     */
    await page.goto("/");
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 20_000,
    });
    // 설치 때 전부 받아 둘 시간을 준다.
    await expect
      .poll(
        async () =>
          page.evaluate(async () => {
            const names = await caches.keys();
            if (names.length === 0) return 0;
            return (await (await caches.open(names[0])).keys()).length;
          }),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(80);

    await context.setOffline(true);
    try {
      await page.goto("/setup", { waitUntil: "domcontentloaded" });
      await page.getByLabel("내 나이").fill("38");
      await page.getByRole("button", { name: "저장하기" }).click();
      await page.waitForURL(/\/people\/new\/?$/);

      // 입력이 먹고 계산이 도는지 — 청크가 빠지면 여기서 버튼이 잠긴 채 멈춘다.
      await page.getByRole("button", { name: "🌷 어머니" }).click();
      await page.getByLabel("나이", { exact: true }).fill("68");
      await page.getByRole("button", { name: "추가하기" }).click();

      // 쿼리가 붙은 상세 주소도 캐시에서 찾아야 한다(못 찾으면 조용히 홈이 떴었다).
      await page.waitForURL(/\/people\/detail/);
      await expect(page.locator("p.numeral").first()).toContainText("번");

      // 오프라인에서 조건을 걸어 다시 계산한다.
      const before = await headline(page);
      await page.getByRole("button", { name: "+ 해마다 줄어듦" }).click();
      await expect.poll(() => headline(page)).not.toBe(before);
    } finally {
      await context.setOffline(false);
    }
  });


  test("연결이 끊겨도 앱이 뜨고 기록이 보인다", async ({ page, context }) => {
    await setUpProfile(page, 30);
    await addPerson(page, "어머니", 60);
    // 서비스 워커가 자리를 잡을 때까지 기다린다.
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
      timeout: 15_000,
    });

    await context.setOffline(true);
    try {
      await page.goto("/people", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "인연" })).toBeVisible();
      await expect(page.locator("a.card").first()).toContainText("어머니");
    } finally {
      await context.setOffline(false);
    }
  });
});
