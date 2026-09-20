"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import FilterEditor from "@/components/FilterEditor";
import ResultPanel from "@/components/ResultPanel";
import YearBreakdown from "@/components/YearBreakdown";
import { DAYS_PER_YEAR, computeMoment, computePast, toPerYear } from "@/lib/calc";
import { formatCount, formatFrequency, formatInterval, formatYears } from "@/lib/format";
import { useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import { offerUndo } from "@/lib/undo";
import type { CalcFilter, Moment } from "@/lib/types";

function sameFilters(a: CalcFilter[], b: CalcFilter[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

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
  const copy = copyFor(state.settings.tone);

  const [filters, setFilters] = useState<CalcFilter[]>(moment.filters);
  const simulating = !sameFilters(filters, moment.filters);

  const draft = useMemo(() => ({ ...moment, filters }), [moment, filters]);
  const result = useMemo(() => computeMoment(draft, state.profile), [draft, state.profile]);
  const saved = useMemo(() => computeMoment(moment, state.profile), [moment, state.profile]);

  const perYear = toPerYear(moment.frequency);
  const horizonText =
    moment.horizon.kind === "life"
      ? "남은 평생"
      : moment.horizon.kind === "untilAge"
        ? `만 ${moment.horizon.age}세까지`
        : `앞으로 ${moment.horizon.years}년`;

  return (
    <div className="space-y-5">
      <ResultPanel
        label={copy.momentLabel}
        result={result}
        sentence={copy.momentSentence(moment.title, Math.round(result.total).toLocaleString("ko-KR"))}
        unknownMessage={
          result.horizonYears === null ? "내 정보를 먼저 채우면 계산됩니다." : undefined
        }
        share={{
          emoji: moment.emoji,
          title: moment.title,
          subtitle: copy.momentLabel,
          value: formatCount(result.total),
          unit: "번",
          caption: `${formatFrequency(moment.frequency)} · ${formatYears(result.horizonYears)}`,
        }}
        shareFileName={[moment.title, `${formatCount(result.total)}번`]}
        past={state.settings.showPast ? computePast(moment.frequency, moment.since) : null}
        stats={[
          { label: "간격", value: formatInterval(perYear > 0 ? DAYS_PER_YEAR / perYear : null) },
        ]}
      />

      <div className="card">
        {/* 제목과 히어로에 이미 나온 이름을 세 번째로 쓰지 않는다. */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold tracking-[0.1em] text-ink-400">정보</p>
          <div className="flex shrink-0 gap-2">
            {/* 보던 것의 변주를 바로 만들 수 있어야 한다. 목록으로 나갔다가 처음부터
                다시 고르게 하면 같은 일을 두 번 시키는 것이다. */}
            <Link href={`/moments/new?from=${moment.id}`} className="btn-secondary">
              비슷한 것 추가
            </Link>
            <Link href={`/moments/edit?id=${moment.id}`} className="btn-secondary">
              수정하기
            </Link>
          </div>
        </div>

        <div className="mt-3 divide-y divide-ink-200/60 border-t border-ink-200/60 pt-1">
          <Row label="빈도" value={formatFrequency(moment.frequency)} />
          {moment.since && <Row label="언제부터" value={moment.since} />}
          <Row label="언제까지" value={horizonText} />
        </div>

        {moment.note && (
          <p className="mt-3 whitespace-pre-wrap border-t border-ink-200/60 pt-3 text-sm text-ink-600">
            {moment.note}
          </p>
        )}
      </div>

      <div className="card space-y-4">
        <div>
          <p className="text-sm font-semibold text-ink-800">조건을 바꿔 보기</p>
          <p className="mt-1 text-xs text-ink-400">
            여기서 바꾼 것은 저장되지 않습니다. 숫자가 어떻게 달라지는지만 봅니다.
          </p>
        </div>

        {simulating && (
          <div className="rounded-xl bg-accent-50 px-3 py-2.5">
            <p className="text-xs text-accent-600">
              지금 {formatCount(result.total)}번 · 저장된 값은 {formatCount(saved.total)}번
            </p>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn-quiet" onClick={() => setFilters(moment.filters)}>
                되돌리기
              </button>
              <button
                type="button"
                className="btn-quiet"
                onClick={() =>
                  saveMoment({ ...moment, filters, updatedAt: new Date().toISOString() })
                }
              >
                이대로 저장
              </button>
            </div>
          </div>
        )}

        <FilterEditor filters={filters} onChange={setFilters} />
      </div>

      <div className="card space-y-2">
        <p className="text-sm font-semibold text-ink-800">연도별 추이</p>
        <YearBreakdown slices={result.slices} />
      </div>

      <div className="flex items-center gap-2">
        <Link href="/moments" className="btn-secondary">
          목록으로
        </Link>
        <button
          type="button"
          className="btn-danger ml-auto"
          onClick={() => {
            removeMoment(moment.id);
            offerUndo(`${moment.title}을(를) 지웠습니다.`, () => saveMoment(moment));
            router.push("/moments");
          }}
        >
          삭제
        </button>
      </div>
    </div>
  );
}
