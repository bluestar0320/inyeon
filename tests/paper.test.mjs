import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { test } from "node:test";

import { PAPER_COUNT, paperUrl, pickPaper } from "../lib/paper.ts";

test("종이는 1~10 중 하나이고, 지난번과 같은 장은 고르지 않는다", () => {
  for (let prev = 1; prev <= PAPER_COUNT; prev++) {
    for (const r of [0, 0.05, 0.5, 0.95, 0.999]) {
      const n = pickPaper(prev, () => r);
      assert.ok(n >= 1 && n <= PAPER_COUNT);
      assert.notEqual(n, prev);
    }
  }
});

test("종이 파일이 다 있다", () => {
  for (let n = 1; n <= PAPER_COUNT; n++) assert.ok(existsSync(`public/paper/paper-${n}.webp`), String(n));
  assert.equal(paperUrl(3), 'url("/paper/paper-3.webp")');
});
