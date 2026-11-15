"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useDeckRow } from "@/lib/deckRow";
import { defineCopy, tr } from "@/lib/i18n";
import { confirmLeave } from "@/lib/unsaved";

const COPY = defineCopy({
  ko: { brand: "몇번더", back: "뒤로", people: "인연", moments: "순간" },
  en: { brand: "How Many More", back: "Back", people: "People", moments: "Moments" },
  ja: { brand: "あと何回", back: "戻る", people: "人", moments: "瞬間" },
  es: { brand: "Cuántas más", back: "Atrás", people: "Personas", moments: "Momentos" },
  zh: { brand: "还有几次", back: "返回", people: "亲友", moments: "时光" },
});

// 앱 안에서 화면을 옮겨 온 적이 있는지. 새로고침하면 false로 돌아가고, 그때는 첫 화면으로 간다.
let moved = false;

const DOC_PAGE = /^\/(about|privacy|terms|reads)(\/|$)/;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = tr(COPY);
  const row = useDeckRow();
  const first = useRef<string | null>(null);

  useEffect(() => {
    if (first.current === null) first.current = pathname;
    else if (pathname !== first.current) moved = true;
  }, [pathname]);

  function back(): void {
    // 편집 중 저장하지 않은 게 있으면 화면을 옮기기 전에 한 번 묻는다.
    if (!confirmLeave()) return;
    if (moved) router.back();
    else router.push(DOC_PAGE.test(pathname) ? "/settings" : "/");
  }

  return (
    /*
      위쪽 여백은 상태바 높이만큼이다. APK에서 웹뷰가 상태바 밑까지 올라오므로,
      이 머리글이 그 영역까지 칠해서 상태바 배경이 되고 단추는 시계 아래로 내려간다.
      브라우저에서는 인셋이 0이라 지금과 똑같다.
    */
    <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-page/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {pathname === "/" ? (
          <>
            <span className="text-sm font-semibold tracking-tight text-ink-900">{t[row]}</span>
            <span className="text-xs text-ink-400">{t.brand}</span>
          </>
        ) : (
          <button
            type="button"
            aria-label={t.back}
            onClick={back}
            className="-my-2 -ml-2 flex min-h-11 min-w-11 items-center justify-center text-lg text-ink-900"
          >
            ←
          </button>
        )}
      </div>
    </header>
  );
}
