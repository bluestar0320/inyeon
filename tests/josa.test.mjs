import assert from "node:assert/strict";
import { test } from "node:test";

import { josa } from "../lib/format.ts";

test("받침에 맞춰 조사를 고른다", () => {
  assert.equal(josa("어머니", "와/과"), "어머니와");
  assert.equal(josa("아들", "와/과"), "아들과");
  assert.equal(josa("서핑", "을/를"), "서핑을");
  assert.equal(josa("벚꽃", "은/는"), "벚꽃은");
  assert.equal(josa("아이", "이/가"), "아이가");
});

test("한글로 끝나지 않으면 둘 다 적는다", () => {
  assert.equal(josa("Mom", "와/과"), "Mom와(과)");
  assert.equal(josa("", "을/를"), "을(를)");
});
