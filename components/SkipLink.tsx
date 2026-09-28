"use client";

import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: "본문으로 건너뛰기",
  en: "Skip to content",
  ja: "本文へ移動",
  es: "Saltar al contenido",
  zh: "跳到正文",
});

/** 키보드 사용자가 내비게이션 네 개를 매번 지나치지 않도록. 평소엔 숨어 있다. */
export default function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-30 focus:rounded-lg focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-sm focus:text-onInk"
    >
      {tr(COPY)}
    </a>
  );
}
