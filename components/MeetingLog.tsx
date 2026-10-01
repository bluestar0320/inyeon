"use client";

import { count } from "@/lib/analytics";
import { todayISO } from "@/lib/format";
import { defineCopy, tr } from "@/lib/i18n";
import { addMeeting, daysSinceLast, metThisYear } from "@/lib/meetings";
import { useActions } from "@/lib/store";
import type { Person } from "@/lib/types";
import { offerUndo } from "@/lib/undo";

const COPY = defineCopy({
  ko: {
    met: "만났어요",
    logged: (n: number, year: number) => `기록한 만남 ${n}번 · 올해 ${year}번`,
    none: "만날 때마다 한 번 눌러 두세요.",
    saved: "오늘 만남을 기록했어요.",
  },
  en: {
    met: "We met",
    logged: (n, year) => `${n} meetings logged · ${year} this year`,
    none: "Tap once each time you meet.",
    saved: "Logged today’s meeting.",
  },
  ja: {
    met: "会えました",
    logged: (n, year) => `記録した出会い ${n}回 · 今年 ${year}回`,
    none: "会うたびに一度押しておいてください。",
    saved: "今日の出会いを記録しました。",
  },
  es: {
    met: "Nos vimos",
    logged: (n, year) => `${n} encuentros anotados · ${year} este año`,
    none: "Pulsa una vez cada vez que os veáis.",
    saved: "Encuentro de hoy anotado.",
  },
  zh: {
    met: "见过了",
    logged: (n, year) => `已记录见面 ${n} 次 · 今年 ${year} 次`,
    none: "每次见面时按一下。",
    saved: "已记录今天的见面。",
  },
});

const SINCE = defineCopy({
  ko: (days: number) => (days === 0 ? "마지막 만남 오늘" : `마지막 만남 ${days}일 전`),
  en: (days) => (days === 0 ? "Last met today" : `Last met ${days} days ago`),
  ja: (days) => (days === 0 ? "最後に会ったのは今日" : `最後に会ったのは${days}日前`),
  es: (days) => (days === 0 ? "Os visteis hoy" : `Os visteis hace ${days} días`),
  zh: (days) => (days === 0 ? "上次见面：今天" : `上次见面：${days}天前`),
});

/** "마지막 만남 ○일 전". 기록이 없으면 null — 홈 카드에서도 쓴다. */
export function lastMetLine(person: Person): string | null {
  const days = daysSinceLast(person.meetings ?? [], todayISO());
  return days === null ? null : tr(SINCE)(days);
}

/*
 * 상세 화면의 「만났어요」. 남은 횟수는 시간에서 나오므로 바꾸지 않는다. 대신 기록이 쌓이며
 * "마지막으로 만난 지 며칠"이 보이고, 그게 알림 없이도 다시 열어 볼 이유가 된다.
 */
export default function MeetingLog({ person }: { person: Person }) {
  const t = tr(COPY);
  const { savePerson } = useActions();
  const meetings = person.meetings ?? [];
  const last = lastMetLine(person);

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink-200/70 bg-surface px-4 py-3">
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
          savePerson({ ...person, meetings: addMeeting(meetings, todayISO()), updatedAt: new Date().toISOString() });
          offerUndo(t.saved, () => savePerson(person));
          count({ event: "met" });
        }}
      >
        {t.met}
      </button>
    </div>
  );
}
