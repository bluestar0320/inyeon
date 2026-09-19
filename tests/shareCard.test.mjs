import assert from "node:assert/strict";
import { test } from "node:test";

import { safeFileName, truncateToWidth, valueFontSize } from "../lib/shareCard.ts";

/** 글자 하나를 10px로 보는 가짜 측정기. 실제 폰트 없이 자르기 규칙만 확인한다. */
const fakeCtx = (perChar = 10) => ({
  measureText: (text) => ({ width: text.length * perChar }),
});

test("들어가는 글자는 건드리지 않는다", () => {
  assert.equal(truncateToWidth(fakeCtx(), "어머니", 100), "어머니");
});

test("넘치는 글자는 줄임표를 붙여 자른다", () => {
  const out = truncateToWidth(fakeCtx(), "어머니와 남은 만남입니다", 60);
  assert.ok(out.endsWith("…"));
  assert.ok(out.length * 10 <= 60, `잘린 뒤에도 넘침: "${out}"`);
});

test("아주 좁아도 최소 한 글자는 남긴다 — 빈 카드가 되면 안 된다", () => {
  const out = truncateToWidth(fakeCtx(), "어머니", 1);
  assert.ok(out.length >= 2, out); // 글자 하나 + 줄임표
});

test("숫자가 길수록 글자를 줄여 카드 밖으로 나가지 않게 한다", () => {
  const sizes = ["232", "3,392", "14,589", "123,456"].map(valueFontSize);
  for (let i = 1; i < sizes.length; i += 1) {
    assert.ok(sizes[i] < sizes[i - 1], `${i}번째에서 안 줄어듦: ${sizes.join(", ")}`);
  }
  // 쉼표는 자릿수로 세지 않는다.
  assert.equal(valueFontSize("232"), valueFontSize("999"));
});

test("파일 이름에서 못 쓰는 글자를 걸러 낸다", () => {
  assert.equal(safeFileName(["어머니", "232번"]), "어머니-232번.png");
  assert.equal(safeFileName(['어머니/아버지 "둘"', "10번"]), "어머니아버지-둘-10번.png");
  assert.equal(safeFileName(["a:b*c?d<e>f|g"]), "abcdefg.png");
});

test("이름이 비어도 쓸 수 있는 파일 이름이 나온다", () => {
  assert.equal(safeFileName([]), "카드.png");
  assert.equal(safeFileName(["   ", ""]), "카드.png");
});
