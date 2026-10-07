"use client";

import type { ReactNode } from "react";

import BigNumber from "@/components/BigNumber";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import type { CountResult, PastResult } from "@/lib/calc";
import { formatCount, formatPercent, formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import type { ShareSpec } from "@/lib/shareCard";

const COPY = defineCopy({
  ko: {
    unit: "번",
    filtered: (from: string, cut: string) => `조건 필터를 적용해 ${from}번에서 ${cut} 줄었습니다.`,
    capped: (n: string) => ` (최대 ${n}번 상한 적용)`,
    pastFuture: (past: string, future: string) => `지금까지 ${past}번 · 앞으로 ${future}번`,
    pastNote: (years: string) => `${years} 동안 지금 빈도로 이어졌다고 봤을 때의 어림값입니다.`,
    span: "계산 기간",
  },
  en: {
    unit: "times",
    filtered: (from, cut) => `Your conditions brought this down ${cut} from ${from}.`,
    capped: (n) => ` (capped at ${n})`,
    pastFuture: (past, future) => `${past} so far · ${future} to go`,
    pastNote: (years) => `A rough estimate, assuming the same frequency over ${years}.`,
    span: "Time span",
  },
  ja: {
    unit: "回",
    filtered: (from, cut) => `条件フィルターで${from}回から${cut}減りました。`,
    capped: (n) => `(上限${n}回を適用)`,
    pastFuture: (past, future) => `これまで${past}回 · これから${future}回`,
    pastNote: (years) => `${years}のあいだ今の頻度で続いたと考えたときの目安です。`,
    span: "計算期間",
  },
  es: {
    unit: "veces",
    filtered: (from, cut) => `Con tus condiciones bajó un ${cut} desde ${from}.`,
    capped: (n) => ` (con un máximo de ${n})`,
    pastFuture: (past, future) => `${past} hasta ahora · ${future} por delante`,
    pastNote: (years) => `Estimación aproximada, suponiendo la misma frecuencia durante ${years}.`,
    span: "Periodo",
  },
  zh: {
    unit: "次",
    filtered: (from, cut) => `应用条件筛选后，从${from}次减少了${cut}。`,
    capped: (n) => `（已设上限${n}次）`,
    pastFuture: (past, future) => `至今${past}次 · 往后${future}次`,
    pastNote: (years) => `按照过去${years}一直保持现在的频率估算，仅供参考。`,
    span: "计算期间",
  },
});

/** 계산 결과 한 덩어리: 큰 숫자 + 보조 지표 + 연도별 추이. */
export default function ResultPanel({
  label,
  result,
  sentence,
  stats,
  unknownMessage,
  share,
  shareFileName,
  past,
  story,
}: {
  label: string;
  result: CountResult;
  sentence?: string;
  stats?: { label: string; value: string; sub?: string }[];
  unknownMessage?: string;
  /** 주면 "이미지로 저장" 단추가 붙는다. 계산이 안 될 때는 붙지 않는다. */
  share?: ShareSpec;
  shareFileName?: string[];
  /** 시작점을 넣었고 설정이 켜져 있을 때만 온다. 없으면 막대를 그리지 않는다. */
  past?: PastResult | null;
  /** 큰 숫자 아래의 이야기. 있으면 sentence 대신 이것을 보인다. */
  story?: ReactNode;
}) {
  const t = tr(COPY);
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;

  /*
   * 아직 셀 수 없을 때(나이를 안 넣었을 때)는 한 줄로만 둔다. 큰 "-"가 화면 위 절반을
   * 차지하면 정작 적어야 할 칸이 폰 화면 밖으로 밀린다.
   */
  if (unknownMessage) {
    return (
      <div className="hero py-4 sm:py-5">
        <p className="text-xs font-medium tracking-[0.08em] text-ink-600">{label}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-600">{unknownMessage}</p>
      </div>
    );
  }

  return (
    <div className="hero space-y-6">
      <BigNumber label={label} value={formatCount(result.total)} unit={t.unit} sub={story ? undefined : sentence} />
      {story}

      {/*
        줄어든 사실은 상자에 담지 않는다. 이 블록 안에 또 상자를 넣으면 숫자와
        경쟁한다. 왼쪽에 선 하나만 긋는다.
      */}
      {filtered && (
        <p className="border-l-2 border-accent-400 pl-3 text-xs leading-relaxed text-ink-600">
          {t.filtered(formatCount(result.baselineTotal), formatPercent(cut))}
          {result.cappedAt !== null && t.capped(formatCount(result.cappedAt))}
        </p>
      )}

      {/*
        지나온 쪽과 남은 쪽을 나란히 놓는다. 홈의 인생 막대와 같은 모양이다 —
        이 앱이 처음부터 하던 말("얼마나 지나왔고 얼마나 남았는가")을 인연과
        순간에도 그대로 적용하는 것이라, 다른 그림을 쓸 이유가 없다.
      */}
      {past && past.count >= 1 && (
        <div className="border-t border-hero-line pt-5">
          <div className="flex h-2 overflow-hidden rounded-full bg-hero-line">
            <div
              className="h-full bg-ink-800"
              style={{ width: `${(past.count / (past.count + result.total)) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-ink-600">
            {t.pastFuture(formatCount(past.count), formatCount(result.total))}
          </p>
          <p className="mt-0.5 text-[11px] text-ink-400">
            {t.pastNote(formatYears(past.years))}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-x-4 gap-y-4 border-t border-hero-line pt-5 sm:grid-cols-3">
        <StatCard label={t.span} value={formatYears(result.years)} />
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
