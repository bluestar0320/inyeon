import assert from "node:assert/strict";
import { test } from "node:test";

import { setLang } from "../lib/i18n.ts";
import { BANK } from "../lib/storyBank.ts";
import {
  buildStory, countBand, fill, freqBand, hash, metLine, pastBand, pastShare, relationKind, spanText,
} from "../lib/story.ts";

const NOW = new Date("2026-10-07T12:00:00");
const person = (over = {}) => ({
  id: "p1", name: "엄마", relation: "어머니", frequency: { count: 1, unit: "month" }, filters: [],
  createdAt: "2026-10-01T00:00:00Z", updatedAt: "2026-10-01T00:00:00Z", ...over,
});

test("관계 판별: 프리셋·흔한 말·변형·5개 언어", () => {
  for (const r of ["어머니", "엄마❤️", "우리 아빠", " Mom ", "お母さん", "Papá", "妈妈"]) assert.equal(relationKind(r), "parent", r);
  for (const r of ["할머니", "외할아버지", "Grandparents", "祖父母"]) assert.equal(relationKind(r), "grandparent", r);
  assert.equal(relationKind("배우자·연인"), "partner");
  assert.equal(relationKind("가까운 친구"), "friend");
  assert.equal(relationKind("직장 동료"), "other");
  assert.equal(relationKind(undefined), "other");
});

test("횟수 구간은 일주일·한 달·1년을 경계로, 그 사이는 100 단위", () => {
  const cases = [[7, "week"], [8, "month"], [30, "month"], [31, "c100"], [100, "c100"], [101, "c200"], [300, "c300"],
    [301, "year"], [365, "year"], [366, "twoYears"], [730, "twoYears"], [1000, "c1000"], [1001, "more"]];
  for (const [n, band] of cases) assert.equal(countBand(n), band, String(n));
});

test("빈도 구간", () => {
  assert.equal(freqBand({ count: 1, unit: "week" }), "often");
  assert.equal(freqBand({ count: 1, unit: "month" }), "sometimes");
  assert.equal(freqBand({ count: 2, unit: "year" }), "rarely");
});

test("지나간 비율 구간 5단계", () => {
  assert.deepEqual([0, 9, 10, 39, 40, 69, 70, 89, 90, 100].map(pastBand),
    ["start", "start", "early", "early", "middle", "middle", "late", "late", "last", "last"]);
});

test("부모님: since가 없으면 스무 살 독립을 가정하고 그렇다고 알린다", () => {
  const s = pastShare({ rel: "parent", frequency: { count: 1, unit: "month" }, myAge: 35, theirAge: 63, remaining: 100, now: NOW });
  // 20년 × 365.2425 + 12 × 15 = 7484.85, 7484.85 / 7584.85 = 98.68% → 98
  assert.deepEqual(s, { pct: 98, assumed: true });
});

test("부모님: since가 있으면 그 날 독립한 것으로 본다", () => {
  const s = pastShare({ rel: "parent", frequency: { count: 1, unit: "month" }, since: "2016-10-07", myAge: 35, theirAge: 63, remaining: 100, now: NOW });
  assert.equal(s.assumed, false);
  const away = (NOW.getTime() - new Date("2016-10-07T00:00:00").getTime()) / 86_400_000 / 365.2425;
  const past = (35 - away) * 365.2425 + 12 * away;
  assert.equal(s.pct, Math.floor((past / (past + 100)) * 100));
});

test("부모님: 스무 살 전이고 since가 없으면(같이 사는 중) 비율이 없다", () => {
  assert.equal(pastShare({ rel: "parent", frequency: { count: 7, unit: "week" }, myAge: 17, theirAge: 45, remaining: 9000, now: NOW }), null);
});

test("연인: since가 없으면 비율이 없고, 갓 만났으면 start", () => {
  const f = { count: 2, unit: "week" };
  assert.equal(pastShare({ rel: "partner", frequency: f, myAge: 28, theirAge: 28, remaining: 5000, now: NOW }), null);
  const s = pastShare({ rel: "partner", frequency: f, since: "2026-09-07", myAge: 28, theirAge: 28, remaining: 5000, now: NOW });
  assert.equal(pastBand(s.pct), "start");
});

