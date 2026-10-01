/*
 * 방문자 수 세기. GoatCounter(쿠키 없음, IP 저장 안 함)에 "이 페이지가 한 번 열렸다"만 보낸다.
 *
 * 지키는 선:
 *   - 입력한 기록(이름·나이·관계·횟수)은 어떤 경우에도 보내지 않는다.
 *   - 주소의 뒷부분(?id=…, #…)은 잘라 낸다. 어느 사람의 상세 화면이었는지 남기지 않는다.
 *   - 들어온 곳(referrer)은 다른 사이트일 때 그 도메인만.
 *   - 스크립트를 붙이지 않는다. 그림 한 장 요청으로 끝난다.
 * GOATCOUNTER_CODE가 비어 있으면 아무것도 보내지 않는다. 개인정보처리방침의 문구도 이 값을 따라간다.
 */

/** GoatCounter 사이트 코드(https://<코드>.goatcounter.com). 비우면 집계를 끈다. */
export const GOATCOUNTER_CODE = "";

export const analyticsEnabled = (code: string = GOATCOUNTER_CODE): boolean => code !== "";

export function countUrl(
  code: string,
  hit: { path?: string; event?: string; referrer?: string; self?: string },
): string | null {
  if (!analyticsEnabled(code)) return null;
  const url = new URL(`https://${code}.goatcounter.com/count`);
  if (hit.event) {
    url.searchParams.set("p", hit.event);
    url.searchParams.set("e", "true");
  } else {
    url.searchParams.set("p", (hit.path ?? "/").split(/[?#]/)[0] || "/");
  }
  if (hit.referrer) {
    try {
      const from = new URL(hit.referrer);
      if (from.hostname !== hit.self) url.searchParams.set("r", from.origin);
    } catch {
      // 주소가 아니면 넘긴다.
    }
  }
  url.searchParams.set("rnd", Math.random().toString(36).slice(2, 8));
  return url.href;
}

/** 보낸다. 실패해도(오프라인 등) 조용히 넘어간다 — 세지 못한 한 번이 앱을 막으면 안 된다. */
export function count(hit: { path?: string; event?: string }): void {
  if (typeof window === "undefined" || !analyticsEnabled()) return;
  // 브라우저에 "추적하지 마세요"를 켠 사람은 세지 않는다.
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  if (nav.globalPrivacyControl || navigator.doNotTrack === "1") return;
  const url = countUrl(GOATCOUNTER_CODE, {
    ...hit,
    referrer: hit.event ? undefined : document.referrer,
    self: location.hostname,
  });
  if (url) new Image().src = url;
}
