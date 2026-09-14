"use client";

import BigNumber from "@/components/BigNumber";
import StatCard from "@/components/StatCard";
import YearBreakdown from "@/components/YearBreakdown";
import type { CountResult } from "@/lib/calc";
import { formatCount, formatPercent, formatYears } from "@/lib/format";

/** 계산 결과 한 덩어리: 큰 숫자 + 보조 지표 + 연도별 추이. */
export default function ResultPanel({
  label,
  result,
  sentence,
  stats,
  unknownMessage,
}: {
  label: string;
  result: CountResult;
  sentence?: string;
  stats?: { label: string; value: string; sub?: string }[];
  unknownMessage?: string;
}) {
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;

  if (unknownMessage) {
    return (
      <div className="card">
        <BigNumber label={label} value="-" muted sub={unknownMessage} />
      </div>
    );
  }

  return (
    <div className="card space-y-5">
      <BigNumber label={label} value={formatCount(result.total)} unit="번" sub={sentence} />

      {filtered && (
        <p className="rounded-xl bg-accent-50 px-3 py-2 text-xs text-accent-600">
          조건 필터를 적용해 {formatCount(result.baselineTotal)}번에서{" "}
          {formatPercent(cut)} 줄었습니다.
          {result.cappedAt !== null && ` (최대 ${formatCount(result.cappedAt)}번 상한 적용)`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatCard label="계산 기간" value={formatYears(result.years)} />
        {stats?.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} />
        ))}
      </div>

      {result.slices.length > 1 && <YearBreakdown slices={result.slices} />}
    </div>
  );
}
