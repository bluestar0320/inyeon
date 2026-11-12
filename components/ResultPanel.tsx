"use client";

import type { ReactNode } from "react";

import BigNumber from "@/components/BigNumber";
import ShareButton from "@/components/ShareButton";
import StatCard from "@/components/StatCard";
import type { PastLine } from "@/lib/bonds";
import type { CountResult, PastResult } from "@/lib/calc";
import { ACADEMY_DEFAULT } from "@/lib/pastRules";
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
    estimated: (years: string) => `「언제부터」에 적은 날부터 앱에 넣은 날까지(${years})는 지금 빈도로 어림했어요.`,
    startHint: "만날 때마다 「만났어요」를 누르면 함께한 만남이 쌓여요.",
    scope: "함께한 만남을 셀 기간",
    scopeAll: "지금까지",
    scopeYear: "올해",
    school: (name: string, years: number, from: number, to: number, n: string) => `${name} ${years}년 (${from}~${to}) · ${n}번`,
    schoolName: { elementary: "초등학교", middle: "중학교", high: "고등학교", university: "대학교" },
    after: (years: number, n: string) => `졸업 뒤 ${years}년, 지금 빈도로 · ${n}번`,
    bondTogether: (years: number, n: string) => `같이 산 ${years}년 · ${n}번`,
    coworker: (years: number, n: string) => `같이 일한 ${years}년 · ${n}번`,
    apart: (n: string) => `따로 사신 동안 1년 2번 · ${n}번`,
    academy: (perWeek: number, n: string) => `학원, 주 ${perWeek}번 · ${n}번`,
    military: (n: string) => `군 복무로 못 본 기간 · −${n}번`,
    linesNote: "학교는 그해 법정 수업일수에서 결석·다른 반이었던 날을 빼고 셌어요. 실제는 이보다 많았을 거예요.",
    ageHint: "내 나이를 넣으면 학교 시절까지 셉니다.",
    estimatedYear: (years: string) => `올해 앱에 넣기 전까지(${years})는 지금 빈도로 어림했어요.`,
  },
  en: {
    unit: "times",
    filtered: (from, cut) => `Your conditions brought this down by ${cut}, from ${from}.`,
    capped: (n) => ` (capped at ${n})`,
    pastFuture: (past, future) => `${past} so far · ${future} to go`,
    pastNote: (years) => `A rough estimate, assuming the same frequency over ${years}.`,
    span: "Time span",
    perDot: (n) => `Each dot = ${n} times`,
    together: (met, missed, left) => `Together ${met} · Missed ${missed} · ${left} to go`,
    togetherShort: (met, left) => `Together ${met} · ${left} to go`,
    estimated: (years) => `The stretch from your start date until you added them (${years}) is estimated at the current frequency.`,
    startHint: "Tap “We met” each time you meet and your time together adds up.",
    scope: "Count time together over",
    scopeAll: "So far",
    scopeYear: "This year",
    school: (name, years, from, to, n) => `${name}, ${years} yrs (${from}–${to}) · ${n}`,
    schoolName: { elementary: "Elementary school", middle: "Middle school", high: "High school", university: "University" },
    after: (years, n) => `${years} yrs since graduating, at the current frequency · ${n}`,
    bondTogether: (years, n) => `Lived together ${years} yrs · ${n}`,
    coworker: (years, n) => `Worked together ${years} yrs · ${n}`,
    apart: (n) => `While living apart, 2 times a year · ${n}`,
    academy: (perWeek, n) => `Cram school, ${perWeek} a week · ${n}`,
    military: (n) => `Time apart for military service · −${n}`,
    linesNote: "School days are counted from the legal school days that year, minus absences and days in a different class. The real number was probably higher. Based on Korean averages.",
    ageHint: "Add your age and school years get counted too.",
    estimatedYear: (years) => `The part of this year before you added them (${years}) is estimated at the current frequency.`,
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
    scope: "一緒に過ごした回数を数える期間",
    scopeAll: "これまで",
    scopeYear: "今年",
    school: (name, years, from, to, n) => `${name}${years}年 (${from}〜${to}) · ${n}回`,
    schoolName: { elementary: "小学校", middle: "中学校", high: "高校", university: "大学" },
    after: (years, n) => `卒業後${years}年、今の頻度で · ${n}回`,
    bondTogether: (years, n) => `一緒に暮らした${years}年 · ${n}回`,
    coworker: (years, n) => `一緒に働いた${years}年 · ${n}回`,
    apart: (n) => `離れて暮らしていた間、年2回 · ${n}回`,
    academy: (perWeek, n) => `塾、週${perWeek}回 · ${n}回`,
    military: (n) => `兵役で会えなかった期間 · −${n}回`,
    linesNote: "学校は、その年の法定授業日数から欠席や別クラスだった日を引いて数えました。実際はもっと多かったはずです。韓国の平均にもとづきます。",
    ageHint: "年齢を入れると、学校時代まで数えます。",
    estimatedYear: (years) => `今年、登録する前まで(${years})は今の頻度で見積もっています。`,
  },
  es: {
    unit: "veces",
    filtered: (from, cut) => `Con tus condiciones bajó un ${cut} desde ${from}.`,
    capped: (n) => ` (con un máximo de ${n})`,
    pastFuture: (past, future) => `${past} hasta ahora · ${future} por delante`,
    pastNote: (years) => `Estimación aproximada, suponiendo la misma frecuencia durante ${years}.`,
    span: "Periodo",
    perDot: (n) => `Cada punto = ${n} veces`,
    together: (met, missed, left) => `Juntos ${met} · Sin verse ${missed} · Quedan ${left}`,
    togetherShort: (met, left) => `Juntos ${met} · Quedan ${left}`,
    estimated: (years) => `El tramo desde la fecha de inicio hasta que se añadió (${years}) se estima con la frecuencia actual.`,
    startHint: "Pulsa «Nos vimos» cada vez y tus encuentros se irán sumando.",
    scope: "Contar los encuentros de",
    scopeAll: "Hasta ahora",
    scopeYear: "Este año",
    school: (name, years, from, to, n) => `${name}, ${years} años (${from}–${to}) · ${n}`,
    schoolName: { elementary: "Primaria", middle: "Secundaria", high: "Bachillerato", university: "Universidad" },
    after: (years, n) => `${years} años tras graduarse, con la frecuencia actual · ${n}`,
    bondTogether: (years, n) => `${years} años viviendo juntos · ${n}`,
    coworker: (years, n) => `${years} años trabajando juntos · ${n}`,
    apart: (n) => `Mientras vivían lejos, 2 veces al año · ${n}`,
    academy: (perWeek, n) => `Academia, ${perWeek} a la semana · ${n}`,
    military: (n) => `Tiempo sin verse por el servicio militar · −${n}`,
    linesNote: "Los días de colegio se cuentan con los días lectivos legales de ese año, sin las ausencias ni los días en otra clase. Seguramente fueron más. Según promedios de Corea.",
    ageHint: "Si pones tu edad, también contamos la etapa escolar.",
    estimatedYear: (years) => `La parte de este año antes de añadirlo (${years}) se estima con la frecuencia actual.`,
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
    estimated: (years) => `从开始见面到添加当天（${years}）按现在的频率估算。`,
    startHint: "每次见面都点一下“见过了”，共度的次数会一点点累积。",
    scope: "共度次数的统计范围",
    scopeAll: "至今",
    scopeYear: "今年",
    school: (name, years, from, to, n) => `${name}${years}年（${from}~${to}）· ${n}次`,
    schoolName: { elementary: "小学", middle: "初中", high: "高中", university: "大学" },
    after: (years, n) => `毕业后${years}年，按现在的频率 · ${n}次`,
    bondTogether: (years, n) => `住在一起的${years}年 · ${n}次`,
    coworker: (years, n) => `一起工作的${years}年 · ${n}次`,
    apart: (n) => `分开生活期间，每年2次 · ${n}次`,
    academy: (perWeek, n) => `补习班，每周${perWeek}次 · ${n}次`,
    military: (n) => `因服兵役见不到的时间 · −${n}次`,
    linesNote: "学校按当年法定上课天数，扣掉缺席和不在同一班的日子来算。实际应该比这更多。以韩国平均水平为准。",
    ageHint: "填上你的年龄，就会把上学时期也算进来。",
    estimatedYear: (years) => `今年添加之前（${years}）按现在的频率估算。`,
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
  together?: {
    met: number;
    missed: number;
    showMissed: boolean;
    estimated: number;
    estimatedYears: number;
    /** 관계 칩으로 센 근거. 있으면 estimated 안내문 자리에 목록을 그린다. */
    lines?: PastLine[];
    academy?: { years: number; perWeek: number };
    /** 칩은 골랐는데 내 나이가 없어 학교 시절을 못 센 때. */
    ageHint?: boolean;
    /** 함께한 만남을 지금까지 셀지, 올해만 셀지. 주면 고르는 단추가 붙는다. */
    scope?: "all" | "year";
    onScope?: (next: "all" | "year") => void;
  };
}) {
  const t = tr(COPY);
  const filtered = result.total < result.baselineTotal - 0.5;
  const cut = result.baselineTotal > 0 ? 1 - result.total / result.baselineTotal : 0;
  const hasPast = !together && Boolean(past && past.count >= 1);
  const metTotal = together ? together.met + together.estimated : 0;
  const lineText = (line: PastLine): string => {
    const n = formatCount(Math.abs(Math.round(line.count)));
    const years = Math.max(0, line.to - line.from);
    switch (line.kind) {
      case "elementary":
      case "middle":
      case "high":
      case "university":
        return t.school(t.schoolName[line.kind], line.to - line.from + 1, line.from, line.to, n);
      case "after": return t.after(years, n);
      case "together": return t.bondTogether(years, n);
      case "coworker": return t.coworker(years, n);
      case "apart": return t.apart(n);
      case "academy": return t.academy((together?.academy ?? ACADEMY_DEFAULT).perWeek, n);
      case "military": return t.military(n);
    }
  };
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
              {together.onScope && (
                <div role="group" aria-label={t.scope} className="mt-3 flex gap-3 text-[11px] text-ink-400">
                  {(["all", "year"] as const).map((key) => {
                    const active = (together.scope ?? "all") === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        className={active ? "font-semibold text-ink-800" : "underline"}
                        onClick={() => together.onScope?.(key)}
                      >
                        {key === "all" ? t.scopeAll : t.scopeYear}
                      </button>
                    );
                  })}
                </div>
              )}
              <p data-testid="together" className="mt-2 text-sm font-medium text-ink-800">
                {together.showMissed
                  ? t.together(formatCount(metTotal), formatCount(together.missed), formatCount(result.total))
                  : t.togetherShort(formatCount(metTotal), formatCount(result.total))}
              </p>
              <p className="mt-0.5 text-[11px] text-ink-400">
                {together.lines?.length ? null : together.estimated >= 1 ? (together.scope === "year" ? t.estimatedYear : t.estimated)(formatYears(together.estimatedYears)) : !together.showMissed ? t.startHint : null}
              </p>
              {together.lines && together.lines.length > 0 && (
                <div data-testid="past-lines" className="mt-1 text-[11px] text-ink-400">
                  <ul className="space-y-0.5">
                    {together.lines.map((line, i) => (
                      <li key={`${line.kind}${i}`}>{lineText(line)}</li>
                    ))}
                  </ul>
                  <p className="mt-1">{t.linesNote}</p>
                </div>
              )}
              {together.ageHint && <p className="mt-0.5 text-[11px] text-ink-400">{t.ageHint}</p>}
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
