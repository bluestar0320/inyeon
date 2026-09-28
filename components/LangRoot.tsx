"use client";

import { Fragment, useEffect, type ReactNode } from "react";

import { DEFAULT_LANG, detectLang, setLang } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

/**
 * 지금 언어를 정하고, 바뀌면 아래를 통째로 다시 그린다.
 *
 * 하이드레이션 전에는 서버가 구운 HTML과 맞춰야 하므로 기본 언어로 그린다. 저장소를
 * 읽은 뒤에야 고른 언어(없으면 기기 언어)로 넘어간다.
 */
export default function LangRoot({ children }: { children: ReactNode }) {
  const { state, hydrated } = useAppState();
  const lang = hydrated ? (state.settings.language ?? detectLang()) : DEFAULT_LANG;
  // 렌더 중에 정한다. 아래 컴포넌트들이 바로 이 렌더에서 읽기 때문이다.
  setLang(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <Fragment key={lang}>{children}</Fragment>;
}
