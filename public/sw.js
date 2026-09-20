/*
 * 오프라인용 서비스 워커.
 *
 * 이 앱이 하려는 일은 "인터넷 없이도 소중한 사람을 되새기는 것"이다. 그러려면
 * 비행기 안에서 **처음 여는 화면**도 그대로 돌아야 한다.
 *
 * 예전에는 화면 경로 12개만 미리 받고 나머지는 "가 보면 캐시되겠지"에 맡겼다.
 * 그런데 화면이 뜨려면 그 화면의 JS 청크가 있어야 하고, 청크는 온라인에서 그 화면을
 * 실제로 열어 봐야 받아진다. 그래서 오프라인에서는 **가 본 적 있는 화면만** 제대로
 * 돌았다 — /moments/new/를 처음 열면 껍데기만 뜨고 계산이 "-"로 나왔다.
 * 지금은 빌드가 내놓은 파일 전부를 설치할 때 받아 둔다(다 합쳐 1.7MB).
 *
 * 데이터는 전부 localStorage에 있으므로, 화면 파일만 있으면 계산도 저장도 그대로 된다.
 */
const CACHE = "rc-v3";

/*
 * 앱이 놓인 자리. 하위 경로에 올릴 수 있으므로(GitHub Pages의 /저장소이름 등)
 * 서비스 워커가 등록된 범위에서 직접 읽는다. 경로를 박아 두면 그런 배포에서 전부 어긋난다.
 */
const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");

/** 빌드가 채워 넣는다(scripts/precache-manifest.mjs). 배포 위치는 빠져 있다. */
const FILES = /* __PRECACHE__ */;

const PRECACHE = FILES.map((path) => `${BASE}${path}`);

/** 내용이 바뀌면 파일 이름이 바뀌는 것들. 한 번 받으면 다시 확인할 이유가 없다. */
function isImmutable(url) {
  return url.pathname.startsWith(`${BASE}/_next/static/`);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // 하나가 실패해도 설치는 진행한다. 반쯤이라도 받아 두는 편이 낫다.
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
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  /*
   * 이름에 해시가 박힌 정적 파일은 캐시를 먼저 준다. 내용이 바뀌면 이름이 바뀌므로
   * 낡은 것을 줄 위험이 없고, 매번 네트워크를 기다리지 않아 실행이 즉시 끝난다.
   */
  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  /*
   * 나머지(화면, RSC 페이로드)는 캐시를 먼저 주고 뒤에서 새로 받아 둔다.
   *
   * 예전에는 네트워크를 먼저 기다렸다. 새 배포가 바로 보이게 하려던 것이었는데,
   * 대가로 인터넷이 느릴 때마다 실행이 느려졌다. 오프라인으로 조용히 들여다보는
   * 앱에서 그건 나쁜 거래다. 지금은 즉시 열고, 받아 둔 새 버전은 **다음에 열 때**
   * 보인다. 한 번 늦게 보이는 것과 매번 느린 것 중에서는 전자가 낫다.
   */
  const navigating = request.mode === "navigate";

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      /*
       * 화면 요청은 쿼리를 빼고 찾고, 쿼리를 뺀 주소로 보관한다.
       *
       * 내보낸 파일은 /people/detail/ 하나뿐이고 ?id=... 는 화면이 안에서 읽는 값이다.
       * 그런데 cache.match는 기본적으로 쿼리까지 맞춰 찾아서, 캐시에 멀쩡히 있는데도
       * 없는 것으로 보고 아래의 홈 대체로 떨어졌다 — 오프라인에서 인연 상세를 열면
       * 조용히 홈이 떴다. 보관까지 쿼리를 빼야 인연 수만큼 같은 파일이 쌓이지 않는다.
       */
      const key = navigating ? `${url.origin}${url.pathname}` : request;
      const cached = await cache.match(request, { ignoreSearch: navigating });
      const fresh = fetch(request)
        .then((response) => {
          // 정상 응답만 보관한다. 리다이렉트나 오류를 캐시하면 오프라인에서 더 나쁘다.
          if (response.ok && response.type === "basic") cache.put(key, response.clone());
          return response;
        })
        .catch(() => null);

      if (cached) return cached;

      const response = await fresh;
      if (response) return response;

      if (navigating) {
        /*
         * 주소 끝의 슬래시를 맞춰 한 번 더 찾는다.
         * 이 앱은 trailingSlash로 내보내서 캐시에는 전부 "/people/" 꼴로 들어 있다.
         * 슬래시 없이 들어오면(북마크, 링크) 캐시가 어긋난다.
         */
        if (!url.pathname.endsWith("/")) {
          const slashed = await cache.match(`${url.pathname}/`);
          if (slashed) return slashed;
        }
        // 그래도 없으면 최소한 홈이라도 띄운다.
        const home = await cache.match(`${BASE}/`);
        if (home) return home;
      }
      return Response.error();
    }),
  );
});
