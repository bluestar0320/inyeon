"use client";

import { dismissUndo, takeUndo, useUndo } from "@/lib/undo";

/** 방금 지운 것을 되돌릴 기회를 잠깐 띄우는 막대. 화면 맨 아래에 뜬다. */
export default function UndoBar() {
  const entry = useUndo();
  if (!entry) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-md items-center gap-3 rounded-2xl bg-ink-900 px-4 py-3 text-sm text-white shadow-lg">
        <span className="min-w-0 flex-1 truncate">{entry.message}</span>
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 text-sm font-semibold text-accent-100 transition hover:bg-white/10"
          onClick={takeUndo}
        >
          되돌리기
        </button>
        <button
          type="button"
          className="shrink-0 rounded-lg px-1.5 py-1 text-white/50 transition hover:bg-white/10 hover:text-white"
          onClick={dismissUndo}
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
