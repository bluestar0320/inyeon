"use client";

import Link from "next/link";
import { useMemo } from "react";

import BigNumber from "@/components/BigNumber";
import StatCard from "@/components/StatCard";
import { backupDue } from "@/lib/backup";
import { computeMarriage, lifeProgress, remainingYears, resolveAge } from "@/lib/calc";
import { formatAge, formatCount, formatFrequency, formatPercent, formatYears } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

const COPY = defineCopy({
  ko: {
    lifeSub: (age: string, lifeExpectancy: number) => `${age} · 예상 수명 ${lifeExpectancy}세`,
    progress: (past: string, left: string) => `지나온 ${past} · 남은 ${left}`,
    summers: "남은 여름",
    weekends: "남은 주말",
    fullMoons: "남은 보름달",
    editProfile: "내 정보 수정",
    backupNudge: "기록은 이 기기 안에만 있습니다. 지난 백업 뒤로 바뀐 것이 있어요 — 내보내 두기 →",
    timesValue: (n: number) => `${n}번`,
    marriageLink: "결혼까지 남은 기회도 세어 보기 →",
    marriageTitle: "결혼 계획",
    untilAge: (age: number) => `만 ${age}세까지`,
    yearsLeft: (years: string) => ` · ${years} 남음`,
    timesLeft: "번 남음",
  },
  en: {
    lifeSub: (age, lifeExpectancy) => `${age} · life expectancy ${lifeExpectancy}`,
    progress: (past, left) => `${past} behind · ${left} ahead`,
    summers: "Summers ahead",
    weekends: "Weekends ahead",
    fullMoons: "Full moons ahead",
    editProfile: "Edit my details",
    backupNudge:
      "Your records live only on this device, and some have changed since your last backup — export a copy →",
    timesValue: (n) => `${n} ${n === 1 ? "time" : "times"}`,
    marriageLink: "Count your chances to meet someone, too →",
    marriageTitle: "Marriage plan",
    untilAge: (age) => `By age ${age}`,
    yearsLeft: (years) => ` · ${years} to go`,
    timesLeft: "times left",
  },
  ja: {
    lifeSub: (age, lifeExpectancy) => `${age} · 予想寿命 ${lifeExpectancy}歳`,
    progress: (past, left) => `過ぎた ${past} · 残り ${left}`,
    summers: "残りの夏",
    weekends: "残りの週末",
    fullMoons: "残りの満月",
    editProfile: "自分の情報を編集",
    backupNudge: "記録はこの端末の中にだけあります。前回のバックアップから変更があります — 書き出しておく →",
    timesValue: (n) => `${n}回`,
    marriageLink: "結婚までの出会いの機会も数えてみる →",
    marriageTitle: "結婚の計画",
    untilAge: (age) => `${age}歳まで`,
    yearsLeft: (years) => ` · あと${years}`,
    timesLeft: "回",
  },
  es: {
    lifeSub: (age, lifeExpectancy) => `${age} · esperanza de vida ${lifeExpectancy}`,
    progress: (past, left) => `${past} recorrido · ${left} por delante`,
    summers: "Veranos por delante",
    weekends: "Fines de semana",
    fullMoons: "Lunas llenas",
    editProfile: "Editar mis datos",
    backupNudge:
      "Tus registros solo están en este dispositivo y hay cambios sin respaldar: exporta una copia →",
    timesValue: (n) => `${n} ${n === 1 ? "vez" : "veces"}`,
    marriageLink: "Cuenta también tus oportunidades de conocer a alguien →",
    marriageTitle: "Plan de boda",
    untilAge: (age) => `Hasta los ${age}`,
    yearsLeft: (years) => ` · quedan ${years}`,
    timesLeft: "veces más",
  },
  zh: {
    lifeSub: (age, lifeExpectancy) => `${age} · 预期寿命 ${lifeExpectancy}岁`,
    progress: (past, left) => `已走过 ${past} · 还有 ${left}`,
    summers: "剩下的夏天",
    weekends: "剩下的周末",
    fullMoons: "剩下的满月",
    editProfile: "修改我的信息",
    backupNudge: "记录只保存在这台设备上。上次备份后有了新的变化 — 导出一份 →",
    timesValue: (n) => `${n}次`,
    marriageLink: "也数一数结婚前还有多少相遇的机会 →",
    marriageTitle: "结婚计划",
    untilAge: (age) => `${age}岁之前`,
    yearsLeft: (years) => ` · 还有${years}`,
    timesLeft: "次",
  },
});

