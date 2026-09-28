"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import MomentEditor from "@/components/MomentEditor";
import { defineCopy, tr } from "@/lib/i18n";
import { emptyMoment, momentFrom, useAppState } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    loading: "불러오는 중…",
    back: "목록으로",
    copyTitle: "비슷한 것 추가",
    addTitle: "순간 추가",
    copyBody: "빈도·기간·조건을 그대로 가져왔습니다. 이름만 고쳐서 저장하세요.",
  },
  en: {
    loading: "Loading…",
    back: "Back to list",
    copyTitle: "Add something similar",
    addTitle: "Add moment",
    copyBody: "Frequency, period, and conditions are carried over. Just change the name and save.",
  },
  ja: {
    loading: "読み込み中…",
    back: "一覧へ戻る",
    copyTitle: "似たものを追加",
    addTitle: "ひとときを追加",
    copyBody: "頻度・期間・条件をそのまま引き継ぎました。名前だけ変えて保存してください。",
  },
  es: {
    loading: "Cargando…",
    back: "Volver a la lista",
    copyTitle: "Añadir algo parecido",
    addTitle: "Añadir momento",
    copyBody: "Hemos copiado la frecuencia, el periodo y las condiciones. Solo cambia el nombre y guarda.",
  },
  zh: {
    loading: "加载中…",
    back: "返回列表",
    copyTitle: "添加类似的",
    addTitle: "添加时光",
    copyBody: "已沿用频率、期间和条件。只需改个名字再保存。",
  },
});

/*
 * ?from=<id> 로 들어오면 그 순간을 본떠 시작한다.
 * 보고 있던 것의 변주를 바로 만들 수 있어야 한다 — "수영"을 보다가 "바다 수영"을
 * 넣고 싶어질 때, 목록으로 나갔다가 처음부터 다시 고르게 하면 안 된다.
 */
function NewMoment() {
  const t = tr(COPY);
  const from = useSearchParams().get("from");
  const { state, hydrated } = useAppState();
  const [initial, setInitial] = useState(emptyMoment);
  const [seeded, setSeeded] = useState(false);

  // 저장된 값은 하이드레이션 뒤에야 들어오므로 한 번만 옮겨 담는다.
  if (hydrated && from && !seeded) {
    const source = state.moments.find((m) => m.id === from);
    if (source) setInitial(momentFrom(source));
    setSeeded(true);
  }

  const copying = Boolean(from) && seeded && state.moments.some((m) => m.id === from);

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {copying ? t.copyTitle : t.addTitle}
        </h1>
        {copying && (
          <p className="mt-1 text-sm text-ink-600">
            {t.copyBody}
          </p>
        )}
      </div>
      <MomentEditor key={initial.id} initial={initial} />
    </div>
  );
}

export default function NewMomentPage() {
  const t = tr(COPY);
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>}>
      <NewMoment />
    </Suspense>
  );
}
