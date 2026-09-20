"use client";

import { isNativeApp } from "./nativeShare";
import { THEME_COLOR } from "./themeColor";

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
    // Style은 "글자·아이콘 색"을 말한다. 어두운 바탕에는 밝은 글자가 와야 하므로
    // Dark 바탕 → Style.Dark가 아니라 Style.Light다. 이름이 헷갈리는 자리다.
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: dark ? THEME_COLOR.dark : THEME_COLOR.light });
  } catch {
    // 플러그인이 없거나 기기가 안 받아 주면 그냥 둔다. 앱은 그대로 동작해야 한다.
  }
}
