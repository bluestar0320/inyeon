/*
 * 주소창·상태바에 쓰는 색. globals.css의 --page와 같은 값이다.
 *
 * storageKey.ts와 같은 이유로 "use client"를 붙이지 않는다 — 서버 컴포넌트인
 * layout.tsx에서도 읽어야 한다.
 */
export const THEME_COLOR = {
  light: "#fbfaf8",
  dark: "#121317",
} as const;

/** 실제로 칠해진 테마에 맞춰 메타 태그를 고친다. 상태바가 이 값을 따라간다. */
export function applyThemeColor(dark: boolean): void {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", dark ? THEME_COLOR.dark : THEME_COLOR.light);
}
