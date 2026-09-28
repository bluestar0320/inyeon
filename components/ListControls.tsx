"use client";

import { useId } from "react";

import { defineCopy, tr } from "@/lib/i18n";

const COPY = defineCopy({
  ko: {
    search: "검색",
    noMatch: "일치하는 항목 없음",
    shownOf: (total: number, shown: number) => `${total}개 중 ${shown}개`,
  },
  en: {
    search: "Search",
    noMatch: "No matches",
    shownOf: (total, shown) => `${shown} of ${total}`,
  },
  ja: {
    search: "検索",
    noMatch: "一致する項目なし",
    shownOf: (total, shown) => `${total}件中${shown}件`,
  },
  es: {
    search: "Buscar",
    noMatch: "Sin resultados",
    shownOf: (total, shown) => `${shown} de ${total}`,
  },
  zh: {
    search: "搜索",
    noMatch: "没有匹配项",
    shownOf: (total, shown) => `${total}项中的${shown}项`,
  },
});

export interface SortOption<T extends string> {
  key: T;
  label: string;
}

/**
 * 목록이 짧을 때는 아무것도 띄우지 않는다. 항목 두세 개짜리 화면에 검색창과
 * 정렬 칩을 얹으면 도구가 내용보다 커진다.
 */
export const SEARCH_THRESHOLD = 6;

export default function ListControls<T extends string>({
  total,
  shown,
  query,
  onQuery,
  sort,
  onSort,
  options,
  placeholder,
}: {
  total: number;
  shown: number;
  query: string;
  onQuery: (next: string) => void;
  sort: T;
  onSort: (next: T) => void;
  options: SortOption<T>[];
  placeholder: string;
}) {
  const ids = useId();
  const t = tr(COPY);
  if (total < 2) return null;

  return (
    <div className="space-y-2">
      {total >= SEARCH_THRESHOLD && (
        <div>
          <label className="sr-only" htmlFor={`${ids}-q`}>
            {t.search}
          </label>
          <input
            id={`${ids}-q`}
            className="input"
            type="search"
            value={query}
            placeholder={placeholder}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((option) => (
          <button
            key={option.key}
            type="button"
            className={`chip ${sort === option.key ? "chip-active" : ""}`}
            onClick={() => onSort(option.key)}
          >
            {option.label}
          </button>
        ))}
        {query.trim() !== "" && (
          <span className="ml-auto text-[11px] text-ink-400">
            {shown === 0 ? t.noMatch : t.shownOf(total, shown)}
          </span>
        )}
      </div>
    </div>
  );
}
