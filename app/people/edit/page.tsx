"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";

import PersonEditor from "@/components/PersonEditor";
import { defineCopy, tr } from "@/lib/i18n";
import { useAppState } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    back: "목록으로",
    notFound: "찾을 수 없는 인연입니다.",
    editTitle: (name: string) => `${name} 수정`,
  },
  en: {
    loading: "Loading…",
    back: "Back to list",
    notFound: "We couldn't find this person.",
    editTitle: (name) => `Edit ${name}`,
  },
  ja: {
    loading: "読み込み中…",
    back: "一覧へ戻る",
    notFound: "この人が見つかりません。",
    editTitle: (name) => `${name}を編集`,
  },
  es: {
    loading: "Cargando…",
    back: "Volver a la lista",
    notFound: "No encontramos a esta persona.",
    editTitle: (name) => `Editar ${name}`,
  },
  zh: {
    loading: "加载中…",
    back: "返回列表",
    notFound: "找不到这位亲友。",
    editTitle: (name) => `编辑${name}`,
  },
});

/**
 * 고치는 화면. 보는 화면(/people/detail)과 일부러 나눠 두었다.
 *
 * 한 화면에서 보기와 고치기를 겸하면 입력 칸이 늘 펼쳐져 있어 조잡하고, 무엇보다
 * 이 앱의 주인공인 숫자가 폼에 파묻힌다. 주소를 나누면 뒤로 가기도 자연스럽고,
 * 저장하지 않고 나가려 할 때의 경고도 고치는 화면에만 붙는다.
 */
function Edit() {
  const t = tr(COPY);
  const id = useSearchParams().get("id");
  const { state, hydrated } = useAppState();
  const found = state.people.find((p) => p.id === id);
  /*
   * 편집 중에 다른 창에서 지워져도 이 화면을 치우지 않는다. 치우면 적던 내용이 날아간다.
   * 마지막으로 본 판을 붙들고, 편집기가 "지워졌다"고 알린다(EditConflict).
   */
  const last = useRef(found);
  if (found) last.current = found;
  const person = found ?? (last.current?.id === id ? last.current : undefined);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  if (!person) {
    return (
      <div className="card mt-6 space-y-3">
        <p className="text-sm text-ink-600">{t.notFound}</p>
        <Link href="/people" className="btn-secondary">
          {t.back}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">
        {t.editTitle(person.name)}
      </h1>
      <PersonEditor key={person.id} initial={person} />
    </div>
  );
}

export default function PersonEditPage() {
  const t = tr(COPY);
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>}>
      <Edit />
    </Suspense>
  );
}
