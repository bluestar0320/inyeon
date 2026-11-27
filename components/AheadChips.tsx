"use client";

import { useId } from "react";

import { aheadFor } from "@/lib/future";
import { defineCopy, tr } from "@/lib/i18n";
import type { Rel } from "@/lib/rel";
import type { Ahead } from "@/lib/types";

/* 인연 편집 화면의 「앞으로」 칩. 관계마다 보이는 칩이 다르고(lib/future.ts), 하나도 없으면 줄째 감춘다. */
const COPY = defineCopy({
  ko: {
    title: "앞으로", either: "결혼은 이 사람 이야기일 때만 골라 주세요. 내 결혼은 결혼 계획의 목표 나이로 따져요. 아이·건강은 둘 중 누구 이야기든 괜찮아요.", them: "이 사람 이야기예요.",
    names: { marry: "결혼할 것 같아요", child: "아이가 생길 것 같아요", health: "건강이 나빠지고 있어요" },
  },
  en: {
    title: "Coming up", either: "Marriage means theirs; yours comes from your marriage plan. Child and health can be either of you.", them: "This is about them.",
    names: { marry: "Likely to marry", child: "Likely to have a child", health: "Health is getting worse" },
  },
  ja: {
    title: "これから", either: "結婚は相手の話のときだけ選んでください。自分の結婚は結婚の計画の目標年齢で数えます。子ども・体調はどちらの話でも構いません。", them: "相手の話です。",
    names: { marry: "結婚しそう", child: "子どもができそう", health: "体調が悪くなってきた" },
  },
  es: {
    title: "Lo que viene", either: "La boda es la suya; la tuya sale de tu plan de boda. Hijos y salud pueden ser de cualquiera.", them: "Se refiere a esta persona.",
    names: { marry: "Probablemente se case", child: "Probablemente tenga hijos", health: "Su salud está empeorando" },
  },
  zh: {
    title: "接下来", either: "结婚只在说对方时选，你自己的结婚按结婚计划的目标年龄算。孩子、健康说谁都可以。", them: "说的是对方。",
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
      {/* 결혼·아이·건강이 누구 얘기인지. 친구·형제는 어느 쪽이든 만남이 줄어 같은 값이고, 부모·자녀·배우자는 그 사람 얘기다. */}
      <p className="-mt-1 mb-2 text-xs text-ink-400">{["friend", "other", "sibling"].includes(rel) ? t.either : t.them}</p>
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
