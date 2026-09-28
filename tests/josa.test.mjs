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

test("영문 이름은 한국어로 읽는 소리로 고른다", () => {
  assert.equal(josa("Tom", "와/과"), "Tom과");
  assert.equal(josa("Bill", "을/를"), "Bill을");
  assert.equal(josa("Jack", "은/는"), "Jack은");
  assert.equal(josa("King", "이/가"), "King이");
  assert.equal(josa("Kate", "와/과"), "Kate와");
  assert.equal(josa("Chris", "을/를"), "Chris를");
  assert.equal(josa("Peter", "은/는"), "Peter는");
  assert.equal(josa("Amy", "이/가"), "Amy가");
});

test("숫자는 한국어로 읽는다", () => {
  assert.equal(josa("친구1", "와/과"), "친구1과");
  assert.equal(josa("친구2", "와/과"), "친구2와");
});

test("읽는 법을 모르는 글자만 둘 다 적는다", () => {
  assert.equal(josa("王", "와/과"), "王와(과)");
  assert.equal(josa("", "을/를"), "을(를)");
});
