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
