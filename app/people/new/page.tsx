"use client";

import { useState } from "react";

import PersonEditor from "@/components/PersonEditor";
import { defineCopy, tr } from "@/lib/i18n";
import { emptyPerson, useAppState } from "@/lib/store";

const COPY = defineCopy({
  ko: {
    firstTitle: "먼저 한 사람만",
    addTitle: "인연 추가",
    firstBody: "아래에서 고르고 나이만 넣으면 바로 숫자가 나옵니다. 나머지는 나중에 고쳐도 됩니다.",
  },
  en: {
    firstTitle: "Just one person to start",
    addTitle: "Add person",
    firstBody: "Pick below and enter an age — the number appears right away. You can fill in the rest later.",
  },
  ja: {
    firstTitle: "まずは一人だけ",
    addTitle: "大切な人を追加",
    firstBody: "下から選んで年齢を入れるだけで、すぐに数字が出ます。ほかは後から直しても大丈夫です。",
  },
  es: {
    firstTitle: "Empieza por una persona",
    addTitle: "Añadir persona",
    firstBody: "Elige abajo e introduce una edad: el número aparece al momento. El resto puedes cambiarlo después.",
  },
  zh: {
    firstTitle: "先从一个人开始",
    addTitle: "添加亲友",
    firstBody: "在下面选好并填入年龄，数字马上就会出来。其余的可以之后再改。",
  },
});

export default function NewPersonPage() {
  const t = tr(COPY);
  // 매 렌더마다 id가 바뀌면 저장 대상이 흔들리므로 한 번만 만든다.
  const [initial] = useState(emptyPerson);
  const { state, hydrated } = useAppState();
  // 내 정보를 막 채우고 넘어온 사람. 여기가 이 앱의 첫인상이다.
  const first = hydrated && state.people.length === 0;

  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">
          {first ? t.firstTitle : t.addTitle}
        </h1>
        {first && (
          <p className="mt-1 text-sm leading-relaxed text-ink-600">
            {t.firstBody}
          </p>
        )}
      </div>
      <PersonEditor initial={initial} />
    </div>
  );
}
