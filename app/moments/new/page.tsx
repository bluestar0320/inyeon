"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import MomentEditor from "@/components/MomentEditor";
import { emptyMoment, momentFrom, useAppState } from "@/lib/store";

/*
 * ?from=<id> 로 들어오면 그 순간을 본떠 시작한다.
 * 보고 있던 것의 변주를 바로 만들 수 있어야 한다 — "수영"을 보다가 "바다 수영"을
 * 넣고 싶어질 때, 목록으로 나갔다가 처음부터 다시 고르게 하면 안 된다.
 */
function NewMoment() {
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
          {copying ? "비슷한 것 추가" : "순간 추가"}
        </h1>
        {copying && (
          <p className="mt-1 text-sm text-ink-600">
            빈도·기간·조건을 그대로 가져왔습니다. 이름만 고쳐서 저장하세요.
          </p>
        )}
      </div>
      <MomentEditor key={initial.id} initial={initial} />
    </div>
  );
}

export default function NewMomentPage() {
  return (
    <Suspense fallback={<p className="py-12 text-center text-sm text-ink-400">불러오는 중…</p>}>
      <NewMoment />
    </Suspense>
  );
}
