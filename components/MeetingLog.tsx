"use client";

import { useState } from "react";

import { count } from "@/lib/analytics";
import { josa, todayISO } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { MEMORY_MAX_LENGTH, addMeeting, daysSinceLast, metThisYear, setMemory } from "@/lib/meetings";
import { useActions, useAppState } from "@/lib/store";
import { metLine } from "@/lib/story";
import type { Person } from "@/lib/types";
import { offerUndo } from "@/lib/undo";

const COPY = defineCopy({
  ko: {
    met: "만났어요",
    logged: (n: number, year: number) => `기록한 만남 ${n}번 · 올해 ${year}번`,
    none: "만날 때마다 한 번 눌러 두세요.",
    saved: "오늘 만남을 기록했어요.",
    ask: (name: string) => `오늘 ${josa(name, "와/과")} 어땠어요? 한 줄 남겨 두면 나중에 꺼내 볼 수 있어요.`,
    placeholder: "예: 칼국수 먹고 시장 한 바퀴",
    keep: "남기기",
    skip: "다음에",
    memories: (n: number) => `남긴 기억 ${n}개`,
  },
  en: {
    met: "We met",
    logged: (n, year) => `${n} ${n === 1 ? "meeting" : "meetings"} logged · ${year} this year`,
    none: "Tap once each time you meet.",
    saved: "Logged today’s meeting.",
    ask: (name) => `How was today with ${name}? Leave a line to look back on later.`,
    placeholder: "e.g. Noodles, then a walk through the market",
    keep: "Save",
    skip: "Not now",
    memories: (n) => `${n} ${n === 1 ? "memory" : "memories"}`,
  },
  ja: {
    met: "会えました",
    logged: (n, year) => `記録した回数 ${n}回 · 今年 ${year}回`,
    none: "会うたびに一度押しておいてください。",
    saved: "今日会ったことを記録しました。",
    ask: (name) => `今日の${name}との時間はどうでしたか？一行残しておくと、あとで読み返せます。`,
    placeholder: "例：うどんを食べて市場をひと回り",
    keep: "残す",
    skip: "あとで",
    memories: (n) => `残した思い出 ${n}件`,
  },
  es: {
    met: "Nos vimos",
    logged: (n, year) => `${n} ${n === 1 ? "encuentro anotado" : "encuentros anotados"} · ${year} este año`,
    none: "Toca cada vez que se vean.",
    saved: "Encuentro de hoy anotado.",
    ask: (name) => `¿Qué tal hoy con ${name}? Deja una línea para releerla más adelante.`,
    placeholder: "Ej.: sopa y un paseo por el mercado",
    keep: "Guardar",
    skip: "Ahora no",
    memories: (n) => `${n} ${n === 1 ? "recuerdo" : "recuerdos"}`,
  },
  zh: {
    met: "见过了",
    logged: (n, year) => `已记录见面 ${n} 次 · 今年 ${year} 次`,
    none: "每次见面时按一下。",
    saved: "已记录今天的见面。",
    ask: (name) => `今天和${name}过得怎么样？留一句话，以后可以翻出来看。`,
    placeholder: "例：吃了面，逛了一圈菜市场",
    keep: "留下",
    skip: "下次吧",
    memories: (n) => `留下的回忆 ${n} 条`,
  },
});

const SINCE = defineCopy({
  ko: (days: number) => (days === 0 ? "마지막 만남 오늘" : `마지막 만남 ${days}일 전`),
  en: (days) => (days === 0 ? "Last met today" : days === 1 ? "Last met yesterday" : `Last met ${days} days ago`),
  ja: (days) => (days === 0 ? "最後に会ったのは今日" : `最後に会ったのは${days}日前`),
  es: (days) => (days === 0 ? "Se vieron hoy" : days === 1 ? "Se vieron ayer" : `Se vieron hace ${days} días`),
  zh: (days) => (days === 0 ? "上次见面：今天" : `上次见面：${days}天前`),
});

