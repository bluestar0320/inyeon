import { expect, test } from "@playwright/test";

import { STORAGE_KEY, clearState, setUpProfile } from "./helpers";

/**
 * 헤드리스 브라우저에는 공유 시트가 없으므로 내려받기 경로를 탄다.
 * 실제로 PNG가 떨어지는지, 파일 이름이 쓸 만한지, 그림이 비어 있지 않은지를 본다.
 */
test.beforeEach(async ({ page }) => {
  await clearState(page);
  await setUpProfile(page, 38);
});

async function addMother(page: import("@playwright/test").Page) {
  await page.goto("/people/new");
  await page.getByRole("button", { name: "어머니", exact: true }).click();
  await page.getByLabel("나이", { exact: true }).fill("68");
  await page.waitForTimeout(300);
}

test("인연 결과를 이미지로 저장한다", async ({ page }) => {
  await addMother(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toMatch(/^어머니-\d+번\.png$/);
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);

  // PNG 서명이 맞는지, 그리고 빈 이미지가 아닌지.
  expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  expect(bytes.length).toBeGreaterThan(5000);
});

test("저장한 카드는 1080×1350이다", async ({ page }) => {
  await addMother(page);

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);

  // PNG의 IHDR은 서명 8바이트 + 길이 4 + 타입 4 다음에 폭·높이가 온다.
  expect(bytes.readUInt32BE(16)).toBe(1080);
  expect(bytes.readUInt32BE(20)).toBe(1350);
});

test("성장 캘린더는 남은 여름을 카드로 내보낸다", async ({ page }) => {
  await page.goto("/people/new");
  await page.getByRole("button", { name: "자녀", exact: true }).click();
  await page.getByLabel("이름").fill("도윤");
  await page.getByLabel("나이", { exact: true }).fill("7");
  // 성장 캘린더는 입력 화면이 아니라 상세에 저절로 뜬다.
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/detail/);

  const downloadPromise = page.waitForEvent("download");
  // 결과 패널에도 단추가 있으므로 캘린더 안의 것을 고른다.
  await page
    .locator(".card")
    .filter({ hasText: "성장 캘린더" })
    .getByTestId("save-card")
    .click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("도윤-남은여름-13번.png");
});

test("순간과 결혼 계획에서도 저장할 수 있다", async ({ page }) => {
  await page.goto("/moments/new");
  await page.getByRole("button", { name: "🌸 벚꽃 보기" }).click();
  await page.waitForTimeout(300);
  const momentDownload = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  // 공백은 하이픈으로 바뀐다(파일 이름에서 공백은 다루기 번거롭다).
  expect((await momentDownload).suggestedFilename()).toMatch(/^벚꽃-보기-\d+번\.png$/);

  await page.goto("/marriage");
  await page.waitForTimeout(400);
  const marriageDownload = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  expect((await marriageDownload).suggestedFilename()).toMatch(/^결혼계획-\d+번\.png$/);
});

test("계산이 안 되는 상태에서는 저장 단추를 띄우지 않는다", async ({ page }) => {
  // 나이를 안 넣으면 결과가 "-"이고, 그때는 내보낼 것이 없다.
  await page.goto("/people/new");
  await page.getByLabel("이름").fill("이름만");
  await page.waitForTimeout(300);
  await expect(page.getByTestId("save-card")).toHaveCount(0);
});

test("순간 카드에는 그 순간의 사진이 들어간다", async ({ page }) => {
  await page.goto("/moments/new");
  await page.getByRole("button", { name: "🌸 벚꽃 보기" }).click();
  await page.waitForTimeout(300);
  const photo = page.waitForRequest((r) => /\/photos\/blossom(-\d)?\.webp/.test(r.url()));
  const download = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  await photo;
  const png = await (await download).path();
  const { size } = await import("node:fs").then((fs) => fs.statSync(png!));
  // 사진이 들어간 카드는 글자만 있는 카드보다 훨씬 무겁다.
  expect(size).toBeGreaterThan(200_000);
});

test("내 사진을 넣으면 폴라로이드와 카드에 들어가고, 이 기기에만 저장된다", async ({ page }) => {
  await addMother(page);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people\/detail/);
  await page.getByTestId("own-photo").setInputFiles("public/photos/railway.webp");
  const polaroid = page.locator(".polaroid img").first();
  await expect(polaroid).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  // 사진은 기록(localStorage)이 아니라 IndexedDB에 들어가고, 새로고침해도 남는다.
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).people[0].ownPhoto ?? null, STORAGE_KEY)).toBeNull();
  await page.reload();
  await expect(polaroid).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  const download = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  expect((await download).suggestedFilename()).toMatch(/^어머니-\d+번\.png$/);
  await page.getByRole("button", { name: "원래 사진으로" }).click();
  await expect(polaroid).toHaveAttribute("src", /\/photos\/mother(-\d)?\.webp$/);
  // IndexedDB에서도 지워져서, 새로고침해도 되살아나지 않는다.
  await page.waitForTimeout(300);
  await page.reload();
  await expect(polaroid).toHaveAttribute("src", /\/photos\/mother(-\d)?\.webp$/);
});

