"use client";

import { useEffect } from "react";

import { useAppState } from "@/lib/store";
import { applyThemeColor } from "@/lib/themeColor";

/**
 * 설정값과 기기 설정을 보고 <html>에 dark 클래스를 붙였다 뗀다.
 * 첫 화면은 layout의 인라인 스크립트가 이미 칠해 두므로, 여기서는 설정을 바꿨을 때와
 * 기기 설정이 바뀌었을 때를 맡는다.
 */
export default function ThemeApplier() {
  const { state, hydrated } = useAppState();
  const theme = state.settings.theme;

  useEffect(() => {
    if (!hydrated) return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = theme === "dark" || (theme === "system" && media.matches);
      document.documentElement.classList.toggle("dark", dark);
      /*
       * 상태바도 같이 따라가야 한다. 안 그러면 위쪽만 흰 띠로 남는다.
       * 경로가 둘이다 — 브라우저 탭은 meta 태그, APK는 네이티브 플러그인.
       * 설치된 PWA는 매니페스트에 박힌 값을 쓰므로 여기서 어찌할 수 없다.
       */
      applyThemeColor(dark);

      /*
       * 네이티브 상태바는 모듈째 늦게 부른다.
       *
       * 처음에는 lib/nativeStatusBar를 위에서 그냥 import 했는데, 이 컴포넌트가
       * 최상위 레이아웃에 있다 보니 번들러가 플러그인 청크(20KB)를 첫 화면에
       * 딸려 보냈다. 웹 사용자는 평생 쓰지 않을 코드다(실제로 받는 것까지 확인했다).
       * 전역 검사를 먼저 하고 그 뒤에 import 하면 브라우저는 아예 요청하지 않는다.
       */
      if (window.Capacitor?.isNativePlatform?.() === true) {
        void import("@/lib/nativeStatusBar").then((m) => m.applyNativeStatusBar(dark));
      }
    };

    apply();
    if (theme !== "system") return undefined;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return null;
}