/** "마지막 만남 ○일 전". 기록이 없으면 null — 홈 카드에서도 쓴다. */
export function lastMetLine(person: Person): string | null {
  const days = daysSinceLast(person.meetings ?? [], todayISO());
  return days === null ? null : tr(SINCE)(days);
}

/*
 * 상세 화면의 「만났어요」. 이번 기간의 칸을 쓰면 함께한 만남이 하나 늘고 앞으로가 하나 준다.
 * 기간이 기록 없이 끝나면 그 칸은 놓친 만남이 된다(lib/meetings.ts). 기록이 쌓이며 "마지막으로
 * 만난 지 며칠"이 보이고, 그게 알림 없이도 다시 열어 볼 이유가 된다.
 */
export default function MeetingLog({ person }: { person: Person }) {
  const t = tr(COPY);
  const { state } = useAppState();
  const { savePerson } = useActions();
  const meetings = person.meetings ?? [];
  const memories = person.memories ?? [];
  const last = lastMetLine(person);
  // 「만났어요」를 누른 직후에만 한 줄을 묻는다. 첫 화면이나 저장을 막지 않는다(비워도 그만).
  const [asking, setAsking] = useState(false);
  const [draft, setDraft] = useState("");
  const [open, setOpen] = useState(false);
  const dateText = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale(), { year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="rounded-2xl border border-ink-200/70 bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-xs leading-relaxed">
          {meetings.length > 0 ? (
            <>
              <p className="font-medium text-ink-800">{last}</p>
              <p className="text-ink-600">{t.logged(meetings.length, metThisYear(meetings, todayISO()))}</p>
            </>
          ) : (
            <p className="text-ink-600">{t.none}</p>
          )}
        </div>
        <button
          type="button"
          className="btn-primary shrink-0"
          onClick={() => {
            const next = addMeeting(meetings, todayISO());
            savePerson({ ...person, meetings: next, updatedAt: new Date().toISOString() });
            offerUndo(
              metLine({ person, tone: state.settings.tone, thisYear: metThisYear(next, todayISO()), me: state.profile?.nickname }) ?? t.saved,
              () => {
                setAsking(false);
                savePerson(person);
              },
            );
            setDraft(memories.find((m) => m.date === todayISO())?.text ?? "");
            setAsking(true);
            count({ event: "met" });
          }}
        >
          {t.met}
        </button>
      </div>

      {asking && (
        <form
          className="mt-3 space-y-2 border-t border-ink-200/70 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            savePerson({ ...person, memories: setMemory(memories, todayISO(), draft), updatedAt: new Date().toISOString() });
            setAsking(false);
          }}
        >
          <label htmlFor={`memory-${person.id}`} className="block text-xs leading-relaxed text-ink-600">
            {t.ask(person.name)}
          </label>
          <input
            id={`memory-${person.id}`}
            className="input"
            value={draft}
            maxLength={MEMORY_MAX_LENGTH}
            placeholder={t.placeholder}
            autoComplete="off"
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setAsking(false)}>
              {t.skip}
            </button>
            <button type="submit" className="btn-primary" disabled={!draft.trim()}>
              {t.keep}
            </button>
          </div>
        </form>
      )}

      {memories.length > 0 && !asking && (
        <div className="mt-3 border-t border-ink-200/70 pt-2 text-xs leading-relaxed">
          <p className="font-album text-ink-800">
            <span className="text-ink-400">{dateText(memories[memories.length - 1].date)} · </span>
            {memories[memories.length - 1].text}
          </p>
          {memories.length > 1 && (
            <>
              <button type="button" className="mt-1 text-ink-400 underline" aria-expanded={open} onClick={() => setOpen(!open)}>
                {t.memories(memories.length)}
              </button>
              {open && (
                <ul className="mt-2 space-y-1.5">
                  {[...memories].reverse().slice(1).map((m) => (
                    <li key={m.date} className="font-album text-ink-800">
                      <span className="text-ink-400">{dateText(m.date)} · </span>
                      {m.text}
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
