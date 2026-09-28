"use client";

import MarriageEditor from "@/components/MarriageEditor";
import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: {
    title: "결혼 계획",
    subtitle: "목표한 나이까지 새로운 사람을 몇 번 만날 수 있는지 셉니다.",
  },
  en: {
    title: "Marriage plan",
    subtitle: "Counts how many new people you can meet before your target age.",
  },
  ja: {
    title: "結婚の計画",
    subtitle: "目標の年齢までに、新しい人と何回出会えるかを数えます。",
  },
  es: {
    title: "Plan de boda",
    subtitle: "Cuenta cuántas personas nuevas puedes conocer antes de la edad que te propones.",
  },
  zh: {
    title: "结婚计划",
    subtitle: "计算在目标年龄之前还能认识多少位新朋友。",
  },
});

export default function MarriagePage() {
  const t = tr(COPY);
  return (
    <div className="space-y-5">
      <div className="pt-2">
        <h1 className="text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
        <p className="mt-1 text-sm text-ink-400">
          {t.subtitle}
        </p>
      </div>
      <MarriageEditor />
    </div>
  );
}
