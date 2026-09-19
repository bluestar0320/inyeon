"use client";

import BigNumber from "@/components/BigNumber";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import type { CountResult } from "@/lib/calc";
import { formatCount, formatPercent, formatYears } from "@/lib/format";
import type { ShareSpec } from "@/lib/shareCard";

/** 계산 결과 한 덩어리: 큰 숫자 + 보조 지표 + 연도별 추이. */
export default function ResultPanel({
  label,
  result,
  sentence,
  stats,
  unknownMessage,
  share,
  shareFileName,
}: {
  label: string;
  result: CountResult;
  sentence?: string;
  stats?: { label: string; value: string; sub?: string }[];
  unknownMessage?: string;
  /** 주면 "이미지로 저장" 단추가 붙는다. 계산이 안 될 때는 붙지 않는다. */
  share?: ShareSpec;
  shareFileName?: string[];
}) {
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;

  if (unknownMessage) {
    return (
      <div className="hero">
        <BigNumber label={label} value="-" muted sub={unknownMessage} />
      </div>
    );
  }

  return (
    <div className="hero space-y-6">
      <BigNumber label={label} value={formatCount(result.total)} unit="번" sub={sentence} />

      {/*
        줄어든 사실은 상자에 담지 않는다. 이 블록 안에 또 상자를 넣으면 숫자와
        경쟁한다. 왼쪽에 선 하나만 긋는다.
      */}
      {filtered && (
        <p className="border-l-2 border-accent-400 pl-3 text-xs leading-relaxed text-ink-600">
          조건 필터를 적용해 {formatCount(result.baselineTotal)}번에서{" "}
          {formatPercent(cut)} 줄었습니다.
          {result.cappedAt !== null && ` (최대 ${formatCount(result.cappedAt)}번 상한 적용)`}
        </p>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hero-line pt-5 sm:grid-cols-3">
        <StatCard label="계산 기간" value={formatYears(result.years)} />
        {stats?.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} sub={stat.sub} />
        ))}
      </div>

      {/*
        연도별 추이는 여기 두지 않는다. 결과 카드 안에 넣었더니 입력·메모 칸이
        화면 한참 아래로 밀렸다. 필요한 화면이 원하는 자리에 <YearBreakdown>을 놓는다.
      */}
      {share && <ShareButton spec={share} fileNameParts={shareFileName ?? [share.title]} />}
    </div>
  );
}
