import { getLang } from "./i18n.ts";

/*
 * 문서(약관·방침·소개·읽을거리)는 한국어·영어·일본어로 쓴다.
 * 그 밖의 언어로 보는 사람에게는 영어판을 보여 주고, 그 사실을 한 줄로 알린다(DocPage).
 */
export type DocLang = "ko" | "en" | "ja";

export function docLang(): DocLang {
  const lang = getLang();
  return lang === "ko" || lang === "ja" ? lang : "en";
}
