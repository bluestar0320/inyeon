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
      // 상태바도 같이 따라가야 한다. 안 그러면 위쪽만 흰 띠로 남는다.
      applyThemeColor(dark);
    };

    apply();
    if (theme !== "system") return undefined;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme, hydrated]);

  return null;
}
