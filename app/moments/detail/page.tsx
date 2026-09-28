"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import MomentView from "@/components/MomentView";
import { defineCopy, tr } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    back: "목록으로",
    notFound: "찾을 수 없는 항목입니다.",
  },
  en: {
    loading: "Loading…",
    back: "Back to list",
    notFound: "We couldn't find this item.",
  },
  ja: {
    loading: "読み込み中…",
    back: "一覧へ戻る",
    notFound: "この項目が見つかりません。",
  },
  es: {
    loading: "Cargando…",
    back: "Volver a la lista",
    notFound: "No encontramos este elemento.",
  },
  zh: {
    loading: "加载中…",
    back: "返回列表",
    notFound: "找不到这一项。",
  },
});

/** 주소를 조회 문자열로 두는 이유는 app/people/detail/page.tsx의 설명과 같다. */
function Detail() {
  const t = tr(COPY);
  const id = useSearchParams().get("id");
  const { state, hydrated } = useAppState();
  const moment = state.moments.find((m) => m.id === id);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  if (!moment) {
    return (
      <div className="card mt-6 space-y-3">
        <p className="text-sm text-ink-600">{t.notFound}</p>
        <Link href="/moments" className="btn-secondary">
          {t.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">
        {moment.emoji} {moment.title}
      </h1>
      <MomentView key={moment.id} moment={moment} />
    </div>
  );
}

export default function MomentDetailPage() {
  const t = tr(COPY);
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>}>
      <Detail />
    </Suspense>
  );
}
