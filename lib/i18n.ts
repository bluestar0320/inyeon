/*
 * 다국어. 라이브러리 없이 한다.
 *
 * 문구는 쓰는 파일 안에 언어별로 나란히 둔다(한 파일에 몰아 두면 화면을 고칠 때마다
 * 두 곳을 오가야 한다):
 *
 *   const COPY = defineCopy({ ko: { title: "설정" }, en: { title: "Settings" }, ... });
 *   const t = tr(COPY);   // 렌더 중에 부른다
 *
 * 지금 언어는 모듈 변수 하나에 둔다. LangRoot가 렌더 맨 앞에서 정하고, 언어가 바뀌면
 * 트리 전체를 다시 그린다. 그래서 formatCount 같은 순수 함수도 인자를 늘리지 않고
 * 지금 언어로 말할 수 있다.
 *
 * 용어(모든 언어에서 같은 말을 쓴다):
 *   앱 이름   몇 번 더 / How Many More / あと何回 / Cuántas veces más / 还有几次
 *   인연      인연 / People / 大切な人 / Personas / 亲友
 *   순간      순간 / Moments / ひととき / Momentos / 时光
 *   N번       N번 / N times / N回 / N veces / N次
 *   만 N세    만 N세 / age N / N歳 / N años / N岁
 */

export type Lang = "ko" | "en" | "ja" | "es" | "zh";

export const LANGS: { value: Lang; label: string }[] = [
  { value: "ko", label: "한국어" },
  { value: "en", label: "English" },
  { value: "ja", label: "日本語" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
];

/** 숫자·날짜를 쓸 때의 로캘. */
export const LOCALE: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
  ja: "ja-JP",
  es: "es-ES",
  zh: "zh-CN",
};

/** 서버에서 구운 HTML과 하이드레이션 직후 첫 화면은 이 언어다. */
export const DEFAULT_LANG: Lang = "ko";

let current: Lang = DEFAULT_LANG;

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
}

/** 기기 언어에서 고른다. 모르는 언어면 영어. */
export function detectLang(languages: readonly string[] = navigatorLanguages()): Lang {
  for (const tag of languages) {
    const base = tag.toLowerCase().split("-")[0];
    if (LANGS.some((lang) => lang.value === base)) return base as Lang;
  }
  return "en";
}

function navigatorLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [DEFAULT_LANG];
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

/** 모든 언어가 한국어와 같은 모양을 갖추게 한다. 빠진 키가 있으면 타입 검사에서 걸린다. */
export function defineCopy<T>(copy: {
  ko: T;
  en: NoInfer<T>;
  ja: NoInfer<T>;
  es: NoInfer<T>;
  zh: NoInfer<T>;
}): Record<Lang, T> {
  return copy;
}

export function tr<T>(copy: Record<Lang, T>): T {
  return copy[current];
}

export function locale(): string {
  return LOCALE[current];
}