/* 「나」 화면 맨 위. 남은 시간 → (밀린 백업) → 결혼 계획. 첫 화면의 「나」 카드가 이리로 이어진다. */
export default function MeSummary() {
  const t = tr(COPY);
  const { state } = useAppState();
  const copy = copyFor(state.settings.tone);
  const profile = state.profile;
  const marriage = useMemo(
    () =>
      state.marriage === null || !profile
        ? null
        : { plan: state.marriage, result: computeMarriage(state.marriage, profile) },
    [state.marriage, profile],
  );
  if (!profile) return null;

  const myRemaining = remainingYears(profile);
  const progress = lifeProgress(profile);
  const age = resolveAge(profile);

  return (
    <div className="space-y-6">
      {/* 첫 화면의 「나」 카드가 이 블록으로 펼쳐진다(Task 6). */}
      <div data-flip="me">
        <section className="hero space-y-5">
          <BigNumber
            label={copy.lifeLabel}
            value={myRemaining === null ? "-" : formatYears(myRemaining)}
            sub={age === null ? undefined : t.lifeSub(formatAge(age), profile.lifeExpectancy)}
          />
          {progress !== null && (
            <div>
              <div className="h-2 overflow-hidden rounded-full bg-hero-line">
                <div className="h-full rounded-full bg-ink-800" style={{ width: `${progress * 100}%` }} />
              </div>
              <p className="mt-2 text-xs text-ink-600">
                {t.progress(formatPercent(progress), formatPercent(1 - progress))}
              </p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 border-t border-hero-line pt-5">
            <StatCard label={t.summers} value={myRemaining === null ? "-" : t.timesValue(Math.floor(myRemaining))} />
            <StatCard label={t.weekends} value={myRemaining === null ? "-" : formatCount(myRemaining * 52)} />
            <StatCard label={t.fullMoons} value={myRemaining === null ? "-" : formatCount(myRemaining * 12.37)} />
          </div>
          <Link href="/setup" className="btn-quiet">
            {t.editProfile}
          </Link>
        </section>
      </div>

      {/* 조르지 않는 한 줄. 언제 뜨는지는 lib/backup.ts. 같은 화면 아래 「내보내기」로 간다. */}
      {backupDue(state) && (
        <Link
          href="#backup"
          className="block rounded-xl border border-ink-200/70 px-4 py-3 text-xs leading-relaxed text-ink-600 transition hover:border-ink-400"
        >
          {t.backupNudge}
        </Link>
      )}

      {marriage === null ? (
        <Link href="/marriage" className="block py-3 text-center text-xs text-ink-400 transition hover:text-ink-600">
          {t.marriageLink}
        </Link>
      ) : (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold tracking-[0.1em] text-ink-400">{t.marriageTitle}</h2>
          <Link href="/marriage" className="card flex items-center justify-between py-4 transition hover:border-ink-400">
            <span className="flex min-w-0 items-center gap-3">
              <span className="text-xl">💍</span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink-800">{t.untilAge(marriage.plan.targetAge)}</span>
                <span className="block text-xs text-ink-400">
                  {formatFrequency(marriage.plan.frequency)}
                  {marriage.result.yearsLeft !== null && t.yearsLeft(formatYears(marriage.result.yearsLeft))}
                </span>
                {marriage.plan.note && (
                  <span className="mt-0.5 block truncate text-xs text-ink-400">{marriage.plan.note}</span>
                )}
              </span>
            </span>
            <span className="shrink-0 pl-3 text-right">
              <span className="numeral block text-3xl leading-none text-ink-900">
                {formatCount(marriage.result.total)}
              </span>
              <span className="mt-1 block text-[11px] text-ink-400">{t.timesLeft}</span>
            </span>
          </Link>
        </section>
      )}
    </div>
  );
}
