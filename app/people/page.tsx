"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import Polaroid from "@/components/Polaroid";
import ListControls, { type SortOption } from "@/components/ListControls";
import { computeRelationship, resolveAge } from "@/lib/calc";
import {
  formatAge,
  formatCount,
  formatDays,
  formatFrequency,
  formatInterval,
  formatYears,
} from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { imageFor } from "@/lib/photos";
import { inOrder, moved } from "@/lib/order";
import { relationTag } from "@/lib/story";
import { matches, useActions, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";
import type { Person } from "@/lib/types";

type Sort = "fewest" | "soonest" | "name" | "added" | "mine";

const SORT_KEYS: Sort[] = ["fewest", "soonest", "name", "added", "mine"];

const COPY = defineCopy({
  ko: {
    sort: {
      fewest: "남은 만남 적은 순",
      soonest: "자주 만나는 순",
      name: "이름순",
      added: "최근 추가순",
      mine: "내 순서",
    } as Record<Sort, string>,
    sortHint: {
      fewest: "남은 만남이 적은 순서입니다.",
      soonest: "자주 만나는 순서입니다.",
      name: "이름순입니다.",
      added: "최근에 추가한 순서입니다.",
      mine: "내가 정한 순서입니다. 홈 사진도 이 순서로 넘어갑니다.",
    } as Record<Sort, string>,
    untilMyAge: (age: number) => `내 ${age}세까지`,
    forYears: (years: number) => `${years}년간`,
    loading: "불러오는 중…",
    title: "인연",
    add: "추가",
    searchPlaceholder: "이름, 관계, 메모로 찾기",
    viewGroup: "보기 방식",
    viewList: "목록",
    viewCompare: "나란히 비교",
    noProfile: "내 정보가 없으면 상대의 남은 시간만으로 계산합니다.",
    fillProfile: "내 정보 채우기",
    emptyBody: "이름, 나이, 만나는 빈도 세 가지면 충분합니다.",
    addFirst: "첫 인연 추가",
    noMatch: (query: string) => `“${query}”와(과) 맞는 인연이 없습니다.`,
    growth: "성장 캘린더",
    times: "번",
    timesLeft: "번 남음",
    up: (name: string) => `${name} 위로`,
    down: (name: string) => `${name} 아래로`,
    together: (years: string) => `함께 ${years}`,
    totalDays: (days: string) => ` · 모두 합쳐 ${days}`,
  },
  en: {
    sort: {
      fewest: "Fewest left",
      soonest: "Most often",
      name: "Name",
      added: "Recently added",
      mine: "My order",
    },
    sortHint: {
      fewest: "Sorted by fewest meetings left.",
      soonest: "Sorted by how often you meet.",
      name: "Sorted by name.",
      added: "Sorted by most recently added.",
      mine: "In your own order. Home photos follow it too.",
    },
    untilMyAge: (age) => `until I'm ${age}`,
    forYears: (years) => `for ${years} ${years === 1 ? "year" : "years"}`,
    loading: "Loading…",
    title: "People",
    add: "Add",
    searchPlaceholder: "Search by name, relation, or note",
    viewGroup: "View",
    viewList: "List",
    viewCompare: "Side by side",
    noProfile: "Without your details, we count using only their remaining time.",
    fillProfile: "Fill in my details",
    emptyBody: "A name, an age, and how often you meet — that's all it takes.",
    addFirst: "Add your first person",
    noMatch: (query) => `No one matches “${query}”.`,
    growth: "Growth calendar",
    times: "times",
    timesLeft: "times left",
    up: (name: string) => `Move ${name} up`,
    down: (name: string) => `Move ${name} down`,
    together: (years) => `${years} together`,
    totalDays: (days) => ` · ${days} in all`,
  },
  ja: {
    sort: {
      fewest: "残りが少ない順",
      soonest: "よく会う順",
      name: "名前順",
      added: "追加が新しい順",
      mine: "自分の順",
    },
    sortHint: {
      fewest: "あと会える回数が少ない順です。",
      soonest: "よく会う順です。",
      name: "名前順です。",
      added: "最近追加した順です。",
      mine: "自分で決めた順です。ホームの写真もこの順に並びます。",
    },
    untilMyAge: (age) => `自分が${age}歳まで`,
    forYears: (years) => `${years}年間`,
    loading: "読み込み中…",
    title: "大切な人",
    add: "追加",
    searchPlaceholder: "名前・関係・メモで検索",
    viewGroup: "表示方法",
    viewList: "リスト",
    viewCompare: "並べて比べる",
    noProfile: "自分の情報がないと、相手の残り時間だけで計算します。",
    fillProfile: "自分の情報を入力",
    emptyBody: "名前、年齢、会う頻度の3つがあれば十分です。",
    addFirst: "最初の大切な人を追加",
    noMatch: (query) => `「${query}」に一致する人はいません。`,
    growth: "成長カレンダー",
    times: "回",
    timesLeft: "回",
    up: (name: string) => `${name}を上へ`,
    down: (name: string) => `${name}を下へ`,
    together: (years) => `一緒に ${years}`,
    totalDays: (days) => ` · 合わせて ${days}`,
  },
  es: {
    sort: {
      fewest: "Menos encuentros",
      soonest: "Más frecuentes",
      name: "Nombre",
      added: "Añadidos recientes",
      mine: "Mi orden",
    },
    sortHint: {
      fewest: "Ordenado por menos encuentros restantes.",
      soonest: "Ordenado por frecuencia de encuentros.",
      name: "Ordenado por nombre.",
      added: "Ordenado por los añadidos más recientes.",
      mine: "En tu propio orden. Las fotos de inicio también lo siguen.",
    },
    untilMyAge: (age) => `hasta que yo tenga ${age}`,
    forYears: (years) => `durante ${years} ${years === 1 ? "año" : "años"}`,
    loading: "Cargando…",
    title: "Personas",
    add: "Añadir",
    searchPlaceholder: "Buscar por nombre, relación o nota",
    viewGroup: "Vista",
    viewList: "Lista",
    viewCompare: "Comparar",
    noProfile: "Sin tus datos, contamos solo con el tiempo restante de la otra persona.",
    fillProfile: "Completar mis datos",
    emptyBody: "Nombre, edad y cada cuánto se ven: no hace falta más.",
    addFirst: "Añadir tu primera persona",
    noMatch: (query) => `Nadie coincide con “${query}”.`,
    growth: "Calendario de crecimiento",
    times: "veces",
    timesLeft: "veces más",
    up: (name: string) => `Subir a ${name}`,
    down: (name: string) => `Bajar a ${name}`,
    together: (years) => `${years} juntos`,
    totalDays: (days) => ` · ${days} en total`,
  },
  zh: {
    sort: {
      fewest: "剩余相见最少",
      soonest: "见面最频繁",
      name: "按名字",
      added: "最近添加",
      mine: "我的顺序",
    },
    sortHint: {
      fewest: "按剩余相见次数从少到多排列。",
      soonest: "按见面频率排列。",
      name: "按名字排列。",
      added: "按最近添加排列。",
      mine: "按你定的顺序排列。首页照片也按这个顺序。",
    },
    untilMyAge: (age) => `到我${age}岁为止`,
    forYears: (years) => `${years}年内`,
    loading: "加载中…",
    title: "亲友",
    add: "添加",
    searchPlaceholder: "按名字、关系、备注搜索",
    viewGroup: "查看方式",
    viewList: "列表",
    viewCompare: "并排比较",
    noProfile: "没有你的信息时，只按对方剩余的时间来计算。",
    fillProfile: "填写我的信息",
    emptyBody: "名字、年龄、见面频率，这三样就够了。",
    addFirst: "添加第一位亲友",
    noMatch: (query) => `没有与“${query}”匹配的亲友。`,
    growth: "成长日历",
    times: "次",
    timesLeft: "次",
    up: (name: string) => `把${name}上移`,
    down: (name: string) => `把${name}下移`,
    together: (years) => `一起 ${years}`,
    totalDays: (days) => ` · 共 ${days}`,
  },
});

/** 기본값("남은 평생")이면 굳이 적지 않는다. 다른 값일 때만 짧게 알린다. */
function horizonLabel(horizon: Person["horizon"]): string | null {
  if (!horizon || horizon.kind === "life") return null;
  const t = tr(COPY);
  if (horizon.kind === "untilMyAge") return t.untilMyAge(horizon.age);
  return t.forYears(horizon.years);
}

export default function PeoplePage() {
  const t = tr(COPY);
  const sorts: SortOption<Sort>[] = SORT_KEYS.map((key) => ({ key, label: t.sort[key] }));
  const { state, hydrated } = useAppState();
  const { saveSettings } = useActions();
  const copy = copyFor(state.settings.tone);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("fewest");
  const [view, setView] = useState<"list" | "compare">("list");

  const rows = useMemo(() => {
    const all = state.people.map((person) => ({
      person,
      result: computeRelationship(person, state.profile),
    }));
    const found = all.filter(({ person }) =>
      matches(query, [person.name, person.relation, person.note]),
    );
    // 「내 순서」: 정한 순서, 정한 뒤에 넣은 사람은 넣은 순서대로 뒤에.
    const byAdded = [...all].sort((a, b) => a.person.createdAt.localeCompare(b.person.createdAt));
    const mine = inOrder(byAdded, state.settings.peopleOrder, ({ person }) => person.id).map(({ person }) => person.id);
    if (sort === "mine") {
      const at = new Map(mine.map((id, i) => [id, i]));
      return { all, mine, sorted: [...found].sort((a, b) => at.get(a.person.id)! - at.get(b.person.id)!) };
    }
    const sorted = [...found];
    sorted.sort((a, b) => {
      if (sort === "name") return a.person.name.localeCompare(b.person.name, locale());
      if (sort === "added") return b.person.createdAt.localeCompare(a.person.createdAt);
      if (sort === "soonest") {
        // 간격이 짧을수록 앞. 빈도가 0이면 맨 뒤로 보낸다.
        const ai = a.result.intervalDays ?? Number.POSITIVE_INFINITY;
        const bi = b.result.intervalDays ?? Number.POSITIVE_INFINITY;
        return ai - bi;
      }
      return a.result.total - b.result.total;
    });
    return { all, mine, sorted };
  }, [state.people, state.profile, state.settings.peopleOrder, query, sort]);
  // 찾는 중에는 옮기지 않는다. 걸러진 목록에서 한 칸이 전체 순서의 어디인지 알 수 없다.
  const reordering = sort === "mine" && !query.trim();
  const move = (id: string, step: -1 | 1) => saveSettings({ peopleOrder: moved(rows.mine, rows.mine.indexOf(id), step) });

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-400">{t.sortHint[sort]}</p>
        </div>
        <Link href="/people/new" className="btn-primary shrink-0" prefetch={false}>
          {t.add}
        </Link>
      </div>

      <ListControls
        total={rows.all.length}
        shown={rows.sorted.length}
        query={query}
        onQuery={setQuery}
        sort={sort}
        onSort={setSort}
        options={sorts}
        placeholder={t.searchPlaceholder}
      />

      {/*
        비교는 "누가 더 소중한가"의 순위표가 아니다. 같은 막대 위에 올려놓으면 누구와의
        시간이 가장 적게 남았는지가 한눈에 보인다 — 그 사람이 먼저 떠오르게 하는 게 목적이다.
      */}
      {rows.all.length >= 2 && (
        <div className="flex gap-1.5" role="group" aria-label={t.viewGroup}>
          {(["list", "compare"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={view === key}
              className={`chip ${view === key ? "chip-active" : ""}`}
              onClick={() => setView(key)}
            >
              {key === "list" ? t.viewList : t.viewCompare}
            </button>
          ))}
        </div>
      )}

      {!state.profile && (
        <p className="rounded-xl bg-accent-50 px-4 py-3 text-xs text-accent-600">
          {t.noProfile}{" "}
          <Link href="/setup" className="underline">
            {t.fillProfile}
          </Link>
        </p>
      )}

      {rows.all.length === 0 ? (
        <EmptyState
          title={copy.emptyPeople}
          body={t.emptyBody}
          actionHref="/people/new"
          actionLabel={t.addFirst}
        />
      ) : rows.sorted.length === 0 ? (
        <p className="card text-sm text-ink-400">
          {t.noMatch(query)}
        </p>
      ) : view === "compare" ? (
        <CompareBars rows={rows.sorted} />
      ) : (
        <div className="space-y-2">
          {rows.sorted.map(({ person, result }, i) => (
            <div key={person.id}>
              <Link
                href={`/people/detail?id=${person.id}`}
                className="card flex items-center justify-between transition hover:border-ink-400" prefetch={false}>
                <span className="flex min-w-0 items-center gap-3">
                  <Polaroid src={imageFor(person)} size="sm" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-ink-800 [overflow-wrap:break-word]">
                      {person.name}
                      {/* 기본값이 아닌 설정은 목록에서도 보여야 한다. 상세로 들어가야만
                          알 수 있으면 켜 둔 사실 자체를 잊는다. */}
                      {person.growth && (
                        <span className="ml-1.5 align-middle text-[11px] font-normal text-accent-500">
                          {t.growth}
                        </span>
                      )}
                    </span>
                    {/*
                      같은 이름이 여럿일 수 있다(어머니 둘, 아버지 여럿). 관계와 나이가 있어야
                      목록에서 서로를 구분한다.
                    */}
                    <span className="block text-xs text-ink-400">
                      {[relationTag(person.name, person.relation), formatAge(resolveAge(person))]
                        .filter((part) => part && part !== "-")
                        .map((part) => `${part} · `)
                        .join("")}
                      {formatFrequency(person.frequency)}
                      {result.intervalDays !== null && ` · ${formatInterval(result.intervalDays)}`}
                      {horizonLabel(person.horizon) && ` · ${horizonLabel(person.horizon)}`}
                    </span>
                    {person.note && (
                      <span className="mt-0.5 block truncate text-xs text-ink-400">{person.note}</span>
                    )}
                  </span>
                </span>
                <span className="shrink-0 pl-3 text-right">
                  <span className="numeral block text-2xl text-ink-900">
                    {formatCount(result.total)}
                  </span>
                  <span className="block text-[11px] text-ink-400">{t.timesLeft}</span>
                </span>
              </Link>
              {/* 카드 옆에 두면 좁은 폰·큰 글씨에서 카드가 눌려 이름이 한 글자씩 꺾인다. 카드 아래 한 줄로. */}
              {reordering && (
                <span className="flex justify-end gap-1 pt-1">
                  <button type="button" className="btn-quiet min-h-11 min-w-11 aria-disabled:opacity-30" aria-label={t.up(person.name)} aria-disabled={i === 0} onClick={() => i > 0 && move(person.id, -1)}>
                    ↑
                  </button>
                  <button type="button" className="btn-quiet min-h-11 min-w-11 aria-disabled:opacity-30" aria-label={t.down(person.name)} aria-disabled={i === rows.sorted.length - 1} onClick={() => i < rows.sorted.length - 1 && move(person.id, 1)}>
                    ↓
                  </button>
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompareBars({
  rows,
}: {
  rows: { person: Person; result: ReturnType<typeof computeRelationship> }[];
}) {
  const t = tr(COPY);
  const max = Math.max(1, ...rows.map((row) => row.result.total));
  return (
    <ul className="card space-y-4">
      {rows.map(({ person, result }) => (
        <li key={person.id}>
          <Link href={`/people/detail?id=${person.id}`} className="block" prefetch={false}>
            <span className="flex items-baseline justify-between gap-3">
              <span className="truncate text-sm font-medium text-ink-800">
                {person.emoji ?? "🫧"} {person.name}
              </span>
              <span className="shrink-0">
                <span className="numeral text-lg text-ink-900">{formatCount(result.total)}</span>
                <span className="ml-0.5 text-xs text-ink-400">{t.times}</span>
              </span>
            </span>
            <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-ink-200/60">
              <span
                className="block h-full rounded-full bg-ink-800"
                style={{ width: `${(result.total / max) * 100}%` }}
              />
            </span>
            <span className="mt-1 block text-[11px] text-ink-400">
              {t.together(formatYears(result.sharedYears))}
              {result.togetherDays !== null && t.totalDays(formatDays(result.togetherDays))}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
