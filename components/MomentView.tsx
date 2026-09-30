"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import Polaroid from "@/components/Polaroid";
import ResultPanel from "@/components/ResultPanel";
import WhatIf from "@/components/WhatIf";
import YearBreakdown from "@/components/YearBreakdown";
import { DAYS_PER_YEAR, computeMoment, computePast, resolveAge, toPerYear } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval, formatYears, josa } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { useActions, useAppState } from "@/lib/store";
import { photoFor, photoSrc } from "@/lib/photos";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import type { Moment } from "@/lib/types";

const COPY = defineCopy({
  ko: {
    life: "남은 평생",
    untilAge: (n: number) => `만 ${n}세까지`,
    years: (n: number) => `앞으로 ${n}년`,
    unknown: "내 정보를 먼저 채우면 계산됩니다.",
    unit: "번",
    times: (n: string) => `${n}번`,
    interval: "간격",
    info: "정보",
    addSimilar: "비슷한 것 추가",
    edit: "수정하기",
    frequency: "빈도",
    since: "언제부터",
    until: "언제까지",
    byYear: "연도별 추이",
    back: "목록으로",
    remove: "삭제",
    removed: (title: string) => `${josa(title, "을/를")} 지웠습니다.`,
  },
  en: {
    life: "For life",
    untilAge: (n) => `Until age ${n}`,
    years: (n) => `For ${n} ${n === 1 ? "year" : "years"}`,
    unknown: "Fill in your details first to see the count.",
    unit: "times",
    times: (n) => `${n} ${n === "1" ? "time" : "times"}`,
    interval: "Every",
    info: "Details",
    addSimilar: "Add similar",
    edit: "Edit",
    frequency: "How often",
    since: "Since",
    until: "Until",
    byYear: "Year by year",
    back: "Back to list",
    remove: "Delete",
    removed: (title) => `Deleted ${title}.`,
  },
  ja: {
    life: "これからずっと",
    untilAge: (n) => `${n}歳まで`,
    years: (n) => `これから${n}年`,
    unknown: "自分の情報を入れると計算できます。",
    unit: "回",
    times: (n) => `${n}回`,
    interval: "間隔",
    info: "情報",
    addSimilar: "似たものを追加",
    edit: "編集する",
    frequency: "頻度",
    since: "いつから",
    until: "いつまで",
    byYear: "年ごとの推移",
    back: "一覧へ",
    remove: "削除",
    removed: (title) => `「${title}」を削除しました。`,
  },
  es: {
    life: "Toda la vida",
    untilAge: (n) => `Hasta los ${n} años`,
    years: (n) => `Durante ${n} ${n === 1 ? "año" : "años"}`,
    unknown: "Completa tus datos para calcularlo.",
    unit: "veces",
    times: (n) => `${n} ${n === "1" ? "vez" : "veces"}`,
    interval: "Cada",
    info: "Información",
    addSimilar: "Añadir uno parecido",
    edit: "Editar",
    frequency: "Frecuencia",
    since: "Desde",
    until: "Hasta",
    byYear: "Año por año",
    back: "Volver a la lista",
    remove: "Eliminar",
    removed: (title) => `Se eliminó ${title}.`,
  },
  zh: {
    life: "余生",
    untilAge: (n) => `到${n}岁为止`,
    years: (n) => `未来${n}年`,
    unknown: "先填好我的信息就能计算。",
    unit: "次",
    times: (n) => `${n}次`,
    interval: "间隔",
    info: "信息",
    addSimilar: "添加类似的",
    edit: "编辑",
    frequency: "频率",
    since: "从何时开始",
    until: "到什么时候",
    byYear: "逐年变化",
    back: "返回列表",
    remove: "删除",
    removed: (title) => `已删除“${title}”。`,
  },
});

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="shrink-0 text-xs text-ink-400">{label}</span>
      <span className="text-right text-sm text-ink-800">{value}</span>
    </div>
  );
}

