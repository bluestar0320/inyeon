import assert from "node:assert/strict";
import { test } from "node:test";

import { cardLine, yearsKnown } from "../lib/cardLine.ts";

const base = { years: null, rel: "friend", seed: "p1", lang: "ko", bond: "BOND" };

test("cardLine: 이스터 에그가 먼저다", () => {
  assert.match(cardLine({ ...base, past: 777 }), /777/);
  assert.match(cardLine({ ...base, past: 3000 }), /I love you 3000/);
  assert.match(cardLine({ ...base, past: 2009 }), /2009|이천구/);
  for (const past of [776, 778, 2010, 2999, 3001]) assert.doesNotMatch(cardLine({ ...base, past }), /777|이천구|만든 사람|3000/);
  assert.match(cardLine({ ...base, past: 3000, lang: "en" }), /3000/);
});

test("cardLine: 같은 사람·같은 구간이면 늘 같은 줄", () => {
  assert.equal(cardLine({ ...base, past: 130 }), cardLine({ ...base, past: 199 }));
});

test("cardLine: 30번 미만·햇수 모름이면 비율 문장, 다른 언어도 비율 문장", () => {
  assert.equal(cardLine({ ...base, past: 10 }), "BOND");
  assert.equal(cardLine({ ...base, past: 500, lang: "ja" }), "BOND");
  assert.equal(cardLine({ ...base, past: 10, bond: undefined }), undefined);
});

test("cardLine: 연인 15년이면 연인 문장이 섞이고 「애인」은 없다", () => {
  const seen = new Set();
  for (let k = 0; k < 200; k++) seen.add(cardLine({ ...base, past: 10, years: 16, rel: "partner", seed: `s${k}` }));
  assert.ok([...seen].some((l) => l.includes("15년산 사랑")));
  assert.ok([...seen].every((l) => !l.includes("애인") && !l.includes("당신")));
});

test("yearsKnown", () => {
  const now = new Date("2026-11-21T00:00:00");
  assert.equal(yearsKnown({ rel: "friend", since: "2011-03-01", myAge: 40, theirAge: 40, now }), 15);
  assert.equal(yearsKnown({ rel: "parent", myAge: 35, theirAge: 65, now }), 35);
  assert.equal(yearsKnown({ rel: "child", myAge: 35, theirAge: 5, now }), 5);
  assert.equal(yearsKnown({ rel: "friend", myAge: 35, theirAge: 5, now }), null);
});
