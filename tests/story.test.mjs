import assert from "node:assert/strict";
import { test } from "node:test";

import { setLang } from "../lib/i18n.ts";
import { relationPresets } from "../lib/presets.ts";
import { BANK } from "../lib/storyBank.ts";
import {
  buildStory, countBand, fill, freqBand, hash, metLine, pastBand, pastShare, relationKind, relationTag, spanText,
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
  assert.equal(spanText(100), "넉 달");
  assert.equal(spanText(200), "일곱 달");
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
  const vars = { name: "엄마", count: "100", span: "넉 달", pct: "92", n: "3", me: "당신", country: "대한민국" };
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

const NEED = {
  "aware/ko/then/parent": 10, "aware/ko/now/after.*": 10, "aware/ko/now/*": 10,
  "aware/ko/today/often": 8, "aware/ko/today/sometimes": 8, "aware/ko/today/rarely": 8,
  "aware/ko/today/elder.often": 8, "aware/ko/today/elder.sometimes": 8, "aware/ko/today/elder.rarely": 8,
  "aware/ko/past/start": 6, "aware/ko/past/early": 6, "aware/ko/past/middle": 6, "aware/ko/past/late": 6, "aware/ko/past/last": 6,
  "aware/ko/past/elder.late": 5, "aware/ko/past/elder.last": 5, "aware/ko/past/partner.start": 5, "aware/ko/past/partner.early": 5,
  "aware/ko/met/*": 8, "aware/ko/met/elder": 4,
  "aware/en/now/after.*": 5, "aware/en/now/*": 5, "aware/ja/now/after.*": 5, "aware/en/past/last": 5, "aware/ja/today/often": 5,
  "warm/ko/now/after.*": 3, "calm/ko/now/after.*": 3, "aware/es/now/*": 3, "aware/zh/today/rarely": 3,
};

test("문장 은행 분량", () => {
  for (const [path, min] of Object.entries(NEED)) {
    const [tone, lang, slot, key] = path.split("/");
    const n = BANK[tone]?.[lang]?.[slot]?.[key]?.length ?? 0;
    assert.ok(n >= min, `${path}: ${n} < ${min}`);
  }
});

test("한 줄은 카드 세 줄 안에 들어갈 만큼 짧다", () => {
  const vars = { name: "엄마", count: "1,234", span: "열한 달", pct: "92", n: "12", me: "당신", country: "아랍에미리트" };
  for (const [tone, langs] of Object.entries(BANK))
    for (const [lang, slots] of Object.entries(langs))
      for (const keys of Object.values(slots))
        for (const list of Object.values(keys))
          for (const tpl of list) {
            const line = fill(tpl, vars);
            const limit = ["en", "es"].includes(lang) ? 150 : 72;
            assert.ok(line.length <= limit, `${tone}/${lang} ${line.length}자: ${line}`);
          }
});

test("한국어 만났어요 문장은 모두 '올해 n번째'를 담는다", () => {
  for (const tone of ["aware", "warm", "calm"])
    for (const list of Object.values(BANK[tone].ko?.met ?? {}))
      for (const tpl of list) assert.ok(tpl.includes("{n}번째"), `${tone}: ${tpl}`);
});

test("관계 판별: 사돈·친척·낱말 일부가 부모님·자녀로 잡히지 않는다", () => {
  for (const r of ["시어머니", "장모님", "큰아버지", "작은어머니", "mother-in-law", "godfather", "叔父", "伯母", "姑妈", "舅妈", "姨妈", "母校"])
    assert.notEqual(relationKind(r), "parent", r);
  for (const r of ["Jason", "person", "Madison"]) assert.equal(relationKind(r), "other", r);
  assert.equal(relationKind("아이돌 친구"), "friend");
  for (const r of ["grandson", "granddaughter"]) assert.notEqual(relationKind(r), "grandparent", r);
  assert.equal(relationKind("business partner"), "other");
  assert.equal(relationKind("부모님"), "parent");
  assert.equal(relationKind("Mommy"), "parent");
});

test("관계 판별: 5개 언어의 프리셋 이름은 모두 제자리로", () => {
  const expected = ["parent", "parent", "grandparent", "sibling", "partner", "child", "friend"];
  for (const lang of ["ko", "en", "ja", "es", "zh"]) {
    setLang(lang);
    assert.deepEqual(relationPresets().map((p) => relationKind(p.relation)), expected, lang);
  }
  setLang("ko");
});

test("지나간 비율은 설정으로 끌 수 있다 — 끄면 그때·비율·가정이 모두 빠진다", () => {
  setLang("ko");
  const s = buildStory({ person: person(), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW, showPast: false });
  assert.equal(s.then, undefined);
  assert.equal(s.past, undefined);
  assert.equal(s.assumed, false);
  assert.ok(s.now && s.today);
});

test("지나간 비율은 '만약에' 빈도가 아니라 실제 빈도로 센다", () => {
  setLang("ko");
  const pal = person({ name: "민수", relation: "친구", since: "2016-10-07", frequency: { count: 1, unit: "month" } });
  const real = buildStory({ person: pal, remaining: 100, myAge: 35, theirAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
  const whatIf = buildStory({ person: { ...pal, frequency: { count: 7, unit: "week" } }, remaining: 100, myAge: 35, theirAge: 35,
    tone: "aware", today: "2026-10-07", now: NOW, pastFrequency: pal.frequency });
  assert.equal(whatIf.past, real.past);
});

const filled = (list, extra = {}) =>
  new Set(list.map((tpl) => fill(tpl, { name: "엄마", count: "100", span: "넉 달", pct: "98", n: "1", me: "당신", country: "대한민국", ...extra })));

test("그때 줄이 있으면 지금 줄은 앞 문장을 이어받는 문장(after)에서 고른다", () => {
  setLang("ko");
  const after = filled(BANK.aware.ko.now["after.*"]);
  for (const id of ["a", "b", "c", "d", "e", "f"]) {
    const s = buildStory({ person: person({ id }), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
    assert.ok(s.then, id);
    assert.ok(after.has(s.now), `${id}: ${s.now}`);
  }
});

test("부모님께는 높임 문장(elder)을 고른다", () => {
  setLang("ko");
  const elder = filled(BANK.aware.ko.today["elder.sometimes"]);
  for (const id of ["a", "b", "c", "d"]) {
    const s = buildStory({ person: person({ id }), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW });
    assert.ok(elder.has(s.today), `${id}: ${s.today}`);
  }
});

test("닉네임이 있으면 '당신' 대신 그 이름으로 부른다", () => {
  setLang("ko");
  let used = false;
  for (const id of "abcdefghijklmnop") {
    const base = { person: person({ id }), remaining: 100, myAge: 35, tone: "aware", today: "2026-10-07", now: NOW };
    const plain = buildStory(base);
    const named = buildStory({ ...base, me: "지훈" });
    const lines = (s) => [s.then, s.now, s.today, s.past].filter(Boolean).join(" ");
    assert.ok(!lines(named).includes("당신"), lines(named));
    if (lines(plain).includes("당신")) {
      used = true;
      assert.ok(lines(named).includes("지훈"), lines(named));
    }
  }
  assert.ok(used, "어느 문장도 '당신'을 쓰지 않음");
});

test("'어때요/어떨까요'로 끝나는 오늘 문장은 드물다", () => {
  const all = Object.entries(BANK.aware.ko.today).flatMap(([, list]) => list);
  const asking = all.filter((t) => /어때요|어떨까요/.test(t));
  assert.ok(asking.length * 5 <= all.length, `${asking.length}/${all.length}`);
});

test("한국어 찡하게의 중반 이후 맺음 문장은 모두 비율(%)을 말한다", () => {
  for (const key of ["middle", "late", "last", "elder.late", "elder.last"])
    for (const tpl of BANK.aware.ko.past[key]) assert.ok(tpl.includes("{pct}"), `${key}: ${tpl}`);
});

const elderly = (over = {}) => person({ name: "할머니", relation: "할머니", frequency: { count: 1, unit: "month" }, ...over });

test("평균수명을 넘긴 분께는 축하 문장이 앞에 나온다(나라 이름과 함께)", () => {
  setLang("ko");
  const s = buildStory({ person: elderly(), remaining: 14, myAge: 40, theirAge: 92, tone: "aware", today: "2026-10-07", now: NOW,
    averageLife: 84.3, country: "대한민국" });
  assert.ok(s.cheer && s.cheer.includes("대한민국"), s.cheer);
  const young = buildStory({ person: elderly(), remaining: 14, myAge: 40, theirAge: 80, tone: "aware", today: "2026-10-07", now: NOW,
    averageLife: 84.3, country: "대한민국" });
  assert.equal(young.cheer, undefined);
});

test("75세 이상이고 남은 횟수가 100번 이하면 날짜로 줄여 보이지 않는 '선물' 문장을 쓴다(부모님도)", () => {
  setLang("ko");
  for (const p of [elderly({ id: "g1" }), person({ id: "m1" })]) {
    const s = buildStory({ person: p, remaining: 60, myAge: 50, theirAge: 82, tone: "aware", today: "2026-10-07", now: NOW });
    const extra = { name: p.name, count: "60" };
    const gentle = new Set([...filled(BANK.aware.ko.now.senior, extra), ...filled(BANK.aware.ko.now["senior.after"], extra)]);
    assert.ok(gentle.has(s.now), `${p.id}: ${s.now}`);
    assert.ok(!/날짜|매일 만나/.test(s.now), s.now);
    assert.ok(filled(BANK.aware.ko.today.senior, extra).has(s.today), s.today);
  }
  // 아직 75세 전이면 원래 문장
  const s = buildStory({ person: person({ id: "m1" }), remaining: 60, myAge: 40, theirAge: 70, tone: "aware", today: "2026-10-07", now: NOW });
  assert.ok(!filled(BANK.aware.ko.today.senior).has(s.today));
});

test("이름과 관계가 같은 말이면 관계를 따로 붙이지 않는다", () => {
  assert.equal(relationTag("어머니", "어머니"), undefined);
  assert.equal(relationTag("엄마", "어머니"), undefined);
  assert.equal(relationTag("할머니", "조부모"), undefined);
  assert.equal(relationTag("Mom", "Mom"), undefined);
  assert.equal(relationTag("민수", "친구"), "친구");
  assert.equal(relationTag("김영희", "어머니"), "어머니");
  assert.equal(relationTag("엄마", undefined), undefined);
  assert.equal(relationTag("엄마", "  "), undefined);
});
