import assert from "node:assert/strict";
import { test } from "node:test";

import { countUrl } from "../lib/analytics.ts";

test("계정 코드가 없으면 아무것도 보내지 않는다", () => {
  assert.equal(countUrl("", { path: "/" }), null);
});

test("주소의 뒷부분(?id=…)과 #은 잘라 낸다 — 어느 사람의 화면이었는지 남기지 않는다", () => {
  const url = new URL(countUrl("inyeon", { path: "/people/detail/?id=abc-123#x" }));
  assert.equal(url.origin, "https://inyeon.goatcounter.com");
  assert.equal(url.pathname, "/count");
  assert.equal(url.searchParams.get("p"), "/people/detail/");
  assert.ok(!url.href.includes("abc-123"));
});

test("사건은 이름만 센다(e=true) — 값이나 이름은 싣지 않는다", () => {
  const url = new URL(countUrl("inyeon", { event: "first-result" }));
  assert.equal(url.searchParams.get("p"), "first-result");
  assert.equal(url.searchParams.get("e"), "true");
});

test("들어온 곳은 다른 사이트일 때만, 그 사이트의 주소(도메인)만", () => {
  const url = new URL(countUrl("inyeon", { path: "/", referrer: "https://l.instagram.com/?u=secret", self: "bluestar0320.github.io" }));
  assert.equal(url.searchParams.get("r"), "https://l.instagram.com");
  const own = new URL(countUrl("inyeon", { path: "/", referrer: "https://bluestar0320.github.io/inyeon/setup/", self: "bluestar0320.github.io" }));
  assert.equal(own.searchParams.get("r"), null);
});
