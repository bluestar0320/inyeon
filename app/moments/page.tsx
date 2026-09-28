"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import EmptyState from "@/components/EmptyState";
import ListControls, { type SortOption } from "@/components/ListControls";
import { computeMoment } from "@/lib/calc";
import { formatCount, formatFrequency } from "@/lib/format";
import { defineCopy, locale, tr } from "@/lib/i18n";
import { matches, useAppState } from "@/lib/store";
import { copyFor } from "@/lib/tone";

type Sort = "fewest" | "most" | "name" | "added";

const SORT_KEYS: Sort[] = ["fewest", "most", "name", "added"];

const COPY = defineCopy({
  ko: {
    sort: {
      fewest: "적게 남은 순",
      most: "많이 남은 순",
      name: "이름순",
      added: "최근 추가순",
    } as Record<Sort, string>,
    loading: "불러오는 중…",
    title: "순간",
    subtitle: "사람이 아닌 일을 셉니다.",
    add: "추가",
    searchPlaceholder: "제목, 메모로 찾기",
    emptyBody: "벚꽃, 해외여행, 서핑처럼 반복되는 일을 적어 보세요.",
    addFirst: "첫 순간 추가",
    noMatch: (query: string) => `“${query}”와(과) 맞는 순간이 없습니다.`,
    times: "번",
    filtersOn: (n: number) => `조건 ${n}개 적용됨`,
  },
  en: {
    sort: {
      fewest: "Fewest left",
      most: "Most left",
      name: "Name",
      added: "Recently added",
    },
    loading: "Loading…",
    title: "Moments",
    subtitle: "Count the things you love to do, not just people.",
    add: "Add",
    searchPlaceholder: "Search by title or note",
    emptyBody: "Write down something that comes around again, like cherry blossoms, trips abroad, or surfing.",
    addFirst: "Add your first moment",
    noMatch: (query) => `No moments match “${query}”.`,
    times: "times",
    filtersOn: (n) => `${n} ${n === 1 ? "condition" : "conditions"} applied`,
  },
  ja: {
    sort: {
      fewest: "残りが少ない順",
      most: "残りが多い順",
      name: "名前順",
      added: "追加が新しい順",
    },
    loading: "読み込み中…",
    title: "ひととき",
    subtitle: "人ではなく、好きなことを数えます。",
    add: "追加",
    searchPlaceholder: "タイトル・メモで検索",
    emptyBody: "桜、海外旅行、サーフィンのように、くり返し訪れることを書いてみましょう。",
    addFirst: "最初のひとときを追加",
    noMatch: (query) => `「${query}」に一致するひとときはありません。`,
    times: "回",
    filtersOn: (n) => `条件${n}件を適用中`,
  },
  es: {
    sort: {
      fewest: "Menos restantes",
      most: "Más restantes",
      name: "Nombre",
      added: "Añadidos recientes",
    },
    loading: "Cargando…",
    title: "Momentos",
    subtitle: "Cuenta las cosas que te gusta hacer, no solo personas.",
    add: "Añadir",
    searchPlaceholder: "Buscar por título o nota",
    emptyBody: "Escribe algo que se repite, como los cerezos en flor, los viajes o el surf.",
    addFirst: "Añadir tu primer momento",
    noMatch: (query) => `Ningún momento coincide con “${query}”.`,
    times: "veces",
    filtersOn: (n) => `${n} ${n === 1 ? "condición aplicada" : "condiciones aplicadas"}`,
  },
  zh: {
    sort: {
      fewest: "剩余最少",
      most: "剩余最多",
      name: "按名字",
      added: "最近添加",
    },
    loading: "加载中…",
    title: "时光",
    subtitle: "数的不是人，而是想做的事。",
    add: "添加",
    searchPlaceholder: "按标题、备注搜索",
    emptyBody: "写下会反复到来的事，比如樱花、出国旅行、冲浪。",
    addFirst: "添加第一段时光",
    noMatch: (query) => `没有与“${query}”匹配的时光。`,
    times: "次",
    filtersOn: (n) => `已应用${n}个条件`,
  },
});

export default function MomentsPage() {
  const t = tr(COPY);
  const sorts: SortOption<Sort>[] = SORT_KEYS.map((key) => ({ key, label: t.sort[key] }));
  const { state, hydrated } = useAppState();
  const copy = copyFor(state.settings.tone);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("fewest");

  const rows = useMemo(() => {
    const all = state.moments.map((moment) => ({
      moment,
      result: computeMoment(moment, state.profile),
    }));
    const found = all.filter(({ moment }) => matches(query, [moment.title, moment.note]));
    const sorted = [...found];
    sorted.sort((a, b) => {
      if (sort === "name") return a.moment.title.localeCompare(b.moment.title, locale());
      if (sort === "added") return b.moment.createdAt.localeCompare(a.moment.createdAt);
      if (sort === "most") return b.result.total - a.result.total;
      return a.result.total - b.result.total;
    });
    return { all, sorted };
  }, [state.moments, state.profile, query, sort]);

  if (!hydrated) {
    return <p className="py-12 text-center text-sm text-ink-400">{t.loading}</p>;
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink-900">{t.title}</h1>
          <p className="mt-1 text-sm text-ink-400">{t.subtitle}</p>
        </div>
        <Link href="/moments/new" className="btn-primary" prefetch={false}>
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

      {rows.all.length === 0 ? (
        <EmptyState
          title={copy.emptyMoments}
          body={t.emptyBody}
          actionHref="/moments/new"
          actionLabel={t.addFirst}
        />
      ) : rows.sorted.length === 0 ? (
        <p className="card text-sm text-ink-400">
          {t.noMatch(query)}
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.sorted.map(({ moment, result }) => (
            <Link
              key={moment.id}
              href={`/moments/detail?id=${moment.id}`}
              className="card transition hover:border-ink-400" prefetch={false}>
              <span className="text-2xl">{moment.emoji ?? "◦"}</span>
              <p className="mt-2 text-sm font-medium text-ink-800">{moment.title}</p>
              <p className="text-xs text-ink-400">{formatFrequency(moment.frequency)}</p>
              <p className="numeral mt-2 text-3xl text-ink-900">
                {formatCount(result.total)}
                <span className="ml-1 text-sm font-normal text-ink-400">{t.times}</span>
              </p>
              {moment.filters.some((f) => f.enabled) && (
                <p className="mt-1 text-[11px] text-accent-500">
                  {t.filtersOn(moment.filters.filter((f) => f.enabled).length)}
                </p>
              )}
              {moment.note && (
                <p className="mt-1 line-clamp-2 text-xs text-ink-400">{moment.note}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
