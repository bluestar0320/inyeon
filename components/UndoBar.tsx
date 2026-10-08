"use client";

import { defineCopy, tr } from "@/lib/i18n";
import { dismissUndo, takeUndo, useUndo } from "@/lib/undo";

const COPY = defineCopy({
  ko: { undo: "되돌리기", close: "닫기" },
  en: { undo: "Undo", close: "Close" },
  ja: { undo: "元に戻す", close: "閉じる" },
  es: { undo: "Deshacer", close: "Cerrar" },
  zh: { undo: "撤销", close: "关闭" },
});

/** 방금 지운 것을 되돌릴 기회를 잠깐 띄우는 막대. 화면 맨 아래에 뜬다. */
export default function UndoBar() {
  const entry = useUndo();
  if (!entry) return null;
  const t = tr(COPY);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 flex justify-center px-4 pb-4 sm:bottom-0 sm:pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-toast px-4 py-3 text-sm text-toast-fg shadow-lg">
        {/* 「만났어요」 한 마디처럼 긴 문장도 있으니 자르지 않고 줄을 넘긴다. */}
        <span className="min-w-0 flex-1 leading-snug">{entry.message}</span>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-toast-accent transition hover:bg-toast-fg/10"
          onClick={takeUndo}
        >
          {t.undo}
        </button>
        <button
          type="button"
          className="shrink-0 rounded-lg px-1.5 py-1 text-toast-fg/50 transition hover:bg-toast-fg/10 hover:text-toast-fg"
          onClick={dismissUndo}
          aria-label={t.close}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
