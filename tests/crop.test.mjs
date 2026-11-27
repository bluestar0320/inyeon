import assert from "node:assert/strict";
import { test } from "node:test";

import { centerCrop, clampCrop, cropSide, MAX_ZOOM } from "../lib/crop.ts";

test("clampCrop: 칸은 사진 밖으로 나가지 않고, 배율은 1~MAX_ZOOM", () => {
  // 가로 사진 400×200: zoom 1이면 칸 200, 가운데는 x 100~300, y는 100 고정.
  assert.deepEqual(clampCrop(400, 200, { cx: 0, cy: 0, zoom: 1 }), { cx: 100, cy: 100, zoom: 1 });
  assert.deepEqual(clampCrop(400, 200, { cx: 999, cy: 999, zoom: 1 }), { cx: 300, cy: 100, zoom: 1 });
  // 두 배면 칸 100, 세로로도 움직일 수 있다.
  assert.deepEqual(clampCrop(400, 200, { cx: 10, cy: 190, zoom: 2 }), { cx: 50, cy: 150, zoom: 2 });
  assert.equal(clampCrop(400, 200, { cx: 200, cy: 100, zoom: 99 }).zoom, MAX_ZOOM);
  assert.equal(clampCrop(400, 200, { cx: 200, cy: 100, zoom: 0.1 }).zoom, 1);
  assert.deepEqual(clampCrop(400, 200, { cx: NaN, cy: NaN, zoom: NaN }), centerCrop(400, 200));
  assert.equal(cropSide(400, 200, 2), 100);
});
