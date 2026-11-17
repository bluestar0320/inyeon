"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { ROW_NAMES, useDeckRow } from "@/lib/deckRow";
import { defineCopy, tr } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import { clearDirty, confirmLeave, leaveTo, trail } from "@/lib/unsaved";

const COPY = defineCopy({
  ko: { brand: "몇번더", back: "뒤로" },
  en: { brand: "How Many More", back: "Back" },
  ja: { brand: "あと何回", back: "戻る" },
  es: { brand: "Cuántas más", back: "Atrás" },
  zh: { brand: "还有几次", back: "返回" },
});

const DOC_PAGE = /^\/(about|privacy|terms|reads)(\/|$)/;

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const t = tr(COPY);
  const row = useDeckRow();
  const profile = useAppState().state.profile;

  useEffect(() => {
    const here = pathname + window.location.search;
    // 바로 앞 화면으로 왔으면 뒤로 간 것이다.
    if (trail.length > 1 && trail[trail.length - 2] === here) trail.pop();
    else if (trail[trail.length - 1] !== here) trail.push(here);
  }, [pathname]);

  function back(): void {
    // 편집 중 저장하지 않은 게 있으면 화면을 옮기기 전에 한 번 묻는다.
    if (!confirmLeave()) return;
    // 이미 물었으니 편집기의 뒤로 가기 가드가 다시 묻지 않게 표시부터 지운다.
    if (trail.length > 1) {
      clearDirty();
      router.back();
    } else leaveTo(router, DOC_PAGE.test(pathname) ? "/settings" : "/");
  }

  return (
    /*
      위쪽 여백은 상태바 높이만큼이다. APK에서 웹뷰가 상태바 밑까지 올라오므로,
      이 머리글이 그 영역까지 칠해서 상태바 배경이 되고 단추는 시계 아래로 내려간다.
      브라우저에서는 인셋이 0이라 지금과 똑같다.
    */
    <header className="sticky top-0 z-10 border-b border-ink-200/70 bg-page/90 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        {/* 처음 온 사람의 시작 설정 화면에는 돌아갈 곳이 없다(첫 화면이 다시 이리로 보낸다). */}
        {pathname === "/" || (pathname.startsWith("/setup") && !profile) ? (
          <>
            <span className="text-lg font-semibold tracking-tight text-ink-900">{pathname === "/" ? tr(ROW_NAMES)[row] : ""}</span>
            <span className="text-sm text-ink-400">{t.brand}</span>
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
