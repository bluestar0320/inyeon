"use client";

import type { ReactNode } from "react";

import BigNumber from "@/components/BigNumber";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import type { CountResult, PastResult } from "@/lib/calc";
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
    together: (met: string, missed: string, left: string) => `함께한 만남 ${met}번 · 놓친 만남 ${missed}번 · 앞으로 ${left}번`,
    togetherShort: (met: string, left: string) => `함께한 만남 ${met}번 · 앞으로 ${left}번`,
    estimated: (years: string) => `「언제부터」부터 앱에 넣은 날까지(${years})는 지금 빈도로 어림했어요.`,
    startHint: "만날 때마다 「만났어요」를 누르면 함께한 만남이 쌓여요.",
  },
  en: {
    unit: "times",
    filtered: (from, cut) => `Your conditions brought this down ${cut} from ${from}.`,
    capped: (n) => ` (capped at ${n})`,
    pastFuture: (past, future) => `${past} so far · ${future} to go`,
    pastNote: (years) => `A rough estimate, assuming the same frequency over ${years}.`,
    span: "Time span",
    perDot: (n) => `Each dot = ${n} times`,
    together: (met, missed, left) => `Together ${met} · Missed ${missed} · ${left} to go`,
    togetherShort: (met, left) => `Together ${met} · ${left} to go`,
    estimated: (years) => `From your start date until you added them (${years}) is estimated at the current frequency.`,
    startHint: "Tap “We met” each time you meet and your time together adds up.",
  },
  ja: {
    unit: "回",
    filtered: (from, cut) => `条件フィルターで${from}回から${cut}減りました。`,
    capped: (n) => `(上限${n}回を適用)`,
    pastFuture: (past, future) => `これまで${past}回 · これから${future}回`,
    pastNote: (years) => `${years}のあいだ今の頻度で続いたと考えたときの目安です。`,
    span: "計算期間",
    perDot: (n) => `点ひとつ = ${n}回`,
    together: (met, missed, left) => `一緒に過ごした${met}回 · 会えなかった${missed}回 · これから${left}回`,
    togetherShort: (met, left) => `一緒に過ごした${met}回 · これから${left}回`,
    estimated: (years) => `「いつから」から登録した日まで(${years})は今の頻度で見積もっています。`,
    startHint: "会うたびに「会えました」を押すと、一緒に過ごした回数が積み重なります。",
  },
  es: {
    unit: "veces",
    filtered: (from, cut) => `Con tus condiciones bajó un ${cut} desde ${from}.`,
    capped: (n) => ` (con un máximo de ${n})`,
    pastFuture: (past, future) => `${past} hasta ahora · ${future} por delante`,
    pastNote: (years) => `Estimación aproximada, suponiendo la misma frecuencia durante ${years}.`,
    span: "Periodo",
    perDot: (n) => `Cada punto = ${n} veces`,
    together: (met, missed, left) => `Juntos ${met} · Perdidos ${missed} · Quedan ${left}`,
    togetherShort: (met, left) => `Juntos ${met} · Quedan ${left}`,
    estimated: (years) => `Desde la fecha de inicio hasta que lo añadiste (${years}) se estima con la frecuencia actual.`,
    startHint: "Pulsa «Nos vimos» cada vez y tus encuentros se irán sumando.",
  },
  zh: {
    unit: "次",
    filtered: (from, cut) => `应用条件筛选后，从${from}次减少了${cut}。`,
    capped: (n) => `（已设上限${n}次）`,
    pastFuture: (past, future) => `至今${past}次 · 往后${future}次`,
    pastNote: (years) => `按照过去${years}一直保持现在的频率估算，仅供参考。`,
    span: "计算期间",
    perDot: (n) => `每个点 = ${n}次`,
    together: (met, missed, left) => `共度${met}次 · 错过${missed}次 · 往后${left}次`,
    togetherShort: (met, left) => `共度${met}次 · 往后${left}次`,
    estimated: (years) => `从「开始时间」到添加当天（${years}）按现在的频率估算。`,
    startHint: "每次见面都点一下「见过了」，共度的次数会一点点累积。",
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
  together,
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
  /**
   * 인연만: 「만났어요」로 센 함께한·놓친 만남(lib/meetings.ts). estimated는 「언제부터」부터 앱에 넣은 날까지의
   * 어림값으로, 함께한 쪽에 더해 보인다. 있으면 past 대신 이것을 그린다.
   */
  together?: { met: number; missed: number; showMissed: boolean; estimated: number; estimatedYears: number };
}) {
  const t = tr(COPY);
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;
  const hasPast = !together && Boolean(past && past.count >= 1);
  const metTotal = together ? together.met + together.estimated : 0;
  const dots = together
    ? dotsFor(metTotal, result.total, together.missed)
    : dotsFor(hasPast ? past!.count : 0, result.total);
  // 함께한 만남은 한 번이라도 점 하나로 보인다. 점이 여러 번을 묶고 있어도 "방금 하나 함께했다"가 보여야 한다.
  const pastDots = together && metTotal >= 1 ? Math.max(1, dots.past) : dots.past;
  const kinds = [
    ...Array<string>(pastDots).fill(together ? "bg-accent-500" : "bg-hero-line"),
    ...Array<string>(dots.missed).fill("border border-ink-400"),
    ...Array<string>(dots.left).fill("bg-ink-800"),
  ];

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
        남은 만남을 점으로 센다. 인연은 함께한 만남(주황)·놓친 만남(빈 점)·앞으로(진한 점) 순서로,
        순간은 지나온 만남을 흐린 점으로 앞에 깐다 — "얼마나 함께했고 얼마나 남았는가"를 숫자보다 먼저 본다.
        많으면 묶는다(lib/dots.ts). 숫자는 바로 위·아래 글자에 있으므로 점은 읽어 주지 않는다.
      */}
      {dots.left > 0 && (
        <div data-testid="dots" className="border-t border-hero-line pt-5">
          <div aria-hidden="true" className="flex flex-wrap gap-1.5">
            {kinds.map((kind, i) => (
              <span key={i} className={`h-2 w-2 rounded-full ${kind}`} />
            ))}
          </div>
          {together && (
            <>
              <p data-testid="together" className="mt-2 text-sm font-medium text-ink-800">
                {together.showMissed
                  ? t.together(formatCount(metTotal), formatCount(together.missed), formatCount(result.total))
                  : t.togetherShort(formatCount(metTotal), formatCount(result.total))}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                {together.estimated >= 1 ? t.estimated(formatYears(together.estimatedYears)) : !together.showMissed ? t.startHint : null}
              </p>
            </>
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
