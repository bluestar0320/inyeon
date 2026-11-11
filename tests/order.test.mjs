import assert from "node:assert/strict";
import { test } from "node:test";

import { inOrder, moved } from "../lib/order.ts";

const id = (x) => x;

test("정한 순서가 없으면 그대로", () => {
  assert.deepEqual(inOrder(["a", "b"], undefined, id), ["a", "b"]);
});

test("정한 순서대로, 순서에 없는 새 사람은 들어온 순서대로 뒤에", () => {
  assert.deepEqual(inOrder(["a", "b", "c", "new1", "new2"], ["c", "a", "b"], id), ["c", "a", "b", "new1", "new2"]);
});

test("지운 사람이 순서에 남아 있어도 문제없다", () => {
  assert.deepEqual(inOrder(["a", "b"], ["gone", "b", "a"], id), ["b", "a"]);
});

test("한 칸씩 옮기고, 끝을 넘으면 그대로", () => {
  assert.deepEqual(moved(["a", "b", "c"], 2, -1), ["a", "c", "b"]);
  assert.deepEqual(moved(["a", "b", "c"], 0, -1), ["a", "b", "c"]);
  assert.deepEqual(moved(["a", "b", "c"], 2, 1), ["a", "b", "c"]);
});
