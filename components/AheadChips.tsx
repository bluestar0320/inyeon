"use client";

import { useId } from "react";

import { aheadFor } from "@/lib/future";
import { defineCopy, tr } from "@/lib/i18n";
import type { Rel } from "@/lib/rel";
import type { Ahead } from "@/lib/types";

/* 인연 편집 화면의 「앞으로」 칩. 관계마다 보이는 칩이 다르고(lib/future.ts), 하나도 없으면 줄째 감춘다. */
const COPY = defineCopy({
  ko: {
    title: "앞으로",
    names: { marry: "결혼할 것 같아요", child: "아이가 생길 것 같아요", health: "건강이 나빠지고 있어요" },
  },
  en: {
    title: "Coming up",
    names: { marry: "Likely to marry", child: "Likely to have a child", health: "Health is getting worse" },
  },
  ja: {
    title: "これから",
    names: { marry: "結婚しそう", child: "子どもができそう", health: "体調が悪くなってきた" },
  },
  es: {
    title: "Lo que viene",
    names: { marry: "Probablemente se case", child: "Probablemente tenga hijos", health: "Su salud está empeorando" },
  },
  zh: {
    title: "接下来",
    names: { marry: "可能要结婚了", child: "可能要有孩子了", health: "身体越来越差" },
  },
});

export default function AheadChips({
  rel,
  ahead,
  onChange,
}: {
  rel: Rel;
  ahead: Ahead[] | undefined;
  onChange: (next: Ahead[] | undefined) => void;
}) {
  const t = tr(COPY);
  const id = useId();
  const shown = aheadFor(rel);
  if (!shown.length) return null;
  return (
    <div role="group" aria-labelledby={`${id}-t`} data-testid="ahead-chips">
      <p id={`${id}-t`} className="label">{t.title}</p>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((key) => {
          const pressed = Boolean(ahead?.includes(key));
          return (
            <button
              key={key}
              type="button"
              aria-pressed={pressed}
              className={pressed ? "chip min-h-11 chip-active" : "chip min-h-11"}
              onClick={() => {
                const next = pressed ? (ahead ?? []).filter((a) => a !== key) : [...(ahead ?? []), key];
                onChange(next.length ? next : undefined);
              }}
            >
              {t.names[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
