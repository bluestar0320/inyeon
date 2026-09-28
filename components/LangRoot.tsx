"use client";

import { Fragment, useEffect, useRef, type ReactNode } from "react";

import { DEFAULT_LANG, detectLang, setLang } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import { isDirty } from "@/lib/unsaved";

/**
 * 지금 언어를 정하고, 바뀌면 아래를 통째로 다시 그린다.
 *
 * 하이드레이션 전에는 서버가 구운 HTML과 맞춰야 하므로 기본 언어로 그린다. 저장소를
 * 읽은 뒤에야 고른 언어(없으면 기기 언어)로 넘어간다.
 */
export default function LangRoot({ children }: { children: ReactNode }) {
  const { state, hydrated } = useAppState();
  const wanted = hydrated ? (state.settings.language ?? detectLang()) : DEFAULT_LANG;
  /*
   * 언어가 바뀌면 아래를 통째로 다시 그리므로 입력 중인 내용이 날아간다. 같은 탭에서는
   * 편집 중에 언어를 바꿀 길이 없지만, 다른 탭에서 바꾸면 저장 이벤트로 여기까지 온다.
   * 저장하지 않은 게 있으면 지금 언어를 붙들고 있다가, 다음에 그릴 때 넘어간다.
   */
  const applied = useRef(wanted);
  if (applied.current !== wanted && !(hydrated && isDirty())) applied.current = wanted;
  const lang = hydrated ? applied.current : DEFAULT_LANG;
  // 렌더 중에 정한다. 아래 컴포넌트들이 바로 이 렌더에서 읽기 때문이다.
  setLang(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return <Fragment key={lang}>{children}</Fragment>;
}