test("since가 미래면 비율이 없고, 비율은 0~100을 벗어나지 않는다", () => {
  const f = { count: 1, unit: "week" };
  assert.equal(pastShare({ rel: "friend", frequency: f, since: "2030-01-01", myAge: 30, theirAge: 30, remaining: 10, now: NOW }), null);
  const s = pastShare({ rel: "parent", frequency: f, since: "1900-01-01", myAge: 35, theirAge: 63, remaining: 0.5, now: NOW });
  assert.ok(s === null || (s.pct >= 0 && s.pct <= 100));
});

test("날수 표현은 '채 안 되는' 가장 작은 덩어리", () => {
  setLang("ko");
  assert.equal(spanText(5), "일주일");
  assert.equal(spanText(30), "한 달");
  assert.equal(spanText(100), "4달");
  assert.equal(spanText(365), "1년");
  assert.equal(spanText(800), "3년");
  setLang("en");
  assert.equal(spanText(100), "4 months");
  setLang("ko");
});

test("빈칸 채우기: 조사를 붙이고, 못 채우면 null", () => {
  assert.equal(fill("{name:와/과} {count}번", { name: "엄마", count: "100" }), "엄마와 100번");
  assert.equal(fill("{name:와/과}", { name: "Tom" }), "Tom과");
  assert.equal(fill("{nope}", { name: "엄마" }), null);
});

test("같은 사람은 같은 문장, today만 날마다 바뀔 수 있다", () => {
  setLang("ko");
  const at = (today) => buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today, now: NOW });
  const a = at("2026-10-07");
  assert.deepEqual(a, at("2026-10-07"));
  const days = new Set(["2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", "2026-10-11", "2026-10-12", "2026-10-13"]
    .map((d) => at(d).today));
  assert.ok(days.size > 1, "today가 날마다 하나도 안 바뀜");
  const c = at("2026-10-08");
  assert.equal(c.now, a.now);
  assert.equal(c.then, a.then);
});

test("부모님은 그때·비율·가정이 나오고, 친구는 그때·비율이 없다", () => {
  setLang("ko");
  const mom = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  assert.ok(mom.then && mom.now && mom.today && mom.past);
  assert.equal(mom.assumed, true);
  const pal = buildStory({ person: person({ name: "민수", relation: "친구" }), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  assert.equal(pal.then, undefined);
  assert.equal(pal.past, undefined);
  assert.ok(pal.now && pal.today);
});

test("남은 횟수가 1 미만이면 이야기가 없다", () => {
  assert.equal(buildStory({ person: person(), remaining: 0, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW }), null);
  assert.equal(buildStory({ person: person(), remaining: 0.4, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW }), null);
});

test("모든 언어·톤에서 now·today가 나오고 빈칸이 남지 않는다", () => {
  for (const lang of ["ko", "en", "ja", "es", "zh"]) {
    setLang(lang);
    for (const tone of ["calm", "warm", "aware"]) {
      for (const remaining of [5, 30, 100, 250, 365, 700, 1000, 5000]) {
        const s = buildStory({ person: person({ name: "Tom" }), remaining, myAge: 35, tone, today: "2026-10-07", now: NOW });
        for (const line of [s.then, s.now, s.today, s.past].filter(Boolean)) assert.ok(!/[{}]/.test(line), `${lang}/${tone}: ${line}`);
        assert.ok(s.now && s.today, `${lang}/${tone}/${remaining}`);
      }
    }
  }
  setLang("ko");
});

test("은행의 모든 문장은 아는 빈칸만 쓴다", () => {
  const vars = { name: "엄마", count: "100", span: "4달", pct: "92", n: "3" };
  for (const [tone, langs] of Object.entries(BANK))
    for (const [lang, slots] of Object.entries(langs))
      for (const [slot, keys] of Object.entries(slots))
        for (const [key, list] of Object.entries(keys))
          for (const tpl of list) assert.notEqual(fill(tpl, vars), null, `${tone}/${lang}/${slot}/${key}: ${tpl}`);
});

test("만났어요 한 마디는 남은 횟수가 줄었다고 말하지 않는다", () => {
  setLang("ko");
  const line = metLine({ person: person(), tone: "aware", thisYear: 3 });
  assert.ok(line && !/남았|남은/.test(line), line);
});

test("hash는 같은 입력에 같은 값, 음수가 아니다", () => {
  assert.equal(hash("p1now"), hash("p1now"));
  assert.ok(hash("x") >= 0);
});
