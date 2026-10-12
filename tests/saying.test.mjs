import assert from "node:assert/strict";
import { test } from "node:test";

import { SAYING_MAX_LENGTH, cleanSaying } from "../lib/meetings.ts";

test("자주 하는 말: 공백을 다듬고 감싼 따옴표를 벗기고, 비면 지우고, 길면 자른다", () => {
  assert.equal(cleanSaying("  “밥은   먹고\n다니니?”  "), "밥은 먹고 다니니?");
  assert.equal(cleanSaying("\"차 조심해라\""), "차 조심해라");
  assert.equal(cleanSaying("   "), undefined);
  assert.equal(cleanSaying(42), undefined);
  assert.equal(Array.from(cleanSaying("가".repeat(200))).length, SAYING_MAX_LENGTH);
});
