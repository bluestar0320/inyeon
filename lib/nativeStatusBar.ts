"use client";

import { isNativeApp } from "./nativeShare";

/*
 * APK(Capacitor)에서 상태바 색을 앱 테마에 맞춘다.
 *
 * 왜 여기서만 하는가.
 * 안드로이드에 설치된 PWA(WebAPK)는 상태바 색을 매니페스트에서 한 번만 읽고, 그
 * 값은 설치 시점에 굳는다. 실행 중에 meta[name="theme-color"]를 바꿔도 무시한다.
 * 그래서 웹에서는 앱 테마를 따라가게 만들 방법이 아예 없다 — 하나로 고정할 뿐이다.
 * 네이티브는 상태바를 직접 건드릴 수 있어서 이 문제가 제대로 풀린다.
 *
 * 웹 번들에는 영향을 주지 않는다. nativeShare와 같은 방식으로, 네이티브일 때만
 * 플러그인을 동적으로 불러오므로 브라우저에서는 내려받지도 않는다.
 */
export async function applyNativeStatusBar(dark: boolean): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");

    /*
     * 배경색은 앱이 정할 수 없다.
     *
     * 안드로이드 15부터 edge-to-edge가 강제되면서 시스템 바가 무조건 투명해지고,
     * setStatusBarColor(플러그인의 setBackgroundColor가 쓰는 것)는 무시된다.
     * 그래서 글자색만 바뀌고 배경은 창 기본색인 흰색으로 남았다 — 어두운 화면 위에
     * 흰 띠에 흰 글자가 얹혀 글씨가 거의 안 보였다.
     *
     * 대신 웹뷰를 상태바 밑까지 넓힌다. 그러면 페이지 배경이 곧 상태바 배경이 되고,
     * 페이지는 이미 테마를 따라가므로 저절로 맞는다. 색을 맞추려 애쓰는 대신
     * 상태바를 앱 화면의 일부로 만드는 쪽이다.
     *
     * 가려지는 것은 CSS가 막는다 — viewport-fit=cover와 env(safe-area-inset-*)로
     * 머리글과 본문을 시스템 바 밖으로 밀어낸다.
     */
    await StatusBar.setOverlaysWebView({ overlay: true });

    // Style은 "글자·아이콘 색"을 말한다. 어두운 바탕에는 밝은 글자가 와야 하므로
    // Dark 바탕 → Style.Dark가 아니라 Style.Light다. 이름이 헷갈리는 자리다.
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
  } catch {
    // 플러그인이 없거나 기기가 안 받아 주면 그냥 둔다. 앱은 그대로 동작해야 한다.
  }
}
