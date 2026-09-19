"use client";

import { useEffect } from "react";

/**
 * 서비스 워커를 등록해 오프라인에서도 앱이 뜨게 한다.
 *
 * 개발 중에는 등록하지 않는다. 고친 화면이 캐시에 잡혀 "왜 안 바뀌지"로 시간을 버리는
 * 것이 오프라인 동작보다 훨씬 자주 생기는 일이기 때문이다.
 */
export default function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    // 하위 경로 배포에서도 맞도록 base를 붙인다.
    const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    navigator.serviceWorker.register(`${base}/sw.js`).catch(() => {
      // 등록에 실패해도 앱은 온라인에서 그대로 동작한다.
    });
  }, []);

  return null;
}