/** 저장된 순간을 보는 화면. 설계 의도는 PersonView와 같다. */
export default function MomentView({ moment }: { moment: Moment }) {
  const router = useRouter();
  const { state } = useAppState();
  const { saveMoment, removeMoment } = useActions();
  const t = tr(COPY);
  const copy = copyFor(state.settings.tone);

  // "만약에"로 바꿔 보는 빈도와 조건. 저장은 따로 눌러야 한다.
  const [draftSetup, setDraftSetup] = useState({ frequency: moment.frequency, filters: moment.filters });

  const draft = useMemo(() => ({ ...moment, ...draftSetup }), [moment, draftSetup]);
  const result = useMemo(() => computeMoment(draft, state.profile), [draft, state.profile]);

  const perYear = toPerYear(draftSetup.frequency);
  const horizonText =
    moment.horizon.kind === "life"
      ? t.life
      : moment.horizon.kind === "untilAge"
        ? t.untilAge(moment.horizon.age)
        : t.years(moment.horizon.years);

  return (
    <div className="space-y-5">
      <div className="flex justify-center pt-2">
        <Polaroid photo={photoFor(moment)} size="lg" tilt={-2}>
          <span aria-hidden="true" className="font-album mt-2 block px-1 text-center text-sm text-ink-800">{moment.title}</span>
        </Polaroid>
      </div>
      <ResultPanel
        label={copy.momentLabel}
        result={result}
        sentence={copy.momentSentence(moment.title, formatCount(result.total))}
        unknownMessage={result.horizonYears === null ? t.unknown : undefined}
        share={{
          emoji: moment.emoji,
          photo: photoSrc(photoFor(moment)),
          title: moment.title,
          subtitle: copy.momentLabel,
          value: formatCount(result.total),
          unit: t.unit,
          caption: `${formatFrequency(draftSetup.frequency)} · ${formatYears(result.horizonYears)}`,
        }}
        shareFileName={[moment.title, t.times(formatCount(result.total))]}
        past={state.settings.showPast ? computePast(
                moment.frequency,
                moment.since,
                undefined,
                state.profile ? resolveAge(state.profile) : null,
              ) : null}
        stats={[
          { label: t.interval, value: formatInterval(perYear > 0 ? DAYS_PER_YEAR / perYear : null) },
        ]}
      />

      <div className="card">
        {/* 제목과 히어로에 이미 나온 이름을 세 번째로 쓰지 않는다. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.info}</p>
          <div className="flex shrink-0 gap-2">
            {/* 보던 것의 변주를 바로 만들 수 있어야 한다. 목록으로 나갔다가 처음부터
                다시 고르게 하면 같은 일을 두 번 시키는 것이다. */}
            <Link href={`/moments/new?from=${moment.id}`} className="btn-secondary" prefetch={false}>
              {t.addSimilar}
            </Link>
            <Link href={`/moments/edit?id=${moment.id}`} className="btn-secondary" prefetch={false}>
              {t.edit}
            </Link>
          </div>
        </div>

        <div className="mt-3 divide-y divide-ink-200/60 border-t border-ink-200/60 pt-1">
          <Row label={t.frequency} value={formatFrequency(moment.frequency)} />
          {moment.since && <Row label={t.since} value={moment.since} />}
          <Row label={t.until} value={horizonText} />
        </div>

        {moment.note && (
          <p className="mt-3 whitespace-pre-wrap border-t border-ink-200/60 pt-3 text-sm text-ink-600">
            {moment.note}
          </p>
        )}
      </div>

      <WhatIf
        draft={draftSetup}
        onDraft={setDraftSetup}
        saved={{ frequency: moment.frequency, filters: moment.filters }}
        totalFor={(setup) => computeMoment({ ...moment, ...setup }, state.profile).total}
        scenarios={moment.scenarios ?? []}
        onScenarios={(scenarios) => saveMoment({ ...moment, scenarios, updatedAt: new Date().toISOString() })}
        onApply={() => saveMoment({ ...moment, ...draftSetup, updatedAt: new Date().toISOString() })}
      />

      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">{t.byYear}</p>
        <YearBreakdown slices={result.slices} />
      </div>

      <div className="flex items-center gap-2">
        <Link href="/moments" className="btn-secondary">
          {t.back}
        </Link>
        <button
          type="button"
          className="btn-danger ml-auto"
          onClick={() => {
            removeMoment(moment.id);
            offerUndo(t.removed(moment.title), () => saveMoment(moment));
            router.push("/moments");
          }}
        >
          {t.remove}
        </button>
      </div>
    </div>
  );
}
