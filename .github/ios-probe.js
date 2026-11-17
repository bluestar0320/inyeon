/*
 * iOS 시뮬레이터 확인용(.github/workflows/ios.yml만 넣는다, 앱에는 들어가지 않는다).
 * 시뮬레이터는 손으로 누를 수 없어서, 이 스크립트가 예시 기록을 넣고 카드 줄 넘기기·카드 펼치기·뒤로를
 * 차례로 해 보고 결과를 화면 아래에 적는다. 워크플로가 5초마다 찍는 화면으로 읽는다.
 */
(function () {
  var KEY = "relationship-countdown.v1";
  if (!localStorage.getItem(KEY)) {
    var now = new Date().toISOString();
    var person = function (i, rel) {
      return { id: "p" + i, name: ["어머니", "아버지", "친구"][i], relation: rel, ageYears: [62, 65, 35][i], ageAsOf: "2026-01-01",
        lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "female", frequency: { count: 1, unit: "month" },
        filters: [], createdAt: now, updatedAt: now };
    };
    localStorage.setItem(KEY, JSON.stringify({
      version: 1,
      profile: { ageYears: 35, ageAsOf: "2026-01-01", lifeExpectancy: 85, lifeExpectancyManual: true, countryCode: "KR", sex: "all" },
      people: [person(0, "어머니"), person(1, "아버지"), person(2, "친구")],
      moments: [{ id: "m0", title: "벚꽃", frequency: { count: 1, unit: "year" }, filters: [], createdAt: now, updatedAt: now }],
      marriage: null,
      settings: { tone: "aware", theme: "light", showPast: true },
    }));
    location.reload();
    return;
  }

  var out = { ua: navigator.userAgent.replace(/^.*?(OS [\d_]+).*$/, "$1"), steps: [], errors: [] };
  addEventListener("error", function (e) { out.errors.push(String(e.message)); });
  addEventListener("unhandledrejection", function (e) { out.errors.push(String(e.reason)); });
  var box = document.createElement("pre");
  box.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:99999;margin:0;padding:4px;font:10px/1.3 monospace;" +
    "white-space:pre-wrap;word-break:break-all;background:rgba(255,255,200,.95);color:#000;pointer-events:none";
  function show() {
    if (!box.isConnected) document.body.appendChild(box);
    box.textContent = JSON.stringify(out);
  }
  function step(name, data) { data.step = name; out.steps.push(data); show(); }
  function overflow() { return document.scrollingElement.scrollHeight - innerHeight; }
  function row() { return document.querySelector("[data-deck] section"); }
  function scroller() {
    var r = row();
    if (!r) return null;
    var all = r.querySelectorAll("*");
    for (var i = 0; i < all.length; i++) if (all[i].scrollWidth > all[i].clientWidth + 1) return all[i];
    return null;
  }
  function centered() {
    var links = document.querySelectorAll('[data-deck] section a[href*="detail"]');
    for (var i = 0; i < links.length; i++) {
      var b = links[i].getBoundingClientRect();
      if (b.left < innerWidth / 2 && b.right > innerWidth / 2 && b.top < innerHeight) return links[i];
    }
    return null;
  }

  setTimeout(function () {
    step("home", { has: CSS.supports("selector(:has(*))"), deck: !!document.querySelector("[data-deck]"),
      overflow: overflow(), cards: document.querySelectorAll('[data-deck] a[href*="detail"]').length });
  }, 3000);

  setTimeout(function () {
    var s = scroller();
    var before = s ? s.scrollLeft : null;
    var buttons = row() ? row().querySelectorAll("button") : [];
    if (buttons.length) buttons[buttons.length - 1].click();
    setTimeout(function () {
      step("next", { button: buttons.length > 0, before: before, after: s ? s.scrollLeft : null,
        card: centered() ? centered().textContent.slice(0, 12) : null });
    }, 1500);
  }, 6000);

  setTimeout(function () {
    var a = centered();
    if (a) a.click();
    setTimeout(function () {
      var anims = document.getAnimations ? document.getAnimations().length : -1;
      setTimeout(function () {
        step("open", { clicked: !!a, animsMid: anims, path: location.pathname });
      }, 1200);
    }, 120);
  }, 11000);

  setTimeout(function () {
    history.back();
    setTimeout(function () {
      step("back", { path: location.pathname, overflow: overflow() });
    }, 1500);
  }, 17000);
})();
