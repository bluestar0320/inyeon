"use client";

import { useState } from "react";

import PersonEditor from "@/components/PersonEditor";
import { emptyPerson } from "@/lib/store";

export default function NewPersonPage() {
  // 매 렌더마다 id가 바뀌면 저장 대상이 흔들리므로 한 번만 만든다.
  const [initial] = useState(emptyPerson);

  return (
    <div className="space-y-5">
      <h1 className="pt-2 text-xl font-semibold tracking-tight text-ink-900">인연 추가</h1>
      <PersonEditor initial={initial} />
    </div>
  );
}