test("기록 안에 들어 있던 옛 사진은 IndexedDB로 옮기고, 내보내기에는 사진이 같이 들어간다", async ({ page }) => {
  const photo = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ==";
  await page.evaluate(({ key, photo }) => {
    const v = JSON.parse(localStorage.getItem(key)!);
    v.people = [{ id: "x", name: "엄마", ageYears: 60, lifeExpectancy: 85, frequency: { count: 1, unit: "month" }, filters: [],
      ownPhoto: photo, createdAt: "", updatedAt: "" }];
    localStorage.setItem(key, JSON.stringify(v));
  }, { key: STORAGE_KEY, photo });
  await page.goto("/people/detail/?id=x");
  await expect(page.locator(".polaroid img").first()).toHaveAttribute("src", photo);
  await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).people[0].ownPhoto ?? null, STORAGE_KEY)).toBeNull();
  await page.reload();
  await expect(page.locator(".polaroid img").first()).toHaveAttribute("src", photo);

  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /내보내기/ }).first().click();
  const file = await (await download).path();
  const exported = JSON.parse(await import("node:fs").then((fs) => fs.readFileSync(file!, "utf8")));
  expect(exported.people[0].ownPhoto).toBe(photo);
});

test("IndexedDB를 못 쓰는 환경에서는 사진을 예전처럼 기록 안에 둔다", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "indexedDB", { get: () => undefined }));
  await page.reload();
  await addMother(page);
  await page.getByRole("button", { name: "추가하기" }).click();
  await page.waitForURL(/\/people\/detail/);
  await page.getByTestId("own-photo").setInputFiles("public/photos/railway.webp");
  await expect(page.locator(".polaroid img").first()).toHaveAttribute("src", /^data:image\/jpeg;base64,/);
  const saved = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!).people[0].ownPhoto, STORAGE_KEY);
  expect(saved).toMatch(/^data:image\/jpeg;base64,/);
});

test("불러오기로 들어온 이상한 사진 값은 버린다", async ({ page }) => {
  await page.evaluate((key) => {
    const v = JSON.parse(localStorage.getItem(key)!);
    v.people = [{ id: "x", name: "엄마", ageYears: 60, lifeExpectancy: 85, frequency: { count: 1, unit: "month" }, filters: [],
      ownPhoto: "javascript:alert(1)", createdAt: "", updatedAt: "" }];
    localStorage.setItem(key, JSON.stringify(v));
  }, STORAGE_KEY);
  await page.goto("/people/detail/?id=x");
  await expect(page.locator(".polaroid img").first()).toHaveAttribute("src", /\/photos\//);
});

test("저장한 카드는 얼룩진 편지지 위에 그린다", async ({ page }) => {
  await addMother(page);
  const download = page.waitForEvent("download");
  await page.getByTestId("save-card").first().click();
  const bytes = Buffer.concat(await Array.fromAsync(await (await download).createReadStream()));
  // 단색 카드(#f7f1e6)는 붉은빛과 푸른빛 차이가 작고, 바랜 종이 가장자리는 누렇다.
  const yellow = await page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement("canvas");
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    const [r, , b] = ctx.getImageData(10, 10, 1, 1).data;
    return r - b;
  }, bytes.toString("base64"));
  expect(yellow).toBeGreaterThan(40);
});

test("다른 창에서 고치면 이 화면도 따라 바뀌고, 그렇다고 한 줄 알린다", async ({ page, context }) => {
  await setUpProfile(page, 35);
  await page.goto("/people");
  const other = await context.newPage();
  await other.goto("/people/new");
  await other.getByRole("button", { name: "어머니", exact: true }).click();
  await other.getByLabel("나이", { exact: true }).fill("60");
  await other.getByRole("button", { name: "추가하기" }).click();
  await other.waitForURL(/\/people\/detail/);

  await expect(page.getByText("다른 창에서 고친 내용이 있어서")).toBeVisible();
  await expect(page.locator("a.card").first()).toContainText("어머니");
  await page.getByRole("button", { name: "알겠어요" }).click();
  await expect(page.getByText("다른 창에서 고친 내용이 있어서")).toHaveCount(0);
  // 자기가 저장한 창에는 뜨지 않는다.
  await expect(other.getByText("다른 창에서 고친 내용이 있어서")).toHaveCount(0);
});
