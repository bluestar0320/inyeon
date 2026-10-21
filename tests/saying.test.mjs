import assert from "node:assert/strict";
import { test } from "node:test";

import { SAYING_MAX_LENGTH, SAYING_MAX_LINES, cleanSaying, pickSaying } from "../lib/meetings.ts";

test("자주 하는 말: 공백을 다듬고 감싼 따옴표를 벗기고, 비면 지우고, 길면 자른다", () => {
  assert.equal(cleanSaying("  “밥은   먹고\t다니니?”  "), "밥은 먹고 다니니?");
  assert.equal(cleanSaying("\"차 조심해라\""), "차 조심해라");
  assert.equal(cleanSaying("   "), undefined);
  assert.equal(cleanSaying(42), undefined);
  assert.equal(Array.from(cleanSaying("가".repeat(200))).length, SAYING_MAX_LENGTH);
});

test("자주 하는 말 여러 줄: 줄마다 다듬고 빈 줄·같은 말은 버리고, 열 줄까지만", () => {
  assert.equal(cleanSaying("“밥은 먹었니?”\n\n  차 조심해라 \r\n밥은 먹었니?"), "밥은 먹었니?\n차 조심해라");
  assert.equal(cleanSaying(Array.from({ length: 15 }, (_, i) => `말 ${i}`).join("\n")).split("\n").length, SAYING_MAX_LINES);
});

test("오늘 보일 한 줄은 날마다 다음 줄로 넘어간다", () => {
  const two = "밥은 먹었니?\n차 조심해라";
  assert.notEqual(pickSaying(two, "2026-10-21"), pickSaying(two, "2026-10-22"));
  assert.equal(pickSaying(two, "2026-10-21"), pickSaying(two, "2026-10-23"));
  assert.equal(pickSaying("하나뿐", "2026-10-21"), "하나뿐");
  assert.equal(pickSaying(undefined, "2026-10-21"), undefined);
});
