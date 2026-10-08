import assert from "node:assert/strict";
import { test } from "node:test";

import { typedDate } from "../lib/format.ts";

test("숫자만 쳐도 날짜 모양으로 맞춘다", () => {
  assert.deepEqual(typedDate("1965", "2026-10-08"), { text: "1965", iso: null });
  assert.deepEqual(typedDate("196503", "2026-10-08"), { text: "1965-03", iso: null });
  assert.deepEqual(typedDate("19650312", "2026-10-08"), { text: "1965-03-12", iso: "1965-03-12" });
  assert.deepEqual(typedDate("1965-03-12", "2026-10-08").iso, "1965-03-12");
});

test("없는 날짜·미래·너무 옛날은 받지 않는다", () => {
  assert.equal(typedDate("19650230", "2026-10-08").iso, null);
  assert.equal(typedDate("20270101", "2026-10-08").iso, null);
  assert.equal(typedDate("18991231", "2026-10-08").iso, null);
  assert.equal(typedDate("20261008", "2026-10-08").iso, "2026-10-08");
});

test("8자리를 넘는 숫자는 버린다", () => {
  assert.equal(typedDate("196503129", "2026-10-08").text, "1965-03-12");
});
