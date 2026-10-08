"use client";

import type { ReactNode } from "react";

import BigNumber from "@/components/BigNumber";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import type { CountResult, PastResult } from "@/lib/calc";
import type { FrequencyUnit } from "@/lib/types";
import { dotsFor } from "@/lib/dots";
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
    perDot: (n: string) => `점 하나 = ${n}번`,
    met: (period: string, n: number) => `${period} 함께한 만남 ${n}번`,
    period: { day: "오늘", week: "이번 주", month: "이번 달", quarter: "이번 분기", year: "올해", year2: "최근 2년", year3: "최근 3년", year5: "최근 5년", year10: "최근 10년" } as Record<FrequencyUnit, string>,
  },
  en: {
    unit: "times",
    filtered: (from, cut) => `Your conditions brought this down ${cut} from ${from}.`,
    capped: (n) => ` (capped at ${n})`,
    pastFuture: (past, future) => `${past} so far · ${future} to go`,
    pastNote: (years) => `A rough estimate, assuming the same frequency over ${years}.`,
    span: "Time span",
    perDot: (n) => `Each dot = ${n} times`,
    met: (period, n) => `Met ${n} ${n === 1 ? "time" : "times"} ${period}`,
    period: { day: "today", week: "this week", month: "this month", quarter: "this quarter", year: "this year", year2: "in the last 2 years", year3: "in the last 3 years", year5: "in the last 5 years", year10: "in the last 10 years" },
  },
  ja: {
    unit: "回",
    filtered: (from, cut) => `条件フィルターで${from}回から${cut}減りました。`,
    capped: (n) => `(上限${n}回を適用)`,
    pastFuture: (past, future) => `これまで${past}回 · これから${future}回`,
    pastNote: (years) => `${years}のあいだ今の頻度で続いたと考えたときの目安です。`,
    span: "計算期間",
    perDot: (n) => `点ひとつ = ${n}回`,
    met: (period, n) => `${period}会えたのは${n}回`,
    period: { day: "今日", week: "今週", month: "今月", quarter: "この四半期", year: "今年", year2: "この2年", year3: "この3年", year5: "この5年", year10: "この10年" },
  },
  es: {
    unit: "veces",
    filtered: (from, cut) => `Con tus condiciones bajó un ${cut} desde ${from}.`,
    capped: (n) => ` (con un máximo de ${n})`,
    pastFuture: (past, future) => `${past} hasta ahora · ${future} por delante`,
    pastNote: (years) => `Estimación aproximada, suponiendo la misma frecuencia durante ${years}.`,
    span: "Periodo",
    perDot: (n) => `Cada punto = ${n} veces`,
    met: (period, n) => `${n} ${n === 1 ? "encuentro" : "encuentros"} ${period}`,
    period: { day: "hoy", week: "esta semana", month: "este mes", quarter: "este trimestre", year: "este año", year2: "en los últimos 2 años", year3: "en los últimos 3 años", year5: "en los últimos 5 años", year10: "en los últimos 10 años" },
  },
  zh: {
    unit: "次",
    filtered: (from, cut) => `应用条件筛选后，从${from}次减少了${cut}。`,
    capped: (n) => `（已设上限${n}次）`,
    pastFuture: (past, future) => `至今${past}次 · 往后${future}次`,
    pastNote: (years) => `按照过去${years}一直保持现在的频率估算，仅供参考。`,
    span: "计算期间",
    perDot: (n) => `每个点 = ${n}次`,
    met: (period, n) => `${period}已见面${n}次`,
    period: { day: "今天", week: "本周", month: "本月", quarter: "本季度", year: "今年", year2: "近2年", year3: "近3年", year5: "近5年", year10: "近10年" },
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
  met,
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
  /** 이번 기간에 「만났어요」로 기록한 만남. 남은 점의 앞쪽을 "함께한 점" 색으로 칠한다. */
  met?: { count: number; unit: FrequencyUnit };
}) {
  const t = tr(COPY);
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;
  const hasPast = Boolean(past && past.count >= 1);
  const dots = dotsFor(hasPast ? past!.count : 0, result.total);
  // 한 번만 만나도 점 하나는 칠한다. 점이 여러 번을 묶고 있어도 "방금 하나 썼다"가 보여야 한다.
  const metDots = met && met.count > 0 ? Math.min(dots.left, Math.max(1, Math.round(met.count / dots.unit))) : 0;

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
        남은 만남을 점으로 센다. 시작점이 있으면 지나온 만남을 흐린 점으로 앞에 깐다 —
        "얼마나 지나왔고 얼마나 남았는가"를 숫자보다 먼저 눈으로 본다.
        많으면 묶는다(lib/dots.ts). 숫자는 바로 위·아래 글자에 있으므로 점은 읽어 주지 않는다.
      */}
      {dots.left > 0 && (
        <div data-testid="dots" className="border-t border-hero-line pt-5">
          <div aria-hidden="true" className="flex flex-wrap gap-1.5">
            {Array.from({ length: dots.past + dots.left }, (_, i) => (
              <span
                key={i}
                className={`h-2 w-2 rounded-full ${i < dots.past ? "bg-hero-line" : i < dots.past + metDots ? "bg-accent-500" : "bg-ink-800"}`}
              />
            ))}
          </div>
          {metDots > 0 && (
            <p data-testid="met-dots" className="mt-2 flex items-center gap-1.5 text-xs text-ink-600">
              <span aria-hidden="true" className="h-2 w-2 rounded-full bg-accent-500" />
              {t.met(t.period[met!.unit], met!.count)}
            </p>
          )}
          {hasPast && (
            <p className="mt-2 text-xs text-ink-600">
              {t.pastFuture(formatCount(past!.count), formatCount(result.total))}
            </p>
          )}
          {dots.unit > 1 && <p className="mt-0.5 text-[11px] text-ink-400">{t.perDot(formatCount(dots.unit))}</p>}
          {hasPast && (
            <p className="mt-0.5 text-[11px] text-ink-400">
              {t.pastNote(formatYears(past!.years))}
            </p>
          )}
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
