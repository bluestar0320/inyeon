/*
 * 오프라인용 서비스 워커.
 *
 * 네트워크 우선(network-first)이다. 캐시 우선으로 하면 배포한 새 버전이 안 보이고
 * "왜 안 바뀌지" 하는 사고가 나기 때문에, 온라인일 때는 항상 서버 응답을 쓰고
 * 캐시는 오프라인일 때 꺼내 쓰는 보관함으로만 둔다.
 *
 * 이 앱은 데이터를 전부 localStorage에 두므로, 화면 파일만 받아둘 수 있으면
 * 비행기 안에서도 그대로 동작한다.
 */
const CACHE = "rc-v2";

/*
 * 앱이 놓인 자리. 하위 경로에 올릴 수 있으므로(GitHub Pages의 /저장소이름 등)
 * 서비스 워커가 등록된 범위에서 직접 읽는다. 경로를 박아 두면 그런 배포에서 전부 어긋난다.
 */
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");

/*
 * 첫 방문에 미리 받아 두는 화면들. 실패해도 설치는 진행한다.
 * 고정 경로는 전부 넣는다 — 한 번도 안 가본 화면을 오프라인에서 열면 빈 화면이 된다.
 * 상세 화면은 목록을 거쳐야만 갈 수 있어 방문 시점에 캐시된다.
 */
const PRECACHE = [
  "/",
  "/people/",
  "/people/new/",
  "/people/detail/",
  "/moments/",
  "/moments/new/",
  "/moments/detail/",
  "/marriage/",
  "/settings/",
  "/setup/",
].map((path) => `${BASE}${path}`);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // GET이 아닌 요청과 외부 도메인은 건드리지 않는다.
  if (request.method !== "GET") return;
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        // 정상 응답만 보관한다. 리다이렉트나 오류를 캐시하면 오프라인에서 더 나쁘다.
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // 캐시에 없는 화면으로 이동한 경우, 최소한 홈이라도 띄운다.
        if (request.mode === "navigate") {
          const home = await caches.match(`${BASE}/`);
          if (home) return home;
        }
        return Response.error();
      }),
  );
});
