"use client";

import { useState } from "react";

import PersonEditor from "@/components/PersonEditor";
import { emptyPerson, useAppState } from "@/lib/store";

export default function NewPersonPage() {
  // 매 렌더마다 id가 바뀌면 저장 대상이 흔들리므로 한 번만 만든다.
  const [initial] = useState(emptyPerson);
  const { state, hydrated } = useAppState();
  // 내 정보를 막 채우고 넘어온 사람. 여기가 이 앱의 첫인상이다.
  const first = hydrated && state.people.length === 0;

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {first ? "먼저 한 사람만" : "인연 추가"}
        </h1>
        {first && (
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            아래에서 고르고 나이만 넣으면 바로 숫자가 나옵니다. 나머지는 나중에 고쳐도
            됩니다.
          </p>
        )}
      </div>
      <PersonEditor initial={initial} />
    </div>
  );
}
