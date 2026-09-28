"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import MomentEditor from "@/components/MomentEditor";
import { defineCopy, tr } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    back: "목록으로",
    notFound: "찾을 수 없는 항목입니다.",
    editTitle: (name: string) => `${name} 수정`,
  },
  en: {
    loading: "Loading…",
    back: "Back to list",
    notFound: "We couldn't find this item.",
    editTitle: (name) => `Edit ${name}`,
  },
  ja: {
    loading: "読み込み中…",
    back: "一覧へ戻る",
    notFound: "この項目が見つかりません。",
    editTitle: (name) => `${name}を編集`,
  },
  es: {
    loading: "Cargando…",
    back: "Volver a la lista",
    notFound: "No encontramos este elemento.",
    editTitle: (name) => `Editar ${name}`,
  },
  zh: {
    loading: "加载中…",
    back: "返回列表",
    notFound: "找不到这一项。",
    editTitle: (name) => `编辑${name}`,
  },
});

/** 주소를 조회 문자열로 두는 이유는 app/people/detail/page.tsx의 설명과 같다. */
function Edit() {
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
        {t.editTitle(moment.title)}
      </h1>
      <MomentEditor key={moment.id} initial={moment} />
    </div>
  );
}

export default function MomentEditPage() {
  const t = tr(COPY);
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>}>
      <Edit />
    </Suspense>
  );
}
